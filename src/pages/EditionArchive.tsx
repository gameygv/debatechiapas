import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Newspaper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DbDailyEdition } from '@/lib/types';

const EDITIONS_PER_PAGE = 12;

const EditionArchive = () => {
  const [editions, setEditions] = useState<DbDailyEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEditions(1);
  }, []);

  const fetchEditions = async (page: number) => {
    setLoading(true);
    const from = (page - 1) * EDITIONS_PER_PAGE;
    const to = page * EDITIONS_PER_PAGE - 1;

    const { data, count } = await supabase
      .from('daily_editions')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('edition_date', { ascending: false })
      .range(from, to);

    if (data) {
      setEditions(data);
      setTotalPages(Math.ceil((count || 0) / EDITIONS_PER_PAGE));
    }
    setLoading(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchEditions(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] font-serif flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-[1400px]">
        <div className="mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-4xl font-bold text-gray-900">Ediciones Anteriores</h1>
          <p className="text-muted-foreground mt-2">Archivo completo de ediciones del periodico</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : editions.length === 0 ? (
          <div className="h-[50vh] flex items-center justify-center flex-col gap-4 text-center">
            <Newspaper className="h-16 w-16 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-800">No hay ediciones disponibles</h2>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-12">
              {editions.map((edition) => {
                const editionDate = new Date(edition.edition_date + 'T12:00:00');
                return (
                  <Link
                    key={edition.id}
                    to={`/edicion/${edition.id}`}
                    className="group block"
                  >
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-200 shadow-sm mb-3">
                      {edition.cover_image_url ? (
                        <img
                          src={edition.cover_image_url}
                          alt={edition.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <Newspaper className="h-12 w-12 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-1">
                      {edition.title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-sans">
                      {format(editionDate, "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-8">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm">Pagina {currentPage} de {totalPages}</span>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EditionArchive;
