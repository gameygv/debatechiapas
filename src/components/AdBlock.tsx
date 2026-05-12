import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdCard from './AdCard';
import { Skeleton } from './ui/skeleton';

interface AdBlockProps {
  className?: string;
  position?: 'home' | 'article' | 'section';
}

const AdBlock = ({ className, position }: AdBlockProps) => {
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      setLoading(true);
      try {
        const { data: ads } = await supabase
          .from('ads')
          .select('*')
          .eq('is_active', true)
          .lte('start_date', new Date().toISOString())
          .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
          .limit(5);

        if (ads && ads.length > 0) {
          const randomAd = ads[Math.floor(Math.random() * ads.length)];
          setAd(randomAd);
        }
      } catch (error) {
        console.error('Error loading ad:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [position]);

  if (loading) {
    return (
      <div className={`w-full flex justify-center py-8 ${className}`}>
        <div className="w-full max-w-[350px] aspect-square rounded-lg overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    );
  }

  if (!ad) return null;

  return (
    <div className={`w-full flex justify-center py-8 ${className}`}>
      <div className="w-full max-w-[350px] aspect-square">
        <AdCard ad={ad} className="shadow-lg border-2 border-dashed border-gray-100" />
      </div>
    </div>
  );
};

export default AdBlock;