"use client";

import { useState } from "react";
import Image from "next/image";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        setError(payload?.error || "Login failed");
        return;
      }
      window.location.href = "/admin";
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <Image
          src="/assets/jahez/logo.jpg"
          alt="Jahez"
          width={200}
          height={49}
          className="admin-login-logo"
          priority
        />
        <span className="admin-login-subtitle">CONTROL ROOM</span>
        <p className="admin-login-desc">
          Sign in to access the admin dashboard.
        </p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <label>
            <span>Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              maxLength={160}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@jahez.local"
              dir="ltr"
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              dir="ltr"
            />
          </label>
          {error && <p className="admin-login-error">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="admin-login-button"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
