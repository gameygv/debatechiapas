import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  id: string;
  url: string;
  path: string;
  needsTransfer: boolean;
}

/**
 * Convierte un archivo de imagen a formato WebP y lo redimensiona a máx 1080px de ancho
 */
async function convertImageToWebP(file: File): Promise<File> {
  // Si no es imagen, retornar original (ej. videos)
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      // Liberar memoria del object URL
      URL.revokeObjectURL(objectUrl);

      // Calcular nuevas dimensiones (Max Ancho: 1080px)
      const MAX_WIDTH = 1080;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Could not convert to WebP'));
          return;
        }
        // Crear nuevo archivo WebP
        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
          type: 'image/webp',
          lastModified: Date.now(),
        });
        resolve(newFile);
      }, 'image/webp', 0.85); // 85% calidad
    };
    
    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };
    
    img.src = objectUrl;
  });
}

/**
 * Sube una imagen o video a Supabase Storage y la registra en la base de datos
 */
export async function uploadImageToStorage(
  file: File,
  folder: string = 'articles'
): Promise<UploadResult> {
  try {
    // Convertir a WebP y Redimensionar si es imagen
    const isImage = file.type.startsWith('image/');
    const finalFile = isImage ? await convertImageToWebP(file) : file;
    
    // Determinar extensión y tipo
    const fileExt = finalFile.name.split('.').pop();
    const fileType = file.type.startsWith('video/') ? 'video' : 'image';

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, finalFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: finalFile.type
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Register in database
    const { data: mediaFile, error: dbError } = await supabase
      .from('media_files')
      .insert({
        filename: fileName,
        original_url: publicUrl,
        file_type: fileType,
        folder: folder,
        size_bytes: finalFile.size,
        created_by: user?.id
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return {
      id: mediaFile.id,
      url: publicUrl,
      path: filePath,
      needsTransfer: true
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Descarga una imagen desde una URL y la sube a Supabase Storage
 */
export async function downloadAndUploadImage(
  imageUrl: string,
  folder: string = 'articles'
): Promise<UploadResult> {
  try {
    console.log('Downloading image from:', imageUrl);
    
    // Download image with proper headers
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageDownloader/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Validate that we got an image
    if (!blob.type.startsWith('image/')) {
      throw new Error(`Downloaded file is not an image: ${blob.type}`);
    }

    const file = new File([blob], 'ai-generated-image.jpg', { type: blob.type });

    console.log('Image downloaded successfully, uploading to storage...');

    // Upload to storage (automatically converts to WebP and Resizes)
    return await uploadImageToStorage(file, folder);
  } catch (error) {
    console.error('Error downloading and uploading image:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

/**
 * Obtiene la URL actual de un archivo
 */
export async function getMediaUrl(fileId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('media_files')
      .select('original_url')
      .eq('id', fileId)
      .single();

    if (error) throw error;

    return data.original_url;
  } catch (error) {
    console.error('Error getting media URL:', error);
    throw error;
  }
}

/**
 * Lista todas las imágenes que necesitan ser transferidas a SFTP
 */
export async function listPendingTransfers() {
  try {
    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .is('transferred_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error listing pending transfers:', error);
    return [];
  }
}

