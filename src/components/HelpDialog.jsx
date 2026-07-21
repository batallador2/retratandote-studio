import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  HelpCircle, Inbox, KanbanSquare, FileSignature, Bell,
  UserCircle, Camera, Archive, CalendarHeart,
} from "lucide-react";

const sections = [
  {
    label: "Capta y gestiona",
    items: [
      { icon: Inbox, title: "Solicitudes automáticas", text: "Los leads entran solos desde tu formulario web (/solicitud) y ves al momento si la fecha está libre. Un clic los convierte en encargo con su ficha completa." },
      { icon: KanbanSquare, title: "Pipeline visual", text: "Cada boda avanza por fases arrastrando su tarjeta: propuesta → contrato → fotografiada → edición → entrega → cerrado. Los cobros vencidos se destacan en rojo." },
    ],
  },
  {
    label: "Cobra sin perseguir",
    items: [
      { icon: FileSignature, title: "Contratos y PDF", text: "Genera propuesta y contrato en PDF desde la ficha. Al firmarse, se crean solos los 3 pagos (20% reserva, 40% un mes antes, 40% a la entrega) y la fecha se reserva en el calendario." },
      { icon: Bell, title: "Recordatorios en 1 clic", text: "Cada pago pendiente tiene una campana que abre WhatsApp con el mensaje ya escrito. El panel te avisa 7 días antes de cada vencimiento." },
    ],
  },
  {
    label: "Experiencia premium para tus clientes",
    items: [
      { icon: UserCircle, title: "Portal privado de la pareja", text: "Cada boda tiene un enlace único donde los novios ven el estado de su reportaje, sus pagos, sus documentos, su galería final y pueden escribirte mensajes." },
      { icon: Camera, title: "Área de invitados", text: "Actívala desde la ficha y comparte el enlace o QR: los invitados suben sus fotos desde el móvil y todos las ven en una galería social en directo, guardada en tu servidor." },
    ],
  },
  {
    label: "Cierra el círculo",
    items: [
      { icon: Archive, title: "Archivado a Google Drive", text: "Al cerrar una boda, un botón mueve las fotos de invitados a tu Drive (Archivo → año → pareja) y libera espacio del servidor automáticamente." },
      { icon: CalendarHeart, title: "Aniversarios", text: "Un año después de cada boda, el panel te recuerda felicitar a la pareja y ofrecerles una sesión de aniversario." },
    ],
  },
];

export default function HelpDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 rounded-full w-11 h-11 bg-[#C9A84C] hover:bg-[#b8983f] text-[#1A1A18] shadow-lg"
        title="¿Qué puede hacer esta app?"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle>Todo el estudio en una sola app</DialogTitle>
            <p className="text-sm text-stone-500">
              Del primer mensaje de una pareja hasta el archivo final: CRM, cobros, portal del cliente y galerías de invitados, sin salir de aquí.
            </p>
          </DialogHeader>
          <div className="space-y-5">
            {sections.map((sec) => (
              <div key={sec.label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#C9A84C] mb-2">{sec.label}</p>
                <div className="space-y-3">
                  {sec.items.map((it) => (
                    <div key={it.title} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                        <it.icon className="w-4 h-4 text-[#1A1A18]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1A1A18]">{it.title}</p>
                        <p className="text-sm text-stone-600 mt-0.5">{it.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}