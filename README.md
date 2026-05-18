# PresentAI — Multi-User Presentation Evaluator & Analytics Platform

<div align="center">
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white" alt="Celery" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" alt="OpenCV" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</div>

<br />

**PresentAI** is an enterprise-grade, multi-user AI-powered presentation evaluation platform designed to help professionals, students, and public speakers master their delivery. By combining state-of-the-art computer vision, acoustic analysis, and natural language processing, PresentAI provides real-time and asynchronous feedback on facial expressions, vocal confidence, pitch steadiness, and speech pacing.

---

## 🌟 Key Features

### 🔒 Multi-User Isolation & High Concurrency
- **Session Isolation**: Fully isolated user evaluation sessions ensure zero data bleed or file conflicts across concurrent users.
- **High Concurrency**: Engineered with Celery background workers and Redis caching to effortlessly handle **50+ simultaneous presentation evaluations** without server blocking.

### 📹 Real-Time Live Analysis
- **Advanced Emotion Detection**: Live facial expression tracking using **DeepFace** and **OpenCV** Haar Cascades to analyze audience engagement, speaker composure, and emotional distribution.
- **Vocal Confidence & Pitch Tracking**: Real-time acoustic pitch extraction via **Praat-Parselmouth** to measure vocal steadiness, tone consistency, and confidence levels.
- **Live Video Feed Overlay**: Real-time MJPEG video streaming (`/video_feed/{user_id}`) complete with live bounding boxes, emotion tags, and elapsed session timers.

### 📤 Asynchronous Video Upload Processing
- **Non-Blocking Uploads**: Support for pre-recorded video uploads (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`).
- **Background Processing**: Videos are processed asynchronously in the background via Celery workers, allowing users to navigate the dashboard freely while analysis completes.

### 🎙️ Automated Transcription & Speech Analysis
- **Speech-to-Text**: Converts presentation audio to text using the **Google Web Speech API**, featuring an offline fallback mechanism powered by **PocketSphinx**.
- **Transcript Cleaning**: Automatically identifies and collapses excessive consecutive repeated words or filler sounds to provide a clean, readable presentation transcript.

### 📊 Comprehensive Reporting & Visual Analytics
- **Performance Scoring**: Calculates an overarching **Confidence Score (0-100)** and assigns a professional confidence rating (High, Moderate, Low).
- **Visual Charts**: Automatically generates high-resolution **Matplotlib** charts, including emotion distribution bar charts and confidence breakdown pie charts.
- **Downloadable Reports**: Users can export their full evaluation summary and metrics as a structured text report.

### 💡 Smart Improvement Suggestions
- **Curated Feedback Engine**: Integrated SQLite database (`resources.db`) dynamically matches speaker weaknesses (e.g., low pitch variance, negative emotion dominance) with actionable expert advice, breathing exercises, and top TED Talk resources.

### 🛡️ Enterprise Security & Rate Limiting
- **Adaptive Rate Limiting**: Built-in IP and user-level rate limiting via **SlowAPI** and Redis to prevent abuse and API exhaustion.
- **Device Fingerprinting & Trial Tracking**: Generates unique device fingerprints to seamlessly manage free trial access without requiring immediate user registration.
- **Role-Based Access Control (RBAC)**: Secure JWT authentication backing premium user tiers and administrative system monitoring.

### 🧹 Automated Data Lifecycle Management
- **Scheduled Cleanup**: Configured Celery Beat periodic tasks (`cleanup_old_user_data`) automatically purge temporary user evaluation files and media older than 7 days, maintaining optimal server storage health.

---

## 🏗️ System Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React + Vite)                    │
│    GSAP Animations │ Tailwind CSS v4 │ Context API (Auth/Theme) │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP / REST / MJPEG Stream
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend API (FastAPI)                       │
│    SlowAPI Rate Limiting │ JWT Authentication │ Pydantic Models │
└────────┬───────────────────────┬───────────────────────┬────────┘
         │                       │                       │
         │ Celery Task Dispatch  │ Session / Cache       │ Auth / Profiles
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Celery Workers  │    │  Redis Instance  │    │ MongoDB Database │
│ (Async Video/AI) │    │ (Cache / Broker) │    │ (Users / Trials) │
└────────┬─────────┘    └──────────────────┘    └──────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AI & Analytics Engine                     │
│  DeepFace (Emotion) │ OpenCV (Vision) │ Parselmouth (Acoustic)  │
│      SpeechRecognition (NLP) │ Matplotlib (Visual Charts)       │
└────────────────────────────────┬────────────────────────────────┘
                                 ▼
                        ┌──────────────────┐
                        │ SQLite Database  │
                        │ (Curated Tips)   │
                        └──────────────────┘
```

### Core Technologies
- **Frontend**: React 19, Vite, Tailwind CSS v4, GSAP (Dynamic Micro-Animations), React Context API.
- **Backend**: FastAPI, Uvicorn, Python 3.10+, Pydantic 2.x, SlowAPI.
- **AI & Computer Vision**: DeepFace, OpenCV, MediaPipe, Praat-Parselmouth, SpeechRecognition, FFmpeg / MoviePy.
- **Distributed Queues & Caching**: Celery 5.x, Redis 4.x.
- **Databases**: MongoDB (User Data & Auth), SQLite (Improvement Resources).

---

## 📂 Directory Structure

```text
presentation-evaluator/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints/         # Modular API routers (auth, evaluation, video, reporting, system)
│   │   ├── core/                  # Core singletons (celery_app, database, limiter, redis_client, security)
│   │   ├── models/                # Pydantic data schemas
│   │   ├── services/              # Business logic & AI evaluation engine (evaluate_module.py)
│   │   ├── worker/                # Celery background tasks & scheduled cleanup (tasks.py)
│   │   └── main.py                # FastAPI application entry point
│   ├── start_services.sh          # Quick-start shell script for background daemons
│   ├── run_backend.py             # Python runner script for managing background services
│   ├── requirements.txt           # Python backend dependencies
│   ├── pretrained.xml / haarcascade # OpenCV face detection models
│   ├── resources.db               # SQLite database containing improvement suggestions
│   ├── static/                    # Generated performance graphs & static assets
│   ├── uploads/                   # Temporary directory for user video uploads
│   └── user_data/                 # Isolated per-user evaluation data and reports
└── frontend/
    ├── src/
    │   ├── components/            # Reusable UI components (AuthModal, TrialBanner, FeatureCard)
    │   ├── context/               # React Context (AuthProvider, ThemeContext)
    │   ├── hooks/                 # Custom React hooks (useAuth)
    │   ├── utils/                 # API client utilities (api.js)
    │   ├── App.jsx                # Main application view & routing logic
    │   ├── index.css              # Tailwind CSS styles & base layers
    │   └── main.jsx               # React DOM entry point
    ├── package.json               # Frontend dependencies & Vite scripts
    ├── tailwind.config.js         # Tailwind CSS configuration
    └── vite.config.js             # Vite bundler configuration
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your system:
1. **Python 3.10+**
2. **Node.js 18+** (with `npm`)
3. **Redis Server** (running on default port `6379`)
4. **MongoDB Server** (running locally on default port `27017` or a MongoDB Atlas cluster)
5. **FFmpeg** (required for audio extraction from video uploads)

---

### Step 1: Clone & Configure Environment

Clone the repository and set up your environment variables.

#### Backend Environment (`backend/.env`)
Create a `.env` file inside the `backend/` directory:
```env
SECRET_KEY=your_super_secret_jwt_signing_key_here
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=presentation_evaluator
REDIS_URL=redis://localhost:6379/0
REDIS_SESSION_DB=redis://localhost:6379/1
CELERY_BROKER_URL=redis://localhost:6379/2
```

#### Frontend Environment (`frontend/.env`)
Create a `.env` file inside the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000
```

---

### Step 2: Backend Setup

Navigate to the backend directory, install the Python dependencies, and verify your database connections.

```bash
cd backend

# Create a virtual environment (optional but recommended)
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install required dependencies
pip install -r requirements.txt
```

---

### Step 3: Start Backend Services

For the platform to function properly, you need to start **Redis**, **Celery Workers**, **Celery Beat**, and the **FastAPI Server**.

#### Option A: Quick-Start Script (Linux / macOS)
```bash
cd backend
chmod +x start_services.sh
./start_services.sh

# Once background workers are running, start FastAPI:
python -m app.main
```

#### Option B: Manual Startup (Separate Terminals)
```bash
# Terminal 1: Start Redis Server
redis-server

# Terminal 2: Start Celery Worker
cd backend
celery -A app.core.celery_app worker --loglevel=info

# Terminal 3: Start Celery Beat (Scheduled Cleanup)
cd backend
celery -A app.core.celery_app beat --loglevel=info

# Terminal 4: Start FastAPI Application
cd backend
python -m app.main
```
*FastAPI will start running on `http://localhost:5000`.*

---

### Step 4: Frontend Setup & Execution

Open a new terminal, navigate to the frontend directory, install dependencies, and start the Vite development server.

```bash
cd frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
```
*The React frontend will be accessible at `http://localhost:5173`.*

---

## 📡 API Reference

Here is a summary of the primary REST API endpoints available in PresentAI:

### Authentication & Users
| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/auth/register` | `POST` | Register a new user account | No |
| `/auth/login` | `POST` | Authenticate user and return JWT access token | No |
| `/auth/me` | `GET` | Get current logged-in user profile details | Yes |
| `/auth/trial-status`| `GET` | Get remaining free trial evaluations for device/user | No |

### Evaluation & Analysis
| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/start-evaluation` | `POST` | Start a live real-time presentation analysis session | Optional (Trial/JWT) |
| `/stop-evaluation` | `POST` | Stop an active live evaluation session | Optional (Trial/JWT) |
| `/evaluation-status`| `GET` | Poll current status of Celery evaluation task | Optional (Trial/JWT) |
| `/api/metrics` | `GET` | Get real-time live emotion and pitch metrics | Optional (Trial/JWT) |
| `/video_feed/{id}` | `GET` | Live MJPEG video stream with AI detection overlay | Optional (Trial/JWT) |
| `/upload_video` | `POST` | Upload a pre-recorded presentation video for analysis | Optional (Trial/JWT) |

### Reporting & System
| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/report` | `GET` | Fetch detailed evaluation report, scores, and suggestions | Optional (Trial/JWT) |
| `/download-report` | `GET` | Download evaluation summary as a `.txt` file | Optional (Trial/JWT) |
| `/health` | `GET` | Check system health (Redis, MongoDB, Celery workers) | No |
| `/stats` | `GET` | Get administrative system statistics | Yes (Premium/Admin) |

---

## 🛠️ Troubleshooting & Tips

- **Camera Access Errors**: If the live evaluation fails to access your webcam, ensure your browser permissions allow camera access for `http://localhost:5173` and that no other application (e.g., Zoom, Teams) is actively locking the camera.
- **Video Upload Processing Fails**: Ensure `ffmpeg` is installed and added to your system's `PATH`. Celery relies on FFmpeg to extract audio tracks from uploaded video containers.
- **Redis Connection Refused**: Verify that your Redis server is actively running (`redis-cli ping` should return `PONG`). Check `REDIS_URL` in your `.env` file if running Redis on a custom port or Docker container.
- **Missing Haar Cascade XML**: If OpenCV throws an error regarding missing cascade files, ensure `pretrained.xml` or `haarcascade_frontalface_default.xml` is present in the `backend/` root directory.

---

## 📄 License

This project is proprietary and developed for enterprise presentation analytics. All rights reserved.
