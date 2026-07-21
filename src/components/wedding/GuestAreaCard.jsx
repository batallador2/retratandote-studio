import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PartyPopper, Copy, Check, ExternalLink, QrCode } from "lucide-react";
import GuestQrCard from "@/components/wedding/GuestQrCard";

export default function GuestAreaCard({ wedding, onChanged }) {
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const activate = async () => {
    setActivating(true);
    await base44.functions.invoke("guestArea", { action: "setup", wedding_id: wedding.id });
    setActivating(false);
    onChanged();
  };

  const guestUrl = wedding.guest_token ? `${window.location.origin}/invitados/${wedding.guest_token}` : null;

  const copy = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><PartyPopper className="w-4 h-4" /> Área de invitados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!guestUrl ? (
          <>
            <p className="text-sm text-stone-500">Crea un enlace para que los invitados suban y vean las fotos de la boda (almacenadas en tu servidor Immich).</p>
            <Button onClick={activate} disabled={activating} className="bg-[#C9A84C] hover:bg-[#b8983f] text-[#1A1A18]">
              {activating ? "Activando…" : "Activar área de invitados"}
            </Button>
          </>
        ) : (
          <div>
            <Label>Enlace para invitados</Label>
            <div className="flex gap-2 mt-1">
              <Input value={guestUrl} readOnly className="text-xs text-stone-500" />
              <Button variant="outline" onClick={copy}>
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </Button>
              <a href={guestUrl} target="_blank" rel="noreferrer">
                <Button variant="outline"><ExternalLink className="w-4 h-4" /></Button>
              </a>
            </div>
            <p className="text-xs text-stone-400 mt-1.5">Compártelo en la invitación o con un QR: los invitados podrán subir sus fotos y ver las de los demás.</p>
            <Button variant="outline" className="mt-3 w-full" onClick={() => setQrOpen(true)}>
              <QrCode className="w-4 h-4 mr-2" /> Tarjeta QR para las mesas
            </Button>
            <GuestQrCard open={qrOpen} onOpenChange={setQrOpen} wedding={wedding} guestUrl={guestUrl} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}