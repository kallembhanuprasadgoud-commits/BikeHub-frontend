# BikeHub – Python AI Microservice

This microservice provides intelligent valuation, content-based recommendations, and computer vision condition assessment for motorcycles.

## Tech Stack
- Python 3.10+
- Flask & Flask-CORS
- Scikit-Learn & NumPy

## Setup & Execution

### 1. Create a Virtual Environment
```bash
cd ai-service
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Microservice
```bash
python app.py
```
Service runs at: `http://localhost:5000`

## Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/health` | Healthcheck and service heartbeat |
| `POST` | `/predict-price` | Algorithmic regression for suggested fair market price |
| `POST` | `/analyze-condition` | Computer vision assessment of cosmetic and mechanical wear |
