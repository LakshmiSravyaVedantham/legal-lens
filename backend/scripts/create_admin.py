"""CLI script to create the first admin user.

Usage: python -m backend.scripts.create_admin
"""

import asyncio
import logging
import sys
from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

from backend.core.database import _ensure_indexes
from backend.core.security import hash_password
from backend.core.settings import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.mongo_db_name]
    await _ensure_indexes(db)

    print("\n=== LegalLens Admin User Setup ===\n")

    email = input("Email: ").strip()
    if not email:
        print("Email is required")
        sys.exit(1)

    existing = await db.users.find_one({"email": email})
    if existing:
        print(f"User '{email}' already exists")
        sys.exit(1)

    full_name = input("Full Name: ").strip() or "Admin"
    password = input("Password (min 8 chars): ").strip()
    if len(password) < 8:
        print("Password must be at least 8 characters")
        sys.exit(1)

    org_name = input("Organization Name [Default Org]: ").strip() or "Default Org"

    # Create org
    org_id = str(ObjectId())
    user_id = str(ObjectId())

    await db.organizations.insert_one({
        "_id": ObjectId(org_id),
        "name": org_name,
        "slug": org_name.lower().replace(" ", "-"),
        "owner_id": user_id,
        "plan": "free",
        "created_at": datetime.now(timezone.utc),
    })

    await db.users.insert_one({
        "_id": ObjectId(user_id),
        "email": email,
        "full_name": full_name,
        "password_hash": hash_password(password),
        "role": "admin",
        "organization_id": org_id,
        "created_at": datetime.now(timezone.utc),
        "is_active": True,
    })

    print("\nAdmin user created successfully!")
    print(f"  Email: {email}")
    print(f"  Organization: {org_name}")
    print("  Role: admin\n")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
