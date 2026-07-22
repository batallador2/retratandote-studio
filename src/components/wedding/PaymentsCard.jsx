import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Euro, Bell } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { fmtEUR } from "@/lib/constants";
import { generateReceiptPDF } from "@/lib/pdf";

export default function PaymentsCard({ payments, wedding, extras = [], onChanged }) {
  const [busy, setBusy] = useState(null);

  const remind = (p) => {
    const dueTxt = p.due_date ? ` (vence el ${format(new Date(p.due_date), "d 'de' MMMM", { locale: es })})` : "";
    const portalUrl = wedding?.portal_token ? `${window.location.origin}/portal/${wedding.portal_token}` : "";
    const msg = `¡Hola! 😊 Os escribo para recordaros el pago "${p.label}" de ${fmtEUR(p.amount)}${dueTxt}. Podéis ver el detalle en vuestro portal privado: ${portalUrl} ¡Gracias! — Juanjo, Retratándote`;
    const phone = (wedding?.phone || "").replace(/\D/g, "");
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    } else if (wedding?.email) {
      window.open(`mailto:${wedding.email}?subject=${encodeURIComponent("Recordatorio de pago · Retratándote")}&body=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  const markPaid = async (p) => {
    setBusy(p.id);
    const paid_date = format(new Date(), "yyyy-MM-dd");
    await base44.entities.Payment.update(p.id, { paid: true, paid_date });

    // Avanzar automáticamente la fase del Pipeline a "reserva_cobrada" al marcar el pago de la reserva o si está en contrato_firmado / propuesta_enviada
    const isReservation = (p.label || "").toLowerCase().includes("reserva");
    if (wedding && (isReservation || ["propuesta_enviada", "contrato_firmado"].includes(wedding.status))) {
      await base44.entities.Wedding.update(wedding.id, { status: "reserva_cobrada" });
    }

    const blob = generateReceiptPDF(wedding, { ...p, paid_date }, extras.filter((x) => x.payment_id === p.id));
    const filename = `Justificante_${(p.label || "pago").replace(/\s+/g, "_")}_${(wedding.couple_names || "").replace(/\s+/g, "_")}.pdf`;
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: new File([blob], filename, { type: "application/pdf" }) });
    await base44.entities.Document.create({
      wedding_id: wedding.id,
      name: `Justificante de pago · ${p.label}`,
      doc_type: "justificante",
      file_uri,
      visible_to_client: true,
    });
    setBusy(null);
    onChanged();
  };

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const paid = payments.filter((p) => p.paid).reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Euro className="w-4 h-4 text-[#C9A84C]" /> Pagos
          <span className="ml-auto text-sm font-normal text-stone-500">
            {fmtEUR(paid)} / {fmtEUR(total)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {payments.length === 0 && (
          <p className="text-sm text-stone-500">Los pagos se generan al marcar el contrato como firmado.</p>
        )}
        {payments.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 border border-stone-100">
            {p.paid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-stone-300 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A18]">{p.label}</p>
              <p className="text-xs text-stone-500">
                {p.paid
                  ? `Pagado el ${format(new Date(p.paid_date), "dd/MM/yyyy")}`
                  : p.due_date
                  ? `Vence: ${format(new Date(p.due_date), "dd/MM/yyyy")}`
                  : "Sin fecha"}
              </p>
            </div>
            <Badge variant="outline" className="font-semibold">{fmtEUR(p.amount)}</Badge>
            {!p.paid && (
              <div className="flex gap-1.5">
                {(wedding?.phone || wedding?.email) && (
                  <Button size="sm" variant="ghost" className="text-[#8a7233]" title="Enviar recordatorio" onClick={() => remind(p)}>
                    <Bell className="w-4 h-4" />
                  </Button>
                )}
                <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => markPaid(p)}>
                  Marcar pagado
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}