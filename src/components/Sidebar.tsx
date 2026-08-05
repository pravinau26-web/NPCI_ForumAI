import React, { useState } from "react";
import { 
  FolderLock, MessageSquare, Plus, Users, ShieldAlert, FileText, 
  Settings, Bot, Radio, Lock, Circle, Layers, ChevronLeft, ChevronRight,
  Search, Star, X, CheckSquare, Square, UserPlus, ShieldCheck, Mail
} from "lucide-react";
import { Community, User, Chat, UserRole } from "../types";

interface SidebarProps {
  communities: Community[];
  activeCommunityId: string | null;
  onSelectCommunity: (id: string) => void;
  users: User[];
  currentUser: User;
  onSelectUserChat: (user: User) => void;
  activeView: "forum" | "chats" | "policy" | "admin" | "logs" | "hierarchy";
  onViewChange: (view: "forum" | "chats" | "policy" | "admin" | "logs" | "hierarchy") => void;
  onCreateCommunity: (name: string, description: string, isPrivate: boolean, allowedUserIds?: string[], allowedDepartments?: string[]) => void;
  sidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileSidebarOpen?: boolean;
  onCloseMobileSidebar?: () => void;
  
  // Custom enhanced props for profile, favorites and groups
  favorites?: string[];
  onToggleFavorite?: (userId: string) => void;
  onViewProfile?: (user: User) => void;
  chats?: Chat[];
  activeChatId?: string | null;
  onSelectChat?: (chatId: string) => void;
  onCreateGroupChat?: (name: string, participantIds: string[]) => void;
}

export default function Sidebar({
  communities,
  activeCommunityId,
  onSelectCommunity,
  users,
  currentUser,
  onSelectUserChat,
  activeView,
  onViewChange,
  onCreateCommunity,
  sidebarCollapsed = false,
  onToggleCollapse,
  mobileSidebarOpen = false,
  onCloseMobileSidebar,
  favorites = [],
  onToggleFavorite,
  onViewProfile,
  chats = [],
  activeChatId = null,
  onSelectChat,
  onCreateGroupChat,
}: SidebarProps) {
  // Local state managers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommName, setNewCommName] = useState("");
  const [newCommDesc, setNewCommDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedAllowedUsers, setSelectedAllowedUsers] = useState<string[]>([]);
  const [selectedAllowedDepts, setSelectedAllowedDepts] = useState<string[]>([]);

  // Coworker search filtering
  const [coworkerSearch, setCoworkerSearch] = useState("");

  // Group creation modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");

  const handleSubmitCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName.trim()) return;
    onCreateCommunity(
      newCommName.trim(),
      newCommDesc.trim(),
      isPrivate,
      isPrivate ? selectedAllowedUsers : [],
      isPrivate ? selectedAllowedDepts : []
    );
    setNewCommName("");
    setNewCommDesc("");
    setIsPrivate(false);
    setSelectedAllowedUsers([]);
    setSelectedAllowedDepts([]);
    setShowCreateModal(false);
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedGroupMembers.length === 0) return;
    if (onCreateGroupChat) {
      onCreateGroupChat(groupName.trim(), selectedGroupMembers);
    }
    setGroupName("");
    setSelectedGroupMembers([]);
    setShowGroupModal(false);
  };

  const toggleSelectMember = (userId: string) => {
    setSelectedGroupMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

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

  const allowedToAdmin = currentUser.role === "platform_admin";
  const allowedToCompliance = currentUser.role === "policy_admin" || currentUser.role === "platform_admin";
  const allowedToHierarchy = currentUser.role === "lead" || currentUser.role === "platform_admin";

  // Helper to find the last message time with a coworker
  const getLastMessageTime = (userId: string): number => {
    const directChat = chats?.find(c => 
      !c.isGroup && 
      c.participants.includes(currentUser.id) && 
      c.participants.includes(userId)
    );
    if (!directChat) return 0;
    
    const lastMsg = (directChat as any).lastMessage;
    if (lastMsg?.createdAt) {
      return new Date(lastMsg.createdAt).getTime();
    }
    
    return new Date(directChat.createdAt).getTime();
  };

  // Filter coworkers list based on name, email, or department
  const filteredUsers = users.filter((u) => {
    if (u.id === currentUser.id) return false;
    const q = coworkerSearch.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  // Sort filtered users so those with the most recent messages are at the top
  const sortedFilteredUsers = [...filteredUsers].sort((a, b) => {
    const timeA = getLastMessageTime(a.id);
    const timeB = getLastMessageTime(b.id);
    return timeB - timeA;
  });

  // Split filtered users into favorites and others
  const favoriteUsers = sortedFilteredUsers.filter(u => favorites && favorites.includes(u.id));
  const otherUsers = sortedFilteredUsers.filter(u => !favorites || !favorites.includes(u.id));

  // Filter groups current user participates in
  const myGroups = chats.filter(c => c.isGroup && c.participants.includes(currentUser.id));

  return (
    <>
      {/* Mobile Drawer Backdrop overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 md:hidden transition-opacity duration-300"
          onClick={onCloseMobileSidebar}
        />
      )}

      <aside 
        className={`fixed md:sticky top-16 md:top-0 left-0 z-40 md:z-auto bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex flex-col h-[calc(100vh-4rem)] select-none transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        } ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } md:flex`}
      >
        {/* Navigation Modules */}
        <div className="p-3 space-y-1.5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <button
            onClick={() => onViewChange("forum")}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            } ${
              activeView === "forum"
                ? "bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold border-l-4 border-blue-500"
                : "hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
            title="Forum Discussions"
          >
            <Users className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
            {!sidebarCollapsed && <span>Forum Discussions</span>}
          </button>

          <button
            onClick={() => onViewChange("chats")}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            } ${
              activeView === "chats"
                ? "bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold border-l-4 border-blue-500"
                : "hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
            title="Chats & DMs"
          >
            <MessageSquare className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
            {!sidebarCollapsed && <span>Chats & DMs</span>}
          </button>

          <button
            onClick={() => onViewChange("policy")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
              sidebarCollapsed ? "justify-center" : ""
            } ${
              activeView === "policy"
                ? "bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold border-l-4 border-blue-500"
                : "hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
            title="Compliance Portal"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              {!sidebarCollapsed && <span>Compliance Portal</span>}
            </div>
            {!sidebarCollapsed && allowedToCompliance && (
              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">Admin</span>
            )}
          </button>

          {allowedToHierarchy && (
            <button
              onClick={() => onViewChange("hierarchy")}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                sidebarCollapsed ? "justify-center" : "gap-3"
              } ${
                activeView === "hierarchy"
                  ? "bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold border-l-4 border-blue-500"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
              title="Technical Hierarchy"
            >
              <Layers className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              {!sidebarCollapsed && <span>Technical Hierarchy</span>}
            </button>
          )}

          {allowedToAdmin && (
            <button
              onClick={() => onViewChange("admin")}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                sidebarCollapsed ? "justify-center" : "gap-3"
              } ${
                activeView === "admin"
                  ? "bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold border-l-4 border-blue-500"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
              title="Platform Admin"
            >
              <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              {!sidebarCollapsed && <span>Platform Admin</span>}
            </button>
          )}
        </div>

        {/* Main Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-left">
          
          {/* Communities Section */}
          <div className="space-y-3">
              <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {!sidebarCollapsed ? (
                  <>
                    <span>Communities</span>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="hover:text-slate-850 dark:hover:text-white p-1 hover:bg-slate-200 dark:hover:bg-slate-850 rounded transition duration-150 cursor-pointer"
                      title="Create Community"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mx-auto p-1 hover:bg-slate-200 dark:hover:bg-slate-850 rounded text-slate-500 cursor-pointer"
                    title="Create Community"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {communities.map((comm) => {
                  const isMember = 
                    comm.memberIds?.includes(currentUser.id) || 
                    comm.createdBy === currentUser.id ||
                    currentUser.role === "platform_admin" ||
                    comm.allowedUserIds?.includes(currentUser.id) ||
                    (currentUser.department && comm.allowedDepartments?.includes(currentUser.department));
                  if (comm.isPrivate && !isMember) return null;

                  return (
                    <button
                      key={comm.id}
                      onClick={() => onSelectCommunity(comm.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-sm transition text-left ${
                        sidebarCollapsed ? "justify-center" : ""
                      } ${
                        activeCommunityId === comm.id
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                      title={comm.name}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-400 dark:text-slate-500 font-mono font-bold">#</span>
                        {!sidebarCollapsed && <span className="truncate">{comm.name}</span>}
                      </div>
                      
                      {!sidebarCollapsed && (
                        comm.isPrivate ? (
                          <span className="flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-bold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider font-mono border border-emerald-100 dark:border-emerald-900/30">
                            <Lock className="w-2 h-2" />
                            <span>Secured</span>
                          </span>
                        ) : (
                          <span className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono font-semibold">
                            Public
                          </span>
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          {/* TEAMS & GROUP CHATS SECTION */}
          <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {!sidebarCollapsed ? (
                <>
                  <span>Teams & Groups</span>
                  {onCreateGroupChat && (
                    <button
                      onClick={() => setShowGroupModal(true)}
                      className="hover:text-slate-850 dark:hover:text-white p-1 hover:bg-slate-200 dark:hover:bg-slate-850 rounded transition duration-150 cursor-pointer"
                      title="Create Teams Group"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => setShowGroupModal(true)}
                  className="mx-auto p-1 hover:bg-slate-200 dark:hover:bg-slate-850 rounded text-slate-500 cursor-pointer"
                  title="Create Teams Group"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-1">
              {myGroups.length === 0 ? (
                !sidebarCollapsed && (
                  <p className="text-[10px] text-slate-400 italic px-2">No active groups. Create one above!</p>
                )
              ) : (
                myGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => onSelectChat && onSelectChat(group.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-sm transition text-left ${
                      sidebarCollapsed ? "justify-center" : "gap-2"
                    } ${
                      activeChatId === group.id && activeView === "chats"
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                    title={group.name}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FolderLock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{group.name}</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="text-[8px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                        Team
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Members / Searchable Coworkers Panel */}
          <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="px-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-blue-500 animate-pulse flex-shrink-0" />
                {!sidebarCollapsed && <span>Coworkers Directory</span>}
              </div>
            </div>

            {/* SEARCH DIRECTORY INPUT FIELD */}
            {!sidebarCollapsed && (
              <div className="px-2 pb-1 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4.5 top-2" />
                <input
                  type="text"
                  placeholder="Search by name, email..."
                  value={coworkerSearch}
                  onChange={(e) => setCoworkerSearch(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-550 pl-8 pr-3 py-1 rounded-lg text-xs border border-slate-200/50 dark:border-slate-800/60 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                />
              </div>
            )}

            {/* DIRECTORY LISTINGS (SPLIT INTO FAVORITES AND OTHERS) */}
            <div className="space-y-3">
              
              {/* FAVORITES BLOCK */}
              {favoriteUsers.length > 0 && !sidebarCollapsed && (
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-amber-500 uppercase px-2 tracking-wider flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-amber-500" />
                    <span>Favorites</span>
                  </p>
                  {favoriteUsers.map((user) => (
                    <div
                      key={user.id}
                      className="group w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer transition"
                    >
                      <div 
                        onClick={() => onViewProfile && onViewProfile(user)}
                        className="flex items-center gap-2.5 truncate flex-1"
                        title="View Biography Profile"
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${getStatusColor(user.status)}`} />
                        </div>
                        <div className="truncate text-left">
                          <span className="truncate font-bold text-slate-800 dark:text-slate-200 block text-xs">{user.username}</span>
                          <span className="truncate text-[9px] text-slate-400 font-mono block leading-none">{user.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            onSelectUserChat(user);
                            onViewChange("chats");
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded transition text-blue-500 cursor-pointer"
                          title="Instant Message"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onToggleFavorite && onToggleFavorite(user.id)}
                          className="p-1 rounded text-amber-500 cursor-pointer"
                          title="Remove from favorites"
                        >
                          <Star className="w-3 h-3 fill-amber-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* GENERAL COWORKERS */}
              <div className="space-y-1">
                {favoriteUsers.length > 0 && !sidebarCollapsed && (
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase px-2 tracking-wider mt-2">
                    All Coworkers
                  </p>
                )}

                {sortedFilteredUsers.length === 0 ? (
                  !sidebarCollapsed && (
                    <p className="text-[10px] text-slate-400 italic px-2 py-1">No coworkers match search.</p>
                  )
                ) : (
                  (sidebarCollapsed ? sortedFilteredUsers : otherUsers).map((user) => {
                    const isAi = user.id === "npci_assistant";
                    return (
                      <div
                        key={user.id}
                        className="group w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer transition"
                      >
                        <div 
                          onClick={() => {
                            onSelectUserChat(user);
                            onViewChange("chats");
                          }}
                          className="flex items-center gap-2.5 truncate flex-1 cursor-pointer"
                          title={`Chat with @${user.username}`}
                        >
                          <div 
                            className="relative flex-shrink-0 cursor-pointer group/avatar"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewProfile && onViewProfile(user);
                            }}
                            title="View Coworker Platform Card"
                          >
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700 group-hover/avatar:scale-110 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${getStatusColor(user.status)}`} />
                          </div>
                          {!sidebarCollapsed && (
                            <div className="truncate text-left">
                              <span className="truncate font-semibold text-slate-800 dark:text-slate-300 block text-xs group-hover:text-blue-500 transition-colors">@{user.username}</span>
                              <span className="truncate text-[9px] text-slate-400 dark:text-slate-500 font-mono block leading-none">{user.email}</span>
                            </div>
                          )}
                        </div>

                        {!sidebarCollapsed && (
                          <div className="flex items-center gap-0.5">
                            {isAi ? (
                              <span className="flex items-center gap-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full uppercase font-mono shadow">
                                <Bot className="w-2.5 h-2.5" />
                                <span>AI</span>
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    onSelectUserChat(user);
                                    onViewChange("chats");
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded transition text-slate-500 dark:text-slate-400 cursor-pointer"
                                  title="Instant Message"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </button>
                                {onToggleFavorite && (
                                  <button
                                    onClick={() => onToggleFavorite(user.id)}
                                    className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded transition cursor-pointer ${favorites?.includes(user.id) ? "text-amber-500 animate-pulse" : "text-slate-400 dark:text-slate-500 hover:text-amber-500"}`}
                                    title={favorites?.includes(user.id) ? "Remove from favorites" : "Add to favorites"}
                                  >
                                    <Star className={`w-3 h-3 ${favorites?.includes(user.id) ? "fill-amber-500 text-amber-500" : ""}`} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Collapse Expand Button */}
        {onToggleCollapse && (
          <div className="hidden md:flex p-3 border-t border-slate-200 dark:border-slate-800 justify-center">
            <button
              onClick={onToggleCollapse}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer text-slate-500"
              title={sidebarCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        )}

        {/* Footer Profile Mini Summary */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/40 dark:bg-slate-950/40 text-xs flex-shrink-0 text-left">
            <p className="text-slate-400 dark:text-slate-500 font-semibold font-mono truncate">@{currentUser.username}</p>
            <p className="text-blue-600 dark:text-blue-400 font-extrabold mt-0.5 flex items-center gap-1.5 font-mono truncate">
              <Lock className="w-3 h-3 shrink-0 text-blue-500 dark:text-cyan-400" />
              <span className="truncate uppercase text-[9px]">{currentUser.role.replace(/_/g, " ")}</span>
            </p>
          </div>
        )}
      </aside>

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Create NPCI Community</h3>
              <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-250 dark:border-emerald-800">
                🛡️ SECURED
              </span>
            </div>
            <p className="text-xs text-slate-405 dark:text-slate-500 mt-2 text-left">
              Establish a secure public or restricted workspace channel for compliance and technical discussions.
            </p>

            <form onSubmit={handleSubmitCommunity} className="mt-4 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 font-mono">
                  Community Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. upi-error-codes"
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value.replace(/\s+/g, "-").toLowerCase())}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 font-mono">
                  Description
                </label>
                <textarea
                  placeholder="What should coworkers discuss in this space?"
                  value={newCommDesc}
                  onChange={(e) => setNewCommDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150 dark:border-slate-850">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Secured Restricted Community</label>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Limit participation strictly to authorized staff members.</p>
                </div>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 border-slate-300 dark:border-slate-850 cursor-pointer"
                />
              </div>

              {isPrivate && (
                <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-850 animate-in fade-in slide-in-from-top-2 duration-150 max-h-56 overflow-y-auto">
                  <span className="block text-[10px] font-bold text-blue-600 dark:text-indigo-400 uppercase tracking-wider font-mono">
                    Restrict Community Access
                  </span>
                  
                  {/* Departments Multi-Select */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase font-mono">
                      Allowed Departments
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {["Operations", "Compliance", "UPI Product", "Risk & Settlement", "Audit & Fraud", "Core Technology", "Admin User"].map(dept => {
                        const isChecked = selectedAllowedDepts.includes(dept);
                        return (
                          <label key={dept} className="flex items-center gap-1.5 text-xs text-slate-650 dark:text-slate-300 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedAllowedDepts(prev => prev.filter(d => d !== dept));
                                } else {
                                  setSelectedAllowedDepts(prev => [...prev, dept]);
                                }
                              }}
                              className="w-3.5 h-3.5 rounded text-blue-500 focus:ring-blue-500 border-slate-300 dark:border-slate-850"
                            />
                            <span className="truncate">{dept}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Users Multi-Select */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2">
                    <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase font-mono">
                      Allowed Individual Users
                    </label>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {users
                        .filter(u => u.id !== currentUser.id && u.id !== "npci_assistant")
                        .map(u => {
                          const isChecked = selectedAllowedUsers.includes(u.id);
                          return (
                            <label key={u.id} className="flex items-center gap-1.5 text-xs text-slate-650 dark:text-slate-300 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedAllowedUsers(prev => prev.filter(uid => uid !== u.id));
                                  } else {
                                    setSelectedAllowedUsers(prev => [...prev, u.id]);
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded text-blue-500 focus:ring-blue-500 border-slate-300 dark:border-slate-850"
                              />
                              <span className="truncate">@{u.username}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-sm font-bold rounded-xl transition shadow cursor-pointer"
                >
                  Create Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Chat Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-blue-500" />
                <span>Create Teams Group</span>
              </h3>
              <button 
                onClick={() => setShowGroupModal(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-405 dark:text-slate-500 mt-2 text-left">
              Create an MS Teams-style secure workspace group to instantly share files, compliance audits, and encrypted chat logs.
            </p>

            <form onSubmit={handleCreateGroupSubmit} className="mt-4 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 font-mono">
                  Group / Channel Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Compliance Task Force"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">
                    Select Coworker Members ({selectedGroupMembers.length})
                  </label>
                </div>

                {/* Filter input for coworkers inside group selection modal */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search coworker list..."
                    value={groupSearchQuery}
                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 text-slate-850 dark:text-slate-150 pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 max-h-[160px] overflow-y-auto p-2 space-y-1">
                  {users
                    .filter(u => u.id !== currentUser.id && u.username.toLowerCase().includes(groupSearchQuery.toLowerCase()))
                    .map((member) => {
                      const isSelected = selectedGroupMembers.includes(member.id);
                      return (
                        <div
                          key={member.id}
                          onClick={() => toggleSelectMember(member.id)}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                            isSelected 
                              ? "bg-blue-600/10 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-500/20" 
                              : "hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={member.avatar}
                              alt={member.username}
                              className="w-5 h-5 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className="font-medium">{member.username} ({member.email})</span>
                          </div>
                          <div>
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-350" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!groupName.trim() || selectedGroupMembers.length === 0}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-sm font-bold rounded-xl transition shadow disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
