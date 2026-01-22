import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { EtymologyTree } from '../types';

interface SpiralTimelineProps {
  data: EtymologyTree | null;
  exportTrigger: any;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
}

const SpiralTimeline: React.FC<SpiralTimelineProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen }) => {
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

    // Flatten data for linear timeline
    const nodes: any[] = [];
    const traverse = (node: EtymologyTree, depth: number) => {
      nodes.push({ ...node, depth });
      if (node.children) node.children.forEach(c => traverse(c, depth + 1));
    };
    traverse(data, 0);
    // Reverse to have oldest in center or vice-versa. Let's put oldest in center (spiral out).
    // Or modern at center? Usually timeline spirals go from center (big bang) out.
    // Let's assume root is modern (input word) -> ancestors.
    // So we want ancestors in center? Or outside?
    // Let's put oldest (max depth) in center.
    nodes.sort((a, b) => b.depth - a.depth);

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const startRadius = 20;
    const maxRadius = Math.min(dimensions.width, dimensions.height) / 2 - 50;
    const totalPoints = nodes.length;
    const coils = 3;
    const chord = (maxRadius - startRadius) / totalPoints;
    // Archimedean spiral: r = a + b * angle
    // Let's just distribute points along a spiral path

    // We want equal arc length distance ideally, or just simple angle steps
    const angleStep = (2 * Math.PI * coils) / totalPoints;

    const spiralData = nodes.map((d, i) => {
        const angle = i * 0.5; // simple spiral
        // Better: Archimedean
        // r = start + grow * angle
        const angleNorm = (i / (totalPoints || 1)) * (coils * 2 * Math.PI);
        const radius = startRadius + (i / (totalPoints || 1)) * (maxRadius - startRadius);
        const x = centerX + radius * Math.cos(angleNorm);
        const y = centerY + radius * Math.sin(angleNorm);
        return { ...d, x, y, angle: angleNorm, r: radius };
    });

    // Draw spiral line
    const lineGenerator = d3.line<any>()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveCatmullRom);

    const path = svg.append('path')
        .datum(spiralData)
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', '#A68A78')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', function() { return this.getTotalLength(); })
        .attr('stroke-dashoffset', function() { return this.getTotalLength(); });

    path.transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const dots = svg.selectAll('g')
        .data(spiralData)
        .join('g')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    dots.append('circle')
        .attr('r', 0)
        .attr('fill', d => color(d.language))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .transition()
        .duration(500)
        .delay((_, i) => i * 150)
        .attr('r', 8);

    dots.append('text')
        .text(d => d.word)
        .attr('dx', 12)
        .attr('dy', 4)
        .attr('font-size', '10px')
        .attr('font-family', 'serif')
        .attr('fill', '#2A2622')
        .attr('opacity', 0)
        .transition()
        .duration(500)
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

export default SpiralTimeline;
