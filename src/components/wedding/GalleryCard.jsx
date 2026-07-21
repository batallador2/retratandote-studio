import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Images, Upload, Trash2, Star } from "lucide-react";

export default function GalleryCard({ weddingId, photos, onChanged }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push({ wedding_id: weddingId, url: file_url, order: photos.length + uploaded.length });
    }
    await base44.entities.GalleryPhoto.bulkCreate(uploaded);
    setUploading(false);
    e.target.value = "";
    onChanged();
  };

  const remove = async (id) => {
    await base44.entities.GalleryPhoto.delete(id);
    onChanged();
  };

  const setCover = async (id) => {
    const current = photos.find((p) => p.is_cover);
    if (current && current.id !== id) await base44.entities.GalleryPhoto.update(current.id, { is_cover: false });
    await base44.entities.GalleryPhoto.update(id, { is_cover: true });
    onChanged();
  };

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2"><Images className="w-4 h-4" /> Galería de entrega ({photos.length})</CardTitle>
        <Button variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-2" /> {uploading ? "Subiendo…" : "Subir fotos"}
        </Button>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <p className="text-sm text-stone-400">Sube aquí las fotos finales que la pareja verá en su portal.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative group aspect-square rounded-lg overflow-hidden bg-stone-100">
                <img src={p.url} alt={p.caption || ""} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button onClick={() => setCover(p.id)} title="Portada" className="p-1.5 rounded bg-white/90 hover:bg-white">
                    <Star className={`w-3.5 h-3.5 ${p.is_cover ? "fill-[#C9A84C] text-[#C9A84C]" : "text-stone-600"}`} />
                  </button>
                  <button onClick={() => remove(p.id)} title="Eliminar" className="p-1.5 rounded bg-white/90 hover:bg-white">
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  </button>
                </div>
                {p.is_cover && <Star className="absolute top-1.5 left-1.5 w-4 h-4 fill-[#C9A84C] text-[#C9A84C] drop-shadow" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}