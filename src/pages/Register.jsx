import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function Register() {
  return (
    <AuthLayout
      title="Registro Restringido"
      subtitle="Acceso privado del estudio"
      footer="🔒 Para dar de alta un nuevo fotógrafo o asistente, contacta con la dirección de Retratándote."
    >
      <div className="text-center py-4 space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#C9A84C]/10 text-[#C9A84C] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        
        <h3 className="text-sm font-semibold text-white">El registro público está desactivado</h3>
        
        <p className="text-xs text-stone-400 leading-relaxed max-w-xs mx-auto">
          Por motivos de seguridad, los nuevos usuarios y ayudantes del estudio se crean exclusivamente de forma interna desde el panel de **Ajustes** por un usuario Administrador.
        </p>

        <div className="pt-2">
          <Link to="/login">
            <Button className="w-full h-11 bg-[#C9A84C] hover:bg-[#b5953f] text-[#1A1A18] font-semibold">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Inicio de Sesión
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
