import React from 'react';
import { Link } from 'react-router-dom';
import { Article } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';

interface ArticleCardProps {
  article: any; // Relaxed type to handle Supabase partial returns
  variant?: 'featured' | 'standard' | 'compact' | 'sidebar';
  className?: string;
  showImage?: boolean;
}

const ArticleCard = ({ article, variant = 'standard', className, showImage = true }: ArticleCardProps) => {
  // Handle inconsistent naming (publishedAt vs published_at)
  const dateString = article.publishedAt || article.published_at || article.created_at || new Date().toISOString();
  let timeAgo = 'Reciente';
  
  try {
    timeAgo = formatDistance(new Date(dateString), new Date(), { addSuffix: true, locale: es });
  } catch (e) {
    // Fallback if date is invalid
  }

  // Handle category object or array structure
  const categoryName = article.category?.name || article.categories?.name || 'General';
  const featuredImage = article.featuredImage || article.featured_image;

  if (variant === 'featured') {
    return (
      <Link to={`/noticias/${article.slug}`} className={cn("group block h-full", className)}>
        <div className="relative h-full overflow-hidden rounded-lg bg-muted shadow-sm">
          <img 
            src={featuredImage} 
            alt={article.title}
            className="w-full aspect-[3/4] max-h-[700px] object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/800x600?text=No+Image'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white w-full max-w-3xl">
            <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest uppercase bg-primary text-primary-foreground">
              {categoryName}
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold leading-tight mb-4 text-white group-hover:underline decoration-2 underline-offset-4 decoration-white/50">
              {article.title}
            </h2>
            <p className="text-lg text-gray-200 line-clamp-2 font-sans md:w-3/4 mb-4">
              {article.excerpt}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-300 font-sans">
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link to={`/noticias/${article.slug}`} className={cn("group flex gap-4 items-start", className)}>
        {showImage && (
          <div className="flex-shrink-0 w-24 h-24 overflow-hidden rounded-md bg-muted">
            <img 
              src={featuredImage} 
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=No+Image'; }}
            />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-widest uppercase text-primary mb-1">
            {categoryName}
          </span>
          <h3 className="font-serif text-base font-bold leading-snug group-hover:text-primary transition-colors line-clamp-3">
            {article.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2 font-sans">
            <Clock size={12} />
            <span>{timeAgo}</span>
          </div>
        </div>
      </Link>
    );
  }

  // Standard Card (Vertical)
  return (
    <Link to={`/noticias/${article.slug}`} className={cn("group block", className)}>
      {showImage && (
        <div className="overflow-hidden rounded-lg mb-4 bg-muted aspect-[3/4] shadow-sm">
          <img 
            src={featuredImage} 
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=No+Image'; }}
          />
        </div>
      )}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold tracking-widest uppercase text-primary/80">
            {categoryName}
          </span>
          <span className="text-xs text-muted-foreground font-sans">{timeAgo}</span>
        </div>
        <h3 className="font-serif text-xl md:text-2xl font-bold leading-tight mb-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed font-sans">
          {article.excerpt}
        </p>
        <div className="mt-3 text-xs font-medium text-primary flex items-center gap-2 font-sans opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0">
          Leer artículo completo &rarr;
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;