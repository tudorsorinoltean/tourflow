import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function sanitize(str) {
  if (!str) return "—";
  return String(str)
    .replace(/ă/g, "a").replace(/Ă/g, "A")
    .replace(/â/g, "a").replace(/Â/g, "A")
    .replace(/î/g, "i").replace(/Î/g, "I")
    .replace(/ș/g, "s").replace(/Ș/g, "S")
    .replace(/ț/g, "t").replace(/Ț/g, "T")
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ţ/g, "t").replace(/Ţ/g, "T")
    .replace(/[^\x00-\x7F]/g, "");
}

export function generateBookingPDF(booking, pkg, t) {
  const doc = new jsPDF();
  const primaryColor = [37, 99, 235];
  const lightGray = [248, 250, 252];
  const darkGray = [31, 41, 55];

  // ── Header ──────────────────────────────────────────────
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("TourFlow", 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(t("pdfTitle"), 14, 28);

  doc.setFontSize(9);
  doc.text(`${t("pdfRef")} ${booking.id.slice(0, 8).toUpperCase()}`, 196, 18, { align: "right" });
  doc.text(`${t("pdfDate")} ${new Date().toLocaleDateString("en-GB")}`, 196, 26, { align: "right" });

  // ── Status badge ─────────────────────────────────────────
  const statusColors = {
    confirmed: [34, 197, 94],
    pending: [234, 179, 8],
    cancelled: [239, 68, 68],
  };
  const statusColor = statusColors[booking.status] || statusColors.pending;
  doc.setFillColor(...statusColor);
  doc.roundedRect(14, 46, 40, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(booking.status.toUpperCase(), 34, 53, { align: "center" });

  // ── Package title ─────────────────────────────────────────
  doc.setTextColor(...darkGray);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(sanitize(pkg?.name || booking.packageName), 14, 72);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  if (pkg?.destination) doc.text(`${t("pdfDestination")}: ${sanitize(pkg.destination)}`, 14, 80);
  if (pkg?.duration) doc.text(`${t("pdfDuration")}: ${pkg.duration} ${t("pdfDurationUnit")}`, 120, 80);

  // ── Client info ───────────────────────────────────────────
  doc.setFillColor(...lightGray);
  doc.roundedRect(14, 88, 182, 36, 3, 3, "F");

  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(t("pdfClientInfo"), 20, 97);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text(`${t("pdfClientName")}  ${sanitize(booking.clientName)}`, 20, 106);
  doc.text(`${t("pdfClientEmail")}  ${sanitize(booking.clientEmail)}`, 20, 113);
  doc.text(`${t("pdfClientPhone")}  ${sanitize(booking.clientPhone || "—")}`, 110, 106);

  const travelDate = booking.travelDate?.toDate
    ? booking.travelDate.toDate()
    : new Date(booking.travelDate);
  doc.text(
    `${t("pdfClientTravel")}  ${travelDate.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`,
    110, 113
  );

  // ── Booking details table ─────────────────────────────────
  autoTable(doc, {
    startY: 132,
    head: [[t("pdfDetail"), t("pdfValue")]],
    body: [
      [t("pdfPackage"), sanitize(booking.packageName)],
      [t("pdfDestination"), sanitize(pkg?.destination || "—")],
      [t("pdfDuration"), pkg ? `${pkg.duration} ${t("pdfDurationUnit")}` : "—"],
      [t("pdfAdults"), String(booking.adults)],
      [t("pdfChildren"), String(booking.children || 0)],
      [t("pdfTravelDate"), travelDate.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })],
      [t("pdfCategory"), pkg?.category ? pkg.category.charAt(0).toUpperCase() + pkg.category.slice(1) : "—"],
    ],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: { fontSize: 9, textColor: [55, 65, 81] },
    alternateRowStyles: { fillColor: lightGray },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60 },
      1: { cellWidth: 120 },
    },
    margin: { left: 14, right: 14 },
  });

  // ── Price breakdown ───────────────────────────────────────
  const afterDetails = doc.lastAutoTable.finalY + 10;
  const pricePerAdult = pkg?.price || 0;
  const pricePerChild = pricePerAdult * 0.5;
  const adultsTotal = pricePerAdult * booking.adults;
  const childrenTotal = pricePerChild * (booking.children || 0);

  autoTable(doc, {
    startY: afterDetails,
    head: [[t("pdfPriceBreakdown"), t("pdfAmount")]],
    body: [
      [`${t("pdfAdults")} (${booking.adults} x $${pricePerAdult})`, `$${adultsTotal}`],
      ...(booking.children > 0
        ? [[`${t("pdfChildren")} (${booking.children} x $${pricePerChild})`, `$${childrenTotal}`]]
        : []),
      [t("pdfTotal"), `$${booking.totalPrice}`],
    ],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: { fontSize: 9, textColor: [55, 65, 81] },
    alternateRowStyles: { fillColor: lightGray },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 50, halign: "right" },
    },
    didParseCell: (data) => {
      if (data.row.index === data.table.body.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 11;
        data.cell.styles.textColor = primaryColor;
        data.cell.styles.fillColor = [239, 246, 255];
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Highlights + Notes — 2 coloane 50/50 ─────────────────
  let currentY = doc.lastAutoTable.finalY + 10;

  const hasHighlights = pkg?.highlights?.length > 0;
  const hasNotes = !!booking.notes;

  if (hasHighlights || hasNotes) {
    const colWidth = 87;   // fiecare coloana
    const gap = 8;         // spatiu intre coloane
    const leftX = 14;
    const rightX = leftX + colWidth + gap;
    const padding = 6;

    // calculeaza inaltimea necesara pentru fiecare coloana
    const hlLines = hasHighlights ? pkg.highlights.length : 0;
    const notesText = hasNotes ? sanitize(booking.notes) : "";
    const notesLines = hasNotes
      ? doc.splitTextToSize(notesText, colWidth - padding * 2).length
      : 0;

    const hlHeight = hasHighlights ? 10 + hlLines * 7 + padding : 0;
    const notesHeight = hasNotes ? 10 + notesLines * 6 + padding : 0;
    const blockHeight = Math.max(hlHeight, notesHeight, 30);

    // coloana stanga — Highlights
    if (hasHighlights) {
      doc.setFillColor(...lightGray);
      doc.roundedRect(leftX, currentY, colWidth, blockHeight, 3, 3, "F");

      doc.setTextColor(...darkGray);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(t("pdfHighlights"), leftX + padding, currentY + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);
      pkg.highlights.forEach((h, i) => {
        doc.text(`- ${sanitize(h)}`, leftX + padding, currentY + 16 + i * 7);
      });
    }

    // coloana dreapta — Special Requests
    if (hasNotes) {
      doc.setFillColor(...lightGray);
      doc.roundedRect(rightX, currentY, colWidth, blockHeight, 3, 3, "F");

      doc.setTextColor(...darkGray);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(t("pdfSpecialRequests"), rightX + padding, currentY + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const splitNotes = doc.splitTextToSize(notesText, colWidth - padding * 2);
      doc.text(splitNotes, rightX + padding, currentY + 16);
    }

    currentY += blockHeight + 10;
  }

  // ── Footer — mereu lipit de jos pe ultima pagina ──────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...primaryColor);
    doc.rect(0, 277, 210, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(t("pdfFooter"), 14, 287);
    doc.text("www.tourflow.com  |  contact@tourflow.com", 196, 287, { align: "right" });
  }

  // ── Save ──────────────────────────────────────────────────
  const fileName = `TourFlow_Booking_${sanitize(booking.clientName).replace(/\s+/g, "_")}_${booking.id.slice(0, 6)}.pdf`;
  doc.save(fileName);
}
