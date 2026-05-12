import React, { useEffect, useState } from 'react';
import { getMediaUrl } from '@/lib/storage';
import { Loader2 } from 'lucide-react';

interface MediaImageProps {
  fileId?: string;
  fallbackUrl?: string;
  alt: string;
  className?: string;
}

/**
 * Componente que muestra una imagen usando la URL correcta
 * (SFTP si está transferida, Supabase si no)
 */
const MediaImage = ({ fileId, fallbackUrl, alt, className }: MediaImageProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(fallbackUrl || null);
  const [loading, setLoading] = useState(!!fileId);

  useEffect(() => {
    if (fileId) {
      loadImageUrl();
    }
  }, [fileId]);

  const loadImageUrl = async () => {
    if (!fileId) return;
    
    try {
      const url = await getMediaUrl(fileId);
      setImageUrl(url);
    } catch (error) {
      console.error('Error loading image URL:', error);
      // Usar fallback si hay error
      if (fallbackUrl) {
        setImageUrl(fallbackUrl);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <span className="text-xs text-muted-foreground">Sin imagen</span>
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt}
      className={className}
    />
  );
};

export default MediaImage;