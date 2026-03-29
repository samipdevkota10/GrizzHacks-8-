import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

ATLAS_URI = "mongodb+srv://samipdevkota_db_user:h3soYEAKLmsiK2pV@clearview.ufdpcxc.mongodb.net/?appName=Clearview"
DB_NAME = "clearview_db"

async def check():
    client = AsyncIOMotorClient(ATLAS_URI)
    db = client[DB_NAME]

    collections = await db.list_collection_names()
    print(f"Collections: {collections}")

    count = await db.users.count_documents({})
    print(f"Users count: {count}")

    async for u in db.users.find({}, {"_id": 1, "email": 1, "name": 1, "phone_number": 1, "onboarding_complete": 1}):
        print(f"  User: id={u['_id']}, email={u.get('email')}, name={u.get('name')}, phone={u.get('phone_number')}, onboarded={u.get('onboarding_complete')}")

    client.close()

asyncio.run(check())
