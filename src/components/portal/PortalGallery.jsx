import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import PortalSection from "@/components/portal/PortalSection";

export default function PortalGallery({ photos }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  if (!photos?.length) return null;

  const sortedPhotos = [...photos].sort((a, b) =>
    (a.filename || a.caption || "").localeCompare(b.filename || b.caption || "", undefined, { numeric: true, sensitivity: "base" })
  );

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") setSelectedIndex((prev) => (prev + 1) % sortedPhotos.length);
      if (e.key === "ArrowLeft") setSelectedIndex((prev) => (prev - 1 + sortedPhotos.length) % sortedPhotos.length);
      if (e.key === "Escape") setSelectedIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, sortedPhotos.length]);

  const currentPhoto = selectedIndex !== null ? sortedPhotos[selectedIndex] : null;

  return (
    <PortalSection overline={`${sortedPhotos.length} fotos`} title="Vuestra galería">
      <div className="columns-2 md:columns-3 gap-3 [&>button]:mb-3">
        {sortedPhotos.map((p, idx) => (
          <button key={p.id || idx} onClick={() => setSelectedIndex(idx)} className="block w-full rounded-xl overflow-hidden bg-stone-100 text-left">
            <img src={p.url} alt={p.caption || ""} className="w-full hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
          </button>
        ))}
      </div>
      {currentPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedIndex(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10" onClick={() => setSelectedIndex(null)}>
            <X className="w-6 h-6" />
          </button>

          {sortedPhotos.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) => (prev - 1 + sortedPhotos.length) % sortedPhotos.length);
              }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <img src={currentPhoto.url} alt={currentPhoto.caption || ""} className="max-h-[88vh] max-w-full rounded-lg object-contain select-none" onClick={(e) => e.stopPropagation()} />

          {sortedPhotos.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) => (prev + 1) % sortedPhotos.length);
              }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs">
            {selectedIndex + 1} / {sortedPhotos.length}
          </div>
        </div>
      )}
    </PortalSection>
  );
}