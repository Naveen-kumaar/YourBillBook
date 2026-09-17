import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "../asserts/YourBillBook.png";
import api from "../api";

const items = [
  ["Dashboard", "/dashboard", "bi-grid"],
  ["Billing", "/billing", "bi-plus-circle"],
  ["Invoices", "/invoices", "bi-file-earmark-text"],
  ["Sales", "/sales", "bi-graph-up-arrow"],
  ["Purchases", "/purchases", "bi-truck"],
  ["Products", "/products", "bi-box"],
  ["Customers", "/customers", "bi-people"],
  ["Employees", "/employees", "bi-person-badge"],
  ["Attendance", "/attendance", "bi-calendar-check"],
  ["Payments", "/payments", "bi-cash-stack"],
  ["Expenses", "/expenses", "bi-wallet2"],
];

export default function Layout() {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    api.get("products/").then((response) => setProducts(response.data));
  }, []);

  useEffect(() => {
    function closeSearch(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", closeSearch);
    return () => document.removeEventListener("mousedown", closeSearch);
  }, []);

  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    navigate("/login");
  }

  const matchingProducts = productSearch.trim()
    ? products.filter((product) =>
        `${product.name} ${product.sku} ${product.category}`
          .toLowerCase()
          .includes(productSearch.toLowerCase()),
      ).slice(0, 8)
    : [];

  function selectProduct() {
    setSearchOpen(false);
    setProductSearch("");
    navigate("/products");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <img src={logo} alt="YourBillBook" />
          </div>
        </div>

        <nav className="sidebar-nav">
          {items.map(([label, to, icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <i className={`bi ${icon}`}></i>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item border-0 bg-transparent w-100 text-start" onClick={logout}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <button className="mobile-menu btn btn-light me-2" onClick={() => document.body.classList.toggle("sidebar-open")}>
              <i className="bi bi-list"></i>
            </button>
            <span className="fw-semibold text-secondary">Business Overview</span>
          </div>
          <div className="top-actions">
            <div className="top-product-search" ref={searchRef}>
              <button
                className="icon-btn"
                type="button"
                aria-label="Search products"
                aria-expanded={searchOpen}
                onClick={() => setSearchOpen((open) => !open)}
              >
                <i className="bi bi-search"></i>
              </button>
              {searchOpen && (
                <div className="top-product-search-menu">
                  <div className="top-product-search-input">
                    <i className="bi bi-search"></i>
                    <input
                      autoFocus
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                    />
                  </div>
                  {productSearch.trim() && matchingProducts.length > 0 && (
                    <div className="top-product-results">
                      {matchingProducts.map((product) => (
                        <button
                          className="top-product-result"
                          key={product.id}
                          type="button"
                          onClick={selectProduct}
                        >
                          <span>
                            <strong>{product.name}</strong>
                            <small>{product.sku}</small>
                          </span>
                          <span className="top-product-price">₹{product.price}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {productSearch.trim() && matchingProducts.length === 0 && (
                    <div className="top-product-empty">No products found</div>
                  )}
                </div>
              )}
            </div>
            <button className="icon-btn"><i className="bi bi-bell"></i></button>
            <div className="avatar">{localStorage.getItem("username") || "User"}</div>
          </div>
        </header>
        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
