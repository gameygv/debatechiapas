import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Shield, User, Loader2, Key } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import type { DbProfile } from '@/lib/types';
import { z } from 'zod';

const createUserSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['superuser', 'editor']),
});

const updateUserSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['superuser', 'editor']),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional().or(z.literal('')),
});

const Users = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'superuser' | 'editor'>('editor');
  const [changePassword, setChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Real users state
  const [users, setUsers] = useState<DbProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data);
    setLoadingUsers(false);
  };

  const openCreateDialog = () => {
    setIsEditMode(false);
    setEditingUserId(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('editor');
    setChangePassword(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: any) => {
    setIsEditMode(true);
    setEditingUserId(user.id);
    setFullName(user.full_name);
    setEmail(user.email);
    setRole(user.role);
    setPassword('');
    setChangePassword(false);
    setIsDialogOpen(true);
  };

  const handleCreateUser = async () => {
    const validation = createUserSchema.safeParse({ fullName, email, password, role });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      }

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email,
          password,
          fullName,
          role
        }
      });

      if (error) {
        throw new Error(error.message || 'Error invocando función');
      }
      
      if (data && data.error) {
        throw new Error(data.error);
      }

      toast.success(`Usuario ${fullName} creado exitosamente`);
      setIsDialogOpen(false);
      fetchUsers();

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    const validation = updateUserSchema.safeParse({
      fullName, email, role,
      password: changePassword ? password : undefined,
    });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      }

      const { data, error } = await supabase.functions.invoke('update-user', {
        body: {
          userId: editingUserId,
          fullName,
          email,
          role,
          password: changePassword ? password : null
        }
      });

      if (error) {
        throw new Error(error.message || 'Error invocando función');
      }
      
      if (data && data.error) {
        throw new Error(data.error);
      }

      toast.success(`Usuario actualizado exitosamente`);
      setIsDialogOpen(false);
      fetchUsers();

    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Error al actualizar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) {
        throw new Error(error.message || 'Error invocando función');
      }
      
      if (data && data.error) {
        throw new Error(data.error);
      }

      toast.success('Usuario eliminado correctamente');
      fetchUsers();

    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Error al eliminar usuario');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">Administra los usuarios del sistema (solo SuperUser)</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Modifica los datos del usuario.' : 'Completa los datos del nuevo usuario.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  placeholder="Ej. Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isEditMode}
                />
                {isEditMode && (
                  <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
                )}
              </div>
              
              {isEditMode && (
                <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/30">
                  <Checkbox 
                    id="changePassword" 
                    checked={changePassword}
                    onCheckedChange={(checked) => setChangePassword(checked as boolean)}
                  />
                  <label
                    htmlFor="changePassword"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <Key className="h-4 w-4" />
                    Cambiar contraseña
                  </label>
                </div>
              )}

              {(!isEditMode || changePassword) && (
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {isEditMode ? 'Nueva Contraseña' : 'Contraseña'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={role} onValueChange={(val: 'superuser' | 'editor') => setRole(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Editor</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="superuser">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>SuperUser</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Editor: Solo puede crear/editar artículos. SuperUser: Acceso completo.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={isEditMode ? handleUpdateUser : handleCreateUser} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? (isEditMode ? 'Actualizando...' : 'Creando...') : (isEditMode ? 'Actualizar' : 'Crear Usuario')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingUsers ? (
               <TableRow>
                 <TableCell colSpan={4} className="text-center py-8">Cargando usuarios...</TableCell>
               </TableRow>
            ) : users.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={4} className="text-center py-8">No se encontraron usuarios</TableCell>
               </TableRow>
            ) : (
              users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.role === 'superuser' ? (
                    <Badge className="bg-gradient-to-r from-primary to-accent">
                      <Shield className="mr-1 h-3 w-3" />
                      SuperUser
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <User className="mr-1 h-3 w-3" />
                      Editor
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteUser(user.id, user.full_name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Users;