import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, UserPlus, Shield, UserCheck, Loader2 } from "lucide-react";
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';

export default function UsersSettingsCard() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
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
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await supabase.from('studio_users').select('*').order('created_at', { ascending: true });
      if (data && data.length > 0) {
        setUsersList(data);
      } else if (user) {
        setUsersList([{
          id: user.id,
          name: user.email?.split('@')[0] || 'Administrador',
          email: user.email,
          role: 'admin',
          created_at: new Date().toISOString()
        }]);
      }
    } catch (e) {
      console.error("Error loading studio users:", e);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name,
            role: newUser.role
          }
        }
      });

      if (authErr) throw authErr;

      const profile = {
        name: newUser.name || newUser.email.split('@')[0],
        email: newUser.email,
        role: newUser.role,
        created_at: new Date().toISOString()
      };

      await supabase.from('studio_users').insert(profile);

      setSuccess(`Usuario ${newUser.email} creado con éxito (${newUser.role.toUpperCase()})`);
      setShowModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'ayudante' });
      loadUsers();
    } catch (err) {
      setError(err.message || 'Error al crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-stone-100 text-[#1A1A18]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1A1A18]">Usuarios y Accesos del Estudio</h3>
              <p className="text-xs text-stone-500">Administradores y fotógrafos ayudantes autorizados</p>
            </div>
          </div>
          <Button onClick={() => setShowModal(true)} size="sm" className="bg-[#1A1A18] hover:bg-stone-800 text-white">
            <UserPlus className="w-4 h-4 mr-2" /> Añadir usuario
          </Button>
        </div>

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            {success}
          </div>
        )}

        <div className="space-y-2">
          {usersList.map((u, i) => (
            <div key={u.id || i} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1A1A18] text-white font-semibold text-xs flex items-center justify-center">
                  {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1A18]">{u.name || u.email}</p>
                  <p className="text-xs text-stone-400">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {u.email === user?.email && (
                  <Badge variant="outline" className="bg-stone-200 text-stone-700 border-0 text-[10px]">Tú (Sesión actual)</Badge>
                )}
                {u.role === 'admin' ? (
                  <Badge className="bg-[#1A1A18] text-white border-0 text-xs flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[#C9A84C]" /> Admin
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-stone-200 text-stone-700 border-0 text-xs flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-stone-500" /> Ayudante
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A18] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#C9A84C]" /> Crear Usuario del Estudio
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
                placeholder="Ej. Juanjo Huertas / Carlos (Ayudante)"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Correo electrónico (Email de acceso)</Label>
              <Input
                type="email"
                placeholder="ejemplo@retratandote.es"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Contraseña de acceso</Label>
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
