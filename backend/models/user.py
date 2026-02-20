"""User and authentication Pydantic schemas."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class Role(str, Enum):
    ADMIN = "admin"
    LAWYER = "lawyer"
    PARALEGAL = "paralegal"
    VIEWER = "viewer"


ROLE_HIERARCHY = {
    Role.ADMIN: 4,
    Role.LAWYER: 3,
    Role.PARALEGAL: 2,
    Role.VIEWER: 1,
}


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1, max_length=100)
    organization_name: str = Field(default="", max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserInDB(BaseModel):
    id: str
    email: str
    full_name: str
    password_hash: str
    role: Role = Role.ADMIN
    organization_id: str
    created_at: datetime
    is_active: bool = True


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: Role
    organization_id: str
    organization_name: str = ""
    created_at: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str
