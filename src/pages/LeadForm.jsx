import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Heart, Check } from "lucide-react";
import { STUDIO } from "@/lib/constants";

export default function LeadForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", event_type: "boda", event_date: "", location: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);

    const fullMessage = [
      form.event_type ? `Tipo de reportaje: ${form.event_type.toUpperCase()}` : "",
      form.message ? form.message : ""
    ].filter(Boolean).join("\n");

    await base44.entities.Lead.create({
      name: form.name,
      email: form.email || "",
      phone: form.phone || "",
      event_date: form.event_date || undefined,
      location: form.location || "",
      message: fullMessage,
      notes: fullMessage,
      source: "web",
      status: "nuevo",
    });

    setSending(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-[#C9A84C]/15 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-[#C9A84C]" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A18] mb-3">¡Gracias por escribirme!</h1>
          <p className="text-stone-600 mb-6">
            He recibido tu solicitud. Te responderé personalmente muy pronto para ver disponibilidad y preparar una propuesta bonita, clara y sin compromiso.
          </p>
          <a
            href={`https://wa.me/34637516633?text=${encodeURIComponent(`Hola Juanjo, soy ${form.name}. Acabo de enviarte una solicitud desde la web para mi ${form.event_type}${form.event_date ? ` el ${form.event_date}` : ""}.`)}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline" className="border-[#C9A84C] text-[#8a7233]">
              ¿Prisa? Escríbeme por WhatsApp
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Camera className="w-6 h-6 text-[#C9A84C]" />
            <span className="text-xl font-semibold text-[#1A1A18] tracking-wide">{STUDIO.name}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A18] tracking-tight">Cuéntame qué vas a celebrar</h1>
          <p className="text-stone-500 mt-2 text-sm">Te respondo personalmente para ver disponibilidad y preparar una propuesta sin compromiso.</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 md:p-8 space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo de reportaje</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="boda">Boda</SelectItem>
                  <SelectItem value="bautizo">Bautizo</SelectItem>
                  <SelectItem value="comunion">Comunión</SelectItem>
                  <SelectItem value="otro">Familia / evento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha aproximada</Label>
              <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Lugar</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Madrid, Alcalá de Henares…" className="mt-1" />
          </div>
          <div>
            <Label>Mensaje</Label>
            <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Cuéntame un poco sobre vuestro día…" className="mt-1" />
          </div>
          <Button type="submit" disabled={sending || !form.name} className="w-full bg-[#1A1A18] hover:bg-stone-800 h-11">
            {sending ? "Enviando…" : <><Heart className="w-4 h-4 mr-2 text-[#C9A84C]" /> Enviar consulta</>}
          </Button>
          <p className="text-[11px] text-stone-400 text-center">Tus datos solo se usan para responder a tu consulta.</p>
        </form>
      </div>
    </div>
  );
}