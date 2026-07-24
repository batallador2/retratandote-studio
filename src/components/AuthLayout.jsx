import React from "react";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#141412] text-stone-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1A1A18] border border-[#C9A84C]/30 shadow-lg shadow-black/40 mb-4">
            <ShieldCheck className="w-8 h-8 text-[#C9A84C]" aria-hidden="true" />
          </div>
          <p className="text-xs uppercase tracking-widest font-semibold text-[#C9A84C] mb-1">RETRATÁNDOTE STUDIO</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="text-xs text-stone-400 mt-2 max-w-xs mx-auto leading-relaxed">{subtitle}</p>}
        </div>

        <div className="bg-[#1A1A18] rounded-2xl shadow-2xl border border-stone-800 p-8 backdrop-blur-sm">
          {children}
        </div>

        {footer && (
          <div className="text-center text-xs text-stone-500 mt-6 leading-relaxed max-w-xs mx-auto">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
