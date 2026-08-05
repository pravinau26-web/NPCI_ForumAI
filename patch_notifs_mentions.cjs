const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const mentionRegex = `
function extractMentions(text: string) {
  const mentions = text.match(/@(\\w+)/g) || [];
  return mentions.map(m => m.substring(1));
}

function notifyMentions(text: string, title: string, linkId: string, currentUserId: string) {
  const mentionedUsernames = extractMentions(text);
  mentionedUsernames.forEach(username => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user && user.id !== currentUserId) {
      createNotification(user.id, "mention", "You were mentioned", title, linkId);
    }
  });
}
`;

code = code.replace(
  'function createNotification',
  mentionRegex + '\nfunction createNotification'
);

code = code.replace(
  'comments.unshift(newComment);',
  `comments.unshift(newComment);
  notifyMentions(content, \`You were mentioned in a comment\`, thread?.id || "");
  `
);

code = code.replace(
  'threads.unshift(newThread);',
  `threads.unshift(newThread);
  notifyMentions(content, \`You were mentioned in a topic: \${title}\`, newThread.id);
  `
);

code = code.replace(
  'policyDocuments.unshift(newDoc);',
  `policyDocuments.unshift(newDoc);
  notifyMentions(description, \`You were mentioned in a compliance doc: \${title}\`, newDoc.id);
  `
);

fs.writeFileSync('server.ts', code);
console.log('mentions patched');
