import { useState } from "react";
import { X } from "lucide-react";
import PortalSection from "@/components/portal/PortalSection";

export default function PortalGallery({ photos }) {
  const [selected, setSelected] = useState(null);
  if (!photos?.length) return null;

  return (
    <PortalSection overline={`${photos.length} fotos`} title="Vuestra galería">
      <div className="columns-2 md:columns-3 gap-3 [&>button]:mb-3">
        {photos.map((p) => (
          <button key={p.id} onClick={() => setSelected(p)} className="block w-full rounded-xl overflow-hidden bg-stone-100">
            <img src={p.url} alt={p.caption || ""} className="w-full hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
          </button>
        ))}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white"><X className="w-7 h-7" /></button>
          <img src={selected.url} alt={selected.caption || ""} className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </PortalSection>
  );
}