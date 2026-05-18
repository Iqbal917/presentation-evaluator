from app.core.celery_app import celery_app
from app.core.redis_client import RedisManager
from app.services import evaluate_module
import os
import json
from datetime import datetime

@celery_app.task(bind=True)
def process_real_time_evaluation(self, user_id: str):
    """Process real-time evaluation for a specific user"""
    try:
        # Update task status
        RedisManager.set_evaluation_status(user_id, {
            "status": "running",
            "task_id": self.request.id,
            "started_at": datetime.utcnow().isoformat()
        })
        
        # Create user-specific directory
        user_dir = f"user_data/{user_id}"
        os.makedirs(user_dir, exist_ok=True)
        os.makedirs(f"{user_dir}/static", exist_ok=True)
        
        # Run evaluation with user-specific paths
        result = evaluate_module.run_user_evaluation(
            user_id=user_id,
            output_dir=user_dir
        )
        
        # Update status to completed
        RedisManager.set_evaluation_status(user_id, {
            "status": "completed",
            "task_id": self.request.id,
            "completed_at": datetime.utcnow().isoformat(),
            "result": result
        })
        
        return {"status": "completed", "user_id": user_id, "result": result}
        
    except Exception as exc:
        # Update status to failed
        RedisManager.set_evaluation_status(user_id, {
            "status": "failed",
            "task_id": self.request.id,
            "error": str(exc),
            "failed_at": datetime.utcnow().isoformat()
        })
        
        # Retry logic
        self.retry(exc=exc, countdown=60, max_retries=3)

@celery_app.task(bind=True)
def process_uploaded_video(self, user_id: str, video_path: str):
    """Process uploaded video for a specific user"""
    try:
        # Create user-specific directory
        user_dir = f"user_data/{user_id}"
        os.makedirs(user_dir, exist_ok=True)
        os.makedirs(f"{user_dir}/static", exist_ok=True)
        
        # Update task status
        RedisManager.set_evaluation_status(user_id, {
            "status": "processing_video",
            "task_id": self.request.id,
            "started_at": datetime.utcnow().isoformat()
        })
        
        # Process video with user-specific paths
        result = evaluate_module.process_user_uploaded_video(
            user_id=user_id,
            filepath=video_path,
            output_dir=user_dir
        )
        
        # Update status to completed
        RedisManager.set_evaluation_status(user_id, {
            "status": "completed",
            "task_id": self.request.id,
            "completed_at": datetime.utcnow().isoformat(),
            "result": result
        })
        
        # Clean up uploaded file
        if os.path.exists(video_path):
            os.remove(video_path)
        
        return {"status": "completed", "user_id": user_id, "result": result}
        
    except Exception as exc:
        RedisManager.set_evaluation_status(user_id, {
            "status": "failed",
            "task_id": self.request.id,
            "error": str(exc),
            "failed_at": datetime.utcnow().isoformat()
        })
        
        self.retry(exc=exc, countdown=60, max_retries=3)

@celery_app.task
def cleanup_old_user_data():
    """Cleanup old user data (run daily)"""
    import shutil
    from datetime import datetime, timedelta
    
    # Remove user data older than 7 days
    cutoff_date = datetime.utcnow() - timedelta(days=7)
    
    if os.path.exists("user_data"):
        for user_dir in os.listdir("user_data"):
            user_path = os.path.join("user_data", user_dir)
            if os.path.isdir(user_path):
                # Check directory modification time
                mod_time = datetime.fromtimestamp(os.path.getmtime(user_path))
                if mod_time < cutoff_date:
                    try:
                        shutil.rmtree(user_path)
                        print(f"Cleaned up old data for user: {user_dir}")
                    except Exception as e:
                        print(f"Failed to cleanup {user_dir}: {e}")

# Periodic task setup
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    'cleanup-old-data': {
        'task': 'app.worker.tasks.cleanup_old_user_data',
        'schedule': crontab(hour=2, minute=0),  # Run daily at 2 AM
    },
}

celery_app.conf.timezone = 'UTC'
