import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { ArticleWithRelations, DbArticle } from '@/lib/types';
import { SITE_URL } from '@/lib/constants';
import { ArticleDetailSkeleton } from '@/components/ArticleSkeleton';
import { Button } from '@/components/ui/button';
import { Calendar, Facebook, Link as LinkIcon, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdBlock from '@/components/AdBlock';

// Componente reutilizable para los botones de compartir
const ShareButtons = ({ title, url, className = "", orientation = "vertical" }: { title: string, url: string, className?: string, orientation?: "vertical" | "horizontal" }) => {
  
  const handleShare = (platform: 'facebook' | 'twitter' | 'whatsapp' | 'copy') => {
    let shareLink = '';
    switch (platform) {
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
        window.open(shareLink, '_blank');
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(shareLink, '_blank', 'width=600,height=400');
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        window.open(shareLink, '_blank', 'width=600,height=400');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success('Enlace copiado al portapapeles');
        break;
    }
  };

  const containerClass = orientation === "vertical" 
    ? "flex flex-col gap-4 items-center" 
    : "flex flex-row gap-4 justify-center items-center flex-wrap";

  return (
    <div className={`${containerClass} ${className}`}>
      {orientation === "vertical" && <span className="text-xs font-bold font-sans uppercase text-gray-400">Compartir</span>}
      
      {/* 1. WhatsApp */}
      <Button onClick={() => handleShare('whatsapp')} className="rounded-full h-12 w-12 bg-[#25D366] hover:bg-[#25D366]/90 text-white shadow-md transition-transform hover:scale-110 p-0" title="WhatsApp" aria-label="Compartir en WhatsApp">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </Button>

      {/* 2. Facebook */}
      <Button onClick={() => handleShare('facebook')} className="rounded-full h-12 w-12 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white shadow-md transition-transform hover:scale-110" title="Facebook" aria-label="Compartir en Facebook">
        <Facebook size={20} className="stroke-none fill-current" />
      </Button>

      {/* 3. X (Twitter) - Updated Icon */}
      <Button onClick={() => handleShare('twitter')} className="rounded-full h-12 w-12 bg-black hover:bg-black/90 text-white shadow-md transition-transform hover:scale-110" title="X" aria-label="Compartir en X">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
      </Button>

      {/* 4. Copy Link */}
      <Button onClick={() => handleShare('copy')} className="rounded-full h-12 w-12 bg-gray-100 hover:bg-gray-200 text-gray-600 shadow-sm transition-transform hover:scale-110" title="Copiar enlace" aria-label="Copiar enlace">
        <LinkIcon size={20} />
      </Button>
    </div>
  );
};

const ArticleDetail = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState<ArticleWithRelations | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<DbArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchArticle = async () => {
      if (!slug) return;
      setLoading(true);
      window.scrollTo(0,0);
      const decodedSlug = decodeURIComponent(slug);

      // 1. Get Main Article
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          article_categories (
            category_id,
            categories (name, slug)
          )
        `)
        .eq('slug', decodedSlug)
        .maybeSingle();
      
      if (cancelled) return;
      if (!error && data) {
        setArticle(data);
        
        // 2. Get Related Articles
        const categoryId = data.article_categories?.[0]?.category_id;
        if (categoryId) {
          const { data: related } = await supabase
            .from('articles')
            .select(`
              id, title, slug, featured_image, published_at,
              article_categories!inner(category_id)
            `)
            .eq('article_categories.category_id', categoryId)
            .neq('id', data.id)
            .eq('status', 'published')
            .lte('published_at', new Date().toISOString())
            .order('published_at', { ascending: false })
            .limit(3);
          
          if (related) setRelatedArticles(related);
        }
      }
      setLoading(false);
    };

    fetchArticle();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <ArticleDetailSkeleton />
      </div>
    );
  }

  if (!article) return <Navigate to="/" replace />;

  const formattedDate = format(new Date(article.published_at), "d 'de' MMMM, yyyy", { locale: es });
  
  const shareUrl = `${SITE_URL}/noticias/${article.slug}`;
  const shareTitle = article.title;

  const categories = article.article_categories?.map(ac => ac.categories) || [];

  return (
    <div className="min-h-screen bg-white flex flex-col font-serif">
      <Helmet>
        <title>{article.title} - Debate Chiapas</title>
        <meta name="description" content={article.excerpt || article.title} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt || article.title} />
        <meta property="og:image" content={article.featured_image || `${SITE_URL}/debate-og.jpg`} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.excerpt || article.title} />
        <meta name="twitter:image" content={article.featured_image || `${SITE_URL}/debate-og.jpg`} />
      </Helmet>
      <Header />

      <main className="flex-grow">
        
        {/* Article Header */}
        <div className="container mx-auto px-4 pt-12 pb-8 max-w-4xl text-center">
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {categories.map((cat: any) => (
              <Link 
                key={cat.slug}
                to={`/categoria/${cat.slug}`}
                className="inline-block px-3 py-1 text-xs font-sans font-bold tracking-widest uppercase bg-gray-100 text-primary hover:bg-primary hover:text-white transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-gray-900">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="font-sans text-xl md:text-2xl text-gray-500 leading-relaxed mb-8">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 border-y border-gray-100 py-6 font-sans">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {article.featured_image && (
          <div className="container mx-auto px-4 mb-12 max-w-5xl">
            <div className="w-full overflow-hidden shadow-sm rounded-lg">
              <img 
                src={article.featured_image}
                alt={article.title}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        )}

        {/* Content Layout */}
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl">
          
          {/* Sticky Sidebar (Share) - DESKTOP ONLY */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-24 flex flex-col gap-8 items-center">
              
              <ShareButtons 
                title={shareTitle} 
                url={shareUrl} 
                orientation="vertical" 
              />
              
              {/* Eliminado Sidebar Ad */}
            </div>
          </div>

          {/* Main Content */}
          <article className="col-span-1 lg:col-span-8 pb-12">
            
            {/* Mobile Share Buttons - MOBILE ONLY */}
            <div className="lg:hidden mb-8 border-b pb-6">
              <p className="text-center text-xs font-bold font-sans uppercase text-gray-400 mb-4">Compartir noticia</p>
              <ShareButtons 
                title={shareTitle} 
                url={shareUrl} 
                orientation="horizontal" 
              />
            </div>

            <div 
              className="prose prose-lg prose-stone max-w-none 
                prose-headings:font-serif prose-headings:font-bold 
                prose-p:font-serif prose-p:text-gray-800 prose-p:leading-loose
                first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:font-serif
                img:rounded-lg img:mx-auto"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
            />

            {/* Bottom Ad (Mobile & Desktop) - Just Before Related News */}
            <AdBlock className="my-12" position="article" />

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-8 pt-12 border-t">
                <h3 className="text-2xl font-serif font-bold mb-8 text-gray-900">Noticias Relacionadas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedArticles.map((rel) => (
                    <Link key={rel.id} to={`/noticias/${rel.slug}`} className="group block">
                      <div className="aspect-[3/4] rounded-md overflow-hidden bg-gray-100 mb-3">
                        <img 
                          src={rel.featured_image || '/placeholder.svg'} 
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <h4 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                        {rel.title}
                      </h4>
                      <div className="mt-2 text-primary text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Leer más <ArrowRight size={14} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ArticleDetail;