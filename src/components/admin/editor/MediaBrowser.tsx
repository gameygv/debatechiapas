import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon, Search, Loader2, Sparkles, FileVideo } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MediaUploader from '../MediaUploader';
import AIImageGenerator from '../AIImageGenerator';
import { toast } from 'sonner';

interface MediaFile {
  id: string;
  filename: string;
  original_url: string;
  sftp_url: string | null;
  created_at: string;
  file_type: string;
}

interface MediaBrowserProps {
  onSelect: (url: string, type: 'image' | 'video') => void;
  trigger?: React.ReactNode;
}

const MediaBrowser = ({ onSelect, trigger }: MediaBrowserProps) => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('library');

  const fetchFiles = async () => {
    setLoading(true);
    // Aumentamos a 1000 para consistencia con la página principal
    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (data) setFiles(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open && activeTab === 'library') fetchFiles();
  }, [open, activeTab]);

  const handleSelect = (file: MediaFile) => {
    const url = file.original_url;
    let type: 'image' | 'video' = (file.file_type === 'video' || file.filename.match(/\.(mp4|webm|mov)$/i)) ? 'video' : 'image';

    onSelect(url, type);
    setOpen(false);
  };

  const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <ImageIcon className="mr-2 h-4 w-4" /> Insertar Multimedia
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">Biblioteca de Medios Completa</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mb-4">
            <TabsTrigger value="library">Biblioteca</TabsTrigger>
            <TabsTrigger value="upload">Subir Nuevo</TabsTrigger>
            <TabsTrigger value="ai" className="gap-2"><Sparkles size={14} /> Generar con IA</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 overflow-hidden flex flex-col mt-0">
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar por nombre..." 
                className="pl-9 h-11" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="overflow-y-auto flex-1 pr-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Cargando biblioteca...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredFiles.map((file) => {
                    const isVideo = file.file_type === 'video' || file.filename.match(/\.(mp4|webm|mov)$/i);
                    const displayUrl = file.original_url;
                    
                    return (
                      <div 
                        key={file.id} 
                        className="group relative aspect-square border rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary bg-gray-50 shadow-sm transition-all"
                        onClick={() => handleSelect(file)}
                      >
                        {isVideo ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                            <FileVideo size={48} className="mb-1" />
                            <span className="text-[10px] font-bold uppercase">Video</span>
                          </div>
                        ) : (
                          <img 
                            src={displayUrl} 
                            alt={file.filename} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = 'https://placehold.co/200x200?text=Error+Carga';
                            }}
                          />
                        )}
                        
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">Elegir</span>
                        </div>
                        
                        {file.original_url && (
                          <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" title="Sincronizado con FTP" />
                        )}
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-[10px] text-white truncate backdrop-blur-sm">
                          {file.filename}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-0 flex-1 flex items-center justify-center">
             <MediaUploader 
               className="w-full max-w-xl"
               onUploadComplete={async (url, fileId) => {
                 const { data } = await supabase.from('media_files').select('*').eq('id', fileId).single();
                 if (data) handleSelect(data);
                 else setActiveTab('library');
               }} 
             />
          </TabsContent>

          <TabsContent value="ai" className="mt-0 flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md border-dashed">
              <CardContent className="p-10 text-center space-y-4">
                 <div className="h-16 w-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles size={32} />
                 </div>
                 <h3 className="text-lg font-serif font-bold">Generador de Imágenes IA</h3>
                 <AIImageGenerator 
                    onImageGenerated={(url) => {
                        onSelect(url, 'image');
                        setOpen(false);
                    }}
                    trigger={<Button className="w-full bg-purple-600 hover:bg-purple-700">Crear Imagen Ahora</Button>}
                 />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MediaBrowser;