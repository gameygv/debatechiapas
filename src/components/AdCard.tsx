import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, X, ZoomIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface AdCardProps {
  ad: {
    id: string;
    title: string;
    image_url: string;
    link_url?: string;
  };
  className?: string;
}

const AdCard = ({ ad, className }: AdCardProps) => {
  const hasViewed = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Registrar vista solo una vez por montaje
    if (!hasViewed.current) {
      supabase.rpc('increment_ad_views', { ad_id: ad.id });
      hasViewed.current = true;
    }
  }, [ad.id]);

  const handleClick = async () => {
    // Registrar click siempre, ya sea enlace o lightbox
    supabase.rpc('increment_ad_clicks', { ad_id: ad.id });
  };

  const Content = () => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group h-full relative ${className || ''}`}>
      <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded z-10 font-sans uppercase tracking-widest pointer-events-none">
        Publicidad
      </div>
      
      <img 
        src={ad.image_url} 
        alt={ad.title} 
        className="w-full h-full object-cover aspect-square hover:scale-[1.02] transition-transform duration-500"
      />
      
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
         {ad.link_url ? (
           <ExternalLink className="text-white drop-shadow-md" />
         ) : (
           <ZoomIn className="text-white drop-shadow-md" />
         )}
      </div>
    </div>
  );

  // Caso 1: Tiene enlace externo
  if (ad.link_url) {
    return (
      <a 
        href={ad.link_url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block h-full relative cursor-pointer" 
        onClick={handleClick}
      >
        <Content />
      </a>
    );
  }

  // Caso 2: Sin enlace -> Lightbox
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={handleClick}>
        <div className="block h-full relative cursor-pointer">
          <Content />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
        <div className="relative">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
          >
            <X size={32} />
          </button>
          <img 
            src={ad.image_url} 
            alt={ad.title} 
            className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdCard;