from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException


def parse_user_object_id(user_id: str) -> ObjectId:
    try:
        return ObjectId(user_id)
    except InvalidId as e:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid user id: must be a 24-character hex MongoDB ObjectId. "
                "Run `python seed_data.py`, copy USER ID, then in the browser console run "
                '`localStorage.setItem("verafund_user_id", "<USER_ID>")` and refresh — '
                "or set NEXT_PUBLIC_VERAFUND_USER_ID in frontend .env.local."
            ),
        ) from e
