import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

export default function AuthPages({ initialMode = "login" }) {
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const navigate = useNavigate();

  // show password toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetOnToggle = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignUp && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { name: formData.name } },
        });

        if (error) throw error;

        if (data.user) {
          await supabase.from("profiles").insert({
            id: data.user.id,
            email: formData.email,
            name: formData.name,
          });

          resetOnToggle();
          setIsSignUp(false);

          toast.success(
            "Signup successful. Check your inbox/spam to verify your email."
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        const user = data.user;
        const name =
          user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

        toast.success(`Logged in ${user.email} \n Welcome, ${name}!`);

        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");

    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (err: any) {
      setError(err.message || "Google login failed");
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex justify-center px-4 pb-4
      ${isSignUp ? "items-start pt-2" : "items-center pt-0"}`}
    >
      {/* background lights */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

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

          {/* ERROR BANNER */}
          {error && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm border ${
                error.includes("successful")
                  ? "bg-green-500/10 border-green-500/50 text-green-400"
                  : "bg-red-500/10 border-red-500/50 text-red-400"
              }`}
            >
              {error}
            </div>
          )}

          <form className="space-y-4 mb-6" onSubmit={handleSubmit}>
            {/* NAME */}
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

            {/* EMAIL */}
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

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-teal-500/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-12 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-teal-500/60" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-12 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white transition"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-slate-900 font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* GOOGLE OAUTH */}
          <div className="mb-6">
            <div className="relative h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-6"></div>

            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-200 text-slate-900 font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* TOGGLE */}
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
            {isSignUp ? (
              "By signing up, you agree to our Terms of Service and Privacy Policy"
            ) : (
              <Link
                to="/auth/forgot-password"
                className="hover:text-teal-400 underline underline-offset-4 cursor-pointer transition"
              >
                Forgot your password?
              </Link>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
