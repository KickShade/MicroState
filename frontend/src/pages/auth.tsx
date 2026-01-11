// import { Link } from "react-router-dom";
// import { ArrowLeft } from "lucide-react";
// import { useState } from "react";
// import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "../lib/supabaseClient";

// export default function AuthPages({ initialMode = "login" }) {
//   const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
//   const [hoveredButton, setHoveredButton] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//     confirmPassword: "",
//     name: "",
//   });

//   const navigate = useNavigate();

//   // show password toggles
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const resetOnToggle = () => {
//     setFormData({
//       email: "",
//       password: "",
//       confirmPassword: "",
//       name: "",
//     });
//     setError("");
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     if (isSignUp && formData.password !== formData.confirmPassword) {
//       setError("Passwords do not match");
//       return;
//     }

//     setLoading(true);

//     try {
//       if (isSignUp) {
//         const { error } = await supabase.auth.signUp({
//           email: formData.email,
//           password: formData.password,
//           options: {
//             data: { name: formData.name },
//           },
//         });

//         if (error) throw error;

//         setError("Signup successful — please check your email");
//         setIsSignUp(false);
//         resetOnToggle();
//       } else {
//         const { error } = await supabase.auth.signInWithPassword({
//           email: formData.email,
//           password: formData.password,
//         });

//         if (error) throw error;
//         navigate("/dashboard");
//       }
//     } catch (err: any) {
//       setError(err.message || "Authentication failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div
//       className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex justify-center px-4 pb-4
//       ${isSignUp ? "items-start pt-2" : "items-center pt-0"}`}
//     >
//       {/* background lights */}
//       <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
//       <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

//       <div className="relative z-10 w-full max-w-md">
//         <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
//           <Link
//             to="/"
//             className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition mb-4"
//           >
//             <ArrowLeft className="h-4 w-4" />
//             Back to Home
//           </Link>

//           <div className="mb-8">
//             <h1 className="text-3xl font-bold text-white mb-2">
//               {isSignUp ? "Create Account" : "Welcome Back"}
//             </h1>
//             <p className="text-slate-400 text-sm">
//               {isSignUp
//                 ? "Join Microstate to analyze order book dynamics"
//                 : "Sign in to your Microstate account"}
//             </p>
//           </div>

//           {/* ERROR BANNER */}
//           {error && (
//             <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
//               {error}
//             </div>
//           )}

//           <form className="space-y-4 mb-6" onSubmit={handleSubmit}>
//             {/* NAME */}
//             {isSignUp && (
//               <div>
//                 <label className="block text-sm font-medium text-slate-300 mb-2">
//                   Full Name
//                 </label>
//                 <div className="relative">
//                   <User className="absolute left-3 top-3 h-5 w-5 text-teal-500/60" />
//                   <input
//                     type="text"
//                     name="name"
//                     value={formData.name}
//                     onChange={handleInputChange}
//                     placeholder="John Doe"
//                     className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white"
//                   />
//                 </div>
//               </div>
//             )}

//             {/* EMAIL */}
//             <div>
//               <label className="block text-sm font-medium text-slate-300 mb-2">
//                 Email Address
//               </label>
//               <div className="relative">
//                 <Mail className="absolute left-3 top-3 h-5 w-5 text-teal-500/60" />
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   placeholder="you@example.com"
//                   className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white"
//                 />
//               </div>
//             </div>

//             {/* PASSWORD */}
//             <div>
//               <label className="block text-sm font-medium text-slate-300 mb-2">
//                 Password
//               </label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-3 h-5 w-5 text-teal-500/60" />
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   value={formData.password}
//                   onChange={handleInputChange}
//                   placeholder="••••••••"
//                   className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-12 py-2.5 text-white"
//                 />

//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-3 text-slate-400 hover:text-white"
//                 >
//                   {showPassword ? <EyeOff /> : <Eye />}
//                 </button>
//               </div>
//             </div>

//             {/* CONFIRM PASSWORD */}
//             {isSignUp && (
//               <div>
//                 <label className="block text-sm font-medium text-slate-300 mb-2">
//                   Confirm Password
//                 </label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-3 h-5 w-5 text-teal-500/60" />
//                   <input
//                     type={showConfirmPassword ? "text" : "password"}
//                     name="confirmPassword"
//                     value={formData.confirmPassword}
//                     onChange={handleInputChange}
//                     placeholder="••••••••"
//                     className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-12 py-2.5 text-white"
//                   />

//                   <button
//                     type="button"
//                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                     className="absolute right-3 top-3 text-slate-400 hover:text-white"
//                   >
//                     {showConfirmPassword ? <EyeOff /> : <Eye />}
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* SUBMIT */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-slate-900 font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
//             >
//               {loading ? (
//                 <>
//                   <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
//                   Loading...
//                 </>
//               ) : (
//                 <>
//                   {isSignUp ? "Create Account" : "Sign In"}
//                   <ArrowRight className="h-4 w-4" />
//                 </>
//               )}
//             </button>
//           </form>

//           {/* TOGGLE */}
//           <div className="space-y-4">
//             <div className="relative h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>

//             <div className="flex gap-3">
//               <button
//                 onClick={() => {
//                   resetOnToggle();
//                   setIsSignUp(true);
//                 }}
//                 className="px-14 py-3 rounded-lg border-2 font-semibold text-lg text-teal-500 border-teal-500"
//               >
//                 Sign Up
//               </button>

//               <button
//                 onClick={() => {
//                   resetOnToggle();
//                   setIsSignUp(false);
//                 }}
//                 className="px-14 py-3 rounded-lg border-2 font-semibold text-lg text-teal-500 border-teal-500"
//               >
//                 Log In
//               </button>
//             </div>
//           </div>

//           {!isSignUp && (
//             <p
//               className="text-center text-slate-400 text-xs mt-6 cursor-pointer hover:text-teal-400"
//               onClick={() => navigate("/auth/forgot-password")}
//             >
//               Forgot your password?
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
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
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPages({ initialMode = "login" }) {
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleInput = (e: any) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match ❌");
          setLoading(false);
          return;
        }

        const { error, data } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { name: formData.name } },
        });

        if (error) throw error;

        toast.success("Signup successful 🎉\nVerify your email!");
        resetForm();
        setIsSignUp(false);
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
      toast.error(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <AnimatePresence mode="wait">
          <motion.div
            key={isSignUp ? "signup" : "login"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.35 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              {isSignUp
                ? "Join MicroState to analyze markets"
                : "Sign in to continue"}
            </p>

            <form className="space-y-4" onSubmit={handleAuth}>
              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-teal-500" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInput}
                    placeholder="Full Name"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white"
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-teal-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInput}
                  placeholder="you@example.com"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-teal-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInput}
                  placeholder="••••••••"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-12 py-2.5 text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-3 text-slate-400"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {isSignUp && (
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-teal-500" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInput}
                    placeholder="Confirm Password"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-12 py-2.5 text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-3 top-3 text-slate-400"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              )}

              <button
                disabled={loading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
              >
                {isSignUp ? "Create Account" : "Sign In"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {!isSignUp && (
              <p
                className="text-center text-slate-400 text-xs mt-6 cursor-pointer hover:text-teal-400"
                onClick={() => navigate("/auth/forgot-password")}
              >
                Forgot your password?
              </p>
            )}

            <p className="text-center text-slate-400 text-sm mt-6">
              {isSignUp ? "Already have an account? " : "New here? "}
              <span
                className="text-teal-400 cursor-pointer hover:underline"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  resetForm();
                }}
              >
                {isSignUp ? "Log In" : "Sign Up"}
              </span>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
