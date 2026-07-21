import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { STUDIO } from "@/lib/constants";

export default function GuestQrCard({ open, onOpenChange, wedding, guestUrl }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=10&color=1A1A18&bgcolor=FDFBF7&data=${encodeURIComponent(guestUrl)}`;

  const cardHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Tarjeta QR · ${wedding.couple_names}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,500&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  body { font-family: 'Inter', sans-serif; background: #f2ede4; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .card { width: 10.5cm; height: 14.8cm; background: #FDFBF7; border: 1px solid #C9A84C; outline: 1px solid #C9A84C; outline-offset: -0.35cm; padding: 1.1cm 0.9cm; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: space-between; }
  .studio { font-size: 9px; letter-spacing: 0.35em; text-transform: uppercase; color: #8a7233; }
  .names { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 30px; color: #1A1A18; line-height: 1.15; }
  .divider { width: 1.2cm; height: 1px; background: #C9A84C; margin: 0.15cm auto; }
  .title { font-family: 'Cormorant Garamond', serif; font-size: 19px; color: #1A1A18; }
  .subtitle { font-size: 9.5px; color: #7a746a; line-height: 1.6; max-width: 7cm; }
  .qr { width: 4.6cm; height: 4.6cm; }
  .footer { font-size: 8.5px; letter-spacing: 0.2em; text-transform: uppercase; color: #8a7233; }
  @media print { body { background: #fff; } }
</style>
</head>
<body>
  <div class="card">
    <div class="studio">${STUDIO.name} · Fotografía</div>
    <div>
      <div class="names">${wedding.couple_names}</div>
      <div class="divider"></div>
      <div class="title">¡Comparte tus fotos con nosotros!</div>
    </div>
    <img class="qr" src="${qrUrl}" alt="QR" />
    <div class="subtitle">Escanea el código con la cámara de tu móvil para subir tus fotos de la boda y ver las de los demás invitados.</div>
    <div class="footer">${STUDIO.web}</div>
  </div>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 400));</script>
</body>
</html>`;

  const printCard = () => {
    const w = window.open("", "_blank");
    w.document.write(cardHtml);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Tarjeta QR para las mesas</DialogTitle></DialogHeader>
        <div className="flex justify-center bg-stone-100 rounded-xl p-6">
          <div className="w-[240px] bg-[#FDFBF7] border border-[#C9A84C] p-5 text-center flex flex-col items-center gap-3 shadow-sm" style={{ outline: "1px solid #C9A84C", outlineOffset: "-8px" }}>
            <p className="text-[8px] tracking-[0.35em] uppercase text-[#8a7233] pt-2">{STUDIO.name} · Fotografía</p>
            <div>
              <p className="font-display italic text-xl text-[#1A1A18] leading-tight">{wedding.couple_names}</p>
              <div className="w-8 h-px bg-[#C9A84C] mx-auto my-1.5" />
              <p className="font-display text-sm text-[#1A1A18]">¡Comparte tus fotos con nosotros!</p>
            </div>
            <img src={qrUrl} alt="QR del área de invitados" className="w-28 h-28" />
            <p className="text-[8px] text-stone-500 leading-relaxed px-2">Escanea el código con la cámara de tu móvil para subir tus fotos de la boda y ver las de los demás invitados.</p>
            <p className="text-[7px] tracking-[0.2em] uppercase text-[#8a7233] pb-2">{STUDIO.web}</p>
          </div>
        </div>
        <p className="text-xs text-stone-400 text-center">Tamaño A6 (10,5 × 14,8 cm), ideal para imprimir y colocar en las mesas.</p>
        <DialogFooter>
          <a href={qrUrl} download="qr-invitados.png" target="_blank" rel="noreferrer">
            <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Solo el QR</Button>
          </a>
          <Button onClick={printCard} className="bg-[#1A1A18] hover:bg-stone-800">
            <Printer className="w-4 h-4 mr-2" /> Imprimir tarjeta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}