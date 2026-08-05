const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldSeed = `
// Seed the vectorDb initially
policyDocuments.forEach(doc => {
  doc.chunks.forEach((chunk, index) => {
    const recordId = \`\${doc.id}-chunk-\${index}\`;
    const embedding = await vectorDb.generateEmbedding(chunk.text);
    vectorDb.insert(recordId, embedding, {
      docId: doc.id,
      docTitle: doc.title,
      section: chunk.section,
      text: chunk.text,
      version: doc.version
    });
  });
});
`;

const newSeed = `
// Seed the vectorDb initially
(async () => {
  for (const doc of policyDocuments) {
    for (let index = 0; index < doc.chunks.length; index++) {
      const chunk = doc.chunks[index];
      const recordId = \`\${doc.id}-chunk-\${index}\`;
      const embedding = await vectorDb.generateEmbedding(chunk.text);
      vectorDb.insert(recordId, embedding, {
        docId: doc.id,
        docTitle: doc.title,
        section: chunk.section,
        text: chunk.text,
        version: doc.version
      });
    }
  }
})();
`;

code = code.replace(oldSeed.trim(), newSeed.trim());
fs.writeFileSync('server.ts', code);
console.log('Seed fixed');
