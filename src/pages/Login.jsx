import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, KeyRound } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { supabase } from "@/api/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Attempt login with Supabase
      const authRes = await base44.auth.loginViaEmailPassword(email, password);
      const userObj = authRes?.user || authRes?.session?.user;

      if (!userObj) {
        throw new Error("No se pudo iniciar sesión. Verifica tus credenciales.");
      }

      // 2. Check if user is authorized
      const cleanEmail = email.trim().toLowerCase();
      let isAuthorized = false;

      // Allow master admin emails
      const masterAdmins = ['juanjo@retratandote.es', 'juanjo342@gmail.com'];
      if (masterAdmins.includes(cleanEmail)) {
        isAuthorized = true;
      }

      // Check DB
      try {
        const { data: authorizedUsers } = await supabase
          .from('studio_users')
          .select('*');

        if (authorizedUsers && authorizedUsers.length > 0) {
          const found = authorizedUsers.find(
            (u) => u.email?.toLowerCase() === cleanEmail
          );
          if (found) {
            isAuthorized = true;
            await supabase
              .from('studio_users')
              .update({ last_active_at: new Date().toISOString() })
              .eq('id', found.id);
          }
        }
      } catch (dbErr) {
        console.warn("DB auth check warning:", dbErr);
      }

      // Check local cache
      try {
        const cached = localStorage.getItem('retratandote_studio_users_v2');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.some(u => u.email?.toLowerCase() === cleanEmail)) {
            isAuthorized = true;
          }
        }
      } catch {
        // ignore cache read error
      }

      if (!isAuthorized) {
        await supabase.auth.signOut();
        throw new Error("Acceso denegado. Este correo electrónico no está autorizado por la dirección del estudio.");
      }

      window.location.href = "/";
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Credenciales incorrectas o usuario no autorizado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Acceso al Estudio"
      subtitle="Área reservada exclusivamente para el equipo autorizado de Retratándote."
      footer="🔒 Sistema de gestión interno. El alta de usuarios se realiza únicamente por la dirección del estudio desde la sección de Ajustes."
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs leading-relaxed font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-stone-300">Correo del Estudio</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="juanjo@retratandote.es"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11 bg-stone-900/80 border-stone-700/80 text-white placeholder:text-stone-600 focus:border-[#C9A84C] text-sm"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-stone-300">Contraseña de Acceso</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-11 bg-stone-900/80 border-stone-700/80 text-white placeholder:text-stone-600 focus:border-[#C9A84C] text-sm"
              required
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 font-medium bg-[#C9A84C] hover:bg-[#b5953f] text-[#1A1A18] font-semibold mt-2 shadow-md transition-all" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#1A1A18]" />
              Verificando credenciales...
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4 mr-2 text-[#1A1A18]" />
              Entrar al Panel
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
