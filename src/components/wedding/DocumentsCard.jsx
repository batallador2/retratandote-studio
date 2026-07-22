import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Trash2, Download, Eye, EyeOff } from "lucide-react";

const TYPE_LABELS = { contrato: "Contrato", factura: "Factura", presupuesto: "Presupuesto", otro: "Documento" };

export default function DocumentsCard({ weddingId, documents, onChanged }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const guessType = (name) => {
    const n = name.toLowerCase();
    if (n.includes("contrato")) return "contrato";
    if (n.includes("factura")) return "factura";
    if (n.includes("presupuesto") || n.includes("propuesta")) return "presupuesto";
    return "otro";
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.Document.create({ wedding_id: weddingId, name: file.name, doc_type: guessType(file.name), file_uri });
    }
    setUploading(false);
    e.target.value = "";
    onChanged();
  };

  const download = async (doc) => {
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_uri });
    const url = signed_url || doc.file_uri;
    if (url) {
      if (url.startsWith("data:")) {
        const parts = url.split(";base64,");
        const contentType = parts[0].replace("data:", "");
        const raw = window.atob(parts[1]);
        const uInt8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${doc.name || "Documento"}.pdf`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      } else {
        window.open(url, "_blank");
      }
    }
  };

  const toggleVisible = async (doc) => {
    await base44.entities.Document.update(doc.id, { visible_to_client: !doc.visible_to_client });
    onChanged();
  };

  const remove = async (id) => {
    await base44.entities.Document.delete(id);
    onChanged();
  };

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> Documentos ({documents.length})</CardTitle>
        <Button variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-2" /> {uploading ? "Subiendo…" : "Subir"}
        </Button>
        <input ref={inputRef} type="file" multiple hidden onChange={handleFiles} />
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-sm text-stone-400">Contratos firmados, facturas… Los visibles aparecen en el portal del cliente.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-sm border border-stone-100 rounded-lg px-3 py-2">
                <Badge variant="secondary" className="shrink-0">{TYPE_LABELS[d.doc_type] || "Documento"}</Badge>
                <span className="flex-1 truncate text-stone-700">{d.name}</span>
                <button onClick={() => toggleVisible(d)} title={d.visible_to_client ? "Visible para el cliente" : "Oculto al cliente"} className="p-1 text-stone-400 hover:text-stone-700">
                  {d.visible_to_client ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => download(d)} title="Descargar" className="p-1 text-stone-400 hover:text-stone-700">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => remove(d.id)} title="Eliminar" className="p-1 text-stone-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}