import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { EtymologyTree } from '../types';

interface HeatmapProps {
  data: EtymologyTree | null;
  exportTrigger: any;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
}

const Heatmap: React.FC<HeatmapProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen }) => {
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

    // X axis: Depth (Time), Y axis: Language
    const depths = Array.from(new Set(nodes.map(d => d.depth))).sort((a, b) => a - b);
    const languages = Array.from(new Set(nodes.map(d => d.language))).sort();

    const margin = { top: 30, right: 30, bottom: 30, left: 100 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .domain(depths.map(String))
      .padding(0.05);

    const y = d3.scaleBand()
      .range([height, 0])
      .domain(languages)
      .padding(0.05);

    const color = d3.scaleSequential()
      .interpolator(d3.interpolateInferno)
      .domain([0, depths.length]); // Color by depth intensity? Or just generic. Let's use language specific.
    // Actually standard heatmap uses value. We don't have value.
    // Let's color by index of language to distinguish.

    const colorOrdinal = d3.scaleOrdinal(d3.schemeTableau10);

    g.append('g')
      .style('font-size', 12)
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .select('.domain').remove();

    g.append('g')
      .style('font-size', 12)
      .call(d3.axisLeft(y).tickSize(0))
      .select('.domain').remove();

    const cells = g.selectAll('rect')
      .data(nodes, (d: any) => d.word)
      .join('rect')
      .attr('x', (d: any) => x(String(d.depth))!)
      .attr('y', (d: any) => y(d.language)!)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .style('fill', (d: any) => colorOrdinal(d.language))
      .style('stroke-width', 4)
      .style('stroke', 'none')
      .style('opacity', 0);

    cells.transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .style('opacity', 0.8);

    cells.on('mouseover', function(event, d) {
      d3.select(this).style('stroke', 'black').style('opacity', 1);
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).style('stroke', 'none').style('opacity', 0.8);
    });

    // Add word labels inside
    g.selectAll('text.cell-label')
        .data(nodes)
        .join('text')
        .attr('class', 'cell-label')
        .attr('x', (d: any) => x(String(d.depth))! + x.bandwidth()/2)
        .attr('y', (d: any) => y(d.language)! + y.bandwidth()/2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'white')
        .text((d: any) => d.word.substring(0, 10))
        .attr('opacity', 0)
        .transition()
        .delay((d, i) => i * 50 + 400)
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

export default Heatmap;
