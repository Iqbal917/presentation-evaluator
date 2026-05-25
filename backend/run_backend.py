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
    """Check if MongoDB is running."""
    print("=" * 60)
    print("Starting PresentAI Backend")
    print("=" * 60)

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
    """Start FastAPI app."""
    # Ensure we are in the backend directory (supports normal execution and frozen bundles e.g. PyInstaller)
    if getattr(sys, 'frozen', False):
        script_dir = os.path.dirname(sys.executable)
    else:
        script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Determine correct python executable (use virtualenv if present)
    venv_python = os.path.join(script_dir, '.venv', 'Scripts', 'python.exe') if sys.platform == 'win32' else os.path.join(script_dir, '.venv', 'bin', 'python')
    python_exe = venv_python if os.path.exists(venv_python) else sys.executable
    
    # Start FastAPI Application
    print(f"[Starting] FastAPI Application Server using {python_exe}...")
    app_proc = subprocess.Popen([python_exe, '-m', 'app.main'])
    child_processes.append(app_proc)
    
    print("=" * 60)
    print("Backend service is running! Press Ctrl+C to stop.")
    print("=" * 60)
    
    # Keep main thread alive to monitor child process
    try:
        while True:
            time.sleep(1)
            if app_proc.poll() is not None:
                print(f"\n[Warning] Backend process (PID {app_proc.pid}) terminated unexpectedly with code {app_proc.returncode}")
                break
    except KeyboardInterrupt:
        print("\n[Exit request] Received KeyboardInterrupt.")
        # atexit cleanup will be called automatically

if __name__ == '__main__':
    check_prerequisites()
    start_services()
