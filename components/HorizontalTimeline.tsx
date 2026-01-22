import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { EtymologyTree } from '../types';

interface HorizontalTimelineProps {
  data: EtymologyTree | null;
  exportTrigger: any;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
}

const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
    if (!data || !svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const nodes: any[] = [];
    const traverse = (node: EtymologyTree, depth: number) => {
      nodes.push({ ...node, depth });
      if (node.children) node.children.forEach(c => traverse(c, depth + 1));
    };
    traverse(data, 0);
    // Sort reverse depth (Oldest first)
    nodes.sort((a, b) => b.depth - a.depth);

    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const centerY = dimensions.height / 2;

    const xScale = d3.scalePoint()
      .domain(nodes.map((d, i) => i.toString())) // Just sequence
      .range([0, width])
      .padding(0.5);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${centerY})`);

    // Draw main line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#ccc')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '1000')
      .attr('stroke-dashoffset', '1000')
      .transition()
      .duration(2000)
      .attr('stroke-dashoffset', '0');

    const color = d3.scaleOrdinal(d3.schemeSet3);

    const groups = g.selectAll('g')
      .data(nodes)
      .join('g')
      .attr('transform', (d, i) => `translate(${xScale(i.toString())}, 0)`);

    groups.append('circle')
      .attr('r', 0)
      .attr('fill', d => color((d as any).language))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .transition()
      .duration(500)
      .delay((_, i) => i * 150)
      .attr('r', 10);

    // Alternating labels
    groups.append('text')
      .text((d: any) => d.word)
      .attr('y', (d, i) => i % 2 === 0 ? -20 : 30)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .attr('fill', '#2A2622')
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((_, i) => i * 150 + 200)
      .attr('opacity', 1);

    groups.append('text')
      .text((d: any) => d.language)
      .attr('y', (d, i) => i % 2 === 0 ? -35 : 45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((_, i) => i * 150 + 300)
      .attr('opacity', 1);

  }, [data, dimensions]);

  useEffect(() => {
    if (exportTrigger && svgRef.current) {
      onContentReadyForExport(svgRef.current);
    }
  }, [exportTrigger, onContentReadyForExport]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-card-glass rounded-xl overflow-hidden overflow-x-auto">
      <svg ref={svgRef} width={Math.max(dimensions.width, 800)} height={dimensions.height} />
    </div>
  );
};

export default HorizontalTimeline;
