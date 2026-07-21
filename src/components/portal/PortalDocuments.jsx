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
    const res = await base44.functions.invoke("clientPortal", { token, action: "downloadDocument", content: doc.id });
    window.open(res.data.signed_url, "_blank");
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