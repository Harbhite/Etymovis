const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');
code = code.replace(
  "import FishboneDiagram from './components/FishboneDiagram';\nimport SankeyDiagram from './components/SankeyDiagram';\nimport ChronologicalLine from './components/ChronologicalLine';\nimport SpiralTimeline from './components/SpiralTimeline';\nimport GanttChart from './components/GanttChart';\nimport HorizontalTimeline from './components/HorizontalTimeline';\nimport Heatmap from './components/Heatmap';\nimport Dendrogram from './components/Dendrogram';\nimport StepwiseProcess from './components/StepwiseProcess';",
  "import FishboneDiagram from './components/FishboneDiagram';\nimport ChronologicalLine from './components/ChronologicalLine';\nimport MermaidDiagram from './components/MermaidDiagram';"
);
fs.writeFileSync('App.tsx', code);
