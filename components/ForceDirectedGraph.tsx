
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { EtymologyTree, MindmapNode } from '../types';
import * as d3 from 'd3';

interface ForceDirectedGraphProps {
  data: EtymologyTree | null;
  exportTrigger: { format: 'png' | 'svg' | 'pdf' | 'jpeg' | null; timestamp: number } | null;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
}

const NODE_RADIUS_BASE = 15;
const LINK_DISTANCE = 80;
const CHARGE_STRENGTH = -300;

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

const ForceDirectedGraph: React.FC<ForceDirectedGraphProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen }) => {
  const [nodes, setNodes] = useState<MindmapNode[]>([]);
  const [links, setLinks] = useState<{ source: string; target: string }[]>([]);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);

  const flattenTree = useCallback((tree: EtymologyTree | null, parentId: string | null = null, level: number = 0, index: number = 0): MindmapNode[] => {
    if (!tree) return [];
    if (typeof tree.word !== 'string' || typeof tree.language !== 'string') return [];

    const id = `${tree.word}-${tree.language}-${level}-${index}`;
    const languageFamily = getLanguageFamily(tree.language);
    const color = LANGUAGE_FAMILY_COLORS[languageFamily] || LANGUAGE_FAMILY_COLORS['Other'];

    const currentNode: MindmapNode = {
      id,
      text: tree.word,
      word: tree.word,
      language: tree.language,
      languageFamily,
      meaning: tree.meaning,
      parentId,
      childrenIds: [],
      level,
      isExpanded: true,
      x: 0, y: 0,
      width: NODE_RADIUS_BASE, height: NODE_RADIUS_BASE,
      color,
      highlighted: false,
      subtreeHeight: 0, subtreeWidth: 0, childrenYStart: 0,
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

  useEffect(() => {
    if (data) {
      const flatNodes = flattenTree(data);
      const allNodesMap = new Map<string, MindmapNode>(flatNodes.map(node => [node.id, node]));
      const graphLinks: { source: string; target: string }[] = [];
      flatNodes.forEach(node => {
        if (node.parentId && allNodesMap.has(node.parentId)) {
          graphLinks.push({ source: node.parentId, target: node.id });
        }
      });
      setNodes(flatNodes);
      setLinks(graphLinks);
    } else {
      setNodes([]);
      setLinks([]);
    }
  }, [data, flattenTree]);

  useLayoutEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const { width, height } = containerRef.current.getBoundingClientRect();
    const actualHeight = isFullScreen ? window.innerHeight : height;
    setSvgDimensions({ width, height: actualHeight });

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d?.id || '').distance(LINK_DISTANCE))
      .force('charge', d3.forceManyBody().strength(CHARGE_STRENGTH))
      .force('center', d3.forceCenter(width / 2, actualHeight / 2))
      .force('collide', d3.forceCollide().radius((d: any) => (d.width || NODE_RADIUS_BASE) / 2 + 5));

    simulationRef.current = simulation;

    const tick = () => {
      setNodes([...simulation.nodes()]);
    };

    simulation.on('tick', tick);

    return () => {
      simulation.stop();
    };
  }, [nodes.length, links.length, isFullScreen]);

  useEffect(() => {
    if (exportTrigger && svgRef.current) {
      onContentReadyForExport(svgRef.current);
    }
  }, [exportTrigger, onContentReadyForExport]);

  if (!data) {
    return (
      <div className="flex justify-center items-center h-full text-text-light text-lg">
        Enter a word to see its etymological force-directed graph!
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full rounded-xl bg-card-glass shadow-deep p-4
                                       ${isFullScreen ? 'h-full' : 'min-h-[600px] h-[calc(100vh-250px)]'}`}>
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        width={svgDimensions.width}
        height={svgDimensions.height}
      >
        <defs>
          <marker id="arrowhead-force" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={LANGUAGE_FAMILY_COLORS['Other']} />
          </marker>
        </defs>

        {links.map((link: any, index) => {
          const sourceNode = nodes.find(n => n.id === (typeof link.source === 'string' ? link.source : link.source?.id));
          const targetNode = nodes.find(n => n.id === (typeof link.target === 'string' ? link.target : link.target?.id));
          if (!sourceNode || !targetNode) return null;
          return (
            <line
              key={index}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke={targetNode.color}
              strokeWidth="1.5"
              markerEnd="url(#arrowhead-force)"
            />
          );
        })}

        {nodes.map(node => (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            className="node-group cursor-grab active:cursor-grabbing"
          >
            <circle
              className="node-circle transition-all duration-100 ease-linear hover:scale-110 shadow-sm"
              r={(node.width || NODE_RADIUS_BASE) / 2}
              fill="white"
              stroke={node.color}
              strokeWidth="2"
            >
              <title>{node.language}: {node.word}{node.meaning ? ` ("${node.meaning}")` : ''}</title>
            </circle>
            <text
              textAnchor="middle"
              alignmentBaseline="middle"
              fill={node.color}
              className="font-sans text-[10px] sm:text-xs font-semibold pointer-events-none"
              dy="0.3em"
            >
              {node.word}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default ForceDirectedGraph;
