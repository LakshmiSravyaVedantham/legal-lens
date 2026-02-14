"""Audit trail endpoints — admin-only query of audit log."""

import logging

from fastapi import APIRouter, Depends, Query

from backend.middleware.auth import require_role
from backend.models.user import Role
from backend.services.activity import get_audit_log, get_audit_summary

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/events")
async def list_audit_events(
    action: str | None = Query(None),
    resource_type: str | None = Query(None),
    user_id: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(require_role(Role.ADMIN)),
):
    """Query the audit log with optional filters."""
    events, total = await get_audit_log(
        org_id=user["organization_id"],
        action=action,
        resource_type=resource_type,
        user_id=user_id,
        skip=skip,
        limit=limit,
    )
    return {"events": events, "total": total, "skip": skip, "limit": limit}


@router.get("/events/summary")
async def audit_summary(
    days: int = Query(30, ge=1, le=365),
    user: dict = Depends(require_role(Role.ADMIN)),
):
    """30-day aggregate of audit events by action type."""
    summary = await get_audit_summary(user["organization_id"], days)
    return {"summary": summary, "days": days}
