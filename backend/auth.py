from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from decouple import config
from models import User, TokenData, TrialStatus
from database import get_database
from redis_client import RedisManager
from bson import ObjectId
import hashlib
import json

# Configuration
SECRET_KEY = config("SECRET_KEY", default="your-secret-key-here")
ALGORITHM = config("ALGORITHM", default="HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(config("ACCESS_TOKEN_EXPIRE_MINUTES", default="1440"))
TRIAL_DAYS = int(config("TRIAL_DAYS", default="7"))
MAX_TRIAL_EVALUATIONS = int(config("MAX_TRIAL_EVALUATIONS", default="5"))

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
        "trial_started_at": datetime.utcnow(),
        "trial_evaluations_used": 0,
        "is_premium": False
    }
    
    result = db.users.insert_one(user_dict)
    
    # Convert ObjectId to string for Pydantic
    user_dict["_id"] = str(result.inserted_id)
    user = User(**user_dict)
    
    # Cache the new user
    RedisManager.set_user_session(f"user:{email}", user.model_dump(by_alias=True), 600)
    
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
        
        # Cache authenticated user
        RedisManager.set_user_session(f"user:{email}", user.model_dump(by_alias=True), 600)
        
        return user
        
    except Exception as e:
        print(f"DEBUG: Error creating user object: {e}")
        return False

def get_user_by_email(email: str, use_cache: bool = True):
    # Try cache first
    if use_cache:
        cached_user = RedisManager.get_user_session(f"user:{email}")
        if cached_user:
            return User(**cached_user)
    
    # Get from database
    db = get_database()
    user_dict = db.users.find_one({"email": email})
    if user_dict:
        # Convert ObjectId to string for Pydantic
        user_dict["_id"] = str(user_dict["_id"])
        user = User(**user_dict)
        
        # Cache for 10 minutes
        if use_cache:
            RedisManager.set_user_session(f"user:{email}", user.model_dump(by_alias=True), 600)
        
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

def check_device_trial(request: Request):
    """Check if device has trial remaining with Redis caching"""
    fingerprint = generate_device_fingerprint(request)
    
    # Check cache first
    cached_trial = RedisManager.get_cached_trial_status(fingerprint)
    if cached_trial:
        return TrialStatus(**cached_trial)
    
    # Get from database
    db = get_database()
    trial_doc = db.device_trials.find_one({"device_fingerprint": fingerprint})
    
    if not trial_doc:
        # First time user - create trial
        trial_doc = {
            "device_fingerprint": fingerprint,
            "trial_started_at": datetime.utcnow(),
            "evaluations_used": 0
        }
        db.device_trials.insert_one(trial_doc)
    
    trial_status = get_trial_status_from_doc(trial_doc)
    
    # Cache for 5 minutes
    RedisManager.cache_trial_status(fingerprint, trial_status.dict(), 300)
    
    return trial_status

def get_trial_status_from_doc(trial_doc):
    """Calculate trial status from document"""
    if not trial_doc:
        return TrialStatus(is_trial_active=False, trial_expired=True)
    
    trial_start = trial_doc.get("trial_started_at")
    evaluations_used = trial_doc.get("evaluations_used", 0)
    
    if not trial_start:
        return TrialStatus(is_trial_active=False, trial_expired=True)
    
    # Check if trial period expired
    days_passed = (datetime.utcnow() - trial_start).days
    days_remaining = max(0, TRIAL_DAYS - days_passed)
    
    # Check evaluation limit
    evaluations_remaining = max(0, MAX_TRIAL_EVALUATIONS - evaluations_used)
    
    trial_expired = days_remaining <= 0 or evaluations_remaining <= 0
    
    return TrialStatus(
        is_trial_active=not trial_expired,
        days_remaining=days_remaining if days_remaining > 0 else None,
        evaluations_remaining=evaluations_remaining if evaluations_remaining > 0 else None,
        trial_expired=trial_expired
    )

def get_user_trial_status(user: User):
    """Get trial status for logged-in user with caching"""
    if user.is_premium:
        return TrialStatus(is_trial_active=True, trial_expired=False)
    
    user_id = str(user.id)
    
    # Check cache first
    cached_trial = RedisManager.get_cached_trial_status(f"user:{user_id}")
    if cached_trial:
        return TrialStatus(**cached_trial)
    
    if not user.trial_started_at:
        trial_status = TrialStatus(is_trial_active=False, trial_expired=True)
    else:
        days_passed = (datetime.utcnow() - user.trial_started_at).days
        days_remaining = max(0, TRIAL_DAYS - days_passed)
        evaluations_remaining = max(0, MAX_TRIAL_EVALUATIONS - user.trial_evaluations_used)
        
        trial_expired = days_remaining <= 0 or evaluations_remaining <= 0
        
        trial_status = TrialStatus(
            is_trial_active=not trial_expired,
            days_remaining=days_remaining if days_remaining > 0 else None,
            evaluations_remaining=evaluations_remaining if evaluations_remaining > 0 else None,
            trial_expired=trial_expired
        )
    
    # Cache for 5 minutes
    RedisManager.cache_trial_status(f"user:{user_id}", trial_status.dict(), 300)
    
    return trial_status

def increment_evaluation_count(request: Request, user: Optional[User] = None):
    """Increment evaluation count for device or user"""
    db = get_database()
    
    if user and not user.is_premium:
        # Update user's evaluation count
        db.users.update_one(
            {"_id": ObjectId(user.id)},
            {"$inc": {"trial_evaluations_used": 1}}
        )
        # Clear user trial cache
        user_id = str(user.id)
        RedisManager.redis_client.delete(f"trial:user:{user_id}")  # Clear cache
    else:
        # Update device trial count
        fingerprint = generate_device_fingerprint(request)
        db.device_trials.update_one(
            {"device_fingerprint": fingerprint},
            {"$inc": {"evaluations_used": 1}},
            upsert=True
        )
        # Clear device trial cache
        RedisManager.redis_client.delete(f"trial:{fingerprint}")  # Clear cache