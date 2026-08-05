const fs = require('fs');
let code = fs.readFileSync('src/components/ThreadView.tsx', 'utf8');

code = code.replace(
  `await onAddThread(title, quickTopicInput, [], []);\\n    // \\n      title: title,\\n      content: quickTopicInput,\\n      tags: [],\\n      attachments: []\\n    });`,
  `await onAddThread(title, quickTopicInput, [], []);`
);

fs.writeFileSync('src/components/ThreadView.tsx', code);
console.log('ThreadView fixed properly');
