import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DbDailyEdition } from '@/lib/types';

const DailyEdition = () => {
  const [edition, setEdition] = useState<DbDailyEdition | null>(null);

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase
        .from('daily_editions')
        .select('*')
        .eq('is_active', true)
        .order('edition_date', { ascending: false })
        .limit(1)
        .single();

      if (data) setEdition(data);
    };
    fetchLatest();
  }, []);

  if (!edition) return null;

  const editionDate = new Date(edition.edition_date + 'T12:00:00');

  return (
    <section className="my-12 rounded-xl overflow-hidden shadow-lg border border-gray-200">
      <div className="bg-[#1a1a1a] text-white">
        <div className="flex flex-col md:flex-row">
          {/* Cover Image */}
          <div className="md:w-1/3 relative">
            {edition.cover_image_url ? (
              <img
                src={edition.cover_image_url}
                alt={edition.title}
                className="w-full h-64 md:h-full object-cover"
              />
            ) : (
              <div className="w-full h-64 md:h-full bg-gray-800 flex items-center justify-center">
                <Newspaper className="h-20 w-20 text-gray-600" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="md:w-2/3 p-8 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-[#fe4641] text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">
                Edicion del dia
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold font-serif mb-2">
              {edition.title}
            </h2>

            <p className="text-gray-400 mb-6 font-sans">
              {format(editionDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
              {edition.page_count && ` — ${edition.page_count} paginas`}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to={`/edicion/${edition.id}`}>
                <Button className="bg-[#fe4641] hover:bg-[#e03e3a] text-white font-bold px-6">
                  <Newspaper className="mr-2 h-4 w-4" />
                  Leer edicion completa
                </Button>
              </Link>

              <Link to="/ediciones">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-white/10 hover:text-white">
                  Ver ediciones anteriores
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DailyEdition;
