import React, { useRef, useState, useEffect } from 'react';
import PortalSection from './PortalSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSignature, CheckCircle2, Eraser, Loader2, Download, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { generateContractPDF } from '@/lib/pdf';
import { base44 } from '@/api/base44Client';
import { fmtEUR, STUDIO } from '@/lib/constants';

export default function PortalContractSignature({ wedding, token, onSigned }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signedDoc, setSignedDoc] = useState(null);

  // Setup Canvas scaling for high-DPI crisp signature
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#1A1A18';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = (e) => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSignContract = async () => {
    if (!hasSignature) return;
    setSigning(true);
    try {
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas.toDataURL('image/png');

      // 1. Generate PDF with embedded client signature
      const pdfBlob = generateContractPDF(wedding, signatureDataUrl);
      const filename = `Contrato_Firmado_${(wedding.couple_names || 'boda').replace(/\s+/g, '_')}.pdf`;

      // 2. Upload to Supabase Storage
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });
      const uploadRes = await base44.integrations.Core.UploadPrivateFile({ file });
      const fileUri = uploadRes?.file_uri;

      // 3. Create document record visible to client
      if (fileUri) {
        await base44.entities.Document.create({
          wedding_id: wedding.id,
          name: `Contrato firmado · ${wedding.couple_names || wedding.client_name}`,
          doc_type: 'contrato',
          file_uri: fileUri,
          visible_to_client: true
        });
      }

      // 4. Update wedding contract status
      await base44.functions.invoke('clientPortal', {
        token,
        action: 'signContract',
        contract_signed_date: new Date().toISOString()
      });

      if (onSigned) onSigned();
    } catch (err) {
      console.error("Error signing contract:", err);
      alert("Hubo un problema al procesar la firma. Inténtalo de nuevo.");
    } finally {
      setSigning(false);
    }
  };

  if (wedding.contract_signed) {
    return (
      <PortalSection overline="Contrato de servicios" title="Contrato firmado y verificado">
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-semibold text-emerald-950">Vuestro contrato está verificado</h3>
          <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
            Firmado electrónicamente el{' '}
            <strong>
              {wedding.contract_signed_date
                ? format(new Date(wedding.contract_signed_date), "d 'de' MMMM 'de' yyyy", { locale: es })
                : 'Recientemente'}
            </strong>. Las condiciones, plazos de entrega y coberturas quedan aseguradas por escrito.
          </p>

          <div className="pt-2 flex justify-center">
            <Button
              variant="outline"
              onClick={() => generateContractPDF(wedding)}
              className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold"
            >
              <Download className="w-4 h-4 mr-2" /> Descargar contrato PDF
            </Button>
          </div>
        </div>
      </PortalSection>
    );
  }

  const t = wedding.total_price || 0;

  return (
    <PortalSection overline="Contrato oficial" title="Revisión y Firma Digital del Contrato">
      <div className="space-y-5">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 text-xs text-stone-600 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <span className="font-semibold text-stone-900 text-sm">Resumen del Servicio Contratado</span>
            <Badge className="bg-[#C9A84C]/20 text-[#8a7233] border-0">
              {wedding.package_name || 'Reportaje Personalizado'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div>
              <span className="text-stone-400 block">Fotógrafo:</span>
              <strong className="text-stone-800">{STUDIO.owner}</strong>
            </div>
            <div>
              <span className="text-stone-400 block">Cliente:</span>
              <strong className="text-stone-800">{wedding.billing_name || wedding.couple_names}</strong>
            </div>
            <div>
              <span className="text-stone-400 block">Fecha del evento:</span>
              <strong className="text-stone-800">
                {wedding.event_date ? format(new Date(wedding.event_date), "d 'de' MMMM 'de' yyyy", { locale: es }) : 'Por confirmar'}
              </strong>
            </div>
            <div>
              <span className="text-stone-400 block">Importe Total:</span>
              <strong className="text-[#C9A84C] font-semibold text-sm">{fmtEUR(t)}</strong>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 space-y-2 text-[11px] leading-relaxed text-stone-600">
            <p><strong>1. Forma de pago:</strong> 20% ({fmtEUR(t * 0.2)}) para la reserva de fecha; 40% ({fmtEUR(t * 0.4)}) un mes antes del evento; 40% ({fmtEUR(t * 0.4)}) a la entrega del reportaje.</p>
            <p><strong>2. Plazo de entrega por escrito:</strong> Reportaje completo editado en alta resolución entregado en un plazo de <strong>2 a 3 semanas</strong> por galería privada.</p>
            <p><strong>3. Regalo de Invitados:</strong> Incluye acceso a la Galería Interactiva con código QR para que los invitados suban sus fotografías del evento.</p>
            <p><strong>4. Derechos y Responsabilidad Civil:</strong> El fotógrafo cuenta con Seguro de Responsabilidad Civil profesional. Las fotos se entregan procesadas en alta resolución.</p>
          </div>
        </div>

        {/* Firma Canvas */}
        <div className="bg-[#1A1A18] text-white rounded-2xl p-5 shadow-md border border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#C9A84C] flex items-center gap-1.5">
              <FileSignature className="w-4 h-4" /> Dibuja vuestra firma aquí (Táctil o Ratón)
            </label>
            {hasSignature && (
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[11px] text-stone-400 hover:text-white flex items-center gap-1"
              >
                <Eraser className="w-3.5 h-3.5" /> Borrar
              </button>
            )}
          </div>

          <div className="relative bg-white rounded-xl overflow-hidden border-2 border-[#C9A84C]/40 touch-none">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-32 cursor-crosshair block"
            />
            {!hasSignature && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-stone-300 text-xs italic">
                Firma aquí con el dedo o el ratón...
              </div>
            )}
          </div>

          <Button
            onClick={handleSignContract}
            disabled={!hasSignature || signing}
            className="w-full h-11 bg-[#C9A84C] hover:bg-[#b8983f] text-[#1A1A18] font-bold text-xs shadow-lg transition-all"
          >
            {signing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#1A1A18]" />
                Generando y registrando firma...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 text-[#1A1A18]" />
                Firmar y Aceptar Contrato
              </>
            )}
          </Button>

          <p className="text-[10px] text-center text-stone-500">
            Al firmar, se estampará vuestra firma digital, fecha y sello de verificación en el documento legal PDF.
          </p>
        </div>
      </div>
    </PortalSection>
  );
}
