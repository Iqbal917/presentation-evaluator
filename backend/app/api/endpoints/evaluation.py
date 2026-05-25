from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
import time
import uuid
import threading
from app.core.limiter import limiter
from app.core.security import get_current_user_optional, get_user_identifier, increment_evaluation_count
from app.core.app_state import AppState
from app.worker.tasks import process_real_time_evaluation
from app.services import evaluate_module

router = APIRouter(tags=["Evaluation"])

@router.post("/start-evaluation")
@limiter.limit("10/minute")
async def start_evaluation(request: Request):
    try:
        current_user = await get_current_user_optional(request)
        user_identifier = get_user_identifier(request, current_user)

        # Check if user already has running evaluation
        eval_status = AppState.get_task_status(user_identifier)
        if eval_status and eval_status.get("status") == "running":
            return {"status": "already_running", "task_id": eval_status.get("task_id")}

        task_id = str(uuid.uuid4())
        AppState.set_task_status(user_identifier, {
            "status": "running",
            "task_id": task_id,
            "started_at": time.time()
        })

        worker_thread = threading.Thread(
            target=process_real_time_evaluation,
            args=(user_identifier, task_id),
            daemon=True
        )
        worker_thread.start()

        # Increment evaluation count
        try:
            increment_evaluation_count(request, current_user)
        except Exception as count_exc:
            print(f"[evaluation] increment_evaluation_count error: {type(count_exc).__name__}: {count_exc}")

        return {"status": "started", "task_id": task_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[evaluation] start evaluation error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop-evaluation")
@limiter.limit("20/minute")
async def stop_evaluation(request: Request, no_redirect: str = None):
    try:
        current_user = await get_current_user_optional(request)
        user_identifier = get_user_identifier(request, current_user)
        
        # Get evaluation status
        eval_status = AppState.get_task_status(user_identifier)
        if eval_status and eval_status.get("status") in {"running", "processing_video"}:
            evaluate_module.stop_user_recording(user_identifier)

        # Update status to stopped
        AppState.set_task_status(user_identifier, {
            "status": "stopped",
            "task_id": eval_status.get("task_id") if eval_status else None,
            "stopped_at": time.time()
        })
        
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
    
    status = AppState.get_task_status(user_identifier)
    if not status:
        return {"status": "idle"}
    
    return status

@router.get("/api/metrics")
async def get_metrics(request: Request):
    """Get real-time metrics for specific user"""
    try:
        current_user = await get_current_user_optional(request)
        user_identifier = get_user_identifier(request, current_user)
        
        # Get live user metrics directly from evaluation session
        metrics = evaluate_module.get_user_current_metrics(user_identifier)
        return metrics
    except Exception as e:
        print(f"Metrics endpoint error: {e}")
        return {
            "expression": "Detecting...",
            "pitch": 0,
            "confidence": 0
        }
