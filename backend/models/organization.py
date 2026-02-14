"""Organization Pydantic schemas."""

from pydantic import BaseModel, Field


class OrgCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class OrgResponse(BaseModel):
    id: str
    name: str
    slug: str
    owner_id: str
    plan: str = "free"
    member_count: int = 0
