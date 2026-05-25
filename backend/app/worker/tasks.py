import os
from datetime import datetime
from app.core.app_state import AppState
from app.services import evaluate_module


def process_real_time_evaluation(user_id: str, task_id: str):
    """Process real-time evaluation for a specific user"""
    try:
        AppState.set_task_status(user_id, {
            "status": "running",
            "task_id": task_id,
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

        AppState.set_task_status(user_id, {
            "status": "completed",
            "task_id": task_id,
            "completed_at": datetime.utcnow().isoformat(),
            "result": result
        })

        return {"status": "completed", "user_id": user_id, "result": result}
    except Exception as exc:
        AppState.set_task_status(user_id, {
            "status": "failed",
            "task_id": task_id,
            "error": str(exc),
            "failed_at": datetime.utcnow().isoformat()
        })
        print(f"[worker] Evaluation failed for user {user_id}: {exc}")
        return {"status": "failed", "user_id": user_id, "error": str(exc)}


def process_uploaded_video(user_id: str, video_path: str, output_dir: str, task_id: str):
    """Process uploaded video for a specific user"""
    try:
        # Create user-specific directory
        user_dir = output_dir
        os.makedirs(user_dir, exist_ok=True)
        os.makedirs(f"{user_dir}/static", exist_ok=True)

        AppState.set_task_status(user_id, {
            "status": "processing_video",
            "task_id": task_id,
            "started_at": datetime.utcnow().isoformat()
        })

        # Process video with user-specific paths
        result = evaluate_module.process_user_uploaded_video(
            user_id=user_id,
            filepath=video_path,
            output_dir=user_dir
        )

        AppState.set_task_status(user_id, {
            "status": "completed",
            "task_id": task_id,
            "completed_at": datetime.utcnow().isoformat(),
            "result": result
        })

        # Clean up uploaded file
        if os.path.exists(video_path):
            os.remove(video_path)

        return {"status": "completed", "user_id": user_id, "result": result}
    except Exception as exc:
        AppState.set_task_status(user_id, {
            "status": "failed",
            "task_id": task_id,
            "error": str(exc),
            "failed_at": datetime.utcnow().isoformat()
        })
        print(f"[worker] Upload processing failed for user {user_id}: {exc}")
        return {"status": "failed", "user_id": user_id, "error": str(exc)}


def cleanup_old_user_data():
    """Cleanup old user data"""
    import shutil
    from datetime import datetime, timedelta

    cutoff_date = datetime.utcnow() - timedelta(days=7)

    if os.path.exists("user_data"):
        for user_dir in os.listdir("user_data"):
            user_path = os.path.join("user_data", user_dir)
            if os.path.isdir(user_path):
                mod_time = datetime.fromtimestamp(os.path.getmtime(user_path))
                if mod_time < cutoff_date:
                    try:
                        shutil.rmtree(user_path)
                        print(f"Cleaned up old data for user: {user_dir}")
                    except Exception as e:
                        print(f"Failed to cleanup {user_dir}: {e}")
