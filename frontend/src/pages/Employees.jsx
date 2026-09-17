import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Employees() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("attendance/")
      .then((response) => setRecords(response.data))
      .catch(() => setError("Employee records could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  const employees = useMemo(() => {
    const grouped = new Map();
    records.forEach((record) => {
      const name = record.employee_name?.trim();
      if (!name) return;
      const current = grouped.get(name) || {
        name,
        department: record.department || "",
        records: [],
      };
      current.records.push(record);
      current.department = current.department || record.department || "";
      grouped.set(name, current);
    });
    return [...grouped.values()]
      .map((employee) => ({
        ...employee,
        latest: employee.records[0],
        presentCount: employee.records.filter(
          (record) => record.status === "present",
        ).length,
        totalHours: employee.records.reduce(
          (total, record) => total + workedHours(record.check_in, record.check_out),
          0,
        ),
      }))
      .filter((employee) =>
        employee.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [records, search]);

  const allEmployees = useMemo(() => {
    const names = new Set(
      records.map((record) => record.employee_name?.trim()).filter(Boolean),
    );
    return [...names].sort((first, second) => first.localeCompare(second));
  }, [records]);

  const presentToday = useMemo(() => {
    const currentDate = new Date().toISOString().slice(0, 10);
    return new Set(
      records
        .filter(
          (record) =>
            record.attendance_date === currentDate &&
            record.status === "present",
        )
        .map((record) => record.employee_name?.trim())
        .filter(Boolean),
    ).size;
  }, [records]);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            <i className="bi bi-person-badge me-2"></i>Employees
          </h1>
          <p>Manage your employees and track their attendance.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row g-3 mb-4">
        <SummaryCard label="Total Employees" value={allEmployees.length} icon="bi-people" tone="primary" />
        <SummaryCard label="Active Employees" value={allEmployees.length} icon="bi-person-check" tone="success" />
        <SummaryCard label="Present Today" value={presentToday} icon="bi-calendar-check" tone="info" />
      </div>
      <div className="panel">
        <div className="table-toolbar">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              value={search}
              placeholder="Search employees..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Link className="btn btn-primary" to="/attendance">
            <i className="bi bi-person-plus me-2"></i>Add Employee
          </Link>
        </div>
        {loading ? (
          <div className="loading-box">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : employees.length ? (
          <div className="table-responsive">
            <table className="table align-middle custom-table employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Days worked</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.name}>
                    <td><strong>{employee.name}</strong></td>
                    <td className="employee-id">
                      EMP{String(allEmployees.indexOf(employee.name) + 1).padStart(3, "0")}
                    </td>
                    <td>{employee.department || "-"}</td>
                    <td>Not set</td>
                    <td>{employee.presentCount}</td>
                    <td>
                      <span className={`badge attendance-status ${employee.latest.status}`}>
                        {statusLabel(employee.latest.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state py-5">
            <i className="bi bi-person-badge"></i>
            <h5>
              {records.length ? "No matching employees" : "No employees yet"}
            </h5>
            <p>
              {records.length
                ? "Try a different search term."
                : "Add an attendance record to create your first employee profile."}
            </p>
            <Link className="btn btn-primary btn-sm" to="/attendance">
              <i className="bi bi-plus-lg me-1"></i>Add Employee
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function SummaryCard({ label, value, icon, tone }) {
  return (
    <div className="col-md-4">
      <div className="stat-card employee-stat-card">
        <div className={`stat-icon ${tone}`}>
          <i className={`bi ${icon}`}></i>
        </div>
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
        </div>
      </div>
    </div>
  );
}

function statusLabel(status) {
  return (
    {
      present: "Present",
      absent: "Absent",
      half_day: "Half day",
      leave: "Leave",
    }[status] || status
  );
}

function workedHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const [inHour, inMinute] = checkIn.split(":").map(Number);
  const [outHour, outMinute] = checkOut.split(":").map(Number);
  return Math.max(0, outHour * 60 + outMinute - inHour * 60 - inMinute) / 60;
}

function formatHours(hours) {
  return hours ? `${Number(hours).toFixed(2)} hrs` : "-";
}
