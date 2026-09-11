"""
HeatShield AI — Email Alert Notification Service (Resend API)
============================================================
Dispatches automated, high-priority thermal stress warnings to authenticated
users for their actively monitored location during HIGH and EXTREME heat conditions
using the official Resend email delivery API.

SAFETY & PRIVACY:
-----------------
- Never exposes API keys to frontend or in API responses.
- Reads Resend configuration strictly from server environment variables / .env.
- Recipient is strictly derived from the authenticated user session.
- Real-time production alerts only; dedicated single-use demo alert for verification.
- Adheres strictly to non-clinical biometeorological advisory disclosures.
"""

import os
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple
import resend
import resend.exceptions

logger = logging.getLogger("heatshield.email")

# ============================================================
# CONFIGURATION FROM SERVER ENVIRONMENT & .ENV FILE
# ============================================================

PLACEHOLDER_SUBSTRINGS = (
    "re_xxxx",
    "re_1234",
    "your-",
    "your_",
    "placeholder",
    "example.com",
    "your_resend_api_key",
    "your-resend-api-key",
)


def is_placeholder(val: Optional[str]) -> bool:
    """Return True if value is None, empty, or a known placeholder token."""
    if not val:
        return True
    cleaned = val.strip().lower()
    if not cleaned:
        return True
    for sub in PLACEHOLDER_SUBSTRINGS:
        if sub in cleaned:
            return True
    return False


_ENV_LOADED = False


def _load_env_file(force: bool = False):
    """Load root .env, falling back to backend/.env if root .env is not present."""
    global _ENV_LOADED
    if _ENV_LOADED and not force:
        return

    base_dir = Path(__file__).resolve().parent.parent
    root_dir = base_dir.parent

    env_path = root_dir / ".env"
    if not env_path.exists():
        env_path = base_dir / ".env"

    if env_path.exists():
        try:
            for line in env_path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip()
                    if "#" in v and not ((v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'"))):
                        v = v.split("#")[0].strip()
                    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                        v = v[1:-1]
                    v = v.strip().strip("\"'")
                    if k:
                        os.environ[k] = v
        except Exception as e:
            logger.warning(f"Failed to load environment file {env_path}: {e}")

    _ENV_LOADED = True


_load_env_file()


def get_resend_config() -> Tuple[str, str]:
    """Retrieve current Resend configuration from environment."""
    _load_env_file()
    api_key = os.getenv("RESEND_API_KEY", "").strip().strip("\"'")
    email_from = os.getenv("EMAIL_FROM", "").strip().strip("\"'")
    if not email_from and api_key and not is_placeholder(api_key):
        email_from = "onboarding@resend.dev"
    return api_key, email_from


def get_email_status() -> Dict[str, Any]:
    """Check configuration and return display status and safe diagnostics for UI."""
    api_key, email_from = get_resend_config()

    key_configured = bool(api_key and not is_placeholder(api_key))
    from_configured = bool(email_from and not is_placeholder(email_from))
    is_configured = bool(key_configured and from_configured)

    status_label = "Configured" if is_configured else "Not configured"
    status_msg = (
        "Automatic email alerts are enabled."
        if is_configured
        else "Automatic email alerts are not configured. Add the Resend API key to the backend environment."
    )

    is_sandbox = (email_from.strip().lower() == "onboarding@resend.dev") if from_configured else False

    return {
        "provider": "resend",
        "configured": is_configured,
        "sender_configured": from_configured,
        "api_key_configured": key_configured,
        "status": status_label,
        "enabled": is_configured,
        "email_from": email_from if from_configured else None,
        "sender": email_from if from_configured else None,
        "is_sandbox": is_sandbox,
        "sender_verification_note": (
            "Using Resend sandbox sender (onboarding@resend.dev). Resend allows delivery only to your verified account email. Verify a custom domain in Resend to send to any recipient."
            if is_sandbox
            else "Using verified custom domain." if from_configured else "Sender address not configured in EMAIL_FROM."
        ),
        "message": status_msg,
    }


# ============================================================
# TEMPLATE BUILDERS FOR HIGH AND EXTREME HEAT ALERTS
# ============================================================

def build_alert_email_content(
    alert_level: str,
    location: str,
    temperature: float,
    risk_score: float,
    humidity: Optional[float] = None,
    heat_index: Optional[float] = None,
    wbgt: Optional[float] = None,
    utci: Optional[float] = None,
    thermal_stress_score: Optional[float] = None,
    risk_category: Optional[str] = None,
    timestamp: Optional[str] = None,
) -> Tuple[str, str, str]:
    """
    Generate exact Subject, Plain Text, and HTML bodies for HIGH and EXTREME alerts.
    Returns: (subject, plain_text, html_text)
    """
    lvl = alert_level.strip().upper()
    ts_str = timestamp or datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p UTC")
    temp_val = f"{temperature:.1f}" if temperature is not None else "N/A"
    score_val = f"{risk_score:.0f}" if risk_score is not None else "N/A"
    hum_val = f"{humidity:.0f}" if humidity is not None else "N/A"
    hi_val = f"{heat_index:.1f}°C" if heat_index is not None else "N/A"
    wbgt_val = f"{wbgt:.1f}°C" if wbgt is not None else "N/A"
    utci_val = f"{utci:.1f}°C" if utci is not None else "N/A"
    tss_val = f"{thermal_stress_score:.0f}/100" if thermal_stress_score is not None else "N/A"
    cat_val = risk_category or lvl

    if lvl == "EXTREME":
        subject = f"[HeatShield AI] EXTREME Heat Alert - {location}"

        plain_text = f"""🚨🔴 EXTREME HEAT ALERT 🔴🚨

⚠️ DANGER: EXTREME HEAT CONDITIONS

📍 Area: {location}
🌡️ Temperature: {temp_val}°C
🔥 Risk Level: EXTREME
📊 Heat Health Risk Score: {score_val}

🛑 ACTION REQUIRED

🏠 Stay in a cool/shaded place
💧 Drink water frequently
☀️ Avoid direct sunlight
🚫 Avoid unnecessary outdoor activities
👴👶 Check on elderly people and children

⚠️ PLEASE TAKE PRECAUTIONS NOW.

--------------------------------------------------
METEOROLOGICAL & BIOMETRIC DETAILS
--------------------------------------------------
Heat Index: {hi_val}
Estimated WBGT: {wbgt_val}
Estimated UTCI: {utci_val}
Thermal Stress Score: {tss_val}
Final Risk Score: {score_val}/100 ({cat_val})
Alert Triggered At: {ts_str}

HeatShield AI – Human Thermal Stress Early Warning System
Weather data: Open-Meteo
Note: Current conditions are derived from frequently updated atmospheric weather-model data.
"""

        html_text = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:20px; background-color:#070b14; color:#f1f5f9; font-family:system-ui, -apple-system, sans-serif;">
  <div style="max-width:600px; margin:0 auto; background:#0f172a; border:2px solid #ef4444; border-radius:14px; overflow:hidden; box-shadow:0 10px 25px rgba(239, 68, 68, 0.25);">
    <div style="background:linear-gradient(135deg, #b91c1c, #ef4444); padding:20px; text-align:center;">
      <h1 style="margin:0; font-size:22px; color:#ffffff; letter-spacing:1px;">🚨🔴 EXTREME HEAT ALERT</h1>
      <p style="margin:6px 0 0 0; font-size:12px; font-family:monospace; color:#fef08a; font-weight:bold; letter-spacing:1px;">⚠️ DANGER: EXTREME HEAT CONDITIONS</p>
    </div>
    
    <div style="padding:24px;">
      <div style="background:#1e293b; border-left:4px solid #ef4444; padding:12px 16px; border-radius:6px; margin-bottom:20px;">
        <div style="font-size:14px; margin-bottom:6px;">📍 <strong>Area:</strong> {location}</div>
        <div style="font-size:18px; font-weight:bold; color:#ef4444; margin-bottom:4px;">🌡️ Temperature: {temp_val}°C &nbsp;|&nbsp; 💧 Humidity: {hum_val}%</div>
        <div style="font-size:14px; color:#fca5a5;">🔥 <strong>Risk Level:</strong> EXTREME &nbsp;|&nbsp; 📊 <strong>Heat Health Risk Score:</strong> {score_val}/100</div>
      </div>

      <h3 style="color:#ffffff; font-size:15px; margin:20px 0 10px 0; border-bottom:1px solid #334155; padding-bottom:6px;">🛑 ACTION REQUIRED</h3>
      <ul style="line-height:1.8; font-size:13px; color:#cbd5e1; padding-left:20px; margin:0 0 20px 0;">
        <li>🏠 <strong>Stay in a cool/shaded place</strong></li>
        <li>💧 <strong>Drink water frequently</strong></li>
        <li>☀️ <strong>Avoid direct sunlight</strong></li>
        <li>🚫 <strong>Avoid unnecessary outdoor activities</strong></li>
        <li>👴👶 <strong>Check on elderly people and children</strong></li>
      </ul>
      <p style="background:#450a0a; border:1px solid #dc2626; color:#fecaca; padding:10px 14px; border-radius:8px; font-weight:bold; text-align:center; font-size:13px;">
        ⚠️ PLEASE TAKE PRECAUTIONS NOW.
      </p>

      <div style="background:#0b1120; border:1px solid #1e293b; border-radius:8px; padding:12px 16px; margin-top:20px; font-family:monospace; font-size:11px; color:#94a3b8;">
        <div style="font-weight:bold; color:#e2e8f0; margin-bottom:6px;">BIOMETRIC TELEMETRY:</div>
        <div>Heat Index: {hi_val} | WBGT: {wbgt_val} | UTCI: {utci_val}</div>
        <div>Thermal Stress Score: {tss_val} | Final Risk: {score_val}/100</div>
        <div style="color:#64748b; margin-top:6px;">Triggered: {ts_str}</div>
      </div>
    </div>

    <div style="background:#020617; padding:16px 20px; text-align:center; font-size:11px; color:#64748b; border-top:1px solid #1e293b;">
      <p style="margin:0 0 4px 0; color:#94a3b8; font-weight:bold;">HeatShield AI – Human Thermal Stress Early Warning System</p>
      <p style="margin:4px 0 0 0; font-size:10px;">Weather data: Open-Meteo • Current conditions derived from atmospheric weather models.</p>
    </div>
  </div>
</body>
</html>"""
        return subject, plain_text, html_text

    # Default to HIGH heat alert
    subject = f"[HeatShield AI] HIGH Heat Alert - {location}"

    plain_text = f"""⚠️🟠 HIGH TEMPERATURE ALERT 🟠⚠️

🌡️ HIGH HEAT CONDITIONS DETECTED

📍 Area: {location}
🌡️ Temperature: {temp_val}°C
🔥 Risk Level: HIGH
📊 Heat Health Risk Score: {score_val}

⚠️ PRECAUTIONS ADVISED

💧 Drink water regularly
☀️ Avoid prolonged exposure to direct sunlight
🏠 Stay in cool or shaded places when possible
🚶 Limit unnecessary outdoor activities during peak afternoon hours
👕 Wear loose, lightweight clothing
👴👶 Take extra care of elderly people and children

⚠️ STAY HYDRATED • STAY COOL • STAY SAFE

--------------------------------------------------
METEOROLOGICAL & BIOMETRIC DETAILS
--------------------------------------------------
Heat Index: {hi_val}
Estimated WBGT: {wbgt_val}
Estimated UTCI: {utci_val}
Thermal Stress Score: {tss_val}
Final Risk Score: {score_val}/100 ({cat_val})
Alert Triggered At: {ts_str}

HeatShield AI – Human Thermal Stress Early Warning System
Weather data: Open-Meteo
Note: Current conditions are derived from frequently updated atmospheric weather-model data.
"""

    html_text = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:20px; background-color:#070b14; color:#f1f5f9; font-family:system-ui, -apple-system, sans-serif;">
  <div style="max-width:600px; margin:0 auto; background:#0f172a; border:2px solid #f97316; border-radius:14px; overflow:hidden; box-shadow:0 10px 25px rgba(249, 115, 22, 0.25);">
    <div style="background:linear-gradient(135deg, #c2410c, #f97316); padding:20px; text-align:center;">
      <h1 style="margin:0; font-size:22px; color:#ffffff; letter-spacing:1px;">⚠️🟠 HIGH TEMPERATURE ALERT</h1>
      <p style="margin:4px 0 0 0; font-size:12px; font-family:monospace; color:#ffedd5; letter-spacing:2px;">🌡️ HIGH HEAT CONDITIONS DETECTED</p>
    </div>
    
    <div style="padding:24px;">
      <div style="background:#1e293b; border-left:4px solid #f97316; padding:12px 16px; border-radius:6px; margin-bottom:20px;">
        <div style="font-size:14px; margin-bottom:6px;">📍 <strong>Area:</strong> {location}</div>
        <div style="font-size:18px; font-weight:bold; color:#f97316; margin-bottom:4px;">🌡️ Temperature: {temp_val}°C &nbsp;|&nbsp; 💧 Humidity: {hum_val}%</div>
        <div style="font-size:14px; color:#fdba74;">🔥 <strong>Risk Level:</strong> HIGH &nbsp;|&nbsp; 📊 <strong>Heat Health Risk Score:</strong> {score_val}/100</div>
      </div>

      <h3 style="color:#ffffff; font-size:15px; margin:20px 0 10px 0; border-bottom:1px solid #334155; padding-bottom:6px;">⚠️ PRECAUTIONS ADVISED</h3>
      <ul style="line-height:1.8; font-size:13px; color:#cbd5e1; padding-left:20px; margin:0 0 20px 0;">
        <li>💧 <strong>Drink water regularly</strong></li>
        <li>☀️ <strong>Avoid prolonged exposure to direct sunlight</strong></li>
        <li>🏠 <strong>Stay in cool or shaded places when possible</strong></li>
        <li>🚶 <strong>Limit unnecessary outdoor activities during peak afternoon hours</strong></li>
        <li>👕 <strong>Wear loose, lightweight clothing</strong></li>
        <li>👴👶 <strong>Take extra care of elderly people and children</strong></li>
      </ul>
      <p style="background:#431407; border:1px solid #ea580c; color:#fed7aa; padding:10px 14px; border-radius:8px; font-weight:bold; text-align:center; font-size:13px;">
        ⚠️ STAY HYDRATED • STAY COOL • STAY SAFE
      </p>

      <div style="background:#0b1120; border:1px solid #1e293b; border-radius:8px; padding:12px 16px; margin-top:20px; font-family:monospace; font-size:11px; color:#94a3b8;">
        <div style="font-weight:bold; color:#e2e8f0; margin-bottom:6px;">BIOMETRIC TELEMETRY:</div>
        <div>Heat Index: {hi_val} | WBGT: {wbgt_val} | UTCI: {utci_val}</div>
        <div>Thermal Stress Score: {tss_val} | Final Risk: {score_val}/100</div>
        <div style="color:#64748b; margin-top:6px;">Triggered: {ts_str}</div>
      </div>
    </div>

    <div style="background:#020617; padding:16px 20px; text-align:center; font-size:11px; color:#64748b; border-top:1px solid #1e293b;">
      <p style="margin:0 0 4px 0; color:#94a3b8; font-weight:bold;">HeatShield AI – Human Thermal Stress Early Warning System</p>
      <p style="margin:4px 0 0 0; font-size:10px;">Weather data: Open-Meteo • Current conditions derived from atmospheric weather models.</p>
    </div>
  </div>
</body>
</html>"""
    return subject, plain_text, html_text


# ============================================================
# HACKATHON DEMO ALERT EMAIL
# ============================================================

def build_demo_email_content(
    recipient: str,
    location: str = "Tadepalligudem",
    temperature: float = 44.0,
    risk_score: float = 88.0,
) -> Tuple[str, str, str]:
    """
    Generate single real demo alert email for hackathon demonstration.
    Clearly discloses: DEMO ALERT — NOT A REAL EMERGENCY.
    """
    subject = "[HeatShield AI DEMO] Extreme Heat Alert"

    plain_text = f"""🚨🔴 EXTREME HEAT ALERT 🔴🚨

⚠️ DEMO ALERT — NOT A REAL EMERGENCY

📍 Area: {location}
🌡️ Temperature: {temperature:.0f}°C
🔥 Risk Level: EXTREME

🛑 ACTION REQUIRED

🏠 Stay in a cool/shaded place
💧 Drink water frequently
☀️ Avoid direct sunlight
🚫 Avoid unnecessary outdoor activities
👴👶 Check on elderly people and children

⚠️ PLEASE TAKE PRECAUTIONS NOW.

HeatShield AI – Human Thermal Stress Early Warning System
"""

    html_text = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:20px; background-color:#070b14; color:#f1f5f9; font-family:system-ui, -apple-system, sans-serif;">
  <div style="max-width:600px; margin:0 auto; background:#0f172a; border:2px solid #ef4444; border-radius:14px; overflow:hidden; box-shadow:0 10px 25px rgba(239, 68, 68, 0.25);">
    <div style="background:linear-gradient(135deg, #b91c1c, #ef4444); padding:20px; text-align:center;">
      <h1 style="margin:0; font-size:22px; color:#ffffff; letter-spacing:1px;">🚨🔴 EXTREME HEAT ALERT 🔴🚨</h1>
      <p style="margin:6px 0 0 0; font-size:12px; font-family:monospace; color:#fef08a; font-weight:bold; letter-spacing:1px;">⚠️ DEMO ALERT — NOT A REAL EMERGENCY</p>
    </div>
    
    <div style="padding:24px;">
      <div style="background:#1e293b; border-left:4px solid #ef4444; padding:12px 16px; border-radius:6px; margin-bottom:20px;">
        <div style="font-size:14px; margin-bottom:6px;">📍 <strong>Area:</strong> {location}</div>
        <div style="font-size:18px; font-weight:bold; color:#ef4444; margin-bottom:4px;">🌡️ Temperature: {temperature:.0f}°C</div>
        <div style="font-size:14px; color:#fca5a5;">🔥 <strong>Risk Level:</strong> EXTREME &nbsp;|&nbsp; 📊 <strong>Score:</strong> {risk_score:.0f}/100</div>
      </div>

      <h3 style="color:#ffffff; font-size:15px; margin:20px 0 10px 0; border-bottom:1px solid #334155; padding-bottom:6px;">🛑 ACTION REQUIRED</h3>
      <ul style="line-height:1.8; font-size:13px; color:#cbd5e1; padding-left:20px; margin:0 0 20px 0;">
        <li>🏠 <strong>Stay in a cool/shaded place</strong></li>
        <li>💧 <strong>Drink water frequently</strong></li>
        <li>☀️ <strong>Avoid direct sunlight</strong></li>
        <li>🚫 <strong>Avoid unnecessary outdoor activities</strong></li>
        <li>👴👶 <strong>Check on elderly people and children</strong></li>
      </ul>
      <p style="background:#450a0a; border:1px solid #dc2626; color:#fecaca; padding:10px 14px; border-radius:8px; font-weight:bold; text-align:center; font-size:13px;">
        ⚠️ PLEASE TAKE PRECAUTIONS NOW.
      </p>

      <div style="background:#0b1120; border:1px solid #1e293b; border-radius:8px; padding:12px 16px; margin-top:20px; font-family:monospace; font-size:11px; color:#94a3b8;">
        <div style="font-weight:bold; color:#e2e8f0; margin-bottom:4px;">DEMONSTRATION DETAILS:</div>
        <div>Recipient: {recipient}</div>
        <div>Type: Hackathon Single Demonstration Alert</div>
      </div>
    </div>

    <div style="background:#020617; padding:16px 20px; text-align:center; font-size:11px; color:#64748b; border-top:1px solid #1e293b;">
      <p style="margin:0 0 4px 0; color:#94a3b8; font-weight:bold;">HeatShield AI – Human Thermal Stress Early Warning System</p>
      <p style="margin:4px 0 0 0; font-size:10px;">This email is for demonstration testing only and does not represent a real heat emergency.</p>
    </div>
  </div>
</body>
</html>"""

    return subject, plain_text, html_text


# ============================================================
# DEVELOPMENT TEST TRANSITION EMAIL
# ============================================================

def build_test_transition_email_content(
    recipient: str,
    location: str = "Tadepalligudem",
    previous_level: str = "MODERATE",
    current_level: str = "HIGH",
    previous_score: float = 49.0,
    new_score: float = 52.0,
    temperature: float = 38.0,
    humidity: Optional[float] = 65.0,
    timestamp: Optional[str] = None,
) -> Tuple[str, str, str]:
    """
    Generate real development test alert email for pipeline verification.
    Subject: [HeatShield AI TEST] HIGH Heat Alert
    Body: Clearly states DEVELOPMENT TEST — NOT A REAL HEAT EMERGENCY,
    Risk transition: MODERATE → HIGH, Previous score: 49, New score: 52,
    and standard HIGH alert recommendations.
    """
    ts_str = timestamp or datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    prev_str = previous_level.strip().upper()
    curr_str = current_level.strip().upper()

    subject = f"[HeatShield AI TEST] {curr_str} Heat Alert"

    plain_text = f"""🧪⚠️ [HeatShield AI TEST] {curr_str} Heat Alert ⚠️🧪

DEVELOPMENT TEST — NOT A REAL HEAT EMERGENCY

Risk transition:
{prev_str} → {curr_str}

Previous score:
{previous_score:.0f}

New score:
{new_score:.0f}

📍 Area: {location}
🌡️ Temperature: {temperature:.1f}°C
🔥 Alert Level: {curr_str}

⚠️ PRECAUTIONS ADVISED (Standard HIGH Recommendations):

💧 Drink water regularly
☀️ Avoid prolonged exposure to direct sunlight
🏠 Stay in cool or shaded places when possible
🚶 Limit unnecessary outdoor activities during peak afternoon hours
👕 Wear loose, lightweight clothing
👴👶 Take extra care of elderly people and children

⚠️ STAY HYDRATED • STAY COOL • STAY SAFE

--------------------------------------------------
DEVELOPMENT PIPELINE VERIFICATION DETAILS:
Recipient: {recipient}
Pipeline: Simulated Risk Transition → Alert Classification → Transition Detection → Resend Delivery
Test Execution Time: {ts_str}

HeatShield AI – Human Thermal Stress Early Warning System
"""

    html_text = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:20px; background-color:#070b14; color:#f1f5f9; font-family:system-ui, -apple-system, sans-serif;">
  <div style="max-width:600px; margin:0 auto; background:#0f172a; border:2px solid #f97316; border-radius:14px; overflow:hidden; box-shadow:0 10px 25px rgba(249, 115, 22, 0.25);">
    <div style="background:linear-gradient(135deg, #c2410c, #f97316); padding:20px; text-align:center;">
      <h1 style="margin:0; font-size:22px; color:#ffffff; letter-spacing:1px;">🧪 [HeatShield AI TEST] {curr_str} Heat Alert</h1>
      <p style="margin:6px 0 0 0; font-size:12px; font-family:monospace; color:#ffedd5; font-weight:bold; letter-spacing:1px;">DEVELOPMENT TEST — NOT A REAL HEAT EMERGENCY</p>
    </div>
    
    <div style="padding:24px;">
      <div style="background:#1e293b; border-left:4px solid #f97316; padding:14px 18px; border-radius:6px; margin-bottom:20px;">
        <div style="font-size:15px; font-weight:bold; color:#fdba74; margin-bottom:10px;">
          Risk transition: {prev_str} &rarr; {curr_str}
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:13px; color:#cbd5e1; margin-bottom:10px;">
          <div>📊 <strong>Previous score:</strong> <span style="font-family:monospace; font-size:15px; color:#94a3b8;">{previous_score:.0f}</span></div>
          <div>📈 <strong>New score:</strong> <span style="font-family:monospace; font-size:15px; color:#fb923c; font-weight:bold;">{new_score:.0f}</span></div>
        </div>
        <div style="font-size:13px; color:#94a3b8;">
          📍 <strong>Area:</strong> {location} &nbsp;|&nbsp; 🌡️ <strong>Temperature:</strong> {temperature:.1f}°C
        </div>
      </div>

      <h3 style="color:#ffffff; font-size:15px; margin:20px 0 10px 0; border-bottom:1px solid #334155; padding-bottom:6px;">⚠️ PRECAUTIONS ADVISED</h3>
      <ul style="line-height:1.8; font-size:13px; color:#cbd5e1; padding-left:20px; margin:0 0 20px 0;">
        <li>💧 <strong>Drink water regularly</strong></li>
        <li>☀️ <strong>Avoid prolonged exposure to direct sunlight</strong></li>
        <li>🏠 <strong>Stay in cool or shaded places when possible</strong></li>
        <li>🚶 <strong>Limit unnecessary outdoor activities during peak afternoon hours</strong></li>
        <li>👕 <strong>Wear loose, lightweight clothing</strong></li>
        <li>👴👶 <strong>Take extra care of elderly people and children</strong></li>
      </ul>
      <p style="background:#431407; border:1px solid #ea580c; color:#fed7aa; padding:10px 14px; border-radius:8px; font-weight:bold; text-align:center; font-size:13px;">
        ⚠️ STAY HYDRATED • STAY COOL • STAY SAFE
      </p>

      <div style="background:#0b1120; border:1px solid #1e293b; border-radius:8px; padding:12px 16px; margin-top:20px; font-family:monospace; font-size:11px; color:#94a3b8;">
        <div style="font-weight:bold; color:#e2e8f0; margin-bottom:4px;">DEVELOPMENT VERIFICATION TELEMETRY:</div>
        <div>Recipient: {recipient}</div>
        <div>Pipeline: Simulated Risk Transition &rarr; Real Classification &rarr; Real Transition Detection &rarr; Resend Delivery</div>
        <div style="color:#64748b; margin-top:6px;">Execution Timestamp: {ts_str}</div>
      </div>
    </div>

    <div style="background:#020617; padding:16px 20px; text-align:center; font-size:11px; color:#64748b; border-top:1px solid #1e293b;">
      <p style="margin:0 0 4px 0; color:#94a3b8; font-weight:bold;">HeatShield AI – Human Thermal Stress Early Warning System</p>
      <p style="margin:4px 0 0 0; font-size:10px;">Development test mode verification • Never used for live operational alerts.</p>
    </div>
  </div>
</body>
</html>"""

    return subject, plain_text, html_text


# ============================================================
# RESEND DISPATCH IMPLEMENTATION & TELEMETRY TRACKING
# ============================================================

_LAST_EMAIL_DETAILS: Dict[str, Any] = {
    "timestamp": None,
    "recipient": None,
    "subject": None,
    "status": None,
    "message_id": None,
    "error": None,
}


def get_last_email_details() -> Dict[str, Any]:
    """Return read-only copy of the most recent email dispatch telemetry."""
    return dict(_LAST_EMAIL_DETAILS)


def send_email_with_id(
    recipient: str,
    subject: str,
    html_body: str,
    text_body: str,
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Directly dispatch an email via Resend API using server-side credentials.
    Returns (success: bool, error_message: Optional[str], message_id: Optional[str]).
    Never exposes or logs secret API keys.
    """
    global _LAST_EMAIL_DETAILS
    api_key, email_from = get_resend_config()

    if not api_key or is_placeholder(api_key):
        err = "Automatic email alerts are not configured. Add the Resend API key to the backend environment."
        logger.warning(f"[EMAIL SERVICE] {err}")
        _LAST_EMAIL_DETAILS.update({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "recipient": recipient,
            "subject": subject,
            "status": "failed",
            "message_id": None,
            "error": err,
        })
        return False, err, None

    if not email_from or is_placeholder(email_from):
        email_from = "onboarding@resend.dev"

    clean_recipient = (recipient or "").strip()
    if not clean_recipient or "@" not in clean_recipient:
        err = "Invalid recipient email address."
        logger.warning(f"[EMAIL SERVICE] {err}")
        _LAST_EMAIL_DETAILS.update({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "recipient": recipient,
            "subject": subject,
            "status": "failed",
            "message_id": None,
            "error": err,
        })
        return False, err, None

    try:
        resend.api_key = api_key
        params: resend.Emails.SendParams = {
            "from": email_from,
            "to": [clean_recipient],
            "subject": subject.strip(),
            "html": html_body,
            "text": text_body,
        }
        res = resend.Emails.send(params)

        email_id = None
        if isinstance(res, dict):
            email_id = res.get("id")
        elif hasattr(res, "id"):
            email_id = getattr(res, "id")
        elif hasattr(res, "__getitem__"):
            try:
                email_id = res["id"]
            except Exception:
                pass

        logger.info(f"[Email] Resend accepted message: {email_id}")
        _LAST_EMAIL_DETAILS.update({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "recipient": clean_recipient,
            "subject": subject,
            "status": "sent",
            "message_id": email_id,
            "error": None,
        })
        return True, None, email_id

    except resend.exceptions.InvalidApiKeyError:
        err_msg = "Unable to send email: Invalid Resend API key. Please check your RESEND_API_KEY."
        logger.error(f"[Email] Resend error: {err_msg}")
        _LAST_EMAIL_DETAILS.update({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "recipient": clean_recipient,
            "subject": subject,
            "status": "failed",
            "message_id": None,
            "error": err_msg,
        })
        return False, err_msg, None
    except resend.exceptions.MissingApiKeyError:
        err_msg = "Unable to send email: Missing Resend API key."
        logger.error(f"[Email] Resend error: {err_msg}")
        _LAST_EMAIL_DETAILS.update({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "recipient": clean_recipient,
            "subject": subject,
            "status": "failed",
            "message_id": None,
            "error": err_msg,
        })
        return False, err_msg, None
    except resend.exceptions.RateLimitError:
        err_msg = "Unable to send email: Resend API rate limit exceeded. Please try again shortly."
        logger.error(f"[Email] Resend error: {err_msg}")
        _LAST_EMAIL_DETAILS.update({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "recipient": clean_recipient,
            "subject": subject,
            "status": "failed",
            "message_id": None,
            "error": err_msg,
        })
        return False, err_msg, None
    except resend.exceptions.ValidationError as e:
        safe_msg = str(e)
        if api_key and api_key in safe_msg:
            safe_msg = safe_msg.replace(api_key, "******")
        err_msg = f"Unable to send email: {safe_msg}"
        logger.error(f"[Email] Resend error: {err_msg}")
        _LAST_EMAIL_DETAILS.update({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "recipient": clean_recipient,
            "subject": subject,
            "status": "failed",
            "message_id": None,
            "error": err_msg,
        })
        return False, err_msg, None
    except resend.exceptions.ResendError as e:
        safe_msg = str(e)
        if api_key and api_key in safe_msg:
            safe_msg = safe_msg.replace(api_key, "******")
        err_msg = f"Unable to send email: {safe_msg}"
        logger.error(f"[Email] Resend error: {err_msg}")
        _LAST_EMAIL_DETAILS.update({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "recipient": clean_recipient,
            "subject": subject,
            "status": "failed",
            "message_id": None,
            "error": err_msg,
        })
        return False, err_msg, None
    except Exception as exc:
        safe_msg = str(exc)
        if api_key and api_key in safe_msg:
            safe_msg = safe_msg.replace(api_key, "******")
        err_msg = f"Unable to send email: {safe_msg}"
        logger.error(f"[Email] Resend error: Failed to send email to {clean_recipient}: {err_msg}")
        _LAST_EMAIL_DETAILS.update({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "recipient": clean_recipient,
            "subject": subject,
            "status": "failed",
            "message_id": None,
            "error": err_msg,
        })
        return False, err_msg, None


def send_email(
    recipient: str,
    subject: str,
    html_body: str,
    text_body: str,
) -> Tuple[bool, Optional[str]]:
    """
    Directly dispatch an email via Resend API using server-side credentials.
    Returns (success: bool, error_message: Optional[str]).
    Preserves exact 2-tuple return for compatibility with tests and callers.
    """
    success, err_msg, _ = send_email_with_id(recipient, subject, html_body, text_body)
    return success, err_msg


# Alias for compatibility with previous callers
send_email_direct = send_email


def _safe_float(val: Any) -> Optional[float]:
    if val is None:
        return None
    if isinstance(val, dict):
        val = val.get("value")
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def send_heat_alert_email_with_id(
    recipient: str,
    alert_level: str,
    location: str,
    weather: Optional[Dict[str, Any]] = None,
    risk: Optional[Dict[str, Any]] = None,
    thermal: Optional[Dict[str, Any]] = None,
    timestamp: Optional[str] = None,
    is_test: bool = False,
    test_previous_level: Optional[str] = None,
    test_previous_score: Optional[float] = None,
    test_new_score: Optional[float] = None,
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Build and dispatch real alert email via Resend, returning (success, error, message_id).
    Supports is_test=True for development verification mode.
    """
    lvl = alert_level.strip().upper()
    if lvl not in ("HIGH", "EXTREME"):
        return False, f"Alert level '{lvl}' does not qualify for email notification (HIGH or EXTREME only).", None

    logger.info(f"[Email] Sending {lvl} alert through Resend...")

    if is_test:
        w = weather or {}
        subject, plain_body, html_body = build_test_transition_email_content(
            recipient=recipient,
            location=location,
            previous_level=test_previous_level or "MODERATE",
            current_level=lvl,
            previous_score=float(test_previous_score) if test_previous_score is not None else 49.0,
            new_score=float(test_new_score) if test_new_score is not None else 52.0,
            temperature=_safe_float(w.get("temperature")) or 38.0,
            humidity=_safe_float(w.get("humidity")) or 65.0,
            timestamp=timestamp,
        )
    else:
        w = weather or {}
        r = risk or {}
        th = thermal or {}

        temp = _safe_float(w.get("temperature")) or 38.0
        hum = _safe_float(w.get("humidity"))
        score = _safe_float(r.get("score") if r.get("score") is not None else r.get("risk_score")) or 65.0
        cat = r.get("category", lvl)

        hi = _safe_float(th.get("heat_index"))
        wbgt = _safe_float(th.get("wbgt", th.get("estimated_wbgt")))
        utci = _safe_float(th.get("utci", th.get("estimated_utci")))
        tss = _safe_float(th.get("thermal_stress_score"))

        subject, plain_body, html_body = build_alert_email_content(
            alert_level=lvl,
            location=location,
            temperature=temp,
            risk_score=score,
            humidity=hum,
            heat_index=hi,
            wbgt=wbgt,
            utci=utci,
            thermal_stress_score=tss,
            risk_category=cat,
            timestamp=timestamp,
        )

    success, err_msg = send_email(
        recipient=recipient,
        subject=subject,
        html_body=html_body,
        text_body=plain_body,
    )
    email_id = get_last_email_details().get("message_id")
    return success, err_msg, email_id


def send_heat_alert_email(
    recipient: str,
    alert_level: str,
    location: str,
    weather: Optional[Dict[str, Any]] = None,
    risk: Optional[Dict[str, Any]] = None,
    thermal: Optional[Dict[str, Any]] = None,
    timestamp: Optional[str] = None,
    is_test: bool = False,
    test_previous_level: Optional[str] = None,
    test_previous_score: Optional[float] = None,
    test_new_score: Optional[float] = None,
) -> Tuple[bool, Optional[str]]:
    """
    High-level entry point called for real-time alert delivery.
    Only sends for HIGH and EXTREME; ignores LOW and MODERATE.
    """
    success, err_msg, _ = send_heat_alert_email_with_id(
        recipient=recipient,
        alert_level=alert_level,
        location=location,
        weather=weather,
        risk=risk,
        thermal=thermal,
        timestamp=timestamp,
        is_test=is_test,
        test_previous_level=test_previous_level,
        test_previous_score=test_previous_score,
        test_new_score=test_new_score,
    )
    return success, err_msg


def send_demo_email(recipient: str) -> Tuple[bool, Optional[str]]:
    """
    Send exactly one real demo alert email via Resend for hackathon demonstration.
    Does NOT modify live alert state or trigger the scheduler.
    """
    subject, plain_text, html_text = build_demo_email_content(
        recipient=recipient,
        location="Tadepalligudem",
        temperature=44.0,
        risk_score=88.0,
    )
    return send_email(
        recipient=recipient,
        subject=subject,
        html_body=html_text,
        text_body=plain_text,
    )
