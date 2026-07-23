import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import ConvertLeadDialog from "@/components/leads/ConvertLeadDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, CalendarCheck, CalendarX, Plus, Phone, Mail, MapPin, Pencil } from "lucide-react";
import { LEAD_STATUS_COLORS } from "@/lib/constants";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [weddings, setWeddings] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [convertLead, setConvertLead] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [discardLead, setDiscardLead] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", event_date: "", location: "", message: "", status: "nuevo" });
  const [form, setForm] = useState({ name: "", email: "", phone: "", event_date: "", location: "", message: "" });

  const load = () => {
    Promise.all([
      base44.entities.Lead.list("-created_date", 100),
      base44.entities.Wedding.list("-created_date", 200),
      base44.entities.CalendarBlock.list("-created_date", 200),
      base44.entities.Package.list("order", 20),
    ]).then(([l, w, b, p]) => {
      setLeads(l);
      setWeddings(w);
      setBlocks(b);
      setPackages(p);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const availability = (date) => {
    if (!date) return null;
    const wedding = weddings.find((w) => w.event_date === date && w.status !== "cerrado");
    if (wedding) return { free: false, why: `Boda de ${wedding.couple_names}` };
    const block = blocks.find((b) => b.date === date && b.type !== "tentativa");
    if (block) return { free: false, why: block.title || "Fecha bloqueada" };
    return { free: true };
  };

  const setStatus = async (lead, status) => {
    await base44.entities.Lead.update(lead.id, { status });
    load();
  };

  const createManual = async () => {
    await base44.entities.Lead.create({ ...form, event_date: form.event_date || undefined, source: "whatsapp", status: "nuevo" });
    setShowNew(false);
    setForm({ name: "", email: "", phone: "", event_date: "", location: "", message: "" });
    load();
  };

  const openEdit = (lead) => {
    setEditLead(lead);
    setEditForm({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      event_date: lead.event_date || "",
      location: lead.location || "",
      message: lead.message || "",
      status: lead.status || "nuevo",
    });
  };

  const saveEdit = async () => {
    if (!editLead) return;
    await base44.entities.Lead.update(editLead.id, {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      event_date: editForm.event_date || undefined,
      location: editForm.location,
      message: editForm.message,
      status: editForm.status,
    });
    setEditLead(null);
    load();
  };

  if (loading) {
    return <div className="flex justify-center pt-32"><div className="w-8 h-8 border-4 border-stone-200 border-t-[#C9A84C] rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="Solicitudes" subtitle="Leads recibidos por web, WhatsApp o Instagram">
        <Button onClick={() => setShowNew(true)} className="bg-[#1A1A18] hover:bg-stone-800">
          <Plus className="w-4 h-4 mr-2" /> Registrar solicitud
        </Button>
      </PageHeader>

      <div className="px-6 md:px-10 space-y-4 pb-10">
        {leads.length === 0 && (
          <Card className="border-stone-200"><CardContent className="p-10 text-center text-stone-400">
            Aún no hay solicitudes. Comparte el formulario público o registra una manualmente.
          </CardContent></Card>
        )}
        {leads.map((lead) => {
          const avail = availability(lead.event_date);
          return (
            <Card key={lead.id} className="border-stone-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[#1A1A18]">{lead.name}</p>
                      <Badge className={(LEAD_STATUS_COLORS[lead.status] || "") + " border-0 capitalize"}>{lead.status}</Badge>
                      <Badge variant="outline" className="capitalize">{lead.source}</Badge>
                      {avail && (
                        <Badge className={avail.free ? "bg-emerald-100 text-emerald-800 border-0" : "bg-red-100 text-red-800 border-0"}>
                          {avail.free ? <><CalendarCheck className="w-3 h-3 mr-1" />Fecha libre</> : <><CalendarX className="w-3 h-3 mr-1" />{avail.why}</>}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-stone-500">
                      {lead.event_date && <span>{format(new Date(lead.event_date), "d 'de' MMMM yyyy", { locale: es })}</span>}
                      {lead.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.location}</span>}
                      {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-[#C9A84C]"><Mail className="w-3 h-3" />{lead.email}</a>}
                      {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#C9A84C]"><Phone className="w-3 h-3" />{lead.phone}</a>}
                    </div>
                    {lead.message && <p className="text-sm text-stone-600 mt-2 bg-stone-50 rounded-lg p-3">{lead.message}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button size="sm" variant="ghost" className="text-stone-400 hover:text-stone-700" title="Editar solicitud" onClick={() => openEdit(lead)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {lead.status !== "convertido" && lead.status !== "descartado" && (
                      <>
                        {lead.status === "nuevo" && (
                          <Button size="sm" variant="outline" onClick={() => setStatus(lead, "contactado")}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Contactado
                          </Button>
                        )}
                        <Button size="sm" className="bg-[#C9A84C] hover:bg-[#b8983f] text-[#1A1A18]" onClick={() => setConvertLead(lead)}>
                          Convertir en encargo
                        </Button>
                        <Button size="sm" variant="ghost" className="text-stone-400 hover:text-red-600" title="Descartar solicitud" onClick={() => setDiscardLead(lead)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!discardLead} onOpenChange={(o) => !o && setDiscardLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar esta solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              La solicitud de <strong>{discardLead?.name}</strong> se marcará como descartada: desaparecerán sus botones de acción y no se convertirá en encargo. La solicitud no se borra y seguirá visible en la lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setStatus(discardLead, "descartado"); setDiscardLead(null); }}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {convertLead && (
        <ConvertLeadDialog lead={convertLead} packages={packages} open={!!convertLead} onOpenChange={(o) => !o && setConvertLead(null)} />
      )}

      {/* Modal de edición de solicitud */}
      <Dialog open={!!editLead} onOpenChange={(o) => !o && setEditLead(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar solicitud de cliente</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><Label>Nombre del cliente *</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
            <div><Label>Teléfono</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div><Label>Fecha del evento</Label><Input type="date" value={editForm.event_date} onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })} /></div>
            <div><Label>Lugar</Label><Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Mensaje / Notas</Label><Textarea value={editForm.message} onChange={(e) => setEditForm({ ...editForm, message: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLead(null)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={!editForm.name} className="bg-[#1A1A18] hover:bg-stone-800">Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar solicitud (WhatsApp / manual)</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Fecha</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
            <div><Label>Lugar</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Mensaje</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={createManual} disabled={!form.name} className="bg-[#1A1A18] hover:bg-stone-800">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}