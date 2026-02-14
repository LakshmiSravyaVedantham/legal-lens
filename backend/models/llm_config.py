"""LLM configuration Pydantic schemas."""

from pydantic import BaseModel


class ProviderConfig(BaseModel):
    enabled: bool = False
    api_key: str = ""
    model: str = ""
    endpoint: str = ""


class LLMConfigRequest(BaseModel):
    active_provider: str = "ollama"
    fallback_chain: list[str] = ["ollama"]
    ollama: ProviderConfig = ProviderConfig(enabled=True, model="llama3.1:8b")
    anthropic: ProviderConfig = ProviderConfig(model="claude-sonnet-4-5-20250929")
    openai: ProviderConfig = ProviderConfig(model="gpt-4o")
    azure_openai: ProviderConfig = ProviderConfig()


class LLMConfigResponse(BaseModel):
    organization_id: str
    active_provider: str
    fallback_chain: list[str]
    ollama: ProviderConfig
    anthropic: ProviderConfig
    openai: ProviderConfig
    azure_openai: ProviderConfig


class ProviderStatus(BaseModel):
    provider: str
    available: bool
    model: str = ""
    error: str = ""
