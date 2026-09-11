import os
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

from services.ai_service import (
    build_heatshield_context,
    generate_ai_response,
    _load_env_api_key,
)
from services.vulnerability_service import get_vulnerability_data

router = APIRouter()


class AssistantChatRequest(BaseModel):
    area_name: str = Field(..., description="Name of the selected area/mandal (e.g., 'Tadepalligudem')")
    message: str = Field(..., description="User query or question about the area")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Optional latitude override")
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Optional longitude override")


class AssistantChatResponse(BaseModel):
    area: str
    message: str
    response: str
    provider: str
    context_summary: Dict[str, Any]
    disclaimer: str


@router.post("/chat", response_model=AssistantChatResponse, tags=["Assistant"])
async def chat_with_assistant(request: AssistantChatRequest):
    """
    Context-aware AI Heat-Health Assistant chat endpoint.
    Answers user questions grounded strictly in live HeatShield biometeorological,
    vulnerability, ML prediction, and SHAP attribution data for the selected area.
    """
    area_clean = request.area_name.strip()
    if not area_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Area name cannot be empty."
        )

    # Validate area existence in HeatShield vulnerability dataset
    vuln_data = get_vulnerability_data(area_clean)
    if not vuln_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Area '{request.area_name}' not found in West Godavari HeatShield dataset. Supported mandals include Tadepalligudem, Tanuku, Bhimavaram, Jangareddygudem, Kovvur, Palakollu, Narsapur, Nidadavole, etc."
        )

    try:
        # 1. Compile live HeatShield context
        context = build_heatshield_context(
            area_name=area_clean,
            latitude=request.latitude,
            longitude=request.longitude,
        )

        # 2. Determine provider and generate response
        has_gemini = bool(_load_env_api_key())
        ai_reply = await generate_ai_response(
            area_name=context.get("area", area_clean),
            user_message=request.message,
            context=context,
        )

        # 3. Compact context summary for frontend client awareness
        summary = {
            "temperature": context.get("weather", {}).get("temperature"),
            "humidity": context.get("weather", {}).get("humidity"),
            "thermal_stress_score": context.get("thermal", {}).get("thermal_stress_score"),
            "vulnerability_score": context.get("vulnerability", {}).get("vulnerability_score"),
            "risk_score": context.get("risk", {}).get("score"),
            "risk_category": context.get("risk", {}).get("category"),
            "predicted_score_6h": context.get("prediction", {}).get("score"),
            "alert_level": context.get("alert", {}).get("level"),
        }

        return AssistantChatResponse(
            area=context.get("area", area_clean),
            message=request.message,
            response=ai_reply,
            provider="gemini" if has_gemini else "grounded_deterministic",
            context_summary=summary,
            disclaimer="HeatShield AI outputs provide biometeorological decision support and early-warning risk screening. Estimated WBGT/UTCI values are model-derived. This system does not issue official clinical diagnoses.",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process AI assistant request: {str(e)}"
        )


@router.get("/status", tags=["Assistant"])
def get_assistant_status():
    """
    Check the AI Assistant service status and active provider.
    """
    has_gemini = bool(_load_env_api_key())
    return {
        "status": "operational",
        "provider": "gemini" if has_gemini else "grounded_deterministic",
        "supported_features": [
            "grounded_reasoning",
            "weather_thermal_integration",
            "vulnerability_awareness",
            "shap_attribution",
            "early_warning_alerts",
            "recommended_actions",
        ],
        "default_area": "Tadepalligudem",
    }
