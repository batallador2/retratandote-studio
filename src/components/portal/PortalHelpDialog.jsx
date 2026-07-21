import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { HelpCircle, CheckCircle2, CreditCard, Camera, Heart, FileText, MessageCircle, UserRound } from "lucide-react";
import { STUDIO } from "@/lib/constants";

const steps = [
  {
    icon: UserRound,
    title: "1 · Completad vuestros datos",
    text: "Lo primero es rellenar vuestro nombre completo, DNI y dirección en el formulario del portal. Los necesitamos para el contrato y los justificantes de pago.",
  },
  {
    icon: CheckCircle2,
    title: "2 · Seguid el estado de vuestro reportaje",
    text: "En la parte superior veréis en qué fase está vuestro reportaje: desde la propuesta hasta la entrega de la galería final. Se actualiza automáticamente.",
  },
  {
    icon: CreditCard,
    title: "3 · Vuestros pagos",
    text: "El pago se divide en tres plazos: la reserva, un segundo pago un mes antes de la boda y el último a la entrega. Aquí veréis qué está pagado, qué queda pendiente y sus fechas. Cada pago genera un justificante que encontraréis en Documentos.",
  },
  {
    icon: Camera,
    title: "4 · La galería de fotos",
    text: "Primero recibiréis «El avance», una selección de las mejores fotos pocos días después de la boda. Más adelante se activará el «Reportaje completo» con todas las fotos y el vídeo.",
  },
  {
    icon: Heart,
    title: "5 · Elegid las fotos de vuestro álbum",
    text: "Tocad el corazón de vuestras fotos favoritas en la galería. Así sabremos cuáles queréis para el álbum. Podéis marcar y desmarcar cuantas veces queráis.",
  },
  {
    icon: FileText,
    title: "6 · Documentos",
    text: "En la sección de documentos podéis descargar el contrato, los justificantes de pago y cualquier otro documento que compartamos con vosotros.",
  },
  {
    icon: MessageCircle,
    title: "7 · ¿Dudas? Escribidnos",
    text: "Al final del portal tenéis un chat directo con nosotros. Escribid cualquier duda y os responderemos lo antes posible.",
  },
];

export default function PortalHelpDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#1A1A18] text-white pl-4 pr-5 py-3 shadow-lg hover:bg-[#2a2a26] transition-colors"
        aria-label="Cómo funciona el portal"
      >
        <HelpCircle className="w-5 h-5 text-[#C9A84C]" />
        <span className="text-sm">Ayuda</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-[#FAF7F2] border-[#C9A84C]/30 rounded-2xl">
          <div className="text-center pt-2">
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#C9A84C] mb-2">Vuestro portal</p>
            <h2 className="font-display text-3xl italic text-[#1A1A18]">¿Cómo funciona?</h2>
            <p className="text-sm text-stone-500 mt-2">
              Este es vuestro espacio privado para seguir todo el proceso de vuestro reportaje.
            </p>
          </div>
          <div className="space-y-5 mt-4">
            {steps.map((s) => (
              <div key={s.title} className="flex gap-4">
                <div className="w-9 h-9 rounded-full bg-[#C9A84C]/15 flex items-center justify-center shrink-0">
                  <s.icon className="w-4 h-4 text-[#C9A84C]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A18]">{s.title}</p>
                  <p className="text-sm text-stone-500 mt-1 leading-relaxed">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 text-center mt-4 border-t border-[#C9A84C]/20 pt-4">
            {STUDIO.name} · {STUDIO.email} · {STUDIO.phone}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}