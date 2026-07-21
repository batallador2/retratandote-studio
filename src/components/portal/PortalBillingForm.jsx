import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PortalSection from "@/components/portal/PortalSection";

export default function PortalBillingForm({ token, onSaved }) {
  const [form, setForm] = useState({ billing_name: "", billing_nif: "", billing_address: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const complete = form.billing_name.trim() && form.billing_nif.trim() && form.billing_address.trim();

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("clientPortal", { token, action: "saveBilling", content: form });
      onSaved();
    } catch {
      setError("No se han podido guardar los datos. Inténtalo de nuevo.");
    }
    setSaving(false);
  };

  return (
    <PortalSection overline="Un momento" title="Vuestros datos" className="ring-1 ring-[#C9A84C]/40">
      <p className="text-sm text-stone-600 -mt-2 mb-5">
        Necesitamos estos datos para el contrato y los justificantes de pago. Solo se usarán para la gestión de vuestro reportaje.
      </p>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Nombre y apellidos (titular del contrato)</Label>
          <Input className="mt-1" value={form.billing_name} onChange={(e) => setForm({ ...form, billing_name: e.target.value })} placeholder="Nombre completo" />
        </div>
        <div>
          <Label className="text-xs">DNI / NIF</Label>
          <Input className="mt-1" value={form.billing_nif} onChange={(e) => setForm({ ...form, billing_nif: e.target.value })} placeholder="12345678A" />
        </div>
        <div>
          <Label className="text-xs">Dirección completa</Label>
          <Input className="mt-1" value={form.billing_address} onChange={(e) => setForm({ ...form, billing_address: e.target.value })} placeholder="Calle, número, CP, ciudad" />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button onClick={save} disabled={!complete || saving} className="w-full bg-[#C9A84C] hover:bg-[#b8983f] text-[#1A1A18]">
          {saving ? "Guardando…" : "Guardar datos"}
        </Button>
      </div>
    </PortalSection>
  );
}