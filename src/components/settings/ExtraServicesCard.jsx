import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { fmtEUR } from "@/lib/constants";

const empty = { name: "", price: "", description: "" };

export default function ExtraServicesCard() {
  const [services, setServices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = () => base44.entities.ExtraService.list("order", 100).then(setServices);
  useEffect(() => { load(); }, []);

  const openEdit = (s) => {
    setForm(s ? { name: s.name, price: s.price, description: s.description || "" } : empty);
    setEditing(s ? s.id : "new");
  };

  const save = async () => {
    const data = { name: form.name.trim(), price: parseFloat(form.price) || 0, description: form.description.trim() };
    if (editing === "new") await base44.entities.ExtraService.create(data);
    else await base44.entities.ExtraService.update(editing, data);
    setEditing(null);
    load();
  };

  const remove = async (s) => {
    await base44.entities.ExtraService.delete(s.id);
    load();
  };

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-[#1A1A18] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C9A84C]" /> Catálogo de extras
          </h3>
          <Button size="sm" variant="outline" onClick={() => openEdit(null)}>
            <Plus className="w-4 h-4 mr-1.5" /> Nuevo extra
          </Button>
        </div>
        <p className="text-sm text-stone-500 mb-4">
          Servicios adicionales con precio fijo. Podrás añadirlos a cualquier boda con un clic desde su ficha.
        </p>
        {services.length === 0 && (
          <p className="text-sm text-stone-400 italic">Aún no hay extras. Ej: Segundo fotógrafo, Hora extra de cobertura…</p>
        )}
        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 border border-stone-100">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A18]">{s.name}</p>
                {s.description && <p className="text-xs text-stone-500">{s.description}</p>}
              </div>
              <span className="text-sm font-semibold text-[#C9A84C]">{fmtEUR(s.price)}</span>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-red-400" onClick={() => remove(s)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing === "new" ? "Nuevo extra" : "Editar extra"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Segundo fotógrafo" /></div>
              <div><Label>Precio (€)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Descripción corta (opcional)</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej: Cobertura doble durante toda la jornada" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={save} disabled={!form.name.trim() || !(parseFloat(form.price) > 0)} className="bg-[#1A1A18] hover:bg-stone-800">Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}