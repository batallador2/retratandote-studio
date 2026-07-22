import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download } from "lucide-react";
import PortalSection from "@/components/portal/PortalSection";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TYPE_LABELS = { contrato: "Contrato", factura: "Factura", presupuesto: "Presupuesto", otro: "Documento" };

export default function PortalDocuments({ documents, token }) {
  const [downloading, setDownloading] = useState(null);
  if (!documents?.length) return null;

  const download = async (doc) => {
    setDownloading(doc.id);
    try {
      const res = await base44.functions.invoke("clientPortal", { token, action: "downloadDocument", content: doc.id });
      const url = res?.data?.signed_url || doc.file_uri;
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
          a.target = "_blank";
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
    } catch (e) {
      console.error("Error al descargar documento:", e);
    }
    setDownloading(null);
  };

  return (
    <PortalSection overline="Papeleo" title="Vuestros documentos">
      <div className="space-y-2">
        {documents.map((d) => (
          <div key={d.id} className="flex items-center gap-3 bg-[#FAF7F2] rounded-xl px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A18] truncate">{d.name}</p>
              <p className="text-xs text-stone-400">
                {TYPE_LABELS[d.doc_type] || "Documento"}
                {d.created_date && ` · ${format(new Date(d.created_date), "d MMM yyyy", { locale: es })}`}
              </p>
            </div>
            <button onClick={() => download(d)} disabled={downloading === d.id} className="p-2 text-stone-400 hover:text-[#1A1A18] disabled:opacity-50">
              <Download className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </PortalSection>
  );
}