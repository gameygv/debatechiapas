import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  FileText,
  Share2,
  Loader2,
  Sparkles,
  Filter,
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle2,
  File,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const ITEMS_PER_PAGE = 20;

interface AdminArticle {
  id: string;
  title: string;
  slug: string;
  status: string;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  featured_image: string | null;
  excerpt: string | null;
  article_categories: Array<{ categories: { id: string; name: string } }>;
}

const Articles = () => {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pushingId, setPushingId] = useState<string | null>(null);
  const [generatingMetaId, setGeneratingMetaId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      if (data) setCategories(data);
    };
    loadCategories();
  }, []);

  useEffect(() => {
    fetchArticles(page);
  }, [page, selectedCategory, dateFilter, statusFilter]); 

  const handleSearch = () => {
    setPage(1); 
    fetchArticles(1, searchTerm);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setPage(1); 
  };

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const fetchArticles = async (pageNumber: number, search = searchTerm) => {
    setLoading(true);
    try {
      const from = (pageNumber - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const relationSyntax = selectedCategory !== 'all' 
        ? 'article_categories!inner (category_id, categories (name))'
        : 'article_categories (categories (name))';

      // Incluimos article_tags para verificar si existen
      let query = supabase
        .from('articles')
        .select(`
          *,
          ${relationSyntax},
          profiles:author_id (full_name),
          article_tags (tag_id)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Search Filter
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      // Category Filter
      if (selectedCategory !== 'all') {
        query = query.eq('article_categories.category_id', selectedCategory);
      }

      // Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'draft') {
          query = query.eq('status', 'draft');
        } else if (statusFilter === 'published') {
          query = query.eq('status', 'published').lte('published_at', new Date().toISOString());
        } else if (statusFilter === 'scheduled') {
          query = query.eq('status', 'published').gt('published_at', new Date().toISOString());
        }
      }

      // Date Filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();

        if (dateFilter === 'today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (dateFilter === '7days') {
          startDate.setDate(now.getDate() - 7);
        } else if (dateFilter === '30days') {
          startDate.setDate(now.getDate() - 30);
        } else if (dateFilter === 'this_month') {
          startDate.setDate(1); // First day of current month
          startDate.setHours(0, 0, 0, 0);
        }

        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, count, error } = await query;

      if (error) throw error;
      setArticles(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('No se pudieron cargar los artículos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este artículo permanentemente?')) return;
    
    try {
      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (error) throw error;
      toast.success('Artículo eliminado');
      fetchArticles(page); 
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  const handleGenerateMeta = async (articleId: string) => {
    setGeneratingMetaId(articleId);
    try {
      // 1. Fetch fresh content
      const { data: freshArticle, error: fetchError } = await supabase
        .from('articles')
        .select('title, content')
        .eq('id', articleId)
        .single();

      if (fetchError || !freshArticle || !freshArticle.content) {
        throw new Error("No se pudo obtener el contenido del artículo. Asegúrate de que tenga texto.");
      }

      toast.info("Analizando contenido con IA...");

      // 2. Generate Metadata
      const { data: aiData, error: aiError } = await supabase.functions.invoke('analyze-content', {
        body: { 
          title: freshArticle.title, 
          content: freshArticle.content 
        }
      });

      if (aiError) throw new Error(aiError.message || "Error en servicio de IA");
      if (!aiData.excerpt) throw new Error("La IA no generó un resumen válido.");

      // 3. Update DB
      const { error: updateError } = await supabase
        .from('articles')
        .update({ excerpt: aiData.excerpt })
        .eq('id', articleId);

      if (updateError) throw updateError;

      // 4. Handle Tags
      let newTags: any[] = [];
      if (aiData.tags && Array.isArray(aiData.tags)) {
        await supabase.from('article_tags').delete().eq('article_id', articleId);
        
        const tagIds = [];
        for (const tagName of aiData.tags) {
          const slug = tagName.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
          if (!slug) continue;

          const { data: existing } = await supabase.from('tags').select('id').eq('slug', slug).maybeSingle();
          if (existing) {
            tagIds.push(existing.id);
          } else {
            const { data: created } = await supabase.from('tags').insert({ name: tagName, slug }).select('id').single();
            if (created) tagIds.push(created.id);
          }
        }

        if (tagIds.length > 0) {
          const relations = tagIds.map(tagId => ({ article_id: articleId, tag_id: tagId }));
          await supabase.from('article_tags').insert(relations);
          newTags = tagIds.map(id => ({ tag_id: id }));
        }
      }

      // 5. Update Local State
      setArticles(prev => prev.map(a => {
        if (a.id === articleId) {
          return { ...a, excerpt: aiData.excerpt, article_tags: newTags };
        }
        return a;
      }));

      toast.success("Metadatos actualizados correctamente");

    } catch (error: any) {
      console.error('Meta Gen Error:', error);
      toast.error(error.message || "Error generando metadatos");
    } finally {
      setGeneratingMetaId(null);
    }
  };

  const handleSocialPush = async (id: string, title: string) => {
    setPushingId(id);
    try {
      const { error } = await supabase.functions.invoke('publish-social', {
        body: { articleId: id }
      });

      if (error) throw error;
      toast.success(`"${title}" enviado a redes sociales`);
      setArticles(prev => prev.map(a => 
        a.id === id ? { ...a, last_social_push: new Date().toISOString() } : a
      ));

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPushingId(null);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900">Artículos</h1>
          <p className="text-muted-foreground mt-1">Gestiona, edita y distribuye el contenido editorial.</p>
        </div>
        <Button asChild className="shadow-sm">
          <Link to="/admin/articles/new">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Artículo
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-1">
          {/* Search */}
          <div className="relative w-full sm:w-64 flex gap-2">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
               <Input 
                placeholder="Buscar por título..." 
                className="pl-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
               />
            </div>
            <Button variant="secondary" onClick={handleSearch}>Buscar</Button>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-40">
             <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="published">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Publicados</div>
                </SelectItem>
                <SelectItem value="draft">
                  <div className="flex items-center gap-2"><File className="h-4 w-4 text-gray-500" /> Borradores</div>
                </SelectItem>
                <SelectItem value="scheduled">
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600" /> Programados</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="w-full sm:w-40">
             <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sección" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las secciones</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="w-full sm:w-40">
             <Select value={dateFilter} onValueChange={handleDateFilterChange}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Fecha" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cualquier fecha</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="7days">Últimos 7 días</SelectItem>
                <SelectItem value="30days">Últimos 30 días</SelectItem>
                <SelectItem value="this_month">Este mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground whitespace-nowrap">
           Total: <strong>{totalCount}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando...
          </div>
        ) : articles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10">
            <Filter className="h-10 w-10 mb-2 opacity-20" />
            <p>No se encontraron artículos con estos filtros.</p>
            {(selectedCategory !== 'all' || dateFilter !== 'all' || statusFilter !== 'all') && (
              <Button variant="link" onClick={() => { setSelectedCategory('all'); setDateFilter('all'); setStatusFilter('all'); }}>
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-4 w-[35%]">Artículo</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-center">Metadata</th>
                  <th className="px-6 py-4 text-center">Redes</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {articles.map((article) => {
                  // Metadata Logic
                  const hasExcerpt = article.excerpt && article.excerpt.length > 10;
                  const hasTags = article.article_tags && article.article_tags.length > 0;
                  const isMetaOk = hasExcerpt && hasTags;
                  
                  // Scheduled Logic
                  const isScheduled = article.status === 'published' && isFuture(new Date(article.published_at));

                  return (
                  <tr key={article.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Articulo */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-14 bg-gray-100 rounded overflow-hidden flex-shrink-0 border relative">
                          {article.featured_image ? (
                            <img 
                              src={article.featured_image} 
                              className="h-full w-full object-cover" 
                              alt="" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Sin+Img';
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                              <FileText size={16} />
                            </div>
                          )}
                        </div>
                        <div>
                          <Link to={`/admin/articles/edit/${article.id}`} className="font-medium text-gray-900 hover:text-primary hover:underline line-clamp-1">
                            {article.title}
                          </Link>
                          <div className="flex gap-2 mt-0.5">
                            {article.article_categories?.[0] ? (
                               <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                 {article.article_categories[0].categories?.name}
                               </span>
                            ) : (
                              <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Sin sección</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `https://debatechiapas.com/noticias/${article.slug}`;
                              navigator.clipboard.writeText(url);
                              toast.success('Link copiado');
                            }}
                            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary mt-0.5 cursor-pointer"
                            title="Copiar link"
                          >
                            <LinkIcon size={10} />
                            <span className="truncate max-w-[200px]">debatechiapas.com/noticias/{article.slug}</span>
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      {isScheduled ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 font-normal flex w-fit items-center gap-1">
                          <Clock size={10} /> Programado
                        </Badge>
                      ) : article.status === 'published' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-normal">
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 font-normal">
                          Borrador
                        </Badge>
                      )}
                    </td>

                    {/* Metadata */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isMetaOk ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 cursor-help">OK</Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">{article.excerpt}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 flex items-center gap-1">
                                <AlertCircle size={10} /> Falta Info
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {!hasExcerpt && <p>Falta resumen</p>}
                              {!hasTags && <p>Faltan etiquetas</p>}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        
                        <Button 
                          variant="ghost" size="icon" 
                          className="h-7 w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          onClick={() => handleGenerateMeta(article.id)}
                          disabled={generatingMetaId === article.id}
                        >
                          {generatingMetaId === article.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </td>

                    {/* Redes */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {article.last_social_push ? (
                           <Tooltip>
                             <TooltipTrigger>
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 cursor-help">Enviado</Badge>
                             </TooltipTrigger>
                             <TooltipContent>{format(new Date(article.last_social_push), 'dd MMM HH:mm', { locale: es })}</TooltipContent>
                           </Tooltip>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 border-dashed">Pendiente</Badge>
                        )}
                        
                        <Button 
                          variant="ghost" size="sm" 
                          className="h-6 text-[10px] text-muted-foreground hover:text-primary"
                          disabled={pushingId === article.id || article.status !== 'published' || isScheduled}
                          onClick={() => handleSocialPush(article.id, article.title)}
                        >
                          {pushingId === article.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <div className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Publicar</div>}
                        </Button>
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {article.created_at 
                        ? format(new Date(article.created_at), 'dd MMM, yy HH:mm', { locale: es })
                        : '-'
                      }
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleGenerateMeta(article.id)}>
                            <Sparkles className="mr-2 h-4 w-4 text-purple-600" /> Generar Metadatos IA
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSocialPush(article.id, article.title)} disabled={isScheduled || article.status !== 'published'}>
                            <Share2 className="mr-2 h-4 w-4" /> Publicar en Redes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/articles/edit/${article.id}`}><Edit className="mr-2 h-4 w-4" /> Editar</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild disabled={article.status !== 'published'}>
                            <Link to={`/noticias/${article.slug}`} target="_blank"><Eye className="mr-2 h-4 w-4" /> Ver en sitio</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(article.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalCount > 0 && (
           <div className="border-t p-4 flex items-center justify-between bg-gray-50/50">
             <div className="text-sm text-muted-foreground">Página {page} de {totalPages}</div>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>
                 <ChevronLeft className="h-4 w-4" /> Anterior
               </Button>
               <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)}>
                 Siguiente <ChevronRight className="h-4 w-4" />
               </Button>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default Articles;