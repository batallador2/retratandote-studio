import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import MessagesCard from "@/components/wedding/MessagesCard";
import PortalGallery from "@/components/portal/PortalGallery";
import PortalDeliveryGallery from "@/components/portal/PortalDeliveryGallery";
import PortalDocuments from "@/components/portal/PortalDocuments";
import PortalBillingForm from "@/components/portal/PortalBillingForm";
import PortalContractSignature from "@/components/portal/PortalContractSignature";
import PortalSection from "@/components/portal/PortalSection";
import PortalHelpDialog from "@/components/portal/PortalHelpDialog";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { WEDDING_STATUSES, statusInfo, fmtEUR, STUDIO } from "@/lib/constants";

const FALLBACK_HERO = "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80";

export default function ClientPortal() {
  const { token } = useParams();
  const [wedding, setWedding] = useState(null);
  const [payments, setPayments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [extras, setExtras] = useState([]);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("clientPortal", { token });
      setWedding(res.data.wedding);
      setPayments(res.data.payments);
      setMessages(res.data.messages);
      setPhotos(res.data.photos || []);
      setDocuments(res.data.documents || []);
      setExtras(res.data.extras || []);
      setDelivery(res.data.delivery || null);
    } catch {
      setWedding(null);
    }
    setLoading(false);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const sendMessage = useCallback(async (content) => {
    const res = await base44.functions.invoke("clientPortal", { token, action: "sendMessage", content });
    setMessages(res.data.messages);
  }, [token]);

  if (loading) {
    return <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center"><div className="w-8 h-8 border-4 border-stone-200 border-t-[#C9A84C] rounded-full animate-spin" /></div>;
  }
  if (!wedding) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-center">
        <div>
          <Camera className="w-8 h-8 text-[#C9A84C] mx-auto mb-4" />
          <p className="text-stone-600">Este enlace no es válido. Escribe a {STUDIO.email} si crees que es un error.</p>
        </div>
      </div>
    );
  }

  const info = statusInfo(wedding.status);
  const currentIdx = WEDDING_STATUSES.findIndex((s) => s.key === wedding.status);
  const nextPayment = payments.find((p) => !p.paid);
  const paidTotal = payments.filter((p) => p.paid).reduce((s, p) => s + (p.amount || 0), 0);
  const heroUrl = photos.find((p) => p.is_cover)?.url || photos[0]?.url
    || delivery?.avance?.find((a) => a.type !== "VIDEO")?.preview
    || delivery?.entrega?.find((a) => a.type !== "VIDEO")?.preview
    || FALLBACK_HERO;
  const steps = WEDDING_STATUSES.filter((s) => s.key !== "cerrado");

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <PortalHelpDialog />
      {/* Hero editorial */}
      <header className="relative h-[68vh] min-h-[440px] flex flex-col">
        <img src={heroUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14120F] via-[#14120F]/35 to-[#14120F]/25" />
        <div className="relative z-10 pt-8 text-center">
          <span className="inline-flex items-center gap-2 text-white/90 text-sm tracking-[0.25em] uppercase">
            <Camera className="w-4 h-4 text-[#C9A84C]" /> {STUDIO.name}
          </span>
        </div>
        <div className="relative z-10 mt-auto pb-14 px-6 text-center text-white">
          <p className="text-[11px] tracking-[0.35em] uppercase text-[#C9A84C] mb-4">Vuestro portal privado</p>
          <h1 className="font-display text-5xl md:text-7xl font-medium italic leading-tight">{wedding.couple_names}</h1>
          {wedding.event_date && (
            <p className="mt-4 text-sm md:text-base text-white/80 capitalize tracking-wide">
              {format(new Date(wedding.event_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              {wedding.location && ` · ${wedding.location}`}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-8 pb-20">
        {/* Estado */}
        <PortalSection overline="Seguimiento" title="El estado de vuestro reportaje">
          <p className="text-stone-500 -mt-4 mb-8">{info.clientLabel}</p>
          <div className="relative">
            {steps.map((s, i) => {
              const done = i < currentIdx || wedding.status === "cerrado";
              const current = s.key === wedding.status;
              const last = i === steps.length - 1;
              return (
                <div key={s.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {done ? (
                      <CheckCircle2 className="w-6 h-6 text-[#C9A84C] shrink-0" />
                    ) : (
                      <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center ${current ? "border-[#C9A84C]" : "border-stone-200"}`}>
                        {current && <div className="w-2.5 h-2.5 rounded-full bg-[#C9A84C]" />}
                      </div>
                    )}
                    {!last && <div className={`w-px flex-1 my-1 ${done ? "bg-[#C9A84C]/50" : "bg-stone-200"}`} />}
                  </div>
                  <div className={last ? "pb-0" : "pb-7"}>
                    <p className={`text-sm leading-6 ${current ? "font-semibold text-[#1A1A18]" : done ? "text-stone-600" : "text-stone-300"}`}>
                      {s.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </PortalSection>

        {!(wedding.billing_name && wedding.billing_nif && wedding.billing_address) && wedding.status !== "cerrado" && (
          <PortalBillingForm token={token} onSaved={load} />
        )}

        <PortalContractSignature wedding={wedding} token={token} onSigned={load} />

        {(wedding.package_name || wedding.total_price) && (
          <PortalSection overline="Vuestro paquete" title={wedding.package_name || "Personalizado"}>
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-stone-500">Precio total del reportaje</p>
              <p className="font-display text-3xl text-[#1A1A18]">{fmtEUR(wedding.total_price)}</p>
            </div>
            {wedding.extras && <p className="text-sm text-stone-500 mt-3">Extras: {wedding.extras}</p>}
            {extras.length > 0 && (
              <div className="mt-5 pt-5 border-t border-[#C9A84C]/25 space-y-2">
                {extras.map((x) => (
                  <div key={x.id} className="flex items-start justify-between text-sm gap-3">
                    <div className="min-w-0">
                      <span className="text-stone-500">+ {x.concept}</span>
                      {x.description && <p className="text-xs text-stone-400">{x.description}</p>}
                    </div>
                    <span className="text-stone-700 shrink-0">{fmtEUR(x.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </PortalSection>
        )}

        {payments.length > 0 && (
          <PortalSection overline="Honorarios" title="Vuestros pagos">
            <div className="space-y-5">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center gap-4">
                  {p.paid ? (
                    <CheckCircle2 className="w-5 h-5 text-[#C9A84C] shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-stone-200 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm ${p.paid ? "text-stone-500" : "font-medium text-[#1A1A18]"}`}>{p.label}</p>
                    <p className="text-xs text-stone-400">
                      {p.paid ? "Pagado" : p.due_date ? `Vence el ${format(new Date(p.due_date), "d MMM yyyy", { locale: es })}` : "Pendiente"}
                    </p>
                  </div>
                  <span className="font-display text-xl text-[#1A1A18]">{fmtEUR(p.amount)}</span>
                </div>
              ))}
            </div>
            {nextPayment && (
              <p className="text-xs text-stone-600 mt-6 bg-[#C9A84C]/10 rounded-xl p-4">
                Próximo pago: <strong>{nextPayment.label}</strong> ({fmtEUR(nextPayment.amount)}). Ya habéis abonado {fmtEUR(paidTotal)}.
              </p>
            )}
          </PortalSection>
        )}

        <PortalDeliveryGallery delivery={delivery} status={wedding.status} token={token} />

        {photos.length > 0 && ["galeria_entregada", "cerrado", "adelanto_entregado"].includes(wedding.status) && <PortalGallery photos={photos} />}

        <PortalDocuments documents={documents} token={token} />

        {wedding.gallery_url && ["galeria_entregada", "cerrado", "adelanto_entregado"].includes(wedding.status) && (
          <section className="bg-[#14120F] rounded-3xl p-10 text-center">
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#C9A84C] mb-3">Ya está aquí</p>
            <h2 className="font-display text-3xl text-white italic mb-3">Vuestra galería está lista</h2>
            <p className="text-stone-400 text-sm mb-6">Fotos en alta resolución, listas para descargar y compartir.</p>
            <a href={wedding.gallery_url} target="_blank" rel="noreferrer">
              <Button className="bg-[#C9A84C] hover:bg-[#b8983f] text-[#1A1A18] px-8">
                <ExternalLink className="w-4 h-4 mr-2" /> Ver mi galería
              </Button>
            </a>
          </section>
        )}

        <MessagesCard weddingId={wedding.id} messages={messages} sender="cliente" onChanged={() => {}} onSend={sendMessage} />

        <div className="text-center pt-6">
          <p className="font-display text-2xl italic text-[#1A1A18]">{STUDIO.name}</p>
          <p className="text-xs text-stone-400 mt-2 tracking-wide">
            {STUDIO.owner} · {STUDIO.email} · {STUDIO.phone}
          </p>
        </div>
      </main>
    </div>
  );
}