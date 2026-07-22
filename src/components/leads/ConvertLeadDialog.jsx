import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { genToken } from "@/lib/constants";

export default function ConvertLeadDialog({ lead, packages, open, onOpenChange }) {
  const navigate = useNavigate();
  const [pkgName, setPkgName] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const selectPkg = (name) => {
    setPkgName(name);
    const p = packages.find((x) => x.name === name);
    if (p) setPrice(String(p.price_min || ""));
  };

  const convert = async () => {
    setSaving(true);
    try {
      const wedding = await base44.entities.Wedding.create({
        couple_names: lead.name,
        client_name: lead.name,
        client_email: lead.email || "",
        event_date: lead.event_date || undefined,
        location: lead.location || "",
        package_name: pkgName,
        total_price: parseFloat(price) || 0,
        status: "propuesta_enviada",
        portal_token: genToken(),
        guest_token: genToken()
      });
      if (lead.event_date) {
        await base44.entities.CalendarBlock.create({ date: lead.event_date, type: "tentativa", title: `Boda ${lead.name}` });
      }
      await base44.entities.Lead.update(lead.id, { status: "convertido" });
      setSaving(false);
      onOpenChange(false);
      if (wedding && wedding.id) {
        navigate(`/boda/${wedding.id}`);
      }
    } catch (err) {
      console.error("Error al convertir solicitud:", err);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convertir en encargo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Paquete</Label>
            <Select value={pkgName} onValueChange={selectPkg}>
              <SelectTrigger><SelectValue placeholder="Elige un paquete" /></SelectTrigger>
              <SelectContent>
                {packages.map((p) => (
                  <SelectItem key={p.id} value={p.name}>
                    {p.name} ({p.price_min}€ - {p.price_max}€)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Precio final (€)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1500" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={convert} disabled={saving || !pkgName || !price} className="bg-[#1A1A18] hover:bg-stone-800">
            {saving ? "Creando…" : "Crear encargo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}