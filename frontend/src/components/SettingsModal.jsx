import React, { useState, useEffect } from "react";
import {
  X,
  Settings,
  Shield,
  Sliders,
  Bell,
  Volume2,
  VolumeX,
  Sparkles,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { getEmailStatus, sendDemoEmail } from "../services/api";

export function SettingsModal({
  isOpen,
  onClose,
  browserPermission = "default",
  onRequestBrowserPermission,
  isSoundEnabled = false,
  onToggleSound,
  onSimulateAlert,
  activeSimulation = null,
  user = null,
  token = null,
  selectedLocation = null,
  isEmailAlertsEnabled = true,
  onToggleEmailAlerts,
}) {
  const [emailConfig, setEmailConfig] = useState({
    status: "Not configured",
    enabled: false,
    configured: false,
    monitoring_active: false,
    monitored_location: null,
  });
  const [sendingDemoAlert, setSendingDemoAlert] = useState(false);
  const [demoAlertResult, setDemoAlertResult] = useState(null);

  const effectiveToken =
    token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("heatshield_token") || sessionStorage.getItem("heatshield_token")
      : null);

  const effectiveUser =
    user ||
    (typeof window !== "undefined"
      ? (() => {
          try {
            const raw =
              localStorage.getItem("heatshield_user") ||
              sessionStorage.getItem("heatshield_user");
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        })()
      : null);

  const recipientEmail = effectiveUser?.email || "officer@heatshield.ai";

  useEffect(() => {
    if (isOpen && effectiveToken) {
      getEmailStatus(effectiveToken)
        .then((data) => {
          if (data && data.status) {
            setEmailConfig(data);
          }
        })
        .catch(() => {
          setEmailConfig({ status: "Not configured", enabled: false, configured: false });
        });
    }
  }, [isOpen, effectiveToken]);

  if (!isOpen) return null;

  const handleSendDemoAlert = async () => {
    setSendingDemoAlert(true);
    setDemoAlertResult(null);
    try {
      const res = await sendDemoEmail(effectiveToken);
      if (res && res.sent) {
        setDemoAlertResult({
          success: true,
          message: res.message || "Demo alert email sent successfully.",
        });
      } else {
        const errorDetail = res?.error || res?.message || "Failed to deliver demo email.";
        setDemoAlertResult({
          success: false,
          message: errorDetail.startsWith("Unable to send email:")
            ? errorDetail
            : `Unable to send email: ${errorDetail}`,
        });
      }
    } catch (err) {
      const errorDetail = err.message || "Failed to deliver demo email.";
      setDemoAlertResult({
        success: false,
        message: errorDetail.startsWith("Unable to send email:")
          ? errorDetail
          : `Unable to send email: ${errorDetail}`,
      });
    } finally {
      setSendingDemoAlert(false);
    }
  };

  const activeLocName =
    selectedLocation?.name ||
    emailConfig?.monitored_location?.monitored_location_name ||
    "Tadepalligudem";

  const isMonitoringActive = Boolean(isEmailAlertsEnabled);
  const isConfigured = Boolean(
    emailConfig?.configured ||
    emailConfig?.status === "Configured" ||
    emailConfig?.status === "Enabled"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              System Settings & Demo Panel
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Section 1: Notification & Audio Preferences */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              Notification & Audio Preferences
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-855">
              <div>
                <span className="font-semibold text-slate-300 block">Browser Desktop Alerts</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Status: {browserPermission === "granted" ? "🟢 Enabled" : browserPermission === "denied" ? "🔴 Blocked" : "⚪ Default (Not prompted)"}
                </span>
              </div>
              {browserPermission !== "granted" ? (
                <button
                  onClick={onRequestBrowserPermission}
                  className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Enable Alerts
                </button>
              ) : (
                <span className="text-emerald-400 text-[11px] font-mono font-semibold">Active</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-855">
              <div className="flex items-center gap-1.5">
                {isSoundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
                <div>
                  <span className="font-semibold text-slate-300 block">Alert Sound</span>
                  <span className="text-[10px] text-slate-500">Audio pulse on critical heat events (default OFF)</span>
                </div>
              </div>
              <button
                onClick={onToggleSound}
                className={`px-2.5 py-1 rounded font-mono text-[11px] font-bold transition-colors cursor-pointer border ${
                  isSoundEnabled
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-850 text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
              >
                {isSoundEnabled ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Section 2: Email Alerts */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-sm">📧</span>
                <span>Email Alerts</span>
              </div>
              {isConfigured ? (
                <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Configured
                </span>
              ) : (
                <span className="text-[10px] font-mono text-amber-400 font-normal">Not configured</span>
              )}
            </div>

            <div className="space-y-2 pt-1 border-t border-slate-850 text-xs">
              {/* Provider */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Provider</span>
                <span className="font-mono font-bold text-slate-200">
                  {emailConfig?.provider || "Resend"}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Status</span>
                <span className="font-mono font-bold">
                  {isConfigured ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Configured
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                      Not configured
                    </span>
                  )}
                </span>
              </div>

              {/* Recipient */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Recipient</span>
                <span className="font-mono text-amber-300 font-semibold truncate max-w-[220px]" title={recipientEmail}>
                  {recipientEmail}
                </span>
              </div>

              {/* Monitoring */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-850/60">
                <div>
                  <span className="text-slate-400 font-semibold block">Monitoring</span>
                  <span className="font-mono text-[11px] font-bold">
                    {isMonitoringActive ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Enabled
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        Disabled
                      </span>
                    )}
                  </span>
                </div>
                {onToggleEmailAlerts && (
                  <button
                    onClick={onToggleEmailAlerts}
                    className={`px-2.5 py-1 rounded font-mono text-[11px] font-bold transition-colors cursor-pointer border ${
                      isMonitoringActive
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-850 text-slate-400 border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {isMonitoringActive ? "ENABLED" : "DISABLED"}
                  </button>
                )}
              </div>

              {/* Monitored Location */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Monitored Location</span>
                <span className="font-mono text-slate-200 font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  {activeLocName}
                </span>
              </div>

              {/* Sender & Domain Status */}
              {isConfigured && emailConfig?.email_from && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Sender</span>
                  <span className="font-mono text-slate-300 font-semibold">
                    {emailConfig.email_from}
                  </span>
                </div>
              )}

              {/* Status Message */}
              {isConfigured ? (
                <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300 leading-relaxed font-sans flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Automatic email alerts are enabled.</span>
                </div>
              ) : (
                <div className="p-2 rounded bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300 leading-relaxed font-sans flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Automatic email alerts are not configured. Add the Resend API key to the backend environment.</span>
                </div>
              )}

              {isConfigured && emailConfig?.sender_verification_note && (
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 leading-relaxed font-sans">
                  ℹ️ {emailConfig.sender_verification_note}
                </div>
              )}

              {/* Send Demo Alert Button */}
              <div className="pt-2 border-t border-slate-850/60">
                <button
                  onClick={handleSendDemoAlert}
                  disabled={sendingDemoAlert}
                  className="w-full py-2 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[11px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingDemoAlert ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                      <span>Sending Demo Alert...</span>
                    </>
                  ) : (
                    <>
                      <span>🚨</span>
                      <span>Send Demo Alert</span>
                    </>
                  )}
                </button>

                {demoAlertResult && (
                  <div
                    className={`mt-2 p-2 rounded text-[11px] font-medium leading-snug flex items-start gap-1.5 ${
                      demoAlertResult.success
                        ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300"
                        : "bg-red-950/40 border border-red-500/40 text-red-300"
                    }`}
                  >
                    {demoAlertResult.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <span>{demoAlertResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: DEMO ALERT SIMULATOR */}
          <div className="bg-amber-950/20 p-3.5 rounded-xl border border-amber-500/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                DEMO ALERT SIMULATOR
              </div>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] font-mono text-amber-300 font-bold uppercase">
                DEMO ONLY
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Simulate risk state transitions for testing real-time notifications, badge counters, and desktop alerts without altering underlying production ML calculations.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onSimulateAlert && onSimulateAlert("HEAT_WARNING")}
                className="p-2 rounded-lg bg-orange-950/40 hover:bg-orange-900/50 border border-orange-500/40 text-orange-200 text-[11px] font-semibold text-left transition-colors cursor-pointer"
              >
                ⚠️ Simulate Warning
                <span className="block text-[10px] font-mono text-orange-400/80">Risk 68 / 100</span>
              </button>
              <button
                onClick={() => onSimulateAlert && onSimulateAlert("EXTREME_HEAT_EMERGENCY")}
                className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-200 text-[11px] font-semibold text-left transition-colors cursor-pointer"
              >
                🚨 Simulate Extreme
                <span className="block text-[10px] font-mono text-red-400/80">Risk 86 / 100</span>
              </button>
              <button
                onClick={() => onSimulateAlert && onSimulateAlert("RISK_SURGE")}
                className="p-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-200 text-[11px] font-semibold text-left transition-colors cursor-pointer"
              >
                📈 Simulate +8 Shift
                <span className="block text-[10px] font-mono text-amber-400/80">Risk 64 → 72</span>
              </button>
              <button
                onClick={() => onSimulateAlert && onSimulateAlert("RESET")}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-semibold text-left transition-colors cursor-pointer"
              >
                🔄 Reset Simulation
                <span className="block text-[10px] font-mono text-slate-400">Restore Live State</span>
              </button>
            </div>

            {activeSimulation && (
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300 flex items-center justify-between">
                <span>Active simulation: {activeSimulation}</span>
                <span className="underline cursor-pointer" onClick={() => onSimulateAlert && onSimulateAlert("RESET")}>
                  Clear
                </span>
              </div>
            )}
          </div>

          {/* Section 4: Change Detection Rules & Setting */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 font-bold font-sans text-slate-200 mb-1">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              State Change Detection Parameters
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Polling Interval:</span>
              <span className="text-amber-400 font-bold">60 seconds</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Risk Change Threshold:</span>
              <span className="text-blue-400 font-bold">±5.0 risk points</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>6h Predictive Trigger:</span>
              <span className="text-orange-400 font-bold">Mod → High / High → Extreme</span>
            </div>
          </div>

          {/* Section 5: Pilot Info */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Operational Pilot
            </div>
            <p className="text-slate-400">
              Pilot Region: <strong className="text-slate-200">West Godavari</strong> (19 Mandals)
            </p>
            <p className="text-slate-400 mt-0.5">
              ML Engine: <span className="font-mono text-slate-300">XGBoost 6h Horizon + SHAP TreeExplainer</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
