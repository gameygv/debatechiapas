import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DbDailyEdition } from '@/lib/types';

const EditionViewer = () => {
  const { id } = useParams<{ id: string }>();
  const [edition, setEdition] = useState<DbDailyEdition | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchEdition = async () => {
      const { data } = await supabase
        .from('daily_editions')
        .select('*')
        .eq('id', id)
        .single();
      if (data) setEdition(data);
      setLoading(false);
    };
    fetchEdition();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="min-h-screen bg-[#eaeaea] flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Edicion no encontrada</h1>
            <Link to="/ediciones"><Button variant="outline">Ver todas las ediciones</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const editionDate = new Date(edition.edition_date + 'T12:00:00');

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a]">
          <h2 className="text-white font-bold text-sm truncate">{edition.title}</h2>
          <div className="flex items-center gap-2">
            <a href={edition.pdf_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-white/10 text-xs">
                <Download className="h-3 w-3 mr-1" /> PDF
              </Button>
            </a>
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-white/10 text-xs"
              onClick={() => setFullscreen(false)}>
              <Minimize2 className="h-3 w-3 mr-1" /> Salir
            </Button>
          </div>
        </div>
        <iframe
          src={edition.pdf_url}
          className="flex-1 w-full border-0"
          title={edition.title}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <Header />

      <main className="flex-grow flex flex-col items-center py-6 px-4">
        <div className="w-full max-w-5xl flex flex-wrap items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-3">
            <Link to="/ediciones">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-white font-bold text-lg">{edition.title}</h1>
              <p className="text-gray-400 text-sm font-sans">
                {format(editionDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-white/10"
              onClick={() => setFullscreen(true)}>
              <Maximize2 className="h-4 w-4 mr-1" /> Pantalla completa
            </Button>
            <a href={edition.pdf_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-white/10">
                <Download className="h-4 w-4 mr-1" /> Descargar PDF
              </Button>
            </a>
          </div>
        </div>

        <div className="w-full max-w-6xl bg-white rounded-lg overflow-hidden shadow-2xl" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
          <iframe
            src={`${edition.pdf_url}#zoom=page-width&view=FitH`}
            className="w-full h-full border-0"
            title={edition.title}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditionViewer;
