from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
import uuid

# Import the existing FaceSimilarity module
import FaceSimilarity

app = Flask(__name__)
CORS(app)


@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "success": True,
        "message": "Face verification API is running",
        "endpoint": "/verify",
        "method": "POST"
    })


def save_base64_image(base64_string, filename):
    # Remove header if present (e.g., "data:image/jpeg;base64,...")
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    
    with open(filename, "wb") as f:
        f.write(base64.b64decode(base64_string))

@app.route('/verify', methods=['POST'])
def verify_faces():
    data = request.json
    
    if not data or 'image1' not in data or 'image2' not in data:
        return jsonify({"success": False, "message": "Missing image1 or image2"}), 400
        
    img1_path = f"tmp_{uuid.uuid4().hex}_1.jpg"
    img2_path = f"tmp_{uuid.uuid4().hex}_2.jpg"
    
    try:
        save_base64_image(data['image1'], img1_path)
        save_base64_image(data['image2'], img2_path)
        
        # Perform face verification using DeepFace wrapper
        result = FaceSimilarity.verify_faces_deepface(img1_path, img2_path)
        
        if not result["success"]:
            # Could be a "face not detected" error or something else
            return jsonify({
                "success": False,
                "message": result["error"],
                "match": False,
                "confidence": "0.0%"
            }), 400
            
        is_match = result["verified"]
        score = result["distance"]
        thresh = result["threshold"]
        
        # DeepFace distances are usually very small for matches (e.g., < 0.40 for Facenet)
        # Calculate a confidence percentage. If score == 0, 100%. If score == thresh, let's say 80%.
        if score <= thresh:
            # Match! Scale 0 -> thresh to 100 -> 80
            match_percentage = 100 - (score / thresh * 20)
        else:
            # No match! Scale thresh -> max_dist (e.g. 1.0) to 80 -> 0
            # For Facenet, distance goes up to ~1.4. Let's use 1.0 as a general ceiling for 0%.
            ceiling = max(1.0, thresh * 2.5)
            penalty_ratio = (score - thresh) / (ceiling - thresh)
            match_percentage = max(0, 80 - (penalty_ratio * 80))
            
        return jsonify({
            "success": True,
            "match": bool(is_match),
            "score": float(score),
            "confidence": f"{match_percentage:.1f}%",
            "threshold": float(thresh)
        })
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
        
    finally:
        if os.path.exists(img1_path):
            os.remove(img1_path)
        if os.path.exists(img2_path):
            os.remove(img2_path)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
