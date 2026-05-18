from fastapi import APIRouter, Request, Depends, HTTPException
import time
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter
from app.core.security import get_current_user, get_current_user_optional, get_user_identifier
from app.core.database import get_database
from app.core.redis_client import RedisManager
from app.core.celery_app import celery_app
from app.models.schemas import User

router = APIRouter(tags=["System & Monitoring"])

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis connectivity
        RedisManager.redis_client.ping()
        
        # Check MongoDB connectivity
        db = get_database()
        db.command('ping')
        
        # Check Celery workers
        inspect = celery_app.control.inspect()
        active_workers = inspect.active()
        
        return {
            "status": "healthy",
            "redis": "connected",
            "mongodb": "connected",
            "celery_workers": len(active_workers) if active_workers else 0,
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
        # Get Redis stats
        redis_info = RedisManager.redis_client.info()
        
        # Get active tasks
        inspect = celery_app.control.inspect()
        active_tasks = inspect.active()
        
        # Get MongoDB stats
        db = get_database()
        user_count = db.users.count_documents({})
        device_trials = db.device_trials.count_documents({})
        
        return {
            "users": {
                "total_registered": user_count,
                "device_trials": device_trials
            },
            "redis": {
                "connected_clients": redis_info.get("connected_clients", 0),
                "used_memory_human": redis_info.get("used_memory_human", "0B")
            },
            "celery": {
                "active_tasks": sum(len(tasks) for tasks in active_tasks.values()) if active_tasks else 0,
                "workers": len(active_tasks) if active_tasks else 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/debug/user-identifier")
async def debug_user_identifier(request: Request):
    current_user = await get_current_user_optional(request)
    expected_identifier = get_user_identifier(request, current_user)
    return {"expected_identifier": expected_identifier, "user": current_user.email if current_user else None}
