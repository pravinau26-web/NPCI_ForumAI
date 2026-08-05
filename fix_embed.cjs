const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldEmbed = `
    if (ai) {
      try {
        const response = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: text,
        });
        if (response.embeddings && response.embeddings[0] && response.embeddings[0].values) {
           return response.embeddings[0].values;
        }
      } catch (e) {
        console.error("Embedding generation failed", e);
      }
    }
`;

code = code.replace(oldEmbed, '');
fs.writeFileSync('server.ts', code);
console.log('Embed logic removed');
