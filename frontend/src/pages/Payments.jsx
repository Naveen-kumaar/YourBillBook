import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

const emptyForm = { customer: "", amount: "", method: "cash", reference: "", note: "" };
const methods = [["cash", "Cash"], ["upi", "UPI"], ["card", "Card"], ["bank", "Bank transfer"]];

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [paymentResponse, customerResponse] = await Promise.all([api.get("payments/"), api.get("customers/")]);
      setPayments(paymentResponse.data);
      setCustomers(customerResponse.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Payments could not be loaded."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return payments;
    return payments.filter((payment) => [payment.customer_name, payment.amount, payment.method, payment.reference, payment.note, payment.created_at].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [payments, search]);

  function openCreate() {
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("payments/", { ...form, customer: Number(form.customer), amount: Number(form.amount) });
      setShowForm(false);
      setForm(emptyForm);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Payment could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(payment) {
    if (!window.confirm(`Delete this payment from ${payment.customer_name}?`)) return;
    setDeletingId(payment.id);
    setError("");
    try {
      await api.delete(`payments/${payment.id}/`);
      setPayments((current) => current.filter((item) => item.id !== payment.id));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Payment could not be deleted."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="page-heading"><div><h1><i className="bi bi-cash-stack me-2"></i>Payments</h1><p>Record and review customer payments received.</p></div><button type="button" className="btn btn-primary" onClick={openCreate}><i className="bi bi-plus-lg me-2"></i>Add Payment</button></div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="panel">
        <div className="table-toolbar"><div className="search-box"><i className="bi bi-search"></i><input value={search} placeholder="Search payments..." onChange={(event) => setSearch(event.target.value)} /></div><span className="text-secondary">{filteredPayments.length} payments</span></div>
        {loading ? <div className="loading-box"><div className="spinner-border text-primary"></div></div> : <div className="table-responsive"><table className="table align-middle custom-table"><thead><tr><th>Customer</th><th>Amount</th><th>Method</th><th>Reference</th><th>Date</th><th></th></tr></thead><tbody>{filteredPayments.map((payment) => <tr key={payment.id}><td><strong>{payment.customer_name}</strong></td><td>{money(payment.amount)}</td><td><span className="badge text-bg-light">{methodLabel(payment.method)}</span></td><td>{payment.reference || "-"}</td><td>{formatDate(payment.created_at)}</td><td className="text-end"><button type="button" className="btn btn-sm btn-light text-danger" title="Delete payment" onClick={() => remove(payment)} disabled={deletingId === payment.id}><i className={`bi ${deletingId === payment.id ? "bi-hourglass-split" : "bi-trash"}`}></i></button></td></tr>)}</tbody></table>{!filteredPayments.length && <div className="empty-state"><i className="bi bi-cash-stack"></i><h5>{payments.length ? "No matching payments" : "No payments yet"}</h5><p>{payments.length ? "Try a different search term." : "Record the first customer payment to get started."}</p></div>}</div>}
      </div>
      {showForm && <div className="modal-backdrop-custom"><div className="modal-card"><div className="modal-title"><h5>Add Payment</h5><button type="button" onClick={() => setShowForm(false)} className="btn-close" aria-label="Close"></button></div><form onSubmit={save}><label className="form-label">Customer</label><select className="form-select mb-3" value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} required><option value="">Choose a customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.phone ? ` - ${customer.phone}` : ""}</option>)}</select><div className="row g-3"><div className="col-md-6"><label className="form-label">Amount</label><input className="form-control" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /></div><div className="col-md-6"><label className="form-label">Method</label><select className="form-select" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}>{methods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div><label className="form-label mt-3">Reference <span className="text-secondary">(optional)</span></label><input className="form-control mb-3" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} maxLength="100" /><label className="form-label">Note <span className="text-secondary">(optional)</span></label><textarea className="form-control" rows="2" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} maxLength="255"></textarea><div className="modal-actions"><button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Payment"}</button></div></form></div></div>}
    </>
  );
}

function money(value) { return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }
function methodLabel(value) { return methods.find(([method]) => method === value)?.[1] || value; }
function formatDate(value) { return value ? new Date(value).toLocaleDateString("en-IN") : "-"; }
function getErrorMessage(requestError, fallback) { const data = requestError.response?.data; if (typeof data?.detail === "string") return data.detail; if (data && typeof data === "object") { const firstError = Object.values(data).flat()[0]; if (firstError) return String(firstError); } return fallback; }
