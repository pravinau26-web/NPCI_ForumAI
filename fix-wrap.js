import fs from 'fs';
let content = fs.readFileSync('src/components/PolicyManager.tsx', 'utf-8');
content = content.replace(
  /<div className="flex items-center gap-1\.5">\s*\{doc\.type === "complaint" \?/g,
  '<div className="flex flex-wrap items-center gap-1.5">\n                          {doc.type === "complaint" ?'
);
fs.writeFileSync('src/components/PolicyManager.tsx', content);
