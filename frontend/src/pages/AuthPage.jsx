import React, { useState } from "react";
import {
  Shield,
  Sun,
  Flame,
  Thermometer,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  TrendingUp,
  MapPin,
  Laptop,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { loginUser, registerUser } from "../services/api";

export function AuthPage({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);

  // Form State
  const [identifier, setIdentifier] = useState(""); // Email or Username
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Signup fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isSignUp) {
      // Validation for Sign Up
      if (!fullName.trim()) {
        setErrorMessage("Full Name is required.");
        return;
      }
      if (!email.trim() || !email.includes("@") || !email.includes(".")) {
        setErrorMessage("Please enter a valid email address.");
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Password confirmation does not match.");
        return;
      }

      setIsLoading(true);
      try {
        const result = await registerUser({
          fullName: fullName.trim(),
          email: email.trim(),
          password: password,
        });

        if (result && result.access_token) {
          if (rememberMe) {
            localStorage.setItem("heatshield_token", result.access_token);
            localStorage.setItem("heatshield_user", JSON.stringify(result.user));
          } else {
            sessionStorage.setItem("heatshield_token", result.access_token);
            sessionStorage.setItem("heatshield_user", JSON.stringify(result.user));
          }
          if (onLoginSuccess) {
            onLoginSuccess(result.user, result.access_token);
          }
        }
      } catch (err) {
        setErrorMessage(err.message || "Registration failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Validation for Login
      if (!identifier.trim()) {
        setErrorMessage("Email or Username is required.");
        return;
      }
      if (!password) {
        setErrorMessage("Password is required.");
        return;
      }

      setIsLoading(true);
      try {
        const result = await loginUser(identifier.trim(), password, rememberMe);

        if (result && result.access_token) {
          if (rememberMe) {
            localStorage.setItem("heatshield_token", result.access_token);
            localStorage.setItem("heatshield_user", JSON.stringify(result.user));
          } else {
            sessionStorage.setItem("heatshield_token", result.access_token);
            sessionStorage.setItem("heatshield_user", JSON.stringify(result.user));
          }
          if (onLoginSuccess) {
            onLoginSuccess(result.user, result.access_token);
          }
        }
      } catch (err) {
        setErrorMessage(err.message || "Invalid email or password.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070b14] text-slate-100 flex flex-col justify-between relative overflow-x-hidden font-sans selection:bg-orange-500 selection:text-white">
      {/* Background Graphic with Atmospheric Sunset Cityscape */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/heatshield-login-bg.jpg"
          alt="HeatShield Cityscape Sunset Atmosphere"
          className="w-full h-full object-cover object-center opacity-30 filter saturate-125"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b14]/95 via-[#070b14]/80 to-[#070b14]/95"></div>
        <div className="absolute inset-0 bg-radial from-orange-600/10 via-transparent to-transparent"></div>
      </div>

      {/* Top Banner Tagline */}
      <div className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/40 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-md shadow-orange-500/20 border border-amber-400/40">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-wider text-white">
              HEAT<span className="text-amber-400">SHIELD</span> <span className="text-xs text-orange-400 font-mono">AI</span>
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-amber-300/90 italic">
          <span>Hotter days. Smarter alerts.</span>
        </div>
      </div>

      {/* Main Split Section (Desktop: Left 55-60%, Right 40-45%) */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ============================================================ */}
          {/* LEFT SIDE: Brand, Mission, & Interactive Preview (58% width) */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            {/* Logo Badge */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25 border border-amber-300/30">
                <div className="relative">
                  <Shield className="w-7 h-7 text-white" />
                  <Thermometer className="w-4 h-4 text-amber-200 absolute -bottom-1 -right-1" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase">
                  HEAT <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">SHIELD</span>
                </h2>
                <p className="text-[11px] font-mono tracking-[0.25em] text-amber-400/90 uppercase font-semibold">
                  DETECT • ALERT • PROTECT
                </p>
              </div>
            </div>

            {/* Main Headline & Supporting Copy */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
                Extreme heat <span className="italic font-serif font-normal text-amber-300">isn't just a number...</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                It's a real health risk. <strong className="text-amber-400 font-semibold">HeatShield AI</strong> helps communities detect heat risk early, understand who's most vulnerable, and take action before extreme heat becomes dangerous.
              </p>
            </div>

            {/* Feature Highlights with Circular Warm Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm flex flex-col gap-1.5 hover:border-amber-500/40 transition-colors shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Thermometer className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-white">Real-Time Monitoring</div>
                <div className="text-[11px] text-slate-400 leading-snug">
                  Live temperature, humidity, WBGT & UTCI thermal metrics.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm flex flex-col gap-1.5 hover:border-orange-500/40 transition-colors shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-white">Intelligent Alerts</div>
                <div className="text-[11px] text-slate-400 leading-snug">
                  Automated warnings & SHAP-explained contributing factors.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm flex flex-col gap-1.5 hover:border-red-500/40 transition-colors shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-white">Hyperlocal Protection</div>
                <div className="text-[11px] text-slate-400 leading-snug">
                  Ward-level precision & demographic vulnerability scoring.
                </div>
              </div>
            </div>

            {/* Decorative Product Preview Card (Floating Preview from Reference) */}
            <div className="hidden sm:flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-slate-900/90 to-slate-950/90 border border-slate-800/90 shadow-lg max-w-xl backdrop-blur-sm">
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
                <div>
                  <div className="text-[10px] uppercase font-mono text-slate-400">Pilot Telemetry</div>
                  <div className="text-sm font-bold text-white">41.2°C <span className="text-[11px] text-red-400 font-mono font-bold">EXTREME</span></div>
                </div>
              </div>

              <div className="flex-1 border-l border-slate-800 pl-3">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <strong>West Godavari</strong> (Tadepalligudem)
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                    Active Pilot
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Early warning command center ready for disaster officers & public health teams.
                </div>
              </div>
            </div>

            {/* Footer Tagline */}
            <div className="text-xs font-mono text-amber-400/80 font-bold tracking-wider">
              Be Aware. Be Prepared.
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT SIDE: Premium Dark Login / Sign Up Card (42% width)    */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
              {/* Subtle top ember glow */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b from-orange-500/20 to-transparent blur-xl pointer-events-none"></div>

              {/* Card Header */}
              <div className="text-center space-y-2 mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 shadow-md shadow-orange-500/20 border border-amber-400/40 mb-1">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-black text-white tracking-wide uppercase">
                  HEAT <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">SHIELD</span>
                </h3>
                <p className="text-[10px] font-mono tracking-[0.2em] text-slate-400 uppercase font-semibold">
                  STAY ALERT • STAY SAFE
                </p>

                <div className="pt-2">
                  <h2 className="text-xl font-extrabold text-white">
                    {isSignUp ? "Create Account" : "Welcome Back!"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isSignUp
                      ? "Register for HeatShield AI Command Center"
                      : "Log in to your HeatShield AI account"}
                  </p>
                </div>
              </div>

              {/* Error Alert Banner */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800/60 text-xs text-red-200 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">{errorMessage}</div>
                </div>
              )}

              {/* Success Alert Banner */}
              {successMessage && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-200 flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1">{successMessage}</div>
                </div>
              )}

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Sign Up Fields: Full Name */}
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Dr. A. Sharma"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/70 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Email or Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {isSignUp ? "Email Address" : "Email or Username"}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={isSignUp ? "email" : "text"}
                      value={isSignUp ? email : identifier}
                      onChange={(e) =>
                        isSignUp
                          ? setEmail(e.target.value)
                          : setIdentifier(e.target.value)
                      }
                      placeholder={isSignUp ? "name@example.com" : "Email or username"}
                      required
                      autoComplete={isSignUp ? "email" : "username"}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/70 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/70 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field (Sign Up Mode) */}
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/70 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remember Me & Forgot Password (Login Mode) */}
                {!isSignUp && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer accent-amber-500"
                      />
                      <span>Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Primary CTA Button with Warm Heat Gradient */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white tracking-wide bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 active:scale-[0.99] transition-all duration-150 shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isSignUp ? "Creating Account..." : "Logging In..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{isSignUp ? "CREATE ACCOUNT" : "Login"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Login / Sign Up */}
              <div className="mt-6 text-center text-xs text-slate-400">
                {isSignUp ? (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false);
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer underline ml-1"
                    >
                      Log In
                    </button>
                  </span>
                ) : (
                  <span>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true);
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer underline ml-1"
                    >
                      Sign Up
                    </button>
                  </span>
                )}
              </div>

              {/* Bottom Feature Footer */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-around text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>Monitor</span>
                </span>
                <span className="text-slate-700">•</span>
                <span className="flex items-center gap-1">
                  <Bell className="w-3 h-3 text-orange-400" />
                  <span>Alert</span>
                </span>
                <span className="text-slate-700">•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-red-400" />
                  <span>Protect</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Password Recovery</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Password recovery is managed by your system administrator. Please contact your organization administrator to reset your credentials.
            </p>
            <button
              onClick={() => setForgotModalOpen(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Bottom Footer */}
      <footer className="relative z-10 py-3 text-center text-[11px] text-slate-400 border-t border-slate-800/40 font-mono">
        HeatShield AI • Hyperlocal Heat-Health Early Warning System • Pilot Command Center
      </footer>
    </div>
  );
}

export default AuthPage;
