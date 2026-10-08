from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import pickle
import pandas as pd
import numpy as np
import os


app = FastAPI(
    title="Disease Prediction API",
    description="Predict disease from 132 symptoms using Naive Bayes",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



MODEL_FILE = "model/naive_bayes_best_model.pkl"

with open(MODEL_FILE, 'rb') as f:
    bundle = pickle.load(f)

model         = bundle['model']
label_encoder = bundle['label_encoder']
feature_names = bundle['feature_names']
model_name    = bundle['model_name']

VALID_SYMPTOMS = set(feature_names)   



class SymptomInput(BaseModel):
    symptoms: List[str] = Field(..., min_length=1, description="List of symptom names the patient has", examples=[["itching", "skin_rash", "muscle_weakness"]])


class PredictionResponse(BaseModel):
    predicted_disease: str
    confidence: float
    symptoms_count: int



@app.get("/")
def root():
    return {
        "message": "Disease Prediction API is running",
        "model": "Naive Bayes",
        "test_accuracy": 0.9836,
        "docs": "/docs"
    }

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}

@app.get("/symptoms")
def get_symptoms():
    """Returns all 132 valid symptom names for your frontend dropdown"""
    return {"symptoms": sorted(VALID_SYMPTOMS), "total": len(VALID_SYMPTOMS)}

@app.post("/predict", response_model=PredictionResponse)
def predict(data: SymptomInput):
    selected = data.symptoms

    
    if not selected:
        raise HTTPException(status_code=400, detail="Please select at least 1 symptom")

    invalid = set(selected) - VALID_SYMPTOMS
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown symptoms: {list(invalid)}"
        )

    
    row = [1 if s in selected else 0 for s in feature_names]
    X = pd.DataFrame([row], columns=feature_names)

    
    pred_label = model.predict(X)[0]
    probability = model.predict_proba(X).max()

    disease_name = label_encoder.inverse_transform([pred_label])[0]

    return PredictionResponse(
        predicted_disease=disease_name,
        confidence=round(float(probability), 4),
        symptoms_count=len(selected)
    )