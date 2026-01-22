
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EtymologyTree, MindmapNode } from '../types';

interface ChronologicalLineProps {
  data: EtymologyTree | null;
  exportTrigger: { format: 'png' | 'svg' | 'pdf' | 'jpeg' | null; timestamp: number } | null; // Updated type
  onContentReadyForExport: (content: SVGSVGElement | null) => void; // New callback
  isFullScreen: boolean;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 70;
const HORIZONTAL_SPACING = 200;
const VERTICAL_STACK_SPACING = 30;
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

  const flattenTree = useCallback((tree: EtymologyTree | null, parentId: string | null = null, level: number = 0, index: number = 0): MindmapNode[] => {
    if (!tree) return [];

    if (typeof tree.word !== 'string' || typeof tree.language !== 'string') {
      console.warn('Skipping malformed etymology node (missing word or language):', tree);
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
      } else {
        console.warn('Skipping malformed child node (missing word or language):', child);
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

    const minX = Math.min(...Array.from(laidOutNodes.values()).map(n => n.x - NODE_WIDTH/2));
    const maxX = Math.max(...Array.from(laidOutNodes.values()).map(n => n.x + NODE_WIDTH/2));

    const totalContentWidth = Math.max(containerWidth, maxX - minX + HORIZONTAL_SPACING);
    const totalContentHeight = Math.max(containerHeight, maxLevelY - minLevelY + NODE_HEIGHT + VERTICAL_STACK_SPACING * 2);

    const offsetX = Math.max(0, (containerWidth - (maxX - minX)) / 2 - minX);
    
    Array.from(laidOutNodes.values()).forEach(node => {
        node.x += offsetX;
    });

    setSvgDimensions({
        width: totalContentWidth + NODE_WIDTH + HORIZONTAL_SPACING,
        height: Math.max(containerHeight, totalContentHeight + NODE_HEIGHT)
    });

    return Array.from(laidOutNodes.values());
  }, [svgDimensions.width, svgDimensions.height]);

  useEffect(() => {
    if (data) {
      const initialFlatNodes = flattenTree(data);
      setNodes(initialFlatNodes);
    } else {
      setNodes([]);
    }
  }, [data, flattenTree]);

  useEffect(() => {
    if (containerRef.current && nodes.length > 0) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const actualHeight = isFullScreen ? window.innerHeight : height;

      if (svgDimensions.width !== width || svgDimensions.height !== actualHeight || nodes.length !== nodes.length) {
          const newLayout = calculateLayout(nodes, width, actualHeight);
          setNodes(newLayout);
      }
    }
  }, [nodes.length, svgDimensions.width, svgDimensions.height, calculateLayout, isFullScreen]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const actualHeight = isFullScreen ? window.innerHeight : height;
        setSvgDimensions({ width, height: actualHeight });
        setNodes(prevNodes => calculateLayout(prevNodes, width, actualHeight));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateLayout, isFullScreen]);

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

    if (endX < startX + HORIZONTAL_SPACING / 2) {
      return `M${startX} ${startY} L ${endX} ${endY}`;
    } else {
      const controlX1 = startX + (endX - startX) / 2;
      const controlY1 = startY;
      const controlX2 = endX - (endX - startX) / 4;
      const controlY2 = endY;
      return `M${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
    }
  };

  if (!data) {
    return (
      <div className="flex justify-center items-center h-full text-text-light text-lg">
        Enter a word to see its etymological chronological line!
      </div>
    );
  }

  const maxLevel = nodes.reduce((max, node) => Math.max(max, node.level), 0);
  const timelineStartX = nodes.length > 0 ? nodes[0].x - NODE_WIDTH/2 - HORIZONTAL_SPACING/2 : 0;
  const timelineEndX = (maxLevel * HORIZONTAL_SPACING) + NODE_WIDTH + HORIZONTAL_SPACING;
  const timelineY = svgDimensions.height / 2 + TIMELINE_CENTER_Y_OFFSET;


  return (
    <div ref={containerRef} className={`relative w-full overflow-auto rounded-xl bg-card-glass shadow-deep p-4
                                       ${isFullScreen ? 'h-full' : 'min-h-[600px] h-[calc(100vh-250px)]'}`}>
      <svg
        ref={svgRef}
        width={svgDimensions.width}
        height={svgDimensions.height}
      >
        <line
          x1={timelineStartX}
          y1={timelineY}
          x2={timelineEndX}
          y2={timelineY}
          stroke="#ccc"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {nodes.map(node => {
            const parentNode = nodes.find(n => n.id === node.parentId);
            if (!parentNode) return null;
            return (
                <path
                    key={`${parentNode.id}-${node.id}`}
                    d={getPath(parentNode, node)}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="1.5"
                    markerEnd="url(#arrowhead-chrono)"
                />
            );
        })}

        <defs>
          <marker id="arrowhead-chrono" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={LANGUAGE_FAMILY_COLORS['Other']} />
          </marker>
        </defs>

        {nodes.map(node => (
          <foreignObject
            key={node.id}
            x={node.x - NODE_WIDTH / 2}
            y={node.y - NODE_HEIGHT / 2}
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
          >
            <div
              className="flex flex-col items-center justify-center p-1 rounded-lg border-2 bg-white shadow-sm text-center h-full transition-all duration-200 ease-in-out hover:shadow-md"
              style={{ borderColor: node.color }}
            >
              <div className="font-sans text-xs uppercase text-text-light leading-none">{node.language}</div>
              <div className="font-serif text-base font-semibold text-text-ink leading-tight">
                {node.word}
              </div>
              {node.meaning && <div className="text-xs text-text-light italic max-w-[90%] truncate">{node.meaning}</div>}
            </div>
          </foreignObject>
        ))}
      </svg>
    </div>
  );
};

export default ChronologicalLine;