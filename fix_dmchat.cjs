const fs = require('fs');
let code = fs.readFileSync('src/components/DMChat.tsx', 'utf8');

// add import MentionText from "./MentionText";
if (!code.includes('MentionText')) {
  code = code.replace(
    'import { Cpu, Send, Smile, Paperclip, X, Image as ImageIcon, Bot, Info, Search, ShieldAlert, Check, CheckCheck, Users } from "lucide-react";',
    'import { Cpu, Send, Smile, Paperclip, X, Image as ImageIcon, Bot, Info, Search, ShieldAlert, Check, CheckCheck, Users } from "lucide-react";\nimport MentionText from "./MentionText";'
  );
}

// replace <div>{msg.content}</div> with <div><MentionText text={msg.content} users={users} /></div>
code = code.replace(/<div>\{msg\.content\}<\/div>/g, '<div><MentionText text={msg.content} users={users} /></div>');

fs.writeFileSync('src/components/DMChat.tsx', code);
console.log('DMChat fixed');
