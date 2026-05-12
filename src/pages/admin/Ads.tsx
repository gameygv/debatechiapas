import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calendar, Link as LinkIcon, Eye, MousePointer2, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import MediaUploader from '@/components/admin/MediaUploader';
import AIImageGenerator from '@/components/admin/AIImageGenerator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Ad {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  views: number;
  clicks: number;
}

// Helper para obtener la hora local correcta para los inputs de fecha
const getLocalISOString = (date = new Date()) => {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const Ads = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [startDate, setStartDate] = useState(getLocalISOString());
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    if (error) toast.error("Error cargando anuncios");
    else setAds(data || []);
    setLoading(false);
  };

  const handleOpenDialog = (ad?: Ad) => {
    if (ad) {
      setEditingId(ad.id);
      setTitle(ad.title);
      setImageUrl(ad.image_url);
      setLinkUrl(ad.link_url || '');
      // Convertir UTC db a local input
      if (ad.start_date) {
        setStartDate(getLocalISOString(new Date(ad.start_date)));
      }
      if (ad.end_date) {
        setEndDate(getLocalISOString(new Date(ad.end_date)));
      } else {
        setEndDate('');
      }
      setIsActive(ad.is_active);
    } else {
      setEditingId(null);
      setTitle('');
      setImageUrl('');
      setLinkUrl('');
      setStartDate(getLocalISOString());
      setEndDate('');
      setIsActive(true);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title || !imageUrl || !startDate) {
      toast.error("Título, Imagen y Fecha de inicio son obligatorios");
      return;
    }

    setSaving(true);
    const payload = {
      title,
      image_url: imageUrl,
      link_url: linkUrl || null,
      start_date: new Date(startDate).toISOString(), // Guarda como UTC
      end_date: endDate ? new Date(endDate).toISOString() : null,
      is_active: isActive
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('ads').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success("Anuncio actualizado");
      } else {
        const { error } = await supabase.from('ads').insert(payload);
        if (error) throw error;
        toast.success("Anuncio creado");
      }
      setIsDialogOpen(false);
      fetchAds();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar anuncio permanentemente?")) return;
    const { error } = await supabase.from('ads').delete().eq('id', id);
    if (error) toast.error("Error al eliminar");
    else {
      toast.success("Anuncio eliminado");
      fetchAds();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Gestión de Anuncios</h1>
          <p className="text-muted-foreground mt-1">Configura banners publicitarios (Formato 1080x1080)</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Anuncio
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Imagen</TableHead>
              <TableHead>Campaña</TableHead>
              <TableHead>Programación</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-center">Métricas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
            ) : ads.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">No hay anuncios activos</TableCell></TableRow>
            ) : (
              ads.map((ad) => {
                const isActiveDate = new Date(ad.start_date) <= new Date() && (!ad.end_date || new Date(ad.end_date) >= new Date());
                const statusColor = ad.is_active && isActiveDate ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
                
                return (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 border">
                        <img src={ad.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{ad.title}</div>
                      {ad.link_url && (
                        <a href={ad.link_url} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                          <LinkIcon size={10} /> {ad.link_url}
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1 text-green-700">
                          <Calendar size={10} /> Del: {format(new Date(ad.start_date), 'dd/MM/yy HH:mm')}
                        </div>
                        {ad.end_date && (
                          <div className="flex items-center gap-1 text-red-700">
                            <Calendar size={10} /> Al: {format(new Date(ad.end_date), 'dd/MM/yy HH:mm')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={statusColor}>
                        {ad.is_active && isActiveDate ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1" title="Vistas"><Eye size={12}/> {ad.views}</span>
                        <span className="flex items-center gap-1" title="Clicks"><MousePointer2 size={12}/> {ad.clicks}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(ad)}><Edit className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(ad.id)}><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Anuncio' : 'Nuevo Anuncio'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nombre de la Campaña</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Promoción de Verano" />
            </div>
            
            <div className="space-y-2">
              <Label>Imagen (Cuadrada 1080x1080)</Label>
              {imageUrl ? (
                <div className="relative h-32 w-32 mx-auto rounded-md overflow-hidden border group">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button variant="destructive" size="sm" className="h-6 px-2 text-xs" onClick={() => setImageUrl('')}>Cambiar</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <MediaUploader onUploadComplete={(url) => setImageUrl(url)} folder="ads" className="h-32" />
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-border flex-1" />
                    <span className="text-xs text-muted-foreground font-medium">O generar con IA</span>
                    <div className="h-px bg-border flex-1" />
                  </div>
                  <AIImageGenerator 
                    initialPrompt={title ? `Banner publicitario moderno y atractivo para: ${title}` : ''}
                    context={title}
                    onImageGenerated={(url) => setImageUrl(url)}
                    trigger={
                      <Button variant="secondary" className="w-full gap-2 border-dashed border-2 border-purple-200">
                        <Sparkles className="h-4 w-4 text-purple-600" /> Crear Banner con IA
                      </Button>
                    }
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Enlace de Destino (Opcional)</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin (Opcional)</Label>
                <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
              <Label>Estado Activo</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ads;