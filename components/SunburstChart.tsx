import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { EtymologyTree } from '../types';

interface SunburstChartProps {
  data: EtymologyTree | null;
  exportTrigger: any;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
  onNodeHover: (tooltip: any) => void;
  onNodeLeave: () => void;
}

const SunburstChart: React.FC<SunburstChartProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen, onNodeHover, onNodeLeave }) => {
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

    const radius = Math.min(dimensions.width, dimensions.height) / 2 - 20;
    const g = svg.append('g').attr('transform', `translate(${dimensions.width / 2},${dimensions.height / 2})`);

    const root = d3.hierarchy(data)
      .sum(d => 1) // Uniform size for each word
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const partition = d3.partition<EtymologyTree>().size([2 * Math.PI, radius]);
    partition(root);

    const arc = d3.arc<d3.HierarchyRectangularNode<EtymologyTree>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1 - 1);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    g.selectAll('path')
      .data(root.descendants().filter(d => d.depth))
      .join('path')
      .attr('fill', d => color(d.data.language))
      .attr('d', arc)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .on('mouseenter', (event, d) => {
        onNodeHover({
          x: event.clientX,
          y: event.clientY,
          content: { word: d.data.word, language: d.data.language, meaning: d.data.meaning }
        });
      })
      .on('mouseleave', onNodeLeave);

    g.selectAll('text')
      .data(root.descendants().filter(d => d.depth && (d.x1 - d.x0) > 0.05))
      .join('text')
      .attr('transform', function(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr('dy', '0.35em')
      .attr('dx', d => ( (d.x0 + d.x1) / 2 < Math.PI ? '0.5em' : '-0.5em' ))
      .attr('text-anchor', d => ( (d.x0 + d.x1) / 2 < Math.PI ? 'start' : 'end' ))
      .attr('font-size', '10px')
      .attr('pointer-events', 'none')
      .attr('fill', '#2A2622')
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

export default SunburstChart;