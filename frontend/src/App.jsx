import React from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import api from "./api";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import GenericTable from "./pages/GenericTable";
import Billing from "./pages/Billing";
import Purchases from "./pages/Purchases";
import Attendance from "./pages/Attendance";
import Employees from "./pages/Employees";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";

function Private({ children }) {
  return localStorage.getItem("access") ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={
        <Private>
          <Layout />
        </Private>
      }>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="customers" element={<Customers />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="employees" element={<Employees />} />
        <Route path="billing" element={<Billing />} />
        <Route path="invoices" element={<GenericTable title="Invoices" endpoint="invoices" icon="bi-file-earmark-text" allowDelete />} />
        <Route path="sales" element={<GenericTable title="Sales" endpoint="invoices" icon="bi-graph-up-arrow" />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="suppliers" element={<Navigate to="/purchases" replace />} />
        <Route path="payments" element={<Payments />} />
        <Route path="expenses" element={<Expenses />} />
      </Route>
    </Routes>
  );
}
