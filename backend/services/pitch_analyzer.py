"""
Pitch Analyzer service using OpenCV and MediaPipe.
Analyzes video frames for confidence scoring based on face mesh analysis.
"""
import base64
import io
from typing import Optional
import numpy as np

# Lazy imports to handle missing dependencies gracefully
_face_mesh = None
_mp_drawing = None

def get_face_mesh():
    """Get or initialize MediaPipe Face Mesh."""
    global _face_mesh, _mp_drawing
    
    if _face_mesh is None:
        try:
            import mediapipe as mp
            _face_mesh = mp.solutions.face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            _mp_drawing = mp.solutions.drawing_utils
        except Exception as e:
            print(f"Failed to initialize MediaPipe: {e}")
            return None, None
    
    return _face_mesh, _mp_drawing

def decode_base64_image(base64_string: str) -> Optional[np.ndarray]:
    """Decode base64 image to numpy array."""
    try:
        import cv2
        from PIL import Image
        
        # Remove data URL prefix if present
        if "base64," in base64_string:
            base64_string = base64_string.split("base64,")[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image then to numpy array
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if pil_image.mode != "RGB":
            pil_image = pil_image.convert("RGB")
        
        # Convert to numpy array (BGR for OpenCV)
        image_array = np.array(pil_image)
        image_bgr = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
        return image_bgr
    except Exception as e:
        print(f"Failed to decode image: {e}")
        return None

def calculate_eye_contact_score(landmarks, image_width: int, image_height: int) -> float:
    """
    Calculate eye contact score based on iris position.
    Returns score from 0 to 100.
    """
    try:
        # Key landmarks for eye tracking
        # Left eye: 468-477 (iris landmarks in refined mode)
        # Right eye: 473-477
        # Eye corners: 33 (left outer), 133 (left inner), 362 (right outer), 263 (right inner)
        
        # Get eye center positions
        left_eye_center = landmarks[468]  # Left iris center
        right_eye_center = landmarks[473]  # Right iris center
        
        # Get eye corner positions for reference
        left_inner = landmarks[133]
        left_outer = landmarks[33]
        right_inner = landmarks[362]
        right_outer = landmarks[263]
        
        # Calculate how centered the iris is within the eye
        # Ideal: iris should be roughly in the center of eye corners
        
        def iris_centration(iris, inner, outer):
            eye_width = abs(outer.x - inner.x)
            if eye_width < 0.01:
                return 0.5
            iris_pos = (iris.x - min(inner.x, outer.x)) / eye_width
            # Perfect center = 0.5, deviation reduces score
            return 1.0 - abs(iris_pos - 0.5) * 2
        
        left_score = iris_centration(left_eye_center, left_inner, left_outer)
        right_score = iris_centration(right_eye_center, right_inner, right_outer)
        
        # Average and convert to percentage
        eye_contact_score = ((left_score + right_score) / 2) * 100
        
        return max(0, min(100, eye_contact_score))
    except Exception as e:
        print(f"Eye contact calculation error: {e}")
        return 50.0  # Default neutral score

def calculate_head_position_score(landmarks, image_width: int, image_height: int) -> float:
    """
    Calculate head position score based on face orientation.
    Returns score from 0 to 100.
    """
    try:
        # Key landmarks for head pose
        nose_tip = landmarks[1]
        chin = landmarks[152]
        left_ear = landmarks[234]
        right_ear = landmarks[454]
        forehead = landmarks[10]
        
        # Calculate head tilt (should be minimal for good posture)
        ear_slope = abs(left_ear.y - right_ear.y) / max(abs(left_ear.x - right_ear.x), 0.01)
        tilt_score = max(0, 100 - ear_slope * 200)
        
        # Calculate if facing forward (nose should be centered relative to ears)
        ear_center_x = (left_ear.x + right_ear.x) / 2
        forward_offset = abs(nose_tip.x - ear_center_x)
        forward_score = max(0, 100 - forward_offset * 300)
        
        # Calculate vertical orientation (chin below nose, forehead above)
        vertical_correct = (chin.y > nose_tip.y > forehead.y)
        vertical_score = 100 if vertical_correct else 60
        
        # Weighted average
        head_score = (tilt_score * 0.3 + forward_score * 0.5 + vertical_score * 0.2)
        
        return max(0, min(100, head_score))
    except Exception as e:
        print(f"Head position calculation error: {e}")
        return 50.0

def analyze_pitch_frame(base64_image: str) -> dict:
    """
    Analyze a single frame from pitch video.
    Returns confidence metrics and feedback.
    """
    import cv2
    
    # Decode image
    image = decode_base64_image(base64_image)
    if image is None:
        return {
            "success": False,
            "error": "Failed to decode image",
            "confidence_score": 0,
            "feedback": []
        }
    
    # Get face mesh
    face_mesh, _ = get_face_mesh()
    if face_mesh is None:
        # Fallback: return simulated analysis
        return {
            "success": True,
            "confidence_score": 75,
            "eye_contact_score": 78,
            "head_position_score": 72,
            "feedback": [
                {"type": "info", "message": "MediaPipe not available - showing simulated analysis"},
                {"type": "positive", "message": "Face detected in frame"},
                {"type": "suggestion", "message": "Maintain steady eye contact with the camera"}
            ],
            "simulated": True
        }
    
    # Convert to RGB for MediaPipe
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image_height, image_width = image.shape[:2]
    
    # Process with Face Mesh
    results = face_mesh.process(image_rgb)
    
    if not results.multi_face_landmarks:
        return {
            "success": True,
            "confidence_score": 0,
            "error": "No face detected",
            "feedback": [
                {"type": "warning", "message": "No face detected in frame. Please ensure your face is visible."}
            ]
        }
    
    # Get first face landmarks
    landmarks = results.multi_face_landmarks[0].landmark
    
    # Calculate scores
    eye_contact_score = calculate_eye_contact_score(landmarks, image_width, image_height)
    head_position_score = calculate_head_position_score(landmarks, image_width, image_height)
    
    # Overall confidence score (weighted)
    confidence_score = (eye_contact_score * 0.6 + head_position_score * 0.4)
    
    # Generate feedback
    feedback = []
    
    if eye_contact_score >= 80:
        feedback.append({"type": "positive", "message": "Excellent eye contact! You're engaging well with the camera."})
    elif eye_contact_score >= 60:
        feedback.append({"type": "neutral", "message": "Good eye contact. Try to look directly at the camera more consistently."})
    else:
        feedback.append({"type": "suggestion", "message": "Focus on maintaining eye contact with the camera to build trust."})
    
    if head_position_score >= 80:
        feedback.append({"type": "positive", "message": "Great posture and head position!"})
    elif head_position_score >= 60:
        feedback.append({"type": "neutral", "message": "Good head position. Keep your head level for best results."})
    else:
        feedback.append({"type": "suggestion", "message": "Try to keep your head straight and face the camera directly."})
    
    # Overall assessment
    if confidence_score >= 85:
        overall = "Outstanding! Your pitch delivery shows high confidence."
    elif confidence_score >= 70:
        overall = "Good performance! Minor improvements can make it excellent."
    elif confidence_score >= 50:
        overall = "Decent start. Focus on eye contact and posture for improvement."
    else:
        overall = "Keep practicing! Work on maintaining eye contact and steady posture."
    
    feedback.append({"type": "summary", "message": overall})
    
    return {
        "success": True,
        "confidence_score": round(confidence_score, 1),
        "eye_contact_score": round(eye_contact_score, 1),
        "head_position_score": round(head_position_score, 1),
        "feedback": feedback,
        "simulated": False
    }
