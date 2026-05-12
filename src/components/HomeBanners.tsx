import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Banner {
  position: number;
  image_url: string;
  link_url: string | null;
}

const HomeBanners = () => {
  const [banners, setBanners] = useState<Record<number, Banner>>({});

  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase.from('home_banners').select('*');
      if (data) {
        const map: Record<number, Banner> = {};
        data.forEach((b: Banner) => {
          map[b.position] = b;
        });
        setBanners(map);
      }
    };
    fetchBanners();
  }, []);

  const renderBanner = (pos: number) => {
    const dbBanner = banners[pos];

    // Solo mostrar si existe en base de datos
    const img = dbBanner?.image_url;
    const link = dbBanner?.link_url;

    if (!img) return null;

    const content = (
      <img
        src={img}
        alt={`Banner ${pos}`}
        className="w-full h-auto rounded-sm shadow-sm hover:opacity-90 transition-opacity transform hover:scale-[1.01] duration-300"
      />
    );

    if (link) {
      return (
        <a href={link} target="_blank" rel="noopener noreferrer" className="block">
          {content}
        </a>
      );
    }

    return <div className="block">{content}</div>;
  };

  // Verificar si hay al menos un banner para mostrar la sección
  const hasBanners = Object.keys(banners).length > 0;

  if (!hasBanners) return null;

  return (
    <section className="container mx-auto px-4 py-12 mt-4 border-t">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Row 1 */}
        {renderBanner(1)}
        {renderBanner(2)}
        {renderBanner(3)}
        
        {/* Row 2 */}
        {renderBanner(4)}
        {renderBanner(5)}
        {renderBanner(6)}
      </div>
    </section>
  );
};

export default HomeBanners;