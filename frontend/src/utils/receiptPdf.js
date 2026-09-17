import { jsPDF } from "jspdf";

const COMPANY = {
  name: "YourBillBook",
  address: "Chennai, Tamil Nadu, India",
  phone: "744-123-4567",
  email: "yourbillbook@email.com",
  gstin: "YBB GSTIN",
  validityDays: 7,
};

export function downloadReceiptPdf(invoice, customerDetails = null) {
  const items = invoice.items || [];
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const right = pageWidth - margin;
  const money = (value) =>
    `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const dateValue = invoice.invoice_date
    ? new Date(invoice.invoice_date)
    : new Date();
  const invoiceDate = dateValue.toLocaleDateString("en-IN");
  const validUntil = new Date(
    dateValue.getTime() + COMPANY.validityDays * 86400000,
  ).toLocaleDateString("en-IN");
  const customerName =
    customerDetails?.business_name ||
    customerDetails?.name ||
    invoice.customer_name ||
    "Walk-in customer";
  let y = 18;

  const line = (lineY, color = [224, 228, 235]) => {
    pdf.setDrawColor(...color);
    pdf.line(margin, lineY, right, lineY);
  };

  const textLines = (value, x, startY, width) => {
    const lines = pdf.splitTextToSize(String(value || ""), width);
    pdf.text(lines, x, startY, { lineHeightFactor: 1.2 });
    return startY + lines.length * 4.5;
  };

  pdf.setFillColor(24, 55, 86);
  pdf.rect(0, 0, pageWidth, 8, "F");
  pdf.setTextColor(24, 55, 86);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text(COMPANY.name, margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(90, 99, 112);
  y += 6;
  y = textLines(
    `${COMPANY.address} | ${COMPANY.phone} | ${COMPANY.email}`,
    margin,
    y,
    105,
  );
  y = textLines(`GSTIN: ${COMPANY.gstin}`, margin, y + 1, 105);

  pdf.setTextColor(24, 55, 86);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("TAX INVOICE", right, 19, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(90, 99, 112);
  pdf.text(`Invoice No: ${invoice.invoice_number || "-"}`, right, 25, {
    align: "right",
  });
  pdf.text(`Invoice Date: ${invoiceDate}`, right, 30, { align: "right" });
  pdf.text(`Valid Until: ${validUntil}`, right, 35, { align: "right" });

  y = Math.max(y + 5, 43);
  line(y);
  y += 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(24, 55, 86);
  pdf.text("BILL TO", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(38, 50, 65);
  y += 6;
  pdf.setFont("helvetica", "bold");
  y = textLines(customerName, margin, y, 92);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(90, 99, 112);
  if (customerDetails?.name && customerDetails.business_name) {
    y += 2;
    y = textLines(`Contact: ${customerDetails.name}`, margin, y, 92);
  }
  if (customerDetails?.address) {
    y += 2;
    y = textLines(customerDetails.address, margin, y, 90);
  }
  if (customerDetails?.phone || customerDetails?.email) {
    y += 2;
    y = textLines(
      [customerDetails.phone, customerDetails.email]
        .filter(Boolean)
        .join(" | "),
      margin,
      y,
      92,
    );
  }
  y += 2;
  pdf.setFont("helvetica", "bold");
  pdf.text(`GSTIN: ${customerDetails?.gstin || "Not provided"}`, margin, y);

  y = Math.max(y + 9, 75);
  const columns = [margin, 57, 78, 106, 133, right];
  pdf.setFillColor(24, 55, 86);
  pdf.rect(margin, y - 5, right - margin, 9, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("DESCRIPTION", columns[0] + 3, y + 1);
  pdf.text("QTY", columns[1] + 3, y + 1);
  pdf.text("RATE", columns[2] + 3, y + 1);
  pdf.text("TAX", columns[3] + 3, y + 1);
  pdf.text("AMOUNT", columns[5] - 3, y + 1, { align: "right" });
  y += 10;
  pdf.setTextColor(38, 50, 65);
  pdf.setFont("helvetica", "normal");
  items.forEach((item, index) => {
    const descriptionLines = pdf.splitTextToSize(
      item.product_name || "Product",
      36,
    );
    const rowHeight = Math.max(9, descriptionLines.length * 4 + 4);
    if (index % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, y - 5, right - margin, rowHeight, "F");
    }
    pdf.text(descriptionLines, columns[0] + 3, y + 1);
    pdf.text(String(item.quantity || 0), columns[1] + 3, y + 1);
    pdf.text(money(item.price), columns[2] + 3, y + 1);
    pdf.text(`${item.tax_rate || 0}%`, columns[3] + 3, y + 1);
    pdf.text(money(item.line_total), columns[5] - 3, y + 1, { align: "right" });
    line(y + rowHeight - 5, [235, 238, 242]);
    y += rowHeight;
  });

  y += 7;
  const totalsX = 130;
  const totalLine = (label, value, bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(bold ? 12 : 9);
    pdf.setTextColor(bold ? 24 : 90, bold ? 55 : 99, bold ? 86 : 112);
    pdf.text(label, totalsX, y);
    pdf.text(money(value), right, y, { align: "right" });
    y += bold ? 8 : 5;
  };
  totalLine("Subtotal", invoice.subtotal);
  totalLine("Tax", invoice.tax);
  totalLine("Discount", invoice.discount);
  line(y - 2);
  y += 5;
  totalLine("TOTAL", invoice.total, true);
  totalLine("Paid", invoice.paid_amount);
  totalLine(
    "Balance Due",
    Number(invoice.total) - Number(invoice.paid_amount),
    true,
  );

  y += 8;
  line(y);
  y += 7;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(24, 55, 86);
  pdf.text("Payment Terms & Notes", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(90, 99, 112);
  y += 5;
  pdf.text(
    `Payment status: ${String(invoice.status || "unpaid").toUpperCase()}`,
    margin,
    y,
  );
  y += 4;
  pdf.text(
    `This invoice is valid until ${validUntil}. Thank you for your business.`,
    margin,
    y,
  );
  pdf.setFontSize(8);
  pdf.text(`For ${COMPANY.name}`, right, pageHeight - 22, { align: "right" });
  pdf.text("Authorised Signatory", right, pageHeight - 16, { align: "right" });
  pdf.save(`${invoice.invoice_number || "invoice"}.pdf`);
}

export function downloadBillReceiptPdf(invoice, customerDetails = null) {
  const items = invoice.items || [];
  const pdf = new jsPDF({ unit: "mm", format: [80, 180] });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 6;
  const right = pageWidth - margin;
  const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
  const dateValue = invoice.invoice_date
    ? new Date(invoice.invoice_date)
    : new Date();
  const customerName =
    customerDetails?.business_name ||
    customerDetails?.name ||
    invoice.customer_name ||
    "Walk-in customer";
  let y = 10;

  const divider = () => {
    pdf.setDrawColor(190, 195, 201);
    pdf.line(margin, y, right, y);
    y += 5;
  };

  pdf.setTextColor(24, 55, 86);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(COMPANY.name, pageWidth / 2, y, { align: "center" });
  y += 6;
  pdf.setFontSize(11);
  pdf.text("BILL RECEIPT", pageWidth / 2, y, { align: "center" });
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(90, 99, 112);
  pdf.text(`${COMPANY.address} | ${COMPANY.phone}`, pageWidth / 2, y, {
    align: "center",
  });
  y += 5;
  divider();

  pdf.setTextColor(38, 50, 65);
  pdf.text(`Receipt: ${invoice.invoice_number || "-"}`, margin, y);
  pdf.text(dateValue.toLocaleDateString("en-IN"), right, y, { align: "right" });
  y += 5;
  pdf.text(`Customer: ${customerName}`, margin, y);
  y += 5;
  divider();

  pdf.setFont("helvetica", "bold");
  pdf.text("ITEM", margin, y);
  pdf.text("AMOUNT", right, y, { align: "right" });
  y += 5;
  pdf.setFont("helvetica", "normal");
  items.forEach((item) => {
    const name = pdf.splitTextToSize(item.product_name || "Product", 43);
    pdf.text(name, margin, y);
    pdf.text(money(item.line_total), right, y, { align: "right" });
    y += Math.max(4, name.length * 4);
    pdf.setTextColor(90, 99, 112);
    pdf.setFontSize(7);
    pdf.text(
      `${item.quantity || 0} x ${money(item.price)} | Tax ${item.tax_rate || 0}%`,
      margin,
      y,
    );
    pdf.setTextColor(38, 50, 65);
    pdf.setFontSize(8);
    y += 5;
  });
  divider();

  const totalLine = (label, value, bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(bold ? 11 : 8);
    pdf.text(label, margin, y);
    pdf.text(money(value), right, y, { align: "right" });
    y += bold ? 7 : 5;
  };
  totalLine("Subtotal", invoice.subtotal);
  totalLine("Tax", invoice.tax);
  if (Number(invoice.discount)) totalLine("Discount", invoice.discount);
  totalLine("TOTAL", invoice.total, true);
  totalLine("Paid", invoice.paid_amount);
  totalLine(
    "Balance due",
    Number(invoice.total) - Number(invoice.paid_amount),
    true,
  );
  y += 3;
  divider();
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(
    `Payment: ${String(invoice.payment_method || "cash").toUpperCase()}`,
    pageWidth / 2,
    y,
    { align: "center" },
  );
  y += 5;
  pdf.setTextColor(90, 99, 112);
  pdf.text("Thank you for your business.", pageWidth / 2, y, {
    align: "center",
  });
  pdf.save(`${invoice.invoice_number || "bill-receipt"}-receipt.pdf`);
}
