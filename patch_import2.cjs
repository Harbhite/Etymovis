const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const importsToRemove = [
  "import SankeyDiagram from './components/SankeyDiagram';",
  "import SpiralTimeline from './components/SpiralTimeline';",
  "import GanttChart from './components/GanttChart';",
  "import HorizontalTimeline from './components/HorizontalTimeline';",
  "import Heatmap from './components/Heatmap';",
  "import Dendrogram from './components/Dendrogram';",
  "import StepwiseProcess from './components/StepwiseProcess';"
];

for (const imp of importsToRemove) {
  code = code.replace(imp + '\n', '');
}

code = code.replace(
  "import FishboneDiagram from './components/FishboneDiagram';",
  "import FishboneDiagram from './components/FishboneDiagram';\nimport MermaidDiagram from './components/MermaidDiagram';"
);

fs.writeFileSync('App.tsx', code);
