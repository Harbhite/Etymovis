
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { EtymologyTree, MindmapNode } from '../types';

interface TreeDiagramProps {
  data: EtymologyTree | null;
  searchTerm: string;
  exportTrigger: { format: 'png' | 'svg' | 'pdf' | 'jpeg' | null; timestamp: number } | null;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
  isDarkMode?: boolean;
  onNodeHover: (tooltip: { x: number; y: number; content: MindmapNode } | null) => void;
  onNodeLeave: () => void;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;
const HORIZONTAL_SPACING = 120;
const VERTICAL_SPACING = 60;
const LEVEL_OFFSET = 300;

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
  if (l.includes('latin') || l.includes('french') || l.includes('italic')) return 'Latin';
  if (l.includes('greek')) return 'Greek';
  if (l.includes('old english')) return 'Old English';
  if (l.includes('english')) return 'English';
  if (l.includes('germanic')) return 'Misc. Germanic';
  return 'Other';
};

const TreeDiagram: React.FC<TreeDiagramProps> = ({ data, searchTerm, exportTrigger, onContentReadyForExport, isFullScreen, isDarkMode, onNodeHover, onNodeLeave }) => {
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
    const visibleNodes = flatNodes.filter(node => {
      let current = node;
      while (current.parentId) {
        const parent = nodesMap.get(current.parentId);
        if (!parent || !parent.isExpanded) return false;
        current = parent;
      }
      return true;
    });

    const rootNode = visibleNodes.find(node => !node.parentId);
    if (!rootNode) return Array.from(nodesMap.values());

    const calculateSubtreeDimensions = (nodeId: string): { totalHeight: number; maxWidth: number; } => {
      const node = nodesMap.get(nodeId);
      if (!node) return { totalHeight: 0, maxWidth: 0 };

      const children = visibleNodes.filter(child => child.parentId === nodeId);
      if (children.length === 0) {
        node.subtreeHeight = NODE_HEIGHT;
        node.subtreeWidth = NODE_WIDTH;
        return { totalHeight: NODE_HEIGHT, maxWidth: NODE_WIDTH };
      }

      let currentChildrenHeight = 0;
      let maxChildWidth = 0;
      children.forEach(child => {
        const childDims = calculateSubtreeDimensions(child.id);
        currentChildrenHeight += childDims.totalHeight + VERTICAL_SPACING;
        maxChildWidth = Math.max(maxChildWidth, childDims.maxWidth);
      });
      currentChildrenHeight -= VERTICAL_SPACING;

      node.subtreeHeight = Math.max(NODE_HEIGHT, currentChildrenHeight);
      node.subtreeWidth = NODE_WIDTH + LEVEL_OFFSET + maxChildWidth;

      return { totalHeight: node.subtreeHeight, maxWidth: node.subtreeWidth };
    };

    calculateSubtreeDimensions(rootNode.id);

    const positionSubtree = (nodeId: string, currentX: number, currentYOffset: number): number => {
      const node = nodesMap.get(nodeId);
      if (!node) return currentYOffset;

      const children = visibleNodes.filter(child => child.parentId === nodeId);
      node.x = currentX;

      if (children.length === 0) {
        node.y = currentYOffset + (NODE_HEIGHT / 2);
        return currentYOffset + node.subtreeHeight + VERTICAL_SPACING;
      }

      let childCurrentY = currentYOffset;
      children.forEach(child => {
        childCurrentY = positionSubtree(child.id, currentX + LEVEL_OFFSET, childCurrentY);
      });

      const firstChild = nodesMap.get(children[0].id);
      const lastChild = nodesMap.get(children[children.length - 1].id);
      if (firstChild && lastChild) {
        node.y = (firstChild.y + lastChild.y) / 2;
      } else {
        node.y = currentYOffset + (node.subtreeHeight / 2);
      }
      
      return currentYOffset + node.subtreeHeight + VERTICAL_SPACING;
    };

    positionSubtree(rootNode.id, NODE_WIDTH / 2, (containerHeight / 2) - (rootNode.subtreeHeight / 2));

    let minX = Infinity, maxX = -Infinity;
    visibleNodes.forEach(node => {
      if (node.x > -1000) {
        minX = Math.min(minX, node.x - NODE_WIDTH / 2);
        maxX = Math.max(maxX, node.x + NODE_WIDTH / 2);
      }
    });

    if (minX !== Infinity) {
      const layoutWidth = maxX - minX;
      const offsetX = (containerWidth / 2) - (layoutWidth / 2) - minX;
      Array.from(nodesMap.values()).forEach(node => {
        if (node.x > -1000) node.x += offsetX;
      });
    }

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
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const actualHeight = isFullScreen ? window.innerHeight : Math.max(height, 600);
        setSvgDimensions({ width: Math.max(width, 100), height: actualHeight });

        if (nodes.length > 0) {
           // Always re-calculate layout on resize to ensure centering
           const layout = calculateLayout(nodes, width, actualHeight);
           setNodes(layout);

           if (!initialTransformSet) {
             setInitialTransformSet(true);
             setTransformState({ scale: 0.8, translateX: 100, translateY: 0 });
           }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [nodes.length, isFullScreen, initialTransformSet, calculateLayout]);

  const getPath = (startNode: MindmapNode, endNode: MindmapNode): string => {
    const startX = startNode.x + NODE_WIDTH / 2;
    const startY = startNode.y;
    const endX = endNode.x - NODE_WIDTH / 2;
    const endY = endNode.y;
    const controlX1 = startX + HORIZONTAL_SPACING / 2;
    const controlX2 = endX - HORIZONTAL_SPACING / 2;
    return `M${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;
  };

  useEffect(() => {
    if (exportTrigger && svgRef.current) onContentReadyForExport(svgRef.current);
  }, [exportTrigger, onContentReadyForExport]);

  if (!data) return null;

  const visibleNodes = nodes.filter(node => node.x > -1000);

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden rounded-xl shadow-deep p-4 cursor-grab active:cursor-grabbing
                                       ${isFullScreen ? 'h-full' : 'min-h-[600px] h-[calc(100vh-250px)]'}
                                       ${isDarkMode ? 'bg-dark-bg/60' : 'bg-card-glass'}`}>
      <svg
        ref={svgRef}
        width={svgDimensions.width}
        height={svgDimensions.height}
        className="absolute inset-0"
        onMouseDown={e => { setIsPanning(true); setStartPanPoint({ x: e.clientX - transformState.translateX, y: e.clientY - transformState.translateY }); }}
        onMouseMove={e => { if (isPanning) setTransformState(prev => ({ ...prev, translateX: e.clientX - startPanPoint.x, translateY: e.clientY - startPanPoint.y })); }}
        onMouseUp={() => setIsPanning(false)}
        onMouseLeave={() => { setIsPanning(false); onNodeLeave(); }}
      >
        <g transform={`translate(${transformState.translateX}, ${transformState.translateY}) scale(${transformState.scale})`}>
          {visibleNodes.map(node => node.childrenIds.map(childId => {
            const child = visibleNodes.find(n => n.id === childId);
            if (!child) return null;
            return (
              <path
                key={`${node.id}-${child.id}`}
                d={getPath(node, child)}
                fill="none"
                stroke={node.color}
                strokeWidth="2"
                opacity="0.4"
              />
            );
          }))}
          {visibleNodes.map(node => (
            <foreignObject key={node.id} x={node.x - NODE_WIDTH / 2} y={node.y - NODE_HEIGHT / 2} width={NODE_WIDTH} height={NODE_HEIGHT}>
              <div
                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 shadow-soft transition-all duration-300
                            ${isDarkMode ? 'bg-gray-800 border-opacity-40' : 'bg-white'}`}
                style={{ borderColor: node.color }}
              >
                <div className="font-sans text-[10px] uppercase font-bold" style={{ color: node.color }}>{node.language}</div>
                <div className={`font-serif text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-text-ink'}`}>{node.word}</div>
              </div>
            </foreignObject>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default TreeDiagram;
