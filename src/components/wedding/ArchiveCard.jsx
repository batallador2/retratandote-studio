import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Archive, ExternalLink, CloudUpload } from "lucide-react";
import { format } from "date-fns";

export default function ArchiveCard({ wedding, onChanged }) {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(null);

  const eligible = ["galeria_entregada", "cerrado"].includes(wedding.status);
  if (!wedding.archived && !eligible) return null;

  const dueReached = wedding.archive_due_date && new Date(wedding.archive_due_date) <= new Date();

  const changeDueDate = async (e) => {
    await base44.entities.Wedding.update(wedding.id, { archive_due_date: e.target.value });
    onChanged();
  };

  const archive = async () => {
    if (!window.confirm("Se copiarán los documentos a Google Drive, se verificará la copia de las fotos de invitados y después se BORRARÁN de Immich. ¿Confirmar archivo definitivo?")) return;
    setRunning(true);
    let done = false;
    while (!done) {
      const res = await base44.functions.invoke("archiveWedding", { wedding_id: wedding.id });
      done = res.data.done;
      setRemaining(res.data.remaining);
    }
    setRunning(false);
    onChanged();
  };

  return (
    <Card className={`shadow-sm ${dueReached && !wedding.archived ? "border-amber-300 bg-amber-50/40" : "border-stone-200"}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Archive className="w-4 h-4" /> Archivo en Google Drive</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {wedding.archived ? (
          <div>
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2.5">
              ✓ Archivada{wedding.archived_date ? ` el ${format(new Date(wedding.archived_date), "dd/MM/yyyy")}` : ""}. Fotos y documentos están en tu Drive.
            </p>
            {wedding.archive_folder_url && (
              <a href={wedding.archive_folder_url} target="_blank" rel="noreferrer">
                <Button variant="outline" className="mt-2"><ExternalLink className="w-4 h-4 mr-2" /> Abrir carpeta en Drive</Button>
              </a>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-stone-600 bg-stone-100 rounded-lg p-2.5 flex items-center gap-2">
              <CloudUpload className="w-4 h-4 shrink-0 text-stone-400" />
              Copia de seguridad: {wedding.backup_count || 0} fotos de invitados en Drive
              {wedding.last_backup_date ? ` · última copia ${format(new Date(wedding.last_backup_date), "dd/MM/yyyy")}` : " (se hace automáticamente cada pocas horas)"}
            </p>
            <div>
              <Label className="text-xs text-stone-500">Fecha de archivo definitivo</Label>
              <Input type="date" value={wedding.archive_due_date || ""} onChange={changeDueDate} className="mt-1 w-44" />
            </div>
            {dueReached && (
              <p className="text-xs text-amber-800 bg-amber-100 rounded-lg p-2.5">
                Plazo cumplido: el archivo definitivo está pendiente de tu confirmación.
              </p>
            )}
            <p className="text-sm text-stone-500">
              Al confirmar, se copian los documentos de la boda a Drive, se verifica que todas las fotos de invitados tienen copia y se borran de Immich para liberar espacio.
            </p>
            <Button onClick={archive} disabled={running} className="bg-[#C9A84C] hover:bg-[#b8983f] text-[#1A1A18]">
              <Archive className="w-4 h-4 mr-2" />
              {running ? (remaining != null ? `Archivando… ${remaining} fotos restantes` : "Archivando…") : "Confirmar archivo definitivo"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}