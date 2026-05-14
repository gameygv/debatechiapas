import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DbDailyEdition } from '@/lib/types';
import HTMLFlipBook from 'react-pageflip';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PageProps {
  pageImage: string;
  pageNumber: number;
}

const Page = React.forwardRef<HTMLDivElement, PageProps>(({ pageImage, pageNumber }, ref) => (
  <div ref={ref} className="bg-white shadow-md">
    <img src={pageImage} alt={`Pagina ${pageNumber}`} className="w-full h-full object-contain" />
  </div>
));
Page.displayName = 'Page';

const EditionViewer = () => {
  const { id } = useParams<{ id: string }>();
  const [edition, setEdition] = useState<DbDailyEdition | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const flipBookRef = useRef<any>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchEdition = async () => {
      const { data } = await supabase
        .from('daily_editions')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setEdition(data);
        loadPdf(data.pdf_url);
      }
      setLoading(false);
    };
    fetchEdition();
  }, [id]);

  const loadPdf = useCallback(async (url: string) => {
    setLoadingPdf(true);
    try {
      const pdf = await pdfjsLib.getDocument(url).promise;
      const numPages = pdf.numPages;
      setTotalPages(numPages);

      const pageImages: string[] = [];
      const scale = isMobile ? 1.5 : 2;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        pageImages.push(canvas.toDataURL('image/jpeg', 0.85));
      }

      setPages(pageImages);
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      setPdfError(err?.message || 'Error al cargar el PDF');
    }
    setLoadingPdf(false);
  }, [isMobile]);

  const handleFlip = (e: any) => {
    setCurrentPage(e.data);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Edicion no encontrada</h1>
            <Link to="/ediciones">
              <Button variant="outline">Ver todas las ediciones</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const editionDate = new Date(edition.edition_date + 'T12:00:00');
  const pageWidth = isMobile ? window.innerWidth - 32 : 500;
  const pageHeight = Math.round(pageWidth * 1.3);

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <Header />

      <main className="flex-grow flex flex-col items-center py-6 px-4">
        {/* Title Bar */}
        <div className="w-full max-w-4xl flex flex-wrap items-center justify-between mb-4 gap-2">
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
            <a href={edition.pdf_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-white/10">
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </a>
          </div>
        </div>

        {/* Flipbook */}
        {pdfError ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{pdfError}</p>
            <a href={edition.pdf_url} target="_blank" rel="noopener noreferrer" className="text-[#fe4641] underline">
              Descargar PDF directamente
            </a>
          </div>
        ) : loadingPdf ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#fe4641]" />
            <p className="text-gray-400 font-sans">Cargando edicion...</p>
          </div>
        ) : pages.length > 0 ? (
          <div className="flex flex-col items-center">
            {/* @ts-ignore - react-pageflip types */}
            <HTMLFlipBook
              ref={flipBookRef}
              width={pageWidth}
              height={pageHeight}
              size="stretch"
              minWidth={300}
              maxWidth={600}
              minHeight={400}
              maxHeight={800}
              showCover={true}
              onFlip={handleFlip}
              className="shadow-2xl"
              usePortrait={isMobile}
              mobileScrollSupport={true}
              flippingTime={600}
              maxShadowOpacity={0.5}
            >
              {pages.map((img, i) => (
                <Page key={i} pageImage={img} pageNumber={i + 1} />
              ))}
            </HTMLFlipBook>

            {/* Controls */}
            <div className="flex items-center gap-4 mt-6">
              <Button
                variant="outline"
                size="icon"
                className="border-gray-600 text-gray-300 hover:bg-white/10"
                onClick={() => flipBookRef.current?.pageFlip()?.flipPrev()}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <span className="text-gray-400 text-sm font-sans min-w-[120px] text-center">
                Pagina {currentPage + 1} de {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                className="border-gray-600 text-gray-300 hover:bg-white/10"
                onClick={() => flipBookRef.current?.pageFlip()?.flipNext()}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 py-20 text-center">
            <p>No se pudo cargar el PDF.</p>
            <a href={edition.pdf_url} target="_blank" rel="noopener noreferrer" className="text-[#fe4641] underline mt-2 inline-block">
              Descargar PDF directamente
            </a>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EditionViewer;
