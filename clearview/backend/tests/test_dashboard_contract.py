"""Smoke-test that the dashboard response contract includes new fields.

These tests import the action_center module directly rather than spinning
up the full FastAPI app, so they run fast and don't need MongoDB.
"""

import pytest
from datetime import datetime

from services.action_center import (
    build_action_center,
    build_budget_pulse,
    build_bill_risk,
    build_daily_snapshot,
)


def _mock_dashboard_response():
    """Simulate the shape that GET /api/dashboard/{user_id} now returns."""
    now = datetime(2026, 3, 15)
    month_spent = 2100.0
    budget = 3500.0
    monthly_income = 5000.0
    checking_balance = 4200.0
    net_worth = 52000.0

    subs = [
        {"status": "active", "next_billing_date": datetime(2026, 3, 20), "amount": 15.99, "name": "Netflix"},
        {"status": "active", "next_billing_date": datetime(2026, 4, 1), "amount": 9.99, "name": "Spotify"},
    ]

    bill_risk = build_bill_risk(subs, checking_balance, now)
    daily_snapshot = build_daily_snapshot(
        net_worth=net_worth,
        net_worth_30d_ago=net_worth - 500,
        month_spent=month_spent,
        monthly_budget=budget,
        month_income=monthly_income,
        month_income_30d_ago=0,
        user_name="Alex Demo",
    )
    action_center = build_action_center(
        month_spent=month_spent,
        monthly_budget=budget,
        checking_balance=checking_balance,
        due_30d=bill_risk["due_30d_total"],
        at_risk_bills=bill_risk["at_risk_bills"],
        subscriptions=subs,
        monthly_income=monthly_income,
        savings_goal_monthly=800,
        pending_alerts=[],
    )
    budget_pulse = build_budget_pulse(month_spent, budget, now)

    return {
        "daily_snapshot": daily_snapshot,
        "action_center": action_center,
        "budget_pulse": budget_pulse,
        "bill_risk": bill_risk,
        "net_worth": net_worth,
        "monthly_summary": {"spent": month_spent, "income": monthly_income, "budget": budget, "remaining": budget - month_spent, "by_category": {}},
    }


class TestDashboardContract:
    def test_response_has_daily_snapshot(self):
        resp = _mock_dashboard_response()
        ds = resp["daily_snapshot"]
        assert ds["status"] in ("on_track", "watch", "at_risk")
        assert isinstance(ds["message"], str)
        assert isinstance(ds["net_worth_delta_30d"], (int, float))

    def test_response_has_action_center(self):
        resp = _mock_dashboard_response()
        ac = resp["action_center"]
        assert isinstance(ac, list)
        assert len(ac) <= 5

    def test_response_has_budget_pulse(self):
        resp = _mock_dashboard_response()
        bp = resp["budget_pulse"]
        assert bp["status"] in ("safe", "warning", "critical")
        assert "spent_to_date" in bp
        assert "projected_month_spend" in bp

    def test_response_has_bill_risk(self):
        resp = _mock_dashboard_response()
        br = resp["bill_risk"]
        assert br["risk_level"] in ("safe", "watch", "critical")
        assert "due_7d_total" in br
        assert "due_14d_total" in br
        assert "due_30d_total" in br
        assert "checking_buffer_after_30d" in br
        assert isinstance(br["at_risk_bills"], list)

    def test_all_new_fields_present(self):
        resp = _mock_dashboard_response()
        for key in ("daily_snapshot", "action_center", "budget_pulse", "bill_risk"):
            assert key in resp, f"Missing {key} in response"
