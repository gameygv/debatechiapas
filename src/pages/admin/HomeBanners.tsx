import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit, Link as LinkIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import MediaUploader from '@/components/admin/MediaUploader';
import MediaBrowser from '@/components/admin/editor/MediaBrowser';
import { toast } from 'sonner';

interface Banner {
  id?: string;
  position: number;
  image_url: string;
  link_url: string | null;
}

const POSITIONS = [1, 2, 3, 4, 5, 6];

const HomeBanners = () => {
  const [banners, setBanners] = useState<Record<number, Banner>>({});
  const [loading, setLoading] = useState(true);
  const [editingPosition, setEditingPosition] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data } = await supabase.from('home_banners').select('*');
    if (data) {
      const bannerMap: Record<number, Banner> = {};
      data.forEach((b: Banner) => {
        bannerMap[b.position] = b;
      });
      setBanners(bannerMap);
    }
    setLoading(false);
  };

  const handleEdit = (pos: number) => {
    setEditingPosition(pos);
    const banner = banners[pos];
    setImageUrl(banner?.image_url || '');
    setLinkUrl(banner?.link_url || '');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!editingPosition || !imageUrl) {
      toast.error("La imagen es obligatoria");
      return;
    }

    setSaving(true);
    try {
      const banner = banners[editingPosition];
      
      if (banner?.id) {
        // Update
        await supabase
          .from('home_banners')
          .update({ image_url: imageUrl, link_url: linkUrl || null })
          .eq('id', banner.id);
      } else {
        // Insert
        await supabase
          .from('home_banners')
          .insert({ 
            position: editingPosition, 
            image_url: imageUrl, 
            link_url: linkUrl || null 
          });
      }
      
      toast.success("Banner actualizado");
      setOpen(false);
      fetchBanners();
    } catch (e) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pos: number) => {
    const banner = banners[pos];
    if (!banner?.id) return;
    
    if (!confirm("¿Eliminar este banner? Quedará el espacio vacío.")) return;

    try {
      await supabase.from('home_banners').delete().eq('id', banner.id);
      toast.success("Banner eliminado");
      fetchBanners();
    } catch (e) {
      toast.error("Error al eliminar");
    }
  };

  const onUpload = async (url: string) => {
    setImageUrl(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900">Banners Verticales (Home)</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona las 6 columnas publicitarias al final de la página de inicio.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {POSITIONS.map((pos) => {
            const banner = banners[pos];
            return (
              <Card key={pos} className={`relative group border-2 ${banner ? 'border-border' : 'border-dashed border-gray-300'}`}>
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
                  Posición {pos}
                </div>
                
                <CardContent className="p-0 aspect-[9/16] bg-gray-50 relative flex items-center justify-center overflow-hidden rounded-md">
                  {banner ? (
                    <>
                      <img src={banner.image_url} alt={`Banner ${pos}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(pos)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(pos)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </Button>
                        {banner.link_url && (
                          <div className="text-xs text-white mt-2 flex items-center gap-1 max-w-[90%] truncate">
                            <LinkIcon size={10} /> {banner.link_url}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 mb-4">Espacio Disponible</p>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(pos)}>
                        <Plus className="mr-2 h-4 w-4" /> Agregar Banner
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Banner - Posición {editingPosition}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Imagen (Vertical ~ 9:16)</Label>
              {imageUrl ? (
                <div className="relative aspect-[9/16] w-32 mx-auto rounded-md overflow-hidden border">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-1 right-1 h-6 w-6" 
                    onClick={() => setImageUrl('')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <MediaUploader 
                    onUploadComplete={onUpload} 
                    folder="banners"
                    className="h-32" 
                  />
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        O seleccionar existente
                      </span>
                    </div>
                  </div>

                  <MediaBrowser 
                    onSelect={setImageUrl}
                    trigger={
                      <Button variant="outline" className="w-full">
                        <ImageIcon className="mr-2 h-4 w-4" /> Abrir Biblioteca
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Enlace (Opcional)</Label>
              <Input 
                value={linkUrl} 
                onChange={(e) => setLinkUrl(e.target.value)} 
                placeholder="https://..." 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !imageUrl}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeBanners;