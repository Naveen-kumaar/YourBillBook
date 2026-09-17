import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

const emptyForm = { category: "", description: "", amount: "" };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
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
      const response = await api.get("expenses/");
      setExpenses(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Expenses could not be loaded."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return expenses;
    return expenses.filter((expense) => [expense.category, expense.description, expense.amount, expense.expense_date].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [expenses, search]);

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
      await api.post("expenses/", { ...form, amount: Number(form.amount) });
      setShowForm(false);
      setForm(emptyForm);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Expense could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(expense) {
    if (!window.confirm(`Delete this ${expense.category} expense?`)) return;
    setDeletingId(expense.id);
    setError("");
    try {
      await api.delete(`expenses/${expense.id}/`);
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Expense could not be deleted."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="page-heading"><div><h1><i className="bi bi-wallet2 me-2"></i>Expenses</h1><p>Track business expenses and keep spending visible.</p></div><button type="button" className="btn btn-primary" onClick={openCreate}><i className="bi bi-plus-lg me-2"></i>Add Expense</button></div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="panel">
        <div className="table-toolbar"><div className="search-box"><i className="bi bi-search"></i><input value={search} placeholder="Search expenses..." onChange={(event) => setSearch(event.target.value)} /></div><span className="text-secondary">{filteredExpenses.length} expenses</span></div>
        {loading ? <div className="loading-box"><div className="spinner-border text-primary"></div></div> : <div className="table-responsive"><table className="table align-middle custom-table"><thead><tr><th>Category</th><th>Description</th><th>Amount</th><th>Date</th><th></th></tr></thead><tbody>{filteredExpenses.map((expense) => <tr key={expense.id}><td><strong>{expense.category}</strong></td><td>{expense.description}</td><td>{money(expense.amount)}</td><td>{formatDate(expense.expense_date)}</td><td className="text-end"><button type="button" className="btn btn-sm btn-light text-danger" title="Delete expense" onClick={() => remove(expense)} disabled={deletingId === expense.id}><i className={`bi ${deletingId === expense.id ? "bi-hourglass-split" : "bi-trash"}`}></i></button></td></tr>)}</tbody></table>{!filteredExpenses.length && <div className="empty-state"><i className="bi bi-wallet2"></i><h5>{expenses.length ? "No matching expenses" : "No expenses yet"}</h5><p>{expenses.length ? "Try a different search term." : "Add the first expense to get started."}</p></div>}</div>}
      </div>
      {showForm && <div className="modal-backdrop-custom"><div className="modal-card"><div className="modal-title"><h5>Add Expense</h5><button type="button" onClick={() => setShowForm(false)} className="btn-close" aria-label="Close"></button></div><form onSubmit={save}><label className="form-label">Category</label><input className="form-control mb-3" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="e.g. Rent, utilities, travel" maxLength="100" required autoFocus /><label className="form-label">Description</label><input className="form-control mb-3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength="255" required /><label className="form-label">Amount</label><input className="form-control" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /><div className="modal-actions"><button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Expense"}</button></div></form></div></div>}
    </>
  );
}

function money(value) { return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }
function formatDate(value) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN") : "-"; }
function getErrorMessage(requestError, fallback) { const data = requestError.response?.data; if (typeof data?.detail === "string") return data.detail; if (data && typeof data === "object") { const firstError = Object.values(data).flat()[0]; if (firstError) return String(firstError); } return fallback; }
