import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("auth/token/", { username, password });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      localStorage.setItem("username", username);
      navigate("/dashboard");
    } catch {
      setError("Invalid username or password.");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <i className="bi bi-receipt-cutoff"></i>
        </div>
        <h2>Welcome to YourBillBook</h2>
        <p className="text-secondary mb-4">
          Manage billing, sales and inventory in one place.
        </p>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={submit}>
          <label className="form-label">Username</label>
          <input
            className="form-control form-control-lg mb-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control form-control-lg mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn btn-primary btn-lg w-100">Sign in</button>
        </form>
        <p className="text-center text-secondary mt-4 mb-0">
          New here? <a href="/register">Create an account</a>
        </p>
      </div>
    </div>
  );
}
