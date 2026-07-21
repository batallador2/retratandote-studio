import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

export default function ArchiveSettingsCard() {
  const [config, setConfig] = useState(null);
  const [days, setDays] = useState(60);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.AppConfig.list().then((rows) => {
      if (rows[0]) {
        setConfig(rows[0]);
        setDays(rows[0].archive_delay_days ?? 60);
      }
    });
  }, []);

  const save = async () => {
    const value = Math.max(1, parseInt(days, 10) || 60);
    if (config) await base44.entities.AppConfig.update(config.id, { archive_delay_days: value });
    else setConfig(await base44.entities.AppConfig.create({ archive_delay_days: value }));
    setDays(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardContent className="p-5">
        <h3 className="font-medium text-[#1A1A18] mb-2">Archivado automático</h3>
        <p className="text-sm text-stone-500 mb-3">
          Las fotos de invitados se copian a Google Drive automáticamente cada pocas horas. Al cerrar una boda se programa su archivo definitivo (copia de documentos + borrado de Immich), que tú confirmas cuando llega la fecha.
        </p>
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-xs text-stone-500">Días tras el cierre para el archivo definitivo</Label>
            <Input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} className="mt-1 w-32" />
          </div>
          <Button onClick={save} variant="outline">
            {saved ? <Check className="w-4 h-4 text-emerald-600" /> : "Guardar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}