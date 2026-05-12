import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Image as ImageIcon, 
  Film, 
  Loader2, 
  ExternalLink, 
  Trash2,
  Calendar,
  Cloud,
  Server,
  LayoutTemplate,
  Megaphone,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import MediaUploader from '@/components/admin/MediaUploader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MediaFile {
  id: string;
  filename: string;
  original_url: string;
  sftp_url: string | null;
  file_type: string;
  folder: string;
  size_bytes: number;
  transferred_at: string | null;
  created_at: string;
  created_by: string | null;
}

const MediaLibrary = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error('Error fetching files:', error);
      toast.error('Error al cargar archivos');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMaster = async () => {
    setSyncing(true);
    toast.info("Escaneando FTP y Artículos para recuperar medios...");
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-media-refs');
      if (error) throw error;
      
      if (data.totalAdded > 0) {
          toast.success(`¡Sincronización exitosa! Se añadieron ${data.addedFromFtp} archivos del FTP y ${data.addedFromPosts} de los posts.`);
      } else {
          toast.success("Tu biblioteca ya está al día con el servidor.");
      }
      fetchFiles();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    toast.info("Verificando que los archivos existan físicamente en el FTP...");
    
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-ghost-media');
      if (error) throw error;
      
      if (data.removedCount > 0) {
        toast.success(`Se eliminaron ${data.removedCount} registros fantasma de la biblioteca.`);
      } else {
        toast.success("Todos los archivos en la biblioteca están presentes en el servidor.");
      }
      fetchFiles();
    } catch (error: any) {
      toast.error("Error verificando integridad: " + error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm('¿Estás seguro de eliminar este archivo? Esta acción no se puede deshacer.')) return;

    try {
      const filePath = `${file.folder}/${file.filename}`;
      
      await supabase.storage.from('media').remove([filePath]);

      await supabase.from('media_files').delete().eq('id', file.id);
      toast.success('Archivo eliminado');
      fetchFiles();
    } catch (error: any) {
      toast.error('Error al eliminar');
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes || bytes <= 0) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (Math.round(bytes / Math.pow(k, i) * 100) / 100) + ' ' + (sizes[i] || 'B');
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = (file.filename || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedTab === 'all') return matchesSearch;
    if (selectedTab === 'images') return matchesSearch && file.file_type === 'image';
    if (selectedTab === 'videos') return matchesSearch && file.file_type === 'video';
    if (selectedTab === 'articles') return matchesSearch && file.folder === 'articles';
    if (selectedTab === 'ai') return matchesSearch && file.folder === 'ai-generated';
    if (selectedTab === 'banners') return matchesSearch && file.folder === 'banners';
    if (selectedTab === 'ads') return matchesSearch && file.folder === 'ads';
    return matchesSearch;
  });

  const counts = {
    all: files.length,
    images: files.filter(f => f.file_type === 'image').length,
    ai: files.filter(f => f.folder === 'ai-generated').length,
    videos: files.filter(f => f.file_type === 'video').length,
    articles: files.filter(f => f.folder === 'articles').length,
    banners: files.filter(f => f.folder === 'banners').length,
    ads: files.filter(f => f.folder === 'ads').length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900">Biblioteca de Medios</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus archivos multimedia (Últimos 1000)</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <Button 
                onClick={handleVerifyIntegrity} 
                variant="outline" 
                disabled={verifying}
                className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                title="Borra registros de la biblioteca que no existen físicamente en el FTP"
            >
                {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Integridad
            </Button>
            <Button 
                onClick={handleSyncMaster} 
                variant="secondary" 
                disabled={syncing}
                className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                title="Escanea el FTP y Posts para añadir archivos faltantes a la biblioteca"
            >
                {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Sincronización Total
            </Button>
            <Button onClick={fetchFiles} variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <div className="lg:col-span-12">
         <MediaUploader className="bg-white" onUploadComplete={() => fetchFiles()} />
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Buscar archivo..." 
              className="pl-9 h-11" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-2">
            <TabsTrigger value="all">Todos ({counts.all})</TabsTrigger>
            <TabsTrigger value="images"><ImageIcon className="mr-2 h-4 w-4" /> Imágenes ({counts.images})</TabsTrigger>
            <TabsTrigger value="ads"><Megaphone className="mr-2 h-4 w-4" /> Anuncios ({counts.ads})</TabsTrigger>
            <TabsTrigger value="banners"><LayoutTemplate className="mr-2 h-4 w-4" /> Banners ({counts.banners})</TabsTrigger>
            <TabsTrigger value="ai"><Server className="mr-2 h-4 w-4" /> IA ({counts.ai})</TabsTrigger>
            <TabsTrigger value="videos"><Film className="mr-2 h-4 w-4" /> Videos ({counts.videos})</TabsTrigger>
            <TabsTrigger value="articles"><Server className="mr-2 h-4 w-4" /> Artículos ({counts.articles})</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay archivos aquí</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="h-16 w-16 rounded overflow-hidden bg-muted flex-shrink-0 border">
                      {file.file_type === 'image' ? (
                        <img src={file.original_url} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100?text=Error'; }} />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-slate-900 text-white"><Film className="h-6 w-6" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.filename}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-[10px]">{file.folder}</Badge>
                        {file.transferred_at ? <Badge className="text-[10px] bg-green-100 text-green-800 border-green-200">SFTP</Badge> : <Badge variant="secondary" className="text-[10px]">Supabase</Badge>}
                        <span>{formatFileSize(file.size_bytes)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" asChild><a href={file.original_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(file)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MediaLibrary;