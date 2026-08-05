import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const insertHandlers = `  const handleCreateGroup = async (name: string, participantIds: string[]) => {
    // We already have handleCreateGroupChat in Sidebar! Wait, it's defined there.
  };

  const handleDeleteGroup = async (chatId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(\`/api/chats/\${chatId}?userId=\${currentUser.id}\`, { method: "DELETE" });
      if (res.ok) {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (activeChatId === chatId) setActiveView("forum");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExitGroup = async (chatId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(\`/api/chats/\${chatId}/exit\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, participants: c.participants.filter(p => p !== currentUser.id) } : c));
        if (activeChatId === chatId) setActiveView("forum");
      }
    } catch (err) {
      console.error(err);
    }
  };
`;

content = content.replace(
  '  const handleSendMessage = async (content: string, attachments?: any[]) => {',
  insertHandlers + '\n  const handleSendMessage = async (content: string, attachments?: any[]) => {'
);

content = content.replace(
  'onSendMessage={handleSendMessage}',
  'onDeleteGroup={handleDeleteGroup}\n              onExitGroup={handleExitGroup}\n              onSendMessage={handleSendMessage}'
);

fs.writeFileSync('src/App.tsx', content);
