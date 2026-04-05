import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import type { Invoice, Client, Event, BrandSettings } from "@/types";
import { calcInvoiceTotals, calcMilestoneAmount } from "@/types";
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
    img.onload = () => { ctx.drawImage(img, 0, 0, width, height); URL.revokeObjectURL(url); resolve(canvas.toDataURL("image/png")); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
    img.src = url;
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.substring(0, 2), 16) || 0, parseInt(h.substring(2, 4), 16) || 0, parseInt(h.substring(4, 6), 16) || 0];
}

export async function generateInvoicePDF(
  invoice: Invoice,
  client: Client | undefined,
  event: Event | undefined,
  brand?: BrandSettings,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;
  const accent = brand?.accent_color ? hexToRgb(brand.accent_color) : [0, 0, 0] as [number, number, number];

  // ─── HEADER ──────────────────────────────────────────────
  try {
    const resp = await fetch("/images/revouxaynce-logo.svg");
    const svgText = await resp.text();
    const logoDataUrl = await svgToDataUrl(svgText, 427, 153);
    if (logoDataUrl) { const logoH = 12; doc.addImage(logoDataUrl, "PNG", margin, y - 2, logoH * (427 / 153), logoH); y += logoH + 2; }
  } catch {
    doc.setFont("helvetica", "bold"); doc.setFontSize(22);
    doc.text("REVOUXAYNCE", margin, y + 6); y += 12;
  }

  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100);
  doc.text("Premium Event Management", margin, y);
  doc.text("hello@revouxaynce.com  |  +263 77 200 1001", margin, y + 4);
  doc.setTextColor(0);

  const isQuotation = invoice.status === "Quotation";
  doc.setFont("helvetica", "bold"); doc.setFontSize(28);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(isQuotation ? "QUOTATION" : "INVOICE", pageW - margin, margin + 6, { align: "right" });
  doc.setTextColor(0);

  // Version badge
  if ((invoice.version || 1) > 1) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(130);
    doc.text(`v${invoice.version}`, pageW - margin, margin + 14, { align: "right" });
    doc.setTextColor(0);
  }

  y += 10;
  doc.setDrawColor(220); doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y); y += 10;

  // ─── BILL TO ─────────────────────────────────────────────
  const colRight = pageW / 2 + 10;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(130);
  doc.text("BILL TO", margin, y); doc.setTextColor(0); y += 5;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text(client?.name || "—", margin, y); y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80);
  if (client?.email) { doc.text(client.email, margin, y); y += 4; }
  if (client?.phone) { doc.text(client.phone, margin, y); y += 4; }
  doc.setTextColor(0);

  let ry = y - 14;
  const valX = pageW - margin;
  const metaItems: [string, string][] = [
    [isQuotation ? "QUOTE NO." : "INVOICE NO.", `${isQuotation ? "QT" : "INV"}-${invoice.id.slice(0, 8).toUpperCase()}`],
    ["ISSUE DATE", new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })],
    ["DUE DATE", invoice.dueDate ? new Date(invoice.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"],
  ];
  if (event) metaItems.push(["EVENT", event.name]);
  if (invoice.billingType === "milestone") metaItems.push(["BILLING", "Milestone"]);

  for (const [label, val] of metaItems) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(130);
    doc.text(label, colRight, ry); doc.setTextColor(0);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(val, valX, ry, { align: "right" }); ry += 6;
  }
  y = Math.max(y, ry) + 12;

  // ─── LINE ITEMS ──────────────────────────────────────────
  const items = invoice.lineItems.length > 0
    ? invoice.lineItems
    : [{ desc: "Event services", qty: 1, unitPrice: invoice.amount, amount: invoice.amount }];

  autoTable(doc, {
    startY: y, margin: { left: margin, right: margin },
    head: [["#", "Description", "Qty", "Unit Price", "Total"]],
    body: items.map((li, i) => [String(i + 1), li.desc, String(li.qty), fmt$(li.unitPrice), fmt$(li.amount)]),
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 3, right: 3 }, textColor: [30, 30, 30] },
    headStyles: { fillColor: [245, 245, 245], textColor: [100, 100, 100], fontSize: 7.5, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 12, halign: "center" }, 1: { cellWidth: "auto" }, 2: { cellWidth: 18, halign: "center" }, 3: { cellWidth: 30, halign: "right" }, 4: { cellWidth: 30, halign: "right", fontStyle: "bold" } },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    didDrawCell: (data) => { if (data.section === "body") { doc.setDrawColor(235); doc.setLineWidth(0.3); doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height); } },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // ─── TOTALS ──────────────────────────────────────────────
  const totals = calcInvoiceTotals(
    items.map((li) => ({ qty: li.qty, unitPrice: li.unitPrice })),
    invoice.discountType || "flat",
    invoice.discountValue || invoice.discountAmount || 0,
    invoice.taxRate || 0,
  );

  const totalsX = pageW - margin - 60;
  const totalsValX = pageW - margin;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80);
  doc.text("Subtotal", totalsX, y); doc.text(fmt$(totals.subtotal), totalsValX, y, { align: "right" }); y += 6;

  if (totals.discount > 0) {
    const discLabel = invoice.discountType === "percent" ? `Discount (${invoice.discountValue}%)` : "Discount";
    doc.text(discLabel, totalsX, y); doc.text(`-${fmt$(totals.discount)}`, totalsValX, y, { align: "right" }); y += 6;
  }
  if ((invoice.taxRate || 0) > 0) {
    doc.text(`Tax (${invoice.taxRate}%)`, totalsX, y); doc.text(fmt$(totals.tax), totalsValX, y, { align: "right" }); y += 6;
  }

  doc.setDrawColor(accent[0], accent[1], accent[2]); doc.setLineWidth(0.8);
  doc.line(totalsX - 5, y, pageW - margin, y); y += 7;
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(0);
  doc.text("TOTAL DUE", totalsX, y); doc.text(fmt$(totals.grandTotal), totalsValX, y, { align: "right" }); y += 6;

  if (invoice.status === "Paid") { doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(80, 160, 80); doc.text("PAID", totalsValX, y, { align: "right" }); }
  else if (invoice.status === "Overdue") { doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(200, 60, 60); doc.text("OVERDUE", totalsValX, y, { align: "right" }); }
  doc.setTextColor(0); y += 14;

  // ─── MILESTONE BREAKDOWN ─────────────────────────────────
  if (invoice.billingType === "milestone" && invoice.milestones && invoice.milestones.length > 0) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(130);
    doc.text("PAYMENT MILESTONES", margin, y); doc.setTextColor(0); y += 5;

    autoTable(doc, {
      startY: y, margin: { left: margin, right: margin },
      head: [["Milestone", "%", "Amount", "Due Date", "Status"]],
      body: invoice.milestones.map((ms) => [
        ms.label, `${ms.percentage}%`, fmt$(calcMilestoneAmount(totals.grandTotal, ms)),
        ms.dueDate ? new Date(ms.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—",
        ms.status,
      ]),
      theme: "plain",
      styles: { font: "helvetica", fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 3, right: 3 }, textColor: [50, 50, 50] },
      headStyles: { fillColor: [245, 245, 245], textColor: [100, 100, 100], fontSize: 7, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 15, halign: "center" }, 2: { cellWidth: 28, halign: "right" }, 3: { cellWidth: 28, halign: "center" }, 4: { cellWidth: 22, halign: "center" } },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ─── NOTES ───────────────────────────────────────────────
  if (invoice.notes) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(130); doc.text("NOTES", margin, y); doc.setTextColor(0); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80);
    const noteLines = doc.splitTextToSize(invoice.notes, contentW);
    doc.text(noteLines, margin, y); y += noteLines.length * 4 + 8; doc.setTextColor(0);
  }

  if (brand?.terms_and_conditions) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(130); doc.text("TERMS & CONDITIONS", margin, y); doc.setTextColor(0); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100);
    const tLines = doc.splitTextToSize(brand.terms_and_conditions, contentW);
    doc.text(tLines, margin, y); y += tLines.length * 3.5 + 8; doc.setTextColor(0);
  }

  // ─── FOOTER ──────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(230); doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageW - margin, footerY);

  try {
    const portalUrl = `${window.location.origin}/portal/invoice/${invoice.id}`;
    const qrDataUrl = await QRCode.toDataURL(portalUrl, { width: 200, margin: 1, color: { dark: "#000000", light: "#ffffff" } });
    doc.addImage(qrDataUrl, "PNG", pageW - margin - 18, footerY + 2, 18, 18);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(150);
    doc.text("Scan to view in portal", pageW - margin - 18, footerY + 22);
  } catch { /* skip */ }

  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(150);
  doc.text(brand?.footer_text || "Thank you for your business.", margin, footerY + 6);
  doc.text("REVOUXAYNCE", margin, footerY + 12);
  doc.setTextColor(0);

  const clientName = client?.name?.replace(/\s+/g, "-") || "invoice";
  doc.save(`Revouxaynce-${isQuotation ? "Quotation" : "Invoice"}-${clientName}-${invoice.id.slice(0, 8)}.pdf`);
}
