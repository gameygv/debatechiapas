import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface Section {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const Sections = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      setSections(data || []);
    } catch (error: any) {
      toast.error('Error al cargar secciones');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (section?: Section) => {
    if (section) {
      setIsEditing(true);
      setCurrentId(section.id);
      setName(section.name);
      setSlug(section.slug);
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setName('');
      setSlug('');
    }
    setIsDialogOpen(true);
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!isEditing) {
      setSlug(generateSlug(newName));
    }
  };

  const handleSave = async () => {
    if (!name || !slug) {
      toast.error('Nombre y Slug son obligatorios');
      return;
    }

    try {
      if (isEditing && currentId) {
        const { error } = await supabase
          .from('categories')
          .update({ name, slug })
          .eq('id', currentId);
        if (error) throw error;
        toast.success('Sección actualizada');
      } else {
        // Get max order for new section
        const { data: maxOrderData } = await supabase
          .from('categories')
          .select('display_order')
          .order('display_order', { ascending: false })
          .limit(1);
        
        const nextOrder = maxOrderData?.[0]?.display_order ? maxOrderData[0].display_order + 1 : 1;
        
        const { error } = await supabase
          .from('categories')
          .insert([{ name, slug, display_order: nextOrder }]);
        if (error) throw error;
        toast.success('Sección creada');
      }
      
      setIsDialogOpen(false);
      fetchSections();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta sección?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Sección eliminada');
      fetchSections();
    } catch (error: any) {
      toast.error('Error al eliminar');
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentSection = sections.find(s => s.id === id);
    if (!currentSection) return;

    const currentOrder = currentSection.display_order;
    const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    
    const targetSection = sections.find(s => s.display_order === targetOrder);
    if (!targetSection) return;

    try {
      // Swap orders
      await supabase.from('categories').update({ display_order: targetOrder }).eq('id', id);
      await supabase.from('categories').update({ display_order: currentOrder }).eq('id', targetSection.id);
      
      toast.success('Orden actualizado');
      fetchSections();
    } catch (error: any) {
      toast.error('Error al reordenar');
    }
  };

  const filteredSections = sections.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900">Secciones del Menú</h1>
          <p className="text-muted-foreground mt-1">Gestiona las secciones que aparecen en el menú de navegación.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Sección
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar sección..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Orden</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filteredSections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No se encontraron secciones
                </TableCell>
              </TableRow>
            ) : (
              filteredSections.map((section, index) => (
                <TableRow key={section.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <span className="font-mono text-sm">{section.display_order}</span>
                      <div className="flex flex-col gap-0.5 ml-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 p-0"
                          onClick={() => handleReorder(section.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 p-0"
                          onClick={() => handleReorder(section.id, 'down')}
                          disabled={index === filteredSections.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{section.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{section.slug}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Activa
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(section)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(section.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Sección' : 'Nueva Sección'}</DialogTitle>
            <DialogDescription>
              Define el nombre y la ruta amigable (slug) para la sección del menú.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={name} onChange={handleNameChange} placeholder="Ej. Deportes" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Ej. deportes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sections;