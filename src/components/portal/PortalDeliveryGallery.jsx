import { useState } from "react";
import { base44 } from "@/api/base44Client";
import PortalSection from "@/components/portal/PortalSection";
import { Heart, X } from "lucide-react";

export default function PortalDeliveryGallery({ delivery, status, token }) {
  const [tab, setTab] = useState(null);
  const [picks, setPicks] = useState(() => new Set(delivery?.album_picks || []));
  const [lightbox, setLightbox] = useState(null);

  if (!delivery) return null;
  const showAvance = ["adelanto_entregado", "galeria_entregada", "cerrado"].includes(status) && (delivery.avance || []).length > 0;
  const showEntrega = ["galeria_entregada", "cerrado"].includes(status) && (delivery.entrega || []).length > 0;
  if (!showAvance && !showEntrega) return null;

  const tabs = [
    ...(showAvance ? [{ key: "avance", label: "El avance" }] : []),
    ...(showEntrega ? [{ key: "entrega", label: "Reportaje completo" }] : []),
  ];
  const active = tab || tabs[0].key;
  const assets = delivery[active] || [];
  const videos = assets.filter((a) => a.type === "VIDEO");
  const images = assets.filter((a) => a.type !== "VIDEO");

  const toggle = (assetId) => {
    setPicks((prev) => {
      const next = new Set(prev);
      next.has(assetId) ? next.delete(assetId) : next.add(assetId);
      return next;
    });
    base44.functions.invoke("clientPortal", { token, action: "toggleAlbumPick", content: assetId });
  };

  const HeartBtn = ({ id, className }) => (
    <button
      onClick={(e) => { e.stopPropagation(); toggle(id); }}
      className={`p-2 rounded-full bg-black/35 backdrop-blur-sm ${className || ""}`}
      title="Elegir para el álbum"
    >
      <Heart className={`w-4 h-4 ${picks.has(id) ? "fill-[#C9A84C] text-[#C9A84C]" : "text-white"}`} />
    </button>
  );

  return (
    <PortalSection overline="Vuestras fotos" title="La galería">
      {tabs.length > 1 && (
        <div className="flex gap-6 mb-6 border-b border-[#C9A84C]/25">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-2 text-sm tracking-wide -mb-px border-b-2 transition-colors ${active === t.key ? "border-[#C9A84C] text-[#1A1A18] font-medium" : "border-transparent text-stone-400"}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {videos.map((v) => (
        <video key={v.id} controls playsInline poster={v.preview} src={v.video} className="w-full rounded-2xl mb-5 bg-black" />
      ))}

      <div className="columns-2 gap-3 space-y-3">
        {images.map((a) => (
          <div key={a.id} className="relative break-inside-avoid rounded-xl overflow-hidden cursor-pointer group" onClick={() => setLightbox(a)}>
            <img src={a.thumb} alt="" loading="lazy" className="w-full" />
            <HeartBtn id={a.id} className="absolute bottom-2 right-2" />
          </div>
        ))}
      </div>

      <p className="text-xs text-stone-600 mt-6 bg-[#C9A84C]/10 rounded-xl p-4">
        Tocad el <Heart className="w-3 h-3 inline fill-[#C9A84C] text-[#C9A84C]" /> de vuestras fotos favoritas para el álbum.
        {picks.size > 0 && <> Lleváis <strong>{picks.size}</strong> elegidas.</>}
      </p>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox.preview} alt="" className="max-w-full max-h-[88vh] object-contain rounded" />
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white" onClick={() => setLightbox(null)}>
            <X className="w-5 h-5" />
          </button>
          <HeartBtn id={lightbox.id} className="absolute bottom-6 right-6 !bg-white/15" />
        </div>
      )}
    </PortalSection>
  );
}