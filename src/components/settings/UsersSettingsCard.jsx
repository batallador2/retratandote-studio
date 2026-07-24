import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, UserPlus, Shield, UserCheck, Loader2, Trash2, Laptop, RefreshCw } from "lucide-react";
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function UsersSettingsCard() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ayudante'
  });

  useEffect(() => {
    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    setRefreshing(true);
    try {
      // 1. Sync current user active ping
      if (user?.email) {
        const { data: existing } = await supabase
          .from('studio_users')
          .select('id')
          .eq('email', user.email.toLowerCase())
          .maybeSingle();

        if (existing) {
          await supabase
            .from('studio_users')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          await supabase.from('studio_users').insert({
            name: user.email.split('@')[0],
            email: user.email.toLowerCase(),
            role: 'admin',
            created_at: new Date().toISOString(),
            last_active_at: new Date().toISOString()
          });
        }
      }

      // 2. Fetch full list of studio users
      const { data, error: err } = await supabase
        .from('studio_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        setUsersList(data);
      } else if (user) {
        setUsersList([{
          id: user.id,
          name: user.email?.split('@')[0] || 'Administrador',
          email: user.email,
          role: 'admin',
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        }]);
      }
    } catch (e) {
      console.error("Error loading studio users:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const cleanEmail = newUser.email.trim().toLowerCase();

      // Sign up new user in Supabase Auth
      const { data, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name,
            role: newUser.role
          }
        }
      });

      if (authErr && !authErr.message.includes('User already registered')) {
        throw authErr;
      }

      // Insert/Upsert into studio_users table
      const profile = {
        name: newUser.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: newUser.role,
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      };

      await supabase.from('studio_users').upsert(profile, { onConflict: 'email' });

      setSuccess(`Usuario ${cleanEmail} registrado con éxito con rol (${newUser.role.toUpperCase()})`);
      setShowModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'ayudante' });
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Error al crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserRole = async (u) => {
    const newRole = u.role === 'admin' ? 'ayudante' : 'admin';
    try {
      await supabase.from('studio_users').update({ role: newRole }).eq('id', u.id);
      await loadUsers();
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.email === user?.email) {
      alert("No puedes revocar tu propio acceso activo.");
      return;
    }
    if (!window.confirm(`¿Seguro que deseas revocar el acceso de ${u.email}?`)) return;

    try {
      await supabase.from('studio_users').delete().eq('id', u.id);
      await loadUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const formatLastActive = (dateStr, isCurrentUser) => {
    if (isCurrentUser) return { text: "🟢 Conectado ahora (Sesión actual)", isOnline: true };
    if (!dateStr) return { text: "⚪ Nunca accedió", isOnline: false };
    
    try {
      const date = new Date(dateStr);
      const diffMinutes = Math.floor((new Date() - date) / (1000 * 60));
      if (diffMinutes < 10) {
        return { text: "🟢 Conectado recientemente", isOnline: true };
      }
      return { 
        text: `⚪ Acceso: ${format(date, "d MMM, HH:mm", { locale: es })}`, 
        isOnline: false 
      };
    } catch {
      return { text: "⚪ Fecha desconocida", isOnline: false };
    }
  };

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#1A1A18] text-[#C9A84C]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1A1A18]">Usuarios Autorizados y Sesiones Activas</h3>
              <p className="text-xs text-stone-500">Lista completa de administradores, ayudantes y estado de sesión</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={loadUsers} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 text-stone-500 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => setShowModal(true)} size="sm" className="bg-[#1A1A18] hover:bg-stone-800 text-white">
              <UserPlus className="w-4 h-4 mr-2" /> Añadir usuario
            </Button>
          </div>
        </div>

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            {success}
          </div>
        )}

        <div className="space-y-2.5">
          {usersList.map((u, i) => {
            const isMe = u.email?.toLowerCase() === user?.email?.toLowerCase();
            const activeStatus = formatLastActive(u.last_active_at, isMe);

            return (
              <div key={u.id || i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1A1A18] text-[#C9A84C] font-bold text-xs flex items-center justify-center border border-[#C9A84C]/30 shrink-0">
                    {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#1A1A18]">{u.name || u.email}</p>
                      {isMe && (
                        <Badge variant="outline" className="bg-[#C9A84C]/15 text-[#8a7233] border-[#C9A84C]/30 text-[10px] px-1.5 py-0">
                          <Laptop className="w-3 h-3 mr-1" /> Tu dispositivo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 font-mono">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                  <div className="text-right">
                    <p className={`text-[11px] font-medium ${activeStatus.isOnline ? 'text-emerald-700 font-semibold' : 'text-stone-500'}`}>
                      {activeStatus.text}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleUserRole(u)}
                      title="Haz clic para cambiar el rol"
                      className="cursor-pointer transition-transform active:scale-95"
                    >
                      {u.role === 'admin' ? (
                        <Badge className="bg-[#1A1A18] text-white border-0 text-xs flex items-center gap-1 hover:bg-stone-800">
                          <Shield className="w-3 h-3 text-[#C9A84C]" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-stone-200 text-stone-700 border-0 text-xs flex items-center gap-1 hover:bg-stone-300">
                          <UserCheck className="w-3 h-3 text-stone-500" /> Ayudante
                        </Badge>
                      )}
                    </button>

                    {!isMe && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(u)}
                        className="h-8 w-8 text-stone-400 hover:text-red-600 hover:bg-red-50"
                        title="Revocar acceso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A18] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#C9A84C]" /> Dar de Alta Usuario del Estudio
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <Label>Nombre completo</Label>
              <Input
                placeholder="Ej. Juanjo Huertas / Carlos Asistente"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Correo electrónico de acceso</Label>
              <Input
                type="email"
                placeholder="ejemplo@retratandote.es"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Contraseña inicial de acceso</Label>
              <Input
                type="password"
                placeholder="••••••••"
                minLength={6}
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Rol y Permisos</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-stone-200 text-sm bg-white text-[#1A1A18]"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="admin">Administrador (Acceso total)</option>
                <option value="ayudante">Ayudante / Asistente (Gestión y consultas)</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-[#1A1A18] hover:bg-stone-800 text-white">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Autorizar Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
