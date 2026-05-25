from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from decouple import config
from app.models.schemas import User, TokenData
from app.core.database import get_database
from bson import ObjectId
import hashlib
import json

# Configuration
SECRET_KEY = config("SECRET_KEY", default="your-secret-key-here")
ALGORITHM = config("ALGORITHM", default="HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(config("ACCESS_TOKEN_EXPIRE_MINUTES", default="1440"))

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        token_data = TokenData(email=email)
        return token_data
    except JWTError:
        return None

def create_user(email: str, password: str, full_name: Optional[str] = None):
    db = get_database()
    
    # Check if user already exists
    if db.users.find_one({"email": email}):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(password)
    user_dict = {
        "email": email,
        "hashed_password": hashed_password,
        "full_name": full_name,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "is_premium": True
    }
    
    result = db.users.insert_one(user_dict)
    
    # Convert ObjectId to string for Pydantic
    user_dict["_id"] = str(result.inserted_id)
    user = User(**user_dict)
    
    return user

def authenticate_user(email: str, password: str):
    print(f"DEBUG: Attempting authentication for {email}")
    
    db = get_database()
    user_dict = db.users.find_one({"email": email})
    
    if not user_dict:
        print(f"DEBUG: No user found for {email}")
        return False
    
    print(f"DEBUG: User found, checking password")
    
    if not verify_password(password, user_dict["hashed_password"]):
        print(f"DEBUG: Password verification failed")
        return False
    
    print(f"DEBUG: Password verified, creating user object")
    
    try:
        # Convert ObjectId to string for Pydantic
        user_dict["_id"] = str(user_dict["_id"])
        user = User(**user_dict)
        
        print(f"DEBUG: User object created successfully")
        
        return user
        
    except Exception as e:
        print(f"DEBUG: Error creating user object: {e}")
        return False

def get_user_by_email(email: str, use_cache: bool = True):
    # Get from database
    db = get_database()
    user_dict = db.users.find_one({"email": email})
    if user_dict:
        # Convert ObjectId to string for Pydantic
        user_dict["_id"] = str(user_dict["_id"])
        user = User(**user_dict)
        
        return user
    return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = verify_token(credentials.credentials)
    if token_data is None:
        raise credentials_exception
    
    user = get_user_by_email(email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_user_optional(request: Request) -> Optional[User]:
    """Get current user if authenticated, otherwise return None"""
    try:
        authorization = request.headers.get("authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            token_data = verify_token(token)
            if token_data:
                return get_user_by_email(token_data.email)
    except:
        pass
    return None

def generate_device_fingerprint(request: Request):
    """Generate a simple device fingerprint based on request headers"""
    user_agent = request.headers.get("user-agent", "")
    accept_language = request.headers.get("accept-language", "")
    accept_encoding = request.headers.get("accept-encoding", "")
    
    fingerprint_data = f"{user_agent}|{accept_language}|{accept_encoding}"
    return hashlib.sha256(fingerprint_data.encode()).hexdigest()

def increment_evaluation_count(request: Request, user: Optional[User] = None):
    """Increment evaluation count for device or user"""
    pass

def get_user_identifier(request: Request, user: Optional[User] = None) -> str:
    """Get unique identifier for user or device"""
    # Allow the frontend to supply a client identifier (keeps device id stable)
    header_id = None
    try:
        header_id = request.headers.get("x-client-identifier")
    except Exception:
        header_id = None

    if user:
        return str(user.id)

    if header_id:
        return header_id

    return f"device:{generate_device_fingerprint(request)}"

