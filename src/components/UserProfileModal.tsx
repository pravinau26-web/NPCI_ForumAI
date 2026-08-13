import React, { useState } from "react";
import { X, Star, MessageSquare, Shield, FileText, Send, Calendar, MapPin, Briefcase, Award, Sparkles } from "lucide-react";
import { User, Thread, Comment, PolicyDocument } from "../types";

interface UserProfileModalProps {
  user: User;
  currentUser: User;
  onClose: () => void;
  threads: Thread[];
  comments: Comment[];
  policies: PolicyDocument[];
  isFavorite: boolean;
  onToggleFavorite: (userId: string) => void;
  onSelectUserChat: (user: User) => void;
  onViewThread: (threadId: string, communityId: string) => void;
}

export default function UserProfileModal({
  user,
  currentUser,
  onClose,
  threads,
  comments,
  policies,
  isFavorite,
  onToggleFavorite,
  onSelectUserChat,
  onViewThread,
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "topics" | "replies" | "policies">("profile");

  const userThreads = threads.filter(t => t.authorId === user.id);
  const userComments = comments.filter(c => c.authorId === user.id);
  const userPolicies = policies.filter(p => p.uploadedBy === user.id);

  const isSelf = user.id === currentUser.id;

  const handleStartDM = () => {
    onSelectUserChat(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[9999] p-0 md:p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-50 dark:bg-slate-950 w-full max-w-4xl md:rounded-3xl border-0 md:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row h-full md:h-[80vh] max-h-screen md:max-h-[720px] animate-in zoom-in-95 duration-150">
        
        {/* LEFT COLUMN: VISUAL IDENTITY CARD */}
        <div className="md:w-72 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center overflow-y-auto scrollbar-none h-auto md:h-full shrink-0">
          <div className="w-full space-y-5 flex-1 flex flex-col items-center">
            <div className="flex justify-between items-center w-full md:hidden">
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2 py-0.5 rounded font-mono">
                COWORKER CARD
              </span>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AVATAR WRAPPER */}
            <div className="relative group mx-auto w-24 h-24 md:w-36 md:h-36 shrink-0">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-800 shadow-lg"
                referrerPolicy="no-referrer"
              />
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                  user.status === "online" 
                    ? "bg-emerald-500" 
                    : user.status === "away" 
                    ? "bg-amber-500" 
                    : "bg-slate-400"
                }`}
              />
            </div>

            {/* TEXT INFO */}
            <div className="space-y-1.5 w-full flex flex-col items-center">
              <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                <span>{user.username}</span>
                {user.id === "npci_assistant" && (
                  <span className="flex items-center gap-0.5 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>AI</span>
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate w-full">{user.email}</p>
              
              {/* Security Confirmation Status Badge */}
              <div className="flex items-center justify-center gap-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 font-mono shadow-xs">
                <span>🛡️</span>
                <span>CONFIRMED SECURE MEMBER</span>
              </div>

              {user.department && (
                <p className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider inline-block">
                  {user.department}
                </p>
              )}
            </div>

            {/* TAB SELECTIONS */}
            <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none w-full shrink-0">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 md:w-full text-left text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 min-w-[120px] md:min-w-0 ${
                  activeTab === "profile"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Biography & Info</span>
              </button>
              <button
                onClick={() => setActiveTab("topics")}
                className={`flex-1 md:w-full text-left text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 min-w-[125px] md:min-w-0 ${
                  activeTab === "topics"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Forums Started ({userThreads.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("replies")}
                className={`flex-1 md:w-full text-left text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 min-w-[125px] md:min-w-0 ${
                  activeTab === "replies"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Replies Created ({userComments.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("policies")}
                className={`flex-1 md:w-full text-left text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 min-w-[125px] md:min-w-0 ${
                  activeTab === "policies"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Specs & Complaints ({userPolicies.length})</span>
              </button>
            </div>
          </div>

          {/* DM & FAVORITE ACTIONS */}
          <div className="w-full pt-4 border-t border-slate-150 dark:border-slate-800 mt-4 space-y-2 shrink-0">
            {!isSelf && (
              <div className="flex flex-row md:flex-col gap-2">
                <button
                  onClick={handleStartDM}
                  className="flex-1 md:w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Direct Message</span>
                </button>
                <button
                  onClick={() => onToggleFavorite(user.id)}
                  className={`flex-1 md:w-full py-2 border text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                    isFavorite
                      ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white"
                      : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300"
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isFavorite ? "fill-white text-white" : "text-amber-500 fill-none"}`} />
                  <span>{isFavorite ? "Favorite" : "Add Fav"}</span>
                </button>
              </div>
            )}
            {isSelf && (
              <p className="text-[10px] text-slate-400 font-semibold font-mono">
                🔒 THIS IS YOUR WORKSPACE CARD
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL WORKSPACE */}
        <div className="flex-1 overflow-hidden flex flex-col h-[50vh] md:h-full bg-slate-50 dark:bg-slate-950">
          {/* HEADER (DESKTOP ONLY) */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 hidden md:flex">
            <div>
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wider font-mono">
                Coworker Platform Card
              </h3>
            </div>
            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 hover:text-slate-700 dark:text-slate-400 p-1.5 rounded-full transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* TAB DETAILED CONTENTS */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            
            {/* TAB: PROFILE / BIO */}
            {activeTab === "profile" && (
              <div className="space-y-6 text-left animate-in fade-in duration-150">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Personal Summary</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans font-medium">
                    {user.bio || `Administrative payment professional under the NPCI workspace, supporting high-throughput transaction verification, instant settlements, and regulatory audits.`}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-950 p-2.5 rounded-xl text-blue-500">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Role Classification</p>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 capitalize">
                        {user.role === "platform_admin" 
                          ? "Workspace Architect" 
                          : user.role === "policy_admin" 
                          ? "Compliance Officer" 
                          : user.role === "lead" 
                          ? "Team Lead" 
                          : "Associate Delegate"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-950 p-2.5 rounded-xl text-emerald-500">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Platform Tenure</p>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        {user.id === "user-1" ? "8 months active" : user.id === "user-2" ? "1 year active" : "6 months active"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* MOBILE DM & FAVORITE ACTIONS */}
                <div className="md:hidden space-y-2 border-t border-slate-200 pt-4 mt-2">
                  {!isSelf && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleStartDM}
                        className="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Direct Message</span>
                      </button>
                      <button
                        onClick={() => onToggleFavorite(user.id)}
                        className={`w-full py-3 border text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                          isFavorite
                            ? "bg-amber-500 border-amber-500 text-white animate-pulse"
                            : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300"
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFavorite ? "fill-white text-white" : "text-amber-500 fill-none"}`} />
                        <span>{isFavorite ? "Favorite" : "Add Fav"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: TOPICS STARTED */}
            {activeTab === "topics" && (
              <div className="space-y-4 text-left animate-in fade-in duration-150">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-100 dark:border-slate-900 pb-2">
                  Forum Topics Started by @{user.username}
                </h4>
                <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-2">
                  {userThreads.length === 0 ? (
                    <p className="text-xs text-slate-405 dark:text-slate-500 italic py-6 text-center">
                      No public discussions posted by this user yet.
                    </p>
                  ) : (
                    userThreads.map(t => (
                      <div
                        key={t.id}
                        onClick={() => onViewThread(t.id, t.communityId)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 p-4 rounded-2xl cursor-pointer transition shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                              Spec Thread
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono font-bold">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h5 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm leading-snug">{t.title}</h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {t.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-50 dark:border-slate-850">
                          {t.tags.map((tag, idx) => (
                            <span key={idx} className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-bold">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: REPLIES CREATED */}
            {activeTab === "replies" && (
              <div className="space-y-4 text-left animate-in fade-in duration-150">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-100 dark:border-slate-900 pb-2">
                  Replies Created by @{user.username}
                </h4>
                <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-2">
                  {userComments.length === 0 ? (
                    <p className="text-xs text-slate-405 dark:text-slate-500 italic py-6 text-center">
                      No forum replies posted by this user yet.
                    </p>
                  ) : (
                    userComments.map(c => {
                      const parentThread = threads.find(t => t.id === c.threadId);
                      return (
                        <div
                          key={c.id}
                          onClick={() => parentThread && onViewThread(c.threadId, parentThread.communityId)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 p-4 rounded-2xl cursor-pointer transition shadow-xs space-y-2.5"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="text-left leading-snug">
                              <p className="text-[10px] font-bold text-slate-405 dark:text-slate-500 font-mono">REPLYING TO TOPIC:</p>
                              <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 truncate max-w-[280px] sm:max-w-[450px]">
                                {parentThread ? parentThread.title : "Discussion Thread"}
                              </p>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono flex-shrink-0 font-bold">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-850/40 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed font-sans">
                            {c.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB: COMPLIANCE SPECS */}
            {activeTab === "policies" && (
              <div className="space-y-4 text-left animate-in fade-in duration-150">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-100 dark:border-slate-900 pb-2">
                  Compliance Documents & Specifications Uploaded
                </h4>
                <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-2">
                  {userPolicies.length === 0 ? (
                    <p className="text-xs text-slate-405 dark:text-slate-500 italic py-6 text-center">
                      No compliance documents uploaded by this user yet.
                    </p>
                  ) : (
                    userPolicies.map(p => (
                      <div
                        key={p.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex justify-between items-center"
                      >
                        <div className="text-left space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-850 font-mono">
                              ACTIVE SPEC
                            </span>
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold px-1.5 py-0.5 rounded">
                              Ver: {p.version}
                            </span>
                          </div>
                          <h5 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm leading-snug">{p.title}</h5>
                          <p className="text-xs text-slate-505 dark:text-slate-450 truncate max-w-[350px]">{p.description}</p>
                          <p className="text-[10px] text-slate-400 font-mono">File: {p.fileName}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">
                          {new Date(p.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
          </div>
        </div>
        
      </div>
    </div>
  );
}
