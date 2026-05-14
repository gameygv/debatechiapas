import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Newspaper, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DbDailyEdition } from '@/lib/types';

const DailyEditions = () => {
  const [editions, setEditions] = useState<DbDailyEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DbDailyEdition | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [editionDate, setEditionDate] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState('');
  const [existingCoverUrl, setExistingCoverUrl] = useState('');

  useEffect(() => {
    fetchEditions();
  }, []);

  const fetchEditions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('daily_editions')
      .select('*')
      .order('edition_date', { ascending: false });

    if (data) setEditions(data);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setEditionDate('');
    setPdfFile(null);
    setCoverFile(null);
    setExistingPdfUrl('');
    setExistingCoverUrl('');
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (edition: DbDailyEdition) => {
    setEditing(edition);
    setTitle(edition.title);
    setEditionDate(edition.edition_date);
    setExistingPdfUrl(edition.pdf_url);
    setExistingCoverUrl(edition.cover_image_url || '');
    setDialogOpen(true);
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(filename, file);
    if (error) throw error;
    const { data } = supabase.storage.from('media').getPublicUrl(filename);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!title || !editionDate) {
      toast.error('Titulo y fecha son obligatorios');
      return;
    }

    if (!editing && !pdfFile) {
      toast.error('Selecciona un archivo PDF');
      return;
    }

    setSaving(true);
    try {
      let pdfUrl = existingPdfUrl;
      let coverUrl = existingCoverUrl;

      if (pdfFile) {
        pdfUrl = await uploadFile(pdfFile, 'editions');
      }
      if (coverFile) {
        coverUrl = await uploadFile(coverFile, 'editions/covers');
      }

      const record = {
        title,
        edition_date: editionDate,
        pdf_url: pdfUrl,
        cover_image_url: coverUrl || null,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const { error } = await supabase
          .from('daily_editions')
          .update(record)
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Edicion actualizada');
      } else {
        const { error } = await supabase
          .from('daily_editions')
          .insert(record);
        if (error) throw error;
        toast.success('Edicion creada');
      }

      setDialogOpen(false);
      resetForm();
      fetchEditions();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar esta edicion?')) return;
    const { error } = await supabase.from('daily_editions').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Edicion eliminada');
      fetchEditions();
    }
  };

  const toggleActive = async (edition: DbDailyEdition) => {
    const { error } = await supabase
      .from('daily_editions')
      .update({ is_active: !edition.is_active })
      .eq('id', edition.id);

    if (!error) {
      setEditions(prev => prev.map(e => e.id === edition.id ? { ...e, is_active: !e.is_active } : e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ediciones Diarias</h1>
          <p className="text-muted-foreground mt-1">Gestiona las ediciones del periodico en PDF</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-[#fe4641] hover:bg-[#e03e3a]">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Edicion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Edicion' : 'Nueva Edicion'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Titulo</Label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Debate Chiapas miercoles 14 de mayo del 2026"
                />
              </div>
              <div>
                <Label>Fecha de edicion</Label>
                <Input
                  type="date"
                  value={editionDate}
                  onChange={e => setEditionDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Archivo PDF {editing && '(dejar vacio para mantener)'}</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={e => setPdfFile(e.target.files?.[0] || null)}
                />
                {existingPdfUrl && !pdfFile && (
                  <p className="text-xs text-muted-foreground mt-1">PDF actual cargado</p>
                )}
              </div>
              <div>
                <Label>Imagen de portada (opcional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={e => setCoverFile(e.target.files?.[0] || null)}
                />
                {existingCoverUrl && !coverFile && (
                  <img src={existingCoverUrl} alt="Portada" className="mt-2 h-32 object-contain rounded" />
                )}
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-[#fe4641] hover:bg-[#e03e3a]">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? 'Guardar cambios' : 'Crear edicion'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : editions.length === 0 ? (
        <div className="text-center py-20">
          <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No hay ediciones</h2>
          <p className="text-muted-foreground">Sube la primera edicion del periodico</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium text-sm">Portada</th>
                <th className="text-left p-3 font-medium text-sm">Titulo</th>
                <th className="text-left p-3 font-medium text-sm">Fecha</th>
                <th className="text-center p-3 font-medium text-sm">Activa</th>
                <th className="text-right p-3 font-medium text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {editions.map(edition => {
                const edDate = new Date(edition.edition_date + 'T12:00:00');
                return (
                  <tr key={edition.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      {edition.cover_image_url ? (
                        <img src={edition.cover_image_url} alt="" className="h-16 w-12 object-cover rounded" />
                      ) : (
                        <div className="h-16 w-12 bg-muted rounded flex items-center justify-center">
                          <Newspaper className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-sm">{edition.title}</p>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {format(edDate, "d MMM yyyy", { locale: es })}
                    </td>
                    <td className="p-3 text-center">
                      <Switch
                        checked={edition.is_active}
                        onCheckedChange={() => toggleActive(edition)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <a href={`/edicion/${edition.id}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(edition)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(edition.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DailyEditions;
