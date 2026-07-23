import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PortalSection from "@/components/portal/PortalSection";
import { Heart, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function PortalDeliveryGallery({ delivery, status, token }) {
  const [tab, setTab] = useState(null);
  const [picks, setPicks] = useState(() => new Set(delivery?.album_picks || []));
  const [selectedIndex, setSelectedIndex] = useState(null);

  if (!delivery) return null;
  const showAvance = ["adelanto_entregado", "galeria_entregada", "cerrado"].includes(status) && (delivery.avance || []).length > 0;
  const showEntrega = ["galeria_entregada", "cerrado"].includes(status) && (delivery.entrega || []).length > 0;
  if (!showAvance && !showEntrega) return null;

  const tabs = [
    ...(showAvance ? [{ key: "avance", label: "El avance" }] : []),
    ...(showEntrega ? [{ key: "entrega", label: "Reportaje completo" }] : []),
  ];
  const active = tab || tabs[0].key;
  const rawAssets = delivery[active] || [];

  // Ordenar por nombre de archivo alfanumérico
  const sortedAssets = [...rawAssets].sort((a, b) =>
    (a.filename || a.name || "").localeCompare(b.filename || b.name || "", undefined, { numeric: true, sensitivity: "base" })
  );

  const videos = sortedAssets.filter((a) => a.type === "VIDEO");
  const images = sortedAssets.filter((a) => a.type !== "VIDEO");

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") setSelectedIndex((prev) => (prev + 1) % images.length);
      if (e.key === "ArrowLeft") setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
      if (e.key === "Escape") setSelectedIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, images.length]);

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

  const currentImage = selectedIndex !== null ? images[selectedIndex] : null;

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

      <div className="columns-2 md:columns-3 gap-3 space-y-3">
        {images.map((a, idx) => (
          <div key={a.id} className="relative break-inside-avoid rounded-xl overflow-hidden cursor-pointer group" onClick={() => setSelectedIndex(idx)}>
            <img src={a.thumb} alt={a.filename || ""} loading="lazy" className="w-full hover:scale-105 transition-transform duration-300" />
            <HeartBtn id={a.id} className="absolute bottom-2 right-2" />
          </div>
        ))}
      </div>

      <p className="text-xs text-stone-600 mt-6 bg-[#C9A84C]/10 rounded-xl p-4">
        Tocad el <Heart className="w-3 h-3 inline fill-[#C9A84C] text-[#C9A84C]" /> de vuestras fotos favoritas para el álbum.
        {picks.size > 0 && <> Lleváis <strong>{picks.size}</strong> elegidas.</>}
      </p>

      {currentImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedIndex(null)}>
          {/* Botón Cerrar */}
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" onClick={() => setSelectedIndex(null)}>
            <X className="w-6 h-6" />
          </button>

          {/* Flecha Izquierda */}
          {images.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
              }}
              title="Foto anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Foto Principal */}
          <img
            src={currentImage.preview}
            alt=""
            className="max-w-full max-h-[88vh] object-contain rounded select-none"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Flecha Derecha */}
          {images.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) => (prev + 1) % images.length);
              }}
              title="Siguiente foto"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Contador y Botón Favorito en Lightbox */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs" onClick={(e) => e.stopPropagation()}>
            <span>{selectedIndex + 1} / {images.length}</span>
            <HeartBtn id={currentImage.id} className="!bg-white/20" />
          </div>
        </div>
      )}
    </PortalSection>
  );
}