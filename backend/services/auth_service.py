"""User and authentication operations against MongoDB."""

import logging
import re
from datetime import datetime, timezone

from bson import ObjectId

from backend.core.database import get_db
from backend.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from backend.models.user import Role, Token, UserCreate, UserInDB

logger = logging.getLogger(__name__)


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "org"


async def register_user(data: UserCreate) -> tuple[UserInDB, Token, dict]:
    """Register a new user, create their organization, return user + tokens + org."""
    db = get_db()

    # Check if email already exists
    if await db.users.find_one({"email": data.email}):
        raise ValueError("Email already registered")

    # Create organization
    org_name = data.organization_name or f"{data.full_name}'s Org"
    slug = _slugify(org_name)

    # Ensure unique slug
    base_slug = slug
    counter = 1
    while await db.organizations.find_one({"slug": slug}):
        slug = f"{base_slug}-{counter}"
        counter += 1

    org_id = str(ObjectId())
    org_doc = {
        "_id": ObjectId(org_id),
        "name": org_name,
        "slug": slug,
        "owner_id": "",  # Will update after user creation
        "plan": "free",
        "created_at": datetime.now(timezone.utc),
    }

    # Create user
    user_id = str(ObjectId())
    user_doc = {
        "_id": ObjectId(user_id),
        "email": data.email,
        "full_name": data.full_name,
        "password_hash": hash_password(data.password),
        "role": Role.ADMIN.value,
        "organization_id": org_id,
        "created_at": datetime.now(timezone.utc),
        "is_active": True,
    }

    # Update org owner
    org_doc["owner_id"] = user_id

    await db.organizations.insert_one(org_doc)
    await db.users.insert_one(user_doc)

    user = UserInDB(
        id=user_id,
        email=data.email,
        full_name=data.full_name,
        password_hash=user_doc["password_hash"],
        role=Role.ADMIN,
        organization_id=org_id,
        created_at=user_doc["created_at"],
    )

    token_data = {"sub": user_id, "org": org_id, "role": Role.ADMIN.value}
    tokens = Token(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )

    return user, tokens, org_doc


async def login_user(email: str, password: str) -> tuple[UserInDB, Token]:
    """Authenticate user and return tokens."""
    db = get_db()
    doc = await db.users.find_one({"email": email})
    if not doc or not verify_password(password, doc["password_hash"]):
        raise ValueError("Invalid email or password")

    if not doc.get("is_active", True):
        raise ValueError("Account is disabled")

    user_id = str(doc["_id"])
    user = UserInDB(
        id=user_id,
        email=doc["email"],
        full_name=doc["full_name"],
        password_hash=doc["password_hash"],
        role=Role(doc["role"]),
        organization_id=doc["organization_id"],
        created_at=doc["created_at"],
    )

    token_data = {"sub": user_id, "org": doc["organization_id"], "role": doc["role"]}
    tokens = Token(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )

    return user, tokens


async def get_user_by_id(user_id: str) -> UserInDB | None:
    db = get_db()
    doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not doc:
        return None
    return UserInDB(
        id=str(doc["_id"]),
        email=doc["email"],
        full_name=doc["full_name"],
        password_hash=doc["password_hash"],
        role=Role(doc["role"]),
        organization_id=doc["organization_id"],
        created_at=doc["created_at"],
        is_active=doc.get("is_active", True),
    )
