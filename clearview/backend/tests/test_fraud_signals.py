"""Tests for multi-signal fraud detection engine.

Each signal function is tested independently with controlled inputs.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch, MagicMock
from bson import ObjectId

from services.fraud_detection import (
    _signal,
    _signal_amount_zscore,
    _signal_merchant_familiarity,
    _signal_category_deviation,
    _signal_velocity,
    _signal_time_of_day,
    _signal_round_amount,
    _signal_balance_strain,
    _signal_recurring_disruption,
    _compute_signals,
    _build_reason,
    evaluate_transaction,
    HIGH_THRESHOLD,
    MEDIUM_THRESHOLD,
    SIGNAL_WEIGHTS,
)


UID = ObjectId("69c8872cbab93b1d2a3387c0")
NOW = datetime(2026, 3, 29, 14, 0, 0)


def _mock_db():
    """Create a mock database with configurable async methods."""
    db = MagicMock()
    for coll in ("transactions", "financial_profiles", "accounts", "subscriptions", "users"):
        mock_coll = MagicMock()
        mock_coll.find_one = AsyncMock(return_value=None)
        mock_coll.count_documents = AsyncMock(return_value=0)
        mock_coll.aggregate = MagicMock()
        mock_coll.aggregate.return_value.to_list = AsyncMock(return_value=[])

        cursor = MagicMock()
        cursor.to_list = AsyncMock(return_value=[])
        mock_coll.find = MagicMock(return_value=cursor)

        setattr(db, coll, mock_coll)
    return db


class TestSignalHelper:
    def test_signal_clamps_to_0_100(self):
        s = _signal("amount_zscore", -20, "test")
        assert s["score"] == 0
        s2 = _signal("amount_zscore", 150, "test")
        assert s2["score"] == 100

    def test_signal_has_correct_weight(self):
        s = _signal("velocity", 50, "test")
        assert s["weight"] == SIGNAL_WEIGHTS["velocity"]


class TestAmountZScore:
    @pytest.mark.asyncio
    async def test_limited_history_large_amount(self):
        db = _mock_db()
        db.transactions.find.return_value.to_list = AsyncMock(return_value=[])
        result = await _signal_amount_zscore(UID, 200.0, db, NOW)
        assert result["score"] == 70

    @pytest.mark.asyncio
    async def test_limited_history_small_amount(self):
        db = _mock_db()
        db.transactions.find.return_value.to_list = AsyncMock(return_value=[])
        result = await _signal_amount_zscore(UID, 10.0, db, NOW)
        assert result["score"] == 30

    @pytest.mark.asyncio
    async def test_normal_amount_low_score(self):
        db = _mock_db()
        txns = [{"amount": -(30 + i)} for i in range(20)]
        db.transactions.find.return_value.to_list = AsyncMock(return_value=txns)
        result = await _signal_amount_zscore(UID, 35.0, db, NOW)
        assert result["score"] < 30

    @pytest.mark.asyncio
    async def test_outlier_amount_high_score(self):
        db = _mock_db()
        txns = [{"amount": -(10 + i % 5)} for i in range(30)]
        db.transactions.find.return_value.to_list = AsyncMock(return_value=txns)
        result = await _signal_amount_zscore(UID, 500.0, db, NOW)
        assert result["score"] > 70


class TestMerchantFamiliarity:
    @pytest.mark.asyncio
    async def test_established_merchant(self):
        db = _mock_db()
        db.transactions.count_documents = AsyncMock(return_value=15)
        result = await _signal_merchant_familiarity(UID, "Walmart", "shopping", db)
        assert result["score"] == 0

    @pytest.mark.asyncio
    async def test_first_time_merchant_unfamiliar_category(self):
        db = _mock_db()
        db.transactions.count_documents = AsyncMock(side_effect=[0, 0])
        result = await _signal_merchant_familiarity(UID, "ShadyStore.xyz", "jewelry", db)
        assert result["score"] == 100

    @pytest.mark.asyncio
    async def test_first_time_merchant_familiar_category(self):
        db = _mock_db()
        db.transactions.count_documents = AsyncMock(side_effect=[0, 10])
        result = await _signal_merchant_familiarity(UID, "NewShop", "shopping", db)
        assert result["score"] == 75


class TestCategoryDeviation:
    @pytest.mark.asyncio
    async def test_no_budget_set(self):
        db = _mock_db()
        db.financial_profiles.find_one = AsyncMock(return_value={"category_budgets": {}})
        result = await _signal_category_deviation(UID, 50.0, "shopping", db)
        assert result["score"] == 20

    @pytest.mark.asyncio
    async def test_within_budget(self):
        db = _mock_db()
        db.financial_profiles.find_one = AsyncMock(
            return_value={"category_budgets": {"food": 300}}
        )
        db.transactions.aggregate.return_value.to_list = AsyncMock(
            return_value=[{"_id": None, "total": 100}]
        )
        result = await _signal_category_deviation(UID, 30.0, "food", db)
        assert result["score"] < 20

    @pytest.mark.asyncio
    async def test_way_over_budget(self):
        db = _mock_db()
        db.financial_profiles.find_one = AsyncMock(
            return_value={"category_budgets": {"shopping": 200}}
        )
        db.transactions.aggregate.return_value.to_list = AsyncMock(
            return_value=[{"_id": None, "total": 500}]
        )
        result = await _signal_category_deviation(UID, 200.0, "shopping", db)
        assert result["score"] >= 65


class TestVelocity:
    @pytest.mark.asyncio
    async def test_no_recent_charges(self):
        db = _mock_db()
        db.transactions.count_documents = AsyncMock(return_value=0)
        result = await _signal_velocity(UID, db, NOW)
        assert result["score"] == 0

    @pytest.mark.asyncio
    async def test_rapid_fire_five_charges(self):
        db = _mock_db()
        db.transactions.count_documents = AsyncMock(return_value=5)
        result = await _signal_velocity(UID, db, NOW)
        assert result["score"] == 100

    @pytest.mark.asyncio
    async def test_three_charges_high_risk(self):
        db = _mock_db()
        db.transactions.count_documents = AsyncMock(return_value=3)
        result = await _signal_velocity(UID, db, NOW)
        assert result["score"] == 85


class TestTimeOfDay:
    @pytest.mark.asyncio
    async def test_normal_hour_with_history(self):
        db = _mock_db()
        txns = [{"date": datetime(2026, 3, d, 14, 0)} for d in range(1, 21)]
        db.transactions.find.return_value.to_list = AsyncMock(return_value=txns)
        afternoon = NOW.replace(hour=14)
        result = await _signal_time_of_day(UID, db, afternoon)
        assert result["score"] == 0

    @pytest.mark.asyncio
    async def test_3am_with_no_3am_history(self):
        db = _mock_db()
        txns = [{"date": datetime(2026, 3, d, 12, 0)} for d in range(1, 21)]
        db.transactions.find.return_value.to_list = AsyncMock(return_value=txns)
        late_night = NOW.replace(hour=3)
        result = await _signal_time_of_day(UID, db, late_night)
        assert result["score"] >= 55

    @pytest.mark.asyncio
    async def test_limited_history_3am(self):
        db = _mock_db()
        db.transactions.find.return_value.to_list = AsyncMock(return_value=[])
        late = NOW.replace(hour=3)
        result = await _signal_time_of_day(UID, db, late)
        assert result["score"] == 60


class TestRoundAmount:
    def test_round_amount_new_merchant(self):
        result = _signal_round_amount(500.0, False)
        assert result["score"] == 70

    def test_round_amount_known_merchant(self):
        result = _signal_round_amount(100.0, True)
        assert result["score"] == 25

    def test_non_round_amount(self):
        result = _signal_round_amount(47.23, False)
        assert result["score"] == 0

    def test_small_round_amount_ignored(self):
        result = _signal_round_amount(10.0, False)
        assert result["score"] == 0


class TestBalanceStrain:
    @pytest.mark.asyncio
    async def test_would_overdraft(self):
        db = _mock_db()
        db.accounts.find_one = AsyncMock(
            return_value={"balance": 100, "is_primary_checking": True}
        )
        result = await _signal_balance_strain(UID, 200.0, db)
        assert result["score"] == 90

    @pytest.mark.asyncio
    async def test_sufficient_balance(self):
        db = _mock_db()
        db.accounts.find_one = AsyncMock(
            return_value={"balance": 5000, "is_primary_checking": True}
        )
        result = await _signal_balance_strain(UID, 50.0, db)
        assert result["score"] == 0

    @pytest.mark.asyncio
    async def test_low_remaining_balance(self):
        db = _mock_db()
        db.accounts.find_one = AsyncMock(
            return_value={"balance": 150, "is_primary_checking": True}
        )
        result = await _signal_balance_strain(UID, 100.0, db)
        assert result["score"] == 60


class TestRecurringDisruption:
    @pytest.mark.asyncio
    async def test_not_a_subscription_merchant(self):
        db = _mock_db()
        db.subscriptions.find.return_value.to_list = AsyncMock(return_value=[])
        result = await _signal_recurring_disruption(UID, "Random Store", 50.0, db)
        assert result["score"] == 0

    @pytest.mark.asyncio
    async def test_matching_subscription_normal_amount(self):
        db = _mock_db()
        db.subscriptions.find.return_value.to_list = AsyncMock(
            return_value=[{"name": "Netflix", "status": "active", "amount": 15.99}]
        )
        result = await _signal_recurring_disruption(UID, "Netflix", 15.99, db)
        assert result["score"] == 0

    @pytest.mark.asyncio
    async def test_subscription_amount_deviation(self):
        db = _mock_db()
        db.subscriptions.find.return_value.to_list = AsyncMock(
            return_value=[{"name": "Netflix", "status": "active", "amount": 15.99, "last_known_amount": 15.99}]
        )
        result = await _signal_recurring_disruption(UID, "Netflix", 45.00, db)
        assert result["score"] == 65


class TestBuildReason:
    def test_builds_from_top_signals(self):
        signals = [
            _signal("amount_zscore", 80, "Large amount"),
            _signal("merchant_familiarity", 90, "Unknown merchant"),
            _signal("velocity", 0, "Normal"),
            _signal("category_deviation", 10, "OK"),
            _signal("time_of_day", 60, "Late night"),
            _signal("round_amount", 0, "Non-round"),
            _signal("balance_strain", 0, "OK"),
            _signal("recurring_disruption", 0, "OK"),
        ]
        reason = _build_reason(signals, 72.5)
        assert "72" in reason
        assert "Unknown merchant" in reason


class TestComputeSignals:
    @pytest.mark.asyncio
    async def test_returns_8_signals(self):
        db = _mock_db()
        signals = await _compute_signals(UID, 100.0, "TestMerchant", "shopping", db, NOW)
        assert len(signals) == 8
        names = {s["name"] for s in signals}
        assert names == set(SIGNAL_WEIGHTS.keys())


class TestEvaluateTransaction:
    @pytest.mark.asyncio
    async def test_returns_none_for_low_risk(self):
        with patch("services.fraud_detection.get_database") as mock_gdb:
            db = _mock_db()
            mock_gdb.return_value = db
            db.transactions.find.return_value.to_list = AsyncMock(
                return_value=[{"amount": -(30 + i), "date": NOW} for i in range(30)]
            )
            db.transactions.count_documents = AsyncMock(return_value=15)
            db.financial_profiles.find_one = AsyncMock(
                return_value={"category_budgets": {"food": 500}}
            )
            db.accounts.find_one = AsyncMock(return_value={"balance": 5000})
            db.subscriptions.find.return_value.to_list = AsyncMock(return_value=[])
            db.transactions.aggregate.return_value.to_list = AsyncMock(
                return_value=[{"_id": None, "total": 100}]
            )

            result = await evaluate_transaction(
                str(UID), -35.0, "Walmart", "food"
            )
            assert result is None

    @pytest.mark.asyncio
    async def test_high_risk_returns_severity_high(self):
        """Unknown merchant + huge z-score + 3am + velocity + overdraft = high."""
        with patch("services.fraud_detection.get_database") as mock_gdb:
            db = _mock_db()
            mock_gdb.return_value = db
            small_txns = [{"amount": -10, "date": NOW.replace(hour=14)} for _ in range(15)]
            db.transactions.find.return_value.to_list = AsyncMock(return_value=small_txns)
            db.transactions.count_documents = AsyncMock(side_effect=[0, 0, 4])
            db.financial_profiles.find_one = AsyncMock(return_value=None)
            db.accounts.find_one = AsyncMock(return_value={"balance": 50})
            db.subscriptions.find.return_value.to_list = AsyncMock(return_value=[])
            db.transactions.aggregate.return_value.to_list = AsyncMock(return_value=[])

            at_3am = NOW.replace(hour=3)
            result = await evaluate_transaction(
                str(UID), -890.0, "ShadyElectronics.xyz", "shopping",
                override_now=at_3am,
            )
            assert result is not None
            assert result["severity"] == "high"
            assert result["risk_score"] >= HIGH_THRESHOLD
            assert "signals" in result


class TestThresholdConstants:
    def test_high_above_medium(self):
        assert HIGH_THRESHOLD > MEDIUM_THRESHOLD

    def test_weights_sum_to_one(self):
        total = sum(SIGNAL_WEIGHTS.values())
        assert abs(total - 1.0) < 0.001
