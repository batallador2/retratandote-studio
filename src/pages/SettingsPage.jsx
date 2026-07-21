import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Copy, Check } from "lucide-react";
import ArchiveSettingsCard from "@/components/settings/ArchiveSettingsCard";
import ExtraServicesCard from "@/components/settings/ExtraServicesCard";

const empty = { name: "", price_min: "", price_max: "", description: "", features: "", highlight: false, order: 0 };

export default function SettingsPage() {
  const [packages, setPackages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [copied, setCopied] = useState(false);

  const load = () => base44.entities.Package.list("order", 50).then(setPackages);
  useEffect(() => { load(); }, []);

  const openEdit = (p) => {
    setForm(p ? { ...p, features: (p.features || []).join("\n") } : empty);
    setEditing(p ? p.id : "new");
  };

  const save = async () => {
    const data = {
      name: form.name,
      price_min: parseFloat(form.price_min) || 0,
      price_max: parseFloat(form.price_max) || 0,
      description: form.description,
      features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
      highlight: !!form.highlight,
      order: parseFloat(form.order) || 0,
    };
    if (editing === "new") await base44.entities.Package.create(data);
    else await base44.entities.Package.update(editing, data);
    setEditing(null);
    load();
  };

  const remove = async (p) => {
    await base44.entities.Package.delete(p.id);
    load();
  };

  const formUrl = `${window.location.origin}/solicitud`;
  const copyForm = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <PageHeader title="Ajustes" subtitle="Paquetes, precios y formulario público">
        <Button onClick={() => openEdit(null)} className="bg-[#1A1A18] hover:bg-stone-800">
          <Plus className="w-4 h-4 mr-2" /> Nuevo paquete
        </Button>
      </PageHeader>

      <div className="px-6 md:px-10 space-y-6 pb-12">
        <Card className="border-stone-200 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-medium text-[#1A1A18] mb-2">Formulario de solicitud para retratandote.es</h3>
            <p className="text-sm text-stone-500 mb-3">
              Enlaza este formulario desde tu web (botón "Reservar fecha") o insértalo con un iframe. Cada envío aparece automáticamente en Solicitudes.
            </p>
            <div className="flex gap-2">
              <Input value={formUrl} readOnly className="text-xs text-stone-500" />
              <Button variant="outline" onClick={copyForm}>
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-stone-400 mt-2 font-mono break-all">
              {`<iframe src="${formUrl}" width="100%" height="700" frameborder="0"></iframe>`}
            </p>
          </CardContent>
        </Card>

        <ExtraServicesCard />

        <ArchiveSettingsCard />

        <div className="grid md:grid-cols-2 gap-4">
          {packages.map((p) => (
            <Card key={p.id} className="border-stone-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1A1A18]">{p.name}</p>
                      {p.highlight && <Badge className="bg-[#C9A84C]/20 text-[#8a7233] border-0">Recomendado</Badge>}
                    </div>
                    <p className="text-sm text-[#C9A84C] font-semibold mt-1">{p.price_min}€ – {p.price_max}€</p>
                    {p.description && <p className="text-sm text-stone-500 mt-1">{p.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-400" onClick={() => remove(p)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                {p.features?.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {p.features.map((f, i) => <li key={i} className="text-xs text-stone-600">• {f}</li>)}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing === "new" ? "Nuevo paquete" : "Editar paquete"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Precio mín. (€)</Label><Input type="number" value={form.price_min} onChange={(e) => setForm({ ...form, price_min: e.target.value })} /></div>
            <div><Label>Precio máx. (€)</Label><Input type="number" value={form.price_max} onChange={(e) => setForm({ ...form, price_max: e.target.value })} /></div>
            <div className="col-span-2"><Label>Descripción</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="col-span-2"><Label>Incluye (una línea por punto)</Label><Textarea rows={5} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} /></div>
            <div><Label>Orden</Label><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></div>
            <div className="flex items-end gap-2 pb-2">
              <input type="checkbox" id="hl" checked={!!form.highlight} onChange={(e) => setForm({ ...form, highlight: e.target.checked })} />
              <Label htmlFor="hl">Recomendado</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={!form.name} className="bg-[#1A1A18] hover:bg-stone-800">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}