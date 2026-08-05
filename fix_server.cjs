const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const notifHelper = `
function createNotification(userId: string, type: "mention" | "reply" | "system", title: string, message: string, linkId?: string) {
  const notif: Notification = {
    id: \`notif-\${Date.now()}-\${Math.random().toString(36).substring(2, 9)}\`,
    userId,
    type,
    title,
    message,
    isRead: false,
    createdAt: new Date().toISOString(),
    linkId
  };
  notifications.unshift(notif);
  io.emit("notification:received", notif);
}
`;

code = code.replace(
  'function extractMentions(text: string) {',
  notifHelper + '\\nfunction extractMentions(text: string) {'
);

fs.writeFileSync('server.ts', code);
console.log('Restored createNotification');
