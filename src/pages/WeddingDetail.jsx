import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PaymentsCard from "@/components/wedding/PaymentsCard";
import MessagesCard from "@/components/wedding/MessagesCard";
import GalleryCard from "@/components/wedding/GalleryCard";
import DeliveryGalleryCard from "@/components/wedding/DeliveryGalleryCard";
import DocumentsCard from "@/components/wedding/DocumentsCard";
import GuestAreaCard from "@/components/wedding/GuestAreaCard";
import ArchiveCard from "@/components/wedding/ArchiveCard";
import ExtrasCard from "@/components/wedding/ExtrasCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, FileSignature, Link2, Copy, Check, ExternalLink, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format, subMonths, addWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { WEDDING_STATUSES, statusInfo, fmtEUR } from "@/lib/constants";
import { generateProposalPDF, generateContractPDF } from "@/lib/pdf";

export default function WeddingDetail() {
  const { id } = useParams();
  const [wedding, setWedding] = useState(null);
  const [payments, setPayments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [packages, setPackages] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [weddingExtras, setWeddingExtras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [galleryUrl, setGalleryUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editNotice, setEditNotice] = useState("");

  const load = useCallback(() => {
    Promise.all([
      base44.entities.Wedding.get(id),
      base44.entities.Payment.filter({ wedding_id: id }, "due_date"),
      base44.entities.ClientMessage.filter({ wedding_id: id }, "created_date"),
      base44.entities.Package.list("order", 20),
      base44.entities.GalleryPhoto.filter({ wedding_id: id }, "order"),
      base44.entities.Document.filter({ wedding_id: id }, "created_date"),
      base44.entities.WeddingExtra.filter({ wedding_id: id }, "created_date"),
    ]).then(([w, p, m, pk, ph, docs, ex]) => {
      setWedding(w);
      setPayments(p);
      setMessages(m);
      setPackages(pk);
      setPhotos(ph);
      setDocuments(docs);
      setWeddingExtras(ex);
      setGalleryUrl(w.gallery_url || "");
      setNotes(w.notes || "");
      setEditForm({
        couple_names: w.couple_names || "",
        client_name: w.client_name || w.billing_name || "",
        client_email: w.client_email || w.email || "",
        phone: w.phone || "",
        event_date: w.event_date || "",
        location: w.location || "",
        package_name: w.package_name || "",
        total_price: w.total_price || 0,
      });
      setLoading(false);
    });
  }, [id]);
  useEffect(load, [load]);

  if (loading) {
    return <div className="flex justify-center pt-32"><div className="w-8 h-8 border-4 border-stone-200 border-t-[#C9A84C] rounded-full animate-spin" /></div>;
  }
  if (!wedding) return <div className="p-10 text-stone-500">Encargo no encontrado.</div>;

  const info = statusInfo(wedding.status);
  const portalUrl = `${window.location.origin}/portal/${wedding.portal_token}`;

  const updateStatus = async (status) => {
    await base44.entities.Wedding.update(id, { status });
    load();
  };

  const handleEditSave = async () => {
    const oldDate = wedding.event_date;
    const newDate = editForm.event_date;

    await base44.entities.Wedding.update(id, {
      couple_names: editForm.couple_names,
      client_name: editForm.client_name,
      client_email: editForm.client_email,
      phone: editForm.phone,
      event_date: newDate || undefined,
      location: editForm.location,
      package_name: editForm.package_name,
      total_price: Number(editForm.total_price || 0),
    });

    if (newDate && newDate !== oldDate) {
      try {
        const blocks = await base44.entities.CalendarBlock.filter({});
        const match = (blocks || []).find((b) => (b.title || "").includes(wedding.couple_names) || (b.title || "").includes(editForm.couple_names));
        if (match) {
          await base44.entities.CalendarBlock.update(match.id, { date: newDate });
        } else {
          await base44.entities.CalendarBlock.create({ date: newDate, type: "reservada", title: `Boda ${editForm.couple_names}` });
        }
      } catch (e) {
        console.error("Error sincronizando calendario:", e);
      }
    }

    setEditNotice("✓ Datos del encargo actualizados. Si has cambiado la fecha, precio o lugar, descarga el nuevo Contrato o Propuesta PDF.");
    setEditOpen(false);
    load();
  };

  const markContractSigned = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    await base44.entities.Wedding.update(id, { contract_signed: true, contract_signed_date: today, status: "contrato_firmado" });
    if (payments.length === 0 && wedding.total_price) {
      const t = wedding.total_price;
      const eventDate = wedding.event_date ? new Date(wedding.event_date) : null;
      await base44.entities.Payment.bulkCreate([
        { wedding_id: id, label: "Reserva 20%", amount: Math.round(t * 0.2), due_date: today },
        { wedding_id: id, label: "40% un mes antes", amount: Math.round(t * 0.4), due_date: eventDate ? format(subMonths(eventDate, 1), "yyyy-MM-dd") : undefined },
        { wedding_id: id, label: "40% a la entrega", amount: Math.round(t * 0.4), due_date: eventDate ? format(addWeeks(eventDate, 2), "yyyy-MM-dd") : undefined },
      ]);
    }
    if (wedding.event_date) {
      const blocks = await base44.entities.CalendarBlock.filter({ date: wedding.event_date });
      const existing = blocks.find((b) => (b.title || "").includes(wedding.couple_names));
      if (existing) await base44.entities.CalendarBlock.update(existing.id, { type: "reservada" });
      else await base44.entities.CalendarBlock.create({ date: wedding.event_date, type: "reservada", title: `Boda ${wedding.couple_names}` });
    }
    load();
  };

  const copyPortal = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveField = async (data) => {
    await base44.entities.Wedding.update(id, data);
    load();
  };

  const pkg = packages.find((p) => p.name === wedding.package_name);

  return (
    <div>
      <div className="px-6 md:px-10 pt-8 pb-6">
        <Link to="/pipeline" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-[#1A1A18] mb-3">
          <ArrowLeft className="w-4 h-4" /> Pipeline
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A18] tracking-tight">{wedding.couple_names}</h1>
          <Badge className={info.color + " border-0"}>{info.label}</Badge>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="ml-auto text-xs">
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar encargo
          </Button>
        </div>
        <p className="text-sm text-stone-500 mt-1">
          {wedding.event_date ? format(new Date(wedding.event_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : "Fecha por confirmar"}
          {wedding.location && ` · ${wedding.location}`}
          {wedding.package_name && ` · ${wedding.package_name}`}
          {wedding.total_price ? ` · ${fmtEUR(wedding.total_price)}` : ""}
        </p>
        {editNotice && (
          <div className="mt-3 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
            <span>{editNotice}</span>
            <button onClick={() => setEditNotice("")} className="text-emerald-600 hover:text-emerald-900 font-bold ml-2">✕</button>
          </div>
        )}
      </div>

      <div className="px-6 md:px-10 grid lg:grid-cols-3 gap-6 pb-12">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Estado y documentos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Fase actual</Label>
                <Select value={wedding.status} onValueChange={updateStatus}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WEDDING_STATUSES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => generateProposalPDF(wedding, pkg)}>
                  <FileText className="w-4 h-4 mr-2" /> Descargar propuesta PDF
                </Button>
                <Button variant="outline" onClick={() => generateContractPDF(wedding)}>
                  <FileSignature className="w-4 h-4 mr-2" /> Descargar contrato PDF
                </Button>
                {!wedding.contract_signed && (
                  <Button onClick={markContractSigned} className="bg-[#C9A84C] hover:bg-[#b8983f] text-[#1A1A18]">
                    <Check className="w-4 h-4 mr-2" /> Marcar contrato firmado
                  </Button>
                )}
              </div>
              {wedding.contract_signed && (
                <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2.5">
                  ✓ Contrato firmado el {format(new Date(wedding.contract_signed_date), "dd/MM/yyyy")}. Pagos generados automáticamente.
                </p>
              )}
              {wedding.billing_name && wedding.billing_nif && wedding.billing_address ? (
                <p className="text-xs text-stone-500 bg-stone-50 rounded-lg p-2.5">
                  Datos del cliente: {wedding.billing_name} · {wedding.billing_nif} · {wedding.billing_address}
                </p>
              ) : (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5">
                  La pareja aún no ha rellenado sus datos (nombre, DNI y dirección) en su portal. Son necesarios para los justificantes de pago.
                </p>
              )}
            </CardContent>
          </Card>

          <PaymentsCard payments={payments} wedding={wedding} extras={weddingExtras} onChanged={load} />

          <ExtrasCard wedding={wedding} extras={weddingExtras} payments={payments} onChanged={load} />

          <DeliveryGalleryCard wedding={wedding} onChanged={load} />

          <DocumentsCard weddingId={id} documents={documents} onChanged={load} />

          <GuestAreaCard wedding={wedding} onChanged={load} />

          <ArchiveCard wedding={wedding} onChanged={load} />

          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Galería y portal del cliente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Enlace a la galería privada (SVP)</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={galleryUrl} onChange={(e) => setGalleryUrl(e.target.value)} placeholder="https://..." />
                  <Button variant="outline" onClick={() => saveField({ gallery_url: galleryUrl })}>Guardar</Button>
                </div>
              </div>
              <div>
                <Label>Portal privado del cliente</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={portalUrl} readOnly className="text-xs text-stone-500" />
                  <Button variant="outline" onClick={copyPortal}>
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <a href={portalUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline"><ExternalLink className="w-4 h-4" /></Button>
                  </a>
                </div>
                <p className="text-xs text-stone-400 mt-1.5 flex items-center gap-1">
                  <Link2 className="w-3 h-3" /> Envía este enlace a la pareja: verán su estado, pagos y galería.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <MessagesCard weddingId={id} messages={messages} sender="fotografo" onChanged={load} />
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Notas privadas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="Estilo, preferencias, detalles del encargo…" />
              <Button variant="outline" size="sm" onClick={() => saveField({ notes })}>Guardar notas</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de edición de datos de la boda */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar datos del encargo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Nombre de la Pareja</Label>
              <Input value={editForm.couple_names} onChange={(e) => setEditForm({ ...editForm, couple_names: e.target.value })} placeholder="Ej: Marta & Carlos" />
            </div>
            <div>
              <Label>Fecha del evento</Label>
              <Input type="date" value={editForm.event_date} onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })} />
            </div>
            <div>
              <Label>Lugar de la boda</Label>
              <Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} placeholder="Ej: Finca El Tomillar, Madrid" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email de contacto</Label>
                <Input value={editForm.client_email} onChange={(e) => setEditForm({ ...editForm, client_email: e.target.value })} placeholder="email@ejemplo.com" />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="600000000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Paquete contratado</Label>
                <Select value={editForm.package_name} onValueChange={(val) => setEditForm({ ...editForm, package_name: val })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {packages.map((pk) => (
                      <SelectItem key={pk.id} value={pk.name}>{pk.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Precio total (€)</Label>
                <Input type="number" value={editForm.total_price} onChange={(e) => setEditForm({ ...editForm, total_price: e.target.value })} placeholder="2850" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSave} className="bg-[#C9A84C] hover:bg-[#b8983f] text-[#1A1A18]">Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}