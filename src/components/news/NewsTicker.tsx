import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const NewsTicker = () => {
  const [news, setNews] = useState<{id: string, title: string, slug: string}[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      const { data } = await supabase
        .from('articles')
        .select('id, title, slug')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5);
      
      if (data) setNews(data);
    };
    fetchNews();
  }, []);

  if (news.length === 0) return null;

  return (
    <div className="bg-[#333333] text-white overflow-hidden py-3 border-b border-[#fe4641]/30 relative">
      <div className="container mx-auto px-4 flex items-center">
        <div className="bg-[#fe4641] text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded uppercase tracking-wider mr-4 z-10 whitespace-nowrap shadow-sm">
          Última Hora
        </div>
        <div className="flex-1 overflow-hidden relative h-6">
          <div className="absolute whitespace-nowrap animate-marquee flex gap-12 items-center h-full">
            {news.map((item) => (
              <Link 
                key={item.id} 
                to={`/noticias/${item.slug}`}
                className="text-xs md:text-sm font-medium hover:text-[#fe4641] transition-colors flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-[#fe4641] rounded-full inline-block"></span>
                {item.title}
              </Link>
            ))}
             {/* Duplicate for seamless loop */}
             {news.map((item) => (
              <Link 
                key={`dup-${item.id}`} 
                to={`/noticias/${item.slug}`}
                className="text-xs md:text-sm font-medium hover:text-[#fe4641] transition-colors flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-[#fe4641] rounded-full inline-block"></span>
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;