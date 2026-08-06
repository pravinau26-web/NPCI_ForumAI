import React, { useState } from "react";
import { Bell, Search, Shield, User as UserIcon, Check, Circle, Sun, Moon, LogOut, Menu } from "lucide-react";
import { User, Notification } from "../types";
import NPCILogo from "./NPCILogo";

interface HeaderProps {
  currentUser: User;
  onUpdateStatus: (status: "online" | "offline" | "away") => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  onSelectThread: (threadId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onViewChange: (view: "forum" | "chats" | "policy" | "admin" | "logs" | "hierarchy") => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLogout: () => void;
  onToggleMobileSidebar: () => void;
  onOpenProfileSettings: () => void;
  onSelectChat?: (chatId: string) => void;
  onSelectCommunity?: (communityId: string) => void;
  threads?: any[];
}

export default function Header({
  currentUser,
  onUpdateStatus,
  notifications,
  onMarkNotificationRead,
  onSelectThread,
  searchQuery,
  setSearchQuery,
  onViewChange,
  theme,
  onToggleTheme,
  onLogout,
  onToggleMobileSidebar,
  onOpenProfileSettings,
  onSelectChat,
  onSelectCommunity,
  threads,
}: HeaderProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  const handleNotificationClick = (notif: Notification) => {
    onMarkNotificationRead(notif.id);
    setShowNotifMenu(false);
    
    if (notif.type === "dm") {
      onViewChange("chats");
      if (onSelectChat) {
        onSelectChat(notif.sourceId);
      }
    } else {
      // Thread reply or forum event
      if (threads && onSelectCommunity && onSelectThread) {
        const foundThread = threads.find(t => t.id === notif.sourceId);
        if (foundThread) {
          onSelectCommunity(foundThread.communityId);
          onSelectThread(foundThread.id);
        } else {
          onSelectThread(notif.sourceId);
        }
      } else {
        onSelectThread(notif.sourceId);
      }
      onViewChange("forum");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Mobile Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition duration-150 cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => onViewChange("forum")}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="hidden sm:flex items-center group-hover:scale-105 transition-transform duration-200 p-1">
              <NPCILogo size="md" showText={true} />
            </div>
            <div className="hidden sm:block border-l border-slate-200 dark:border-slate-800 pl-3">
              <div className="font-bold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>NPCI AI Forum</span>
                <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 px-2 py-0.5 rounded-full">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">National Payments Workspace</p>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search discussions, tags, or announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 pl-10 pr-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 transition-all duration-150"
          />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition duration-150 cursor-pointer"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowStatusMenu(false);
              }}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition duration-150 relative cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-rose-600 text-white font-extrabold text-[9px] min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-sm leading-none z-10">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Notifications ({unreadCount} unread)</span>
                  {unreadCount > 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">Click to read</span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition flex gap-3 ${
                          !notif.isRead ? "bg-slate-50/60 dark:bg-slate-800/20 font-medium" : ""
                        }`}
                      >
                        <div className="mt-0.5">
                          <Circle
                            className={`w-2 h-2 rounded-full ${
                              notif.type === "policy_update"
                                ? "fill-blue-500 text-blue-500"
                                : notif.type === "mention"
                                ? "fill-cyan-500 text-cyan-500"
                                : "fill-emerald-500 text-emerald-500"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-800 dark:text-slate-200 leading-tight">{notif.content}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Status Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStatusMenu(!showStatusMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition duration-150 cursor-pointer"
            >
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.username}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 ${getStatusColor(
                    currentUser.status
                  )}`}
                />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none border border-dashed border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded-md">
                  {currentUser.username}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 capitalize font-mono">
                  {currentUser.role.replace("_", " ")}
                </p>
              </div>
            </button>

            {showStatusMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Set Workspace Status</p>
                </div>
                <div className="py-1">
                  {(["online", "away", "offline"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        onUpdateStatus(status);
                        setShowStatusMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition duration-150 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(status)}`} />
                        <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{status}</span>
                      </div>
                      {currentUser.status === status && <Check className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1.5 px-4 text-center">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">Auto-responder fires when away/offline</p>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2 px-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowStatusMenu(false);
                      onOpenProfileSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition duration-150 cursor-pointer font-medium"
                  >
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>Profile Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowStatusMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition duration-150 cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
