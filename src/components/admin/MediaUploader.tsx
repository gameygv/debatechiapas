import React, { useState, useRef } from 'react';
import { Loader2, FileVideo, Image as ImageIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { uploadImageToStorage } from '@/lib/storage';

interface MediaUploaderProps {
  onUploadComplete?: (url: string, fileId: string) => void;
  className?: string;
  showTransferWarning?: boolean;
  folder?: string;
}

const MediaUploader = ({ onUploadComplete, className, showTransferWarning, folder = 'articles' }: MediaUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await validateAndUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Solución: Solo apagar el estado si realmente estamos saliendo del contenedor
    // (y no solo pasando sobre un elemento hijo)
    const related = e.relatedTarget as Node;
    const current = e.currentTarget as Node;
    
    // Si relatedTarget es null (salió de la ventana) o no está contenido en el elemento actual
    if (!related || !current.contains(related)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    // Extraer el archivo
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await validateAndUpload(file);
    }
  };

  const validateAndUpload = async (file: File) => {
    // Check types
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('Solo se permiten imágenes o videos.');
      return;
    }

    // Size limits (5MB image, 50MB video)
    const limit = isImage ? 5 : 50;
    if (file.size > limit * 1024 * 1024) {
      toast.error(`El archivo excede el límite de ${limit}MB.`);
      return;
    }

    if (isVideo) {
      toast.warning('Subiendo video. Esto puede tardar varios minutos.');
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 5));
      }, 500);

      // Upload to Supabase Storage with dynamic folder
      const result = await uploadImageToStorage(file, folder);
      
      clearInterval(progressInterval);
      setProgress(100);

      toast.success('Archivo subido correctamente');
      
      if (onUploadComplete) {
        onUploadComplete(result.url, result.id);
      }

      setTimeout(() => {
        setProgress(0);
        setIsUploading(false);
      }, 1000);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Error al subir archivo');
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer relative",
          isDragging 
            ? "border-primary bg-primary/10 ring-2 ring-primary/20 scale-[0.99]" 
            : "border-gray-300 hover:bg-gray-50 hover:border-gray-400",
          isUploading && "pointer-events-none opacity-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          accept="image/*,video/*" 
          onChange={handleFileSelect} 
          className="hidden" 
          ref={fileInputRef}
          disabled={isUploading}
        />
        
        {!isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <ImageIcon size={20} />
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <FileVideo size={20} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Haz clic o arrastra archivos aquí</p>
              <p className="text-xs text-muted-foreground mt-1">
                Destino: <strong>/{folder}</strong>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="w-full max-w-xs space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subiendo...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        )}
        
        {isDragging && (
           <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-lg backdrop-blur-sm">
             <p className="text-primary font-bold text-lg">¡Suelta para subir!</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default MediaUploader;