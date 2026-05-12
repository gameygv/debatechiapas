import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MultiSelect } from '@/components/ui/multi-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Sparkles, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  ChevronsDown,
  ChevronsUp,
  Equal,
  Tags,
  Link as LinkIcon,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AIImageGenerator from '@/components/admin/AIImageGenerator';
import MediaBrowser from '@/components/admin/editor/MediaBrowser';
import MediaUploader from '@/components/admin/MediaUploader';
import TagInput from '@/components/admin/TagInput';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Interfaces
interface NewsResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  date: string;
}

interface Category {
  id: string;
  name: string;
}

// Helper functions
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Normalize accents (á -> a, ñ -> n)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
};

// Fallback excerpt generator
const createExcerpt = (content: string): string => {
  const textOnly = content.replace(/<[^>]*>?/gm, '');
  return textOnly.substring(0, 150) + '...';
};

const NewsAI = () => {
  const navigate = useNavigate();
  
  // States
  const [keyword, setKeyword] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [rewritingText, setRewritingText] = useState(false);
  
  // Data States
  const [results, setResults] = useState<Array<NewsResult>>([]);
  const [categories, setCategories] = useState<Array<Category>>([]);
  const [selectedNewsIndex, setSelectedNewsIndex] = useState<number | null>(null);
  
  // Form States
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  
  // Metadata States
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [analyzingMetadata, setAnalyzingMetadata] = useState(false);

  // Rewrite Options
  const [lengthOption, setLengthOption] = useState('same');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name');
      if (data) {
        setCategories(data as Array<Category>);
        // No auto-select default anymore, relying on AI
      }
    };
    loadCategories();
  }, []);

  // Handlers
  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast.error('Ingresa una palabra clave');
      return;
    }

    setSearching(true);
    setResults([]);
    setSelectedNewsIndex(null);

    try {
      const { data, error } = await supabase.functions.invoke('search-news', {
        body: { keyword }
      });

      if (error) throw error;

      if (data.results && data.results.length > 0) {
        setResults(data.results);
      } else {
        toast.warning('No se encontraron noticias recientes.');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Error al buscar noticias.');
    } finally {
      setSearching(false);
    }
  };

  const handleGenerateArticle = async (news: NewsResult, index: number) => {
    setSelectedNewsIndex(index);
    setGenerating(true);
    
    setGeneratedTitle(news.title); 
    setGeneratedContent('');
    setGeneratedImage('');
    setImagePrompt('');
    setExcerpt('');
    setTags([]);
    
    // Scroll handling
    setTimeout(() => {
      const el = document.getElementById('editor-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: {
          title: news.title,
          snippet: news.snippet,
          url: news.url
        }
      });

      if (error) throw new Error(error.message || 'Error en generación IA');

      setGeneratedContent(data.content);
      if (data.suggestedTitle) setGeneratedTitle(data.suggestedTitle);
      if (data.imagePrompt) setImagePrompt(data.imagePrompt);
      
      toast.success('Texto generado. Ahora revisa y genera la imagen.');
      
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Error generando contenido');
    } finally {
      setGenerating(false);
    }
  };

  const handleUrlProcess = async () => {
    if (!directUrl.trim()) {
      toast.error('Ingresa una URL válida');
      return;
    }

    setGenerating(true);
    setGeneratedTitle('Analizando enlace...');
    setGeneratedContent('');
    setGeneratedImage('');
    setImagePrompt('');
    setExcerpt('');
    setTags([]);
    setResults([]); 
    
    // Scroll handling
    setTimeout(() => {
      const el = document.getElementById('editor-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: {
          url: directUrl,
          snippet: '',
          title: '' 
        }
      });

      if (error) throw new Error(error.message || 'Error analizando URL');

      setGeneratedContent(data.content);
      if (data.suggestedTitle) setGeneratedTitle(data.suggestedTitle);
      if (data.imagePrompt) setImagePrompt(data.imagePrompt);
      
      toast.success('Noticia generada desde el enlace.');
      
    } catch (error: any) {
      console.error('URL error:', error);
      toast.error(error.message || 'Error procesando enlace');
      setGeneratedTitle(''); // Reset title if failed
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateMetadata = async () => {
    if (!generatedTitle || !generatedContent) {
      toast.error('Espera a que se genere el contenido del artículo.');
      return;
    }

    setAnalyzingMetadata(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-content', {
        body: { 
          title: generatedTitle, 
          content: generatedContent 
        }
      });

      if (error) throw error;

      if (data.excerpt) setExcerpt(data.excerpt);
      if (data.tags) setTags(data.tags);

      // Auto-categorización
      if (data.categories && Array.isArray(data.categories)) {
        const foundCategoryIds: string[] = [];
        data.categories.forEach((catName: string) => {
          const matchedCat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
          if (matchedCat) {
            foundCategoryIds.push(matchedCat.id);
          }
        });

        if (foundCategoryIds.length > 0) {
          // Merge avoiding duplicates
          const merged = Array.from(new Set([...selectedSections, ...foundCategoryIds]));
          setSelectedSections(merged);
          toast.success(`Secciones detectadas: ${data.categories.join(', ')}`);
        } else {
          toast.success('Metadatos generados');
        }
      } else {
        toast.success('Metadatos generados');
      }
      
    } catch (error: any) {
      console.error('Metadata error:', error);
      toast.error('Error generando metadatos');
    } finally {
      setAnalyzingMetadata(false);
    }
  };

  const handleRewrite = async (type: 'title' | 'body') => {
    const text = type === 'title' ? generatedTitle : generatedContent;
    if (!text) return toast.error('No hay texto para reescribir');

    setRewritingText(true);
    try {
      const { data, error } = await supabase.functions.invoke('rewrite-text', {
        body: { 
          text, 
          type,
          lengthOption: type === 'body' ? lengthOption : 'same'
        }
      });
      if (error) throw error;

      if (type === 'title') {
        setGeneratedTitle(data.rewrittenText);
        toast.success('Título reescrito exitosamente');
      } else {
        setGeneratedContent(data.rewrittenText);
        toast.success('Contenido reescrito exitosamente');
      }
      
      setIsPopoverOpen(false);
    } catch (error: any) {
      toast.error('Error al reescribir: ' + error.message);
    } finally {
      setRewritingText(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedTitle || !generatedContent || selectedSections.length === 0) {
      toast.error('Faltan datos requeridos (Título, Contenido o Sección)');
      return;
    }

    setPublishing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No estás autenticado');

      const slug = generateSlug(generatedTitle);
      const finalExcerpt = excerpt || createExcerpt(generatedContent);

      // Insert article
      const { data: articleData, error } = await supabase.from('articles').insert({
        title: generatedTitle,
        slug: slug,
        content: generatedContent,
        excerpt: finalExcerpt,
        featured_image: generatedImage,
        category_id: selectedSections[0], // Primary Category
        author_id: user.id,
        status: 'published',
        published_at: new Date().toISOString(),
        is_featured: false
      }).select().single();

      if (error) throw error;

      // Insert Categories Relation
      if (articleData) {
        const categoryInserts = selectedSections.map(catId => ({
          article_id: articleData.id,
          category_id: catId
        }));
        
        const { error: catError } = await supabase.from('article_categories').insert(categoryInserts);
        if (catError) throw catError;

        // Insert Tags
        if (tags.length > 0) {
           const tagIds: string[] = [];
           for (const tagName of tags) {
              const tagSlug = tagName.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
              if (!tagSlug) continue;
              
              const { data: existingTag } = await supabase.from('tags').select('id').eq('slug', tagSlug).maybeSingle();
              
              if (existingTag) {
                tagIds.push(existingTag.id);
              } else {
                const { data: newTag } = await supabase.from('tags').insert({ name: tagName.trim(), slug: tagSlug }).select().single();
                if (newTag) tagIds.push(newTag.id);
              }
           }
           
           if (tagIds.length > 0) {
             const tagInserts = tagIds.map(tid => ({ article_id: articleData.id, tag_id: tid }));
             await supabase.from('article_tags').insert(tagInserts);
           }
        }
      }

      toast.success('¡Artículo publicado correctamente!');
      navigate('/admin/articles');

    } catch (error: any) {
      console.error('Publish error:', error);
      toast.error('Error al guardar: ' + error.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Redacción Inteligente (AI)
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Genera noticias originales a partir de tendencias o enlaces directos.
        </p>
      </div>

      {/* 1. SOURCE SELECTION */}
      <Card className="border-l-4 border-l-primary shadow-md">
        <CardHeader>
          <CardTitle>Paso 1: Fuente de la Noticia</CardTitle>
          <CardDescription>Elige cómo quieres encontrar la información.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="search">Buscar Tema (Google News)</TabsTrigger>
              <TabsTrigger value="url">Pegar URL Directa</TabsTrigger>
            </TabsList>
            
            <TabsContent value="search" className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Ej. Chiapas turismo, Política nacional..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-lg h-12"
                />
                <Button onClick={handleSearch} disabled={searching} size="lg" className="h-12 px-8">
                  {searching ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" />}
                  Buscar
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Temas sugeridos:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Chiapas', query: 'Chiapas noticias hoy' },
                    { label: 'Nacional MX', query: 'México noticias hoy' },
                    { label: 'Política MX', query: 'política México' },
                    { label: 'Internacional', query: 'noticias internacionales hoy' },
                    { label: 'Tecnología', query: 'tecnología noticias' },
                    { label: 'Deportes', query: 'deportes México' },
                    { label: 'Economía', query: 'economía México' },
                    { label: 'Cultura', query: 'cultura México noticias' },
                    { label: 'Sheinbaum', query: 'Sheinbaum' },
                    { label: 'Tuxtla', query: 'Tuxtla Gutiérrez noticias' },
                  ].map((topic) => (
                    <button
                      key={topic.query}
                      onClick={() => { setKeyword(topic.query); }}
                      className="px-3 py-1.5 text-xs font-medium rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="https://ejemplo.com/noticia-interesante"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlProcess()}
                  className="text-lg h-12 font-mono text-sm"
                />
                <Button onClick={handleUrlProcess} disabled={generating} size="lg" className="h-12 px-8 bg-purple-600 hover:bg-purple-700 text-white">
                  {generating ? <Loader2 className="animate-spin mr-2" /> : <LinkIcon className="mr-2" />}
                  Procesar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                La IA leerá el contenido de la página, extraerá la información relevante y redactará una noticia original.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 2. RESULTS SECTION */}
      {results.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-bold font-serif">Resultados Encontrados ({results.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {results.map((news, index) => (
              <div 
                key={index} 
                className={`
                  relative border rounded-xl p-5 transition-all cursor-pointer hover:shadow-lg
                  ${selectedNewsIndex === index 
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                    : 'bg-white border-border hover:border-primary/50'
                  }
                `}
                onClick={() => !generating && handleGenerateArticle(news, index)}
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-white">{news.source}</Badge>
                  {selectedNewsIndex === index && (
                    <Badge className="bg-primary text-white"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Procesando</Badge>
                  )}
                </div>
                
                <h3 className="font-bold text-lg mb-2 leading-tight">{news.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{news.snippet}</p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                  <span>{new Date(news.date).toLocaleDateString()}</span>
                  <div className="flex items-center text-primary font-medium group">
                    Clic para generar <Sparkles className="w-3 h-3 ml-1 group-hover:scale-125 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. EDITOR SECTION */}
      {(generating || generatedContent || generatedTitle === 'Analizando enlace...') && (
        <div id="editor-section" className="animate-in fade-in slide-in-from-bottom-10 duration-500">
          <Card className="border-2 border-accent/20 shadow-xl overflow-hidden">
            <CardHeader className="bg-accent/5 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl font-serif">
                    <Sparkles className="text-accent fill-accent/20" />
                    Editor de IA
                  </CardTitle>
                  <CardDescription>Revisa y ajusta el contenido generado antes de publicar.</CardDescription>
                </div>
                {generating && (
                  <div className="flex items-center gap-2 text-accent animate-pulse">
                    <Loader2 className="animate-spin" />
                    <span>Redactando noticia original...</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Image & Settings */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Image Generator */}
                  <div className="space-y-2">
                    <Label>Imagen de Portada</Label>
                    
                    {generatedImage ? (
                      <div className="aspect-video bg-muted rounded-lg border overflow-hidden relative group">
                        <img src={generatedImage} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                           <Button variant="destructive" size="sm" onClick={() => setGeneratedImage('')}>
                             <Trash2 className="w-4 h-4 mr-1" /> Quitar
                           </Button>
                           <MediaBrowser 
                             onSelect={setGeneratedImage} 
                             trigger={<Button variant="secondary" size="sm"><ImageIcon className="w-4 h-4 mr-1"/> Cambiar</Button>}
                           />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                         {/* Dropzone for quick upload */}
                         <MediaUploader 
                           onUploadComplete={setGeneratedImage} 
                           className="h-40" 
                         />
                         
                         <div className="grid grid-cols-2 gap-2">
                           {/* Library Button */}
                           <MediaBrowser 
                             onSelect={setGeneratedImage}
                             trigger={
                               <Button variant="outline" className="w-full">
                                 <ImageIcon className="mr-2 h-4 w-4" /> Biblioteca
                               </Button>
                             }
                           />
                           
                           {/* AI Generator Button */}
                           <AIImageGenerator 
                             initialPrompt={imagePrompt}
                             onImageGenerated={setGeneratedImage}
                             trigger={
                               <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">
                                 <Sparkles className="mr-2 h-4 w-4" /> Generar IA
                               </Button>
                             }
                           />
                         </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Secciones (Selección Múltiple) *</Label>
                    <MultiSelect 
                      options={categories.map(c => ({ label: c.name, value: c.id }))}
                      selected={selectedSections}
                      onChange={setSelectedSections}
                      placeholder="Seleccionar..."
                    />
                  </div>

                  {/* Metadata AI Section */}
                  <div className="space-y-4 pt-4 border-t">
                     <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Tags className="w-4 h-4" /> Metadatos
                        </Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleGenerateMetadata} 
                          disabled={analyzingMetadata || generating}
                          className="h-7 text-xs"
                        >
                          {analyzingMetadata ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1 text-purple-600" />}
                          Generar & Clasificar
                        </Button>
                     </div>

                     <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Extracto (SEO)</Label>
                        <Textarea 
                          value={excerpt}
                          onChange={(e) => setExcerpt(e.target.value)}
                          placeholder="Resumen corto para redes sociales..."
                          className="h-24 text-sm resize-none"
                        />
                     </div>

                     <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Etiquetas</Label>
                        <TagInput tags={tags} onChange={setTags} />
                     </div>
                  </div>

                </div>

                {/* Right Column: Content */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Título</Label>
                      <Button 
                        variant="ghost" size="sm" 
                        onClick={() => handleRewrite('title')} 
                        disabled={rewritingText}
                        className="h-6 text-xs text-purple-600 hover:text-purple-700"
                      >
                         {rewritingText ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Sparkles className="w-3 h-3 mr-1" />}
                         Reescribir
                      </Button>
                    </div>
                    <Input 
                      value={generatedTitle} 
                      onChange={e => setGeneratedTitle(e.target.value)}
                      className="text-lg font-bold font-serif"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Contenido</Label>
                      
                      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" size="sm" 
                            disabled={rewritingText}
                            className="h-6 text-xs text-purple-600 hover:text-purple-700"
                          >
                             <Sparkles className="w-3 h-3 mr-1" /> Mejorar redacción
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-4" align="end">
                          <div className="space-y-4">
                            <h4 className="font-medium text-sm text-gray-900">Opciones de Reescritura</h4>
                            
                            <div className="space-y-2">
                               <Label className="text-xs text-muted-foreground">Longitud</Label>
                               <RadioGroup value={lengthOption} onValueChange={setLengthOption} className="gap-2">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="shorter-50" id="r1" />
                                  <Label htmlFor="r1" className="text-xs cursor-pointer flex items-center gap-1.5">
                                    <ChevronsDown className="h-3 w-3 text-gray-500" />
                                    Mucho más corto (-50%)
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="shorter-25" id="r2" />
                                  <Label htmlFor="r2" className="text-xs cursor-pointer flex items-center gap-1.5">
                                    <ChevronsDown className="h-3 w-3 text-gray-500" />
                                    Más corto (-25%)
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="same" id="r3" />
                                  <Label htmlFor="r3" className="text-xs cursor-pointer flex items-center gap-1.5">
                                    <Equal className="h-3 w-3 text-gray-500" />
                                    Misma longitud
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="longer-25" id="r4" />
                                  <Label htmlFor="r4" className="text-xs cursor-pointer flex items-center gap-1.5">
                                    <ChevronsUp className="h-3 w-3 text-gray-500" />
                                    Más largo (+25%)
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="longer-50" id="r5" />
                                  <Label htmlFor="r5" className="text-xs cursor-pointer flex items-center gap-1.5">
                                    <ChevronsUp className="h-3 w-3 text-gray-500" />
                                    Mucho más largo (+50%)
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>

                            <Button 
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
                              size="sm"
                              onClick={() => handleRewrite('body')}
                              disabled={rewritingText}
                            >
                              {rewritingText ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                  Procesando...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3 w-3 mr-2" />
                                  Reescribir Texto
                                </>
                              )}
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>

                    </div>
                    <Textarea 
                      value={generatedContent}
                      onChange={e => setGeneratedContent(e.target.value)}
                      className="min-h-[400px] font-mono text-sm leading-relaxed p-4"
                      placeholder="El contenido aparecerá aquí..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="bg-gray-50 border-t p-6 flex justify-between items-center">
              <div className="flex items-center text-xs text-muted-foreground">
                <AlertCircle className="w-3 h-3 mr-1" />
                Se publicará inmediatamente en la portada.
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => {
                  setGeneratedContent('');
                  setSelectedNewsIndex(null);
                }}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handlePublish} 
                  disabled={publishing || !generatedContent || selectedSections.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]"
                >
                  {publishing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                  Publicar
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NewsAI;