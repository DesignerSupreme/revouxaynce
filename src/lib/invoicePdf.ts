import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import type { Invoice, Client, Event } from "@/types";
import { fmt$ } from "./helpers";

function svgToDataUrl(svgText: string, width: number, height: number): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const dpr = 2;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    const img = new Image();
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("");
    };
    img.src = url;
  });
}

export async function generateInvoicePDF(
  invoice: Invoice,
  client: Client | undefined,
  event: Event | undefined
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ─── HEADER with LOGO ────────────────────────────────────
  try {
    const resp = await fetch("/images/revouxaynce-logo.svg");
    const svgText = await resp.text();
    const logoDataUrl = await svgToDataUrl(svgText, 427, 153);
    if (logoDataUrl) {
      const logoH = 12;
      const logoW = logoH * (427 / 153);
      doc.addImage(logoDataUrl, "PNG", margin, y - 2, logoW, logoH);
      y += logoH + 2;
    }
  } catch {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("REVOUXAYNCE", margin, y + 6);
    y += 12;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Premium Event Management", margin, y);
  doc.text("hello@revouxaynce.com  |  +263 77 200 1001", margin, y + 4);
  doc.setTextColor(0);

  // Invoice title (right-aligned)
  const isQuotation = invoice.status === "Quotation";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(180);
  doc.text(isQuotation ? "QUOTATION" : "INVOICE", pageW - margin, margin + 6, { align: "right" });
  doc.setTextColor(0);

  y += 10;

  // Divider
  doc.setDrawColor(220);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // ─── INVOICE META + BILL TO ───────────────────────────────
  const colLeft = margin;
  const colRight = pageW / 2 + 10;

  // Bill To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text("BILL TO", colLeft, y);
  doc.setTextColor(0);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(client?.name || "—", colLeft, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  if (client?.email) { doc.text(client.email, colLeft, y); y += 4; }
  if (client?.phone) { doc.text(client.phone, colLeft, y); y += 4; }
  doc.setTextColor(0);

  // Invoice details (right column)
  let ry = y - 14;
  const labelX = colRight;
  const valX = pageW - margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text(isQuotation ? "QUOTE NO." : "INVOICE NO.", labelX, ry);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${isQuotation ? "QT" : "INV"}-${invoice.id.slice(0, 8).toUpperCase()}`, valX, ry, { align: "right" });
  ry += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text("ISSUE DATE", labelX, ry);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), valX, ry, { align: "right" });
  ry += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text("DUE DATE", labelX, ry);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (invoice.dueDate) {
    doc.text(new Date(invoice.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), valX, ry, { align: "right" });
  }
  ry += 6;

  if (event) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text("EVENT", labelX, ry);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(event.name, valX, ry, { align: "right" });
  }

  y = Math.max(y, ry) + 12;

  // ─── LINE ITEMS TABLE ─────────────────────────────────────
  const items = invoice.lineItems.length > 0
    ? invoice.lineItems
    : [{ desc: "Event services", qty: 1, unitPrice: invoice.amount, amount: invoice.amount }];

  const tableBody = items.map((li, i) => [
    String(i + 1),
    li.desc,
    String(li.qty),
    fmt$(li.unitPrice),
    fmt$(li.amount),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["#", "Description", "Qty", "Unit Price", "Total"]],
    body: tableBody,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      textColor: [30, 30, 30],
      lineColor: [230, 230, 230],
      lineWidth: 0,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [100, 100, 100],
      fontSize: 7.5,
      fontStyle: "bold",
      cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right", fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    didDrawCell: (data) => {
      if (data.section === "body") {
        doc.setDrawColor(235);
        doc.setLineWidth(0.3);
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height
        );
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // ─── TOTALS with Tax & Discount ───────────────────────────
  const subtotal = items.reduce((s, li) => s + li.amount, 0);
  const taxRate = (invoice as any).taxRate ?? 0;
  const discountAmount = (invoice as any).discountAmount ?? 0;
  const taxableAmount = subtotal - discountAmount;
  const tax = taxableAmount * (taxRate / 100);
  const grandTotal = taxableAmount + tax;

  const totalsX = pageW - margin - 60;
  const totalsValX = pageW - margin;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text("Subtotal", totalsX, y);
  doc.text(fmt$(subtotal), totalsValX, y, { align: "right" });
  y += 6;

  if (discountAmount > 0) {
    doc.text("Discount", totalsX, y);
    doc.text(`-${fmt$(discountAmount)}`, totalsValX, y, { align: "right" });
    y += 6;
  }

  if (taxRate > 0) {
    doc.text(`Tax (${taxRate}%)`, totalsX, y);
    doc.text(fmt$(tax), totalsValX, y, { align: "right" });
    y += 6;
  }

  // Grand total line
  doc.setDrawColor(30);
  doc.setLineWidth(0.8);
  doc.line(totalsX - 5, y, pageW - margin, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text("TOTAL DUE", totalsX, y);
  doc.text(fmt$(grandTotal), totalsValX, y, { align: "right" });

  y += 6;

  // Status badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  if (invoice.status === "Paid") {
    doc.setTextColor(80, 160, 80);
    doc.text("PAID", totalsValX, y, { align: "right" });
  } else if (invoice.status === "Overdue") {
    doc.setTextColor(200, 60, 60);
    doc.text("OVERDUE", totalsValX, y, { align: "right" });
  }
  doc.setTextColor(0);

  y += 14;

  // ─── NOTES ────────────────────────────────────────────────
  if (invoice.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text("NOTES", margin, y);
    doc.setTextColor(0);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80);
    const noteLines = doc.splitTextToSize(invoice.notes, contentW);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 8;
    doc.setTextColor(0);
  }

  // ─── FOOTER with QR Code ─────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(230);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageW - margin, footerY);

  // QR Code linking to client portal
  try {
    const portalUrl = `${window.location.origin}/portal/invoice/${invoice.id}`;
    const qrDataUrl = await QRCode.toDataURL(portalUrl, {
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });
    const qrSize = 18;
    doc.addImage(qrDataUrl, "PNG", pageW - margin - qrSize, footerY + 2, qrSize, qrSize);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("Scan to view in portal", pageW - margin - qrSize, footerY + qrSize + 4, { align: "left" });
  } catch {
    // QR code generation failed, skip silently
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Thank you for your business.", margin, footerY + 6);
  doc.text("Payment is due upon receipt unless otherwise specified.", margin, footerY + 10);
  doc.text("REVOUXAYNCE", margin, footerY + 16);
  doc.setTextColor(0);

  // Download
  const clientName = client?.name?.replace(/\s+/g, "-") || "invoice";
  doc.save(`Revouxaynce-${isQuotation ? "Quotation" : "Invoice"}-${clientName}-${invoice.id.slice(0, 8)}.pdf`);
}
