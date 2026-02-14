"""Anthropic Claude LLM provider."""

import logging

from backend.services.llm.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class AnthropicProvider(BaseLLMProvider):
    name = "anthropic"

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-5-20250929"):
        self.api_key = api_key
        self.model = model

    async def generate(self, prompt: str, system: str | None = None) -> str:
        try:
            import anthropic
        except ImportError:
            raise ConnectionError("anthropic package not installed. Run: pip install anthropic")

        client = anthropic.AsyncAnthropic(api_key=self.api_key)
        messages = [{"role": "user", "content": prompt}]

        response = await client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system or "",
            messages=messages,
        )

        return response.content[0].text

    async def health_check(self) -> bool:
        if not self.api_key:
            return False
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=self.api_key)
            # Quick model list check
            await client.messages.create(
                model=self.model,
                max_tokens=5,
                messages=[{"role": "user", "content": "hi"}],
            )
            return True
        except Exception as e:
            logger.debug(f"Anthropic health check failed: {e}")
            return False

    def get_model_name(self) -> str:
        return self.model
