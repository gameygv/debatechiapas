import React, { useState } from 'react';
import { type Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading2, Heading3, Quote, List,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Youtube, Minus, Sparkles, Loader2, Image as ImageIcon,
  ChevronsDown, ChevronsUp, Equal, Code, FileText, Video as VideoIcon
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import MediaBrowser from './MediaBrowser';
import AIImageGenerator from '../AIImageGenerator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EditorToolbarProps {
  editor: Editor | null;
  isHtmlMode: boolean;
  onToggleHtmlMode: () => void;
}

const EditorToolbar = ({ editor, isHtmlMode, onToggleHtmlMode }: EditorToolbarProps) => {
  const [rewriting, setRewriting] = useState(false);
  const [lengthOption, setLengthOption] = useState('same');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [rewriteTarget, setRewriteTarget] = useState<'selection' | 'all'>('all');

  if (!editor && !isHtmlMode) return null;

  if (isHtmlMode) {
    return (
      <div className="border-b border-input bg-gray-50/80 p-2 flex items-center justify-between shrink-0">
        <span className="text-xs font-medium ml-2 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Code className="h-4 w-4" />
          Modo Código HTML
        </span>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={onToggleHtmlMode}
          className="gap-2 h-8 text-xs"
        >
          <FileText className="h-3.5 w-3.5" />
          Volver a Visual
        </Button>
      </div>
    );
  }

  const addYoutube = () => {
    const url = window.prompt('URL del video de YouTube:');
    if (url) {
      if (editor) {
        editor.commands.setYoutubeVideo({ src: url });
      }
    }
  };

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      (editor.chain().focus() as any).extendMarkRange('link').unsetLink().run();
      return;
    }
    (editor.chain().focus() as any).extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleMediaSelect = (url: string, type: 'image' | 'video') => {
    if (!editor) return;
    
    if (type === 'video') {
      (editor.chain().focus() as any).setVideo({ src: url }).run();
    } else {
      (editor.chain().focus() as any).setImage({ src: url }).run();
    }
  };

  const handleAIImageGenerated = (url: string) => {
    if (!editor) return;
    (editor.chain().focus() as any).setImage({ src: url }).run();
  };

  const checkForMedia = (html: string) => {
    return html.includes('<img') || html.includes('<iframe') || html.includes('<video');
  };

  const handleRewrite = async () => {
    if (!editor) return;

    let textToRewrite = "";
    let isSelection = true;

    if (rewriteTarget === 'all') {
      const fullHtml = editor.getHTML();
      if (checkForMedia(fullHtml)) {
        toast.error("Seguridad: No se puede reescribir todo el artículo porque contiene imágenes o videos.");
        return;
      }
      textToRewrite = fullHtml;
      isSelection = false;
    } else {
      let { from, to, empty } = editor.state.selection;
      if (empty) {
        (editor.commands as any).selectParentNode();
        const newSelection = editor.state.selection;
        from = newSelection.from;
        to = newSelection.to;
      }
      textToRewrite = editor.state.doc.textBetween(from, to, ' ');
    }
    
    if (!textToRewrite || textToRewrite.trim().length < 5) {
      toast.error('El texto es muy corto o no hay nada seleccionado.');
      return;
    }

    setRewriting(true);
    try {
      const { data, error } = await supabase.functions.invoke('rewrite-text', {
        body: { 
          text: textToRewrite, 
          type: 'body',
          lengthOption: lengthOption
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (rewriteTarget === 'all') {
        editor.commands.setContent(data.rewrittenText);
      } else {
        editor.chain().focus().insertContent(data.rewrittenText).run();
      }
      
      toast.success('Texto reescrito correctamente');
      setPopoverOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error('Error al reescribir: ' + error.message);
    } finally {
      setRewriting(false);
    }
  };

  return (
    <div className="border-b border-input bg-white p-2 flex flex-wrap gap-1 items-center shrink-0 z-10 sticky top-0">
      
      {/* Text Formatting */}
      <div className="flex items-center gap-0.5 mr-1">
        <Toggle size="sm" className="h-8 w-8 p-0" pressed={editor?.isActive('bold')} onPressedChange={() => (editor?.chain().focus() as any).toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" className="h-8 w-8 p-0" pressed={editor?.isActive('italic')} onPressedChange={() => (editor?.chain().focus() as any).toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" className="h-8 w-8 p-0" pressed={editor?.isActive('underline')} onPressedChange={() => (editor?.chain().focus() as any).toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" className="h-8 w-8 p-0" pressed={editor?.isActive('strike')} onPressedChange={() => (editor?.chain().focus() as any).toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </Toggle>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Headings */}
      <div className="flex items-center gap-0.5 mr-1">
        <Toggle size="sm" className="h-8 w-8 p-0" pressed={editor?.isActive('heading', { level: 2 })} onPressedChange={() => (editor?.chain().focus() as any).toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" className="h-8 w-8 p-0" pressed={editor?.isActive('heading', { level: 3 })} onPressedChange={() => (editor?.chain().focus() as any).toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </Toggle>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Lists & Quote */}
      <div className="flex items-center gap-0.5 mr-1">
        <Toggle size="sm" className="h-8 w-8 p-0" pressed={editor?.isActive('bulletList')} onPressedChange={() => (editor?.chain().focus() as any).toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" className="h-8 w-8 p-0" pressed={editor?.isActive('blockquote')} onPressedChange={() => (editor?.chain().focus() as any).toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </Toggle>
      </div>

      <div className="hidden sm:flex items-center">
        <Separator orientation="vertical" className="h-6 mx-1" />
        <div className="flex items-center gap-0.5 mr-1">
          <Toggle size="sm" className="h-8 w-8 p-0" pressed={editor?.isActive({ textAlign: 'left' })} onPressedChange={() => editor?.chain().focus().setTextAlign('left').run()}>
            <AlignLeft className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" className="h-8 w-8 p-0" pressed={editor?.isActive({ textAlign: 'center' })} onPressedChange={() => editor?.chain().focus().setTextAlign('center').run()}>
            <AlignCenter className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" className="h-8 w-8 p-0" pressed={editor?.isActive({ textAlign: 'right' })} onPressedChange={() => editor?.chain().focus().setTextAlign('right').run()}>
            <AlignRight className="h-4 w-4" />
          </Toggle>
        </div>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Media & Links */}
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={setLink}>
          <LinkIcon className="h-4 w-4" />
        </Button>
        
        <MediaBrowser 
          onSelect={handleMediaSelect}
          trigger={
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Insertar Multimedia">
              <ImageIcon className="h-4 w-4" />
            </Button>
          }
        />

        {/* AI Image Generation Button - ADDED DIRECTLY TO TOOLBAR */}
        <AIImageGenerator 
          onImageGenerated={handleAIImageGenerated}
          trigger={
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Generar Imagen con IA">
              <Sparkles className="h-4 w-4 text-purple-600" />
            </Button>
          }
        />

        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={addYoutube} title="Insertar YouTube">
          <Youtube className="h-4 w-4" />
        </Button>
        <div className="hidden sm:block">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => (editor?.chain().focus() as any).setHorizontalRule().run()}>
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggleHtmlMode}
          className="text-gray-500 hover:text-gray-900 h-8 w-8 p-0"
          title="Editar HTML"
        >
          <Code className="h-4 w-4" />
        </Button>

        {/* AI Rewrite */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 gap-1 h-8 px-2"
              title="Reescribir Texto"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold">Reescribir</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="end">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-900">Asistente de Reescritura</h4>
              
              <div className="space-y-2 pb-2 border-b">
                <Label className="text-xs text-muted-foreground">Objetivo</Label>
                <RadioGroup value={rewriteTarget} onValueChange={(v: any) => setRewriteTarget(v)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="t-all" />
                    <Label htmlFor="t-all" className="text-xs cursor-pointer font-bold text-primary">Todo el Texto</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="selection" id="t-sel" />
                    <Label htmlFor="t-sel" className="text-xs cursor-pointer">Selección</Label>
                  </div>
                </RadioGroup>
              </div>

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

              {rewriteTarget === 'all' && (
                <Alert className="py-2 bg-amber-50 border-amber-200">
                   <AlertDescription className="text-xs text-amber-800">
                     Asegúrate de que no haya imágenes antes de reescribir todo.
                   </AlertDescription>
                </Alert>
              )}

              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
                size="sm"
                onClick={handleRewrite}
                disabled={rewriting}
              >
                {rewriting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-2" />
                    {rewriteTarget === 'all' ? 'Reescribir TODO' : 'Reescribir Selección'}
                  </>
                )}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default EditorToolbar;