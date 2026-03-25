import React from "react";
import { motion } from "framer-motion";
import { Lock, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hero-grid city-overlay flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md p-7"
      >
        <p className="text-sm font-semibold text-eco-700">GeoSentinel OS</p>
        <h1 className="mt-1 text-3xl font-extrabold text-civic-900">Sign In</h1>
        <p className="mt-2 text-sm text-slate-600">Use municipal account credentials to continue.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Email</span>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3">
              <User size={16} className="text-slate-400" />
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent px-2 py-3 outline-none"
                placeholder="Enter email"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Password</span>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3">
              <Lock size={16} className="text-slate-400" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="w-full bg-transparent px-2 py-3 outline-none"
                placeholder="Enter password"
              />
            </div>
          </label>

          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-civic-600 px-4 py-3 font-semibold text-white transition hover:bg-civic-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
