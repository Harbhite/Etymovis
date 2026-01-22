import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { EtymologyTree } from '../types';

interface FishboneDiagramProps {
  data: EtymologyTree | null;
  exportTrigger: any;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
  isDarkMode?: boolean;
  onNodeHover: (tooltip: any) => void;
  onNodeLeave: () => void;
}

const FAMILY_COLORS: Record<string, string> = {
  'PIE': '#4A5D45',
  'Proto-Indo-European': '#4A5D45',
  'Proto-Germanic': '#964B3B',
  'Latin': '#C27B66',
  'Greek': '#3B5B66',
  'Old English': '#5E7153',
  'English': '#D4A373',
  'Other': '#A68A78',
};

const getFamily = (lang: string = ''): string => {
  const l = lang.toLowerCase();
  if (l.includes('pie') || l.includes('proto-indo')) return 'PIE';
  if (l.includes('proto-germanic')) return 'Proto-Germanic';
  if (l.includes('latin') || l.includes('french')) return 'Latin';
  if (l.includes('greek')) return 'Greek';
  if (l.includes('old english')) return 'Old English';
  if (l.includes('english')) return 'English';
  return 'Other';
};

const FishboneDiagram: React.FC<FishboneDiagramProps> = ({ 
  data, 
  exportTrigger, 
  onContentReadyForExport, 
  isFullScreen, 
  isDarkMode, 
  onNodeHover, 
  onNodeLeave 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDim({ w: width, h: isFullScreen ? window.innerHeight : height });
    }
  }, [isFullScreen]);

  useEffect(() => {
    if (!data || !svgRef.current || dim.w === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const pad = 100;
    const midY = dim.h / 2;
    const headX = dim.w - pad;
    const tailX = pad;

    const g = svg.append('g');

    // Flatten to a linear sequence for the backbone
    const flatten = (node: EtymologyTree): any[] => {
      let arr: any[] = [{ ...node }];
      if (node.children && node.children.length > 0) {
        arr = arr.concat(flatten(node.children[0]));
      }
      return arr;
    };

    const lineage = flatten(data).reverse();
    const count = lineage.length;
    const step = (headX - tailX) / (count > 1 ? count - 1 : 1);

    // Spine
    g.append('line')
      .attr('x1', tailX)
      .attr('y1', midY)
      .attr('x2', headX)
      .attr('y2', midY)
      .attr('stroke', isDarkMode ? '#ffffff33' : '#2a262233')
      .attr('stroke-width', 4)
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', '2000')
      .attr('stroke-dashoffset', '2000')
      .transition().duration(1200).attr('stroke-dashoffset', 0);

    // Head
    const head = g.append('g').attr('transform', `translate(${headX}, ${midY})`);
    head.append('path')
      .attr('d', "M0,0 L-30,-25 L-15,0 L-30,25 Z")
      .attr('fill', isDarkMode ? '#333' : '#eee')
      .attr('stroke', isDarkMode ? '#fff' : '#000')
      .attr('stroke-width', 2);
    
    head.append('text')
      .attr('x', 15)
      .attr('y', 8)
      .attr('class', 'font-serif font-bold text-2xl fill-current')
      .text(data.word);

    // Ribs
    lineage.forEach((node, i) => {
      if (i === count - 1) return; // Head is already rendered

      const x = tailX + i * step;
      const up = i % 2 === 0;
      const len = 140 + (i % 3) * 20;
      const yEnd = up ? midY - len : midY + len;
      const color = FAMILY_COLORS[getFamily(node.language)] || FAMILY_COLORS['Other'];

      g.append('line')
        .attr('x1', x)
        .attr('y1', midY)
        .attr('x2', x + 30)
        .attr('y2', yEnd)
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '400')
        .attr('stroke-dashoffset', '400')
        .attr('opacity', 0.6)
        .transition().delay(300 + i * 100).duration(600).attr('stroke-dashoffset', 0);

      const nodeG = g.append('g')
        .attr('transform', `translate(${x + 30}, ${yEnd})`)
        .attr('class', 'cursor-pointer group')
        .attr('opacity', 0)
        .on('mouseenter', (e) => onNodeHover({ x: e.clientX, y: e.clientY, content: node }))
        .on('mouseleave', onNodeLeave);

      nodeG.transition().delay(800 + i * 100).duration(400).attr('opacity', 1);

      nodeG.append('circle')
        .attr('r', 7)
        .attr('fill', color)
        .attr('stroke', isDarkMode ? '#fff' : '#000')
        .attr('stroke-width', 1);

      nodeG.append('text')
        .attr('y', up ? -18 : 28)
        .attr('text-anchor', 'middle')
        .attr('class', 'font-serif font-bold text-sm fill-current')
        .text(node.word);

      nodeG.append('text')
        .attr('y', up ? -32 : 42)
        .attr('text-anchor', 'middle')
        .attr('class', 'font-sans italic text-[9px] opacity-60 fill-current')
        .text(node.language);
    });

  }, [data, dim, isDarkMode]);

  useEffect(() => {
    if (exportTrigger && svgRef.current) {
      onContentReadyForExport(svgRef.current);
    }
  }, [exportTrigger, onContentReadyForExport]);

  return (
    <div ref={containerRef} className={`w-full h-full relative rounded-xl overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-dark-bg/20' : 'bg-white/20'}`}>
      <svg ref={svgRef} width={dim.w} height={dim.h} />
    </div>
  );
};

export default FishboneDiagram;
