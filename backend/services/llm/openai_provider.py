"""OpenAI / Azure OpenAI / OpenAI-compatible LLM provider."""

import logging

from backend.services.llm.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class OpenAIProvider(BaseLLMProvider):
    name = "openai"

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o",
        endpoint: str = "",
        is_azure: bool = False,
        azure_deployment: str = "",
    ):
        self.api_key = api_key
        self.model = model
        self.endpoint = endpoint
        self.is_azure = is_azure
        self.azure_deployment = azure_deployment

    def _get_client(self):
        try:
            import openai
        except ImportError:
            raise ConnectionError("openai package not installed. Run: pip install openai")

        if self.is_azure and self.endpoint:
            return openai.AsyncAzureOpenAI(
                api_key=self.api_key,
                azure_endpoint=self.endpoint,
                azure_deployment=self.azure_deployment,
                api_version="2024-06-01",
            )
        elif self.endpoint:
            # Custom OpenAI-compatible endpoint
            return openai.AsyncOpenAI(api_key=self.api_key, base_url=self.endpoint)
        else:
            return openai.AsyncOpenAI(api_key=self.api_key)

    async def generate(self, prompt: str, system: str | None = None) -> str:
        client = self._get_client()
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        response = await client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=4096,
        )
        return response.choices[0].message.content or ""

    async def health_check(self) -> bool:
        if not self.api_key:
            return False
        try:
            client = self._get_client()
            await client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "hi"}],
                max_tokens=5,
            )
            return True
        except Exception as e:
            logger.debug(f"OpenAI health check failed: {e}")
            return False

    def get_model_name(self) -> str:
        return self.model
