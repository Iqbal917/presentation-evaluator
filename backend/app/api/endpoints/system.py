from fastapi import APIRouter, Request, Depends, HTTPException
import time
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter
from app.core.security import get_current_user, get_current_user_optional, get_user_identifier
from app.core.database import get_database
from app.core.app_state import AppState
from app.models.schemas import User

router = APIRouter(tags=["System & Monitoring"])

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check MongoDB connectivity
        db = get_database()
        db.command('ping')

        active_tasks = AppState.get_active_task_count()

        return {
            "status": "healthy",
            "mongodb": "connected",
            "active_tasks": active_tasks,
            "timestamp": time.time()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": time.time()
        }

@router.get("/stats")
async def get_system_stats(request: Request, current_user: User = Depends(get_current_user)):
    """Get system statistics (admin only)"""
    # Apply rate limiting manually
    try:
        limiter.check(request)
    except RateLimitExceeded:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    if not current_user.is_premium:  # You can add admin role later
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Get MongoDB stats
        db = get_database()
        user_count = db.users.count_documents({})
        active_tasks = AppState.get_active_task_count()

        return {
            "users": {
                "total_registered": user_count
            },
            "tasks": {
                "active_tasks": active_tasks
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/debug/user-identifier")
async def debug_user_identifier(request: Request):
    current_user = await get_current_user_optional(request)
    expected_identifier = get_user_identifier(request, current_user)
    return {"expected_identifier": expected_identifier, "user": current_user.email if current_user else None}
