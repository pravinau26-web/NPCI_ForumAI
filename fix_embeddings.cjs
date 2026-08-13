const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'public generateEmbedding(text: string): number[] {',
  'public async generateEmbedding(text: string): Promise<number[]> {'
);

code = code.replace(
  'const embedding = vectorDb.generateEmbedding(chunk.text);',
  'const embedding = await vectorDb.generateEmbedding(chunk.text);'
);

code = code.replace(
  'const embedding = vectorDb.generateEmbedding(chunk.text);',
  'const embedding = await vectorDb.generateEmbedding(chunk.text);'
);

code = code.replace(
  'const queryVector = vectorDb.generateEmbedding(question);',
  'const queryVector = await vectorDb.generateEmbedding(question);'
);

const embedLogic = `
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
    const vector: number[] = new Array(768).fill(0);
    const words = text.toLowerCase().split(/\\W+/);
    for (const word of words) {
        if (!word) continue;
        let h = 0;
        for (let i = 0; i < word.length; i++) {
           h = (h << 5) - h + word.charCodeAt(i);
           h |= 0;
        }
        vector[Math.abs(h) % 768] += 1;
    }
    let sum = 0;
    for (let v of vector) sum += v * v;
    if (sum > 0) {
        for (let i=0; i<768; i++) vector[i] /= Math.sqrt(sum);
    }
    return vector;
`;

// Replace the old contents of generateEmbedding
const regex = /public async generateEmbedding\(text: string\): Promise<number\[\]> \{[\s\S]*?return vector;\n  \}/m;
code = code.replace(regex, `public async generateEmbedding(text: string): Promise<number[]> {${embedLogic}\n  }`);

fs.writeFileSync('server.ts', code);
console.log('Embeddings fixed');
