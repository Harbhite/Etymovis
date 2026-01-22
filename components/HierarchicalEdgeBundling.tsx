
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { EtymologyTree, MindmapNode } from '../types';
import * as d3 from 'd3';

interface HierarchicalEdgeBundlingProps {
  data: EtymologyTree | null;
  exportTrigger: { format: 'png' | 'svg' | 'pdf' | 'jpeg' | null; timestamp: number } | null;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
}

const NODE_RADIUS_BASE = 6;
const NODE_LABEL_OFFSET = 10;

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

const HierarchicalEdgeBundling: React.FC<HierarchicalEdgeBundlingProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen }) => {
  const [nodes, setNodes] = useState<d3.HierarchyPointNode<EtymologyTree>[]>([]);
  const [links, setLinks] = useState<d3.HierarchyPointLink<EtymologyTree>[]>([]);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [radialLayoutRadius, setRadialLayoutRadius] = useState(0);

  useLayoutEffect(() => {
    if (containerRef.current && data) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const actualSize = Math.max(100, Math.min(width, isFullScreen ? window.innerHeight : height));
      setSvgDimensions({ width: actualSize, height: actualSize });

      const radius = actualSize / 2 - 80;
      setRadialLayoutRadius(radius);

      const treeLayout = d3.tree<EtymologyTree>()
        .size([2 * Math.PI, Math.max(1, radius)])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

      const root = d3.hierarchy(data, d => d.children);
      treeLayout(root);

      setNodes(root.descendants());
      setLinks(root.links());
    }
  }, [data, isFullScreen]);

  useEffect(() => {
    if (exportTrigger && svgRef.current) {
      onContentReadyForExport(svgRef.current);
    }
  }, [exportTrigger, onContentReadyForExport]);

  const line = d3.lineRadial<d3.HierarchyPointNode<EtymologyTree>>()
    .curve(d3.curveBundle.beta(0.85))
    .radius(d => d.y)
    .angle(d => d.x);

  const getPathData = (link: d3.HierarchyPointLink<EtymologyTree>): string => {
    const points: d3.HierarchyPointNode<EtymologyTree>[] = [link.source, link.target];
    return line(points) || '';
  };

  if (!data || nodes.length === 0 || svgDimensions.width === 0) {
    return null;
  }

  const centerX = svgDimensions.width / 2;
  const centerY = svgDimensions.height / 2;

  return (
    <div ref={containerRef} className={`relative w-full flex items-center justify-center rounded-xl bg-card-glass shadow-deep p-4
                                       ${isFullScreen ? 'h-full' : 'min-h-[600px] h-[calc(100vh-250px)]'}`}>
      <svg
        ref={svgRef}
        className="block"
        width={svgDimensions.width}
        height={svgDimensions.height}
        viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
      >
        <g transform={`translate(${centerX}, ${centerY})`}>
          {links.map((link, i) => {
            const family = getLanguageFamily(link.target.data.language);
            const color = LANGUAGE_FAMILY_COLORS[family] || LANGUAGE_FAMILY_COLORS['Other'];
            const isHighlighted = hoveredNodeId === link.source.data.word || hoveredNodeId === link.target.data.word;

            return (
              <path
                key={i}
                d={getPathData(link)}
                fill="none"
                stroke={isHighlighted ? color : `${color}44`}
                strokeWidth={isHighlighted ? 2.5 : 1}
                className="transition-all duration-300"
              />
            );
          })}

          {nodes.map((node) => {
            const family = getLanguageFamily(node.data.language);
            const color = LANGUAGE_FAMILY_COLORS[family] || LANGUAGE_FAMILY_COLORS['Other'];
            const isHovered = hoveredNodeId === node.data.word;
            
            return (
              <g
                key={`${node.data.word}-${node.depth}`}
                transform={`rotate(${node.x * 180 / Math.PI - 90}) translate(${node.y}, 0)`}
                onMouseEnter={() => setHoveredNodeId(node.data.word)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer"
              >
                <circle
                  r={isHovered ? NODE_RADIUS_BASE * 1.5 : NODE_RADIUS_BASE}
                  fill={isHovered ? 'white' : color}
                  stroke={color}
                  strokeWidth="1.5"
                />
                {(isHovered || node.depth === 0) && (
                  <text
                    dy="0.31em"
                    x={node.y < radialLayoutRadius / 2 ? NODE_LABEL_OFFSET : -NODE_LABEL_OFFSET}
                    textAnchor={node.y < radialLayoutRadius / 2 ? 'start' : 'end'}
                    transform={node.y < radialLayoutRadius / 2 ? undefined : 'rotate(180)'}
                    fill={color}
                    className={`font-sans font-bold pointer-events-none ${node.depth === 0 ? 'text-sm' : 'text-[10px]'}`}
                  >
                    {node.data.word}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default HierarchicalEdgeBundling;
