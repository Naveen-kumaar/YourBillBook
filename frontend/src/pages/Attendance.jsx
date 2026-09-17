import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

const statuses = [
  ["present", "Present"],
  ["absent", "Absent"],
  ["leave", "On Leave"],
];

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = {
  employee_name: "",
  department: "",
  attendance_date: today(),
  status: "present",
  check_in: "09:00",
  check_out: "17:00",
  note: "",
};

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("attendance/");
      setRecords(response.data);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Attendance records could not be loaded.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) =>
      record.attendance_date?.startsWith(month) &&
      (!employeeFilter || record.employee_name === employeeFilter) &&
      (!departmentFilter || record.department === departmentFilter) &&
      (!statusFilter || record.status === statusFilter) &&
      [record.employee_name, record.department, record.attendance_date, record.status, record.note]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [departmentFilter, employeeFilter, month, records, search, statusFilter]);

  const monthRecords = useMemo(
    () => records.filter((record) => record.attendance_date?.startsWith(month)),
    [month, records],
  );

  const departments = [...new Set(records.map((record) => record.department).filter(Boolean))].sort();
  const employeeNames = [...new Set(records.map((record) => record.employee_name).filter(Boolean))].sort();

  function openCreate() {
    setForm({ ...emptyForm, attendance_date: today() });
    setError("");
    setShowForm(true);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const attendanceData = {
        ...form,
        check_in: form.status === "present" ? form.check_in : null,
        check_out: form.status === "present" ? form.check_out : null,
      };
      await api.post("attendance/", attendanceData);
      setShowForm(false);
      setForm(emptyForm);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Attendance could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(record) {
    if (!window.confirm(`Delete attendance for ${record.employee_name}?`))
      return;
    setDeletingId(record.id);
    setError("");
    try {
      await api.delete(`attendance/${record.id}/`);
      setRecords((current) => current.filter((item) => item.id !== record.id));
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Attendance record could not be deleted.",
        ),
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
            <i className="bi bi-calendar-check me-2"></i>Attendance
          </h1>
          <p>Track daily employee attendance and working hours.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-2"></i>Add Employee
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      <div className="panel">
        <div className="table-toolbar">
          <div className="attendance-filters">
            <label>
              <span>Month</span>
              <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            </label>
            <label>
              <span>Employee</span>
              <select value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
                <option value="">All employees</option>
                {employeeNames.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label>
              <span>Department</span>
              <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                <option value="">All departments</option>
                {departments.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="attendance-summary">
          <SummaryCard label="Present" value={monthRecords.filter((record) => record.status === "present").length} tone="present" />
          <SummaryCard label="Absent" value={monthRecords.filter((record) => record.status === "absent").length} tone="absent" />
          <SummaryCard label="On Leave" value={monthRecords.filter((record) => record.status === "leave").length} tone="leave" />
        </div>
        {loading ? (
          <div className="loading-box">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Check in</th>
                  <th>Check out</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <strong>{record.employee_name}</strong>
                    </td>
                    <td>{record.department || "-"}</td>
                    <td>{formatDate(record.attendance_date)}</td>
                    <td>{formatTime(record.check_in)}</td>
                    <td>{formatTime(record.check_out)}</td>
                    <td>{workedHours(record.check_in, record.check_out)}</td>
                    <td>
                      <span
                        className={`badge attendance-status ${record.status}`}
                      >
                        {statusLabel(record.status)}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-light text-danger"
                        title="Delete attendance"
                        onClick={() => remove(record)}
                        disabled={deletingId === record.id}
                      >
                        <i
                          className={`bi ${deletingId === record.id ? "bi-hourglass-split" : "bi-trash"}`}
                        ></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredRecords.length && (
              <div className="empty-state">
                <i className="bi bi-calendar-check"></i>
                <h5>
                  {records.length
                    ? "No matching records"
                    : "No attendance records yet"}
                </h5>
                <p>
                  {records.length
                    ? "Try a different search term."
                    : "Add the first attendance record to get started."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop-custom">
          <div className="modal-card">
            <div className="modal-title">
              <h5>Add Attendance</h5>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-close"
                aria-label="Close"
              ></button>
            </div>
            <form onSubmit={save}>
              <label className="form-label">Employee Name</label>
              <input
                className="form-control mb-3"
                value={form.employee_name}
                onChange={(event) =>
                  setForm({ ...form, employee_name: event.target.value })
                }
                required
                maxLength="150"
                autoFocus
              />
              <label className="form-label">Department</label>
              <input
                className="form-control mb-3"
                value={form.department}
                onChange={(event) => setForm({ ...form, department: event.target.value })}
                maxLength="100"
                required
              />
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Date</label>
                  <input
                    className="form-control"
                    type="date"
                    value={form.attendance_date}
                    onChange={(event) =>
                      setForm({ ...form, attendance_date: event.target.value })
                    }
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(event) => {
                      const status = event.target.value;
                      setForm({
                        ...form,
                        status,
                        check_in: status === "present" ? form.check_in || "09:00" : "",
                        check_out: status === "present" ? form.check_out || "17:00" : "",
                      });
                    }}
                  >
                    {statuses.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="row g-3 mt-1">
                <div className="col-md-6">
                  <label className="form-label">Check in</label>
                  <input
                    className="form-control"
                    type="time"
                    value={form.check_in}
                    onChange={(event) => setForm({ ...form, check_in: event.target.value })}
                    required={form.status === "present"}
                    disabled={form.status !== "present"}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Check out</label>
                  <input
                    className="form-control"
                    type="time"
                    value={form.check_out}
                    onChange={(event) => setForm({ ...form, check_out: event.target.value })}
                    required={form.status === "present"}
                    disabled={form.status !== "present"}
                  />
                </div>
              </div>
              <label className="form-label mt-3">
                Note <span className="text-secondary">(optional)</span>
              </label>
              <textarea
                className="form-control"
                rows="3"
                maxLength="255"
                value={form.note}
                onChange={(event) =>
                  setForm({ ...form, note: event.target.value })
                }
              ></textarea>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SummaryCard({ label, value, tone }) {
  return (
    <div className={`attendance-stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function statusLabel(value) {
  return statuses.find(([status]) => status === value)?.[1] || value;
}

function formatDate(value) {
  return value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN")
    : "-";
}

function formatTime(value) {
  if (!value) return "-";
  return new Date(`1970-01-01T${value}`).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function workedHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "-";
  const [inHour, inMinute] = checkIn.split(":").map(Number);
  const [outHour, outMinute] = checkOut.split(":").map(Number);
  const minutes = outHour * 60 + outMinute - inHour * 60 - inMinute;
  if (minutes <= 0) return "-";
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
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
