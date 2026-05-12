import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search as SearchIcon, Calendar, ArrowRight, Newspaper } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdCard from '@/components/AdCard';
import { toast } from 'sonner';
import type { DbArticle, DbAd } from '@/lib/types';

type SearchResultItem = (DbArticle & { type: 'article' }) | (DbAd & { type: 'ad' });

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(query);
  const [mixedResults, setMixedResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultCount, setResultCount] = useState(0);

  useEffect(() => {
    setSearchTerm(query);
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (text: string) => {
    setLoading(true);
    setMixedResults([]);
    
    try {
      // 1. Fetch Articles
      const { data: articles, count, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
          published_at,
          article_categories (
            categories (name)
          )
        `, { count: 'exact' })
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .or(`title.ilike.%${text}%,excerpt.ilike.%${text}%`)
        .order('published_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setResultCount(count || 0);

      // 2. Fetch Ads
      const { data: ads } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

      // 3. Mix Content
      const content = (articles || []).map(a => ({ type: 'article', ...a }));
      const availableAds = ads || [];

      if (availableAds.length > 0 && content.length > 0) {
        // Insert ads at index 2 and 6
        if (content.length > 2) {
          content.splice(2, 0, { type: 'ad', ...availableAds[0 % availableAds.length] });
        }
        if (content.length > 6) {
          content.splice(6, 0, { type: 'ad', ...availableAds[1 % availableAds.length] });
        }
      }

      setMixedResults(content);

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm });
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] font-serif flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-[1000px]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Resultados de búsqueda
          </h1>
          
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex gap-2">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar noticias..."
                className="pl-10 h-12 text-lg bg-white"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-6">
              Buscar
            </Button>
          </form>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {query && (
              <p className="text-muted-foreground mb-6">
                Se encontraron <strong>{resultCount}</strong> resultados para "{query}"
              </p>
            )}

            {mixedResults.length === 0 && query ? (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                <SearchIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-xl font-medium text-gray-900">No se encontraron resultados</h3>
                <p className="text-gray-500 mt-1">Intenta con otras palabras clave.</p>
              </div>
            ) : (
              mixedResults.map((item, idx) => {
                if (item.type === 'ad') {
                  return (
                    <div key={`ad-${item.id}-${idx}`} className="py-4">
                      <div className="max-w-xs mx-auto md:max-w-md h-64 md:h-80">
                        <AdCard ad={item} className="shadow-md" />
                      </div>
                    </div>
                  );
                }

                const article = item;
                return (
                  <article key={article.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-48 h-32 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                      {article.featured_image ? (
                        <img 
                          src={article.featured_image} 
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <Newspaper className="text-gray-400" size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2 text-xs">
                        {article.article_categories?.[0] && (
                          <span className="font-bold text-primary uppercase tracking-wider">
                            {article.article_categories[0].categories.name}
                          </span>
                        )}
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          {format(new Date(article.published_at), "d MMM yyyy", { locale: es })}
                        </span>
                      </div>
                      <Link to={`/noticias/${article.slug}`} className="group">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h2>
                      </Link>
                      <p className="text-gray-600 font-sans text-sm line-clamp-2 mb-3">
                        {article.excerpt}
                      </p>
                      <Link to={`/noticias/${article.slug}`} className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                        Leer nota completa <ArrowRight size={14} className="ml-1" />
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SearchResults;