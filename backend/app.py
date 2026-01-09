from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Depends
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from datetime import timedelta
import os
import time
import re
import unicodedata
from typing import Optional

# Import custom modules
try:
    from auth import (
        authenticate_user, create_user, create_access_token, get_current_user,
        get_current_user_optional, check_device_trial, get_user_trial_status, 
        increment_evaluation_count
    )
    # from models import UserCreate, UserLogin, Token, TrialStatus, User
    from models import TrialStatus, User
    from pydantic import BaseModel, EmailStr
    from typing import Optional
    from database import connect_to_mongo, get_database
    from redis_client import RedisManager
    from tasks import process_real_time_evaluation, process_uploaded_video
    from celery_app import celery_app
    import evaluate_module
    
    class UserCreate(BaseModel):
        email: EmailStr
        password: str
        full_name: Optional[str] = None

    class UserLogin(BaseModel):
        email: EmailStr
        password: str

    class Token(BaseModel):
        access_token: str
        token_type: str = "bearer"

    class UserResponse(BaseModel):
        id: str
        email: str
        full_name: Optional[str] = None
        is_active: bool
        is_premium: bool
        created_at: str
        trial_started_at: Optional[str] = None
        trial_evaluations_used: int = 0

except ImportError as e:
    print(f"Import error: {e}")
    print("Please make sure all required files are present and properly configured")
    raise

# Initialize FastAPI app
app = FastAPI(title="Presentation Evaluator API - Multi-User")

# Rate limiting setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

ALLOWED_VIDEO_EXTENSIONS = {"mp4", "mov", "avi", "mkv", "webm"}

def secure_filename(filename: str) -> str:
    """Secure a filename by removing dangerous characters."""
    filename = unicodedata.normalize('NFKD', filename)
    filename = re.sub(r'[^\w\s\-_.]', '', filename).strip()
    filename = re.sub(r'[-\s]+', '_', filename)
    return filename

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS

def get_user_identifier(request: Request, user: Optional[User] = None) -> str:
    """Get unique identifier for user or device"""
    if user:
        return str(user.id)
    
    from auth import generate_device_fingerprint
    return f"device:{generate_device_fingerprint(request)}"

# Test endpoints for debugging
@app.get("/test/db")
async def test_database():
    """Test database connectivity"""
    try:
        db = get_database()
        result = db.command('ping')
        user_count = db.users.count_documents({})
        return {
            "database": "connected",
            "ping": result,
            "user_count": user_count
        }
    except Exception as e:
        return JSONResponse(
            content={"error": "Database connection failed", "details": str(e)},
            status_code=500
        )

@app.get("/test/redis") 
async def test_redis():
    """Test Redis connectivity"""
    try:
        RedisManager.redis_client.ping()
        return {"redis": "connected"}
    except Exception as e:
        return JSONResponse(
            content={"error": "Redis connection failed", "details": str(e)},
            status_code=500
        )

@app.post("/auth/register", response_model=Token)
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


@app.post("/auth/login", response_model=Token)
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

@app.get("/auth/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_premium=current_user.is_premium,
        created_at=current_user.created_at.isoformat() if current_user.created_at else "",
        trial_started_at=current_user.trial_started_at.isoformat() if current_user.trial_started_at else None,
        trial_evaluations_used=current_user.trial_evaluations_used
    )

@app.get("/auth/trial-status")
async def get_trial_status(request: Request):
    """Get trial status for device or user"""
    try:
        current_user = await get_current_user_optional(request)
        
        if current_user:
            trial_status = get_user_trial_status(current_user)
        else:
            trial_status = check_device_trial(request)
        
        return trial_status
    except Exception as e:
        return TrialStatus(is_trial_active=False, trial_expired=True)

# Evaluation endpoints with multi-user support
@app.post("/start-evaluation")
@limiter.limit("10/minute")
async def start_evaluation(request: Request):
    try:
        current_user = await get_current_user_optional(request)
        user_identifier = get_user_identifier(request, current_user)
        
        # Check trial status
        if current_user:
            trial_status = get_user_trial_status(current_user)
        else:
            trial_status = check_device_trial(request)
            
        if trial_status.trial_expired and not trial_status.is_trial_active:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "trial_expired",
                    "message": "Your free trial has expired. Please create an account to continue."
                }
            )
        
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

@app.post("/stop-evaluation")
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

@app.get("/evaluation-status")
async def get_evaluation_status_endpoint(request: Request):
    """Get current evaluation status for user"""
    current_user = await get_current_user_optional(request)
    user_identifier = get_user_identifier(request, current_user)
    
    status = RedisManager.get_evaluation_status(user_identifier)
    if not status:
        return {"status": "idle"}
    
    return status

@app.get("/api/metrics")
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

@app.post("/upload_video")
@limiter.limit("5/minute")
async def upload_video(request: Request, file: UploadFile = File(...)):
    try:
        current_user = await get_current_user_optional(request)
        user_identifier = get_user_identifier(request, current_user)
        
        # Check trial status
        if current_user:
            trial_status = get_user_trial_status(current_user)
        else:
            trial_status = check_device_trial(request)
            
        if trial_status.trial_expired and not trial_status.is_trial_active:
            raise HTTPException(
                status_code=403,
                detail="Trial expired. Please create an account to upload videos."
            )
        
        if not file.filename:
            raise HTTPException(status_code=400, detail="No selected file")
        
        if not allowed_file(file.filename):
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Create user-specific upload directory
        user_upload_dir = f"uploads/{user_identifier}"
        os.makedirs(user_upload_dir, exist_ok=True)
        
        filename = secure_filename(file.filename)
        upload_path = os.path.join(user_upload_dir, filename)
        
        # Save uploaded file
        with open(upload_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process video as Celery task
        task = process_uploaded_video.delay(user_identifier, upload_path)
        
        # Increment evaluation count
        increment_evaluation_count(request, current_user)
        
        return {"status": "processing", "task_id": task.id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/video_feed/{user_id}")
async def video_feed(user_id: str, request: Request):
    current_user = await get_current_user_optional(request)
    expected_identifier = get_user_identifier(request, current_user)
    
    print(f"DEBUG: Requested user_id: {user_id}")
    print(f"DEBUG: Expected identifier: {expected_identifier}")
    print(f"DEBUG: Current user: {current_user.email if current_user else 'None'}")
    
    if user_id != expected_identifier:
        print(f"DEBUG: MISMATCH - Got {user_id}, expected {expected_identifier}")
        raise HTTPException(status_code=403, detail="Access denied")
    
    # rest of video feed code...
    
    def generate():
        idle_sleep = 0.1
        while True:
            try:
                # Get user-specific frame
                frame = evaluate_module.get_user_latest_frame(user_id)
            except Exception:
                frame = None
            if frame is not None:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                time.sleep(0.05)
            else:
                time.sleep(idle_sleep)
    
    return StreamingResponse(
        generate(), 
        media_type='multipart/x-mixed-replace; boundary=frame'
    )

@app.get("/api/report")
async def api_report(request: Request):
    """Get user-specific report"""
    try:
        current_user = await get_current_user_optional(request)
        user_identifier = get_user_identifier(request, current_user)
        
        # Check trial status
        if current_user:
            trial_status = get_user_trial_status(current_user)
        else:
            trial_status = check_device_trial(request)
            
        if trial_status.trial_expired and not trial_status.is_trial_active:
            raise HTTPException(
                status_code=403,
                detail="Trial expired. Please create an account to view reports."
            )
        
        # Get user-specific report
        user_report_path = f"user_data/{user_identifier}/report.txt"
        if not os.path.exists(user_report_path):
            raise HTTPException(status_code=404, detail={"error": "No report available"})
        
        data = evaluate_module.get_user_report_data(user_identifier)
        if (data["confidence_score"] == 0 and 
            not data["video_analysis"] and 
            data["transcribed_text"] == "No transcript available"):
            raise HTTPException(status_code=404, detail={"error": "No report available"})
            
        return data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download-report")
async def download_report(request: Request):
    """Download user-specific report"""
    try:
        current_user = await get_current_user_optional(request)
        user_identifier = get_user_identifier(request, current_user)
        
        # Check trial status
        if current_user:
            trial_status = get_user_trial_status(current_user)
        else:
            trial_status = check_device_trial(request)
            
        if trial_status.trial_expired and not trial_status.is_trial_active:
            raise HTTPException(
                status_code=403,
                detail="Trial expired. Please create an account to download reports."
            )
        
        user_report_path = f"user_data/{user_identifier}/report.txt"
        if os.path.exists(user_report_path):
            return FileResponse(
                path=user_report_path,
                filename='presentation_report.txt',
                media_type='text/plain'
            )
        raise HTTPException(status_code=404, detail="Report not found. Please run an evaluation first.")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/report")
async def report():
    return RedirectResponse(url="http://localhost:5173/report", status_code=302)

# Health check endpoints
@app.get("/health")
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

@app.get("/stats")
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
    
@app.get("/debug/user-identifier")
async def debug_user_identifier(request: Request):
    current_user = await get_current_user_optional(request)
    expected_identifier = get_user_identifier(request, current_user)
    return {"expected_identifier": expected_identifier, "user": current_user.email if current_user else None}

if __name__ == "__main__":
    import uvicorn
    
    # Initialize databases
    try:
        connect_to_mongo()
        evaluate_module.init_database()
        
        # Create necessary directories
        os.makedirs("user_data", exist_ok=True)
        os.makedirs("uploads", exist_ok=True)
        os.makedirs("static", exist_ok=True)
        
        print("Starting FastAPI server...")
        print("Make sure to run Celery worker: celery -A celery_app worker --loglevel=info")
        print("Make sure Redis is running on localhost:6379")
        print("Make sure MongoDB is running on localhost:27017")
        
        uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
        
    except Exception as e:
        print(f"Failed to start application: {e}")
        print("Please check that all dependencies are installed and services are running")