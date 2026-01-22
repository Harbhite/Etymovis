import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { EtymologyTree } from '../types';

interface CirclePackingProps {
  data: EtymologyTree | null;
  exportTrigger: any;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
  onNodeHover: (tooltip: any) => void;
  onNodeLeave: () => void;
}

const CirclePacking: React.FC<CirclePackingProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen, onNodeHover, onNodeLeave }) => {
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

    const root = d3.hierarchy(data)
      .sum(d => (d.children ? d.children.length + 1 : 1))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const pack = d3.pack<EtymologyTree>()
      .size([dimensions.width, dimensions.height])
      .padding(10);

    pack(root);

    const color = d3.scaleLinear<string>()
      .domain([0, 5])
      .range(['#F9F8F4', '#4A5D45']);

    const nodes = svg.selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    nodes.append('circle')
      .attr('r', d => d.r)
      .attr('fill', d => d.children ? '#A68A7833' : '#C27B66')
      .attr('stroke', '#2A262244')
      .attr('stroke-width', 1)
      .on('mouseenter', (event, d) => {
        onNodeHover({
          x: event.clientX,
          y: event.clientY,
          content: { word: d.data.word, language: d.data.language, meaning: d.data.meaning }
        });
      })
      .on('mouseleave', onNodeLeave);

    nodes.filter(d => d.r > 15)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('font-size', d => Math.min(d.r / 3, 14) + 'px')
      .attr('fill', d => d.children ? '#2A2622' : '#fff')
      .attr('pointer-events', 'none')
      .text(d => d.data.word);

  }, [data, dimensions, onNodeHover, onNodeLeave]);

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

export default CirclePacking;