import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { EtymologyTree } from '../types';

interface DendrogramProps {
  data: EtymologyTree | null;
  exportTrigger: any;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
}

const Dendrogram: React.FC<DendrogramProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen }) => {
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

    const width = dimensions.width - 100;
    const height = dimensions.height - 50;

    const cluster = d3.cluster<EtymologyTree>().size([height, width - 100]);
    const root = d3.hierarchy(data, d => d.children);
    cluster(root);

    const g = svg.append('g').attr('transform', `translate(60, 0)`); // Shift right

    // Links (Step-before curve)
    const links = g.selectAll('path')
      .data(root.links())
      .join('path')
      .attr('d', d => `M${d.source.y},${d.source.x}V${d.target.x}H${d.target.y}`)
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', function() { return this.getTotalLength(); })
      .attr('stroke-dashoffset', function() { return this.getTotalLength(); });

    links.transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    const nodes = g.selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', d => `translate(${d.y},${d.x})`);

    nodes.append('circle')
      .attr('r', 0)
      .attr('fill', d => d.children ? '#555' : '#999')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .transition()
      .duration(500)
      .delay((d) => d.depth * 200)
      .attr('r', 4.5);

    nodes.append('text')
      .attr('dy', 3)
      .attr('x', d => d.children ? -8 : 8)
      .style('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.word)
      .attr('font-size', '10px')
      .attr('font-family', 'sans-serif')
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d) => d.depth * 200 + 200)
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

export default Dendrogram;
