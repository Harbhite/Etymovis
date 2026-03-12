const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

// Update VisualizationMode
code = code.replace(
  "type VisualizationMode = 'fishbone' | 'chronological' | 'list' | 'sankey' | 'spiral' | 'gantt' | 'horizontal' | 'heatmap' | 'dendrogram' | 'stepwise';",
  "type VisualizationMode = 'fishbone' | 'chronological' | 'list' | 'mermaid';"
);

// Update VIZ_OPTIONS
code = code.replace(
  /const VIZ_OPTIONS = \[\s*\{ id: 'chronological', label: 'Timeline' \},\s*\{ id: 'fishbone', label: 'Fishbone' \},\s*\{ id: 'sankey', label: 'Flow' \},\s*\{ id: 'spiral', label: 'Spiral' \},\s*\{ id: 'gantt', label: 'Gantt' \},\s*\{ id: 'horizontal', label: 'Horizontal' \},\s*\{ id: 'heatmap', label: 'Heatmap' \},\s*\{ id: 'dendrogram', label: 'Dendrogram' \},\s*\{ id: 'stepwise', label: 'Stepwise' \},\s*\{ id: 'list', label: 'Manuscript' \}\s*\];/,
  `const VIZ_OPTIONS = [
  { id: 'list', label: 'Manuscript' },
  { id: 'fishbone', label: 'Fishbone' },
  { id: 'chronological', label: 'Timeline' },
  { id: 'mermaid', label: 'Flow' }
];`
);

// Replace diagram imports
code = code.replace(
  "import FishboneDiagram from './components/FishboneDiagram';\nimport SankeyDiagram from './components/SankeyDiagram';\nimport ChronologicalLine from './components/ChronologicalLine';\nimport SpiralTimeline from './components/SpiralTimeline';\nimport GanttChart from './components/GanttChart';\nimport HorizontalTimeline from './components/HorizontalTimeline';\nimport Heatmap from './components/Heatmap';\nimport Dendrogram from './components/Dendrogram';\nimport StepwiseProcess from './components/StepwiseProcess';",
  "import FishboneDiagram from './components/FishboneDiagram';\nimport ChronologicalLine from './components/ChronologicalLine';\nimport MermaidDiagram from './components/MermaidDiagram';"
);

// Replace diagram rendering block
const oldRenderBlock = `{visualizationMode === 'fishbone' && <FishboneDiagram data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} isDarkMode={isDarkMode} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
              {visualizationMode === 'sankey' && <SankeyDiagram data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
              {visualizationMode === 'chronological' && <ChronologicalLine data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
              {visualizationMode === 'list' && <ListView data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, false)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
              {visualizationMode === 'spiral' && <SpiralTimeline data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
              {visualizationMode === 'gantt' && <GanttChart data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
              {visualizationMode === 'horizontal' && <HorizontalTimeline data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
              {visualizationMode === 'heatmap' && <Heatmap data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
              {visualizationMode === 'dendrogram' && <Dendrogram data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
              {visualizationMode === 'stepwise' && <StepwiseProcess data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}`;

const newRenderBlock = `{visualizationMode === 'fishbone' && <FishboneDiagram data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} isDarkMode={isDarkMode} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
              {visualizationMode === 'mermaid' && <MermaidDiagram data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
              {visualizationMode === 'chronological' && <ChronologicalLine data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
              {visualizationMode === 'list' && <ListView data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, false)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}`;

code = code.replace(oldRenderBlock, newRenderBlock);

fs.writeFileSync('App.tsx', code);
