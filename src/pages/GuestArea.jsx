import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import GuestThumb from "@/components/guest/GuestThumb";
import GuestLightbox from "@/components/guest/GuestLightbox";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Heart } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { STUDIO } from "@/lib/constants";

// Comprime la foto en el navegador (máx. 2000px, JPEG 85%) antes de subirla.
async function compressToBase64(file) {
  const bitmap = await window.createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return dataUrl.split(",")[1];
}

export default function GuestArea() {
  const { token } = useParams();
  const inputRef = useRef(null);
  const [wedding, setWedding] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("guestArea", { token });
      setWedding(res.data.wedding);
      setAssets(res.data.assets);
    } catch {
      setWedding(null);
    }
    setLoading(false);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadError(null);
    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length });
      try {
        const data = await compressToBase64(files[i]);
        await base44.functions.invoke("guestArea", { token, action: "upload", filename: files[i].name, data });
      } catch {
        setUploadError("Alguna foto no se pudo subir. Inténtalo de nuevo.");
      }
    }
    setProgress(null);
    e.target.value = "";
    load();
  };

  if (loading) {
    return <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center"><div className="w-8 h-8 border-4 border-stone-200 border-t-[#C9A84C] rounded-full animate-spin" /></div>;
  }
  if (!wedding) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6 text-center">
        <div>
          <Camera className="w-8 h-8 text-[#C9A84C] mx-auto mb-4" />
          <p className="text-stone-600">Este enlace no es válido o el área de invitados no está activa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="bg-[#1A1A18] text-white">
        <div className="max-w-3xl mx-auto px-6 py-10 text-center">
          <Heart className="w-6 h-6 text-[#C9A84C] mx-auto mb-3" />
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{wedding.couple_names}</h1>
          {wedding.event_date && (
            <p className="text-stone-400 mt-2 text-sm capitalize">
              {format(new Date(wedding.event_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              {wedding.location && ` · ${wedding.location}`}
            </p>
          )}
          <p className="text-stone-300 mt-4 text-sm">📸 Comparte tus fotos de la boda y mira las de los demás invitados</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-16">
        <div className="text-center mb-6">
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={!!progress}
            size="lg"
            className="bg-[#C9A84C] hover:bg-[#b8983f] text-[#1A1A18]"
          >
            <Upload className="w-4 h-4 mr-2" />
            {progress ? `Subiendo ${progress.current} de ${progress.total}…` : "Subir mis fotos"}
          </Button>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
          {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
        </div>

        {assets.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-10">Aún no hay fotos. ¡Sé el primero en compartir!</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {assets.map((a) => (
              <GuestThumb key={a.id} assetId={a.id} token={token} onClick={() => setSelected(a.id)} />
            ))}
          </div>
        )}

        {selected && <GuestLightbox assetId={selected} token={token} onClose={() => setSelected(null)} />}

        <p className="text-center text-xs text-stone-400 pt-10">{STUDIO.name} · Fotografía de bodas</p>
      </main>
    </div>
  );
}