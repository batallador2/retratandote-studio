import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

export default function GuestLightbox({ assetId, token, onClose }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    setSrc(null);
    base44.functions
      .invoke("guestArea", { token, action: "thumbnail", asset_id: assetId, size: "preview" })
      .then((res) => setSrc(res.data.data))
      .catch(() => {});
  }, [assetId, token]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/80 hover:text-white"><X className="w-7 h-7" /></button>
      {src ? (
        <img src={src} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
      ) : (
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      )}
    </div>
  );
}