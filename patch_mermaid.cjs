const fs = require('fs');
let code = fs.readFileSync('components/MermaidDiagram.tsx', 'utf8');
code = code.replace(
  /const idMatch = nodeGroup\.id\.match\(\/\^flowchart-\(node\\d\+\)-\/\);/,
  "const idMatch = nodeGroup.id.match(/^flowchart-(node\\d+)-/);"
);
fs.writeFileSync('components/MermaidDiagram.tsx', code);
