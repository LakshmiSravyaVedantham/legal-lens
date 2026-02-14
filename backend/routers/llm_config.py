"""LLM configuration endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException

from backend.core.database import get_db
from backend.core.encryption import encrypt
from backend.models.llm_config import LLMConfigRequest, LLMConfigResponse, ProviderConfig
from backend.middleware.auth import require_role
from backend.models.user import Role
from backend.services.llm.manager import get_llm_manager
from backend.services.activity import log_audit_event

logger = logging.getLogger(__name__)
router = APIRouter(tags=["llm-config"])


@router.get("/llm/config")
async def get_llm_config(user: dict = Depends(require_role(Role.ADMIN))):
    db = get_db()
    org_id = user["organization_id"]
    doc = await db.llm_configs.find_one({"organization_id": org_id})

    if not doc:
        # Return defaults
        return LLMConfigResponse(
            organization_id=org_id,
            active_provider="ollama",
            fallback_chain=["ollama"],
            ollama=ProviderConfig(enabled=True, model="llama3.1:8b"),
            anthropic=ProviderConfig(model="claude-sonnet-4-5-20250929"),
            openai=ProviderConfig(model="gpt-4o"),
            azure_openai=ProviderConfig(),
        )

    # Mask API keys for response (show last 4 chars)
    def _mask(cfg: dict) -> ProviderConfig:
        api_key = cfg.get("api_key", "")
        masked = f"***{api_key[-4:]}" if len(api_key) > 4 else ""
        return ProviderConfig(
            enabled=cfg.get("enabled", False),
            api_key=masked,
            model=cfg.get("model", ""),
            endpoint=cfg.get("endpoint", ""),
        )

    return LLMConfigResponse(
        organization_id=org_id,
        active_provider=doc.get("active_provider", "ollama"),
        fallback_chain=doc.get("fallback_chain", ["ollama"]),
        ollama=_mask(doc.get("ollama", {})),
        anthropic=_mask(doc.get("anthropic", {})),
        openai=_mask(doc.get("openai", {})),
        azure_openai=_mask(doc.get("azure_openai", {})),
    )


@router.put("/llm/config")
async def update_llm_config(req: LLMConfigRequest, user: dict = Depends(require_role(Role.ADMIN))):
    db = get_db()
    org_id = user["organization_id"]

    # Encrypt API keys before storing
    def _prepare(cfg: ProviderConfig) -> dict:
        d = cfg.model_dump()
        if d["api_key"] and not d["api_key"].startswith("***"):
            d["api_key"] = encrypt(d["api_key"])
        elif d["api_key"].startswith("***"):
            d["api_key"] = ""  # Don't overwrite with masked value
        return d

    doc = {
        "organization_id": org_id,
        "active_provider": req.active_provider,
        "fallback_chain": req.fallback_chain,
        "ollama": _prepare(req.ollama),
        "anthropic": _prepare(req.anthropic),
        "openai": _prepare(req.openai),
        "azure_openai": _prepare(req.azure_openai),
    }

    # Preserve existing encrypted keys if masked value was sent
    existing = await db.llm_configs.find_one({"organization_id": org_id})
    if existing:
        for provider in ["anthropic", "openai", "azure_openai"]:
            if not doc[provider]["api_key"] and existing.get(provider, {}).get("api_key"):
                doc[provider]["api_key"] = existing[provider]["api_key"]

    await db.llm_configs.update_one(
        {"organization_id": org_id},
        {"$set": doc},
        upsert=True,
    )

    await log_audit_event(
        org_id, user["id"], "llm_config_updated",
        resource_type="llm_config",
        detail=f"Active provider: {req.active_provider}",
    )
    return {"message": "LLM configuration updated"}


@router.get("/llm/providers/status")
async def providers_status(user: dict = Depends(require_role(Role.ADMIN))):
    manager = get_llm_manager()
    statuses = await manager.check_status(user["organization_id"])
    return {"providers": statuses}
