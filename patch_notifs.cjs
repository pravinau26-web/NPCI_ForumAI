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

code = code.replace('let notifications: Notification[] = [', notifHelper + '\nlet notifications: Notification[] = [');

code = code.replace(
  'comments.unshift(newComment);',
  `comments.unshift(newComment);
  // Send notification to thread author
  const thread = threads.find(t => t.id === id);
  if (thread && thread.authorId !== authorId) {
    createNotification(thread.authorId, "reply", "New Reply", \`Someone replied to your topic: \${thread.title}\`, thread.id);
  }
  `
);

code = code.replace(
  'app.post("/api/threads", async (req, res) => {',
  `app.post("/api/threads", async (req, res) => {`
);

// We should also handle mentions maybe later.
fs.writeFileSync('server.ts', code);
console.log('patched');
