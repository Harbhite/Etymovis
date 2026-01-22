import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { EtymologyTree } from '../types';

interface SankeyDiagramProps {
  data: EtymologyTree | null;
  exportTrigger: any;
  onContentReadyForExport: (content: SVGSVGElement | null) => void;
  isFullScreen: boolean;
  onNodeHover: (tooltip: any) => void;
  onNodeLeave: () => void;
}

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({ data, exportTrigger, onContentReadyForExport, isFullScreen, onNodeHover, onNodeLeave }) => {
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

    // Prepare graph data for Sankey
    const nodes_list: any[] = [];
    const links_list: any[] = [];
    
    const traverse = (node: EtymologyTree, parentIndex?: number) => {
      const currentIndex = nodes_list.length;
      nodes_list.push({ name: node.word, language: node.language, meaning: node.meaning });
      
      if (parentIndex !== undefined) {
        links_list.push({ source: parentIndex, target: currentIndex, value: 1 });
      }
      
      node.children?.forEach(child => traverse(child, currentIndex));
    };

    traverse(data);

    const generator = sankey()
      .nodeWidth(20)
      .nodePadding(20)
      .extent([[1, 1], [dimensions.width - 1, dimensions.height - 20]]);

    const { nodes, links } = generator({
      nodes: nodes_list.map(d => Object.assign({}, d)),
      links: links_list.map(d => Object.assign({}, d))
    });

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const rects = svg.append('g')
      .selectAll('rect')
      .data(nodes)
      .join('rect')
      .attr('x', d => d.x0!)
      .attr('y', d => d.y0!)
      .attr('height', d => Math.max(d.y1! - d.y0!, 5))
      .attr('width', d => d.x1! - d.x0!)
      .attr('fill', d => color((d as any).language))
      .attr('rx', 4)
      .attr('opacity', 0)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget)
          .transition().duration(200)
          .attr('transform', `scale(1.1)`)
          .attr('opacity', 0.9);
        onNodeHover({
          x: event.clientX,
          y: event.clientY,
          content: { word: (d as any).name, language: (d as any).language, meaning: (d as any).meaning }
        });
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget)
          .transition().duration(200)
          .attr('transform', `scale(1)`)
          .attr('opacity', 1);
        onNodeLeave();
      });

    rects.transition()
      .duration(800)
      .ease(d3.easeElasticOut)
      .delay((_, i) => i * 100)
      .attr('opacity', 1);

    const paths = svg.append('g')
      .attr('fill', 'none')
      .attr('stroke-opacity', 0.3)
      .selectAll('g')
      .data(links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', d => color(((d.source as any).language)))
      .attr('stroke-width', d => Math.max(1, d.width!))
      .attr('stroke-dasharray', function(this: SVGPathElement) { return this.getTotalLength(); })
      .attr('stroke-dashoffset', function(this: SVGPathElement) { return this.getTotalLength(); })
      .style('mix-blend-mode', 'multiply');

    paths.transition()
      .duration(1500)
      .ease(d3.easeCubicInOut)
      .delay(600)
      .attr('stroke-dashoffset', 0);

    svg.append('g')
      .style('font', '12px sans-serif')
      .style('font-weight', 'bold')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('opacity', 0)
      .attr('x', d => d.x0! < dimensions.width / 2 ? d.x1! + 10 : d.x0! - 10)
      .attr('y', d => (d.y1! + d.y0!) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0! < dimensions.width / 2 ? 'start' : 'end')
      .text(d => (d as any).name)
      .transition()
      .duration(800)
      .delay(1000)
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

export default SankeyDiagram;