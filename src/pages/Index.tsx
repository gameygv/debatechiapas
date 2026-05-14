import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Newspaper } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { ArticleGridSkeleton } from '@/components/ArticleSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import HomeBanners from '@/components/HomeBanners';
import DailyEdition from '@/components/DailyEdition';
import AdBlock from '@/components/AdBlock';
import { toast } from 'sonner';
import type { ArticleListItem } from '@/lib/types';
import { ARTICLES_PER_PAGE } from '@/lib/constants';

interface MappedArticle {
  type: 'article';
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: string | null;
  category: { name: string; slug?: string };
}

const Index = () => {
  const { slug } = useParams();
  const [articles, setArticles] = useState<MappedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setCurrentPage(1);
    fetchContent(1, cancelled);
    return () => { cancelled = true; };
  }, [slug]);

  const fetchContent = async (page: number, cancelled = false) => {
    setLoading(true);
    
    try {
      // 1. Fetch Articles
      let query = supabase
        .from('articles')
        .select(`
          *,
          article_categories!inner (
            categories!inner (
              name,
              slug
            )
          )
        `, { count: 'exact' }) 
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString()) 
        .order('published_at', { ascending: false });
      
      if (slug) {
        query = query.eq('article_categories.categories.slug', slug);
      }

      const from = (page - 1) * ARTICLES_PER_PAGE;
      const to = page * ARTICLES_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      // 2. Process Content
      if (cancelled) return;
      if (data) {
        const mappedArticles = data.map((a: ArticleListItem) => {
          const cats = (a.article_categories || []).map(ac => ac.categories);
          const displayCategory = slug ? cats.find(c => c.slug === slug) : cats[0];
          return {
            type: 'article',
            id: a.id,
            title: a.title,
            slug: a.slug,
            excerpt: a.excerpt,
            featuredImage: a.featured_image,
            publishedAt: a.published_at,
            category: displayCategory || { name: 'General' },
          };
        });
        
        setArticles(mappedArticles);
        setTotalArticles(count || 0);
        setTotalPages(Math.ceil((count || 0) / ARTICLES_PER_PAGE));

        if (slug) {
           if (data.length > 0) {
             const firstArt = data[0];
             const matchingCat = (firstArt as ArticleListItem).article_categories?.find(ac => ac.categories.slug === slug);
             if (matchingCat) setCategoryName(matchingCat.categories.name);
           } else {
             const { data: cat } = await supabase.from('categories').select('name').eq('slug', slug).single();
             if (cat) setCategoryName(cat.name);
           }
        } else {
          setCategoryName(null);
        }
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Error al cargar el contenido');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchContent(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#eaeaea] font-serif flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-[1400px]">
        
        {slug && categoryName && (
           <div className="mb-8 pb-4 border-b border-gray-200">
             <h1 className="text-4xl font-bold text-primary">{categoryName}</h1>
             <p className="text-muted-foreground mt-2">{totalArticles} artículos encontrados</p>
           </div>
        )}

        {!slug && (
          <div className="mb-8 pb-4 border-b border-gray-200">
            <h1 className="text-4xl font-bold text-gray-900">Últimas Noticias</h1>
            <p className="text-muted-foreground mt-2">Mantente informado con las últimas noticias</p>
          </div>
        )}

        {loading ? (
          <ArticleGridSkeleton count={6} />
        ) : articles.length === 0 ? (
          <div className="h-[50vh] flex items-center justify-center flex-col gap-4 text-center">
            <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <Newspaper className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">No hay noticias en esta sección</h2>
            <p className="text-muted-foreground font-sans max-w-md">
              Estamos trabajando en nuevo contenido. Vuelve pronto.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-12">
              {articles.map((article) => (
                <article key={article.id} className="bg-white shadow-sm overflow-hidden hover:shadow-lg transition-shadow group">
                  <Link to={`/noticias/${article.slug}`} className="block">
                    <div className="aspect-[3/4] overflow-hidden bg-gray-200">
                      {article.featuredImage ? (
                        <img
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x800?text=Sin+Imagen'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          <Newspaper className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h2 className="text-base font-bold leading-snug mb-2 group-hover:text-[#fe4641] transition-colors line-clamp-3 font-sans">
                        {article.title}
                      </h2>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#4caf50] uppercase tracking-wide">
                          {article.category.name}
                        </span>
                        <span className="text-xs text-gray-400 font-sans">
                          {format(new Date(article.publishedAt), "MMM d, yyyy", { locale: es })}
                        </span>
                      </div>

                      <span className="text-xs text-[#fe4641] font-semibold mt-2 inline-block group-hover:underline">
                        Leer mas
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-8">
                <Button 
                  variant="outline" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm">Página {currentPage} de {totalPages}</span>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
        
        {/* Daily Edition */}
        {!slug && <DailyEdition />}

        {/* Ad Block before Banners/Footer */}
        <AdBlock className="my-8" position="home" />

        {/* Banners Verticales (Solo en Home) */}
        {!slug && <HomeBanners />}
      </main>

      <MadeWithDyad />
      <Footer />
    </div>
  );
};

export default Index;