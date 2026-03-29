"""Tests for deterministic action-center scoring."""

import pytest
from datetime import datetime

from services.action_center import (
    build_action_center,
    build_budget_pulse,
    build_bill_risk,
    build_daily_snapshot,
)


class TestBuildActionCenter:
    def test_returns_list(self):
        result = build_action_center(
            month_spent=0,
            monthly_budget=3500,
            checking_balance=5000,
            due_30d=0,
            at_risk_bills=[],
            subscriptions=[],
            monthly_income=5000,
            savings_goal_monthly=500,
            pending_alerts=[],
        )
        assert isinstance(result, list)

    def test_max_five_items(self):
        result = build_action_center(
            month_spent=4000,
            monthly_budget=3500,
            checking_balance=100,
            due_30d=500,
            at_risk_bills=[{"name": "Netflix", "amount": 15, "date": "2026-04-01"}],
            subscriptions=[
                {"status": "active", "usage_score": 10, "amount": 20, "name": f"Sub {i}"}
                for i in range(10)
            ],
            monthly_income=5000,
            savings_goal_monthly=2000,
            pending_alerts=[{"id": "a1"}, {"id": "a2"}],
        )
        assert len(result) <= 5

    def test_sorted_by_score_descending(self):
        result = build_action_center(
            month_spent=4000,
            monthly_budget=3500,
            checking_balance=100,
            due_30d=500,
            at_risk_bills=[],
            subscriptions=[],
            monthly_income=5000,
            savings_goal_monthly=2000,
            pending_alerts=[{"id": "a1"}],
        )
        scores = [a["score"] for a in result]
        assert scores == sorted(scores, reverse=True)

    def test_each_item_has_required_fields(self):
        result = build_action_center(
            month_spent=4000,
            monthly_budget=3500,
            checking_balance=200,
            due_30d=300,
            at_risk_bills=[],
            subscriptions=[],
            monthly_income=5000,
            savings_goal_monthly=1000,
            pending_alerts=[],
        )
        required_keys = {"id", "type", "title", "description", "severity", "score", "cta_label", "cta_route", "metadata"}
        for action in result:
            assert required_keys.issubset(action.keys()), f"Missing keys in {action}"

    def test_budget_overrun_triggers(self):
        result = build_action_center(
            month_spent=5000,
            monthly_budget=3500,
            checking_balance=10000,
            due_30d=0,
            at_risk_bills=[],
            subscriptions=[],
            monthly_income=6000,
            savings_goal_monthly=0,
            pending_alerts=[],
        )
        types = [a["type"] for a in result]
        assert "budget_overrun" in types

    def test_no_actions_when_healthy(self):
        result = build_action_center(
            month_spent=1000,
            monthly_budget=5000,
            checking_balance=20000,
            due_30d=200,
            at_risk_bills=[],
            subscriptions=[],
            monthly_income=8000,
            savings_goal_monthly=500,
            pending_alerts=[],
        )
        assert len(result) == 0

    def test_severity_mapping(self):
        result = build_action_center(
            month_spent=4000,
            monthly_budget=3500,
            checking_balance=100,
            due_30d=500,
            at_risk_bills=[],
            subscriptions=[],
            monthly_income=5000,
            savings_goal_monthly=2000,
            pending_alerts=[{"id": "a1"}, {"id": "a2"}, {"id": "a3"}],
        )
        for action in result:
            assert action["severity"] in ("high", "medium", "low")
            if action["score"] >= 80:
                assert action["severity"] == "high"
            elif action["score"] >= 50:
                assert action["severity"] == "medium"
            else:
                assert action["severity"] == "low"


class TestBudgetPulse:
    def test_safe_status(self):
        now = datetime(2026, 3, 10)
        pulse = build_budget_pulse(month_spent=500, monthly_budget=3500, now=now)
        assert pulse["status"] == "safe"
        assert pulse["days_elapsed"] == 10
        assert pulse["spent_to_date"] == 500

    def test_critical_status_when_overspending(self):
        now = datetime(2026, 3, 5)
        pulse = build_budget_pulse(month_spent=3000, monthly_budget=3000, now=now)
        assert pulse["status"] == "critical"

    def test_required_keys(self):
        now = datetime(2026, 3, 15)
        pulse = build_budget_pulse(month_spent=1500, monthly_budget=3500, now=now)
        required = {"spent_to_date", "days_elapsed", "days_in_month", "burn_rate_daily", "projected_month_spend", "forecast_remaining", "status"}
        assert required.issubset(pulse.keys())


class TestBillRisk:
    def test_safe_risk(self):
        now = datetime(2026, 3, 15)
        risk = build_bill_risk([], checking_balance=5000, now=now)
        assert risk["risk_level"] == "safe"
        assert risk["due_30d_total"] == 0

    def test_critical_risk(self):
        now = datetime(2026, 3, 1)
        subs = [
            {"status": "active", "next_billing_date": datetime(2026, 3, 10), "amount": 6000, "name": "Rent"},
        ]
        risk = build_bill_risk(subs, checking_balance=500, now=now)
        assert risk["risk_level"] == "critical"
        assert risk["due_30d_total"] == 6000


class TestDailySnapshot:
    def test_on_track(self):
        snap = build_daily_snapshot(
            net_worth=50000,
            net_worth_30d_ago=48000,
            month_spent=1000,
            monthly_budget=4000,
            month_income=5000,
            month_income_30d_ago=0,
            user_name="Alex Test",
        )
        assert snap["status"] == "on_track"
        assert "Alex" in snap["message"]

    def test_at_risk_when_overspending(self):
        snap = build_daily_snapshot(
            net_worth=50000,
            net_worth_30d_ago=50000,
            month_spent=3800,
            monthly_budget=4000,
            month_income=5000,
            month_income_30d_ago=0,
            user_name="Alex",
        )
        assert snap["status"] == "at_risk"
