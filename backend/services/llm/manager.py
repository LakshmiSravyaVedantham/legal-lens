"""LLM Manager: loads org config, tries fallback chain."""

import logging
from functools import lru_cache

from backend.core.settings import get_settings
from backend.core.database import get_db
from backend.core.encryption import decrypt
from backend.services.llm.base import BaseLLMProvider
from backend.services.llm.ollama import OllamaProvider
from backend.services.llm.anthropic import AnthropicProvider
from backend.services.llm.openai_provider import OpenAIProvider

logger = logging.getLogger(__name__)


class LLMManager:
    """Manages LLM providers with per-org configuration and fallback chains."""

    def _build_provider(self, name: str, config: dict) -> BaseLLMProvider | None:
        settings = get_settings()

        if name == "ollama":
            return OllamaProvider(
                base_url=settings.ollama_base_url,
                model=config.get("model") or settings.ollama_model,
                timeout=settings.ollama_timeout,
            )
        elif name == "anthropic":
            api_key = decrypt(config.get("api_key", "")) or settings.anthropic_api_key
            if not api_key:
                return None
            return AnthropicProvider(api_key=api_key, model=config.get("model") or "claude-sonnet-4-5-20250929")
        elif name == "openai":
            api_key = decrypt(config.get("api_key", "")) or settings.openai_api_key
            if not api_key:
                return None
            return OpenAIProvider(api_key=api_key, model=config.get("model") or "gpt-4o")
        elif name == "azure_openai":
            api_key = decrypt(config.get("api_key", "")) or settings.azure_openai_api_key
            endpoint = config.get("endpoint") or settings.azure_openai_endpoint
            deployment = config.get("deployment") or settings.azure_openai_deployment
            if not api_key or not endpoint:
                return None
            return OpenAIProvider(
                api_key=api_key,
                model=deployment,
                endpoint=endpoint,
                is_azure=True,
                azure_deployment=deployment,
            )
        return None

    async def _get_org_config(self, org_id: str) -> dict | None:
        try:
            db = get_db()
            return await db.llm_configs.find_one({"organization_id": org_id})
        except Exception:
            return None

    async def generate(self, prompt: str, system: str | None = None, org_id: str = "") -> str:
        """Try the fallback chain until one provider succeeds."""
        config = await self._get_org_config(org_id) if org_id else None

        if config:
            chain = config.get("fallback_chain", ["ollama"])
        else:
            chain = ["ollama"]

        last_error = None
        for provider_name in chain:
            provider_config = {}
            if config:
                provider_config = config.get(provider_name, {})
                if isinstance(provider_config, dict) and not provider_config.get("enabled", True):
                    continue

            provider = self._build_provider(provider_name, provider_config if isinstance(provider_config, dict) else {})
            if not provider:
                continue

            try:
                result = await provider.generate(prompt, system)
                logger.info(f"LLM response from {provider_name}")
                return result
            except Exception as e:
                logger.warning(f"Provider {provider_name} failed: {e}")
                last_error = e
                continue

        if last_error:
            raise last_error
        raise ConnectionError("No LLM provider available. Configure one in Settings or start Ollama.")

    async def check_status(self, org_id: str = "") -> list[dict]:
        """Check health of all configured providers."""
        config = await self._get_org_config(org_id) if org_id else None
        settings = get_settings()

        providers_to_check = ["ollama", "anthropic", "openai", "azure_openai"]
        results = []

        for name in providers_to_check:
            provider_config = {}
            if config:
                provider_config = config.get(name, {})
                if not isinstance(provider_config, dict):
                    provider_config = {}

            provider = self._build_provider(name, provider_config)
            if not provider:
                results.append({"provider": name, "available": False, "model": "", "error": "Not configured"})
                continue

            try:
                ok = await provider.health_check()
                results.append({
                    "provider": name,
                    "available": ok,
                    "model": provider.get_model_name(),
                    "error": "" if ok else "Health check failed",
                })
            except Exception as e:
                results.append({"provider": name, "available": False, "model": "", "error": str(e)})

        return results


@lru_cache
def get_llm_manager() -> LLMManager:
    return LLMManager()
