import fs from 'fs';
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');
content = content.replace(
  /<p className="text-slate-400 dark:text-slate-500 font-semibold font-mono">WORKSPACE SECURITY:<\/p>\s*<p className="text-blue-600 dark:text-blue-400 font-extrabold mt-0\.5 flex items-center gap-1\.5 font-mono">\s*<Lock className="w-3 h-3 text-blue-500 dark:text-cyan-400" \/>\s*<span>FIPS 140-3 Compliant<\/span>\s*<\/p>/g,
  `<p className="text-slate-400 dark:text-slate-500 font-semibold font-mono truncate">@{currentUser.username}</p>
            <p className="text-blue-600 dark:text-blue-400 font-extrabold mt-0.5 flex items-center gap-1.5 font-mono truncate">
              <Lock className="w-3 h-3 shrink-0 text-blue-500 dark:text-cyan-400" />
              <span className="truncate uppercase text-[9px]">{currentUser.role.replace(/_/g, " ")}</span>
            </p>`
);
fs.writeFileSync('src/components/Sidebar.tsx', content);
