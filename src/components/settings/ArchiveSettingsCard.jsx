import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Check, CloudUpload, ShieldAlert } from "lucide-react";

export default function ArchiveSettingsCard() {
  const [config, setConfig] = useState(null);
  const [days, setDays] = useState(60);
  const [autoBackup, setAutoBackup] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.AppConfig.list().then((rows) => {
      if (rows[0]) {
        setConfig(rows[0]);
        setDays(rows[0].archive_delay_days ?? 60);
        setAutoBackup(Boolean(rows[0].auto_backup_drive_enabled));
      }
    });
  }, []);

  const save = async () => {
    const value = Math.max(1, parseInt(days, 10) || 60);
    const payload = { archive_delay_days: value, auto_backup_drive_enabled: autoBackup };
    if (config) await base44.entities.AppConfig.update(config.id, payload);
    else setConfig(await base44.entities.AppConfig.create(payload));
    setDays(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardContent className="p-5 space-y-6">
        <div>
          <h3 className="font-medium text-[#1A1A18] mb-1">Archivado y Respaldos en Google Drive</h3>
          <p className="text-sm text-stone-500">
            Configura el plazo de archivo definitivo y la sincronización automática de fotos del reportaje, invitados y documentos.
          </p>
        </div>

        {/* Interruptor de Sincronización Nocturna Automática */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-stone-50 border border-stone-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CloudUpload className="w-4 h-4 text-[#C9A84C]" />
              <Label htmlFor="auto-backup-switch" className="font-semibold text-sm text-[#1A1A18] cursor-pointer">
                Sincronización nocturna automática a Google Drive
              </Label>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Copia cada noche (03:00 am) todas las fotos (Avance, Entrega e Invitados) y documentos PDF a tu Google Drive sin necesidad de confirmación manual.
            </p>
            {!autoBackup && (
              <p className="text-[11px] font-medium text-amber-700 bg-amber-50 rounded px-2 py-1 w-fit mt-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 shrink-0" /> Deshabilitado: Tus datos de prueba no se enviarán a Google Drive.
              </p>
            )}
          </div>
          <Switch id="auto-backup-switch" checked={autoBackup} onCheckedChange={setAutoBackup} />
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-stone-100">
          <div>
            <Label className="text-xs text-stone-500">Días tras el cierre para el archivo definitivo</Label>
            <Input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} className="mt-1 w-32 bg-white" />
          </div>
          <Button onClick={save} className="bg-[#1A1A18] hover:bg-stone-800 text-white">
            {saved ? <Check className="w-4 h-4 text-emerald-400" /> : "Guardar ajustes de respaldo"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}