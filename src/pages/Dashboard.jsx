import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox, Euro, Heart, CalendarDays, Bell, ArrowRight } from "lucide-react";
import { format, differenceInDays, addYears, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { fmtEUR, statusInfo, LEAD_STATUS_COLORS } from "@/lib/constants";

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [weddings, setWeddings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list("-created_date", 50),
      base44.entities.Wedding.list("-created_date", 100),
      base44.entities.Payment.list("-created_date", 200),
    ]).then(([l, w, p]) => {
      setLeads(l);
      setWeddings(w);
      setPayments(p);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex justify-center pt-32"><div className="w-8 h-8 border-4 border-stone-200 border-t-[#C9A84C] rounded-full animate-spin" /></div>;
  }

  const today = new Date();
  const newLeads = leads.filter((l) => l.status === "nuevo");
  const activeWeddings = weddings.filter((w) => w.status !== "cerrado");
  const duePayments = payments.filter((p) => {
    if (p.paid || !p.due_date) return false;
    const d = differenceInDays(new Date(p.due_date), today);
    return d <= 7;
  });
  const pendingTotal = payments.filter((p) => !p.paid).reduce((s, p) => s + (p.amount || 0), 0);
  const anniversaries = weddings.filter((w) => {
    if (w.anniversary_contacted || !w.event_date || w.status !== "cerrado") return false;
    const anniv = addYears(new Date(w.event_date), 1);
    const d = differenceInDays(anniv, today);
    return d >= -7 && d <= 30;
  });
  const pendingArchives = weddings.filter(
    (w) => !w.archived && w.archive_due_date && !isAfter(new Date(w.archive_due_date), today)
  );
  const upcoming = weddings
    .filter((w) => w.event_date && isAfter(new Date(w.event_date), today) && w.status !== "cerrado")
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 4);

  const stats = [
    { label: "Solicitudes nuevas", value: newLeads.length, icon: Inbox, to: "/leads" },
    { label: "Encargos activos", value: activeWeddings.length, icon: Heart, to: "/pipeline" },
    { label: "Pendiente de cobro", value: fmtEUR(pendingTotal), icon: Euro, to: "/estadisticas" },
    { label: "Próximas bodas", value: upcoming.length, icon: CalendarDays, to: "/calendario" },
  ];

  const alerts = [
    ...newLeads.map((l) => ({ key: "l" + l.id, text: `Nueva solicitud de ${l.name}`, to: "/leads" })),
    ...duePayments.map((p) => {
      const w = weddings.find((x) => x.id === p.wedding_id);
      return { key: "p" + p.id, text: `Pago próximo: ${p.label} de ${w?.couple_names || "—"} (${fmtEUR(p.amount)})`, to: w ? `/boda/${w.id}` : "/pipeline" };
    }),
    ...anniversaries.map((w) => ({ key: "a" + w.id, text: `Aniversario de ${w.couple_names} — ¡ofrece una sesión de aniversario!`, to: `/boda/${w.id}` })),
    ...pendingArchives.map((w) => ({ key: "arch" + w.id, text: `Archivo definitivo de ${w.couple_names} pendiente de confirmar`, to: `/boda/${w.id}` })),
  ];

  return (
    <div>
      <PageHeader title={`Hola, Juanjo`} subtitle={format(today, "EEEE, d 'de' MMMM", { locale: es })} />
      <div className="px-6 md:px-10 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Link key={s.label} to={s.to}>
              <Card className="border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <s.icon className="w-5 h-5 text-[#C9A84C] mb-3" />
                  <p className="text-2xl font-semibold text-[#1A1A18]">{s.value}</p>
                  <p className="text-xs text-stone-500 mt-1">{s.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {alerts.length > 0 && (
          <Card className="border-[#C9A84C]/40 bg-[#C9A84C]/5 shadow-sm">
            <CardContent className="p-5 space-y-2">
              <p className="flex items-center gap-2 font-medium text-[#1A1A18] text-sm mb-3">
                <Bell className="w-4 h-4 text-[#C9A84C]" /> Requiere tu atención
              </p>
              {alerts.slice(0, 6).map((a) => (
                <Link key={a.key} to={a.to} className="flex items-center justify-between text-sm text-stone-700 hover:text-[#1A1A18] py-1.5 border-b border-stone-100 last:border-0">
                  {a.text} <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 pb-10">
          <Card className="border-stone-200 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-medium text-[#1A1A18] mb-4">Próximas bodas</h3>
              {upcoming.length === 0 && <p className="text-sm text-stone-400">Sin bodas próximas confirmadas.</p>}
              <div className="space-y-3">
                {upcoming.map((w) => (
                  <Link key={w.id} to={`/boda/${w.id}`} className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-[#1A1A18]">{w.couple_names}</p>
                      <p className="text-xs text-stone-500">{format(new Date(w.event_date), "d MMM yyyy", { locale: es })} · {w.location || "—"}</p>
                    </div>
                    <Badge className={statusInfo(w.status).color + " border-0"}>{statusInfo(w.status).label}</Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-medium text-[#1A1A18] mb-4">Últimas solicitudes</h3>
              {leads.length === 0 && <p className="text-sm text-stone-400">Aún no hay solicitudes.</p>}
              <div className="space-y-3">
                {leads.slice(0, 5).map((l) => (
                  <Link key={l.id} to="/leads" className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-[#1A1A18]">{l.name}</p>
                      <p className="text-xs text-stone-500">{l.event_date ? format(new Date(l.event_date), "d MMM yyyy", { locale: es }) : "Fecha por definir"} · {l.location || "—"}</p>
                    </div>
                    <Badge className={(LEAD_STATUS_COLORS[l.status] || "") + " border-0 capitalize"}>{l.status}</Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}