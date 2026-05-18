from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
import time
from app.core.limiter import limiter
from app.core.security import get_current_user_optional, get_user_identifier, increment_evaluation_count
from app.core.redis_client import RedisManager
from app.worker.tasks import process_real_time_evaluation
from app.core.celery_app import celery_app
from app.services import evaluate_module

router = APIRouter(tags=["Evaluation"])

@router.post("/start-evaluation")
@limiter.limit("10/minute")
async def start_evaluation(request: Request):
    try:
        current_user = await get_current_user_optional(request)
        user_identifier = get_user_identifier(request, current_user)
        
        # Check if user already has running evaluation
        eval_status = RedisManager.get_evaluation_status(user_identifier)
        if eval_status and eval_status.get("status") == "running":
            return {"status": "already_running", "task_id": eval_status.get("task_id")}
        
        # Start evaluation as Celery task
        task = process_real_time_evaluation.delay(user_identifier)
        
        # Increment evaluation count
        increment_evaluation_count(request, current_user)
        
        return {"status": "started", "task_id": task.id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop-evaluation")
@limiter.limit("20/minute")
async def stop_evaluation(request: Request, no_redirect: str = None):
    try:
        current_user = await get_current_user_optional(request)
        user_identifier = get_user_identifier(request, current_user)
        
        # Get evaluation status
        eval_status = RedisManager.get_evaluation_status(user_identifier)
        if eval_status and eval_status.get("task_id"):
            # Revoke the Celery task
            celery_app.control.revoke(eval_status["task_id"], terminate=True)
        
        # Update status to stopped
        RedisManager.set_evaluation_status(user_identifier, {
            "status": "stopped",
            "stopped_at": time.time()
        })
        
        # Call stop recording for immediate stop
        evaluate_module.stop_user_recording(user_identifier)
        
        accept_header = request.headers.get('accept', '')
        if no_redirect == '1' or 'application/json' in accept_header:
            return {"status": "stopped"}
        
        return RedirectResponse(url="/report", status_code=302)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/evaluation-status")
async def get_evaluation_status_endpoint(request: Request):
    """Get current evaluation status for user"""
    current_user = await get_current_user_optional(request)
    user_identifier = get_user_identifier(request, current_user)
    
    status = RedisManager.get_evaluation_status(user_identifier)
    if not status:
        return {"status": "idle"}
    
    return status

@router.get("/api/metrics")
async def get_metrics(request: Request):
    """Get real-time metrics for specific user"""
    try:
        current_user = await get_current_user_optional(request)
        user_identifier = get_user_identifier(request, current_user)
        
        # Try to get user-specific metrics from Redis
        metrics = RedisManager.get_user_metrics(user_identifier)
        if metrics:
            return metrics
        
        # Fallback to evaluate_module for backwards compatibility
        try:
            metrics = evaluate_module.get_user_current_metrics(user_identifier)
            # Cache the metrics
            RedisManager.set_user_metrics(user_identifier, metrics)
            return metrics
        except:
            return {
                "expression": "Detecting...",
                "pitch": 0,
                "confidence": 0
            }
    except Exception as e:
        return {
            "expression": "Detecting...",
            "pitch": 0,
            "confidence": 0
        }
