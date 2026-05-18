from fastapi import APIRouter, Request, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
import os
import time
import re
import unicodedata
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
async def upload_video(request: Request, file: UploadFile = File(...)):
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
        
        # Process video as Celery task
        task = process_uploaded_video.delay(user_identifier, upload_path)
        
        # Increment evaluation count
        increment_evaluation_count(request, current_user)
        
        return {"status": "processing", "task_id": task.id}
        
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
    
    if user_id != expected_identifier:
        print(f"DEBUG: MISMATCH - Got {user_id}, expected {expected_identifier}")
        raise HTTPException(status_code=403, detail="Access denied")
    
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
