import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ResizableVideo from './ResizableVideo';

export interface VideoOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string }) => ReturnType;
    };
  }
}

export const VideoExtension = Node.create<VideoOptions>({
  name: 'video',
  group: 'block',
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      width: {
        default: '100%',
        parseHTML: element => element.style.width || element.getAttribute('width') || '100%',
        renderHTML: attributes => {
          if (!attributes.width) return {};
          // Forzamos el guardado en el atributo style
          return { style: `width: ${attributes.width}; max-width: 100%; height: auto; display: block;` };
        },
      },
      textAlign: {
        default: 'left',
        parseHTML: element => element.getAttribute('data-align') || element.style.textAlign || 'left',
        renderHTML: attributes => {
          if (!attributes.textAlign || attributes.textAlign === 'left') return {};
          return { 'data-align': attributes.textAlign };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'video[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { 
      controls: 'true',
      playsinline: 'true',
      preload: 'metadata'
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableVideo);
  },

  addCommands() {
    return {
      setVideo: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});