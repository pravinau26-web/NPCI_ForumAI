import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Bot, Phone, Video, HelpCircle, Sparkles, Check, CheckCheck, 
  Circle, Terminal, RefreshCw, Cpu, Users, Paperclip, X, FileText, Image as ImageIcon
} from "lucide-react";
import { Chat, ChatMessage, User, Attachment } from "../types";
import MentionText from "./MentionText";

interface DMChatProps {
  activeChat: Chat | null;
  chatMessages: ChatMessage[];
  users: User[];
  currentUser: User;
  onDeleteGroup?: (id: string) => void;
  onExitGroup?: (id: string) => void;
  onSendMessage: (content: string, attachments?: Attachment[]) => void;
  typingStatus: { [userId: string]: boolean };
  onSendTyping: (isTyping: boolean) => void;
  onAskProductAi: (question: string) => Promise<string>;
  isAiResponding?: boolean;
  onViewProfile?: (user: User) => void;
  onPreviewAttachment?: (attachment: Attachment) => void;
}

export default function DMChat({
  activeChat,
  chatMessages,
  users,
  currentUser,
  onSendMessage,
  typingStatus,
  onSendTyping,
  onAskProductAi,
  isAiResponding = false,
  onViewProfile,
  onDeleteGroup,
  onExitGroup,
  onPreviewAttachment,
}: DMChatProps) {
  const [msgInput, setMsgInput] = useState("");
  const [productQuestion, setProductQuestion] = useState("");
  const [productAnswer, setProductAnswer] = useState("");
  const [isAskingProductAi, setIsAskingProductAi] = useState(false);
  const [showProductAiPanel, setShowProductAiPanel] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, typingStatus]);

  const processFiles = async (files: File[]) => {
    const promises = files.map((file) => {
      return new Promise<Attachment>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const sizeStr = file.size > 1024 * 1024 
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${(file.size / 1024).toFixed(0)} KB`;
          resolve({
            name: file.name,
            type: file.type || "application/octet-stream",
            size: sizeStr,
            url: reader.result as string,
          });
        };
        reader.readAsDataURL(file);
      });
    });
    const results = await Promise.all(promises);
    setPendingAttachments((prev) => [...prev, ...results]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    await processFiles(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemoveAttachment = (idxToRemove: number) => {
    setPendingAttachments((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() && pendingAttachments.length === 0) return;
    
    const content = msgInput.trim() || `Sent ${pendingAttachments.length} file(s)`;
    onSendMessage(content, pendingAttachments.length > 0 ? pendingAttachments : undefined);
    setMsgInput("");
    setPendingAttachments([]);
    onSendTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsgInput(e.target.value);
    onSendTyping(e.target.value.length > 0);
  };

  const handleAskProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productQuestion.trim()) return;
    setIsAskingProductAi(true);
    setProductAnswer("");
    try {
      const response = await onAskProductAi(productQuestion.trim());
      setProductAnswer(response);
    } catch (err) {
      setProductAnswer("Could not reach product services.");
    } finally {
      setIsAskingProductAi(false);
    }
  };

  // Find participants details
  const getRecipientUser = () => {
    if (!activeChat || activeChat.isGroup) return null;
    const recipientId = activeChat.participants.find((p) => p !== currentUser.id);
    return users.find((u) => u.id === recipientId) || null;
  };

  const recipient = getRecipientUser();
  const isAiRecipient = recipient?.id === "npci_assistant";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-emerald-500";
      case "away":
        return "bg-amber-500";
      case "offline":
      default:
        return "bg-slate-400";
    }
  };

  const getSenderDetails = (senderId: string) => {
    return users.find((u) => u.id === senderId) || {
      username: "Coworker",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    };
  };

  // Collect other active users typing status in this chat
  const activeChatTypers = activeChat
    ? Object.keys(typingStatus)
        .filter((uid) => uid !== currentUser.id && activeChat.participants.includes(uid) && typingStatus[uid])
        .map((uid) => users.find((u) => u.id === uid)?.username || "Someone")
    : [];

  const groupMembers = activeChat ? users.filter(u => activeChat.participants.includes(u.id)) : [];

  return (
    <div className="flex-1 bg-slate-100 flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* LEFT CHAT AREA */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 border-r border-slate-200">
        {activeChat ? (
          <>
            {/* Active Chat Header */}
            <div className="bg-white dark:bg-slate-900 dark:text-slate-100 px-6 h-16 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shadow-sm z-10 relative">
              <div className="flex items-center gap-3 truncate text-left">
                {activeChat.isGroup ? (
                  <div className="bg-gradient-to-tr from-slate-700 to-slate-800 p-2 rounded-xl text-white">
                    <Users className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={recipient?.avatar}
                      alt={recipient?.username}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${getStatusColor(
                        recipient?.status || "offline"
                      )}`}
                    />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-sm">
                      {activeChat.isGroup ? activeChat.name : recipient?.username}
                    </h3>
                    {isAiRecipient && (
                      <span className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full font-mono shadow">
                        NPCI BOT
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {activeChat.isGroup ? (
                      <button 
                        onClick={() => setShowMembersList(!showMembersList)}
                        className="hover:underline focus:outline-none cursor-pointer flex items-center gap-1 text-blue-600 dark:text-blue-500 font-bold"
                      >
                        <span>{activeChat.participants.length} group participants</span>
                        <HelpCircle className="w-3 h-3 text-blue-500 inline" />
                      </button>
                    ) : isAiRecipient ? (
                      "Grounded on live policy docs"
                    ) : (
                      `${recipient?.department} • Status: ${recipient?.status}`
                    )}
                  </div>
                </div>
              </div>

              {/* Utility buttons */}
              <div className="flex items-center gap-1.5">
                {activeChat.isGroup && (
                  <button
                    onClick={() => setShowMembersList(!showMembersList)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      showMembersList
                        ? "bg-slate-250 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-300"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Members</span>
                  </button>
                )}
                <button
                  onClick={() => setShowProductAiPanel(!showProductAiPanel)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    showProductAiPanel
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="Toggle Product AI Copilot"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Product Helper</span>
                </button>
              </div>

              {/* Group Members List Modal */}
              {activeChat.isGroup && showMembersList && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[999] p-4">
                  <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl py-4 px-5 text-left animate-in zoom-in-95 duration-150">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">
                        Group Members ({groupMembers.length})
                      </h4>
                      <button
                        onClick={() => setShowMembersList(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                      {groupMembers.map(member => (
                        <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer" onClick={() => {
                          if (onViewProfile) onViewProfile(member);
                          setShowMembersList(false);
                        }}>
                          <div className="relative">
                            <img
                              src={member.avatar}
                              alt={member.username}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                              referrerPolicy="no-referrer"
                            />
                            <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${getStatusColor(member.status)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                              {member.username} {member.id === currentUser.id && <span className="text-[10px] text-slate-400 font-mono ml-1">(You)</span>}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {member.department || "Operations"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to exit this group?")) {
                            if (onExitGroup) onExitGroup(activeChat.id);
                            setShowMembersList(false);
                          }
                        }}
                        className="w-full text-center py-2 text-sm font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 rounded-xl transition cursor-pointer"
                      >
                        Exit Group
                      </button>
                      
                      {(activeChat.creatorId === currentUser.id || currentUser.role === "platform_admin") && (
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to permanently delete this group?")) {
                              if (onDeleteGroup) onDeleteGroup(activeChat.id);
                              setShowMembersList(false);
                            }
                          }}
                          className="w-full text-center py-2 text-sm font-bold text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 rounded-xl transition cursor-pointer"
                        >
                          Delete Group
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Messages Log */}
            <div 
              className={`flex-1 overflow-y-auto p-6 space-y-4 relative transition-all duration-200 ${
                isDragging ? "bg-blue-50/40 dark:bg-blue-950/20 border-2 border-dashed border-blue-400" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isDragging && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white z-50 pointer-events-none">
                  <Paperclip className="w-12 h-12 text-blue-400 animate-bounce mb-2" />
                  <p className="font-bold text-sm">Drop files here to upload</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Images, PDFs, or specs</p>
                </div>
              )}
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                  <Bot className="w-12 h-12 text-slate-300 mb-2 animate-bounce" />
                  <p>Send a secure message to start the conversation.</p>
                  {isAiRecipient && (
                    <p className="text-[11px] text-blue-500 font-semibold mt-1">
                      Directly consult AePS, UPI limits, or RuPay mandates!
                    </p>
                  )}
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  const sender = getSenderDetails(msg.senderId);
                  const isBot = msg.senderId === "npci_assistant";
                  const isAutoResponse = msg.content.includes("[AI Auto-Responder]");

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto text-left"}`}
                    >
                      {!isMe && (
                        <img
                          src={sender.avatar}
                          alt={sender.username}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="space-y-1">
                        {!isMe && (
                          <span className="text-[10px] text-slate-400 font-semibold pl-1.5">
                            {sender.username}
                          </span>
                        )}
                        <div
                          className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap font-sans ${
                            isMe
                              ? "bg-slate-900 dark:bg-indigo-600 text-white rounded-tr-none"
                              : isBot
                              ? "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/80 dark:to-indigo-950/80 border border-blue-100 dark:border-blue-800/50 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-sm"
                              : isAutoResponse
                              ? "bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/50 text-slate-700 dark:text-amber-200 rounded-tl-none"
                              : "bg-white dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 text-slate-800 rounded-tl-none"
                          }`}
                        >
                          <div><MentionText text={msg.content} users={users} /></div>
                          
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-slate-100/20 space-y-2 max-w-sm">
                              {msg.attachments.map((file, idx) => {
                                const isImage = file.type.startsWith("image/");
                                return (
                                  <div 
                                    key={idx} 
                                    onClick={() => onPreviewAttachment && onPreviewAttachment(file)}
                                    className="rounded-xl overflow-hidden border border-slate-200/20 cursor-pointer hover:border-blue-500/50 transition group"
                                  >
                                    {isImage ? (
                                      <div className="bg-slate-100 dark:bg-slate-800 flex justify-center items-center relative">
                                        <img
                                          src={file.url}
                                          alt={file.name}
                                          className="object-contain max-h-48 w-full group-hover:scale-[1.02] transition-transform duration-150"
                                        />
                                        <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold backdrop-blur-xs">
                                          Click to Preview
                                        </span>
                                      </div>
                                    ) : (
                                      <div
                                        className={`flex items-center gap-2 p-2.5 text-xs transition truncate ${
                                          isMe 
                                            ? "bg-white/10 text-white hover:bg-white/20" 
                                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                        }`}
                                      >
                                        <Paperclip className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                        <div className="truncate text-left flex-1 min-w-0">
                                          <p className="font-semibold truncate leading-tight group-hover:text-blue-400 transition-colors">{file.name}</p>
                                          <p className="text-[10px] opacity-75 mt-0.5 font-mono">{file.size} • Click to Preview</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className={`flex items-center gap-1.5 px-1.5 ${isMe ? "justify-end" : ""}`}>
                          <span className="text-[9px] text-slate-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            <span>
                              {msg.status === "read" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                              ) : msg.status === "delivered" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-300" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicators */}
              {activeChatTypers.length > 0 && (
                <div className="flex items-center gap-2 pl-12 text-xs text-slate-400 font-medium">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>{activeChatTypers.join(", ")} is typing...</span>
                </div>
              )}

              {/* AI Processing / Buffering Indicator */}
              {isAiResponding && (
                <div className="flex gap-3 max-w-[80%] mr-auto text-left animate-pulse">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white border border-blue-200">
                      <Cpu className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold pl-1.5 flex items-center gap-1">
                      <span>NPCI Assistant</span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                    </span>
                    <div className="p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed bg-gradient-to-br from-blue-50/70 to-indigo-50/70 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/30 text-blue-700 dark:text-blue-300 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                        </div>
                        <span className="italic">Formulating a compliant, grounded response from NPCI knowledge base...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>

            {/* Input message Composer bar */}
            <div className="bg-white dark:bg-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-800 p-4">
              {recipient && (recipient.status === "away" || recipient.status === "offline") && (
                <div className="mb-2 bg-amber-50 text-amber-800 px-4 py-2 rounded-xl text-xs border border-amber-100 flex items-center gap-2 font-medium">
                  <Circle className="w-2.5 h-2.5 fill-amber-500 text-amber-500 animate-pulse" />
                  <span>
                    {recipient.username} is currently <strong>{recipient.status}</strong>. Your message will deliver immediately, and our AI Auto-Responder is primed.
                  </span>
                </div>
              )}

              {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 mb-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50">
                  {pendingAttachments.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-white dark:bg-slate-850 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 dark:text-slate-200 shadow-xs">
                      <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                      <span className="max-w-[120px] truncate font-medium">{file.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({file.size})</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveAttachment(idx)}
                        className="text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-0.5 rounded-md transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSend} className="flex gap-2">
                <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 p-3 rounded-xl transition shadow-xs flex items-center justify-center cursor-pointer"
                  title="Attach Files"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder={
                    isAiRecipient
                      ? "Ask NPCI Assistant grounded compliance questions..."
                      : "Type a secure encrypted direct message..."
                  }
                  value={msgInput}
                  onChange={handleInputChange}
                  onBlur={() => onSendTyping(false)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                />
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 p-3 rounded-xl transition shadow flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Bot className="w-16 h-16 text-slate-300 mb-2 animate-pulse" />
            <p className="font-medium text-slate-600">No active conversation</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs text-center leading-relaxed">
              Select a coworker or the NPCI Assistant from the list to begin private real-time chats.
            </p>
          </div>
        )}
      </div>

      {/* RIGHT PRODUCT KNOWLEDGE BASE SLIDEOUT PANEL (FR-8) */}
      {showProductAiPanel && (
        <>
          {/* Mobile backdrop overlay for Product Helper */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
            onClick={() => setShowProductAiPanel(false)}
          />
          
          <div className="fixed md:static inset-y-0 right-0 z-50 md:z-auto w-80 max-w-[85vw] md:max-w-none bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full animate-in slide-in-from-right-4 duration-200 shadow-2xl md:shadow-none">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="font-bold text-xs uppercase tracking-wider font-mono">Product AI Copilot</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded font-mono">API Spec</span>
                <button
                  type="button"
                  onClick={() => setShowProductAiPanel(false)}
                  className="md:hidden text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
                  title="Close Copilot panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl text-left">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                  <span>Ask general payment questions</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Consult on technical stacks, API setups, or integration guidelines for IMPS, NETC FASTag, BBPS, UPI Lite, or RuPay card tokenization.
                </p>
              </div>

              <form onSubmit={handleAskProduct} className="space-y-2">
                <input
                  type="text"
                  placeholder="e.g. How does UPI Lite offline process?"
                  value={productQuestion}
                  onChange={(e) => setProductQuestion(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isAskingProductAi}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  {isAskingProductAi ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Searching Knowledge Base...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-cyan-300 dark:text-cyan-600" />
                      <span>Query Product AI</span>
                    </>
                  )}
                </button>
              </form>

              {productAnswer && (
                <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-left space-y-2 border border-slate-800 shadow-inner font-mono text-[11px] leading-relaxed max-h-[300px] overflow-y-auto">
                  <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5 text-cyan-400">
                    <Terminal className="w-3 h-3" />
                    <span>Technical Output</span>
                  </div>
                  <div className="whitespace-pre-wrap">{productAnswer}</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
