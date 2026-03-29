"""Deterministic action-center scoring.

Each scorer returns a list of action dicts.  The top-level function
merges, deduplicates, sorts by score desc, and caps at 5.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any


def _severity(score: float) -> str:
    if score >= 80:
        return "high"
    if score >= 50:
        return "medium"
    return "low"


def _budget_overrun_actions(
    month_spent: float, monthly_budget: float
) -> list[dict[str, Any]]:
    if monthly_budget <= 0:
        return []
    ratio = (month_spent - monthly_budget) / monthly_budget
    score = min(100, max(0, ratio * 100 + 50))
    if score < 30:
        return []
    pct = round(month_spent / monthly_budget * 100)
    return [
        {
            "type": "budget_overrun",
            "title": "Budget pace alert",
            "description": f"You've spent {pct}% of your monthly budget.",
            "severity": _severity(score),
            "score": round(score),
            "cta_label": "Review spending",
            "cta_route": "/dashboard/transactions",
            "metadata": {
                "spent": round(month_spent, 2),
                "budget": round(monthly_budget, 2),
            },
        }
    ]


def _bill_risk_actions(
    checking_balance: float,
    due_30d: float,
    at_risk_bills: list[dict],
) -> list[dict[str, Any]]:
    buffer = checking_balance - due_30d
    if buffer < 0:
        score = 90
    elif buffer < 300:
        score = 65
    else:
        score = 20
    if score < 30:
        return []
    return [
        {
            "type": "bill_risk",
            "title": "Upcoming bill pressure",
            "description": (
                f"${due_30d:,.0f} in bills due within 30 days vs "
                f"${checking_balance:,.0f} in checking."
            ),
            "severity": _severity(score),
            "score": score,
            "cta_label": "View bills",
            "cta_route": "/dashboard/bills",
            "metadata": {
                "due_30d": round(due_30d, 2),
                "checking_balance": round(checking_balance, 2),
                "at_risk_bills": at_risk_bills,
            },
        }
    ]


def _subscription_creep_actions(
    subscriptions: list[dict],
) -> list[dict[str, Any]]:
    low_usage = [
        s
        for s in subscriptions
        if s.get("status") == "active"
        and s.get("usage_score", 100) < 45
        and s.get("amount", 0) > 10
    ]
    if not low_usage:
        return []
    total = sum(s.get("amount", 0) for s in low_usage)
    score = min(100, 40 + len(low_usage) * 12)
    return [
        {
            "type": "subscription_creep",
            "title": f"{len(low_usage)} under-used subscription{'s' if len(low_usage) > 1 else ''}",
            "description": (
                f"You could save ~${total:,.0f}/mo by cancelling low-usage services."
            ),
            "severity": _severity(score),
            "score": round(score),
            "cta_label": "Audit subscriptions",
            "cta_route": "/dashboard/bills",
            "metadata": {
                "low_usage_names": [s.get("name") for s in low_usage],
                "potential_savings": round(total, 2),
            },
        }
    ]


def _goal_slip_actions(
    monthly_income: float,
    month_spent: float,
    savings_goal_monthly: float,
) -> list[dict[str, Any]]:
    if savings_goal_monthly <= 0:
        return []
    projected_savings = monthly_income - month_spent
    if projected_savings >= savings_goal_monthly:
        return []
    gap = savings_goal_monthly - projected_savings
    score = min(100, max(0, (gap / savings_goal_monthly) * 80 + 30))
    return [
        {
            "type": "goal_slip",
            "title": "Savings goal at risk",
            "description": (
                f"At current pace you'll save ${projected_savings:,.0f} vs "
                f"your ${savings_goal_monthly:,.0f}/mo goal."
            ),
            "severity": _severity(score),
            "score": round(score),
            "cta_label": "Review goals",
            "cta_route": "/dashboard/goals",
            "metadata": {
                "projected_savings": round(projected_savings, 2),
                "savings_goal": round(savings_goal_monthly, 2),
            },
        }
    ]


def _fraud_alert_actions(pending_alerts: list[dict]) -> list[dict[str, Any]]:
    if not pending_alerts:
        return []
    score = min(100, 70 + len(pending_alerts) * 10)
    return [
        {
            "type": "fraud_alert",
            "title": f"{len(pending_alerts)} pending fraud alert{'s' if len(pending_alerts) > 1 else ''}",
            "description": "Review suspicious transactions flagged by our AI.",
            "severity": _severity(score),
            "score": score,
            "cta_label": "Review alerts",
            "cta_route": "/dashboard",
            "metadata": {"alert_count": len(pending_alerts)},
        }
    ]


def build_action_center(
    *,
    month_spent: float,
    monthly_budget: float,
    checking_balance: float,
    due_30d: float,
    at_risk_bills: list[dict],
    subscriptions: list[dict],
    monthly_income: float,
    savings_goal_monthly: float,
    pending_alerts: list[dict],
) -> list[dict[str, Any]]:
    """Return up to 5 prioritised action items."""
    actions: list[dict[str, Any]] = []
    actions.extend(_budget_overrun_actions(month_spent, monthly_budget))
    actions.extend(
        _bill_risk_actions(checking_balance, due_30d, at_risk_bills)
    )
    actions.extend(_subscription_creep_actions(subscriptions))
    actions.extend(
        _goal_slip_actions(monthly_income, month_spent, savings_goal_monthly)
    )
    actions.extend(_fraud_alert_actions(pending_alerts))

    actions.sort(key=lambda a: a["score"], reverse=True)
    for i, action in enumerate(actions):
        action["id"] = f"action-{i}"
    return actions[:5]


def build_budget_pulse(
    month_spent: float, monthly_budget: float, now: datetime
) -> dict[str, Any]:
    days_in_month = (
        (now.replace(month=now.month % 12 + 1, day=1) - timedelta(days=1)).day
        if now.month < 12
        else 31
    )
    days_elapsed = now.day
    burn_rate = month_spent / max(days_elapsed, 1)
    projected = burn_rate * days_in_month
    forecast_remaining = monthly_budget - projected

    if forecast_remaining >= 0:
        status = "safe"
    elif forecast_remaining >= -monthly_budget * 0.1:
        status = "warning"
    else:
        status = "critical"

    return {
        "spent_to_date": round(month_spent, 2),
        "days_elapsed": days_elapsed,
        "days_in_month": days_in_month,
        "burn_rate_daily": round(burn_rate, 2),
        "projected_month_spend": round(projected, 2),
        "forecast_remaining": round(forecast_remaining, 2),
        "status": status,
    }


def build_bill_risk(
    subscriptions: list[dict],
    checking_balance: float,
    now: datetime,
) -> dict[str, Any]:
    due_7d = 0.0
    due_14d = 0.0
    due_30d = 0.0
    at_risk: list[dict] = []

    for sub in subscriptions:
        if sub.get("status") != "active":
            continue
        nbd = sub.get("next_billing_date")
        if not nbd:
            continue
        if isinstance(nbd, str):
            try:
                nbd = datetime.fromisoformat(nbd)
            except (ValueError, TypeError):
                continue
        days_until = (nbd - now).days
        amt = sub.get("amount", 0)
        if 0 <= days_until <= 30:
            due_30d += amt
        if 0 <= days_until <= 14:
            due_14d += amt
        if 0 <= days_until <= 7:
            due_7d += amt
            at_risk.append(
                {
                    "name": sub.get("name", "Unknown"),
                    "amount": amt,
                    "date": nbd.isoformat() if hasattr(nbd, "isoformat") else str(nbd),
                }
            )

    buffer = checking_balance - due_30d
    if buffer < 0:
        risk_level = "critical"
    elif buffer < 300:
        risk_level = "watch"
    else:
        risk_level = "safe"

    return {
        "due_7d_total": round(due_7d, 2),
        "due_14d_total": round(due_14d, 2),
        "due_30d_total": round(due_30d, 2),
        "checking_buffer_after_30d": round(buffer, 2),
        "risk_level": risk_level,
        "at_risk_bills": at_risk,
    }


def build_daily_snapshot(
    *,
    net_worth: float,
    net_worth_30d_ago: float,
    month_spent: float,
    monthly_budget: float,
    month_income: float,
    month_income_30d_ago: float,
    user_name: str,
) -> dict[str, Any]:
    nw_delta = net_worth - net_worth_30d_ago
    cashflow_delta = (month_income - month_spent) - (
        month_income_30d_ago - 0
    )

    budget_pct = month_spent / monthly_budget if monthly_budget > 0 else 0
    if budget_pct > 0.9:
        status = "at_risk"
    elif budget_pct > 0.7:
        status = "watch"
    else:
        status = "on_track"

    messages = {
        "on_track": f"Looking good, {user_name.split(' ')[0]}! You're on pace this month.",
        "watch": f"Heads up, {user_name.split(' ')[0]} — spending is climbing. Keep an eye on it.",
        "at_risk": f"Careful, {user_name.split(' ')[0]} — you've used most of your budget already.",
    }

    return {
        "status": status,
        "message": messages[status],
        "net_worth_delta_30d": round(nw_delta, 2),
        "cashflow_delta_30d": round(cashflow_delta, 2),
    }
