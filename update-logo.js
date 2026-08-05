import fs from 'fs';
let content = fs.readFileSync('src/components/Header.tsx', 'utf-8');
content = content.replace(/<img src="https:\/\/upload.wikimedia.org\/wikipedia\/commons\/1\/1a\/National_Payments_Corporation_of_India.svg" alt="NPCI Logo" className="h-8 object-contain" referrerPolicy="no-referrer" \/>/, `<div className="flex items-center gap-1.5"><div className="bg-blue-700 text-white font-black italic tracking-tighter text-xl px-2 py-0.5 rounded-sm">NPCI</div></div>`);
fs.writeFileSync('src/components/Header.tsx', content);
