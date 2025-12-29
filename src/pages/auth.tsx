import { useState } from "react";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

export default function AuthPages({ initialMode = "login" }) {
  const { login, signup, googleLogin } = useAuth();
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [hoveredButton, setHoveredButton] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        signup(formData.name, formData.email, formData.password);
      } else {
        login(formData.email, formData.password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      googleLogin(credentialResponse.credential);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-20">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-slate-400 text-sm">
              {isSignUp
                ? "Join Microstate to analyze order book dynamics"
                : "Sign in to your Microstate account"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4 mb-6">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-teal-500/60" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-teal-500/60" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-teal-500/60" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-slate-900 font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Google Login */}
          <div className="mb-6">
            <div className="relative h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-6"></div>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google login failed")}
                theme="filled_black"
                size="large"
              />
            </div>
          </div>

          {/* Toggle Section */}
          <div className="space-y-4">
            <div className="relative h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>

            <div className="flex gap-3">
              <button
                onMouseEnter={() => setHoveredButton("signup")}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  backgroundColor:
                    hoveredButton === "login"
                      ? "hsl(160 84% 39%)"
                      : hoveredButton === "signup"
                      ? "transparent"
                      : "hsl(160 84% 39%)",
                  color:
                    hoveredButton === "login"
                      ? "hsl(222 84% 5%)"
                      : hoveredButton === "signup"
                      ? "hsl(160 84% 39%)"
                      : "hsl(222 84% 5%)",
                  borderColor: "hsl(160 84% 39%)",
                  transition: "all 300ms ease",
                }}
                onClick={() => {
                  setIsSignUp(true);
                  setError("");
                }}
                className="px-14 py-3 rounded-lg border-2 font-semibold text-lg"
              >
                Sign Up
              </button>
              <button
                onMouseEnter={() => setHoveredButton("login")}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  backgroundColor:
                    hoveredButton === "signup"
                      ? "hsl(160 84% 39%)"
                      : hoveredButton === "login"
                      ? "transparent"
                      : "transparent",
                  color:
                    hoveredButton === "signup"
                      ? "hsl(222 84% 5%)"
                      : hoveredButton === "login"
                      ? "hsl(160 84% 39%)"
                      : "hsl(160 84% 39%)",
                  borderColor: "hsl(160 84% 39%)",
                  transition: "all 300ms ease",
                }}
                onClick={() => {
                  setIsSignUp(false);
                  setError("");
                }}
                className="ml-3 px-14 py-3 rounded-lg border-2 font-semibold text-lg"
              >
                Log In
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-slate-400 text-xs mt-6">
            {isSignUp
              ? "By signing up, you agree to our Terms of Service and Privacy Policy"
              : "Forgot your password?"}
          </p>
        </div>
      </div>
    </div>
  );
}