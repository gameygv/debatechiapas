import React, { useState, useRef, useCallback, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';

const ResizableImage = (props: NodeViewProps) => {
  const { node, updateAttributes, selected } = props;
  const [resizing, setResizing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Obtener el ancho actual del nodo
  const currentWidth = node.attrs.width || '100%';
  const currentAlign = node.attrs.textAlign || 'left';

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!imageRef.current) return;
    
    setResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = imageRef.current.offsetWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      
      const diff = moveEvent.clientX - startXRef.current;
      const newWidth = Math.max(100, startWidthRef.current + diff);
      
      // Actualizar visualmente durante el drag
      containerRef.current.style.width = `${newWidth}px`;
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setResizing(false);

      if (!containerRef.current) return;
      
      const diff = upEvent.clientX - startXRef.current;
      const finalWidth = Math.max(100, startWidthRef.current + diff);
      
      // CRITICAL: Actualizar el atributo del nodo con el nuevo ancho en píxeles
      console.log('[ResizableImage] Guardando width:', `${finalWidth}px`);
      updateAttributes({ width: `${finalWidth}px` });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateAttributes]);

  // Determinar la clase de alineación para el contenedor
  const getAlignmentClass = () => {
    switch (currentAlign) {
      case 'center':
        return 'mx-auto';
      case 'right':
        return 'ml-auto';
      case 'left':
      default:
        return 'mr-auto';
    }
  };

  return (
    <NodeViewWrapper 
      className="my-4 leading-none flex w-full"
      style={{ 
        justifyContent: currentAlign === 'center' ? 'center' : currentAlign === 'right' ? 'flex-end' : 'flex-start'
      }}
    >
      <div 
        ref={containerRef}
        className={cn(
          "relative inline-block max-w-full transition-shadow",
          getAlignmentClass(),
          (selected || resizing) && "ring-2 ring-primary ring-offset-2 rounded-lg"
        )}
        style={{ 
          width: currentWidth,
        }}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          className="block w-full h-auto rounded-lg shadow-sm"
          draggable={false}
        />
        
        {/* Resize Handle */}
        <div
          className={cn(
            "absolute bottom-2 right-2 w-5 h-5 bg-primary border-2 border-white rounded-full cursor-nwse-resize z-30 shadow-lg transition-opacity",
            "opacity-0 hover:opacity-100",
            (selected || resizing) && "opacity-100"
          )}
          onMouseDown={handleMouseDown}
          title="Arrastra para redimensionar"
        />
        
        {/* Size indicator */}
        {resizing && (
          <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono z-30">
            {containerRef.current ? `${containerRef.current.offsetWidth}px` : currentWidth}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default ResizableImage;