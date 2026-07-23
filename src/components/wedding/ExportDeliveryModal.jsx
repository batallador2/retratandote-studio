import { useState } from "react";
import JSZip from "jszip";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, PackageCheck, FolderArchive, HardDrive, CheckCircle2 } from "lucide-react";

export default function ExportDeliveryModal({ wedding, open, onOpenChange }) {
  const [options, setOptions] = useState({
    avance: true,
    entrega: true,
    guest: true,
    docs: true,
  });
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState("");

  if (!wedding) return null;

  const toggleOption = (key) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = async () => {
    setExporting(true);
    setProgress("Obteniendo archivos...");

    try {
      const zip = new JSZip();
      const coupleName = (wedding.couple_names || wedding.client_name || "Boda").replace(/\s+/g, "_");
      const rootFolder = zip.folder(`Reportaje_${coupleName}`);

      const [photos, docs] = await Promise.all([
        base44.entities.GalleryPhoto.filter({ wedding_id: wedding.id }),
        base44.entities.Document.filter({ wedding_id: wedding.id }),
      ]);

      const avancePhotos = (photos || []).filter((p) => p.section === "avance");
      const entregaPhotos = (photos || []).filter((p) => p.section === "entrega" || p.section === "official" || !p.section);
      const guestPhotos = (photos || []).filter((p) => p.section === "guest");

      let processedCount = 0;
      const totalToProcess =
        (options.avance ? avancePhotos.length : 0) +
        (options.entrega ? entregaPhotos.length : 0) +
        (options.guest ? guestPhotos.length : 0) +
        (options.docs ? (docs || []).length : 0);

      // Helper para convertir Data URL / URL en Blob para JSZip
      const fetchBlob = async (url) => {
        if (!url) return null;
        if (url.startsWith("data:")) {
          const parts = url.split(";base64,");
          const contentType = parts[0].replace("data:", "");
          const raw = window.atob(parts[1]);
          const uInt8Array = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
          }
          return new Blob([uInt8Array], { type: contentType });
        }
        const res = await fetch(url);
        return await res.blob();
      };

      // 1. Fotos del Avance
      if (options.avance && avancePhotos.length > 0) {
        const avanceFolder = rootFolder.folder("01_Fotos_Reportaje_Avance");
        for (let i = 0; i < avancePhotos.length; i++) {
          processedCount++;
          setProgress(`Procesando Avance (${processedCount}/${totalToProcess})…`);
          const p = avancePhotos[i];
          const blob = await fetchBlob(p.url || p.file_url);
          if (blob) {
            const ext = blob.type.includes("png") ? "png" : "jpg";
            avanceFolder.file(`Avance_${i + 1}.${ext}`, blob);
          }
        }
      }

      // 2. Reportaje Completo (Entrega)
      if (options.entrega && entregaPhotos.length > 0) {
        const entregaFolder = rootFolder.folder("02_Fotos_Reportaje_Entrega");
        for (let i = 0; i < entregaPhotos.length; i++) {
          processedCount++;
          setProgress(`Procesando Entrega (${processedCount}/${totalToProcess})…`);
          const p = entregaPhotos[i];
          const blob = await fetchBlob(p.url || p.file_url);
          if (blob) {
            const ext = blob.type.includes("png") ? "png" : "jpg";
            entregaFolder.file(`Reportaje_${i + 1}.${ext}`, blob);
          }
        }
      }

      // 3. Fotos de Invitados
      if (options.guest && guestPhotos.length > 0) {
        const guestFolder = rootFolder.folder("03_Fotos_Invitados");
        for (let i = 0; i < guestPhotos.length; i++) {
          processedCount++;
          setProgress(`Procesando Fotos Invitados (${processedCount}/${totalToProcess})…`);
          const p = guestPhotos[i];
          const blob = await fetchBlob(p.url || p.file_url);
          if (blob) {
            const ext = blob.type.includes("png") ? "png" : "jpg";
            guestFolder.file(`Invitados_${i + 1}.${ext}`, blob);
          }
        }
      }

      // 4. Documentos en PDF
      if (options.docs && docs && docs.length > 0) {
        const docsFolder = rootFolder.folder("04_Documentos");
        for (let i = 0; i < docs.length; i++) {
          processedCount++;
          setProgress(`Procesando Documentos (${processedCount}/${totalToProcess})…`);
          const d = docs[i];
          const blob = await fetchBlob(d.file_uri);
          if (blob) {
            docsFolder.file(`${(d.name || "Documento").replace(/\s+/g, "_")}.pdf`, blob);
          }
        }
      }

      setProgress("Generando archivo .ZIP...");
      const content = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(content);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `Entrega_Pendrive_${coupleName}.zip`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 1000);

      onOpenChange(false);
    } catch (e) {
      console.error("Error al exportar paquete:", e);
      alert("Error al generar el archivo. Por favor, revisa las imágenes cargadas.");
    } finally {
      setExporting(false);
      setProgress("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A18]">
            <HardDrive className="w-5 h-5 text-[#C9A84C]" /> Exportar para Pendrive / Disco Duro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-xs text-stone-500">
            Selecciona el contenido que deseas empaquetar para volcar directamente en un Pendrive USB de entrega o disco duro externo de respaldo:
          </p>

          <div className="space-y-3 bg-stone-50 rounded-xl p-4 border border-stone-100">
            <div className="flex items-center space-x-3">
              <Checkbox id="opt-avance" checked={options.avance} onCheckedChange={() => toggleOption("avance")} />
              <Label htmlFor="opt-avance" className="text-sm font-medium cursor-pointer">
                01_Fotos_Reportaje_Avance <span className="text-xs text-stone-400 font-normal">(Adelanto express)</span>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox id="opt-entrega" checked={options.entrega} onCheckedChange={() => toggleOption("entrega")} />
              <Label htmlFor="opt-entrega" className="text-sm font-medium cursor-pointer">
                02_Fotos_Reportaje_Entrega <span className="text-xs text-stone-400 font-normal">(Reportaje completo)</span>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox id="opt-guest" checked={options.guest} onCheckedChange={() => toggleOption("guest")} />
              <Label htmlFor="opt-guest" className="text-sm font-medium cursor-pointer">
                03_Fotos_Invitados <span className="text-xs text-stone-400 font-normal">(Fotos del evento por invitados)</span>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox id="opt-docs" checked={options.docs} onCheckedChange={() => toggleOption("docs")} />
              <Label htmlFor="opt-docs" className="text-sm font-medium cursor-pointer">
                04_Documentos <span className="text-xs text-stone-400 font-normal">(Contrato, facturas y propuesta PDF)</span>
              </Label>
            </div>
          </div>

          {exporting && (
            <div className="bg-amber-50 text-amber-800 text-xs rounded-lg p-3 flex items-center gap-2 animate-pulse">
              <PackageCheck className="w-4 h-4 text-[#C9A84C]" />
              <span>{progress}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || (!options.avance && !options.entrega && !options.guest && !options.docs)}
            className="bg-[#C9A84C] hover:bg-[#b8983f] text-[#1A1A18]"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? "Generando ZIP…" : "Descargar Paquete (.ZIP)"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
