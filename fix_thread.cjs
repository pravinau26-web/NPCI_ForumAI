const fs = require('fs');
let code = fs.readFileSync('src/components/ThreadView.tsx', 'utf8');

code = code.replace(
  'await onPostThread(community.id, {',
  'await onAddThread(title, quickTopicInput, [], []);\n    // '
);

fs.writeFileSync('src/components/ThreadView.tsx', code);
console.log('ThreadView fixed');
