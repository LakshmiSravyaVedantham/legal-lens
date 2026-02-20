"""Authentication dependencies for FastAPI."""

import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.core.security import decode_token
from backend.models.user import ROLE_HIERARCHY, Role
from backend.services.auth_service import get_user_by_id

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    """Extract and validate the JWT, return user dict with id/org/role."""
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type")
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    user = await get_user_by_id(payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or disabled")

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "organization_id": user.organization_id,
    }


def require_role(minimum_role: Role):
    """Dependency factory: require at least this role level."""

    async def _check(user: dict = Depends(get_current_user)):
        user_level = ROLE_HIERARCHY.get(user["role"], 0)
        required_level = ROLE_HIERARCHY.get(minimum_role, 0)
        if user_level < required_level:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return user

    return _check


def get_org_context(user: dict = Depends(get_current_user)) -> str:
    """Return the organization_id for multi-tenant queries."""
    return user["organization_id"]
