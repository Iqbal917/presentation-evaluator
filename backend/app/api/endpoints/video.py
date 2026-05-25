from fastapi import APIRouter, Request, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
import os
import time
import re
import unicodedata
import uuid
from app.core.app_state import AppState
from app.core.limiter import limiter
from app.core.security import get_current_user_optional, get_user_identifier, increment_evaluation_count
from app.worker.tasks import process_uploaded_video
from app.services import evaluate_module

router = APIRouter(tags=["Video Processing"])

ALLOWED_VIDEO_EXTENSIONS = {"mp4", "mov", "avi", "mkv", "webm"}

def secure_filename(filename: str) -> str:
    """Secure a filename by removing dangerous characters."""
    filename = unicodedata.normalize('NFKD', filename)
    filename = re.sub(r'[^\w\s\-_.]', '', filename).strip()
    filename = re.sub(r'[-\s]+', '_', filename)
    return filename

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS

@router.post("/upload_video")
@limiter.limit("5/minute")
async def upload_video(request: Request, file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    try:
        current_user = await get_current_user_optional(request)
        user_identifier = get_user_identifier(request, current_user)
        
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
        
        # Process video in a background task, with in-process status tracking
        task_id = str(uuid.uuid4())
        AppState.set_task_status(user_identifier, {
            "status": "processing_video",
            "task_id": task_id,
            "started_at": time.time()
        })
        background_tasks.add_task(process_uploaded_video, user_identifier, upload_path, user_upload_dir, task_id)

        # Increment evaluation count
        increment_evaluation_count(request, current_user)

        return {"status": "processing", "task_id": task_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/video_feed/{user_id}")
async def video_feed(user_id: str, request: Request):
    current_user = await get_current_user_optional(request)
    expected_identifier = get_user_identifier(request, current_user)
    
    print(f"DEBUG: Requested user_id: {user_id}")
    print(f"DEBUG: Expected identifier: {expected_identifier}")
    print(f"DEBUG: Current user: {current_user.email if current_user else 'None'}")
    # If the client is authenticated, require the expected identifier (user id)
    # For unauthenticated/device clients, accept the path-provided user_id so
    # frontend-generated device IDs (or a header) will work.
    if current_user:
        feed_user_id = expected_identifier
        if user_id != expected_identifier:
            print(f"DEBUG: AUTH MISMATCH - Got {user_id}, expected {expected_identifier}. Using expected identifier for feed.")
    else:
        feed_user_id = user_id
    
    def generate():
        idle_sleep = 0.1
        while True:
            try:
                # Get user-specific frame using the derived identifier
                frame = evaluate_module.get_user_latest_frame(feed_user_id)
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
