import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("dashboard/")
      .then((r) => setData(r.data))
      .catch((requestError) => {
        console.error(requestError);
        if (requestError.response?.status === 401) {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          setError("Your session has expired. Please sign in again.");
          return;
        }
        setError(
          requestError.response?.data?.detail ||
            "Dashboard could not connect to the server. Make sure the Django backend is running.",
        );
      });
  }, []);

  if (error)
    return (
      <div className="alert alert-danger m-0" role="alert">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
      </div>
    );

  if (!data)
    return (
      <div className="loading-box">
        <div className="spinner-border text-primary"></div>
      </div>
    );

  const cards = [
    ["Total Sales", money(data.sales), "bi-graph-up-arrow", "primary"],
    ["Payments Received", money(data.payments), "bi-cash-stack", "success"],
    ["Total Expenses", money(data.expenses), "bi-wallet2", "warning"],
    ["Net Business", money(data.net), "bi-bar-chart-line", "info"],
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Track your business performance at a glance.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/billing")}>
          <i className="bi bi-plus-lg me-2"></i>Create Invoice
        </button>
      </div>

      <div className="row g-3 mb-4">
        {cards.map(([title, value, icon, tone]) => (
          <div className="col-xl-3 col-md-6" key={title}>
            <div className="stat-card">
              <div className={`stat-icon ${tone}`}>
                <i className={`bi ${icon}`}></i>
              </div>
              <div>
                <div className="stat-label">{title}</div>
                <div className="stat-value">{value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h5>Business Snapshot</h5>
                <span>Current database totals</span>
              </div>
              <i className="bi bi-three-dots"></i>
            </div>
            <div className="snapshot-grid">
              <Metric
                label="Invoices"
                value={data.invoices}
                icon="bi-file-earmark-text"
              />
              <Metric label="Products" value={data.products} icon="bi-box" />
              <Metric
                label="Customers"
                value={data.customers}
                icon="bi-people"
              />
              <Metric
                label="Low Stock"
                value={data.low_stock}
                icon="bi-exclamation-triangle"
              />
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h5>Quick Actions</h5>
                <span>Common tasks</span>
              </div>
            </div>
            {[
              ["New Invoice", "bi-receipt", "primary", "/billing"],
              ["Add Product", "bi-box-seam", "success", "/products"],
              ["Add Customer", "bi-person-plus", "info", "/customers"],
              ["Record Expense", "bi-wallet2", "warning", "/expenses"],
            ].map(([label, icon, tone, path]) => (
              <button className="quick-action" key={label} onClick={() => navigate(path)}>
                <span className={`quick-icon ${tone}`}>
                  <i className={`bi ${icon}`}></i>
                </span>
                <span>{label}</span>
                <i className="bi bi-chevron-right ms-auto text-secondary"></i>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value, icon }) {
  return (
    <div className="metric">
      <i className={`bi ${icon}`}></i>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
