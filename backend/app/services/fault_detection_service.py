import os
import torch
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import io
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class FaultDetectionService:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "models", "fault_detection_resnet50.pth")
        
        # Define the realistic fault classes we would train on.
        self.classes = ["Normal", "Scratch", "Dent", "Screen Crack", "Water Damage"]
        
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        self.model_trained = os.path.exists(self.model_path)
        self.model = self._initialize_model()
        
        # Standard ImageNet preprocessing for transfer learning
        self.preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def _initialize_model(self):
        # We justify ResNet50 here: it's a proven architecture for surface defect detection
        # due to its residual connections allowing deep feature extraction without vanishing gradients.
        # We use transfer learning (pretrained=True) as the base.
        model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
        
        # Modify the final classification layer for our specific fault classes
        num_ftrs = model.fc.in_features
        model.fc = torch.nn.Linear(num_ftrs, len(self.classes))
        
        if self.model_trained:
            try:
                model.load_state_dict(torch.load(self.model_path, map_location=self.device))
                logger.info("Loaded trained fault detection model.")
            except Exception as e:
                logger.error(f"Failed to load model weights: {e}")
                self.model_trained = False
        else:
            logger.warning("No trained weights found. Model will output untrained predictions.")
            
        model = model.to(self.device)
        model.eval()
        return model

    async def analyze_image(self, image_bytes: bytes):
        """
        Flow: Image -> Validation -> Preprocessing -> Model -> Prediction -> Confidence -> Result
        """
        # 1. Validation
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file.")
            
        # 2. Preprocessing
        input_tensor = self.preprocess(image)
        input_batch = input_tensor.unsqueeze(0).to(self.device)
        
        # 3. Model Inference
        with torch.no_grad():
            output = self.model(input_batch)
            
        # 4. Prediction & Confidence
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        confidence, predicted_idx = torch.max(probabilities, 0)
        
        confidence_score = confidence.item()
        predicted_class = self.classes[predicted_idx.item()]
        
        # 5. Thresholding (Uncertain result when confidence is low)
        confidence_threshold = 0.70
        is_uncertain = confidence_score < confidence_threshold
        
        # If the model is not trained, we explicitly flag limitations.
        limitation_message = None
        if not self.model_trained:
            limitation_message = (
                "LIMITATION: No suitable product fault dataset is currently available. "
                "The model is using an untrained classification head. Results are simulated/random. "
                "A domain-specific dataset (e.g., thousands of labeled cracked screen images) "
                "is required to fine-tune this ResNet50 model for production use."
            )
            # For demonstration purposes, if untrained, we just randomly pick a result based on image bytes length
            # to make the UI testable, rather than returning random PyTorch initialization noise every time.
            pseudo_random_idx = len(image_bytes) % len(self.classes)
            predicted_class = self.classes[pseudo_random_idx]
            # Generate a pseudo-random confidence between 0.4 and 0.95
            confidence_score = 0.4 + ((len(image_bytes) % 55) / 100.0)
            is_uncertain = confidence_score < confidence_threshold

        return {
            "predicted_class": predicted_class if not is_uncertain else "Uncertain",
            "confidence": round(confidence_score * 100, 2),
            "is_uncertain": is_uncertain,
            "threshold": round(confidence_threshold * 100, 2),
            "model_trained": self.model_trained,
            "limitation": limitation_message
        }

fault_detector = FaultDetectionService()
