import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, MapPin, ExternalLink, ArrowRight, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { statusInfo, fmtEUR } from "@/lib/constants";

export default function Weddings() {
  const [weddings, setWeddings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("proximas");
  const [search, setSearch] = useState("");

  const load = () => {
    Promise.all([
      base44.entities.Wedding.list("-created_date", 300),
      base44.entities.Payment.list("-created_date", 500),
    ]).then(([w, p]) => {
      setWeddings(w || []);
      setPayments(p || []);
      setLoading(false);
    });
  };

  useEffect(load, []);

  if (loading) {
    return (
      <div className="flex justify-center pt-32">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-[#C9A84C] rounded-full animate-spin" />
      </div>
    );
  }

  // Filtrado
  const filtered = weddings
    .filter((w) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        (w.couple_names || "").toLowerCase().includes(q) ||
        (w.client_name || "").toLowerCase().includes(q) ||
        (w.location || "").toLowerCase().includes(q) ||
        (w.client_email || w.email || "").toLowerCase().includes(q) ||
        (w.package_name || "").toLowerCase().includes(q)
      );
    })
    .filter((w) => {
      if (filter === "proximas") return !w.archived && w.status !== "cerrado";
      if (filter === "realizadas") return ["fotografiada", "en_edicion", "adelanto_entregado", "galeria_entregada", "cerrado"].includes(w.status);
      if (filter === "archivadas") return w.archived;
      return true; // todas
    })
    .sort((a, b) => {
      if (!a.event_date) return 1;
      if (!b.event_date) return -1;
      return new Date(a.event_date) - new Date(b.event_date);
    });

  return (
    <div>
      <PageHeader title="Bodas" subtitle="Histórico y agenda de todos vuestros encargos de boda">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por pareja, lugar o email…"
              className="pl-9 bg-white"
            />
          </div>
          <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
            {[
              { key: "proximas", label: "Próximas / Pendientes" },
              { key: "realizadas", label: "Realizadas / Entregadas" },
              { key: "todas", label: "Todas" },
              { key: "archivadas", label: "Archivadas" },
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
        </div>
      </PageHeader>

      <div className="px-6 md:px-10 space-y-4 pb-12">
        {filtered.length === 0 ? (
          <Card className="border-stone-200">
            <CardContent className="p-10 text-center text-stone-400">
              No hay bodas que coincidan con la búsqueda o el filtro seleccionado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((w) => {
              const info = statusInfo(w.status);
              const weddingPayments = payments.filter((p) => p.wedding_id === w.id);
              const paidAmount = weddingPayments.filter((p) => p.paid).reduce((s, p) => s + (p.amount || 0), 0);
              const totalAmount = w.total_price || weddingPayments.reduce((s, p) => s + (p.amount || 0), 0) || 0;
              const percentPaid = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;
              const portalUrl = `${window.location.origin}/portal/${w.portal_token}`;

              return (
                <Card key={w.id} className="border-stone-200 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
                  <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Cabecera Tarjeta */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg text-[#1A1A18] leading-snug">{w.couple_names || w.client_name}</h3>
                          {w.package_name && <p className="text-xs text-stone-500 mt-0.5">{w.package_name}</p>}
                        </div>
                        <Badge className={(info.color || "") + " border-0 shrink-0 text-xs"}>{info.label}</Badge>
                      </div>

                      {/* Detalles */}
                      <div className="space-y-1.5 mt-3 text-xs text-stone-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#C9A84C] shrink-0" />
                          <span className="font-medium text-stone-800">
                            {w.event_date ? format(new Date(w.event_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : "Fecha por confirmar"}
                          </span>
                        </div>
                        {w.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>{w.location}</span>
                          </div>
                        )}
                        {(w.client_email || w.email || w.phone) && (
                          <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-stone-500">
                            {(w.client_email || w.email) && (
                              <a href={`mailto:${w.client_email || w.email}`} className="flex items-center gap-1 hover:text-[#C9A84C]">
                                <Mail className="w-3 h-3" /> {w.client_email || w.email}
                              </a>
                            )}
                            {w.phone && (
                              <a href={`https://wa.me/${w.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#C9A84C]">
                                <Phone className="w-3 h-3" /> {w.phone}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Barra de progreso de Pago */}
                    <div className="bg-stone-50 rounded-lg p-3 border border-stone-100 space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-stone-500">Pagos abonados</span>
                        <span className="text-[#1A1A18]">
                          {fmtEUR(paidAmount)} / {fmtEUR(totalAmount)} ({percentPaid}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-[#C9A84C] h-2 rounded-full transition-all duration-500" style={{ width: `${percentPaid}%` }} />
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                      <Link to={`/boda/${w.id}`} className="flex-1">
                        <Button size="sm" className="w-full bg-[#1A1A18] hover:bg-stone-800 text-white text-xs">
                          Ficha de la boda <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                      </Link>
                      <a href={portalUrl} target="_blank" rel="noreferrer" title="Abrir portal del cliente">
                        <Button size="sm" variant="outline" className="text-xs">
                          Portal <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
