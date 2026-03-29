"""Blockchain integration stub — prevents silent import error in main.py."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/blockchain", tags=["blockchain"])


@router.get("/status")
async def blockchain_status():
    return {
        "status": "not_configured",
        "message": "Solana blockchain integration is not active. Configure SOLANA_* env vars to enable.",
    }
