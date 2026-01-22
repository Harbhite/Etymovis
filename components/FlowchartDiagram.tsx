import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { EtymologyTree, MindmapNode } from '../types';

interface FlowchartDiagramProps {
  data: EtymologyTree | null;
  searchTerm: string;
  exportTrigger: { format: 'png' | 'svg' | 'pdf' | 'jpeg' | null; timestamp: number } | null;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
  isDarkMode?: boolean;
  onNodeHover: (tooltip: { x: number; y: number; content: MindmapNode } | null) => void;
  onNodeLeave: () => void;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 90;
const HORIZONTAL_SPACING = 100;
const VERTICAL_SPACING = 40;

const LANGUAGE_FAMILY_COLORS: { [key: string]: string } = {
  'PIE': '#4A5D45',       
  'Proto-Germanic': '#964B3B', 
  'Latin': '#C27B66',      
  'Greek': '#3B5B66',      
  'Old English': '#5E7153', 
  'English': '#D4A373',    
  'Misc. Germanic': '#7C677F', 
  'Other': '#A68A78',      
};

const getLanguageFamily = (language: string): string => {
  if (typeof language !== 'string') return 'Other';
  const l = language.toLowerCase();
  if (l.includes('pie') || l.includes('proto-indo')) return 'PIE';
  if (l.includes('proto-germanic')) return 'Proto-Germanic';
  if (l.includes('latin') || l.includes('french')) return 'Latin';
  if (l.includes('greek')) return 'Greek';
  if (l.includes('old english')) return 'Old English';
  if (l.includes('english')) return 'English';
  if (l.includes('germanic')) return 'Misc. Germanic';
  return 'Other';
};

const FlowchartDiagram: React.FC<FlowchartDiagramProps> = ({ data, searchTerm, exportTrigger, onContentReadyForExport, isFullScreen, isDarkMode, onNodeHover, onNodeLeave }) => {
  const [nodes, setNodes] = useState<MindmapNode[]>([]);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [transformState, setTransformState] = useState({ scale: 1, translateX: 0, translateY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });
  const [initialTransformSet, setInitialTransformSet] = useState(false);

  const flattenTree = useCallback((tree: EtymologyTree | null, parentId: string | null = null, level: number = 0, index: number = 0): MindmapNode[] => {
    if (!tree || !tree.word || !tree.language) return [];

    const id = `${tree.word}-${tree.language}-${level}-${index}`;
    const languageFamily = getLanguageFamily(tree.language);
    const color = LANGUAGE_FAMILY_COLORS[languageFamily] || LANGUAGE_FAMILY_COLORS['Other'];

    const currentNode: MindmapNode = {
      id,
      text: `${tree.language}: ${tree.word}`,
      word: tree.word,
      language: tree.language,
      languageFamily,
      meaning: tree.meaning,
      parentId,
      childrenIds: [],
      level,
      isExpanded: true,
      x: 0, y: 0,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      color,
      highlighted: false,
      subtreeHeight: 0,
      subtreeWidth: 0,
      childrenYStart: 0,
    };

    const childrenNodes: MindmapNode[] = [];
    tree.children?.forEach((child, childIndex) => {
      if (child && child.word && child.language) {
        const childId = `${child.word}-${child.language}-${level + 1}-${childIndex}`;
        currentNode.childrenIds.push(childId);
        childrenNodes.push(...flattenTree(child, id, level + 1, childIndex));
      }
    });

    return [currentNode, ...childrenNodes];
  }, []);

  const calculateLayout = useCallback((flatNodes: MindmapNode[], containerWidth: number, containerHeight: number): MindmapNode[] => {
    if (!flatNodes.length) return [];

    const nodesMap = new Map<string, MindmapNode>(flatNodes.map(node => [node.id, { ...node, x: -1000, y: -1000 }]));
    
    // Group by level
    const levels: { [key: number]: MindmapNode[] } = {};
    flatNodes.forEach(n => {
      if (!levels[n.level]) levels[n.level] = [];
      levels[n.level].push(n);
    });

    const maxLevel = Math.max(...Object.keys(levels).map(Number));
    
    // Position nodes in a grid
    Object.keys(levels).forEach(lvlStr => {
      const lvl = Number(lvlStr);
      const lvlNodes = levels[lvl];
      const totalH = lvlNodes.length * NODE_HEIGHT + (lvlNodes.length - 1) * VERTICAL_SPACING;
      const startY = (containerHeight / 2) - (totalH / 2);
      
      lvlNodes.forEach((node, idx) => {
        const n = nodesMap.get(node.id)!;
        n.x = lvl * (NODE_WIDTH + HORIZONTAL_SPACING) + NODE_WIDTH / 2;
        n.y = startY + idx * (NODE_HEIGHT + VERTICAL_SPACING) + NODE_HEIGHT / 2;
      });
    });

    // Offset based on container
    let minX = Infinity, maxX = -Infinity;
    nodesMap.forEach(n => {
      minX = Math.min(minX, n.x - NODE_WIDTH / 2);
      maxX = Math.max(maxX, n.x + NODE_WIDTH / 2);
    });

    const layoutW = maxX - minX;
    const offsetX = (containerWidth / 2) - (layoutW / 2) - minX;
    nodesMap.forEach(n => n.x += offsetX);

    return Array.from(nodesMap.values());
  }, []);

  useEffect(() => {
    if (data) {
      const initialFlatNodes = flattenTree(data);
      setNodes(initialFlatNodes);
      setInitialTransformSet(false);
    }
  }, [data, flattenTree]);

  useLayoutEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const actualHeight = isFullScreen ? window.innerHeight : height;
      setSvgDimensions({ width, height: actualHeight });

      if (nodes.length > 0) {
        setNodes(prev => {
          const updated = calculateLayout(prev, width, actualHeight);
          if (!initialTransformSet && updated.length > 0) {
            setInitialTransformSet(true);
            setTransformState({ scale: 0.9, translateX: 50, translateY: 0 });
          }
          return updated;
        });
      }
    }
  }, [nodes.length, calculateLayout, isFullScreen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setStartPanPoint({ x: e.clientX - transformState.translateX, y: e.clientY - transformState.translateY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setTransformState(prev => ({ ...prev, translateX: e.clientX - startPanPoint.x, translateY: e.clientY - startPanPoint.y }));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = 1.1;
    const newScale = e.deltaY < 0 ? transformState.scale * scaleFactor : transformState.scale / scaleFactor;
    setTransformState(prev => ({ ...prev, scale: Math.max(0.1, Math.min(5, newScale)) }));
  };

  const getStepPath = (startNode: MindmapNode, endNode: MindmapNode): string => {
    const x1 = startNode.x + NODE_WIDTH / 2;
    const y1 = startNode.y;
    const x2 = endNode.x - NODE_WIDTH / 2;
    const y2 = endNode.y;
    const midX = x1 + (x2 - x1) / 2;
    return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
  };

  useEffect(() => {
    if (exportTrigger && svgRef.current) onContentReadyForExport(svgRef.current);
  }, [exportTrigger, onContentReadyForExport]);

  if (!data) return null;

  return (
    <div ref={containerRef} className={`relative w-full rounded-xl shadow-deep p-4 cursor-grab active:cursor-grabbing transition-colors duration-500
                                       ${isFullScreen ? 'h-full' : 'min-h-[600px] h-[calc(100vh-250px)]'}
                                       ${isDarkMode ? 'bg-dark-bg/60' : 'bg-card-glass'}`}>
      <svg
        ref={svgRef}
        width={svgDimensions.width}
        height={svgDimensions.height}
        className="absolute inset-0 w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsPanning(false)}
        onMouseLeave={() => { setIsPanning(false); onNodeLeave(); }}
        onWheel={handleWheel}
      >
        <g transform={`translate(${transformState.translateX}, ${transformState.translateY}) scale(${transformState.scale})`}>
          {nodes.map(node => node.childrenIds.map(childId => {
            const child = nodes.find(n => n.id === childId);
            if (!child) return null;
            return (
              <path
                key={`${node.id}-${child.id}`}
                d={getStepPath(node, child)}
                fill="none"
                stroke={isDarkMode ? `${node.color}AA` : node.color}
                strokeWidth="2.5"
                markerEnd={`url(#arrowhead-${node.languageFamily})`}
                className="transition-all duration-700 ease-in-out opacity-40"
              />
            );
          }))}

          <defs>
            {Object.entries(LANGUAGE_FAMILY_COLORS).map(([family, color]) => (
              <marker key={family} id={`arrowhead-${family}`} markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={color} />
              </marker>
            ))}
          </defs>

          {nodes.map(node => (
            <foreignObject
              key={node.id}
              x={node.x - NODE_WIDTH / 2}
              y={node.y - NODE_HEIGHT / 2}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              onMouseEnter={(e) => onNodeHover({ x: e.clientX, y: e.clientY, content: node })}
              onMouseLeave={onNodeLeave}
              className="animate-fade-in"
            >
              <div
                className={`flex flex-col border-2 rounded-lg shadow-soft cursor-pointer h-full transition-all duration-300
                            ${isDarkMode ? 'bg-gray-800 border-opacity-40 hover:bg-gray-700' : 'bg-white hover:shadow-deep'}`}
                style={{ borderColor: node.color }}
              >
                <div 
                  className="px-3 py-1 font-sans text-[10px] uppercase font-bold text-white tracking-widest"
                  style={{ backgroundColor: node.color }}
                >
                  {node.language}
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
                  <div className={`font-serif text-lg font-bold ${isDarkMode ? 'text-white' : 'text-text-ink'}`}>
                    {node.word}
                  </div>
                  {node.meaning && (
                    <div className={`text-[10px] italic line-clamp-2 mt-1 ${isDarkMode ? 'text-white/60' : 'text-text-light'}`}>
                      "{node.meaning}"
                    </div>
                  )}
                </div>
              </div>
            </foreignObject>
          ))}
        </g>
      </svg>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
};

export default FlowchartDiagram;