import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, isSameMonth, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { BLOCK_COLORS } from "@/lib/constants";

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [weddings, setWeddings] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ date: "", type: "bloqueada", title: "" });

  const load = () => {
    Promise.all([
      base44.entities.Wedding.list("-created_date", 300),
      base44.entities.CalendarBlock.list("-created_date", 300),
    ]).then(([w, b]) => {
      setWeddings(w.filter((x) => x.event_date));
      setBlocks(b);
    });
  };
  useEffect(load, []);

  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  const addBlock = async () => {
    await base44.entities.CalendarBlock.create(form);
    setShowNew(false);
    setForm({ date: "", type: "bloqueada", title: "" });
    load();
  };

  const removeBlock = async (b) => {
    await base44.entities.CalendarBlock.delete(b.id);
    load();
  };

  return (
    <div>
      <PageHeader title="Calendario" subtitle="Bodas confirmadas, tentativas y fechas bloqueadas">
        <Button onClick={() => setShowNew(true)} className="bg-[#1A1A18] hover:bg-stone-800">
          <Plus className="w-4 h-4 mr-2" /> Bloquear fecha
        </Button>
      </PageHeader>

      <div className="px-6 md:px-10 pb-10">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft className="w-4 h-4" /></Button>
          <h2 className="text-lg font-semibold text-[#1A1A18] capitalize">{format(month, "MMMM yyyy", { locale: es })}</h2>
          <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight className="w-4 h-4" /></Button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-stone-200 rounded-xl overflow-hidden border border-stone-200">
          {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
            <div key={d} className="bg-stone-50 py-2 text-center text-xs font-semibold text-stone-500">{d}</div>
          ))}
          {days.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayWeddings = weddings.filter((w) => w.event_date === dayStr);
            const dayBlocks = blocks.filter((b) => b.date === dayStr && !dayWeddings.some((w) => (b.title || "").includes(w.couple_names)));
            return (
              <div
                key={dayStr}
                className={`bg-white min-h-[84px] p-1.5 ${!isSameMonth(day, month) ? "opacity-40" : ""} ${isSameDay(day, new Date()) ? "ring-2 ring-inset ring-[#C9A84C]" : ""}`}
              >
                <p className="text-xs text-stone-400 mb-1">{format(day, "d")}</p>
                <div className="space-y-1">
                  {dayWeddings.map((w) => (
                    <Link key={w.id} to={`/boda/${w.id}`} className="block text-[10px] leading-tight px-1.5 py-1 rounded border bg-[#C9A84C]/15 text-[#8a7233] border-[#C9A84C]/40 hover:bg-[#C9A84C]/25 truncate">
                      💍 {w.couple_names}
                    </Link>
                  ))}
                  {dayBlocks.map((b) => (
                    <button key={b.id} onClick={() => removeBlock(b)} title="Clic para eliminar" className={`block w-full text-left text-[10px] leading-tight px-1.5 py-1 rounded border truncate ${BLOCK_COLORS[b.type]}`}>
                      {b.title || b.type}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-stone-400 mt-3">Toca un bloqueo para eliminarlo. Las bodas se gestionan desde su ficha.</p>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bloquear o reservar fecha</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Fecha</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bloqueada">Bloqueada (vacaciones, personal)</SelectItem>
                  <SelectItem value="tentativa">Tentativa</SelectItem>
                  <SelectItem value="reservada">Reservada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Nota</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Vacaciones" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={addBlock} disabled={!form.date} className="bg-[#1A1A18] hover:bg-stone-800">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}