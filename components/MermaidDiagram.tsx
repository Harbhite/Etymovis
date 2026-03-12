import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import mermaid from 'mermaid';
import { EtymologyTree } from '../types';

interface MermaidDiagramProps {
  data: EtymologyTree | null;
  exportTrigger: any;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
  onNodeHover?: (tooltip: { x: number; y: number; content: any }) => void;
  onNodeLeave?: () => void;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen, onNodeHover, onNodeLeave }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: isFullScreen ? window.innerHeight : height });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullScreen]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true
      }
    });
  }, []);

  const generateMermaidString = (root: EtymologyTree | null): string => {
    if (!root) return '';

    let str = 'graph LR\n';
    let idCounter = 0;
    const nodeMap = new Map<EtymologyTree, string>();

    const traverse = (node: EtymologyTree): string => {
      if (nodeMap.has(node)) return nodeMap.get(node)!;

      const id = `node${idCounter++}`;
      nodeMap.set(node, id);

      const word = node.word.replace(/"/g, '&quot;');
      const lang = node.language.replace(/"/g, '&quot;');
      str += `    ${id}["<div style='text-align:center;'><strong>${word}</strong><br/><i>${lang}</i></div>"]\n`;

      if (node.children) {
        node.children.forEach(child => {
          const childId = traverse(child);
          str += `    ${childId} --> ${id}\n`;
        });
      }

      return id;
    };

    traverse(root);
    return str;
  };

  useEffect(() => {
    const renderDiagram = async () => {
      if (!data) return;

      const graphDefinition = generateMermaidString(data);
      try {
        const { svg } = await mermaid.render('mermaid-svg', graphDefinition);
        setSvgContent(svg);
      } catch (err) {
        console.error('Mermaid rendering failed', err);
      }
    };

    renderDiagram();
  }, [data, dimensions]);

  useEffect(() => {
    if (exportTrigger && containerRef.current) {
      const svgEl = containerRef.current.querySelector('svg');
      if (svgEl) {
        onContentReadyForExport(svgEl);
      }
    }
  }, [exportTrigger, onContentReadyForExport]);

  // Handle tooltip hover
  useEffect(() => {
    if (!containerRef.current || !onNodeHover || !onNodeLeave || !data) return;

    // We need to map Mermaid node IDs back to EtymologyTree data
    let idCounter = 0;
    const nodeDataMap = new Map<string, EtymologyTree>();

    const mapNodes = (node: EtymologyTree) => {
      const id = `node${idCounter++}`;
      nodeDataMap.set(id, node);
      if (node.children) {
        node.children.forEach(mapNodes);
      }
    };
    mapNodes(data);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const nodeGroup = target.closest('.node');

      if (nodeGroup) {
        const idMatch = nodeGroup.id.match(/^flowchart-(node\d+)-/);
        const nodeId = idMatch ? idMatch[1] : nodeGroup.id;

        const nodeData = nodeDataMap.get(nodeId);
        if (nodeData) {
          onNodeHover({
            x: e.clientX,
            y: e.clientY,
            content: {
              word: nodeData.word,
              language: nodeData.language,
              meaning: nodeData.meaning,
              era: nodeData.era,
              context: nodeData.context
            }
          });
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.node')) {
        onNodeLeave();
      }
    };

    const container = containerRef.current;
    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);

    return () => {
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
    };
  }, [svgContent, data, onNodeHover, onNodeLeave]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-xl bg-card-glass shadow-deep flex items-center justify-center overflow-auto
                 ${isFullScreen ? 'h-full' : 'min-h-[600px] h-[calc(100vh-250px)]'}`}
    >
      <div
        dangerouslySetInnerHTML={{ __html: svgContent }}
        className="flex items-center justify-center min-w-max min-h-max p-8 mermaid-container"
      />
    </div>
  );
};

export default MermaidDiagram;
