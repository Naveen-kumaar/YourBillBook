import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { downloadBillReceiptPdf } from "../utils/receiptPdf";

const initialLine = { product: "", quantity: "1" };

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [line, setLine] = useState(initialLine);
  const [productSearch, setProductSearch] = useState("");
  const [customer, setCustomer] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastInvoice, setLastInvoice] = useState(null);

  useEffect(() => {
    Promise.all([api.get("products/"), api.get("customers/")]).then(
      ([productResponse, customerResponse]) => {
        setProducts(productResponse.data.filter((product) => product.active));
        setCustomers(customerResponse.data);
      },
    ).catch(() => setError("Products and customers could not be loaded."));
  }, []);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + Number(item.product.price) * Number(item.quantity),
        0,
      ),
    [cart],
  );
  const tax = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          (Number(item.product.price) *
            Number(item.quantity) *
            Number(item.product.tax_rate)) /
            100,
        0,
      ),
    [cart],
  );
  const cgst = Math.round((tax / 2) * 100) / 100;
  const sgst = tax - cgst;
  const total = Math.max(0, subtotal + tax - Number(discount || 0));
  const productMatches = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    if (!search || line.product) return [];
    return products
      .filter((product) =>
        `${product.name} ${product.sku}`.toLowerCase().includes(search),
      )
      .slice(0, 8);
  }, [line.product, productSearch, products]);

  function addLine(e) {
    e.preventDefault();
    const product = products.find((item) => item.id === Number(line.product));
    const quantity = Number(line.quantity);
    if (!product || quantity <= 0) return;
    const existing = cart.find((item) => item.product.id === product.id);
    const nextQuantity = (existing?.quantity || 0) + quantity;
    if (nextQuantity > Number(product.stock)) {
      setError(
        `Only ${product.stock} ${product.unit} of ${product.name} is available.`,
      );
      return;
    }
    setCart(
      existing
        ? cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: nextQuantity }
              : item,
          )
        : [...cart, { product, quantity }],
    );
    setLine(initialLine);
    setProductSearch("");
    setError("");
  }

  function selectProduct(product) {
    setLine({ ...line, product: String(product.id) });
    setProductSearch(`${product.name} (${product.sku})`);
  }

  function removeLine(id) {
    setCart(cart.filter((item) => item.product.id !== id));
  }

  function downloadReceipt() {
    if (!lastInvoice) return;
    downloadBillReceiptPdf(lastInvoice, lastInvoice.customerDetails);
  }

  async function saveBill(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!customer || !cart.length) {
      setError("Select a customer and add at least one product.");
      return;
    }
    if (Number(paidAmount) > total) {
      setError("Payment cannot be greater than the bill total.");
      return;
    }
    setSaving(true);
    try {
      const response = await api.post("invoices/", {
        customer: Number(customer),
        discount: Number(discount || 0),
        paid_amount: Number(paidAmount || 0),
        payment_method: paymentMethod,
        items: cart.map((item) => ({
          product: item.product.id,
          quantity: item.quantity,
        })),
      });
      const selectedCustomer = customers.find(
        (item) => item.id === Number(customer),
      );
      setLastInvoice({ ...response.data, customerDetails: selectedCustomer });
      setMessage(`${response.data.invoice_number} created successfully.`);
      setCart([]);
      setCustomer("");
      setDiscount("0");
      setPaidAmount("0");
      const productResponse = await api.get("products/");
      setProducts(productResponse.data.filter((product) => product.active));
    } catch (requestError) {
      const detail =
        requestError.response?.data?.detail ||
        requestError.response?.data?.items?.[0] ||
        "Could not create the bill.";
      setError(
        typeof detail === "string" ? detail : "Please check the bill details.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            <i className="bi bi-receipt me-2"></i>Create Bill
          </h1>
          <p>Add products, collect payment, and reduce stock in one step.</p>
        </div>
        <Link className="btn btn-light" to="/invoices">
          <i className="bi bi-clock-history me-2"></i>View Invoices
        </Link>
      </div>
      {message && (
        <div className="alert alert-success billing-success-alert">
          <span>{message}</span>
          <button
            type="button"
            className="btn btn-success btn-sm"
            onClick={downloadReceipt}
          >
            <i className="bi bi-download me-2"></i>Download Receipt
          </button>
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={saveBill}>
        <div className="row g-4">
          <div className="col-xl-8">
            <div className="panel p-4 mb-4">
              <div className="billing-section-title">
                <div>
                  <h5>Customer</h5>
                  <span>Who is this bill for?</span>
                </div>
                <i className="bi bi-person"></i>
              </div>
              <select
                className="form-select"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                required
              >
                <option value="">Choose a customer</option>
                {customers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.phone ? ` - ${item.phone}` : ""}
                  </option>
                ))}
              </select>
              {!customers.length && (
                <small className="text-secondary d-block mt-2">
                  Add a customer first from{" "}
                  <Link to="/customers">Customers</Link>.
                </small>
              )}
            </div>
            <div className="panel p-4">
              <div className="billing-section-title">
                <div>
                  <h5>Products</h5>
                  <span>Choose products and quantities</span>
                </div>
                <i className="bi bi-box-seam"></i>
              </div>
              <div className="row g-2 mb-4">
                <div className="col-md-7 product-search-wrap">
                  <div className="search-box product-search-box">
                    <i className="bi bi-search"></i>
                    <input
                      className="form-control"
                      value={productSearch}
                      placeholder="Search product name or SKU..."
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setLine({ ...line, product: "" });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && line.product) {
                          e.preventDefault();
                          addLine(e);
                        }
                      }}
                    />
                  </div>
                  {productMatches.length > 0 && (
                    <div className="product-search-results">
                      {productMatches.map((product) => (
                        <button
                          type="button"
                          className="product-search-result"
                          key={product.id}
                          onClick={() => selectProduct(product)}
                        >
                          <span>
                            <strong>{product.name}</strong>
                            <small>{product.sku}</small>
                          </span>
                          <span className="text-end">
                            <strong>
                              ₹{Number(product.price).toLocaleString("en-IN")}
                            </strong>
                            <small>
                              {product.stock} {product.unit} available
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {productSearch && !line.product && !productMatches.length && (
                    <div className="product-search-empty">
                      No matching product found.
                    </div>
                  )}
                </div>
                <div className="col-md-3">
                  <input
                    className="form-control"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={line.quantity}
                    onChange={(e) =>
                      setLine({ ...line, quantity: e.target.value })
                    }
                    placeholder="Quantity"
                  />
                </div>
                <div className="col-md-2">
                  <button
                    className="btn btn-primary w-100"
                    type="button"
                    onClick={addLine}
                    disabled={!line.product}
                  >
                    <i className="bi bi-plus-lg me-1"></i>Add
                  </button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table align-middle custom-table mb-0">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>GST</th>
                      <th className="text-end">Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.product.id}>
                        <td>
                          <strong>{item.product.name}</strong>
                          <small className="d-block text-secondary">
                            {item.product.sku}
                          </small>
                        </td>
                        <td>
                          ₹{Number(item.product.price).toLocaleString("en-IN")}
                        </td>
                        <td>
                          {item.quantity} {item.product.unit}
                        </td>
                        <td>
                          <span className="d-block">{item.product.tax_rate}% GST</span>
                          <small className="text-secondary">
                            CGST {(Number(item.product.tax_rate) / 2).toFixed(2)}% · SGST {(Number(item.product.tax_rate) / 2).toFixed(2)}%
                          </small>
                        </td>
                        <td className="text-end">
                          ₹
                          {(
                            Number(item.product.price) * item.quantity
                          ).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-light text-danger"
                            onClick={() => removeLine(item.product.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!cart.length && (
                  <div className="empty-state py-5">
                    <i className="bi bi-cart3"></i>
                    <h5>Your bill is empty</h5>
                    <p>Add a product above to begin.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-xl-4">
            <div className="panel p-4 billing-summary">
              <div className="billing-section-title">
                <div>
                  <h5>Payment summary</h5>
                  <span>Review before saving</span>
                </div>
                <i className="bi bi-calculator"></i>
              </div>
              <div className="summary-line">
                <span>Subtotal</span>
                <strong>
                  ₹
                  {subtotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
              <div className="summary-line">
                <span>CGST</span>
                <strong>
                  ₹{cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div className="summary-line">
                <span>SGST</span>
                <strong>
                  ₹{sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <label className="form-label mt-3">Discount</label>
              <input
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
              <div className="summary-total">
                <span>Total</span>
                <strong>
                  ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <label className="form-label">Amount received</label>
              <input
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-link btn-sm px-0"
                onClick={() => setPaidAmount(total.toFixed(2))}
              >
                Mark as fully paid
              </button>
              <label className="form-label mt-2">Payment method</label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank">Bank transfer</option>
              </select>
              <button
                className="btn btn-primary w-100 mt-4"
                disabled={saving || !cart.length}
              >
                {saving ? "Saving bill..." : "Save Bill"}
                <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
