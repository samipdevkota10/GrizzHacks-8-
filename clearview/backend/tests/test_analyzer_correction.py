"""Tests for the purchase-analysis correction (PATCH) endpoint logic.

We test the _serialize helper and basic validation logic without
spinning up MongoDB, keeping tests fast and isolated.
"""

import pytest
from datetime import datetime
from bson import ObjectId


def test_serialize_handles_objectid():
    """The advisor _serialize helper converts ObjectId to string."""
    from routers.advisor import _serialize

    doc = {
        "_id": ObjectId("507f1f77bcf86cd799439011"),
        "user_id": ObjectId("507f1f77bcf86cd799439012"),
        "product": "Test",
        "price": 29.99,
        "created_at": datetime(2026, 3, 15, 12, 0, 0),
        "corrected_by_user": False,
        "original_extraction": None,
        "confidence": 85,
    }
    result = _serialize(doc)
    assert result["_id"] == "507f1f77bcf86cd799439011"
    assert result["user_id"] == "507f1f77bcf86cd799439012"
    assert result["created_at"] == "2026-03-15T12:00:00"
    assert result["confidence"] == 85
    assert result["corrected_by_user"] is False


def test_serialize_nested_dicts():
    from routers.advisor import _serialize

    doc = {
        "_id": ObjectId(),
        "financial_snapshot": {
            "net_hourly_rate": 23.5,
            "nested_id": ObjectId("507f1f77bcf86cd799439013"),
        },
    }
    result = _serialize(doc)
    assert result["financial_snapshot"]["nested_id"] == "507f1f77bcf86cd799439013"


def test_serialize_handles_none():
    from routers.advisor import _serialize

    assert _serialize(None) == {}
