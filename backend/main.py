import os
import sys
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from services.weather_service import (
    get_weather,
    search_locations
)

from routes.weather import (
    router as weather_router
)

from routes.thermal import (
    router as thermal_router
)

from routes.vulnerability import (
    router as vulnerability_router
)

from routes.risk import (
    router as risk_router
)

from routes.prediction import (
    router as prediction_router
)

from routes.alerts import (
    router as alerts_router,
    get_explanation
)

from routes.assistant import (
    router as assistant_router
)

from routes.dashboard import (
    router as dashboard_router
)

from routes.auth import (
    router as auth_router,
    get_current_user,
    UserProfile,
)
from routes.alerts import get_email_alert_status
from services.monitoring_service import start_monitoring_scheduler, get_monitoring_status
from services.auth_service import check_db_health, get_db_type
from services.email_service import get_email_status
from services.ml_service import is_model_available


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="HeatShield AI",
    description="Heat-Health Early Warning System",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://[::1]:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://[::1]:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

frontend_url = os.getenv("FRONTEND_URL", "").strip()
if frontend_url:
    allowed_origins.append(frontend_url.rstrip("/"))

additional_cors = os.getenv("ADDITIONAL_CORS_ORIGINS", "").strip()
if additional_cors:
    for orig in additional_cors.split(","):
        if orig.strip():
            allowed_origins.append(orig.strip().rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$|^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

# Weather API (Open-Meteo Integration)
app.include_router(
    weather_router,
    prefix="/weather",
    tags=["Weather"]
)

# Thermal Stress API
app.include_router(
    thermal_router,
    prefix="/thermal",
    tags=["Thermal Stress"]
)


# Vulnerability API
app.include_router(
    vulnerability_router,
    prefix="/vulnerability",
    tags=["Vulnerability"]
)


# Heat Health Risk API
app.include_router(
    risk_router,
    prefix="/risk",
    tags=["Heat Health Risk"]
)

# Future Risk Prediction API
app.include_router(
    prediction_router,
    prefix="/prediction",
    tags=["Prediction"]
)

# Alerts & Heat Early Warning API
app.include_router(
    alerts_router,
    prefix="/alerts",
    tags=["Alerts"]
)

# AI Heat-Health Assistant API
app.include_router(
    assistant_router,
    prefix="/assistant",
    tags=["Assistant"]
)

# Consolidated Dashboard API (Step 9)
app.include_router(
    dashboard_router,
    prefix="/dashboard",
    tags=["Dashboard"]
)

# Authentication API (Step 11)
app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"]
)

# Root-level SHAP Explainability API (Section 7 specification)
app.add_api_route(
    "/explanation",
    get_explanation,
    methods=["POST"],
    tags=["Explanation"]
)

# Root-level Wards API alias
@app.get("/wards/{area_name}", tags=["Wards"])
def get_wards_alias(area_name: str):
    """Root alias for /risk/wards/{area_name} providing real-time ward data."""
    from services.ward_service import get_wards_for_locality
    from fastapi import HTTPException
    data = get_wards_for_locality(area_name)
    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"Ward-level data not available for locality '{area_name}'."
        )
    return data


@app.on_event("startup")
def on_startup():
    # Start autonomous real-time heat monitoring background scheduler
    start_monitoring_scheduler(interval_seconds=300)


@app.get("/notifications/email/status", tags=["Notifications"])
def notifications_email_status(current_user: UserProfile = Depends(get_current_user)):
    return get_email_alert_status(current_user)



# ============================================================
# ROOT & HEALTH CHECK
# ============================================================

@app.get("/")
def root():

    return {
        "message": "HeatShield AI API is running"
    }


@app.get("/health")
def health_check():
    db_healthy = check_db_health()
    db_type = get_db_type()
    scheduler_status = get_monitoring_status()
    email_status = get_email_status()
    model_loaded = is_model_available()

    overall_healthy = db_healthy and model_loaded

    return {
        "status": "healthy" if overall_healthy else "degraded",
        "service": "HeatShield AI API",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "database": {
            "status": "connected" if db_healthy else "disconnected",
            "engine": db_type,
        },
        "scheduler": {
            "running": scheduler_status.get("scheduler_running", False),
            "interval_seconds": scheduler_status.get("scheduler_interval_seconds", 300),
        },
        "model_loaded": model_loaded,
        "email": {
            "provider": email_status.get("provider", "resend"),
            "configured": email_status.get("configured", False),
        }
    }


# ============================================================
# LOCATION SEARCH
# ============================================================

@app.get("/locations/search")
def location_search(
    query: str
):

    results = search_locations(
        query
    )

    locations = []

    for result in results:

        locations.append({
            "name":
                result.get("name"),

            "latitude":
                result.get("latitude"),

            "longitude":
                result.get("longitude"),

            "country":
                result.get("country"),

            "admin1":
                result.get("admin1")
        })

    return {
        "locations": locations
    }


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run("main:app", host=host, port=port, reload=False)