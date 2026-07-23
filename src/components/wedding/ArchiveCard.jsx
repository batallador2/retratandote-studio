import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Archive, ExternalLink, CloudUpload, HardDrive } from "lucide-react";
import { format } from "date-fns";
import ExportDeliveryModal from "@/components/wedding/ExportDeliveryModal";

export default function ArchiveCard({ wedding, onChanged }) {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);

  const eligible = ["galeria_entregada", "cerrado"].includes(wedding.status);

  const dueReached = wedding.archive_due_date && new Date(wedding.archive_due_date) <= new Date();

  const changeDueDate = async (e) => {
    await base44.entities.Wedding.update(wedding.id, { archive_due_date: e.target.value });
    onChanged();
  };

  const archive = async () => {
    if (!window.confirm("Se copiarán los documentos y las fotos (Avance, Entrega e Invitados) a Google Drive y después se BORRARÁN de Immich. ¿Confirmar archivo definitivo?")) return;
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
    <>
      <Card className={`shadow-sm ${dueReached && !wedding.archived ? "border-amber-300 bg-amber-50/40" : "border-stone-200"}`}>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Archive className="w-4 h-4" /> Archivo y Copias de Seguridad
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} className="text-xs">
            <HardDrive className="w-3.5 h-3.5 mr-1.5 text-[#C9A84C]" /> Exportar para Pendrive / Disco Duro
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {wedding.archived ? (
            <div>
              <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2.5">
                ✓ Archivada{wedding.archived_date ? ` el ${format(new Date(wedding.archived_date), "dd/MM/yyyy")}` : ""}. Fotos del reportaje, invitados y documentos están a salvo en tu Google Drive.
              </p>
              {wedding.archive_folder_url && (
                <a href={wedding.archive_folder_url} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="mt-2"><ExternalLink className="w-4 h-4 mr-2" /> Abrir carpeta en Google Drive</Button>
                </a>
              )}
            </div>
          ) : eligible ? (
            <>
              <p className="text-xs text-stone-600 bg-stone-100 rounded-lg p-2.5 flex items-center gap-2">
                <CloudUpload className="w-4 h-4 shrink-0 text-stone-400" />
                Copia en nube: Fotos de invitados y galerías del reportaje se respaldan en Google Drive.
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
                Al confirmar, se copian los documentos y las fotos de la boda (Avance, Entrega e Invitados) a tu Google Drive y se borran de Immich para liberar espacio.
              </p>
              <Button onClick={archive} disabled={running} className="bg-[#C9A84C] hover:bg-[#b8983f] text-[#1A1A18]">
                <Archive className="w-4 h-4 mr-2" />
                {running ? (remaining != null ? `Archivando… ${remaining} fotos restantes` : "Archivando…") : "Confirmar archivo definitivo"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-stone-400">
              Usa el botón de arriba para exportar las fotos y documentos a tu Pendrive USB o disco duro externo en cualquier momento. El archivo definitivo en Drive se activa al entregar la galería.
            </p>
          )}
        </CardContent>
      </Card>

      <ExportDeliveryModal wedding={wedding} open={exportOpen} onOpenChange={setExportOpen} />
    </>
  );
}