import React, { useEffect, useState } from "react";
import api from "../api";

const empty = {
  name: "",
  sku: "",
  category: "",
  price: "",
  stock: "",
  unit: "pcs",
  tax_rate: "0",
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .get("products/")
      .then((r) => setProducts(r.data))
      .catch(() => setError("Products could not be loaded."));
  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setError("");
    setEditing(null);
    setForm(empty);
    setShow(true);
  }

  function openEdit(p) {
    setEditing(p.id);
    setForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: p.price,
      stock: p.stock,
      unit: p.unit,
      tax_rate: p.tax_rate,
    });
    setShow(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) await api.put(`products/${editing}/`, form);
      else await api.post("products/", form);
      setShow(false);
      await load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Product could not be saved. Check the details and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (confirm("Delete this product?")) {
      try {
        await api.delete(`products/${id}/`);
        setProducts((current) =>
          current.filter((product) => product.id !== id),
        );
      } catch (error) {
        alert(
          error.response?.data?.detail || "The product could not be deleted.",
        );
      }
    }
  }

  const filtered = products.filter((p) =>
    `${p.name} ${p.sku} ${p.category}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Products</h1>
          <p>Manage your products, prices and stock.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-2"></i>Add Product
        </button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="panel">
        <div className="table-toolbar">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-secondary">{filtered.length} products</span>
        </div>

        <div className="table-responsive">
          <table className="table align-middle custom-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <small className="d-block text-secondary">{p.unit}</small>
                  </td>
                  <td>{p.sku}</td>
                  <td>{p.category || "-"}</td>
                  <td>₹{Number(p.price).toLocaleString("en-IN")}</td>
                  <td>{Number(p.stock).toLocaleString("en-IN")}</td>
                  <td>
                    <span
                      className={`badge rounded-pill ${p.stock <= 5 ? "text-bg-warning" : "text-bg-success"}`}
                    >
                      {p.stock <= 5 ? "Low stock" : "In stock"}
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-light me-1"
                      onClick={() => openEdit(p)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-light text-danger"
                      onClick={() => remove(p.id)}
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
        <Modal
          title={editing ? "Edit Product" : "Add Product"}
          onClose={() => setShow(false)}
        >
          <form onSubmit={save}>
            <div className="row g-3">
              <Field
                label="Product Name"
                value={form.name}
                set={(v) => setForm({ ...form, name: v })}
              />
              <Field
                label="SKU"
                value={form.sku}
                set={(v) => setForm({ ...form, sku: v })}
              />
              <Field
                label="Category"
                value={form.category}
                set={(v) => setForm({ ...form, category: v })}
              />
              <Field
                label="Unit"
                value={form.unit}
                set={(v) => setForm({ ...form, unit: v })}
              />
              <Field
                label="Price"
                type="number"
                value={form.price}
                set={(v) => setForm({ ...form, price: v })}
              />
              <Field
                label="Stock"
                type="number"
                value={form.stock}
                set={(v) => setForm({ ...form, stock: v })}
              />
              <Field
                label="Tax %"
                type="number"
                value={form.tax_rate}
                set={(v) => setForm({ ...form, tax_rate: v })}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setShow(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Product"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function Field({ label, value, set, type = "text" }) {
  return (
    <div className="col-md-6">
      <label className="form-label">{label}</label>
      <input
        type={type}
        className="form-control"
        value={value}
        onChange={(e) => set(e.target.value)}
        required={label !== "Category"}
      />
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop-custom">
      <div className="modal-card">
        <div className="modal-title">
          <h5>{title}</h5>
          <button onClick={onClose} className="btn-close"></button>
        </div>
        {children}
      </div>
    </div>
  );
}
