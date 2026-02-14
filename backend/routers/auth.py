"""Authentication endpoints: register, login, refresh, me."""

import logging

from fastapi import APIRouter, HTTPException, Depends, Request

from backend.models.user import UserCreate, UserLogin, UserResponse, Token, TokenRefresh
from backend.services.auth_service import register_user, login_user
from backend.core.security import decode_token, create_access_token, create_refresh_token
from backend.core.database import get_db
from backend.middleware.auth import get_current_user
from backend.middleware.rate_limit import limiter, AUTH_LIMIT
from backend.services.activity import log_audit_event

logger = logging.getLogger(__name__)
router = APIRouter(tags=["auth"])


@router.post("/auth/register", response_model=dict)
@limiter.limit(AUTH_LIMIT)
async def register(request: Request, data: UserCreate):
    try:
        user, tokens, org = await register_user(data)
    except ValueError as e:
        raise HTTPException(400, str(e))

    await log_audit_event(
        user.organization_id, user.id, "user_registered",
        resource_type="user", resource_id=user.id,
        detail=f"{user.email} registered",
        ip_address=request.client.host if request.client else "",
    )

    return {
        "user": UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            organization_id=user.organization_id,
            organization_name=org["name"],
            created_at=user.created_at.isoformat(),
        ).model_dump(),
        "tokens": tokens.model_dump(),
    }


@router.post("/auth/login", response_model=dict)
@limiter.limit(AUTH_LIMIT)
async def login(request: Request, data: UserLogin):
    try:
        user, tokens = await login_user(data.email, data.password)
    except ValueError as e:
        await log_audit_event(
            "", "", "login_failed",
            detail=f"Failed login attempt for {data.email}",
            ip_address=request.client.host if request.client else "",
        )
        raise HTTPException(401, str(e))

    await log_audit_event(
        user.organization_id, user.id, "user_login",
        resource_type="user", resource_id=user.id,
        detail=f"{user.email} logged in",
        ip_address=request.client.host if request.client else "",
    )

    # Fetch org name
    db = get_db()
    from bson import ObjectId
    org = await db.organizations.find_one({"_id": ObjectId(user.organization_id)})
    org_name = org["name"] if org else ""

    return {
        "user": UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            organization_id=user.organization_id,
            organization_name=org_name,
            created_at=user.created_at.isoformat(),
        ).model_dump(),
        "tokens": tokens.model_dump(),
    }


@router.post("/auth/refresh", response_model=Token)
async def refresh_token(data: TokenRefresh):
    try:
        payload = decode_token(data.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid token type")
    except Exception:
        raise HTTPException(401, "Invalid or expired refresh token")

    token_data = {"sub": payload["sub"], "org": payload["org"], "role": payload["role"]}
    return Token(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    db = get_db()
    from bson import ObjectId
    org = await db.organizations.find_one({"_id": ObjectId(user["organization_id"])})
    org_name = org["name"] if org else ""

    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"].value if hasattr(user["role"], "value") else user["role"],
        "organization_id": user["organization_id"],
        "organization_name": org_name,
    }
