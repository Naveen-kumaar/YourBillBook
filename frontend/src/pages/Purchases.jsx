import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

const emptyForm = {
  product: "",
  quantity: "",
  unit_cost: "",
  supplier: "",
  note: "",
};

export default function Purchases() {
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
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
      const [productResponse, purchaseResponse] = await Promise.all([
        api.get("products/"),
        api.get("purchases/"),
      ]);
      setProducts(productResponse.data);
      setPurchases(purchaseResponse.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Purchases could not be loaded."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return purchases;
    return purchases.filter((purchase) =>
      [
        purchase.product_name,
        purchase.product_sku,
        purchase.supplier,
        purchase.note,
        purchase.purchase_date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [purchases, search]);

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
      await api.post("purchases/", {
        ...form,
        product: Number(form.product),
        quantity: Number(form.quantity),
        unit_cost: Number(form.unit_cost),
      });
      setShowForm(false);
      setForm(emptyForm);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Purchase could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(purchase) {
    if (!window.confirm(`Delete this purchase of ${purchase.product_name}?`)) return;
    setDeletingId(purchase.id);
    setError("");
    try {
      await api.delete(`purchases/${purchase.id}/`);
      setPurchases((current) => current.filter((item) => item.id !== purchase.id));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Purchase could not be deleted."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1><i className="bi bi-truck me-2"></i>Purchases</h1>
          <p>Record incoming stock and keep inventory quantities accurate.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-2"></i>Add Purchase
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      <div className="panel">
        <div className="table-toolbar">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              value={search}
              placeholder="Search purchases..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <span className="text-secondary">{filteredPurchases.length} purchases</span>
        </div>
        {loading ? (
          <div className="loading-box"><div className="spinner-border text-primary"></div></div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle custom-table">
              <thead>
                <tr>
                  <th>Product</th><th>Quantity</th><th>Unit Cost</th><th>Total</th>
                  <th>Supplier</th><th>Date</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td><strong>{purchase.product_name}</strong><small className="d-block text-secondary">{purchase.product_sku}</small></td>
                    <td>{Number(purchase.quantity).toLocaleString("en-IN")}</td>
                    <td>{money(purchase.unit_cost)}</td>
                    <td>{money(purchase.total)}</td>
                    <td>{purchase.supplier || "-"}</td>
                    <td>{new Date(purchase.purchase_date).toLocaleDateString("en-IN")}</td>
                    <td className="text-end">
                      <button type="button" className="btn btn-sm btn-light text-danger" title="Delete purchase" onClick={() => remove(purchase)} disabled={deletingId === purchase.id}>
                        <i className={`bi ${deletingId === purchase.id ? "bi-hourglass-split" : "bi-trash"}`}></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredPurchases.length && <div className="empty-state"><i className="bi bi-truck"></i><h5>{purchases.length ? "No matching purchases" : "No purchases yet"}</h5><p>{purchases.length ? "Try a different search term." : "Add your first purchase to increase stock."}</p></div>}
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop-custom">
          <div className="modal-card">
            <div className="modal-title"><h5>Add Purchase</h5><button type="button" onClick={() => setShowForm(false)} className="btn-close" aria-label="Close"></button></div>
            <form onSubmit={save}>
              <label className="form-label">Product</label>
              <select className="form-select mb-3" value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} required>
                <option value="">Choose a product</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}
              </select>
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label">Quantity</label><input className="form-control" type="number" min="0.01" step="0.01" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required /></div>
                <div className="col-md-6"><label className="form-label">Unit Cost</label><input className="form-control" type="number" min="0" step="0.01" value={form.unit_cost} onChange={(event) => setForm({ ...form, unit_cost: event.target.value })} required /></div>
              </div>
              <label className="form-label mt-3">Supplier</label><input className="form-control mb-3" value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} />
              <label className="form-label">Note</label><textarea className="form-control" rows="2" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })}></textarea>
              <div className="modal-actions"><button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Purchase"}</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function getErrorMessage(requestError, fallback) {
  const data = requestError.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (data && typeof data === "object") {
    const firstError = Object.values(data).flat()[0];
    if (firstError) return String(firstError);
  }
  return fallback;
}
