import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setMessage("");

    if (!email) {
      setMessage("Please enter an email.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("A reset link has been sent to your email.");
    setTimeout(() => navigate("/auth/login"), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-xl text-white w-80 space-y-4">
        <h2 className="text-xl font-bold">Forgot Password</h2>
        <p className="text-sm text-slate-300">
          Enter your email and we’ll send a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full px-3 py-2 rounded bg-slate-700"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
          <button
            disabled={loading}
            className="w-full bg-teal-500 py-2 rounded font-bold disabled:bg-teal-500/50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && <p className="text-teal-400 text-sm mt-2">{message}</p>}
      </div>
    </div>
  );
}
