import pyaudio
import wave
import numpy as np
import queue
import threading
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import speech_recognition as sr
import time
import sqlite3
import os
import json
import re
from collections import deque
from statistics import median
from typing import Dict, Optional
from redis_client import RedisManager

# === CONSTANTS ===
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100  # Preferred sample rate; will fall back if device doesn't support
UPLOADS_DIR = "uploads"

# === GLOBAL VARIABLES FOR MULTI-USER SUPPORT ===
# Store user-specific data
user_sessions: Dict[str, Dict] = {}
user_threads: Dict[str, threading.Thread] = {}
lock = threading.Lock()
face_detect = None  # Will be initialized lazily

def init_user_session(user_id: str, output_dir: str):
    """Initialize user session with specific paths"""
    with lock:
        user_sessions[user_id] = {
            "output_filename": os.path.join(output_dir, "output.wav"),
            "transcript_filename": os.path.join(output_dir, "transcript.txt"),
            "video_filename": os.path.join(output_dir, "output.avi"),
            "report_filename": os.path.join(output_dir, "report.txt"),
            "graph_filename": os.path.join(output_dir, "static", "report_plot.png"),
            "audio_queue": queue.Queue(),
            "recording": False,
            "stop_flag": False,
            "pitch_values_list": [],
            "expression_counts": {"happy": 0, "neutral": 0, "sad": 0, "fear": 0, "angry": 0, "surprise": 0},
            "current_metrics": {"expression": "Detecting...", "pitch": 0, "confidence": 0},
            "latest_frame_jpeg": None,
            "user_lock": threading.Lock()
        }

def get_user_session(user_id: str):
    """Get user session data"""
    with lock:
        return user_sessions.get(user_id)

def cleanup_user_session(user_id: str):
    """Clean up user session"""
    with lock:
        if user_id in user_sessions:
            # Stop any recording
            user_sessions[user_id]["recording"] = False
            user_sessions[user_id]["stop_flag"] = True
            del user_sessions[user_id]
        
        if user_id in user_threads:
            del user_threads[user_id]

# === INITIALIZATION ===
def init_face_detector():
    """Initialize face detector with fallback - lazy import"""
    import cv2 as cv  # Lazy import
    
    cascade_paths = [
        'pretrained.xml',
        cv.data.haarcascades + 'haarcascade_frontalface_default.xml',
        'haarcascade_frontalface_default.xml'
    ]
    
    for path in cascade_paths:
        if os.path.exists(path):
            return cv.CascadeClassifier(path)
        try:
            detector = cv.CascadeClassifier(path)
            if not detector.empty():
                return detector
        except:
            continue
    
    # Use default if no file found
    return cv.CascadeClassifier(cv.data.haarcascades + 'haarcascade_frontalface_default.xml')

def get_face_detector():
    """Get face detector with lazy initialization"""
    global face_detect
    if face_detect is None:
        face_detect = init_face_detector()
    return face_detect

# === DATABASE SETUP ===
def init_database():
    """Initialize SQLite database with suggestions"""
    conn = sqlite3.connect('resources.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            description TEXT,
            link TEXT
        )
    ''')
    
    # Clear existing data
    cursor.execute('DELETE FROM suggestions')
    
    # Insert sample suggestions
    suggestions_data = [
        ('confidence', 'Practice power poses before presentations', 'https://www.ted.com/talks/amy_cuddy_your_body_language_may_shape_who_you_are'),
        ('confidence', 'Record yourself and review body language', 'https://www.toastmasters.org/resources/public-speaking-tips'),
        ('expression', 'Practice facial expressions in mirror', 'https://www.skillsyouneed.com/ips/nonverbal-communication.html'),
        ('expression', 'Work on emotional engagement techniques', 'https://www.coursera.org/learn/public-speaking'),
        ('speech', 'Vocal warm-up exercises', 'https://www.voices.com/blog/vocal-warm-ups/'),
        ('speech', 'Practice breathing techniques', 'https://www.speechcoachcompany.com/breathing-exercises-for-presentations/')
    ]
    
    cursor.executemany('INSERT INTO suggestions (category, description, link) VALUES (?, ?, ?)', suggestions_data)
    conn.commit()
    conn.close()

# === UTILITY FUNCTIONS ===
def _clean_transcript(text: str) -> str:
    """Collapse excessive consecutive repeated words while preserving original casing."""
    try:
        tokens = text.split()
        cleaned_tokens = []
        last_norm = None
        repeat_count = 0
        for token in tokens:
            norm = re.sub(r"[^A-Za-z0-9]+", "", token).lower()
            if norm and norm == last_norm:
                repeat_count += 1
                if repeat_count < 2:  # allow at most two occurrences total
                    cleaned_tokens.append(token)
            else:
                last_norm = norm
                repeat_count = 0
                cleaned_tokens.append(token)
        cleaned = re.sub(r"\s+", " ", " ".join(cleaned_tokens)).strip()
        return cleaned
    except Exception:
        return text

# === USER-SPECIFIC ANALYSIS FUNCTIONS ===
def analyze_user_audio(user_id: str):
    """Analyze audio for specific user - lazy import"""
    import parselmouth  # Lazy import
    
    session = get_user_session(user_id)
    if not session:
        return
        
    output_filename = session["output_filename"]
    
    try:
        if not os.path.exists(output_filename):
            print(f"[WARNING] Audio file not found for user {user_id}")
            return
            
        # Skip analysis for extremely short files
        try:
            with wave.open(output_filename, 'rb') as wf:
                num_frames = wf.getnframes()
                fr = wf.getframerate()
                duration_sec = num_frames / float(fr or 1)
                if duration_sec < 0.5:
                    print(f"[WARNING] Audio too short for analysis for user {user_id}")
                    return
        except Exception as e:
            print(f"[WARNING] Could not read audio header for user {user_id}: {e}")

        sound = parselmouth.Sound(output_filename)
        pitch = sound.to_pitch(time_step=0.01, pitch_floor=75, pitch_ceiling=300)
        pitch_values = pitch.selected_array['frequency']
        voiced_pitch = pitch_values[(pitch_values > 75) & (pitch_values < 300)]
        
        # Require a minimum amount of voiced data to consider it speech
        if len(voiced_pitch) >= 10:
            avg_pitch = np.mean(voiced_pitch)
            session["pitch_values_list"].append(avg_pitch)
            
            with session["user_lock"]:
                session["current_metrics"]["pitch"] = avg_pitch
                # Update Redis cache
                RedisManager.set_user_metrics(user_id, session["current_metrics"])
            
            print(f"[INFO] User {user_id} Average Voiced Pitch: {avg_pitch:.2f} Hz")
        else:
            print(f"[WARNING] No voiced segments detected for user {user_id}")
            with session["user_lock"]:
                session["current_metrics"]["pitch"] = 0
                RedisManager.set_user_metrics(user_id, session["current_metrics"])
            
    except Exception as e:
        print(f"[ERROR] Audio analysis error for user {user_id}: {e}")

def analyze_user_expression(user_id: str, frame):
    """Analyze facial expression for specific user - lazy import"""
    from deepface import DeepFace  # Lazy import
    
    session = get_user_session(user_id)
    if not session:
        return "neutral"
        
    try:
        result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
        emotion = result[0]['dominant_emotion']
        
        print(f"[INFO] User {user_id} Detected Expression: {emotion}")
        
        if emotion in session["expression_counts"]:
            session["expression_counts"][emotion] += 1
        
        with session["user_lock"]:
            session["current_metrics"]["expression"] = emotion
            RedisManager.set_user_metrics(user_id, session["current_metrics"])
        
        return emotion
    except Exception as e:
        print(f"[ERROR] Expression detection error for user {user_id}: {e}")
        return "neutral"

def compute_user_overall_score(user_id: str):
    """Compute overall confidence score for specific user"""
    session = get_user_session(user_id)
    if not session:
        return 0, "No Data"
        
    expression_counts = session["expression_counts"]
    pitch_values_list = session["pitch_values_list"]
    
    positive_emotions = expression_counts.get("happy", 0) + expression_counts.get("neutral", 0) + expression_counts.get("surprise", 0)
    negative_emotions = expression_counts.get("sad", 0) + expression_counts.get("fear", 0) + expression_counts.get("angry", 0)

    total_emotions = positive_emotions + negative_emotions
    has_pitch_data = len(pitch_values_list) > 0
    has_emotion_data = total_emotions > 0

    # No data at all → no score
    if not has_pitch_data and not has_emotion_data:
        with session["user_lock"]:
            session["current_metrics"]["confidence"] = 0
            RedisManager.set_user_metrics(user_id, session["current_metrics"])
        print(f"[RESULT] User {user_id} No data available to compute score")
        return 0, "No Data"

    # Calculate emotion confidence
    emotion_confidence = (positive_emotions / total_emotions * 100) if total_emotions > 0 else 50

    # Calculate pitch confidence
    avg_pitch = np.mean(pitch_values_list) if has_pitch_data else 0
    pitch_confidence = min(100, (avg_pitch / 150) * 100) if avg_pitch > 0 else 50

    # Combined score (weighted average)
    score = int(0.6 * emotion_confidence + 0.4 * pitch_confidence)

    # Determine confidence level
    if score >= 80:
        level = "High Confidence"
    elif score >= 60:
        level = "Moderate Confidence"
    else:
        level = "Low Confidence"

    print(f"[RESULT] User {user_id} Confidence Score: {score}/100 → {level}")

    with session["user_lock"]:
        session["current_metrics"]["confidence"] = score
        RedisManager.set_user_metrics(user_id, session["current_metrics"])

    return score, level

def save_user_report(user_id: str, score: int, level: str):
    """Save evaluation report for specific user"""
    session = get_user_session(user_id)
    if not session:
        return
        
    try:
        with open(session["report_filename"], "w", encoding="utf-8") as f:
            f.write("📋 Presentation Evaluation Report\n")
            f.write("=" * 35 + "\n")
            f.write(f"Confidence Score: {score} / 100\n")
            f.write(f"Confidence Level: {level}\n")
            
            avg_pitch = np.mean(session["pitch_values_list"]) if session["pitch_values_list"] else 0
            f.write(f"Average Pitch: {avg_pitch:.2f}\n\n")
            
            f.write("Emotion Distribution:\n")
            for k, v in session["expression_counts"].items():
                f.write(f" - {k.capitalize()}: {v}\n")
                
        print(f"[INFO] Report saved for user {user_id}")
    except Exception as e:
        print(f"[ERROR] Failed to save report for user {user_id}: {e}")

def transcribe_user_audio(user_id: str):
    """Transcribe audio to text for specific user"""
    session = get_user_session(user_id)
    if not session:
        return
        
    output_filename = session["output_filename"]
    transcript_filename = session["transcript_filename"]
    
    if not os.path.exists(output_filename):
        print(f"[WARNING] Audio file not found for transcription for user {user_id}")
        return
        
    recognizer = sr.Recognizer()
    try:
        # Skip very short audio
        with wave.open(output_filename, 'rb') as wf:
            duration_sec = wf.getnframes() / float(wf.getframerate() or 1)
            if duration_sec < 0.5:
                with open(transcript_filename, "w", encoding="utf-8") as f:
                    f.write("Audio too short to transcribe")
                print(f"[WARNING] Audio too short to transcribe for user {user_id}")
                return

        with sr.AudioFile(output_filename) as source:
            audio_data = recognizer.record(source)
            transcript = None

            # Primary: Google Web Speech API
            try:
                transcript = recognizer.recognize_google(audio_data, language='en-US')
            except sr.UnknownValueError:
                print(f"[ERROR] Google could not understand audio for user {user_id}")
            except sr.RequestError as e:
                print(f"[ERROR] Google Speech service error for user {user_id}: {e}")

            # Fallback: PocketSphinx (offline) if available
            if transcript is None:
                try:
                    transcript = recognizer.recognize_sphinx(audio_data)
                    print(f"[INFO] Transcription succeeded with PocketSphinx fallback for user {user_id}")
                except Exception:
                    pass

            if transcript is None:
                transcript = "Audio could not be transcribed clearly"

            # Post-process to remove excessive repeated words
            final_text = _clean_transcript(transcript)
            with open(transcript_filename, "w", encoding="utf-8") as f:
                f.write(final_text)
            print(f"[INFO] Transcription saved for user {user_id}: {len(final_text)} characters")
    except Exception as e:
        print(f"[ERROR] Transcription error for user {user_id}: {e}")
        with open(transcript_filename, "w", encoding="utf-8") as f:
            f.write("Transcription failed due to an unexpected error")

def generate_user_graph(user_id: str, score: int, level: str):
    """Generate performance analysis graphs for specific user"""
    session = get_user_session(user_id)
    if not session:
        return
        
    try:
        os.makedirs(os.path.dirname(session["graph_filename"]), exist_ok=True)
        
        avg_pitch = np.mean(session["pitch_values_list"]) if session["pitch_values_list"] else 0
        emotions = list(session["expression_counts"].keys())
        emotion_values = list(session["expression_counts"].values())
        total_emotions = int(np.sum(emotion_values)) if len(emotion_values) else 0

        no_data = (score == 0 and total_emotions == 0 and avg_pitch == 0)

        if no_data:
            # Render a simple placeholder chart without numbers
            fig = plt.figure(figsize=(10, 4))
            ax = fig.add_subplot(111)
            ax.axis('off')
            ax.text(0.5, 0.5, 'No data available.\nStart and stop an evaluation to generate a chart.',
                    ha='center', va='center', fontsize=14)
            plt.savefig(session["graph_filename"], dpi=100, bbox_inches='tight')
            plt.close()
            print(f"[INFO] Placeholder graph saved for user {user_id}")
            return

        # Create figure with subplots
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

        # Bar chart
        colors = ['green' if e in ['happy', 'neutral', 'surprise'] else 'red' for e in emotions]
        bars = ax1.bar(emotions, emotion_values, color=colors)
        ax1.set_title("Emotion Distribution", fontsize=14)
        ax1.set_ylabel("Frequency")
        ax1.set_xlabel("Emotions")
        ax1.tick_params(axis='x', rotation=45)
        ax1.grid(axis='y', linestyle='--', alpha=0.3)

        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            if height > 0:
                ax1.text(bar.get_x() + bar.get_width()/2., height,
                        f'{int(height)}', ha='center', va='bottom')

        # Pie chart for confidence breakdown
        sizes = [score, 100-score]
        colors_pie = ['#2ecc71', '#e74c3c']
        explode = (0.05, 0)

        ax2.pie(sizes, explode=explode, labels=['Confidence', 'Room for Improvement'],
                colors=colors_pie, autopct='%1.1f%%', shadow=True, startangle=90)
        ax2.set_title(f"Confidence Level: {level}", fontsize=14)

        plt.suptitle(f"Presentation Performance Analysis - Score: {score}/100", fontsize=16, y=1.02)
        plt.tight_layout()

        # Save figure
        plt.savefig(session["graph_filename"], dpi=100, bbox_inches='tight')
        plt.close()

        print(f"[INFO] Graph saved for user {user_id}")
        
    except Exception as e:
        print(f"[ERROR] Graph generation failed for user {user_id}: {e}")

def get_suggestions_from_db(categories):
    """Get improvement suggestions from database"""
    try:
        conn = sqlite3.connect('resources.db')
        cursor = conn.cursor()
        result = []
        
        for category in categories:
            cursor.execute("SELECT description, link FROM suggestions WHERE category=?", (category,))
            rows = cursor.fetchall()
            for row in rows:
                result.append({"area": category.capitalize(), "desc": row[0], "resource": row[1]})
                
        conn.close()
        return result
    except Exception as e:
        print(f"[ERROR] Database error: {e}")
        return []

def analyze_user_performance(user_id: str, score: int, level: str):
    """Analyze performance and provide suggestions for specific user"""
    session = get_user_session(user_id)
    if not session:
        return
        
    categories = []
    
    if level == "Low Confidence":
        categories.append("confidence")
        
    expression_counts = session["expression_counts"]
    pitch_values_list = session["pitch_values_list"]
    
    negative_emotions = expression_counts['sad'] + expression_counts['fear'] + expression_counts['angry']
    positive_emotions = expression_counts['happy'] + expression_counts['neutral']
    
    if negative_emotions > positive_emotions:
        categories.append("expression")
        
    if pitch_values_list and np.mean(pitch_values_list) < 100:
        categories.append("speech")
        
    suggestions = get_suggestions_from_db(categories)
    
    if suggestions:
        print(f"\n📘 Suggestions to Improve for user {user_id}:")
        for s in suggestions:
            print(f"[{s['area']}] {s['desc']} → {s['resource']}")

def record_user_audio(user_id: str):
    """Record audio in separate thread for specific user - lazy import"""
    import parselmouth  # Lazy import
    
    session = get_user_session(user_id)
    if not session:
        return
        
    audio = pyaudio.PyAudio()
    stream = None
    frames = []
    chosen_rate = None
    pitch_buffer = bytearray()
    consecutive_silence_windows = 0
    noise_rms_samples = []
    smoothed_pitch = None
    pitch_history = deque(maxlen=5)

    def choose_input_device(pa: pyaudio.PyAudio):
        try:
            default_index = pa.get_default_input_device_info().get('index')
            return default_index
        except Exception:
            # Pick the first device with input channels
            for i in range(pa.get_device_count()):
                try:
                    info = pa.get_device_info_by_index(i)
                    if info.get('maxInputChannels', 0) > 0:
                        return i
                except Exception:
                    continue
        return None

    try:
        device_index = choose_input_device(audio)
        candidate_rates = [RATE, 48000, 32000, 22050, 16000]
        last_err = None
        for test_rate in candidate_rates:
            try:
                stream = audio.open(
                    format=FORMAT,
                    channels=CHANNELS,
                    rate=test_rate,
                    input=True,
                    input_device_index=device_index,
                    frames_per_buffer=CHUNK
                )
                chosen_rate = test_rate
                print(f"[INFO] Audio stream opened at {chosen_rate} Hz for user {user_id}")
                break
            except Exception as e:
                last_err = e
                continue

        if stream is None:
            raise RuntimeError(f"Failed to open audio input for user {user_id}: {last_err}")

        print(f"[INFO] Recording audio for user {user_id}...")
        while session["recording"]:
            data = stream.read(CHUNK, exception_on_overflow=False)
            frames.append(data)
            session["audio_queue"].put(data)
            
            # Real-time pitch analysis
            pitch_buffer.extend(data)
            try:
                target_bytes = int(chosen_rate * 0.5) * 2  # 16-bit mono → 2 bytes/sample
                if len(pitch_buffer) >= target_bytes:
                    np_samples = np.frombuffer(pitch_buffer, dtype=np.int16).astype(np.float32) / 32768.0
                    if np_samples.size > 0:
                        rms = float(np.sqrt(np.mean(np_samples ** 2))) if np_samples.size else 0.0
                        if len(noise_rms_samples) < 10 and rms < 0.02:
                            noise_rms_samples.append(rms)
                        noise_floor = median(noise_rms_samples) if noise_rms_samples else 0.01
                        energy_ok = rms >= max(0.02, noise_floor * 2.0)

                        snd = parselmouth.Sound(np_samples, sampling_frequency=chosen_rate)
                        pt = snd.to_pitch(time_step=0.01, pitch_floor=75, pitch_ceiling=300)
                        freqs = pt.selected_array['frequency']
                        voiced = freqs[(freqs > 75) & (freqs < 300)]
                        voiced_ratio = float(np.count_nonzero(freqs)) / float(len(freqs) or 1)
                        voiced_ok = (voiced.size >= 5) and (voiced_ratio >= 0.25)

                        if energy_ok and voiced_ok:
                            avg = float(np.median(voiced))
                            pitch_history.append(avg)
                            window_med = float(median(pitch_history))
                            if smoothed_pitch is None:
                                smoothed_pitch = window_med
                            else:
                                smoothed_pitch = 0.4 * window_med + 0.6 * smoothed_pitch
                            with session["user_lock"]:
                                session["current_metrics"]["pitch"] = smoothed_pitch
                                RedisManager.set_user_metrics(user_id, session["current_metrics"])
                            consecutive_silence_windows = 0
                        else:
                            consecutive_silence_windows += 1
                            if consecutive_silence_windows >= 2:
                                with session["user_lock"]:
                                    session["current_metrics"]["pitch"] = 0
                                    RedisManager.set_user_metrics(user_id, session["current_metrics"])
                                smoothed_pitch = None
                                pitch_history.clear()
                    pitch_buffer = bytearray()
            except Exception:
                pass
            
    except Exception as e:
        print(f"[ERROR] Audio recording error for user {user_id}: {e}")
    finally:
        if stream:
            try:
                stream.stop_stream()
                stream.close()
            except Exception:
                pass
        try:
            audio.terminate()
        except Exception:
            pass
        
        # Save audio file
        if frames and chosen_rate:
            try:
                with wave.open(session["output_filename"], 'wb') as wf:
                    wf.setnchannels(CHANNELS)
                    wf.setsampwidth(pyaudio.get_sample_size(FORMAT))
                    wf.setframerate(chosen_rate)
                    wf.writeframes(b''.join(frames))
                print(f"[INFO] Audio saved for user {user_id}")
            except Exception as e:
                print(f"[ERROR] Failed to write audio file for user {user_id}: {e}")

# === MAIN EVALUATION FUNCTIONS ===
def run_user_evaluation(user_id: str, output_dir: str):
    """Main evaluation function for specific user - lazy import"""
    import cv2 as cv  # Lazy import
    
    init_user_session(user_id, output_dir)
    session = get_user_session(user_id)
    if not session:
        return {"error": "Failed to initialize user session"}
    
    # Start audio recording thread
    session["recording"] = True
    audio_thread = threading.Thread(target=record_user_audio, args=(user_id,))
    audio_thread.start()
    
    # Initialize video capture
    cap = cv.VideoCapture(0)
    if not cap.isOpened():
        print(f"[ERROR] Cannot open camera for user {user_id}")
        session["recording"] = False
        audio_thread.join()
        cleanup_user_session(user_id)
        return {"error": "Camera not available"}
    
    # Video writer
    fourcc = cv.VideoWriter_fourcc(*'XVID')
    out_video = cv.VideoWriter(session["video_filename"], fourcc, 20.0, (640, 480))
    
    start_time = time.time()
    frame_count = 0
    face_detector = get_face_detector()
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print(f"[ERROR] Failed to capture frame for user {user_id}")
                break
                
            frame = cv.flip(frame, 1)
            out_video.write(frame)
            
            # Face detection and expression analysis (every 10th frame for performance)
            if frame_count % 10 == 0:
                gray = cv.cvtColor(frame, cv.COLOR_BGR2GRAY)
                faces = face_detector.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5, minSize=(30, 30))
                
                for (x, y, w, h) in faces[:1]:  # Process only first face
                    cv.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                    face_roi = frame[y:y+h, x:x+w]
                    
                    if face_roi.size > 0:
                        emotion = analyze_user_expression(user_id, face_roi)
                        cv.putText(frame, f"Expression: {emotion}", (x, y - 10), 
                                 cv.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            
            # Display timer
            elapsed = int(time.time() - start_time)
            cv.putText(frame, f"Time: {elapsed}s", (500, 30), 
                      cv.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # Publish frame for HTTP stream consumers
            try:
                ok_jpg, jpg_buf = cv.imencode('.jpg', frame)
                if ok_jpg:
                    with session["user_lock"]:
                        session["latest_frame_jpeg"] = jpg_buf.tobytes()
            except Exception:
                pass
            
            frame_count += 1
            
            # Check for stop conditions
            if session["stop_flag"] or elapsed > 60:  # Stop after 60 seconds or manual stop
                break
                
    except Exception as e:
        print(f"[ERROR] Video processing error for user {user_id}: {e}")
    finally:
        # Clean up
        session["recording"] = False
        cap.release()
        out_video.release()
        
        # Wait for audio thread
        audio_thread.join()
        
        print(f"[INFO] Processing completed for user {user_id}, generating report...")
        
        # Analysis
        analyze_user_audio(user_id)
        transcribe_user_audio(user_id)
        score, level = compute_user_overall_score(user_id)
        save_user_report(user_id, score, level)
        generate_user_graph(user_id, score, level)
        analyze_user_performance(user_id, score, level)
        
        return {
            "score": score,
            "level": level,
            "user_id": user_id
        }

def stop_user_recording(user_id: str):
    """Stop recording gracefully for specific user"""
    session = get_user_session(user_id)
    if session:
        session["recording"] = False
        session["stop_flag"] = True
        with session["user_lock"]:
            session["latest_frame_jpeg"] = None
        print(f"[INFO] Stop signal sent for user {user_id}")

def process_user_uploaded_video(user_id: str, filepath: str, output_dir: str):
    """Process an uploaded video file for specific user - lazy import"""
    import cv2 as cv  # Lazy import
    
    init_user_session(user_id, output_dir)
    session = get_user_session(user_id)
    if not session:
        return {"error": "Failed to initialize user session"}
        
    try:
        # Open video
        cap = cv.VideoCapture(filepath)
        if not cap.isOpened():
            raise RuntimeError("Cannot open uploaded video")

        frame_count = 0
        sample_every = 10  # analyze every 10th frame for speed
        face_detector = get_face_detector()
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_count += 1
            if frame_count % sample_every != 0:
                continue
            try:
                gray = cv.cvtColor(frame, cv.COLOR_BGR2GRAY)
                faces = face_detector.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5, minSize=(30, 30))
                for (x, y, w, h) in faces[:1]:
                    face_roi = frame[y:y+h, x:x+w]
                    if face_roi.size > 0:
                        analyze_user_expression(user_id, face_roi)
            except Exception:
                continue
        cap.release()

        # Try to extract audio track if available
        try:
            temp_wav = session["output_filename"]
            exit_code = os.system(f"ffmpeg -y -i \"{filepath}\" -vn -ac 1 -ar 44100 -f wav \"{temp_wav}\" > /dev/null 2>&1")
            if exit_code == 0 and os.path.exists(temp_wav):
                analyze_user_audio(user_id)
                transcribe_user_audio(user_id)
        except Exception:
            pass

        score, level = compute_user_overall_score(user_id)
        save_user_report(user_id, score, level)
        generate_user_graph(user_id, score, level)
        analyze_user_performance(user_id, score, level)
        
        return {
            "score": score,
            "level": level,
            "user_id": user_id
        }
        
    except Exception as e:
        print(f"[ERROR] Failed to process uploaded video for user {user_id}: {e}")
        return {"error": str(e)}
    finally:
        cleanup_user_session(user_id)

def get_user_current_metrics(user_id: str):
    """Get current metrics for real-time display for specific user"""
    # Try Redis first (most up-to-date)
    metrics = RedisManager.get_user_metrics(user_id)
    if metrics:
        return metrics
    
    # Fallback to session data
    session = get_user_session(user_id)
    if session:
        with session["user_lock"]:
            return session["current_metrics"].copy()
    
    return {
        "expression": "Detecting...",
        "pitch": 0,
        "confidence": 0
    }

def get_user_report_data(user_id: str):
    """Get report data for display for specific user"""
    try:
        report_filename = f"user_data/{user_id}/report.txt"
        transcript_filename = f"user_data/{user_id}/transcript.txt"
        
        if not os.path.exists(report_filename):
            return {
                "confidence_score": 0,
                "confidence_level": "No report available",
                "transcribed_text": "No transcript available",
                "video_analysis": {},
                "audio_features": "No audio analysis available",
                "suggestions": []
            }
            
        with open(report_filename, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
        confidence_score = 0
        confidence_level = ""
        avg_pitch = 0
        expressions = {}
        
        for line in lines:
            line = line.strip()
            if "Confidence Score:" in line:
                try:
                    confidence_score = int(line.split(":")[1].split("/")[0].strip())
                except:
                    pass
            elif "Confidence Level:" in line:
                confidence_level = line.split(":")[1].strip()
            elif "Average Pitch:" in line:
                try:
                    avg_pitch = float(line.split(":")[1].strip())
                except:
                    pass
            elif line.startswith("-"):
                parts = line[2:].split(":")
                if len(parts) == 2:
                    key = parts[0].strip().lower()
                    try:
                        val = int(parts[1].strip())
                        expressions[key] = val
                    except:
                        pass
        
        # Get transcript
        transcript = "Transcript not available"
        if os.path.exists(transcript_filename):
            with open(transcript_filename, "r", encoding="utf-8") as tf:
                transcript = tf.read().strip() or "Transcript not available"

        # Compute suggestions
        try:
            categories = []
            if confidence_level.strip().lower().startswith("low") or confidence_score < 60:
                categories.append("confidence")

            neg = expressions.get('sad', 0) + expressions.get('fear', 0) + expressions.get('angry', 0)
            pos = expressions.get('happy', 0) + expressions.get('neutral', 0) + expressions.get('surprise', 0)
            if neg > pos:
                categories.append("expression")

            if avg_pitch > 0 and avg_pitch < 100:
                categories.append("speech")

            suggestions = get_suggestions_from_db(categories) if categories else []
        except Exception:
            suggestions = []
        
        return {
            "confidence_score": confidence_score,
            "confidence_level": confidence_level,
            "transcribed_text": transcript,
            "video_analysis": expressions,
            "audio_features": f"{avg_pitch:.1f}" if avg_pitch > 0 else "0",
            "suggestions": suggestions
        }
    except Exception as e:
        print(f"[ERROR] Failed to get report data for user {user_id}: {e}")
        return {
            "confidence_score": 0,
            "confidence_level": "Error loading report",
            "transcribed_text": f"Error: {str(e)}",
            "video_analysis": {},
            "audio_features": "Error",
            "suggestions": []
        }

def get_user_latest_frame(user_id: str):
    """Return the latest JPEG-encoded frame for specific user"""
    session = get_user_session(user_id)
    if session:
        with session["user_lock"]:
            return session["latest_frame_jpeg"]
    return None

# === BACKWARD COMPATIBILITY FUNCTIONS ===
def run_evaluation():
    """Backward compatibility function"""
    return run_user_evaluation("default", ".")

def stop_recording():
    """Backward compatibility function"""
    stop_user_recording("default")

def process_uploaded_video(filepath: str):
    """Backward compatibility function"""
    return process_user_uploaded_video("default", filepath, ".")

def get_current_metrics():
    """Backward compatibility function"""
    return get_user_current_metrics("default")

def get_report_data():
    """Backward compatibility function"""
    return get_user_report_data("default")

def get_latest_frame():
    """Backward compatibility function"""
    return get_user_latest_frame("default")

# Initialize database on module load
if __name__ != "__main__":
    init_database()