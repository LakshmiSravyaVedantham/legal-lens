"""Abstract base class for LLM providers."""

from abc import ABC, abstractmethod


class BaseLLMProvider(ABC):
    """Interface that every LLM provider must implement."""

    name: str = "base"

    @abstractmethod
    async def generate(self, prompt: str, system: str | None = None) -> str:
        """Generate a completion for the given prompt."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Return True if the provider is reachable and operational."""
        ...

    def get_model_name(self) -> str:
        """Return the model identifier being used."""
        return ""
