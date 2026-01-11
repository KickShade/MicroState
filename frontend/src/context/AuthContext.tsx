// import { createContext, useContext, useEffect, useState } from "react";
// import { supabase } from "../lib/supabaseClient";
// import { useNavigate } from "react-router-dom";
// import { toast } from "sonner";

// interface User {
//   id: string;
//   email: string;
//   name?: string;
// }

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   signup: (name: string, email: string, password: string) => Promise<void>;
//   login: (email: string, password: string) => Promise<void>;
//   googleLogin: () => Promise<void>;
//   logout: () => Promise<void>;
//   isAuthenticated: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   // Sync user on refresh
//   useEffect(() => {
//     const syncAuthState = async () => {
//       const { data } = await supabase.auth.getUser();

//       if (data.user) {
//         setUser({
//           id: data.user.id,
//           email: data.user.email ?? "",
//           name: data.user.user_metadata?.name,
//         });
//       }
//     };

//     syncAuthState();

//     const { data: listener } = supabase.auth.onAuthStateChange(
//       async (_, session) => {
//         if (session?.user) {
//           setUser({
//             id: session.user.id,
//             email: session.user.email ?? "",
//             name: session.user.user_metadata?.name,
//           });
//         } else {
//           setUser(null);
//         }
//       }
//     );

//     return () => listener.subscription.unsubscribe();
//   }, []);

//   const signup = async (name: string, email: string, password: string) => {
//     setLoading(true);
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: { data: { name } },
//     });

//     if (error) {
//       setLoading(false);
//       toast.error(error.message);
//       throw new Error(error.message);
//     }

//     if (data.user) {
//       await supabase.from("profiles").insert({
//         id: data.user.id,
//         name,
//         email, // 👈 ADD THIS
//       });
//       toast.success("Signup successful \nCheck your inbox for verification!");
//     }

//     setLoading(false);
//     navigate("/auth/login");
//   };

//   const login = async (email: string, password: string) => {
//     setLoading(true);
//     const { error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error) {
//       setLoading(false);
//       toast.error("Incorrect email or password");
//       throw new Error(error.message);
//     }

//     toast.success("Logged in \nWelcome back, ${data.user.name}!");
//     setLoading(false);
//     navigate("/dashboard");
//   };

//   const googleLogin = async () => {
//     setLoading(true);
//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: "google",
//       options: { redirectTo: `${window.location.origin}/dashboard` },
//     });

//     if (error) {
//       setLoading(false);
//       toast.error(error.message);
//       throw new Error(error.message);
//     }
//     toast.info("Logged in with Google \nWelcome, ${mockUser.name}!");
//   };

//   const logout = async () => {
//     setLoading(true);
//     await supabase.auth.signOut();
//     toast.success("Logged out \nYou have successfully logged out");
//     setLoading(false);
//     navigate("/auth/login");
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         signup,
//         login,
//         googleLogin,
//         logout,
//         isAuthenticated: !!user,
//         loading,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//   return ctx;
// }

// import { createContext, useContext, useEffect, useState } from "react";
// import { supabase } from "../lib/supabaseClient";
// import { useNavigate } from "react-router-dom";
// import { toast } from "sonner";

// interface User {
//   id: string;
//   email: string;
//   name?: string;
// }

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   signup: (name: string, email: string, password: string) => Promise<void>;
//   login: (email: string, password: string) => Promise<void>;
//   googleLogin: () => Promise<void>;
//   logout: () => Promise<void>;
//   isAuthenticated: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   // Sync session on refresh
//   useEffect(() => {
//     const sync = async () => {
//       const { data } = await supabase.auth.getUser();
//       if (data.user) {
//         setUser({
//           id: data.user.id,
//           email: data.user.email ?? "",
//           name: data.user.user_metadata?.name,
//         });
//       }
//     };

//     sync();

//     const { data: listener } = supabase.auth.onAuthStateChange(
//       async (_, session) => {
//         if (session?.user) {
//           setUser({
//             id: session.user.id,
//             email: session.user.email ?? "",
//             name: session.user.user_metadata?.name,
//           });
//         } else {
//           setUser(null);
//         }
//       }
//     );

//     return () => listener.subscription.unsubscribe();
//   }, []);

//   /* ---------------- SIGNUP ---------------- */
//   const signup = async (name: string, email: string, password: string) => {
//     setLoading(true);

//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: { data: { name } },
//     });

//     if (error) {
//       setLoading(false);
//       toast.error(error.message);
//       throw new Error(error.message);
//     }

//     if (data.user) {
//       await supabase.from("profiles").insert({
//         id: data.user.id,
//         name,
//         email,
//       });

//       toast.success("Signup successful 🎉\nCheck your inbox!");
//     }

//     setLoading(false);
//     navigate("/auth/login");
//   };

//   /* ---------------- LOGIN ---------------- */
//   const login = async (email: string, password: string) => {
//     setLoading(true);

//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error) {
//       setLoading(false);
//       toast.error("Incorrect email or password ❌");
//       throw new Error(error.message);
//     }

//     toast.success(`Welcome back 👋`);
//     setLoading(false);
//     navigate("/dashboard");
//   };

//   /* ---------------- GOOGLE LOGIN ---------------- */
//   const googleLogin = async () => {
//     setLoading(true);

//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: "google",
//       options: { redirectTo: `${window.location.origin}/dashboard` },
//     });

//     if (error) {
//       setLoading(false);
//       toast.error(error.message);
//       throw new Error(error.message);
//     }

//     toast.success("Logging in with Google...");
//   };

//   /* ---------------- LOGOUT ---------------- */
//   const logout = async () => {
//     setLoading(true);
//     await supabase.auth.signOut();
//     setUser(null);

//     toast.success("You have been logged out 👋");
//     setLoading(false);
//     navigate("/auth/login");
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         signup,
//         login,
//         googleLogin,
//         logout,
//         isAuthenticated: !!user,
//         loading,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//   return ctx;
// }

import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

export default function AuthPages({ initialMode = "login" }) {
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const navigate = useNavigate();

  // password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetOnToggle = () => {
    setFormData({ email: "", password: "", confirmPassword: "", name: "" });
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
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { name: formData.name } },
        });

        if (error) throw error;

        toast.success("Signup successful 🎉 Check your inbox!");
        setIsSignUp(false);
        resetOnToggle();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast.success("Welcome back 👋");
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex justify-center px-4 pb-4
      ${isSignUp ? "items-start pt-2" : "items-center pt-0"}`}
    >
      {/* background glow */}
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

          {/* error banner (optional) */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4 mb-6" onSubmit={handleSubmit}>
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
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white"
                  />
                </div>
              </div>
            )}

            {/* email */}
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
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white"
                />
              </div>
            </div>

            {/* password */}
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
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-12 py-2.5 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* confirm password */}
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
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-12 py-2.5 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
            )}

            {/* submit */}
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

          {/* 🔥 SLIDE ANIMATION TOGGLE */}
          <div className="relative bg-slate-900 rounded-lg p-1 flex">
            {/* sliding pill */}
            <div
              className={`absolute top-1 bottom-1 w-1/2 rounded-md bg-teal-500 transition-all duration-300 ${
                isSignUp ? "left-1" : "left-[50%]"
              }`}
            ></div>

            <button
              onClick={() => {
                resetOnToggle();
                setIsSignUp(true);
              }}
              className={`relative z-10 flex-1 py-2 font-semibold rounded-md transition-colors ${
                isSignUp
                  ? "text-slate-900"
                  : "text-teal-400 hover:text-teal-300"
              }`}
            >
              Sign Up
            </button>

            <button
              onClick={() => {
                resetOnToggle();
                setIsSignUp(false);
              }}
              className={`relative z-10 flex-1 py-2 font-semibold rounded-md transition-colors ${
                !isSignUp
                  ? "text-slate-900"
                  : "text-teal-400 hover:text-teal-300"
              }`}
            >
              Log In
            </button>
          </div>

          {/* forgot password */}
          {!isSignUp && (
            <p
              className="text-center text-slate-400 text-xs mt-6 cursor-pointer hover:text-teal-400"
              onClick={() => navigate("/auth/forgot-password")}
            >
              Forgot your password?
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
