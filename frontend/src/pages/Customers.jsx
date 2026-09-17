import React, { useEffect, useState } from "react";
import api from "../api";

export default function Customers() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    business_name: "",
    gstin: "",
    phone: "",
    email: "",
    address: "",
  });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .get("customers/")
      .then((r) => setItems(r.data))
      .catch(() => setError("Customers could not be loaded."));
  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("customers/", form);
      setForm({
        name: "",
        business_name: "",
        gstin: "",
        phone: "",
        email: "",
        address: "",
      });
      setShow(false);
      await load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Customer could not be saved. Check the details and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (confirm("Delete this customer?")) {
      await api.delete(`customers/${id}/`);
      load();
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Customers</h1>
          <p>Manage customer information and balances.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShow(true)}>
          <i className="bi bi-person-plus me-2"></i>Add Customer
        </button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="panel">
        <div className="table-responsive">
          <table className="table align-middle custom-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Location</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td>{c.phone || "-"}</td>
                  <td>{c.email || "-"}</td>
                  <td>{c.address || "-"}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-light text-danger"
                      onClick={() => remove(c.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {show && (
        <div className="modal-backdrop-custom">
          <div className="modal-card">
            <div className="modal-title">
              <h5>Add Customer</h5>
              <button
                onClick={() => setShow(false)}
                className="btn-close"
              ></button>
            </div>
            <form onSubmit={save}>
              <label className="form-label">Customer Name</label>
              <input
                className="form-control mb-3"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <label className="form-label">Business Name</label>
              <input
                className="form-control mb-3"
                value={form.business_name}
                onChange={(e) =>
                  setForm({ ...form, business_name: e.target.value })
                }
              />
              <label className="form-label">GSTIN</label>
              <input
                className="form-control mb-3"
                maxLength="15"
                value={form.gstin}
                onChange={(e) =>
                  setForm({ ...form, gstin: e.target.value.toUpperCase() })
                }
              />
              <label className="form-label">Phone</label>
              <input
                className="form-control mb-3"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control mb-3"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <label className="form-label">Address</label>
              <textarea
                className="form-control mb-3"
                rows="3"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              ></textarea>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShow(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
