from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Any
from datetime import datetime
from bson import ObjectId

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    hashed_password: str
    full_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    trial_started_at: Optional[datetime] = None
    trial_evaluations_used: int = 0
    is_premium: bool = True

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }

    @field_validator('id', mode='before')
    @classmethod
    def convert_objectid_to_str(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

class TrialStatus(BaseModel):
    is_trial_active: bool = True
    days_remaining: Optional[int] = None
    evaluations_remaining: Optional[int] = None
    trial_expired: bool = False

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    is_premium: bool
    created_at: str
    trial_started_at: Optional[str] = None
    trial_evaluations_used: int = 0
