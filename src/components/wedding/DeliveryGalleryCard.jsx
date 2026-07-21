import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FolderHeart, Heart } from "lucide-react";
import DeliveryPhaseGrid from "@/components/wedding/DeliveryPhaseGrid";

export default function DeliveryGalleryCard({ wedding, onChanged }) {
  const [creating, setCreating] = useState(false);
  const [avance, setAvance] = useState([]);
  const [entrega, setEntrega] = useState([]);
  const [picks, setPicks] = useState([]);
  const ready = Boolean(wedding.immich_avance_album_id && wedding.immich_entrega_album_id);

  const load = useCallback(async () => {
    const [a, e, p] = await Promise.all([
      base44.functions.invoke("deliveryGallery", { action: "list", wedding_id: wedding.id, phase: "avance" }),
      base44.functions.invoke("deliveryGallery", { action: "list", wedding_id: wedding.id, phase: "entrega" }),
      base44.entities.AlbumSelection.filter({ wedding_id: wedding.id }),
    ]);
    setAvance(a.data.assets || []);
    setEntrega(e.data.assets || []);
    setPicks(p);
  }, [wedding.id]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  const setup = async () => {
    setCreating(true);
    await base44.functions.invoke("deliveryGallery", { action: "setup", wedding_id: wedding.id });
    setCreating(false);
    onChanged();
  };

  const all = [...entrega, ...avance];
  const picked = picks.map((p) => all.find((a) => a.id === p.asset_id)).filter(Boolean);

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><FolderHeart className="w-4 h-4" /> Galerías de entrega (Immich)</CardTitle>
      </CardHeader>
      <CardContent>
        {!ready ? (
          <div className="space-y-3">
            <p className="text-sm text-stone-500">
              Crea las carpetas "Avance" y "Entrega" en tu servidor Immich. Subirás las fotos (y el vídeo) desde aquí y la pareja las verá en su portal; ellos marcarán sus favoritas para el álbum.
            </p>
            <Button onClick={setup} disabled={creating} className="bg-[#C9A84C] hover:bg-[#b8983f] text-[#1A1A18]">
              {creating ? "Creando…" : "Crear galerías de entrega"}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="avance">
            <TabsList className="mb-3">
              <TabsTrigger value="avance">Avance ({avance.length})</TabsTrigger>
              <TabsTrigger value="entrega">Entrega ({entrega.length})</TabsTrigger>
              <TabsTrigger value="album">Álbum ({picks.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="avance">
              <DeliveryPhaseGrid weddingId={wedding.id} phase="avance" assets={avance} onReload={load}
                hint="Visible en el portal desde la fase «Adelanto entregado». Admite fotos y vídeo." />
            </TabsContent>
            <TabsContent value="entrega">
              <DeliveryPhaseGrid weddingId={wedding.id} phase="entrega" assets={entrega} onReload={load}
                hint="El reportaje completo. Visible desde la fase «Galería entregada»." />
            </TabsContent>
            <TabsContent value="album">
              {picked.length === 0 ? (
                <p className="text-sm text-stone-400">La pareja aún no ha marcado favoritas. En su portal pueden tocar el corazón de cada foto para elegir las del álbum.</p>
              ) : (
                <>
                  <p className="text-xs text-stone-400 mb-3">Fotos elegidas por la pareja para su álbum.</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {picked.map((a) => (
                      <div key={a.id} className="relative aspect-square rounded-lg overflow-hidden bg-stone-100">
                        <img src={a.thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                        <Heart className="absolute top-1.5 left-1.5 w-4 h-4 fill-[#C9A84C] text-[#C9A84C] drop-shadow" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}