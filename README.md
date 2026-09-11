# HeatShield AI — Thermal Resilience & Heat-Health Early Warning System

> **Prototype Decision-Support Platform for Hyperlocal Extreme Heat Risk Prediction, Explainability, and Community Vulnerability Assessment.**

---

## 1. Overview

**HeatShield AI** is an end-to-end environmental intelligence and early warning dashboard engineered to assess and predict hyperlocal heat-health risk across the **19 mandals of West Godavari District, Andhra Pradesh, India**. 

By synthesizing **real-time Open-Meteo meteorological telemetry**, **advanced biometeorological thermal stress calculations (Heat Index, Estimated WBGT, Estimated UTCI)**, **hyperlocal socioeconomic vulnerability indicators**, and a **trained XGBoost 6-hour forward-looking ML risk model with SHAP explainability**, HeatShield AI empowers municipal authorities and vulnerable communities to act before severe heat emergencies escalate.

---

## 2. System Architecture

```
[ Open-Meteo Synoptic Weather API ]
                 |
                 v (Temperature, Humidity, Wind Speed, Solar Radiation)
+---------------------------------------------------------------------------------+
| FastAPI Backend Core (Python 3.14 / Uvicorn)                                    |
|                                                                                 |
| 1. Weather Telemetry Engine  --> Real-time current & 5-day synoptic forecast    |
| 2. Thermal Stress Engine     --> Heat Index + Estimated WBGT + Estimated UTCI   |
| 3. Vulnerability Service     --> 19 Mandals (Canopy, Housing, Density, Health)  |
| 4. Heat Health Risk Engine   --> Composite Risk Score (0-100) & Categorization  |
| 5. ML Predictive Model       --> XGBoost 6-Hour Forward Heat Risk Regression    |
| 6. Explainability Engine     --> SHAP TreeExplainer Top Risk Feature Drivers    |
| 7. Alert & Action Engine     --> Multi-level Early Warnings + Grounded Actions  |
| 8. AI Heat Assistant         --> Grounded Chatbot (Gemini 2.5 Flash + Fallback) |
| 9. Unified Dashboard Route   --> GET /dashboard/summary (Consolidated Payload)  |
+---------------------------------------------------------------------------------+
                 |
                 | HTTP / REST (Unified Payload + Section Fallbacks)
                 v
+---------------------------------------------------------------------------------+
| React 19 + Vite Frontend Application (Dark Charcoal Cybernetic UI)              |
|                                                                                 |
| * District & Mandal Selector (All 19 West Godavari mandals)                     |
| * Interactive Hyperlocal Risk Map (Leaflet Choropleth, Coordinates, Tooltips)   |
| * Current Weather & Biometeorological Gauges (Heat Index, WBGT, UTCI)           |
| * Heat Health Composite Risk Score Bar & Categorization                         |
| * ML 6-Hour Forward Risk Forecast & SHAP Explainability Feature Impact Card     |
| * 5-Day Synoptic Weather & Heat Risk Trend Chart                                |
| * Active Heat Advisory / Warning Banner with Grounded Priority Actions          |
| * Real-Time Notifications Feed (Web Audio Chime, Desktop Browser Alerts)        |
| * Grounded AI Heat Assistant Chat Window                                        |
+---------------------------------------------------------------------------------+
```

---

## 3. Scientific Methodology & Disclaimers

> [!IMPORTANT]
> ### HeatShield AI Scope & Scientific Boundaries
> 1. **Future Heat-Health Risk Prediction**: The ML model forecasts environmental and demographic heat-stress risk based on the HeatShield composite risk framework. It does **not** diagnose medical conditions, predict hospital admissions, or predict individual mortality.
> 2. **Biometeorological Proxies**:
>    - **Estimated WBGT**: Estimated outdoor Wet Bulb Globe Temperature computed from ambient temperature, relative humidity, wind speed, and solar irradiance proxies (not physical black-globe sensors).
>    - **Estimated UTCI**: Universal Thermal Climate Index calculated using pythermalcomfort / polynomial approximations valid within standard meteorological boundaries (-50°C to +50°C).
> 3. **Vulnerability Profiles**: Demographic indicators (elderly population %, outdoor labor %, vegetative canopy %, non-concrete roofing %, hospital density) represent prototype baseline datasets calibrated for West Godavari administrative mandals.
> 4. **Notification Scope**: Alert notifications are currently delivered **in-app**, via **Web Audio chimes**, and via the **HTML5 Desktop Notification API**. SMS, WhatsApp, and external push aggregators are planned for production phases.

---

## 4. 19 West Godavari Prototype Mandals

The system provides complete hyperlocal coverage for all 19 administrative mandals in West Godavari:

| # | Mandal | Primary Geographic Profile | Baseline Vulnerability |
|---|--------|----------------------------|------------------------|
| 1 | **Tadepalligudem** | Commercial & Educational Hub, High Density | Moderate-High (48.4) |
| 2 | **Bhimavaram** | Urban Aquaculture & Commercial Center | Moderate-High (46.8) |
| 3 | **Tanuku** | Industrial & Manufacturing Center | Moderate (44.6) |
| 4 | **Palakollu** | Agricultural & Agrarian Commercial Hub | Moderate (41.7) |
| 5 | **Narsapur** | Coastal Riverine Port, High Humidity | Moderate-High (45.3) |
| 6 | **Kovvur** | Riverbank Transit Hub | Moderate (43.1) |
| 7 | **Nidadavole** | Railway & Agricultural Junction | Moderate (42.5) |
| 8 | **Jangareddygudem** | Upland Foothills, Elevated Summer Heat | High (52.6) |
| 9 | **Achanta** | Rural River Delta, Agricultural Labor | Moderate (39.8) |
| 10 | **Attili** | Paddy Cultivation Heartland | Moderate (40.2) |
| 11 | **Penugonda** | Commercial & Rural Settlements | Moderate (38.9) |
| 12 | **Penumantra** | Agricultural Hinterland | Moderate (37.4) |
| 13 | **Iragavaram** | Rural Delta | Moderate (36.8) |
| 14 | **Undi** | Aquaculture Ponds & Agriculture | Moderate (41.2) |
| 15 | **Akividu** | Wetland & Aquaculture Fringe | Moderate (43.8) |
| 16 | **Mogalthur** | Coastal Marine & Fishery Belt | Moderate-High (47.1) |
| 17 | **Poduru** | Delta Farming Village Cluster | Low-Moderate (35.9) |
| 18 | **Veeravasaram** | Rural Agricultural Belt | Moderate (38.2) |
| 19 | **Kalla** | Lowland Aquaculture Region | Moderate (39.5) |

---

## 5. Technology Stack

### Backend
- **FastAPI 0.141+**: High-performance asynchronous REST API.
- **Uvicorn**: ASGI web server.
- **Open-Meteo API**: Live meteorological synoptic queries (no API key required).
- **pythermalcomfort 3.8.0**: Thermal comfort calculations (UTCI, WBGT, Heat Index).
- **XGBoost 3.4+ & Scikit-Learn 1.9+**: Gradient boosted decision trees for 6-hour future heat risk regression.
- **SHAP 0.52+**: Game-theoretic TreeExplainer for local feature attribution.
- **Google GenAI / Gemini 2.5 Flash**: Context-aware natural-language explanations (with built-in rule-based fallback).
- **Pytest 9.1+**: 107 automated unit and integration tests.

### Frontend
- **React 19 & Vite 8**: Modern, reactive frontend build pipeline.
- **Tailwind CSS 4**: Dark charcoal dashboard UI with high-contrast heat-risk palettes.
- **Leaflet & React-Leaflet**: Interactive geospatial choropleth map.
- **Recharts**: Responsive 5-day forecast visualizations and risk trends.
- **Lucide React**: Clean iconography.
- **HTML5 Web Audio & Notification APIs**: Auditory alerts and desktop notifications.

---

## 6. Quickstart Guide

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ and npm
- Git

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Optional: Configure environment variables
# Copy template and add GEMINI_API_KEY if desired (rule-based fallback works out-of-the-box)
cp .env.example .env

# 5. Start the FastAPI development server
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

Verify backend health:
```bash
curl http://localhost:8001/health
# Response: {"status": "ok"}
```

### Frontend Setup

```bash
# 1. Open a new terminal and navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 7. Model Training & Reproducibility

The ML future-risk model is an XGBoost Regressor trained to project the HeatShield composite risk score 6 hours into the future based on forecasted ambient temperature, relative humidity, wind speed, solar radiation, thermal metrics, and baseline vulnerability indicators.

To reproduce or retrain the model:

```bash
cd backend
python ml/train_model.py
```

Artifacts generated in `backend/ml/artifacts/`:
- `heat_risk_model.joblib`: Serialized XGBoost model.
- `feature_columns.joblib`: Ordered feature specification.
- `metrics.json`: Validation metrics (R² > 0.90, MAE < 2.5).

---

## 8. API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | System health check (`{"status": "ok"}`) |
| `GET` | `/` | API status message |
| `GET` | `/dashboard/summary?area_name={mandal}` | Consolidated end-to-end payload for selected area |
| `GET` | `/weather/current?latitude={lat}&longitude={lon}` | Real-time Open-Meteo weather telemetry |
| `GET` | `/weather/forecast?latitude={lat}&longitude={lon}` | 5-day synoptic weather & risk indicator forecast |
| `GET` | `/thermal/metrics?temperature={t}&humidity={h}...` | Biometeorological calculations (HI, WBGT, UTCI) |
| `GET` | `/vulnerability/{mandal}` | Local socioeconomic and environmental vulnerability score |
| `POST`| `/risk/calculate` | Composite heat-health risk score (0-100) |
| `GET` | `/prediction/future-risk/{mandal}` | 6-hour ML future risk forecast |
| `GET` | `/alerts/{mandal}` | Active heat alerts and SHAP explanation |
| `GET` | `/alerts/status/{mandal}` | State transition detection & polling endpoint |
| `GET` | `/alerts/history/{mandal}` | Chronological alert history |
| `POST`| `/alerts/acknowledge` | Acknowledge/read a specific alert |
| `POST`| `/alerts/acknowledge-all` | Mark all alerts read for an area |
| `POST`| `/assistant/chat` | Natural language grounded AI assistant chat |

---

## 9. Verification & Quality Assurance

### Run Backend Tests (Pytest)
```bash
cd backend
python -m pytest -v
# 145 passed in ~22 seconds
```

### Run Frontend Production Build
```bash
cd frontend
npm run build
# Built clean with zero errors
```

---

## 10. Production Deployment Manual

HeatShield AI is architected for production deployment across modern cloud platforms:
- **Frontend**: [Vercel](https://vercel.com) (Static React + Vite SPA).
- **Backend**: [Railway](https://railway.app) or [Render](https://render.com) (Persistent Web Service with autonomous 24/7 background scheduler; **not** serverless).
- **Database**: Managed **PostgreSQL** via `DATABASE_URL` (with automatic table initialization via `scripts/init_db.py` and SQLite local development fallback).
- **Email Delivery**: [Resend](https://resend.com) transactional email API.

### 10.1 Backend Deployment (Railway or Render)

> [!IMPORTANT]
> **Persistent Service Requirement**: Do **not** deploy the backend to AWS Lambda or Vercel Serverless. HeatShield AI includes a background asyncio scheduler (`services/monitoring_service.py`) that monitors thermal stress every 5 minutes 24/7 even when no browsers are connected.

#### Option A: Railway Deployment

1. Create a new project in Railway: `https://railway.app/new`.
2. Add a **PostgreSQL** database service (`Railway Dashboard -> New -> Database -> Add PostgreSQL`).
3. Add a **GitHub Repo** service connected to this repository (`backend` directory).
4. In Railway project settings, set the **Root Directory** to `backend`.
5. Under **Variables**, configure:
   ```env
   ENVIRONMENT=production
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET_KEY=<generate-a-strong-32-character-random-secret>
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=alerts@yourdomain.com
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
6. Railway automatically uses `railway.json` and `Procfile` to run database migration (`python scripts/init_db.py`) and boot Uvicorn on `$PORT`.
7. Copy your public backend URL (e.g. `https://heatshield-api.up.railway.app`).

#### Option B: Render Deployment

1. Create a **New Blueprint Instance** or **New Web Service** connected to your repo.
2. If using Blueprint: Render will automatically detect `render.yaml` and provision both the persistent Web Service and managed PostgreSQL.
3. If setting up manually:
   - **Environment**: Python
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt && python scripts/init_db.py`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Starter or higher (persistent instance with background scheduler).
4. Under **Environment Variables**, set `DATABASE_URL`, `JWT_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL`, and `ENVIRONMENT=production`.

---

### 10.2 Frontend Deployment (Vercel)

1. Import the repository into Vercel: `https://vercel.com/new`.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Vite**.
4. Under **Environment Variables**, add:
   ```env
   VITE_API_BASE_URL=https://your-backend.up.railway.app
   ```
   *(Replace with your live Railway/Render backend URL; no trailing slash).*
5. Click **Deploy**. Vercel will build the SPA using `frontend/vercel.json` for client-side routing.
6. Once deployed, add your live Vercel domain (e.g. `https://heatshield-ai.vercel.app`) to your backend's `FRONTEND_URL` environment variable.

---

### 10.3 Post-Deployment Verification

1. **Verify Backend Health & Diagnostics**:
   ```bash
   curl https://your-backend.up.railway.app/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "HeatShield AI API",
     "environment": "production",
     "database": {
       "status": "connected",
       "engine": "postgresql"
     },
     "scheduler": {
       "running": true,
       "interval_seconds": 300
     },
     "model_loaded": true,
     "email": {
       "provider": "resend",
       "configured": true
     }
   }
   ```
2. **Verify Frontend Connectivity**:
   - Open your live Vercel URL in a browser.
   - Confirm live Open-Meteo weather and risk predictions load.
   - Log in or register an account.
   - Go to Settings -> verify email status displays "Configured" with Resend provider.
   - Verify the 5-minute autonomous monitoring worker records telemetry without errors.

---

## 11. License

MIT License. Developed for the HeatShield AI Heat-Health Early Warning Initiative.
