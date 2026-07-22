import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { WEDDING_STATUSES, fmtEUR } from "@/lib/constants";

export default function Pipeline() {
  const [weddings, setWeddings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState("todas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Wedding.list("-created_date", 200),
      base44.entities.Payment.list("-created_date", 500),
    ]).then(([w, p]) => {
      setWeddings(w);
      setPayments(p);
      setLoading(false);
    });
  }, []);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isOverdue = (p) => {
    if (!p) return false;
    const isPaid = p.paid === true || p.paid === "true" || p.paid === 1;
    if (isPaid) return false; // SI ESTÁ PAGADO NUNCA ES VENCIDO
    if (!p.due_date) return false;
    return p.due_date < todayStr;
  };

  const overdueOf = (weddingId) => {
    return payments
      .filter((p) => p.wedding_id === weddingId && isOverdue(p))
      .reduce((s, p) => s + (p.amount || 0), 0);
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    const id = result.draggableId;
    setWeddings((prev) => prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w)));
    await base44.entities.Wedding.update(id, { status: newStatus });
  };

  if (loading) {
    return <div className="flex justify-center pt-32"><div className="w-8 h-8 border-4 border-stone-200 border-t-[#C9A84C] rounded-full animate-spin" /></div>;
  }

  return (
    <div className="h-full">
      <PageHeader title="Pipeline" subtitle="Arrastra cada encargo por las fases del flujo">
        <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
          {[
            { key: "todas", label: "Todas" },
            { key: "vencidos", label: "Pagos vencidos" },
            { key: "aldia", label: "Al día" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f.key ? "bg-[#1A1A18] text-white" : "text-stone-500 hover:text-[#1A1A18]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </PageHeader>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto px-6 md:px-10 pb-10">
          {WEDDING_STATUSES.map((col) => {
            const items = weddings
              .filter((w) => w.status === col.key)
              .filter((w) => {
                if (filter === "vencidos") return overdueOf(w.id) > 0;
                if (filter === "aldia") return overdueOf(w.id) === 0;
                return true;
              })
              .sort((a, b) => overdueOf(b.id) - overdueOf(a.id));
            return (
              <Droppable key={col.key} droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`w-64 shrink-0 rounded-xl p-3 ${snapshot.isDraggingOver ? "bg-[#C9A84C]/10" : "bg-stone-100/70"}`}
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <p className="text-xs font-semibold text-[#1A1A18] uppercase tracking-wide">{col.label}</p>
                      <span className="text-xs text-stone-400">{items.length}</span>
                    </div>
                    <div className="space-y-2 min-h-[60px]">
                      {items.map((w, i) => {
                        const overdue = overdueOf(w.id);
                        const hasPaidPayments = payments.some((p) => p.wedding_id === w.id && (p.paid === true || p.paid === "true" || p.paid === 1));
                        return (
                          <Draggable key={w.id} draggableId={w.id} index={i}>
                            {(prov, snap) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                                <Link to={`/boda/${w.id}`} className="block">
                                  <div className={`bg-white rounded-lg p-3 border shadow-sm hover:shadow-md transition-shadow ${overdue > 0 ? "border-red-400 ring-1 ring-red-200" : hasPaidPayments ? "border-emerald-200" : "border-stone-200"} ${snap.isDragging ? "rotate-2 shadow-lg" : ""}`}>
                                    {overdue > 0 ? (
                                      <p className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 rounded px-1.5 py-0.5 mb-1.5 w-fit">
                                        <AlertTriangle className="w-3 h-3" /> Pago vencido: {fmtEUR(overdue)}
                                      </p>
                                    ) : hasPaidPayments ? (
                                      <p className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5 mb-1.5 w-fit">
                                        <CheckCircle2 className="w-3 h-3" /> Pagos al día
                                      </p>
                                    ) : null}
                                    <p className="text-sm font-medium text-[#1A1A18] leading-snug">{w.couple_names}</p>
                                    <p className="text-xs text-stone-500 mt-1">
                                      {w.event_date ? format(new Date(w.event_date), "d MMM yyyy", { locale: es }) : "Sin fecha"}
                                    </p>
                                    <div className="flex justify-between items-center mt-2">
                                      <span className="text-xs text-stone-400">{w.package_name || "—"}</span>
                                      <span className="text-xs font-semibold text-[#C9A84C]">{fmtEUR(w.total_price)}</span>
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}