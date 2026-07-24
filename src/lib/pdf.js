import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { STUDIO, fmtEUR } from "@/lib/constants";

const fmtDate = (d) => (d ? format(new Date(d), "d 'de' MMMM 'de' yyyy", { locale: es }) : "por confirmar");

function luxuryHeader(doc, title, subtitle) {
  // Dark luxury header box
  doc.setFillColor(26, 26, 24);
  doc.rect(0, 0, 210, 42, "F");

  // Gold accent bar
  doc.setFillColor(201, 168, 76);
  doc.rect(0, 40, 210, 2, "F");

  // Studio Title
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(STUDIO.name.toUpperCase(), 20, 16);

  // Studio Subtitle
  doc.setTextColor(220, 220, 220);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.text(`${STUDIO.owner} · Fotografía de bodas, bautizos y comuniones`, 20, 23);
  doc.text(`${STUDIO.email} · ${STUDIO.phone} · ${STUDIO.web}`, 20, 29);

  // Document Title
  doc.setTextColor(26, 26, 24);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, 54);

  if (subtitle) {
    doc.setTextColor(110, 110, 110);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 20, 60);
    return 68;
  }

  return 62;
}

function line(doc, y, label, value) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(26, 26, 24);
  doc.text(label, 20, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const lines = doc.splitTextToSize(String(value || "—"), 125);
  doc.text(lines, 65, y);
  return y + lines.length * 5 + 3;
}

export function generateProposalPDF(wedding, pkg) {
  const doc = new jsPDF();
  let y = luxuryHeader(doc, "Propuesta de Reportaje Fotográfico", "Una mirada natural, limpia y elegante para días que no se repiten.");

  y = line(doc, y, "Pareja / Cliente", wedding.couple_names || wedding.client_name);
  y = line(doc, y, "Fecha del Evento", fmtDate(wedding.event_date));
  y = line(doc, y, "Localización", wedding.location || "Por determinar");
  y = line(doc, y, "Paquete Seleccionado", wedding.package_name || "Personalizado");
  y = line(doc, y, "Importe Total", fmtEUR(wedding.total_price));
  if (wedding.extras) y = line(doc, y, "Extras incluidos", wedding.extras);
  y += 4;

  // Filosofía y Cómo Trabajamos (4 Pasos)
  doc.setFillColor(250, 247, 242);
  doc.roundedRect(20, y, 170, 28, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(201, 168, 76);
  doc.text("FILOSOFÍA Y METODOLOGÍA EN 4 PASOS", 25, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text("01. Conexión previa · 02. Claridad en condiciones · 03. Cobertura documental discreta · 04. Entrega en 2-3 semanas.", 25, y + 14);
  doc.text("Fotografía viva, sin poses rígidas ni forzar lo que sucede de verdad.", 25, y + 20);
  y += 34;

  // Lo que incluye el paquete
  if (pkg?.features?.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 24);
    doc.text("Lo que incluye vuestro paquete:", 20, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    pkg.features.forEach((f) => {
      doc.text("• " + f, 24, y);
      y += 5.5;
    });
    y += 4;
  }

  // ✨ REGALO DE GALERÍA QR
  doc.setFillColor(248, 244, 230);
  doc.rect(20, y, 170, 18, "F");
  doc.setDrawColor(201, 168, 76);
  doc.rect(20, y, 170, 18, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(138, 114, 51);
  doc.text("REGALO DE BODA INCLUIDO:", 25, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text("Galería interactiva con código QR el día de la boda para que vuestros invitados suban sus fotos al instante.", 25, y + 12);
  y += 24;

  // Forma de Pago y Plazos
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(26, 26, 24);
  doc.text("Forma de pago transparente en 3 plazos:", 20, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const t = wedding.total_price || 0;
  doc.text(`• 20% (${fmtEUR(t * 0.2)}) a la firma del contrato (reserva de fecha oficial).`, 24, y); y += 5.5;
  doc.text(`• 40% (${fmtEUR(t * 0.4)}) un mes antes de la celebración.`, 24, y); y += 5.5;
  doc.text(`• 40% (${fmtEUR(t * 0.4)}) a la entrega final de la galería completada.`, 24, y); y += 10;

  // Compromiso de Entrega
  doc.setFontSize(8.5);
  doc.setTextColor(120, 120, 120);
  doc.text("• Garantía por contrato: entrega de la galería completa en un plazo de 2 a 3 semanas.", 20, y);
  doc.text("• Esta propuesta no exige compromiso inmediato y queda sujeta a la disponibilidad de la fecha.", 20, y + 5);

  doc.save(`Propuesta_${(wedding.couple_names || "boda").replace(/\s+/g, "_")}.pdf`);
}

export function generateReceiptPDF(wedding, payment, extras = []) {
  const doc = new jsPDF();
  let y = luxuryHeader(doc, "Justificante de Pago Oficial", "Comprobante de abono de servicios fotográficos");
  y = line(doc, y, "Cliente", wedding.billing_name || wedding.couple_names || wedding.client_name);
  if (wedding.billing_nif) y = line(doc, y, "DNI / NIF", wedding.billing_nif);
  if (wedding.billing_address) y = line(doc, y, "Dirección", wedding.billing_address);
  y += 3;
  y = line(doc, y, "Concepto de pago", `${payment.label} · Reportaje de ${wedding.couple_names || wedding.client_name}`);
  y = line(doc, y, "Fecha del evento", fmtDate(wedding.event_date));
  y = line(doc, y, "Fecha de abono", fmtDate(payment.paid_date || new Date()));
  if (extras.length) {
    const base = (payment.amount || 0) - extras.reduce((s, x) => s + (x.amount || 0), 0);
    y = line(doc, y, "Pago según contrato", fmtEUR(base));
    extras.forEach((x) => {
      y = line(doc, y, "Extra contratado", `${x.concept || x.name} · ${fmtEUR(x.amount)}`);
    });
  }
  y = line(doc, y, "Importe Recibido", fmtEUR(payment.amount));
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  const note = doc.splitTextToSize(
    `${STUDIO.owner} declara haber recibido el importe indicado a cuenta de los servicios fotográficos contratados. Este documento sirve de justificante de pago oficial.`,
    170
  );
  doc.text(note, 20, y);
  return doc.output("blob");
}

export function generateContractPDF(wedding, signatureDataUrl = null) {
  const doc = new jsPDF();
  let y = luxuryHeader(doc, "Contrato de Servicios Fotográficos", "Condiciones legales y compromiso de servicio");

  y = line(doc, y, "Fotógrafo", `${STUDIO.owner}, autónomo con Seguro de Responsabilidad Civil.`);
  y = line(doc, y, "Cliente / Titular", wedding.billing_name || wedding.couple_names || wedding.client_name);
  if (wedding.billing_nif) y = line(doc, y, "DNI / NIF", wedding.billing_nif);
  if (wedding.billing_address) y = line(doc, y, "Dirección fiscal", wedding.billing_address);
  if (wedding.client_email || wedding.email) y = line(doc, y, "Email", wedding.client_email || wedding.email);
  if (wedding.phone) y = line(doc, y, "Teléfono", wedding.phone);
  y = line(doc, y, "Fecha del evento", fmtDate(wedding.event_date));
  y = line(doc, y, "Lugar de celebración", wedding.location || "Por determinar");
  y = line(doc, y, "Paquete de Cobertura", wedding.package_name || "Personalizado");
  y = line(doc, y, "Importe Total", fmtEUR(wedding.total_price));
  if (wedding.extras) y = line(doc, y, "Extras", wedding.extras);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(26, 26, 24);
  doc.text("Cláusulas y Condiciones Generales", 20, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  const t = wedding.total_price || 0;
  const clauses = [
    `1. Calendario de Pagos: 20% (${fmtEUR(t * 0.2)}) a la firma del presente contrato para bloqueo formal de fecha; 40% (${fmtEUR(t * 0.4)}) 30 días antes del evento; 40% (${fmtEUR(t * 0.4)}) a la entrega de la galería.`,
    "2. Plazo de Entrega Garantizado: El reportaje fotográfico completo procesado en alta resolución se entregará en un plazo máximo de 2 a 3 semanas desde la celebración mediante galería online privada.",
    "3. Regalo de Invitados: Se incluye de regalo la Galería Interactiva con código QR para recopilar las imágenes de los invitados durante la celebración.",
    "4. Cobertura e Imprevistos: La cobertura se ajustará a las horas contratadas. El fotógrafo cuenta con equipo profesional de respaldo y Seguro de Responsabilidad Civil.",
    "5. Reserva y Reserva de Fecha: La entrega de la reserva del 20% bloquea la fecha en exclusiva. En caso de fuerza mayor o cambio de fecha, se reubicará según disponibilidad.",
    "6. Derechos de Imagen: El fotógrafo podrá mostrar una selección respetuosa en su portfolio web o redes salvo que el cliente especifique expresamente por escrito su deseo de estricta confidencialidad.",
    "7. Protección de Datos (RGPD): Los datos facilitados se procesan exclusivamente para la ejecución de este encargo y expedición de justificantes y facturas."
  ];

  clauses.forEach((c) => {
    const lines = doc.splitTextToSize(c, 170);
    if (y + lines.length * 4.5 > 265) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, 20, y);
    y += lines.length * 4.5 + 2.5;
  });

  if (y > 230) {
    doc.addPage();
    y = 30;
  }

  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 26, 24);
  doc.text("Firma del fotógrafo:", 20, y);
  doc.text("Firma del cliente:", 115, y);

  // Line footers
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`${STUDIO.owner}`, 20, y + 16);
  doc.text(`En Alcalá de Henares, a ${fmtDate(new Date())}`, 20, y + 21);

  // Client signature stamp
  if (signatureDataUrl) {
    try {
      doc.addImage(signatureDataUrl, "PNG", 115, y + 2, 45, 18);
      doc.setTextColor(16, 128, 64);
      doc.setFontSize(7.5);
      doc.text(`✓ Firmado digitalmente el ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 115, y + 22);
    } catch (e) {
      console.error("Signature image embed error:", e);
      doc.line(115, y + 18, 180, y + 18);
      doc.text("Firmado electrónicamente", 115, y + 22);
    }
  } else {
    doc.line(115, y + 18, 180, y + 18);
  }

  const pdfOutput = doc.output("blob");
  if (signatureDataUrl) {
    return pdfOutput;
  }

  doc.save(`Contrato_${(wedding.couple_names || "boda").replace(/\s+/g, "_")}.pdf`);
  return pdfOutput;
}