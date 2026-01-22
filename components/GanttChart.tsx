import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { EtymologyTree } from '../types';

interface GanttChartProps {
  data: EtymologyTree | null;
  exportTrigger: any;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
}

const GanttChart: React.FC<GanttChartProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen }) => {
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
    // Sort by depth (Time approximation)
    nodes.sort((a, b) => b.depth - a.depth);

    const margin = { top: 40, right: 20, bottom: 20, left: 100 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(nodes, (d: any) => d.depth) || 1])
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(nodes.map((d: any) => d.word))
      .range([0, height])
      .padding(0.4);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Bars
    g.selectAll('rect')
      .data(nodes)
      .join('rect')
      .attr('x', (d: any) => xScale(d.depth))
      .attr('y', (d: any) => yScale(d.word) || 0)
      .attr('height', yScale.bandwidth())
      .attr('width', 0)
      .attr('fill', (d: any) => color(d.language))
      .attr('rx', 4)
      .transition()
      .duration(800)
      .delay((_, i) => i * 100)
      .attr('width', (d: any) => width - xScale(d.depth)); // Span to end? Or span a bit? Let's span a bit.
      // Actually Gantt implies duration. We don't have duration.
      // Let's just make it a timeline bar from "start" to "end" if we had dates.
      // Since we don't, let's make it a fixed width bar representing "Era" presence.
      // Improved: width fixed or proportional to something. Let's do fixed width for now.
      // Better: width = width / (maxDepth + 1)

    // Refine: Bars from Left (Ancestry) to Right (Modern)?
    // Or Bars placed at their "Time" slot.
    // Let's place them at x = depth, width = 1 unit of depth.

    const unitWidth = width / ((d3.max(nodes, (d: any) => d.depth) || 1) + 1);

    // Clear and redraw with better logic
    svg.selectAll('*').remove();
    const g2 = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Axis
    g2.append('g')
      .attr('transform', `translate(0, -10)`)
      .call(d3.axisTop(xScale).ticks(5).tickFormat((d: any) => `Stage ${d}`));

    g2.selectAll('rect')
      .data(nodes)
      .join('rect')
      .attr('x', (d: any) => xScale(d.depth)) // Actually depth 0 is modern? Usually depth 0 is root of tree.
      // If root is modern word, then depth 0 is Modern. Depth MAX is PIE.
      // Timeline usually goes Old -> New (Left -> Right).
      // So we should invert X.
      // Let's flip domain.
      .attr('y', (d: any) => yScale(d.word) || 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', (d: any) => color(d.language))
      .attr('rx', 4)
      .attr('width', 0)
      .transition()
      .duration(800)
      .delay((_, i) => i * 100)
      .attr('width', unitWidth);

    // Labels
    g2.selectAll('text.label')
      .data(nodes)
      .join('text')
      .attr('class', 'label')
      .attr('x', -10)
      .attr('y', (d: any) => (yScale(d.word) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text((d: any) => d.language + ': ' + d.word)
      .attr('opacity', 0)
      .transition()
      .duration(800)
      .delay((_, i) => i * 100)
      .attr('opacity', 1);

  }, [data, dimensions]);

  useEffect(() => {
    if (exportTrigger && svgRef.current) {
      onContentReadyForExport(svgRef.current);
    }
  }, [exportTrigger, onContentReadyForExport]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-card-glass rounded-xl overflow-hidden overflow-y-auto">
      <svg ref={svgRef} width={dimensions.width} height={Math.max(dimensions.height, 600)} />
    </div>
  );
};

export default GanttChart;
