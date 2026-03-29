"""Spending prediction and cash flow forecast endpoints."""

from fastapi import APIRouter

from objectid_util import parse_user_object_id
from services.spending_prediction import predict_next_month, cash_flow_forecast

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


@router.get("/{user_id}/next-month")
async def get_next_month_prediction(user_id: str):
    uid = parse_user_object_id(user_id)
    return await predict_next_month(uid)


@router.get("/{user_id}/cash-flow")
async def get_cash_flow_forecast(user_id: str):
    uid = parse_user_object_id(user_id)
    return await cash_flow_forecast(uid)
