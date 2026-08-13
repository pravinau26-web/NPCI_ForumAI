const fs = require('fs');
let code = fs.readFileSync('src/components/ThreadView.tsx', 'utf8');

const regex = /await onAddThread\(title, quickTopicInput, \[\], \[\]\);[\s\S]*?\n    \}\);/m;
code = code.replace(regex, 'await onAddThread(title, quickTopicInput, [], []);');

fs.writeFileSync('src/components/ThreadView.tsx', code);
console.log('Regex fixed');
