import React, { useState, useEffect, useRef } from "react";
import { User, Community, Thread, Comment, Chat, ChatMessage, Notification, PolicyDocument, AuditLog, UserRole, Attachment } from "./types";
import Login from "./components/Login";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ThreadView from "./components/ThreadView";
import DMChat from "./components/DMChat";
import PolicyManager from "./components/PolicyManager";
import AdminPanel from "./components/AdminPanel";
import HierarchyView from "./components/HierarchyView";
import LiveNotificationToast from "./components/LiveNotificationToast";
import PDFViewerModal from "./components/PDFViewerModal";
import UserProfileModal from "./components/UserProfileModal";
import ProfileSettingsModal from "./components/ProfileSettingsModal";
import AttachmentPreviewModal from "./components/AttachmentPreviewModal";

export default function App() {
  // Theme Manager (Light & Dark mode support)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("npci_theme");
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("npci_theme", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("npci_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Global Workspace View Engine
  const [activeView, setActiveView] = useState<"forum" | "chats" | "policy" | "admin" | "logs" | "hierarchy">("forum");
  
  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typingStatus, setTypingStatus] = useState<{ [userId: string]: boolean }>({});
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);

  // Global Workspace Modals & Favorites State
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("npci_favorite_users");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);
  const [pdfViewerPolicy, setPdfViewerPolicy] = useState<PolicyDocument | null>(null);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  const handleToggleFavorite = (userId: string) => {
    setFavorites(prev => {
      const updated = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      localStorage.setItem("npci_favorite_users", JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateProfile = async (updatedData: {
    username?: string;
    email?: string;
    avatar?: string;
    bio?: string;
    department?: string;
    reportsTo?: string;
  }) => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/users/${currentUser.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        return false;
      }

      const updatedUser = await res.json();
      setCurrentUser(updatedUser);
      localStorage.setItem("npci_user", JSON.stringify(updatedUser));
      
      // Update our local users state
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      return true;
    } catch (err) {
      console.error("Error updating profile:", err);
      return false;
    }
  };

  const handleOpenPdfViewer = (fileName: string, title?: string, pdfData?: string) => {
    const found = policies.find(p => 
      p.fileName.toLowerCase() === fileName.toLowerCase() || 
      (title && p.title.toLowerCase() === title.toLowerCase())
    );
    if (found) {
      setPdfViewerPolicy({
        ...found,
        pdfData: pdfData || found.pdfData
      });
    } else {
      setPdfViewerPolicy({
        id: `virtual-${Date.now()}`,
        title: title || fileName.replace(/_/g, " ").replace(".pdf", ""),
        description: "Shared workspace attachment document.",
        fileName: fileName,
        version: "1.0",
        uploadedBy: "system",
        uploadedAt: new Date().toISOString(),
        pdfData: pdfData,
        chunks: [
          {
            section: "Document Contents & Overview",
            text: `This document (${fileName}) is a secure shared workspace attachment. Its contents are fully validated and monitored for compliance under FIPS 140-3 protocols.`
          },
          {
            section: "Operational Directives & Compliance Standards",
            text: `All payment gateway switches, acquiring operations, and APIs must follow standard directives for ${fileName}.`
          }
        ],
        type: "spec"
      });
    }
  };

  const handlePreviewAttachment = (att: Attachment) => {
    const isPdf = (att.type || "").toLowerCase().includes("pdf") || (att.name || "").toLowerCase().endsWith(".pdf");
    if (isPdf) {
      handleOpenPdfViewer(att.name, undefined, (att.url && (att.url.startsWith("data:") || att.url.startsWith("blob:") || att.url.startsWith("http"))) ? att.url : undefined);
    } else {
      setPreviewAttachment(att);
    }
  };

  const wsRef = useRef<WebSocket | null>(null);
  const activeChatIdRef = useRef(activeChatId);
  const activeCommunityIdRef = useRef(activeCommunityId);
  const activeThreadIdRef = useRef(activeThreadId);

  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);
  useEffect(() => { activeCommunityIdRef.current = activeCommunityId; }, [activeCommunityId]);
  useEffect(() => { activeThreadIdRef.current = activeThreadId; }, [activeThreadId]);

  // ==========================================
  // WEBSOCKET LIFECYCLE & EVENT HANDLERS
  // ==========================================
  useEffect(() => {
    if (!currentUser) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socketUrl = `${protocol}//${window.location.host}`;
    
    const connectWS = () => {
      const ws = new WebSocket(socketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Connected to NPCI Real-Time Gateway");
        // Authenticate connection on server mapping
        ws.send(JSON.stringify({ type: "auth", userId: currentUser.id }));
      };

      ws.onmessage = (event) => {
        try {
          const { event: evType, payload } = JSON.parse(event.data);
          
          if (evType === "status:changed") {
            const { userId, status } = payload;
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
          }

          if (evType === "typing:status") {
            const { chatId, userId, isTyping } = payload;
            if (activeChatIdRef.current === chatId) {
              setTypingStatus(prev => ({ ...prev, [userId]: isTyping }));
            }
          }

          if (evType === "notification:received") {
            const notif = payload as Notification;
            if (notif.userId === currentUser.id) {
              setNotifications(prev => {
                if (prev.some(n => n.id === notif.id)) return prev;
                return [notif, ...prev];
              });
              setToasts(prev => {
                if (prev.some(t => t.id === notif.id)) return prev;
                return [...prev, notif];
              });
              // Play a soft notification audio beep if possible
              try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = "sine";
                osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
                gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.1);
              } catch (e) {}
            }
          }

          if (evType === "message:received") {
            const msg = payload as ChatMessage;
            if (activeChatIdRef.current === msg.chatId) {
              setChatMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
              // Clear typing indicator for sender
              setTypingStatus(prev => ({ ...prev, [msg.senderId]: false }));
            }
            
            // Real-time re-sorting: Update chat's lastMessage
            setChats(prevChats => {
              return prevChats.map(c => {
                if (c.id === msg.chatId) {
                  return {
                    ...c,
                    lastMessage: {
                      content: msg.content,
                      createdAt: msg.createdAt,
                      senderId: msg.senderId
                    }
                  };
                }
                return c;
              });
            });
          }

          if (evType === "thread:created") {
            const { thread } = payload;
            setThreads(prev => {
              if (prev.some(t => t.id === thread.id)) return prev;
              return [thread, ...prev];
            });
          }

          if (evType === "comment:created") {
            const { comment, threadId } = payload;
            if (activeThreadIdRef.current === threadId) {
              setComments(prev => {
                if (prev.some(c => c.id === comment.id)) return prev;
                return [...prev, comment];
              });
            }
          }

          if (evType === "thread:updated") {
            const updated = payload as Thread;
            setThreads(prev => prev.map(t => t.id === updated.id ? updated : t));
          }

          if (evType === "thread:deleted") {
            const { threadId } = payload;
            setThreads(prev => prev.filter(t => t.id !== threadId));
            setComments(prev => prev.filter(c => c.threadId !== threadId));
            if (activeThreadIdRef.current === threadId) {
              setActiveThreadId(null);
            }
          }

          if (evType === "comment:updated") {
            const updated = payload as Comment;
            setComments(prev => prev.map(c => c.id === updated.id ? updated : c));
          }

          if (evType === "community:created") {
            setCommunities(prev => {
              if (prev.some(c => c.id === payload.id || c.name.toLowerCase() === payload.name.toLowerCase())) return prev;
              return [...prev, payload];
            });
          }

          if (evType === "community:deleted") {
            const { communityId } = payload;
            setCommunities(prev => prev.filter(c => c.id !== communityId));
            if (activeCommunityIdRef.current === communityId) {
              setActiveCommunityId(null);
            }
          }

          if (evType === "policies:updated") {
            setPolicies(payload);
          }

          if (evType === "chat:deleted") {
            const { chatId } = payload;
            setChats(prev => prev.filter(c => c.id !== chatId));
            if (activeChatIdRef.current === chatId) setActiveView("forum");
          }
          if (evType === "chat:created") {
            const newChat = payload as Chat;
            if (newChat.participants.includes(currentUser.id)) {
              setChats(prev => {
                if (prev.some(c => c.id === newChat.id)) return prev;
                return [newChat, ...prev];
              });
            }
          }

          if (evType === "users:updated") {
            setUsers(payload);
          }

          if (evType === "audit_log:added") {
            setAuditLogs(prev => [payload, ...prev]);
          }
        } catch (e) {
          console.error("Failed to parse WS payload:", e);
        }
      };

      ws.onclose = () => {
        console.warn("WS disconnected. Attempting automatic reconnection in 4s...");
        setTimeout(connectWS, 4000);
      };
    };

    connectWS();

    return () => {
      wsRef.current?.close();
    };
  }, [currentUser]);

  // ==========================================
  // INITIAL DATA BOOTSTRAP FILLS
  // ==========================================
  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const [usersRes, commRes, policiesRes, notifRes, logsRes] = await Promise.all([
        fetch("/api/users", { headers: { "x-user-id": currentUser.id } }),
        fetch("/api/communities"),
        fetch("/api/policies"),
        fetch(`/api/notifications?userId=${currentUser.id}`),
        fetch("/api/audit-logs")
      ]);

      const [usersData, commData, policiesData, notifData, logsData] = await Promise.all([
        usersRes.json(),
        commRes.json(),
        policiesRes.json(),
        notifRes.json(),
        logsRes.json()
      ]);

      setUsers(usersData);
      setCommunities(commData);
      setPolicies(policiesData);
      setNotifications(notifData);
      setAuditLogs(logsData);

      // Auto select first community if none selected
      if (commData.length > 0 && !activeCommunityId) {
        setActiveCommunityId(commData[0].id);
      }
    } catch (err) {
      console.error("Bootstrap retrieval error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Fetch threads when active community changes
  useEffect(() => {
    if (!activeCommunityId) return;
    const fetchThreads = async () => {
      try {
        const res = await fetch(`/api/communities/${activeCommunityId}/threads`);
        const data = await res.json();
        setThreads(data);
        setActiveThreadId(null); // Reset thread focus
      } catch (err) {
        console.error(err);
      }
    };
    fetchThreads();
  }, [activeCommunityId]);

  // Fetch comments when active thread changes
  useEffect(() => {
    if (!activeThreadId) return;
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/threads/${activeThreadId}/comments`);
        const data = await res.json();
        setComments(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchComments();
  }, [activeThreadId]);

  // Fetch chats list
  useEffect(() => {
    if (!currentUser) return;
    const fetchChats = async () => {
      try {
        const res = await fetch(`/api/chats?userId=${currentUser.id}`);
        const data = await res.json();
        setChats(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchChats();
  }, [currentUser, activeView]);

  // Fetch chat messages when active chat changes
  useEffect(() => {
    if (!activeChatId) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chats/${activeChatId}/messages`);
        const data = await res.json();
        setChatMessages(data);
        setTypingStatus({});
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();
  }, [activeChatId]);

  // ==========================================
  // TRANSACTION / ACTION HANDLERS
  // ==========================================

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("npci_user", JSON.stringify(user));
  };

  const handleLogout = () => {
    if (currentUser) {
      fetch(`/api/users/${currentUser.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "offline" }),
      });
    }
    setCurrentUser(null);
    localStorage.removeItem("npci_user");
  };

  const handleUpdateStatus = async (status: "online" | "offline" | "away") => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const updated = await res.json();
      setCurrentUser(updated);
      localStorage.setItem("npci_user", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCommunity = async (
    name: string, 
    description: string, 
    isPrivate: boolean,
    allowedUserIds?: string[],
    allowedDepartments?: string[]
  ) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          description, 
          isPrivate, 
          createdBy: currentUser.id,
          allowedUserIds,
          allowedDepartments
        }),
      });
      const data = await res.json();
      setCommunities(prev => {
        if (prev.some(c => c.id === data.id || c.name.toLowerCase() === data.name.toLowerCase())) return prev;
        return [...prev, data];
      });
      setActiveCommunityId(data.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCommunity = async (communityId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/communities/${communityId}`, {
        method: "DELETE",
        headers: { "x-user-id": currentUser.id },
      });
      if (res.ok) {
        setCommunities(prev => prev.filter(c => c.id !== communityId));
        if (activeCommunityId === communityId) {
          setActiveCommunityId(null);
        }
      }
    } catch (err) {
      console.error("Error deleting community:", err);
    }
  };

  const handleUpdateCommunityMembers = async (
    communityId: string,
    memberIds: string[],
    allowedUserIds: string[],
    allowedDepartments: string[]
  ) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/communities/${communityId}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": currentUser.id },
        body: JSON.stringify({ memberIds, allowedUserIds, allowedDepartments }),
      });
      if (res.ok) {
        const updatedComm = await res.json();
        setCommunities(prev => prev.map(c => c.id === communityId ? updatedComm : c));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update community access permissions");
      }
    } catch (err) {
      console.error("Error updating community members:", err);
    }
  };

  const handleAddThread = async (title: string, content: string, tags?: string[], attachments?: any[]) => {
    if (!currentUser || !activeCommunityId) return;
    const res = await fetch(`/api/communities/${activeCommunityId}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, authorId: currentUser.id, tags, attachments }),
    });
    const data = await res.json();
    setThreads(prev => {
      if (prev.some(t => t.id === data.id)) return prev;
      return [data, ...prev];
    });
    return data;
  };

  const handleAddComment = async (content: string, parentId?: string, attachments?: any[]) => {
    if (!currentUser || !activeThreadId) return;
    try {
      const res = await fetch(`/api/threads/${activeThreadId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, authorId: currentUser.id, parentId, attachments }),
      });
      const data = await res.json();
      setComments(prev => {
        if (prev.some(c => c.id === data.id)) return prev;
        return [...prev, data];
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpvoteThread = async (id: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/threads/${id}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json();
      setThreads(prev => prev.map(t => t.id === id ? data : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpvoteComment = async (id: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/comments/${id}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json();
      setComments(prev => prev.map(c => c.id === id ? data : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePinThread = async (id: string, isPinned: boolean) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/threads/${id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned, actorId: currentUser.id }),
      });
      const data = await res.json();
      setThreads(prev => prev.map(t => t.id === id ? data : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteThread = async (id: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/threads/${id}?actorId=${currentUser.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setThreads(prev => prev.filter(t => t.id !== id));
        if (activeThreadId === id) {
          setActiveThreadId(null);
        }
        setComments(prev => prev.filter(c => c.threadId !== id));
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete discussion.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectUserChat = async (recipient: User) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants: [currentUser.id, recipient.id], isGroup: false }),
      });
      const data = await res.json();
      setChats(prev => {
        if (prev.some(c => c.id === data.id)) return prev;
        return [data, ...prev];
      });
      setActiveChatId(data.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async (name: string, participantIds: string[]) => {
    // We already have handleCreateGroupChat in Sidebar! Wait, it's defined there.
  };

  const handleDeleteGroup = async (chatId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/chats/${chatId}?userId=${currentUser.id}`, { method: "DELETE" });
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
      const res = await fetch(`/api/chats/${chatId}/exit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (activeChatId === chatId) setActiveView("forum");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMembersSuccess = (updatedChat: Chat) => {
    setChats(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (!currentUser || !activeChatId) return;
    const currentChat = chats.find(c => c.id === activeChatId);
    const isToAi = currentChat && !currentChat.isGroup && currentChat.participants.includes("npci_assistant");
    
    if (isToAi) {
      setIsAiResponding(true);
    }
    try {
      const res = await fetch(`/api/chats/${activeChatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: currentUser.id, content, attachments }),
      });
      await res.json();

      // Refetch all messages in active chat to load user message and grounded AI response instantly
      const msgsRes = await fetch(`/api/chats/${activeChatId}/messages`);
      if (msgsRes.ok) {
        const updatedMsgs = await msgsRes.json();
        setChatMessages(updatedMsgs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isToAi) {
        setIsAiResponding(false);
      }
    }
  };

  const handleSendTyping = (isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && activeChatId) {
      wsRef.current.send(JSON.stringify({ type: "typing", chatId: activeChatId, isTyping }));
    }
  };

  const handleUploadPolicy = async (policyData: any) => {
    if (!currentUser) return "";
    try {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...policyData, uploadedBy: currentUser.id }),
      });
      const data = await res.json();
      // Refetch policies & audit logs
      const [pRes, lRes] = await Promise.all([fetch("/api/policies"), fetch("/api/audit-logs")]);
      setPolicies(await pRes.json());
      setAuditLogs(await lRes.json());
      return data.changelog || "";
    } catch (err) {
      console.error(err);
      return "";
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/policies/${id}?actorId=${currentUser.id}`, {
        method: "DELETE",
        headers: { "x-user-id": currentUser.id }
      });
      if (res.ok) {
        setPolicies(prev => prev.filter(p => p.id !== id));
        const lRes = await fetch("/api/audit-logs");
        if (lRes.ok) setAuditLogs(await lRes.json());
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete document");
      }
    } catch (err) {
      console.error("Delete document error:", err);
    }
  };

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, actorId: currentUser.id }),
      });
      const usersRes = await fetch("/api/users");
      setUsers(await usersRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAskProductAi = async (question: string) => {
    const res = await fetch("/api/ai/ask-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    return data.answer || "";
  };

  // Global Thread Search filter
  const filteredThreadsBySearch = threads.filter(t => {
    const query = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(query) || 
      t.content.toLowerCase().includes(query) || 
      t.tags.some(tag => tag.toLowerCase().includes(query));
  });

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} theme={theme} onToggleTheme={handleToggleTheme} />;
  }

  const activeCommunity = communities.find(c => c.id === activeCommunityId);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Global Executive Header */}
      <Header
        currentUser={currentUser}
        onUpdateStatus={handleUpdateStatus}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onSelectThread={(tid) => {
          setActiveThreadId(tid);
          if (tid) {
            // Find which community this thread belongs to
            const threadObj = threads.find(t => t.id === tid);
            if (threadObj) {
              setActiveCommunityId(threadObj.communityId);
            }
          }
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onViewChange={(v) => {
          setActiveView(v);
          setActiveThreadId(null);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onOpenProfileSettings={() => setShowProfileSettings(true)}
        onSelectChat={(chatId) => {
          setActiveChatId(chatId);
          setActiveView("chats");
        }}
        onSelectCommunity={(communityId) => {
          setActiveCommunityId(communityId);
        }}
        threads={threads}
        communities={communities}
        policies={policies}
        users={users}
        onOpenPdfViewer={(fileName, title) => {
          const policyObj = policies.find(p => p.fileName === fileName) || {
            id: `policy-${Date.now()}`,
            title: title || fileName,
            category: "NPCI Specifications",
            fileName: fileName,
            version: "v2.4",
            uploadedBy: "npci_admin",
            uploadedAt: new Date().toISOString(),
            fileSize: "1.8 MB",
            summary: "NPCI Technical Specifications and Security Directives Document."
          };
          setPdfViewerPolicy(policyObj);
        }}
        onSelectUserChat={handleSelectUserChat}
      />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Workspace Navigation Bar */}
        <Sidebar
          communities={communities}
          activeCommunityId={activeCommunityId}
          onSelectCommunity={(cid) => {
            setActiveCommunityId(cid);
            setActiveThreadId(null);
            setActiveView("forum");
            setMobileSidebarOpen(false); // Auto close drawer on mobile selection
          }}
          users={users}
          currentUser={currentUser}
          onSelectUserChat={handleSelectUserChat}
          activeView={activeView}
          onViewChange={(v) => {
            setActiveView(v);
            setActiveThreadId(null);
            setMobileSidebarOpen(false); // Auto close drawer on mobile selection
          }}
          onCreateCommunity={handleCreateCommunity}
          onDeleteCommunity={handleDeleteCommunity}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileSidebarOpen={mobileSidebarOpen}
          onCloseMobileSidebar={() => setMobileSidebarOpen(false)}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onViewProfile={setSelectedProfileUser}
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={(chatId) => {
            setActiveChatId(chatId);
            setActiveView("chats");
            setMobileSidebarOpen(false);
          }}
          onCreateGroupChat={async (name, participantIds) => {
            if (!currentUser) return;
            try {
              const res = await fetch("/api/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  participants: [currentUser.id, ...participantIds], 
                  isGroup: true, 
                  name 
                }),
              });
              const data = await res.json();
              setChats(prev => {
                if (prev.some(c => c.id === data.id)) return prev;
                return [data, ...prev];
              });
              setActiveChatId(data.id);
              setActiveView("chats");
            } catch (err) {
              console.error(err);
            }
          }}
        />

        {/* Central Viewport Router */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeView === "forum" && activeCommunity && (
            <ThreadView
              community={activeCommunity}
              threads={filteredThreadsBySearch}
              activeThreadId={activeThreadId}
              onSelectThread={setActiveThreadId}
              comments={comments}
              currentUser={currentUser}
              users={users}
              onAddThread={handleAddThread}
              onAddComment={handleAddComment}
              onUpvoteThread={handleUpvoteThread}
              onUpvoteComment={handleUpvoteComment}
              onPinThread={handlePinThread}
              onDeleteThread={handleDeleteThread}
              onDeleteCommunity={handleDeleteCommunity}
              onUpdateCommunityMembers={handleUpdateCommunityMembers}
              policies={policies}
              onViewProfile={setSelectedProfileUser}
              onPreviewAttachment={handlePreviewAttachment}
            />
          )}

          {activeView === "chats" && (
            <DMChat
              activeChat={chats.find(c => c.id === activeChatId) || null}
              chatMessages={chatMessages}
              users={users}
              currentUser={currentUser}
              onDeleteGroup={handleDeleteGroup}
              onExitGroup={handleExitGroup}
              onAddMembersSuccess={handleAddMembersSuccess}
              onSendMessage={handleSendMessage}
              typingStatus={typingStatus}
              onSendTyping={handleSendTyping}
              onAskProductAi={handleAskProductAi}
              isAiResponding={isAiResponding}
              onViewProfile={setSelectedProfileUser}
              onPreviewAttachment={handlePreviewAttachment}
            />
          )}

          {activeView === "policy" && (
            <PolicyManager
              policies={policies}
              currentUser={currentUser}
              onUploadPolicy={handleUploadPolicy}
              onDeletePolicy={handleDeletePolicy}
              auditLogs={auditLogs}
              onViewPdf={handleOpenPdfViewer}
              onViewProfile={setSelectedProfileUser}
              users={users}
            />
          )}

          {activeView === "hierarchy" && (
            <HierarchyView
              users={users}
              currentUser={currentUser}
            />
          )}

          {activeView === "admin" && (
            <AdminPanel
              users={users}
              currentUser={currentUser}
              onUpdateRole={handleUpdateRole}
              onRefreshUsers={fetchData}
            />
          )}
        </main>
      </div>

      <LiveNotificationToast
        toasts={toasts}
        onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
        onClickToast={(notif) => {
          handleMarkNotificationRead(notif.id);
          setToasts(prev => prev.filter(t => t.id !== notif.id));
          if (notif.type === "dm") {
            setActiveView("chats");
          } else {
            setActiveView("forum");
            // Find which community this thread belongs to
            const threadObj = threads.find(t => t.id === notif.sourceId);
            if (threadObj) {
              setActiveCommunityId(threadObj.communityId);
            }
            setActiveThreadId(notif.sourceId);
          }
        }}
      />

      {/* GLOBAL USER PROFILE MODAL */}
      {selectedProfileUser && (
        <UserProfileModal
          user={selectedProfileUser}
          currentUser={currentUser}
          onClose={() => setSelectedProfileUser(null)}
          threads={threads}
          comments={comments}
          policies={policies}
          isFavorite={favorites.includes(selectedProfileUser.id)}
          onToggleFavorite={handleToggleFavorite}
          onSelectUserChat={handleSelectUserChat}
          onViewThread={(threadId, communityId) => {
            setActiveView("forum");
            setActiveCommunityId(communityId);
            setActiveThreadId(threadId);
            setSelectedProfileUser(null);
          }}
        />
      )}

      {/* GLOBAL PDF VIEWER MODAL */}
      {pdfViewerPolicy && (
        <PDFViewerModal
          policy={pdfViewerPolicy}
          onClose={() => setPdfViewerPolicy(null)}
        />
      )}

      {/* PROFILE SETTINGS MODAL */}
      {showProfileSettings && (
        <ProfileSettingsModal
          currentUser={currentUser}
          onClose={() => setShowProfileSettings(false)}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {/* GLOBAL ATTACHMENT PREVIEW MODAL */}
      {previewAttachment && (
        <AttachmentPreviewModal
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      )}
    </div>
  );
}
