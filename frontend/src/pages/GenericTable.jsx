import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { downloadReceiptPdf } from "../utils/receiptPdf";

const configs = {
  invoices: {
    columns: [
      "invoice_number",
      "customer_name",
      "invoice_date",
      "total",
      "status",
      "__actions",
    ],
    labels: ["Invoice", "Customer", "Date", "Total", "Status", "Actions"],
  },
  attendance: {
    columns: ["employee_name", "attendance_date", "status", "note"],
    labels: ["Employee", "Date", "Status", "Note"],
  },
  payments: {
    columns: ["customer_name", "amount", "method", "reference", "created_at"],
    labels: ["Customer", "Amount", "Method", "Reference", "Date"],
  },
  expenses: {
    columns: ["category", "description", "amount", "expense_date"],
    labels: ["Category", "Description", "Amount", "Date"],
  },
};

export default function GenericTable({
  title,
  endpoint,
  icon,
  allowDelete = false,
}) {
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    api
      .get(`${endpoint}/`)
      .then((r) => setRows(r.data))
      .catch((requestError) => {
        setLoadError(
          requestError.response?.data?.detail ||
            `Could not load ${title.toLowerCase()}.`,
        );
      })
      .finally(() => setLoading(false));
  }, [endpoint, title]);

  const cfg = configs[endpoint] || configs.invoices;
  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) =>
      cfg.columns
        .filter((column) => column !== "__actions")
        .some((column) => String(row[column] ?? "").toLowerCase().includes(query)),
    );
  }, [cfg.columns, rows, searchTerm]);

  async function deleteInvoice(invoice) {
    if (
      !window.confirm(
        `Delete invoice ${invoice.invoice_number}? This cannot be undone.`,
      )
    )
      return;
    setDeleteError("");
    setDeletingId(invoice.id);
    try {
      await api.delete(`${endpoint}/${invoice.id}/`);
      setRows((currentRows) =>
        currentRows.filter((row) => row.id !== invoice.id),
      );
    } catch (requestError) {
      setDeleteError(
        requestError.response?.data?.detail || "Could not delete the invoice.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            <i className={`bi ${icon} me-2`}></i>
            {title}
          </h1>
          <p>Manage your {title.toLowerCase()}.</p>
        </div>
        {endpoint === "invoices" ? (
          <Link className="btn btn-primary" to="/billing">
            <i className="bi bi-plus-lg me-2"></i>Add New
          </Link>
        ) : (
          <button type="button" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2"></i>Add New
          </button>
        )}
      </div>
      {loadError && <div className="alert alert-danger">{loadError}</div>}
      {deleteError && <div className="alert alert-danger">{deleteError}</div>}
      <div className="panel">
        <div className="table-toolbar">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              value={searchTerm}
              placeholder={`Search ${title.toLowerCase()}...`}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <div className="loading-box"><div className="spinner-border text-primary"></div></div>
        ) : <div className="table-responsive">
          <table className="table align-middle custom-table">
            <thead>
              <tr>
                {cfg.labels.map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
              <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  {cfg.columns.map((col) => (
                    <td
                      key={col}
                      className={col === "__actions" ? "text-end" : ""}
                    >
                      {col === "__actions" ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-light"
                            title="Download receipt"
                            onClick={() => downloadReceiptPdf(row)}
                          >
                            <i className="bi bi-download"></i>
                          </button>
                          {allowDelete && (
                            <button
                              type="button"
                              className="btn btn-sm btn-light text-danger ms-2"
                              title="Delete invoice"
                              onClick={() => deleteInvoice(row)}
                              disabled={deletingId === row.id}
                            >
                              <i
                                className={`bi ${deletingId === row.id ? "bi-hourglass-split" : "bi-trash"}`}
                              ></i>
                            </button>
                          )}
                        </>
                      ) : (
                        formatValue(row[col], col)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredRows.length && (
            <div className="empty-state">
              <i className={`bi ${icon}`}></i>
              <h5>{rows.length ? "No matching records" : "No records yet"}</h5>
              <p>
                {rows.length
                  ? "Try a different search term."
                  : `Create your first ${title.toLowerCase()} record.`}
              </p>
            </div>
          )}
        </div>}
      </div>
    </>
  );
}

function formatValue(v, col) {
  if (v === null || v === undefined || v === "") return "-";
  if (["total", "amount"].includes(col))
    return `₹${Number(v).toLocaleString("en-IN")}`;
  if (col === "status") {
    const statusClass = v === "paid" ? "status-paid" : v === "unpaid" ? "status-unpaid" : "status-partial";
    const statusLabel = v === "paid" ? "Paid" : v === "unpaid" ? "Unpaid" : v === "partial" ? "Partially paid" : String(v);
    return <span className={`badge invoice-status ${statusClass}`}>{statusLabel}</span>;
  }
  if (col.includes("date")) return new Date(v).toLocaleDateString("en-IN");
  return String(v);
}
