import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function GuestThumb({ assetId, token, onClick }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    base44.functions
      .invoke("guestArea", { token, action: "thumbnail", asset_id: assetId })
      .then((res) => { if (!cancelled) setSrc(res.data.data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [assetId, token]);

  return (
    <button onClick={onClick} className="aspect-square rounded-lg overflow-hidden bg-stone-200">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
      ) : (
        <div className="w-full h-full animate-pulse bg-stone-200" />
      )}
    </button>
  );
}