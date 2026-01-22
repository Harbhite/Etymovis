import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { EtymologyTree } from '../types';

interface TreemapDiagramProps {
  data: EtymologyTree | null;
  exportTrigger: any;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
  onNodeHover: (tooltip: any) => void;
  onNodeLeave: () => void;
}

const TreemapDiagram: React.FC<TreemapDiagramProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen, onNodeHover, onNodeLeave }) => {
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
      .sum(d => (d.children ? d.children.length + 1 : 1)) // Size based on number of descendants
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    d3.treemap<EtymologyTree>()
      .size([dimensions.width, dimensions.height])
      .paddingInner(4)
      .paddingOuter(10)
      .paddingTop(20)
      .round(true)
      (root);

    const nodes = svg.selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`)
      .attr('opacity', 0);

    nodes.transition()
      .duration(600)
      .delay((d) => d.depth * 100)
      .attr('opacity', 1);

    const color = d3.scaleOrdinal(d3.schemePastel1);

    nodes.append('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => color(d.depth.toString()))
      .attr('stroke', '#2A262222')
      .attr('rx', 4)
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget).attr('stroke', '#2A2622').attr('stroke-width', 2);
        onNodeHover({
          x: event.clientX,
          y: event.clientY,
          content: { word: d.data.word, language: d.data.language, meaning: d.data.meaning }
        });
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).attr('stroke', '#2A262222').attr('stroke-width', 1);
        onNodeLeave();
      });

    nodes.append('text')
      .attr('x', 5)
      .attr('y', 15)
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#2A2622')
      .attr('pointer-events', 'none')
      .text(d => (d.x1 - d.x0) > 40 ? d.data.word : '')
      .attr('opacity', 0)
      .transition()
      .duration(400)
      .delay((d) => d.depth * 100 + 400)
      .attr('opacity', 1);

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

export default TreemapDiagram;