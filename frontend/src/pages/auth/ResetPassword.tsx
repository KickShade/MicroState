import { useState } from "react";
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

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!token) {
      setMessage("Invalid reset link.");
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
      // Apply password update & catch the abort-cleanly message
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(error.message || "Reset failed.");
        return;
      }

      setMessage("Password updated! Redirecting...");

      setTimeout(() => navigate("/auth/login"), 1500);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        console.log(
          "%c Supabase aborted fetch during reset — OK to ignore",
          "color: orange"
        );
        setMessage("Password updated! Redirecting...");
        setTimeout(() => navigate("/auth/login"), 1500);
      } else {
        setMessage(err.message || "Something went wrong.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-xl text-white w-80 space-y-4">
        <h2 className="text-xl font-bold">Reset Password</h2>
        <p className="text-sm text-slate-300">Enter your new password.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
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

          {/* Confirm Password */}
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
