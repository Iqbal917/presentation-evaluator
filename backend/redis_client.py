# redis_client.py
import redis
import json
from decouple import config
from typing import Optional, Dict, Any

# Redis configuration
REDIS_URL = config("REDIS_URL", default="redis://localhost:6379/0")
REDIS_SESSION_DB = config("REDIS_SESSION_DB", default="redis://localhost:6379/1")

# Redis clients
redis_client = redis.from_url(REDIS_URL, decode_responses=True)
session_redis = redis.from_url(REDIS_SESSION_DB, decode_responses=True)

class RedisManager:
    """Redis operations manager"""
    redis_client = redis_client
    session_redis = session_redis
    
    @staticmethod
    def set_user_session(user_id: str, session_data: Dict[str, Any], expire_seconds: int = 3600):
        """Set user session data"""
        key = f"session:{user_id}"
        session_redis.setex(key, expire_seconds, json.dumps(session_data, default=str))
    
    @staticmethod
    def get_user_session(user_id: str) -> Optional[Dict[str, Any]]:
        """Get user session data"""
        key = f"session:{user_id}"
        data = session_redis.get(key)
        return json.loads(data) if data else None
    
    @staticmethod
    def delete_user_session(user_id: str):
        """Delete user session"""
        key = f"session:{user_id}"
        session_redis.delete(key)
    
    @staticmethod
    def set_evaluation_status(user_id: str, status: Dict[str, Any]):
        """Set evaluation status for user"""
        key = f"eval_status:{user_id}"
        redis_client.setex(key, 1800, json.dumps(status, default=str))  # 30 min expiry
    
    @staticmethod
    def get_evaluation_status(user_id: str) -> Optional[Dict[str, Any]]:
        """Get evaluation status for user"""
        key = f"eval_status:{user_id}"
        data = redis_client.get(key)
        return json.loads(data) if data else None
    
    @staticmethod
    def delete_evaluation_status(user_id: str):
        """Delete evaluation status"""
        key = f"eval_status:{user_id}"
        redis_client.delete(key)
    
    @staticmethod
    def cache_trial_status(identifier: str, trial_data: Dict[str, Any], expire_seconds: int = 300):
        """Cache trial status (5 min cache)"""
        key = f"trial:{identifier}"
        redis_client.setex(key, expire_seconds, json.dumps(trial_data, default=str))
    
    @staticmethod
    def get_cached_trial_status(identifier: str) -> Optional[Dict[str, Any]]:
        """Get cached trial status"""
        key = f"trial:{identifier}"
        data = redis_client.get(key)
        # Clear cache after reading to ensure fresh data next time
        if data:
            redis_client.delete(key)
            return json.loads(data)
        return None
    
    @staticmethod
    def increment_rate_limit(identifier: str, window_seconds: int = 60) -> int:
        """Increment rate limit counter"""
        key = f"rate_limit:{identifier}"
        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds)
        results = pipe.execute()
        return results[0]
    
    @staticmethod
    def set_user_metrics(user_id: str, metrics: Dict[str, Any]):
        """Set current metrics for user"""
        key = f"metrics:{user_id}"
        redis_client.setex(key, 60, json.dumps(metrics, default=str))  # 1 min expiry
    
    @staticmethod
    def get_user_metrics(user_id: str) -> Optional[Dict[str, Any]]:
        """Get current metrics for user"""
        key = f"metrics:{user_id}"
        data = redis_client.get(key)
        return json.loads(data) if data else None


