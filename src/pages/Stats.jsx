import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { fmtEUR } from "@/lib/constants";

const GOLD = "#C9A84C";
const DARK = "#1A1A18";
const COLORS = [GOLD, DARK, "#8a7233", "#d6c28a", "#a89563"];

export default function Stats() {
  const [leads, setLeads] = useState([]);
  const [weddings, setWeddings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list("-created_date", 300),
      base44.entities.Wedding.list("-created_date", 300),
      base44.entities.Payment.list("-created_date", 500),
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

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), 11 - i);
    return { key: format(d, "yyyy-MM"), label: format(d, "MMM", { locale: es }) };
  });
  const incomeByMonth = months.map((m) => ({
    mes: m.label,
    ingresos: payments
      .filter((p) => p.paid && p.paid_date && p.paid_date.startsWith(m.key))
      .reduce((s, p) => s + (p.amount || 0), 0),
  }));

  const pkgCount = {};
  weddings.forEach((w) => {
    if (w.package_name) pkgCount[w.package_name] = (pkgCount[w.package_name] || 0) + 1;
  });
  const pkgData = Object.entries(pkgCount).map(([name, value]) => ({ name, value }));

  const converted = leads.filter((l) => l.status === "convertido").length;
  const conversion = leads.length ? Math.round((converted / leads.length) * 100) : 0;
  const collected = payments.filter((p) => p.paid).reduce((s, p) => s + (p.amount || 0), 0);
  const pending = payments.filter((p) => !p.paid).reduce((s, p) => s + (p.amount || 0), 0);
  const forecast = weddings
    .filter((w) => w.status !== "cerrado" && w.contract_signed)
    .reduce((s, w) => s + (w.total_price || 0), 0);

  const kpis = [
    { label: "Ingresos cobrados", value: fmtEUR(collected) },
    { label: "Pendiente de cobro", value: fmtEUR(pending) },
    { label: "Previsión (bodas firmadas)", value: fmtEUR(forecast) },
    { label: "Conversión de leads", value: `${conversion}% (${converted}/${leads.length})` },
  ];

  return (
    <div>
      <PageHeader title="Estadísticas" subtitle="La salud del negocio de un vistazo" />
      <div className="px-6 md:px-10 space-y-6 pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <Card key={k.label} className="border-stone-200 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xl font-semibold text-[#1A1A18]">{k.value}</p>
                <p className="text-xs text-stone-500 mt-1">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-stone-200 shadow-sm">
            <CardHeader><CardTitle className="text-base">Ingresos por mes (últimos 12 meses)</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeByMonth}>
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => fmtEUR(v)} />
                  <Bar dataKey="ingresos" fill={GOLD} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-stone-200 shadow-sm">
            <CardHeader><CardTitle className="text-base">Paquetes contratados</CardTitle></CardHeader>
            <CardContent className="h-72">
              {pkgData.length === 0 ? (
                <p className="text-sm text-stone-400 pt-10 text-center">Aún no hay encargos con paquete.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pkgData} dataKey="value" nameKey="name" outerRadius={90} label>
                      {pkgData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}