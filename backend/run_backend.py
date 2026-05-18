import subprocess
import sys
import os
import time
import socket
import atexit
import signal

# List to keep track of all spawned child processes
child_processes = []

def cleanup():
    """Terminate all child processes cleanly on exit."""
    print("\n[Shutting down] Terminating all background services...")
    for p in child_processes:
        try:
            if p.poll() is None:  # Process is still running
                p.terminate()
                p.wait(timeout=3)
        except Exception as e:
            print(f"Error terminating process {p.pid}: {e}")
    print("[Shutting down] All services stopped successfully.")

# Register cleanup function to run on exit
atexit.register(cleanup)

def handle_signal(signum, frame):
    """Handle termination signals to ensure cleanup is called."""
    sys.exit(0)

signal.signal(signal.SIGINT, handle_signal)
signal.signal(signal.SIGTERM, handle_signal)

def is_port_in_use(port, host='127.0.0.1'):
    """Check if a port is in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0

def check_prerequisites():
    """Check if Redis and MongoDB are running."""
    print("=" * 60)
    print("Starting PresentAI Backend & Background Services")
    print("=" * 60)
    
    # Check Redis
    print("[Checking] Redis server (port 6379)...", end=" ")
    if is_port_in_use(6379):
        print("RUNNING")
    else:
        print("NOT RUNNING")
        print("[Attempting] Starting redis-server...")
        try:
            # Attempt to start redis-server
            p = subprocess.Popen(['redis-server'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            child_processes.append(p)
            time.sleep(2)
            if is_port_in_use(6379):
                print("[Success] Redis server started.")
            else:
                print("[Warning] Could not confirm Redis started. Ensure Redis is running or installed.")
        except FileNotFoundError:
            print("[Warning] redis-server executable not found in PATH.")
            print("Please ensure Redis is running manually (e.g., via Memurai, WSL, or Windows Service).")

    # Check MongoDB
    print("[Checking] MongoDB server (port 27017)...", end=" ")
    if is_port_in_use(27017):
        print("RUNNING")
    else:
        print("NOT RUNNING")
        print("[Warning] MongoDB does not appear to be running on localhost:27017.")
        print("If using MongoDB Atlas or custom port, ensure MONGODB_URL in .env is correctly configured.")
    print("-" * 60)

def start_services():
    """Start Celery worker, Celery beat, and FastAPI app."""
    # Ensure we are in the backend directory (supports normal execution and frozen bundles e.g. PyInstaller)
    if getattr(sys, 'frozen', False):
        script_dir = os.path.dirname(sys.executable)
    else:
        script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # 1. Start Celery Worker
    print("[Starting] Celery Worker...")
    celery_cmd = ['celery', '-A', 'app.core.celery_app', 'worker', '--loglevel=info']
    if sys.platform == 'win32':
        # Windows requires --pool=solo for reliable celery execution
        celery_cmd.append('--pool=solo')
    
    worker_proc = subprocess.Popen(celery_cmd)
    child_processes.append(worker_proc)
    time.sleep(2)
    
    # 2. Start Celery Beat
    print("[Starting] Celery Beat Scheduler...")
    beat_cmd = ['celery', '-A', 'app.core.celery_app', 'beat', '--loglevel=info']
    beat_proc = subprocess.Popen(beat_cmd)
    child_processes.append(beat_proc)
    time.sleep(2)
    
    # 3. Start FastAPI Application
    print("[Starting] FastAPI Application Server...")
    app_proc = subprocess.Popen([sys.executable, '-m', 'app.main'])
    child_processes.append(app_proc)
    
    print("=" * 60)
    print("All backend services are running! Press Ctrl+C to stop all services.")
    print("=" * 60)
    
    # Keep main thread alive to monitor child processes
    try:
        while True:
            time.sleep(1)
            # Check if any process terminated unexpectedly
            for p in child_processes:
                if p.poll() is not None and p in [worker_proc, beat_proc, app_proc]:
                    print(f"\n[Warning] Service process (PID {p.pid}) terminated unexpectedly with code {p.returncode}")
    except KeyboardInterrupt:
        print("\n[Exit request] Received KeyboardInterrupt.")
        # atexit cleanup will be called automatically

if __name__ == '__main__':
    check_prerequisites()
    start_services()
