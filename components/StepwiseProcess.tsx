import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { EtymologyTree } from '../types';

interface StepwiseProcessProps {
  data: EtymologyTree | null;
  exportTrigger: any;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
}

const StepwiseProcess: React.FC<StepwiseProcessProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen }) => {
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
    // Sequence order (Depth desc: oldest to newest)
    nodes.sort((a, b) => b.depth - a.depth);

    const stepWidth = dimensions.width / (nodes.length + 1);
    const centerY = dimensions.height / 2;

    // Chevron shape generator
    const chevron = (w: number, h: number) => {
        const arrowHead = w / 4;
        return `M0,0 L${w-arrowHead},0 L${w},${h/2} L${w-arrowHead},${h} L0,${h} L${arrowHead},${h/2} Z`;
    };

    const g = svg.append('g')
        .attr('transform', `translate(${stepWidth/2}, ${centerY - 25})`);

    const steps = g.selectAll('g')
        .data(nodes)
        .join('g')
        .attr('transform', (d, i) => `translate(${i * stepWidth}, 0)`);

    const color = d3.scaleOrdinal(d3.schemePaired);

    steps.append('path')
        .attr('d', chevron(stepWidth - 5, 50))
        .attr('fill', (d: any) => color(d.language))
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('filter', 'drop-shadow(2px 2px 2px rgba(0,0,0,0.2))')
        .attr('opacity', 0)
        .attr('transform', 'scale(0.8)')
        .transition()
        .duration(600)
        .delay((_, i) => i * 150)
        .attr('opacity', 1)
        .attr('transform', 'scale(1)');

    steps.append('text')
        .text((d: any) => d.word)
        .attr('x', (stepWidth - 5) / 2)
        .attr('y', 28)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('fill', 'white')
        .attr('opacity', 0)
        .transition()
        .delay((_, i) => i * 150 + 200)
        .attr('opacity', 1);

    steps.append('text')
        .text((d: any) => d.language)
        .attr('x', (stepWidth - 5) / 2)
        .attr('y', -8)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('fill', '#666')
        .attr('opacity', 0)
        .transition()
        .delay((_, i) => i * 150 + 200)
        .attr('opacity', 1);

  }, [data, dimensions]);

  useEffect(() => {
    if (exportTrigger && svgRef.current) {
      onContentReadyForExport(svgRef.current);
    }
  }, [exportTrigger, onContentReadyForExport]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-card-glass rounded-xl overflow-hidden">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  );
};

export default StepwiseProcess;
