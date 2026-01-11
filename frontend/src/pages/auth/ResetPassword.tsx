import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ⭐️ FIX: Read token when page loads — from hash OR query
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const hashParams = new URLSearchParams(hash);
    const t1 = hashParams.get("access_token");

    const queryParams = new URLSearchParams(window.location.search);
    const t2 = queryParams.get("token");

    setToken(t1 || t2);
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!token) {
      setMessage("Invalid or expired reset link.");
      return;
    }

    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setMessage("Updating password...");

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(error.message || "Reset failed.");
        return;
      }

      setMessage("Password updated! Redirecting...");
      setTimeout(() => navigate("/auth/login"), 1500);
    } catch (err: any) {
      setMessage(err.message || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-xl text-white w-80 space-y-4">
        <h2 className="text-xl font-bold">Reset Password</h2>
        <p className="text-sm text-slate-300">Enter your new password.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              className="w-full px-3 py-2 rounded bg-slate-700 pr-10"
              placeholder="New password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-2.5 cursor-pointer text-slate-400"
            >
              {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          </div>

          <div className="relative">
            <input
              className="w-full px-3 py-2 rounded bg-slate-700 pr-10"
              placeholder="Confirm password"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <span
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-2.5 cursor-pointer text-slate-400"
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          </div>

          <button className="w-full bg-teal-500 py-2 rounded font-bold">
            Reset Password
          </button>
        </form>

        {message && <p className="text-teal-400 text-sm mt-2">{message}</p>}
      </div>
    </div>
  );
}
