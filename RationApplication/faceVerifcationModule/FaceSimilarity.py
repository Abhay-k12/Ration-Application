from deepface import DeepFace

def verify_faces_deepface(img1_path, img2_path):
    """
    Verifies if two face images belong to the same person using DeepFace.
    Returns:
        dict containing boolean 'verified', float 'distance', float 'threshold'
    """
    try:
        # We use Facenet model for good balance of speed and accuracy. 
        # enforce_detection=True ensures that it fails if no face is detected in the image (e.g. random objects)
        result = DeepFace.verify(
            img1_path, 
            img2_path, 
            model_name="Facenet", 
            detector_backend="opencv", 
            enforce_detection=True
        )
        return {
            "success": True,
            "verified": result["verified"],
            "distance": result["distance"],
            "threshold": result["threshold"]
        }
    except ValueError as ve:
        # This usually happens when a face cannot be detected in one of the images
        return {
            "success": False,
            "error": str(ve)
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"An unexpected error occurred during face verification: {str(e)}"
        }
