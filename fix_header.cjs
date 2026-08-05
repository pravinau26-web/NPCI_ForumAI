const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

const brandHtml = `
            <div className="hidden sm:block overflow-hidden rounded-md group-hover:scale-105 transition-transform duration-200 bg-white p-1">
              <img src="https://upload.wikimedia.org/wikipedia/commons/1/1a/National_Payments_Corporation_of_India.svg" alt="NPCI Logo" className="h-8 object-contain" referrerPolicy="no-referrer" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Featurist NPCI Forum</span>
                <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 px-2 py-0.5 rounded-full">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Secure Payments Workspace</p>
            </div>
`;

code = code.replace(
  /<div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-inner group-hover:scale-105 transition-transform duration-200">\s*<Shield className="w-6 h-6" \/>\s*<\/div>\s*<div className="hidden sm:block">\s*<div className="font-bold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1\.5">\s*<span>Featurist NPCI Forum<\/span>\s*<span className="text-\[10px\] font-semibold bg-blue-50 dark:bg-blue-900\/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800\/50 px-2 py-0\.5 rounded-full">\s*AI Powered\s*<\/span>\s*<\/div>\s*<p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Secure Payments Workspace<\/p>\s*<\/div>/m,
  brandHtml.trim()
);

fs.writeFileSync('src/components/Header.tsx', code);
console.log('Header fixed');
