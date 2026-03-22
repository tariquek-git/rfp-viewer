import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Question, RFPData } from "@/types";

const COLORS = {
  green: [16, 185, 129] as [number, number, number],
  greenBg: [236, 253, 245] as [number, number, number],
  yellow: [245, 158, 11] as [number, number, number],
  yellowBg: [255, 251, 235] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  redBg: [254, 242, 242] as [number, number, number],
  blue: [37, 99, 235] as [number, number, number],
  blueBg: [239, 246, 255] as [number, number, number],
  dark: [17, 24, 39] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  grayBg: [249, 250, 251] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  grayLine: [229, 231, 235] as [number, number, number],
};

function confColor(c: string): [number, number, number] {
  if (c === "GREEN") return COLORS.green;
  if (c === "YELLOW") return COLORS.yellow;
  if (c === "RED") return COLORS.red;
  return COLORS.gray;
}

function confBg(c: string): [number, number, number] {
  if (c === "GREEN") return COLORS.greenBg;
  if (c === "YELLOW") return COLORS.yellowBg;
  if (c === "RED") return COLORS.redBg;
  return COLORS.grayBg;
}

export async function exportToPDF(data: RFPData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const questions = data.questions;
  const categories = data.categories;
  const green = questions.filter(q => q.confidence === "GREEN").length;
  const yellow = questions.filter(q => q.confidence === "YELLOW").length;
  const red = questions.filter(q => q.confidence === "RED").length;
  const avgScore = (questions.reduce((s, q) => s + (q.committee_score || 0), 0) / questions.length).toFixed(1);
  const compliantY = questions.filter(q => q.compliant === "Y").length;

  // Helper: add page if needed
  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 25) {
      doc.addPage();
      y = 20;
      // Header on each page
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.gray);
      doc.text("BSB Credit Card RFP Response — Brim Financial — Confidential", pageWidth / 2, 10, { align: "center" });
      y = 20;
    }
  };

  // === COVER PAGE ===
  y = 80;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text("CONFIDENTIAL", pageWidth / 2, y, { align: "center" });
  y += 20;
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.dark);
  doc.text("BSB Credit Card Program", pageWidth / 2, y, { align: "center" });
  y += 12;
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.gray);
  doc.text("Request for Proposal Response", pageWidth / 2, y, { align: "center" });
  y += 20;
  doc.setDrawColor(...COLORS.blue);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 15, y, pageWidth / 2 + 15, y);
  y += 15;
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.dark);
  doc.text("Prepared by Brim Financial", pageWidth / 2, y, { align: "center" });
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray);
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.text(`${questions.length} Requirements · ${categories.length} Categories`, pageWidth / 2, y, { align: "center" });

  // === EXECUTIVE OVERVIEW ===
  doc.addPage();
  y = 20;
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.dark);
  doc.text("Executive Overview", margin, y);
  y += 3;
  doc.setDrawColor(...COLORS.dark);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Stats boxes
  const boxW = contentWidth / 4 - 2;
  const stats = [
    { label: "GREEN", value: `${green}`, color: COLORS.green, bg: COLORS.greenBg },
    { label: "YELLOW", value: `${yellow}`, color: COLORS.yellow, bg: COLORS.yellowBg },
    { label: "RED", value: `${red}`, color: COLORS.red, bg: COLORS.redBg },
    { label: "Avg Score", value: avgScore, color: COLORS.dark, bg: COLORS.grayBg },
  ];
  stats.forEach((s, i) => {
    const x = margin + i * (boxW + 2.5);
    doc.setFillColor(...s.bg);
    doc.roundedRect(x, y, boxW, 18, 2, 2, "F");
    doc.setFontSize(16);
    doc.setTextColor(...s.color);
    doc.text(s.value, x + boxW / 2, y + 10, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    doc.text(s.label, x + boxW / 2, y + 15, { align: "center" });
  });
  y += 25;

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.text(`${compliantY} of ${questions.length} requirements (${Math.round((compliantY / questions.length) * 100)}%) fully compliant.`, margin, y);
  y += 8;

  // Category scorecard table
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.dark);
  doc.text("Category Performance", margin, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Category", "Qs", "Avg", "G", "Y", "R", "Compliant"]],
    body: categories.map(cat => {
      const qs = questions.filter(q => q.category === cat);
      const avg = qs.reduce((s, q) => s + (q.committee_score || 0), 0) / (qs.length || 1);
      return [cat, `${qs.length}`, avg.toFixed(1), `${qs.filter(q => q.confidence === "GREEN").length}`, `${qs.filter(q => q.confidence === "YELLOW").length}`, `${qs.filter(q => q.confidence === "RED").length}`, `${qs.filter(q => q.compliant === "Y").length}/${qs.length}`];
    }),
    headStyles: { fillColor: [243, 244, 246], textColor: COLORS.dark, fontSize: 7, fontStyle: "bold" },
    bodyStyles: { fontSize: 7, textColor: COLORS.dark },
    columnStyles: {
      0: { cellWidth: 55 },
      2: { fontStyle: "bold" },
    },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 3) hookData.cell.styles.textColor = COLORS.green;
      if (hookData.section === "body" && hookData.column.index === 4) hookData.cell.styles.textColor = COLORS.yellow;
      if (hookData.section === "body" && hookData.column.index === 5) hookData.cell.styles.textColor = COLORS.red;
    },
  });

  // === RESPONSES ===
  for (const cat of categories) {
    const catQs = questions.filter(q => q.category === cat);
    if (catQs.length === 0) continue;

    doc.addPage();
    y = 20;

    // Category header
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.dark);
    doc.text(cat, margin, y);
    y += 3;
    doc.setDrawColor(...COLORS.grayLine);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    for (const q of catQs) {
      checkPage(60);

      // Ref + topic
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.blue);
      doc.text(q.ref, margin, y);
      doc.setTextColor(...COLORS.gray);
      doc.text(` · ${q.topic}`, margin + doc.getTextWidth(q.ref) + 2, y);
      y += 5;

      // Status line with color coding
      const cc = confColor(q.confidence);
      doc.setFillColor(...confBg(q.confidence));
      doc.roundedRect(margin, y - 3, 22, 5, 1, 1, "F");
      doc.setFontSize(6);
      doc.setTextColor(...cc);
      doc.text(q.confidence, margin + 11, y, { align: "center" });

      const compX = margin + 25;
      const compColor = q.compliant === "Y" ? COLORS.green : q.compliant === "N" ? COLORS.red : COLORS.yellow;
      doc.setTextColor(...compColor);
      doc.text(q.compliant === "Y" ? "Compliant" : q.compliant === "N" ? "Non-Compliant" : "Partial", compX, y);

      doc.setTextColor(...(q.committee_score >= 7 ? COLORS.green : q.committee_score >= 5 ? COLORS.yellow : COLORS.red));
      doc.text(`Score: ${q.committee_score}/10`, compX + 30, y);
      y += 6;

      // Requirement box
      doc.setFillColor(...COLORS.grayBg);
      const reqLines = doc.splitTextToSize(q.requirement, contentWidth - 6);
      const reqHeight = reqLines.length * 3.5 + 6;
      checkPage(reqHeight + 30);
      doc.roundedRect(margin, y - 2, contentWidth, reqHeight, 1, 1, "F");
      doc.setFontSize(5);
      doc.setTextColor(...COLORS.gray);
      doc.text("BSB REQUIREMENT", margin + 3, y + 2);
      doc.setFontSize(7);
      doc.setTextColor(55, 65, 81);
      doc.text(reqLines, margin + 3, y + 6);
      y += reqHeight + 3;

      // Response
      doc.setFontSize(5);
      doc.setTextColor(...COLORS.blue);
      doc.text("BRIM FINANCIAL RESPONSE", margin, y);
      y += 4;
      const response = q.paragraph || q.bullet || "No response provided.";
      const respLines = doc.splitTextToSize(response, contentWidth);
      checkPage(respLines.length * 3.5 + 10);
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.dark);
      doc.text(respLines, margin, y);
      y += respLines.length * 3.5 + 2;

      // Score reasoning (color coded)
      if (q.committee_review) {
        checkPage(15);
        doc.setFillColor(...confBg(q.confidence));
        const reviewLines = doc.splitTextToSize(q.committee_review.slice(0, 200), contentWidth - 6);
        const reviewH = reviewLines.length * 3 + 6;
        doc.roundedRect(margin, y - 1, contentWidth, reviewH, 1, 1, "F");
        doc.setFontSize(5);
        doc.setTextColor(...cc);
        doc.text("SCORE REASONING", margin + 3, y + 2);
        doc.setFontSize(6.5);
        doc.text(reviewLines, margin + 3, y + 5.5);
        y += reviewH + 2;
      }

      // Rationale/source
      if (q.rationale) {
        checkPage(10);
        doc.setFontSize(6);
        doc.setTextColor(...COLORS.gray);
        const ratLines = doc.splitTextToSize(`Source: ${q.rationale.slice(0, 150)}`, contentWidth);
        doc.text(ratLines, margin, y);
        y += ratLines.length * 2.8 + 1;
      }

      // Separator
      y += 3;
      doc.setDrawColor(...COLORS.grayLine);
      doc.setLineWidth(0.1);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
    }
  }

  // Footer
  doc.addPage();
  y = doc.internal.pageSize.getHeight() / 2 - 10;
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray);
  doc.text("This document is confidential and prepared solely for Bangor Savings Bank.", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.text(`Brim Financial · ${new Date().getFullYear()}`, pageWidth / 2, y, { align: "center" });

  doc.save("BSB_RFP_Response_Brim_Financial.pdf");
}
