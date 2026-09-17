import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await api.post("auth/register/", form);
      setSuccess("Account created. Redirecting to login...");
      setTimeout(() => navigate("/login"), 800);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Could not create account.");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <i className="bi bi-person-plus"></i>
        </div>
        <h2>Create your account</h2>
        <p className="text-secondary mb-4">
          Register to start managing your business.
        </p>

        {error && <div className="alert alert-danger py-2">{error}</div>}
        {success && <div className="alert alert-success py-2">{success}</div>}

        <form onSubmit={submit}>
          <label className="form-label">Username</label>
          <input
            name="username"
            className="form-control form-control-lg mb-3"
            value={form.username}
            onChange={updateField}
            required
          />

          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            className="form-control form-control-lg mb-3"
            value={form.email}
            onChange={updateField}
          />

          <label className="form-label">Password</label>
          <input
            type="password"
            name="password"
            className="form-control form-control-lg mb-3"
            value={form.password}
            onChange={updateField}
            required
          />

          <label className="form-label">Confirm password</label>
          <input
            type="password"
            name="password_confirmation"
            className="form-control form-control-lg mb-4"
            value={form.password_confirmation}
            onChange={updateField}
            required
          />

          <button className="btn btn-primary btn-lg w-100">Register</button>
        </form>

        <p className="text-center text-secondary mt-4 mb-0">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}