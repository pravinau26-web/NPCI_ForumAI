import fs from 'fs';
import path from 'path';

function getFiles(dir, files = []) {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = `${dir}/${file}`;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else if (name.endsWith('.tsx')) {
      files.push(name);
    }
  }
  return files;
}

const files = getFiles('src/components');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/className=(["'])(.*?)\1/g, (match, quote, classNames) => {
    if (classNames.includes('bg-white') && !classNames.includes('bg-white/10') && !classNames.includes('dark:bg-')) {
      const newClasses = classNames.replace(/\bbg-white\b/g, 'bg-white dark:bg-slate-900 dark:text-slate-100');
      let finalClasses = newClasses;
      if (finalClasses.includes('border-slate-200') && !finalClasses.includes('dark:border-')) {
        finalClasses = finalClasses.replace(/\bborder-slate-200\b/g, 'border-slate-200 dark:border-slate-800');
      }
      if (finalClasses.includes('border-slate-150') && !finalClasses.includes('dark:border-')) {
        finalClasses = finalClasses.replace(/\bborder-slate-150\b/g, 'border-slate-150 dark:border-slate-800');
      }
      return `className=${quote}${finalClasses}${quote}`;
    }
    return match;
  });
  
  content = content.replace(/className=\{`([^`]+)`\}/g, (match, classNames) => {
    if (classNames.includes('bg-white') && !classNames.includes('bg-white/10') && !classNames.includes('dark:bg-')) {
      const newClasses = classNames.replace(/\bbg-white\b/g, 'bg-white dark:bg-slate-900 dark:text-slate-100');
      let finalClasses = newClasses;
      if (finalClasses.includes('border-slate-200') && !finalClasses.includes('dark:border-')) {
        finalClasses = finalClasses.replace(/\bborder-slate-200\b/g, 'border-slate-200 dark:border-slate-800');
      }
      if (finalClasses.includes('border-slate-150') && !finalClasses.includes('dark:border-')) {
        finalClasses = finalClasses.replace(/\bborder-slate-150\b/g, 'border-slate-150 dark:border-slate-800');
      }
      return `className={\`${finalClasses}\`}`;
    }
    return match;
  });
  
  fs.writeFileSync(file, content);
});
console.log('Done replacing bg-white');
