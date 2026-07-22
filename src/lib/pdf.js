import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { STUDIO, fmtEUR } from "@/lib/constants";

const fmtDate = (d) => (d ? format(new Date(d), "d 'de' MMMM 'de' yyyy", { locale: es }) : "por confirmar");

function header(doc, title) {
  doc.setFillColor(26, 26, 24);
  doc.rect(0, 0, 210, 34, "F");
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(STUDIO.name, 20, 16);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${STUDIO.owner} · Fotografía de bodas · ${STUDIO.location}`, 20, 23);
  doc.text(`${STUDIO.email} · ${STUDIO.phone} · ${STUDIO.web}`, 20, 29);
  doc.setTextColor(26, 26, 24);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, 48);
  return 58;
}

function line(doc, y, label, value) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(label, 20, y);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(String(value || "—"), 120);
  doc.text(lines, 70, y);
  return y + lines.length * 5 + 3;
}

export function generateProposalPDF(wedding, pkg) {
  const doc = new jsPDF();
  let y = header(doc, "Propuesta de reportaje de boda");
  y = line(doc, y, "Pareja", wedding.couple_names || wedding.client_name);
  y = line(doc, y, "Fecha", fmtDate(wedding.event_date));
  y = line(doc, y, "Lugar", wedding.location);
  y = line(doc, y, "Paquete", wedding.package_name || "Personalizado");
  y = line(doc, y, "Precio total", fmtEUR(wedding.total_price));
  if (wedding.extras) y = line(doc, y, "Extras", wedding.extras);
  y += 5;
  if (pkg?.features?.length) {
    doc.setFont("helvetica", "bold");
    doc.text("Incluye:", 20, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    pkg.features.forEach((f) => {
      doc.text("• " + f, 24, y);
      y += 6;
    });
    y += 4;
  }
  doc.setFont("helvetica", "bold");
  doc.text("Forma de pago:", 20, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const t = wedding.total_price || 0;
  doc.text(`• 20% (${fmtEUR(t * 0.2)}) al firmar el contrato, para reservar la fecha.`, 24, y); y += 6;
  doc.text(`• 40% (${fmtEUR(t * 0.4)}) un mes antes de la boda.`, 24, y); y += 6;
  doc.text(`• 40% (${fmtEUR(t * 0.4)}) a la entrega del reportaje.`, 24, y); y += 12;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Entrega del reportaje completo en 1-2 semanas. El álbum físico puede requerir más tiempo de producción.", 20, y);
  doc.text("Propuesta sin compromiso. Válida sujeta a disponibilidad de la fecha.", 20, y + 5);
  doc.save(`Propuesta_${(wedding.couple_names || "boda").replace(/\s+/g, "_")}.pdf`);
}

export function generateReceiptPDF(wedding, payment, extras = []) {
  const doc = new jsPDF();
  let y = header(doc, "Justificante de pago");
  y = line(doc, y, "Cliente", wedding.billing_name || wedding.couple_names || wedding.client_name);
  if (wedding.billing_nif) y = line(doc, y, "DNI / NIF", wedding.billing_nif);
  if (wedding.billing_address) y = line(doc, y, "Dirección", wedding.billing_address);
  y += 3;
  y = line(doc, y, "Concepto", `${payment.label} · Reportaje de boda de ${wedding.couple_names || wedding.client_name}`);
  y = line(doc, y, "Fecha del evento", fmtDate(wedding.event_date));
  y = line(doc, y, "Fecha de pago", fmtDate(payment.paid_date || new Date()));
  if (extras.length) {
    const base = (payment.amount || 0) - extras.reduce((s, x) => s + (x.amount || 0), 0);
    y = line(doc, y, "Pago según contrato", fmtEUR(base));
    extras.forEach((x) => {
      y = line(doc, y, "Extra", `${x.concept || x.name} · ${fmtEUR(x.amount)}`);
    });
  }
  y = line(doc, y, "Importe recibido", fmtEUR(payment.amount));
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  const note = doc.splitTextToSize(
    `${STUDIO.owner} declara haber recibido el importe indicado a cuenta de los servicios fotográficos contratados. Este documento es un justificante de pago y no sustituye a la factura, que se emitirá conforme a la normativa vigente.`,
    170
  );
  doc.text(note, 20, y);
  return doc.output("blob");
}

export function generateContractPDF(wedding) {
  const doc = new jsPDF();
  let y = header(doc, "Contrato de servicios fotográficos");
  y = line(doc, y, "Fotógrafo", `${STUDIO.owner}, profesional dado de alta como autónomo, con Seguro de Responsabilidad Civil.`);
  y = line(doc, y, "Cliente", wedding.billing_name || wedding.couple_names || wedding.client_name);
  if (wedding.billing_nif) y = line(doc, y, "DNI / NIF", wedding.billing_nif);
  if (wedding.billing_address) y = line(doc, y, "Dirección", wedding.billing_address);
  if (wedding.client_email || wedding.email) y = line(doc, y, "Email", wedding.client_email || wedding.email);
  if (wedding.phone) y = line(doc, y, "Teléfono", wedding.phone);
  y = line(doc, y, "Fecha del evento", fmtDate(wedding.event_date));
  y = line(doc, y, "Lugar", wedding.location);
  y = line(doc, y, "Paquete", wedding.package_name || "Personalizado");
  y = line(doc, y, "Precio total", fmtEUR(wedding.total_price));
  if (wedding.extras) y = line(doc, y, "Extras", wedding.extras);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Condiciones", 20, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const t = wedding.total_price || 0;
  const clauses = [
    `1. Pago: 20% (${fmtEUR(t * 0.2)}) a la firma del presente contrato en concepto de reserva de fecha; 40% (${fmtEUR(t * 0.4)}) un mes antes de la boda; 40% (${fmtEUR(t * 0.4)}) a la entrega del reportaje.`,
    "2. Entrega: reportaje completo editado (galería online) en un plazo de 1-2 semanas desde la fecha del evento. El álbum físico y demás productos impresos pueden requerir un plazo mayor por producción. Cualquier retraso será comunicado con antelación.",
    "3. Cobertura: la descrita en el paquete contratado. Las horas extra se presupuestan antes de la boda.",
    "4. Desplazamiento local en Alcalá de Henares sin coste. Otros desplazamientos según propuesta.",
    "5. Cancelación: la reserva del 20% no es reembolsable al bloquear la fecha frente a otros clientes. En caso de cambio de fecha, se intentará reubicar sin coste sujeto a disponibilidad.",
    "6. El fotógrafo emitirá factura por los importes abonados y cuenta con Seguro de Responsabilidad Civil.",
    "7. Los archivos se entregan en alta resolución a través de galería online privada.",
    "8. Protección de datos: los datos del cliente se utilizan exclusivamente para la gestión de este encargo conforme al RGPD.",
  ];
  clauses.forEach((c) => {
    const lines = doc.splitTextToSize(c, 170);
    if (y + lines.length * 5 > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, 20, y);
    y += lines.length * 5 + 3;
  });
  if (y > 240) {
    doc.addPage();
    y = 30;
  }
  y += 10;
  doc.setFontSize(10);
  doc.text("Firma del fotógrafo:", 20, y);
  doc.text("Firma del cliente:", 120, y);
  doc.line(20, y + 18, 85, y + 18);
  doc.line(120, y + 18, 185, y + 18);
  doc.text(`En ${STUDIO.location.split("·")[0].trim()}, a ${fmtDate(new Date())}`, 20, y + 30);
  doc.save(`Contrato_${(wedding.couple_names || "boda").replace(/\s+/g, "_")}.pdf`);
}