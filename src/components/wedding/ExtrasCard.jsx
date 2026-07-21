import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, Sparkles } from "lucide-react";
import { fmtEUR } from "@/lib/constants";

export default function ExtrasCard({ wedding, extras, payments, onChanged }) {
  const [services, setServices] = useState([]);
  const [concept, setConcept] = useState("");
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { base44.entities.ExtraService.list("order", 100).then(setServices); }, []);

  const lastUnpaid = [...payments].reverse().find((p) => !p.paid);
  const amount = parseFloat(amountStr);
  const valid = concept.trim() && amount > 0;

  const pickService = (id) => {
    const s = services.find((sv) => sv.id === id);
    if (!s) return;
    setConcept(s.name);
    setAmountStr(String(s.price));
    setDescription(s.description || "");
  };

  const addExtra = async () => {
    setBusy(true);
    await base44.entities.WeddingExtra.create({
      wedding_id: wedding.id,
      concept: concept.trim(),
      description: description.trim(),
      amount,
      payment_id: lastUnpaid?.id,
    });
    if (lastUnpaid) await base44.entities.Payment.update(lastUnpaid.id, { amount: (lastUnpaid.amount || 0) + amount });
    await base44.entities.Wedding.update(wedding.id, { total_price: (wedding.total_price || 0) + amount });
    setConcept("");
    setDescription("");
    setAmountStr("");
    setBusy(false);
    onChanged();
  };

  const removeExtra = async (x) => {
    setBusy(true);
    const pay = payments.find((p) => p.id === x.payment_id);
    await base44.entities.WeddingExtra.delete(x.id);
    if (pay && !pay.paid) await base44.entities.Payment.update(pay.id, { amount: (pay.amount || 0) - x.amount });
    await base44.entities.Wedding.update(wedding.id, { total_price: (wedding.total_price || 0) - x.amount });
    setBusy(false);
    onChanged();
  };

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C9A84C]" /> Extras de última hora
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {extras.length === 0 && (
          <p className="text-sm text-stone-500">Elige un extra del catálogo o escribe uno nuevo. Se suman al último pago pendiente y al total.</p>
        )}
        {extras.map((x) => {
          const pay = payments.find((p) => p.id === x.payment_id);
          return (
            <div key={x.id} className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 border border-stone-100">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A18]">{x.concept}</p>
                {x.description && <p className="text-xs text-stone-500">{x.description}</p>}
                <p className="text-xs text-stone-400">{pay ? `Sumado a "${pay.label}"${pay.paid ? " (ya pagado)" : ""}` : "Sumado al total"}</p>
              </div>
              <span className="text-sm font-semibold text-[#1A1A18]">{fmtEUR(x.amount)}</span>
              <Button size="sm" variant="ghost" className="text-stone-400" disabled={busy || pay?.paid} title={pay?.paid ? "El pago ya está cobrado" : "Eliminar extra"} onClick={() => removeExtra(x)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
        {services.length > 0 && (
          <Select value="" onValueChange={pickService}>
            <SelectTrigger>
              <SelectValue placeholder="Elegir del catálogo de extras…" />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name} · {fmtEUR(s.price)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex gap-2">
          <Input value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Concepto (ej: Álbum para padres)" className="flex-1" />
          <Input value={amountStr} onChange={(e) => setAmountStr(e.target.value)} placeholder="€" type="number" className="w-24" />
        </div>
        <div className="flex gap-2">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción corta (opcional)" className="flex-1" />
          <Button variant="outline" disabled={!valid || busy} onClick={addExtra}>
            <PlusCircle className="w-4 h-4 mr-1.5" /> Añadir
          </Button>
        </div>
        {!lastUnpaid && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5">No hay pagos pendientes: el extra solo se sumará al precio total.</p>
        )}
      </CardContent>
    </Card>
  );
}