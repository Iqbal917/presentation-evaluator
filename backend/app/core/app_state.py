import threading
from typing import Any, Dict, Optional

# In-memory application state for active evaluations and video processing.
# This file provides a thread-safe local state store used by endpoints and workers.

_task_statuses: Dict[str, Dict[str, Any]] = {}
_task_lock = threading.Lock()


def set_task_status(user_id: str, status: Dict[str, Any]):
    with _task_lock:
        _task_statuses[user_id] = status


def get_task_status(user_id: str) -> Optional[Dict[str, Any]]:
    with _task_lock:
        status = _task_statuses.get(user_id)
        return dict(status) if status is not None else None


def clear_task_status(user_id: str):
    with _task_lock:
        _task_statuses.pop(user_id, None)


def get_active_task_count() -> int:
    with _task_lock:
        return sum(1 for status in _task_statuses.values() if status.get("status") in {"running", "processing_video"})


class AppState:
    @staticmethod
    def set_task_status(user_id: str, status: Dict[str, Any]):
        set_task_status(user_id, status)

    @staticmethod
    def get_task_status(user_id: str) -> Optional[Dict[str, Any]]:
        return get_task_status(user_id)

    @staticmethod
    def clear_task_status(user_id: str):
        clear_task_status(user_id)

    @staticmethod
    def get_active_task_count() -> int:
        return get_active_task_count()
