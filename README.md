# ML Disease Prediction System

A web app that predicts the most likely disease from the symptoms you select. It uses a **Naive Bayes** model served by a **FastAPI** backend, with a simple HTML/CSS/JavaScript frontend.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://ml-disease-prediction-system.onrender.com)

**Live app:** https://ml-disease-prediction-system.onrender.com

**API docs (Swagger):** https://ml-disease-prediction-system.onrender.com/docs

> The app runs on a free Render plan, which sleeps when idle. The first request after a break can take up to a minute. If the symptoms don't load, wait a moment and click **Reconnect**.

---

## Features

- Search and select from **132 symptoms**
- Predicts the most likely condition with a **confidence score**
- Clean, responsive interface with an animated confidence gauge
- REST API with automatic interactive docs

## Model

| Item | Details |
|---|---|
| Algorithm | Naive Bayes (scikit-learn) |
| Test accuracy | about 98.4% |
| Input | 132 binary symptom features |
| Training notebook | `model/diseases_model.ipynb` |
| Dataset | `model/diseases.csv` |

The trained model, label encoder and feature names are saved together in `model/naive_bayes_best_model.pkl`.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Uvicorn |
| ML | scikit-learn, pandas, numpy |
| Frontend | HTML, CSS, vanilla JavaScript |
| Hosting | Render (Web Service for the API, Static Site for the frontend) |

## Project Structure

```
ML_Model/
├── app.py                  # FastAPI application
├── requirements.txt        # Python dependencies
├── .gitignore
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
└── model/
    ├── diseases_model.ipynb
    ├── diseases.csv
    └── naive_bayes_best_model.pkl
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API status and model info |
| GET | `/health` | Health check |
| GET | `/symptoms` | List of all valid symptom names |
| POST | `/predict` | Predict a disease from symptoms |

**Example request**

```bash
curl -X POST https://YOUR-API-URL.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{"symptoms": ["itching", "skin_rash", "nodal_skin_eruptions"]}'
```

**Example response**

```json
{
  "predicted_disease": "Fungal infection",
  "confidence": 0.98,
  "symptoms_count": 3
}
```

## Disclaimer

This project is for **educational purposes only**. It is **not a medical diagnostic tool** and must not replace professional medical advice. Always consult a qualified healthcare provider for diagnosis and treatment.