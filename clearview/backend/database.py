from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from config import settings

_client: AsyncIOMotorClient | None = None


def get_database() -> AsyncIOMotorDatabase:
    global _client
    if _client is None:
        # Atlas-friendly timeouts; does not fix firewall / IP allowlist issues
        _client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=20000,
        )
    return _client[settings.MONGODB_DB_NAME]
