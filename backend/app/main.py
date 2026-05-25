import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Core imports
from app.core.limiter import limiter
from app.core.database import connect_to_mongo
from app.services import evaluate_module

# API Routers
from app.api.endpoints import auth, evaluation, video, reporting, system

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing databases...")
    try:
        connect_to_mongo()
        evaluate_module.init_database()
        print("Databases initialized successfully.")
    except Exception as e:
        print(f"Database initialization warning/error: {e}")
    yield

app = FastAPI(
    title="PresentAI Backend",
    description="Backend API for Presentation Evaluator with Multi-User Support",
    version="2.0.0",
    lifespan=lifespan,
)

# Rate Limiter setup
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files mount
os.makedirs("static", exist_ok=True)
os.makedirs("user_data", exist_ok=True)
os.makedirs("uploads", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/user_data", StaticFiles(directory="user_data"), name="user_data")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing databases...")
    try:
        connect_to_mongo()
        evaluate_module.init_database()
        print("Databases initialized successfully.")
    except Exception as e:
        print(f"Database initialization warning/error: {e}")
    yield

# Include Routers
app.include_router(auth.router)
app.include_router(evaluation.router)
app.include_router(video.router)
app.include_router(reporting.router)
app.include_router(system.router)

if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server...")
    print("Make sure MongoDB is running on localhost:27017")
    uvicorn.run("app.main:app", host="0.0.0.0", port=5000, reload=True)
