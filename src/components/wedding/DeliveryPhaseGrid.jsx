import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Play } from "lucide-react";

const MAX_BYTES = 28_000_000;

const toBase64 = (file) =>
  new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.readAsDataURL(file);
  });

export default function DeliveryPhaseGrid({ weddingId, phase, assets, hint, onReload }) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const tooBig = files.filter((f) => f.size > MAX_BYTES);
    const ok = files.filter((f) => f.size <= MAX_BYTES);
    for (let i = 0; i < ok.length; i++) {
      setProgress(`${i + 1}/${ok.length}`);
      const data = await toBase64(ok[i]);
      await base44.functions.invoke("deliveryGallery", {
        action: "upload", wedding_id: weddingId, phase,
        filename: ok[i].name, content_type: ok[i].type, data,
      });
    }
    setProgress(null);
    e.target.value = "";
    if (tooBig.length) {
      alert(`${tooBig.length} archivo(s) superan 28MB y no se han subido. Súbelos directamente al álbum en Immich: aparecerán aquí igualmente.`);
    }
    onReload();
  };

  const remove = async (assetId) => {
    if (!confirm("¿Eliminar este archivo de la galería y de Immich?")) return;
    await base44.functions.invoke("deliveryGallery", { action: "remove", wedding_id: weddingId, phase, asset_id: assetId });
    onReload();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-stone-400">{hint}</p>
        <Button variant="outline" size="sm" disabled={!!progress} onClick={() => inputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-2" /> {progress ? `Subiendo ${progress}…` : "Subir"}
        </Button>
        <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleFiles} />
      </div>
      {assets.length === 0 ? (
        <p className="text-sm text-stone-400">Aún no hay archivos en esta carpeta.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {assets.map((a) => (
            <div key={a.id} className="relative group aspect-square rounded-lg overflow-hidden bg-stone-100">
              <img src={a.thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
              {a.type === "VIDEO" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Play className="w-6 h-6 text-white drop-shadow fill-white/80" />
                </div>
              )}
              <button
                onClick={() => remove(a.id)}
                className="absolute top-1 right-1 p-1.5 rounded bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}