const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /chunks\.forEach\(\(chunk: any, index: number\) => \{[\s\S]*?\}\);/m;

const newSeed = `
  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    const recordId = \`\${docIdForDb}-chunk-\${index}-\${Date.now()}\`;
    const embedding = await vectorDb.generateEmbedding(chunk.text);
    vectorDb.insert(recordId, embedding, {
      docId: docIdForDb,
      docTitle: title,
      section: chunk.section,
      text: chunk.text,
      version
    });
  }
`;

code = code.replace(regex, newSeed.trim());
fs.writeFileSync('server.ts', code);
console.log('Seed 2 fixed again');
