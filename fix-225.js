import fs from 'fs';
let content = fs.readFileSync('src/components/ThreadView.tsx', 'utf-8');
content = content.replace(
  '{ (currentUser.id === activeThread.authorId || currentUser.role === "platform_admin"? (',
  '{ (currentUser.id === activeThread.authorId || currentUser.role === "platform_admin") && ('
);
fs.writeFileSync('src/components/ThreadView.tsx', content);
