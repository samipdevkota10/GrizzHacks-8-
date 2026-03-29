from datetime import datetime, timedelta

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from config import settings

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> str:
    """Return the user_id from a valid JWT, or raise 401."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    """FastAPI dependency that extracts and validates a Bearer JWT.

    Returns the user_id string. Raises 401 if missing or invalid.
    """
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    return decode_token(creds.credentials)
