import React, { useState, useRef } from "react";
import { 
  ArrowLeft, Pin, ThumbsUp, MessageSquare, Tag, Paperclip, Send, 
  Sparkles, Check, Trash2, Bot, AlertTriangle, X
} from "lucide-react";
import { Thread, Comment, User, Community, Attachment, PolicyDocument } from "../types";
import MentionText from "./MentionText";

interface ThreadViewProps {
  community: Community;
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (id: string | null) => void;
  comments: Comment[];
  currentUser: User;
  users: User[];
  onAddThread: (title: string, content: string, tags?: string[], attachments?: Attachment[]) => Promise<any>;
  onAddComment: (content: string, parentId?: string, attachments?: Attachment[]) => void;
  onUpvoteThread: (id: string) => void;
  onUpvoteComment: (id: string) => void;
  onPinThread: (id: string, isPinned: boolean) => void;
  onDeleteThread: (id: string) => void;
  policies?: PolicyDocument[];
  onViewProfile?: (user: User) => void;
  onPreviewAttachment?: (attachment: Attachment) => void;
}

export default function ThreadView({
  community,
  threads,
  activeThreadId,
  onSelectThread,
  comments,
  currentUser,
  users,
  onAddThread,
  onAddComment,
  onUpvoteThread,
  onUpvoteComment,
  onPinThread,
  onDeleteThread,
  policies = [],
  onViewProfile,
  onPreviewAttachment,
}: ThreadViewProps) {
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [isSubmittingThread, setIsSubmittingThread] = useState(false);
  
  const [commentAttachments, setCommentAttachments] = useState<Attachment[]>([]);
  const [isDraggingComment, setIsDraggingComment] = useState(false);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const threadFileInputRef = useRef<HTMLInputElement>(null);

  const [quickTopicInput, setQuickTopicInput] = useState("");
  const handleQuickTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTopicInput.trim() || !community || !currentUser) return;
    
    // Auto-generate title from the first sentence or 50 chars
    let title = quickTopicInput.split(".")[0];
    if (title.length > 50) title = title.substring(0, 50) + "...";
    
    await onAddThread(title, quickTopicInput, [], []);
    setQuickTopicInput("");
  };

  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<"profile" | "topics" | "replies" | "policies">("profile");

  const activeThread = threads.find((t) => t.id === activeThreadId);

  // Filter and sort: Pinned threads first, then sorted by newest
  const filteredThreads = [...threads].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const processFiles = (files: File[]): Promise<Attachment[]> => {
    return Promise.all(
      files.map((file) => {
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
      })
    );
  };

  const handleThreadFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = await processFiles(Array.from(e.target.files));
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const handleCommentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = await processFiles(Array.from(e.target.files));
    setCommentAttachments((prev) => [...prev, ...newFiles]);
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    
    setIsSubmittingThread(true);
    try {
      await onAddThread(
        newTitle.trim(), 
        newContent.trim(), 
        customTags.length > 0 ? customTags : undefined,
        attachments.length > 0 ? attachments : undefined
      );
      setNewTitle("");
      setNewContent("");
      setAttachments([]);
      setCustomTags([]);
      setTagInput("");
      setShowNewThreadForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingThread(false);
    }
  };

  const handleGenerateTags = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      alert("Please enter a Title and description content first to generate relevant tags.");
      return;
    }
    setIsGeneratingTags(true);
    try {
      const res = await fetch("/api/ai/generate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), content: newContent.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tags && Array.isArray(data.tags)) {
          setCustomTags(data.tags);
        }
      } else {
        console.error("Failed to generate tags");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() && commentAttachments.length === 0) return;
    onAddComment(
      commentInput.trim() || `Sent ${commentAttachments.length} file(s)`, 
      replyToCommentId || undefined,
      commentAttachments.length > 0 ? commentAttachments : undefined
    );
    setCommentInput("");
    setCommentAttachments([]);
    setReplyToCommentId(null);
  };

  const getUserDetails = (userId: string) => {
    return users.find((u) => u.id === userId) || {
      username: "Former Employee",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      role: "employee",
      department: "NPCI Operations",
    };
  };

  // Determine administrative pin permissions
  const canPin = currentUser.role === "lead" || currentUser.role === "platform_admin";

  return (
    <div className="flex-1 bg-slate-50 flex flex-col h-[calc(100vh-4rem)]">
      {/* 1. SINGLE THREAD DETAIL VIEW */}
      {activeThread ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Back Panel */}
          <div className="bg-white dark:bg-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
            <button
              onClick={() => onSelectThread(null)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to #{community.name}</span>
            </button>

            {canPin && (
              <button
                onClick={() => onPinThread(activeThread.id, !activeThread.isPinned)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeThread.isPinned
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${activeThread.isPinned ? "fill-amber-600" : ""}`} />
                <span>{activeThread.isPinned ? "Pinned Thread" : "Pin Thread"}</span>
              </button>
            )}

            { (currentUser.id === activeThread.authorId || currentUser.role === "platform_admin") && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this discussion thread? All replies and upvotes will be permanently deleted, and all contributors will be notified.")) {
                    onDeleteThread(activeThread.id);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Discussion</span>
              </button>
            )}
          </div>

          {/* Thread Content & Comments Layout */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Thread Original Post Card */}
            <div className="bg-white dark:bg-slate-900 dark:text-slate-100 rounded-2xl shadow-sm border border-slate-150 dark:border-slate-800 p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <img
                    src={getUserDetails(activeThread.authorId).avatar}
                    alt={getUserDetails(activeThread.authorId).username}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 cursor-pointer hover:brightness-95 transition-all"
                    referrerPolicy="no-referrer"
                    onClick={() => setSelectedProfileUser(getUserDetails(activeThread.authorId))}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-bold text-slate-800 text-sm cursor-pointer hover:underline hover:text-blue-600 transition-all"
                        onClick={() => setSelectedProfileUser(getUserDetails(activeThread.authorId))}
                      >
                        {getUserDetails(activeThread.authorId).username}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono uppercase">
                        {getUserDetails(activeThread.authorId).role.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {getUserDetails(activeThread.authorId).department} • {new Date(activeThread.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onUpvoteThread(activeThread.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeThread.upvotes.includes(currentUser.id)
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{activeThread.upvotes.length}</span>
                </button>
              </div>

              <div className="space-y-3">
                <h2 className="font-bold text-lg text-slate-900 leading-snug">{activeThread.title}</h2>
                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  <MentionText text={activeThread.content} users={users} onViewProfile={onViewProfile} />
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {activeThread.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs px-2.5 py-1 rounded-full border border-slate-200/50 transition cursor-pointer"
                  >
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>

              {/* Original Attachments */}
              {activeThread.attachments && activeThread.attachments.length > 0 && (
                <div className="border-t border-slate-100 pt-4 mt-2">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Attached Documents</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeThread.attachments.map((file, i) => (
                      <div
                        key={i}
                        onClick={() => onPreviewAttachment && onPreviewAttachment(file)}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-250/60 hover:bg-blue-50/50 hover:border-blue-400/50 transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <div className="truncate text-left">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-600 transition-colors">{file.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono capitalize">{file.type.split("/")[1] || "File"} • {file.size} • Click to Preview</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold shrink-0">Preview</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comment Threading Area */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Discussion Thread ({comments.length} replies)</span>
              </h3>

              {comments.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 dark:text-slate-100 rounded-2xl p-8 text-center text-slate-400 border border-slate-150 dark:border-slate-800/60 text-sm">
                  No replies yet. Be the first to add a comment!
                </div>
              ) : (
                <div className="space-y-3">
                  {comments
                    .filter((c) => !c.parentId) // Top-level comments first
                    .map((comment) => {
                      const replies = comments.filter((r) => r.parentId === comment.id);
                      const isAi = comment.authorId === "npci_assistant";

                      return (
                        <div key={comment.id} className="space-y-2">
                          {/* Parent Comment Card */}
                          <div className={`p-5 rounded-2xl shadow-sm border text-left space-y-3 ${
                            isAi 
                              ? "bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-blue-200" 
                              : "bg-white dark:bg-slate-900 dark:text-slate-100 border-slate-150 dark:border-slate-800"
                          }`}>
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={getUserDetails(comment.authorId).avatar}
                                  alt={getUserDetails(comment.authorId).username}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 cursor-pointer hover:brightness-95 transition-all"
                                  referrerPolicy="no-referrer"
                                  onClick={() => setSelectedProfileUser(getUserDetails(comment.authorId))}
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span 
                                      className="font-bold text-slate-800 text-xs cursor-pointer hover:underline hover:text-blue-600 transition-all"
                                      onClick={() => setSelectedProfileUser(getUserDetails(comment.authorId))}
                                    >
                                      {getUserDetails(comment.authorId).username}
                                    </span>
                                    {isAi && (
                                      <span className="flex items-center gap-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full font-mono shadow">
                                        <Bot className="w-2.5 h-2.5" />
                                        <span>ASSISTANT</span>
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    {getUserDetails(comment.authorId).department} • {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => onUpvoteComment(comment.id)}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                                    comment.upvotes.includes(currentUser.id)
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-slate-50 hover:bg-slate-100 text-slate-400"
                                  }`}
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                  <span>{comment.upvotes.length}</span>
                                </button>

                                {!isAi && (
                                  <button
                                    onClick={() => setReplyToCommentId(comment.id)}
                                    className="text-[11px] text-slate-500 hover:text-blue-600 font-semibold px-2 py-1 hover:bg-slate-100 rounded-lg transition"
                                  >
                                    Reply
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed font-sans pl-10">
                              <div><MentionText text={comment.content} users={users} onViewProfile={onViewProfile} /></div>
                              {comment.attachments && comment.attachments.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-slate-100 space-y-2 max-w-sm">
                                  {comment.attachments.map((file, idx) => {
                                    const isImage = file.type.startsWith("image/");
                                    return (
                                      <div key={idx} className="rounded-lg overflow-hidden border border-slate-200">
                                        {isImage ? (
                                          <div className="bg-slate-50 flex justify-center items-center">
                                            <img
                                              src={file.url}
                                              alt={file.name}
                                              className="object-contain max-h-40 w-full cursor-pointer hover:opacity-95 transition"
                                              onClick={() => {
                                                const w = window.open();
                                                if (w) w.document.write(`<img src="${file.url}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                                              }}
                                            />
                                          </div>
                                        ) : (
                                          <a
                                            href={file.url}
                                            download={file.name}
                                            className="flex items-center gap-2 p-2.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 transition truncate"
                                          >
                                            <Paperclip className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                            <div className="truncate text-left flex-1 min-w-0">
                                              <p className="font-semibold truncate leading-tight">{file.name}</p>
                                              <p className="text-[10px] opacity-75 mt-0.5 font-mono">{file.size}</p>
                                            </div>
                                          </a>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Nested Replies */}
                          {replies.map((reply) => {
                            const isReplyAi = reply.authorId === "npci_assistant";
                            return (
                              <div
                                key={reply.id}
                                className={`ml-10 p-4 rounded-xl border shadow-sm text-left space-y-2.5 ${
                                  isReplyAi 
                                    ? "bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-blue-200" 
                                    : "bg-white dark:bg-slate-900 dark:text-slate-100 border-slate-150 dark:border-slate-800"
                                }`}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={getUserDetails(reply.authorId).avatar}
                                      alt={getUserDetails(reply.authorId).username}
                                      className="w-7 h-7 rounded-full object-cover border border-slate-200 cursor-pointer hover:brightness-95 transition-all"
                                      referrerPolicy="no-referrer"
                                      onClick={() => setSelectedProfileUser(getUserDetails(reply.authorId))}
                                    />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span 
                                          className="font-bold text-slate-800 text-xs cursor-pointer hover:underline hover:text-blue-600 transition-all"
                                          onClick={() => setSelectedProfileUser(getUserDetails(reply.authorId))}
                                        >
                                          {getUserDetails(reply.authorId).username}
                                        </span>
                                        {isReplyAi && (
                                          <span className="flex items-center gap-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full font-mono shadow animate-pulse">
                                            <Bot className="w-2.5 h-2.5" />
                                            <span>ASSISTANT</span>
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[9px] text-slate-400 font-medium">
                                        {getUserDetails(reply.authorId).department} • {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => onUpvoteComment(reply.id)}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                                      reply.upvotes.includes(currentUser.id)
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-slate-50 hover:bg-slate-100 text-slate-400"
                                    }`}
                                  >
                                    <ThumbsUp className="w-2.5 h-2.5" />
                                    <span>{reply.upvotes.length}</span>
                                  </button>
                                </div>

                                <div className="text-slate-600 text-xs whitespace-pre-wrap leading-relaxed font-sans pl-9">
                                  <div><MentionText text={reply.content} users={users} onViewProfile={onViewProfile} /></div>
                                  {reply.attachments && reply.attachments.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-2 max-w-sm">
                                      {reply.attachments.map((file, idx) => {
                                        const isImage = file.type.startsWith("image/");
                                        return (
                                          <div key={idx} className="rounded-lg overflow-hidden border border-slate-200">
                                            {isImage ? (
                                              <div className="bg-slate-50 flex justify-center items-center">
                                                <img
                                                  src={file.url}
                                                  alt={file.name}
                                                  className="object-contain max-h-32 w-full cursor-pointer hover:opacity-95 transition"
                                                  onClick={() => {
                                                    const w = window.open();
                                                    if (w) w.document.write(`<img src="${file.url}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                                                  }}
                                                />
                                              </div>
                                            ) : (
                                              <a
                                                href={file.url}
                                                download={file.name}
                                                className="flex items-center gap-2 p-2 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 transition truncate"
                                              >
                                                <Paperclip className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                                <div className="truncate text-left flex-1 min-w-0">
                                                  <p className="font-semibold truncate leading-tight text-[11px]">{file.name}</p>
                                                  <p className="text-[9px] opacity-75 mt-0.5 font-mono">{file.size}</p>
                                                </div>
                                              </a>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Comment Composer Input Footer */}
          <div className="bg-white dark:bg-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-800 p-4">
            {replyToCommentId && (
              <div className="mb-2 bg-slate-50 px-3 py-1.5 rounded-lg text-xs flex justify-between items-center text-slate-500 border border-slate-150">
                <span>Replying to comment thread...</span>
                <button
                  onClick={() => setReplyToCommentId(null)}
                  className="text-rose-500 hover:text-rose-600 font-semibold uppercase font-mono text-[10px]"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* AI Grounding Tip Alert */}
            <div className="mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-2.5 flex items-center justify-between border border-blue-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 animate-bounce" />
                <p className="text-xs text-blue-800 leading-tight">
                  <strong>Compliance Tip:</strong> Mention <strong className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold text-[11px]">@NPCI Assistant</strong> inside your reply to trigger immediate policy verification grounding!
                </p>
              </div>
              <span className="text-[10px] bg-blue-500/10 text-blue-700 font-bold px-2 py-0.5 rounded-full font-mono uppercase">RAG Ready</span>
            </div>

            {commentAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 mb-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50">
                {commentAttachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-white dark:bg-slate-850 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 dark:text-slate-200 shadow-xs">
                    <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                    <span className="max-w-[120px] truncate font-medium">{file.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({file.size})</span>
                    <button 
                      type="button" 
                      onClick={() => setCommentAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-0.5 rounded-md transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input 
                type="file" 
                multiple 
                ref={commentFileInputRef} 
                onChange={handleCommentFileChange} 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => commentFileInputRef.current?.click()}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 p-3 rounded-xl transition shadow-xs flex items-center justify-center cursor-pointer"
                title="Attach Files"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="text"
                placeholder={replyToCommentId ? "Add a threaded reply..." : "Add a public reply... Use @NPCI Assistant for compliance lookup."}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 bg-slate-50 text-slate-800 px-4 py-2.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl transition shadow flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* 2. CHANNELS/COMMUNITIES FEED LISTING */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Panel */}
          <div className="bg-white dark:bg-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 px-6 py-5 flex justify-between items-center shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-lg leading-none">#{community.name}</h1>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full font-mono">
                  {community.isPrivate ? "Restricted" : "Public Org"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">{community.description}</p>
            </div>

            <button
              onClick={() => setShowNewThreadForm(!showNewThreadForm)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Start New Discussion</span>
            </button>
          </div>

          {/* New Discussion Composer Form Drawer */}
          {showNewThreadForm && (
            <div className="bg-white dark:bg-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 p-6 shadow-inner space-y-4 animate-in slide-in-from-top-4 duration-200 overflow-y-auto max-h-[75vh] md:max-h-[60vh] shrink-0">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>Compose AI-Tagged Discussion</span>
              </h3>

              <form onSubmit={handleCreateThread} className="space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Title of your technical discussion... e.g., Host failing UPI response latency"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 px-4 py-2.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                <textarea
                  required
                  placeholder="Describe your technical question, compliance concern, or idea. Code snippets or attachment details are supported..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 px-4 py-3 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-32 resize-none"
                />

                {/* Interactive Tags Section */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Discussion Tags</span>
                    </div>
                    
                    <button
                      type="button"
                      disabled={isGeneratingTags}
                      onClick={handleGenerateTags}
                      className="bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {isGeneratingTags ? (
                        <>
                          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                          <span>Auto-Generate Tags</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Active Tags Display */}
                  <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-white dark:bg-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-800">
                    {customTags.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No tags selected. Click "Auto-Generate Tags" or add manually below.</span>
                    ) : (
                      customTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-full border border-slate-250 transition"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => setCustomTags(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-slate-600 font-bold focus:outline-none"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Manual Tag Insertion */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add custom tag (e.g. Compliance)..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (tagInput.trim() && !customTags.includes(tagInput.trim())) {
                            setCustomTags(prev => [...prev, tagInput.trim()]);
                            setTagInput("");
                          }
                        }
                      }}
                      className="flex-1 bg-white dark:bg-slate-900 dark:text-slate-100 text-slate-800 px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tagInput.trim() && !customTags.includes(tagInput.trim())) {
                          setCustomTags(prev => [...prev, tagInput.trim()]);
                          setTagInput("");
                        }
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Document & Image Attachments</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => threadFileInputRef.current?.click()}
                      className="bg-white dark:bg-slate-900 dark:text-slate-100 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                      <span>Browse Files</span>
                    </button>
                    <input
                      type="file"
                      multiple
                      ref={threadFileInputRef}
                      onChange={handleThreadFileChange}
                      className="hidden"
                    />
                  </div>

                  {attachments.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {attachments.map((file, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1.5 bg-white dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 shadow-xs"
                        >
                          <Paperclip className="w-3 h-3 text-blue-500" />
                          <span className="truncate max-w-[150px] font-semibold">{file.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({file.size})</span>
                          <button
                            type="button"
                            onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                            className="text-rose-500 hover:text-rose-600 font-bold ml-1 hover:bg-rose-50 p-0.5 rounded transition cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-400 cursor-pointer hover:bg-slate-100/50 transition"
                      onClick={() => threadFileInputRef.current?.click()}
                    >
                      <p className="text-xs">Drag and drop files here, or click to browse</p>
                      <p className="text-[10px] text-slate-300 mt-1">Upload technical drawings, PDF compliance specs, or transaction snapshots</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewThreadForm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium hover:bg-slate-100 text-slate-500 cursor-pointer"
                  >
                    Discard Draft
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingThread}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingThread ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating AI Tags...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Publish Topic</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Threads Listing Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {filteredThreads.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 dark:text-slate-100 rounded-2xl p-12 text-center text-slate-400 border border-slate-150 dark:border-slate-800/65 text-sm flex flex-col items-center gap-4 justify-center">
                <p>No discussions in #{community.name} yet. Be the first to start a topic!</p>
                <button
                  type="button"
                  onClick={() => setShowNewThreadForm(true)}
                  className="bg-blue-600 hover:bg-blue-755 text-white text-xs font-extrabold px-4.5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                >
                  Start First Topic
                </button>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => onSelectThread(thread.id)}
                  className={`bg-white dark:bg-slate-900 dark:text-slate-100 hover:bg-slate-50 rounded-2xl p-5 border border-slate-150 dark:border-slate-800 shadow-sm transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col gap-4 text-left ${
                    thread.isPinned ? "border-l-4 border-l-amber-400 bg-amber-50/5" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={getUserDetails(thread.authorId).avatar}
                        alt={getUserDetails(thread.authorId).username}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 cursor-pointer hover:brightness-95 transition-all"
                        referrerPolicy="no-referrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProfileUser(getUserDetails(thread.authorId));
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="font-bold text-xs text-slate-700 cursor-pointer hover:underline hover:text-blue-600 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProfileUser(getUserDetails(thread.authorId));
                            }}
                          >
                            {getUserDetails(thread.authorId).username}
                          </span>
                          <span className="text-[9px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                            {getUserDetails(thread.authorId).department}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(thread.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {thread.isPinned && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-0.5">
                          <Pin className="w-2.5 h-2.5 fill-amber-700" />
                          <span>Pinned</span>
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpvoteThread(thread.id);
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          thread.upvotes.includes(currentUser.id)
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{thread.upvotes.length}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-800 text-sm leading-snug hover:text-blue-600 transition">
                      {thread.title}
                    </h3>
                    <p className="text-xs text-slate-400 truncate leading-relaxed">
                      {thread.content}
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-50 pt-3.5 mt-1.5">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {thread.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200/40"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <span className="text-slate-400 text-xs flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
                      <span className="font-semibold text-[11px] font-mono">
                        {comments.filter((c) => c.threadId === thread.id).length} replies
                      </span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Quick Topic Composer */}
          <div className="bg-white dark:bg-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-800 p-4 shrink-0">
            <form onSubmit={handleQuickTopicSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder={`Start a quick topic in #${community.name}...`}
                value={quickTopicInput}
                onChange={(e) => setQuickTopicInput(e.target.value)}
                className="flex-1 bg-slate-50 text-slate-800 px-4 py-2.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button
                type="submit"
                disabled={!quickTopicInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-4 rounded-xl shadow-xs transition cursor-pointer"
              >
                Post Topic
              </button>
            </form>
          </div>
        </div>
      )}

      {/* User Profile Modal replicating the Docly style */}
      {selectedProfileUser && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedProfileUser(null)}
        >
          <div 
            className="bg-[#f8fafc] max-w-4xl w-full rounded-2xl border border-slate-200 shadow-2xl p-6 md:p-8 relative flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedProfileUser(null)}
              className="absolute top-4 right-4 bg-white dark:bg-slate-900 dark:text-slate-100 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 p-2 rounded-full shadow-xs transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Card: Avatar + Sidebar Tabs */}
            <div className="bg-white dark:bg-slate-900 dark:text-slate-100 rounded-2xl border border-slate-150 dark:border-slate-800 p-5 shadow-sm w-full md:w-[240px] flex flex-col gap-5 flex-shrink-0">
              <img 
                src={selectedProfileUser.avatar} 
                alt={selectedProfileUser.username}
                className="w-full aspect-square rounded-xl object-cover border border-slate-150 shadow-inner"
                referrerPolicy="no-referrer"
              />
              
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setActiveProfileTab("profile")}
                  className={`w-full text-left text-xs font-bold px-4 py-3 rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                    activeProfileTab === "profile"
                      ? "bg-[#008060] text-white"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-150"
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveProfileTab("topics")}
                  className={`w-full text-left text-xs font-bold px-4 py-3 rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                    activeProfileTab === "topics"
                      ? "bg-[#008060] text-white"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-150"
                  }`}
                >
                  Topics Started ({threads.filter(t => t.authorId === selectedProfileUser.id).length})
                </button>
                <button
                  onClick={() => setActiveProfileTab("replies")}
                  className={`w-full text-left text-xs font-bold px-4 py-3 rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                    activeProfileTab === "replies"
                      ? "bg-[#008060] text-white"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-150"
                  }`}
                >
                  Replies Created ({comments.filter(c => c.authorId === selectedProfileUser.id).length})
                </button>
                <button
                  onClick={() => setActiveProfileTab("policies")}
                  className={`w-full text-left text-xs font-bold px-4 py-3 rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                    activeProfileTab === "policies"
                      ? "bg-[#008060] text-white"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-150"
                  }`}
                >
                  Compliance Specs ({policies.filter(p => p.uploadedBy === selectedProfileUser.id).length})
                </button>
                <button
                  className="w-full text-left text-xs font-bold px-4 py-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 border border-slate-150 opacity-60 flex items-center gap-2 cursor-not-allowed"
                  disabled
                >
                  Favorites
                </button>
              </div>
            </div>

            {/* Right Card: Content Container */}
            <div className="bg-white dark:bg-slate-900 dark:text-slate-100 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 md:p-8 shadow-sm flex-1 flex flex-col justify-between min-h-[400px]">
              {activeProfileTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">@{selectedProfileUser.username}</h2>
                    <p className="text-lg font-bold text-slate-800 mt-2">Profile</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Registered: {selectedProfileUser.id === 'user-1' ? "8 months ago" : selectedProfileUser.id === 'user-2' ? "1 year, 3 months ago" : "1 year, 1 month ago"}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Forums</h3>
                    
                    <div className="mt-4 space-y-3.5">
                      <div className="flex items-center text-xs font-semibold text-slate-600">
                        <span className="w-36 text-slate-400 font-medium">Last Activity:</span>
                        <span>{selectedProfileUser.status === 'online' ? 'Active now' : '2 days ago'}</span>
                      </div>
                      <div className="flex items-center text-xs font-semibold text-slate-600">
                        <span className="w-36 text-slate-400 font-medium">Topics Started:</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-bold font-mono">
                          {threads.filter(t => t.authorId === selectedProfileUser.id).length}
                        </span>
                      </div>
                      <div className="flex items-center text-xs font-semibold text-slate-600">
                        <span className="w-36 text-slate-400 font-medium">Replies Created:</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-bold font-mono">
                          {comments.filter(c => c.authorId === selectedProfileUser.id).length}
                        </span>
                      </div>
                      <div className="flex items-center text-xs font-semibold text-slate-600">
                        <span className="w-36 text-slate-400 font-medium">Forum Role:</span>
                        <span className="text-emerald-700 font-bold">
                          {selectedProfileUser.role === 'platform_admin' ? 'Administrator' : selectedProfileUser.role === 'policy_admin' ? 'Moderator' : 'Delegate'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedProfileUser.bio && (
                    <div className="border-t border-slate-100 pt-5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Biography</h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-2 italic">
                        "{selectedProfileUser.bio}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeProfileTab === "topics" && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Topics Started</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {threads.filter(t => t.authorId === selectedProfileUser.id).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No public topics found in this workspace yet.</p>
                    ) : (
                      threads.filter(t => t.authorId === selectedProfileUser.id).map(t => (
                        <div 
                          key={t.id}
                          onClick={() => {
                            onSelectThread(t.id);
                            setSelectedProfileUser(null);
                          }}
                          className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer text-left"
                        >
                          <p className="text-xs font-bold text-slate-800 hover:text-blue-600 truncate">{t.title}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(t.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeProfileTab === "replies" && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Replies Created</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {comments.filter(c => c.authorId === selectedProfileUser.id).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No public replies found in this workspace yet.</p>
                    ) : (
                      comments.filter(c => c.authorId === selectedProfileUser.id).map(c => (
                        <div 
                          key={c.id}
                          onClick={() => {
                            onSelectThread(c.threadId);
                            setSelectedProfileUser(null);
                          }}
                          className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer text-left"
                        >
                          <p className="text-xs text-slate-700 font-medium line-clamp-2">"{c.content}"</p>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeProfileTab === "policies" && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Compliance & Specs</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {policies.filter(p => p.uploadedBy === selectedProfileUser.id).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No compliance specifications or complaints uploaded by this user yet.</p>
                    ) : (
                      policies.filter(p => p.uploadedBy === selectedProfileUser.id).map(p => (
                        <div 
                          key={p.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-bold text-slate-800">{p.title}</span>
                            {p.type === "complaint" ? (
                              <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded uppercase font-mono border border-rose-200">
                                Complaint
                              </span>
                            ) : (
                              <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded uppercase font-mono border border-blue-200">
                                Specification
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{p.description}</p>
                          <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                            <span>Version: {p.version}</span>
                            <span>{new Date(p.uploadedAt || Date.now()).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Secure Footer Branding */}
              <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-[10px] text-slate-400 mt-6">
                <span>NPCI Payment Ecosystem • Verified Profile</span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">ACTIVE DELEGATE</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
