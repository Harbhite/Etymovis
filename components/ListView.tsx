
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { EtymologyTree } from '../types';

interface ListViewProps {
  data: EtymologyTree | null;
  exportTrigger: { format: 'png' | 'svg' | 'pdf' | 'jpeg' | null; timestamp: number } | null;
  onContentReadyForExport: (content: HTMLElement | null) => void; // New callback, content is HTML
  isFullScreen: boolean;
}

const renderNode = (node: EtymologyTree, level: number = 0) => (
  <div key={`${node.word}-${node.language}-${level}`} className={`ml-${level * 4} py-1`}>
    <div className="flex items-baseline gap-2">
      <span className="font-semibold text-text-ink">{node.word}</span>
      <span className="text-text-light text-sm italic">({node.language})</span>
      {node.meaning && <span className="text-text-light text-sm">"{node.meaning}"</span>}
    </div>
    {node.children && (
      <div className="border-l border-gray-300 ml-2 pl-4">
        {node.children.map(child => renderNode(child, level + 1))}
      </div>
    )}
  </div>
);

const ListView: React.FC<ListViewProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (exportTrigger && containerRef.current) {
      // For HTML-based export, we pass the HTMLElement directly
      onContentReadyForExport(containerRef.current);
    }
  }, [exportTrigger, onContentReadyForExport]);

  if (!data) {
    return (
      <div className="flex justify-center items-center h-full text-text-light text-lg">
        Enter a word to see its etymological list view!
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-xl bg-card-glass shadow-deep p-4 overflow-auto
                 ${isFullScreen ? 'h-full' : 'min-h-[600px] h-[calc(100vh-250px)]'}`}
    >
      <div className="space-y-2 p-4 font-sans">
        {renderNode(data)}
      </div>
    </div>
  );
};

export default ListView;