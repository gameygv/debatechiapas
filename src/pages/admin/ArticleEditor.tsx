import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import EditorToolbar from '@/components/admin/editor/EditorToolbar';
import MediaUploader from '@/components/admin/MediaUploader';
import TagInput from '@/components/admin/TagInput';
import MediaBrowser from '@/components/admin/editor/MediaBrowser';
import AIImageGenerator from '@/components/admin/AIImageGenerator';
import ResizableImage from '@/components/admin/editor/ResizableImage';
import { VideoExtension } from '@/components/admin/editor/VideoExtension';
import { MultiSelect } from '@/components/ui/multi-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from '@/components/ui/textarea';
import { 
  Save, ArrowLeft, Sparkles, Loader2, 
  Tags, Layout, FileText, Image as ImageIcon, Trash2
} from 'lucide-react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// --- UTILS ---
const getLocalISOString = (date = new Date()) => {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

// --- EXTENSIÓN DE IMAGEN CON SOPORTE DE TAMAÑO ---
const CustomImage = Node.create({
  name: 'image',
  group: 'block',
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      width: {
        default: '100%',
        parseHTML: element => element.style.width || element.getAttribute('width') || '100%',
        renderHTML: attributes => {
          if (!attributes.width) return {};
          return { style: `width: ${attributes.width}; max-width: 100%; height: auto; display: block;` };
        },
      },
      textAlign: {
        default: 'left',
        parseHTML: element => element.getAttribute('data-align') || 'left',
        renderHTML: attributes => ({ 'data-align': attributes.textAlign }),
      },
    };
  },
  parseHTML() { return [{ tag: 'img[src]' }]; },
  renderHTML({ HTMLAttributes }) { return ['img', mergeAttributes(HTMLAttributes)]; },
  addNodeView() { return ReactNodeViewRenderer(ResizableImage); },
  addCommands() {
    return {
      setImage: (options: any) => ({ commands }: any) => {
        return commands.insertContent({ type: this.name, attrs: options });
      },
    } as any;
  },
});

const ArticleEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [status, setStatus] = useState('published');
  const [publishedAt, setPublishedAt] = useState<string>(getLocalISOString());
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [editorHeight, setEditorHeight] = useState(600);
  const containerResizeStartY = useRef(0);
  const containerResizeStartHeight = useRef(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      CustomImage,
      VideoExtension,
      Link.configure({ openOnClick: false }),
      Youtube.configure({ width: 640, height: 480 }),
      TextAlign.configure({ types: ['heading', 'paragraph', 'image', 'video'] }),
      Placeholder.configure({ placeholder: 'Escribe tu historia aquí...' }),
    ] as any,
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg prose-stone max-w-none focus:outline-none px-4 md:px-8 py-6 min-h-full',
      },
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!id || !editor) return;
    const fetchArticle = async () => {
      setLoadingArticle(true);
      const { data: articleData } = await supabase.from('articles').select('*').eq('id', id).single();
      if (articleData) {
        setTitle(articleData.title);
        setSlug(articleData.slug);
        setFeaturedImage(articleData.featured_image);
        setStatus(articleData.status);
        if (articleData.published_at) setPublishedAt(getLocalISOString(new Date(articleData.published_at)));
        setExcerpt(articleData.excerpt || '');
        editor.commands.setContent(articleData.content || '');
        setHtmlContent(articleData.content || '');

        const { data: cats } = await supabase.from('article_categories').select('category_id').eq('article_id', id);
        if (cats) setSelectedSections(cats.map(c => c.category_id));

        const { data: tgs } = await supabase.from('article_tags').select('tags(name)').eq('article_id', id);
        if (tgs) setTags(tgs.map((t: any) => t.tags.name));
      }
      setLoadingArticle(false);
    };
    fetchArticle();
  }, [id, editor]);

  const handleToggleHtmlMode = useCallback(() => {
    if (!editor) return;
    if (isHtmlMode) {
      editor.commands.setContent(htmlContent);
    } else {
      setHtmlContent(editor.getHTML());
    }
    setIsHtmlMode(!isHtmlMode);
  }, [isHtmlMode, htmlContent, editor]);

  const handleGenerateMetadata = async () => {
    const content = isHtmlMode ? htmlContent : editor?.getHTML();
    if (!title || !content || content.length < 50) {
      toast.error('Escribe primero el título y algo de contenido.');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-content', {
        body: { title, content }
      });

      if (error) throw error;

      if (data.excerpt) setExcerpt(data.excerpt);
      if (data.tags) setTags(data.tags);

      if (data.categories && Array.isArray(data.categories)) {
        const foundIds: string[] = [];
        data.categories.forEach((name: string) => {
          const match = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
          if (match) foundIds.push(match.id);
        });
        if (foundIds.length > 0) {
          setSelectedSections(Array.from(new Set([...selectedSections, ...foundIds])));
        }
      }
      toast.success('Metadatos generados y sección sugerida.');
    } catch (e) {
      toast.error('Error con la IA');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    const content = isHtmlMode ? htmlContent : editor?.getHTML();
    if (!title || !content) return toast.error('Falta título o contenido');
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        title, slug: slug || title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''), 
        content, excerpt, featured_image: featuredImage,
        author_id: user?.id, status, published_at: new Date(publishedAt).toISOString(),
        category_id: selectedSections[0] || null
      };

      let articleId = id;
      if (id) {
        await supabase.from('articles').update(payload).eq('id', id);
      } else {
        const { data } = await supabase.from('articles').insert(payload).select().single();
        articleId = data.id;
      }

      if (articleId) {
        await supabase.from('article_categories').delete().eq('article_id', articleId);
        if (selectedSections.length > 0) {
          await supabase.from('article_categories').insert(selectedSections.map(c => ({ article_id: articleId, category_id: c })));
        }

        // Sync Tags
        await supabase.from('article_tags').delete().eq('article_id', articleId);
        for (const tagName of tags) {
            const tagSlug = tagName.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            const { data: tagObj } = await supabase.from('tags').select('id').eq('slug', tagSlug).maybeSingle();
            let tid = tagObj?.id;
            if (!tid) {
                const { data: newTag } = await supabase.from('tags').insert({ name: tagName, slug: tagSlug }).select('id').single();
                tid = newTag?.id;
            }
            if (tid) await supabase.from('article_tags').insert({ article_id: articleId, tag_id: tid });
        }
      }

      toast.success('Guardado correctamente');
      navigate('/admin/articles');
    } catch (e) {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleContainerResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    containerResizeStartY.current = e.clientY;
    containerResizeStartHeight.current = editorHeight;
    const move = (me: MouseEvent) => setEditorHeight(Math.max(400, containerResizeStartHeight.current + (me.clientY - containerResizeStartY.current)));
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  if (loadingArticle) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-6rem)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><RouterLink to="/admin/articles"><ArrowLeft className="h-4 w-4" /></RouterLink></Button>
          <h1 className="font-serif font-bold text-xl">{id ? 'Editar Artículo' : 'Nuevo Artículo'}</h1>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Guardar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Input placeholder="Título del artículo" className="text-3xl font-serif font-bold border-none px-0 shadow-none focus-visible:ring-0" value={title} onChange={e => setTitle(e.target.value)} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/30 p-2 rounded">
                 <Layout size={12} /> <span>Slug:</span> <span>{slug || 'se generará al guardar'}</span>
              </div>
            </CardContent>
          </Card>

          <div className="bg-white rounded-lg border flex flex-col relative overflow-hidden" style={{ height: `${editorHeight}px` }}>
            <EditorToolbar editor={editor} isHtmlMode={isHtmlMode} onToggleHtmlMode={handleToggleHtmlMode} />
            <div className="flex-1 overflow-y-auto">
              {isHtmlMode ? (
                <Textarea value={htmlContent} onChange={e => setHtmlContent(e.target.value)} className="w-full h-full p-4 font-mono text-sm border-0 focus-visible:ring-0 resize-none" />
              ) : (
                <EditorContent editor={editor} className="h-full" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-gray-100 border-t border-l" onMouseDown={handleContainerResizeStart} />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Card de Configuración (Ahora primero) */}
          <Card>
            <CardHeader className="pb-3 border-b"><CardTitle className="text-sm">Configuración</CardTitle></CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Secciones</Label>
                <MultiSelect options={categories.map(c => ({ label: c.name, value: c.id }))} selected={selectedSections} onChange={setSelectedSections} placeholder="Elige secciones..." />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Imagen de Portada</Label>
                {featuredImage ? (
                  <div className="relative rounded-md overflow-hidden border">
                    <img src={featuredImage} className="w-full h-40 object-cover" />
                    <Button variant="destructive" size="sm" className="absolute top-2 right-2 h-7 px-2" onClick={() => setFeaturedImage(null)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <MediaUploader onUploadComplete={url => setFeaturedImage(url)} />
                    <div className="grid grid-cols-2 gap-2">
                       <MediaBrowser 
                         onSelect={(url) => setFeaturedImage(url)} 
                         trigger={
                           <Button variant="outline" size="sm" className="w-full">
                             <ImageIcon className="mr-2 h-4 w-4" /> Biblioteca
                           </Button>
                         }
                       />
                       <AIImageGenerator 
                         initialPrompt={title ? `Fotografía periodística de: ${title}` : ''}
                         context={title}
                         onImageGenerated={setFeaturedImage}
                         trigger={
                           <Button variant="outline" size="sm" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">
                             <Sparkles className="mr-2 h-4 w-4" /> Generar IA
                           </Button>
                         }
                       />
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Estado</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="published">Publicado</SelectItem><SelectItem value="draft">Borrador</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Fecha</Label>
                  <Input type="datetime-local" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} className="h-9 text-[10px]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de IA (Ahora segundo) */}
          <Card>
            <CardHeader className="pb-3 border-b"><CardTitle className="text-sm font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-600" /> Inteligencia Artificial</CardTitle></CardHeader>
            <CardContent className="pt-4 space-y-4">
               <Button onClick={handleGenerateMetadata} disabled={analyzing} variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 gap-2">
                 {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                 Generar Metadatos & Sección
               </Button>
               <div className="space-y-2">
                 <Label className="text-xs">Resumen (SEO)</Label>
                 <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} className="text-xs h-24" placeholder="Extracto para redes sociales..." />
               </div>
               <div className="space-y-2">
                 <Label className="text-xs">Etiquetas</Label>
                 <TagInput tags={tags} onChange={setTags} />
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;