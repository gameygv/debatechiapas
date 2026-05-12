import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';

const ResizableVideo = (props: NodeViewProps) => {
  const { node, updateAttributes, selected } = props;
  const [resizing, setResizing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const currentWidth = node.attrs.width || '100%';
  const currentAlign = node.attrs.textAlign || 'left';

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!videoRef.current) return;
    
    setResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = videoRef.current.offsetWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      const diff = moveEvent.clientX - startXRef.current;
      const newWidth = Math.max(200, startWidthRef.current + diff);
      containerRef.current.style.width = `${newWidth}px`;
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setResizing(false);

      if (!containerRef.current) return;
      const diff = upEvent.clientX - startXRef.current;
      const finalWidth = Math.max(200, startWidthRef.current + diff);
      
      // Guardar el ancho final
      updateAttributes({ width: `${finalWidth}px` });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getAlignmentClass = () => {
    switch (currentAlign) {
      case 'center': return 'mx-auto';
      case 'right': return 'ml-auto';
      default: return 'mr-auto';
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
          "relative inline-block max-w-full transition-shadow group",
          getAlignmentClass(),
          (selected || resizing) && "ring-2 ring-primary ring-offset-2 rounded-lg"
        )}
        style={{ width: currentWidth }}
      >
        <video
          ref={videoRef}
          src={node.attrs.src}
          controls
          className="block w-full h-auto rounded-lg shadow-sm bg-black"
          draggable={false}
        />
        
        <div
          className={cn(
            "absolute bottom-2 right-2 w-5 h-5 bg-primary border-2 border-white rounded-full cursor-nwse-resize z-30 shadow-lg transition-opacity",
            "opacity-0 group-hover:opacity-100",
            (selected || resizing) && "opacity-100"
          )}
          onMouseDown={handleMouseDown}
        />
      </div>
    </NodeViewWrapper>
  );
};

export default ResizableVideo;