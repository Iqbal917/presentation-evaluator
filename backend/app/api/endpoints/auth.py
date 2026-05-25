from fastapi import APIRouter, Request, Depends, HTTPException
from datetime import timedelta
from app.core.limiter import limiter
from app.core.security import (
    authenticate_user, create_user, create_access_token, get_current_user,
    get_current_user_optional
)
from app.models.schemas import UserCreate, UserLogin, Token, UserResponse, User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
@limiter.limit("5/minute")
async def register(request: Request, user: UserCreate):
    try:
        print(f"Registration attempt for: {user.email}")
        
        db_user = create_user(user.email, user.password, user.full_name)
        print(f"User created successfully: {db_user.email}")
        
        access_token_expires = timedelta(minutes=1440)
        access_token = create_access_token(
            data={"sub": db_user.email}, expires_delta=access_token_expires
        )
        
        print(f"Token created for: {db_user.email}")
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException as e:
        print(f"Registration HTTPException: {e.detail}")
        raise e
    except Exception as e:
        print(f"Registration error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, user: UserLogin):
    db_user = authenticate_user(user.email, user.password)
    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=1440)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_premium=current_user.is_premium,
        created_at=current_user.created_at.isoformat() if current_user.created_at else ""
    )
