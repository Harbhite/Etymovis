
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EtymologyTree, MindmapNode } from '../types';

interface ChronologicalLineProps {
  data: EtymologyTree | null;
  exportTrigger: { format: 'png' | 'svg' | 'pdf' | 'jpeg' | null; timestamp: number } | null;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const HORIZONTAL_SPACING = 220;
const VERTICAL_STACK_SPACING = 40;
const TIMELINE_CENTER_Y_OFFSET = 0;

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
  if (language.includes('PIE')) return 'PIE';
  if (language.includes('Proto-Germanic')) return 'Proto-Germanic';
  if (language.includes('Latin') || language.includes('Old French') || language.includes('French')) return 'Latin';
  if (language.includes('Greek')) return 'Greek';
  if (language.includes('Old English')) return 'Old English';
  if (language.includes('English') && !language.includes('Old')) return 'English';
  if (language.includes('Germanic')) return 'Misc. Germanic';
  return 'Other';
};

const ChronologicalLine: React.FC<ChronologicalLineProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen }) => {
  const [nodes, setNodes] = useState<MindmapNode[]>([]);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [animatedNodes, setAnimatedNodes] = useState<string[]>([]);

  const flattenTree = useCallback((tree: EtymologyTree | null, parentId: string | null = null, level: number = 0, index: number = 0): MindmapNode[] => {
    if (!tree) return [];

    if (typeof tree.word !== 'string' || typeof tree.language !== 'string') {
      return [];
    }

    const id = `${tree.word}-${tree.language}-${level}-${index}`;
    const languageFamily = getLanguageFamily(tree.language);
    const color = LANGUAGE_FAMILY_COLORS[languageFamily] || LANGUAGE_FAMILY_COLORS['Other'];

    const currentNode: MindmapNode = {
      id,
      text: `${tree.language}: ${tree.word}${tree.meaning ? ` ("${tree.meaning}")` : ''}`,
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
      if (child && typeof child.word === 'string' && typeof child.language === 'string') {
        const childId = `${child.word}-${child.language}-${level + 1}-${childIndex}`;
        currentNode.childrenIds.push(childId);
        childrenNodes.push(...flattenTree(child, id, level + 1, childIndex));
      }
    });

    return [currentNode, ...childrenNodes];
  }, []);

  const calculateLayout = useCallback((flatNodes: MindmapNode[], containerWidth: number, containerHeight: number): MindmapNode[] => {
    if (!flatNodes.length) return [];

    const nodesByLevel: { [key: number]: MindmapNode[] } = {};
    let maxLevel = 0;
    flatNodes.forEach(node => {
      if (!nodesByLevel[node.level]) {
        nodesByLevel[node.level] = [];
      }
      nodesByLevel[node.level].push(node);
      maxLevel = Math.max(maxLevel, node.level);
    });

    const laidOutNodes = new Map<string, MindmapNode>(flatNodes.map(node => [node.id, { ...node }]));

    let minLevelY = Infinity;
    let maxLevelY = -Infinity;

    for (let level = 0; level <= maxLevel; level++) {
      const nodesAtLevel = nodesByLevel[level] || [];
      const levelX = (level * HORIZONTAL_SPACING) + NODE_WIDTH / 2;

      nodesAtLevel.sort((a, b) => a.id.localeCompare(b.id));

      const totalHeightAtLevel = nodesAtLevel.length * NODE_HEIGHT + (nodesAtLevel.length - 1) * VERTICAL_STACK_SPACING;
      
      let startY = containerHeight / 2 - totalHeightAtLevel / 2 + TIMELINE_CENTER_Y_OFFSET;

      nodesAtLevel.forEach((node, index) => {
        const positionedNode = laidOutNodes.get(node.id)!;
        positionedNode.x = levelX;
        positionedNode.y = startY + index * (NODE_HEIGHT + VERTICAL_STACK_SPACING) + NODE_HEIGHT / 2;
        laidOutNodes.set(node.id, positionedNode);
      });

      if (nodesAtLevel.length > 0) {
        minLevelY = Math.min(minLevelY, startY);
        maxLevelY = Math.max(maxLevelY, startY + totalHeightAtLevel);
      }
    }

    // Center horizontally if possible, or start from left
    const minX = Math.min(...Array.from(laidOutNodes.values()).map(n => n.x - NODE_WIDTH/2));
    const maxX = Math.max(...Array.from(laidOutNodes.values()).map(n => n.x + NODE_WIDTH/2));
    
    const contentWidth = maxX - minX;
    let offsetX = Math.max(50, (containerWidth - contentWidth) / 2 - minX);

    // If content is wider than container, ensure it starts with some padding
    if (contentWidth > containerWidth) {
        offsetX = 50 - minX;
    }

    Array.from(laidOutNodes.values()).forEach(node => {
        node.x += offsetX;
    });

    // Update Dimensions to fit content if larger than view
    const totalContentWidth = Math.max(containerWidth, maxX + offsetX + 50);
    const totalContentHeight = Math.max(containerHeight, maxLevelY + 50); // Add some padding

    if (totalContentWidth !== svgDimensions.width || totalContentHeight !== svgDimensions.height) {
         // Avoid infinite loop by only updating if significantly different or if current is 0
         if (Math.abs(totalContentWidth - svgDimensions.width) > 10 || Math.abs(totalContentHeight - svgDimensions.height) > 10 || svgDimensions.width === 0) {
             // We can't set state during render/calc, so we do it via effect or verify logic
         }
    }

    return Array.from(laidOutNodes.values());
  }, []);

  useEffect(() => {
    if (data) {
      const initialFlatNodes = flattenTree(data);
      setNodes(initialFlatNodes);
      setAnimatedNodes([]);

      // Staggered animation trigger
      const timeouts: NodeJS.Timeout[] = [];
      initialFlatNodes.forEach((node, index) => {
        const timeout = setTimeout(() => {
          setAnimatedNodes(prev => [...prev, node.id]);
        }, index * 100 + 100);
        timeouts.push(timeout);
      });

      return () => {
        timeouts.forEach(clearTimeout);
      };
    } else {
      setNodes([]);
    }
  }, [data, flattenTree]);


  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // If fullscreen, use window dimensions, else use container dimensions (but ensure min height)
        const actualHeight = isFullScreen ? window.innerHeight : Math.max(height, 600);
        const actualWidth = isFullScreen ? window.innerWidth : width;

        // Recalculate layout with new dimensions
        setNodes(prevNodes => calculateLayout(prevNodes, actualWidth, actualHeight));
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial call
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [isFullScreen, calculateLayout, nodes.length]);

  // Update SVG dimensions based on content
  useEffect(() => {
    if (containerRef.current && nodes.length > 0) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const actualHeight = isFullScreen ? window.innerHeight : Math.max(height, 600);
      const actualWidth = isFullScreen ? window.innerWidth : width;

      const maxX = Math.max(...nodes.map(n => n.x + NODE_WIDTH/2), actualWidth);
      const maxY = Math.max(...nodes.map(n => n.y + NODE_HEIGHT/2), actualHeight);

      setSvgDimensions(prev => {
        if (prev.width !== maxX + 50 || prev.height !== maxY + 50) {
          return { width: maxX + 50, height: maxY + 50 };
        }
        return prev;
      });
    }
  }, [nodes, isFullScreen]);


  useEffect(() => {
    if (exportTrigger && svgRef.current) {
      onContentReadyForExport(svgRef.current);
    }
  }, [exportTrigger, onContentReadyForExport]);

  const getPath = (startNode: MindmapNode, endNode: MindmapNode): string => {
    const startX = startNode.x + NODE_WIDTH / 2;
    const startY = startNode.y;
    const endX = endNode.x - NODE_WIDTH / 2;
    const endY = endNode.y;

    if (endX < startX + 50) {
        // Curve for when nodes are close horizontally or backwards (shouldn't happen in timeline usually but just in case)
        return `M${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`;
    }

    const controlX1 = startX + (endX - startX) / 2;
    const controlY1 = startY;
    const controlX2 = endX - (endX - startX) / 2;
    const controlY2 = endY;

    return `M${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
  };

  if (!data) {
    return (
      <div className="flex justify-center items-center h-full text-text-light text-lg italic">
        Begin your journey through time...
      </div>
    );
  }

  const maxLevel = nodes.reduce((max, node) => Math.max(max, node.level), 0);
  const timelineStartX = nodes.length > 0 ? Math.min(...nodes.map(n => n.x)) - NODE_WIDTH : 50;
  const timelineEndX = nodes.length > 0 ? Math.max(...nodes.map(n => n.x)) + NODE_WIDTH : 800;
  // Determine timeline Y based on the middle of the vertical space
  const timelineY = svgDimensions.height / 2 + TIMELINE_CENTER_Y_OFFSET;

  return (
    <div ref={containerRef} className={`relative w-full overflow-auto rounded-xl bg-card-glass shadow-deep p-4 transition-all duration-500
                                       ${isFullScreen ? 'h-full fixed inset-0 z-50 bg-bg-paper' : 'min-h-[600px] h-[calc(100vh-250px)]'}`}>
      <svg
        ref={svgRef}
        width={svgDimensions.width}
        height={svgDimensions.height}
        className="min-w-full min-h-full"
      >
        <defs>
          <linearGradient id="timeline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
             <stop offset="0%" stopColor="#ccc" stopOpacity="0" />
             <stop offset="10%" stopColor="#ccc" stopOpacity="0.5" />
             <stop offset="90%" stopColor="#ccc" stopOpacity="0.5" />
             <stop offset="100%" stopColor="#ccc" stopOpacity="0" />
          </linearGradient>
          <marker id="arrowhead-chrono" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#A68A78" />
          </marker>
        </defs>

        <line
          x1={timelineStartX}
          y1={timelineY}
          x2={timelineEndX}
          y2={timelineY}
          stroke="url(#timeline-gradient)"
          strokeWidth="4"
          strokeDasharray="10,5"
          className="opacity-30"
        />

        {nodes.map(node => {
            const parentNode = nodes.find(n => n.id === node.parentId);
            if (!parentNode) return null;
            const isVisible = animatedNodes.includes(node.id) && animatedNodes.includes(parentNode.id);

            return (
                <path
                    key={`${parentNode.id}-${node.id}`}
                    d={getPath(parentNode, node)}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="2"
                    markerEnd="url(#arrowhead-chrono)"
                    className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-60' : 'opacity-0'}`}
                    style={{
                        strokeDasharray: '1000',
                        strokeDashoffset: isVisible ? '0' : '1000'
                    }}
                />
            );
        })}

        {nodes.map((node, i) => {
             const isVisible = animatedNodes.includes(node.id);
             return (
              <foreignObject
                key={node.id}
                x={node.x - NODE_WIDTH / 2}
                y={node.y - NODE_HEIGHT / 2}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                className={`transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <div
                  className="flex flex-col items-center justify-center p-2 rounded-xl border-b-4 bg-white shadow-soft text-center h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-deep group cursor-default"
                  style={{ borderColor: node.color }}
                >
                  <div className="font-sans text-[10px] uppercase tracking-wider text-text-light group-hover:text-text-ink transition-colors">{node.language}</div>
                  <div className="font-serif text-lg font-bold text-text-ink leading-tight mt-1">
                    {node.word}
                  </div>
                  {node.meaning && <div className="text-xs text-text-light italic max-w-[95%] truncate mt-0.5 opacity-80 group-hover:opacity-100">{node.meaning}</div>}

                  {/* Timeline Dot */}
                  <div className="absolute -bottom-[22px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 z-10" style={{ borderColor: node.color }}></div>
                </div>
              </foreignObject>
            );
        })}
      </svg>
    </div>
  );
};

export default ChronologicalLine;
