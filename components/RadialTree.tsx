import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { EtymologyTree } from '../types';

interface RadialTreeProps {
  data: EtymologyTree | null;
  exportTrigger: any;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
  isDarkMode?: boolean;
  onNodeHover: (tooltip: any) => void;
  onNodeLeave: () => void;
}

const RadialTree: React.FC<RadialTreeProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen, isDarkMode, onNodeHover, onNodeLeave }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height: isFullScreen ? window.innerHeight : height });
    }
  }, [isFullScreen]);

  useEffect(() => {
    if (!data || !svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const radius = Math.min(dimensions.width, dimensions.height) / 2 - 100;
    const g = svg.append('g')
      .attr('transform', `translate(${dimensions.width / 2},${dimensions.height / 2})`);

    const tree = d3.tree<EtymologyTree>()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    const root = d3.hierarchy(data);
    tree(root);

    const link = d3.linkRadial<any, any>()
      .angle(d => d.x)
      .radius(d => d.y);

    const links = g.append('g')
      .attr('fill', 'none')
      .attr('stroke', isDarkMode ? '#F9F8F422' : '#A68A7866')
      .attr('stroke-width', 1.5)
      .selectAll('path')
      .data(root.links())
      .join('path')
      .attr('d', link)
      .attr('opacity', 0);

    links.transition()
      .duration(800)
      .delay((_, i) => i * 10)
      .attr('opacity', 1);

    const node = g.append('g')
      .selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
      .attr('opacity', 0);

    node.transition()
      .duration(500)
      .delay((d) => d.depth * 100)
      .attr('opacity', 1);

    node.append('circle')
      .attr('fill', d => d.children ? (isDarkMode ? '#C27B66' : '#4A5D45') : (isDarkMode ? '#F9F8F4' : '#C27B66'))
      .attr('r', 6)
      .attr('class', 'cursor-pointer transition-transform duration-300 hover:scale-150')
      .on('mouseenter', (event, d) => {
        onNodeHover({
          x: event.clientX,
          y: event.clientY,
          content: { word: d.data.word, language: d.data.language, meaning: d.data.meaning }
        });
      })
      .on('mouseleave', onNodeLeave);

    node.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.x < Math.PI === !d.children ? 10 : -10)
      .attr('text-anchor', d => d.x < Math.PI === !d.children ? 'start' : 'end')
      .attr('transform', d => d.x >= Math.PI ? 'rotate(180)' : null)
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', isDarkMode ? '#F9F8F4' : '#2A2622')
      .attr('class', 'font-serif pointer-events-none')
      .text(d => d.data.word);

  }, [data, dimensions, onNodeHover, onNodeLeave, isDarkMode]);

  useEffect(() => {
    if (exportTrigger && svgRef.current) {
      onContentReadyForExport(svgRef.current);
    }
  }, [exportTrigger, onContentReadyForExport]);

  return (
    <div ref={containerRef} className={`w-full h-full relative rounded-xl overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-dark-bg/60' : 'bg-card-glass'}`}>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  );
};

export default RadialTree;