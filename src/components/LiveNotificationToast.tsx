import React, { useEffect } from "react";
import { Bell, MessageSquare, FileText, Sparkles, X, Heart } from "lucide-react";
import { Notification } from "../types";

interface LiveNotificationToastProps {
  toasts: Notification[];
  onDismiss: (id: string) => void;
  onClickToast: (notif: Notification) => void;
}

export default function LiveNotificationToast({
  toasts,
  onDismiss,
  onClickToast,
}: LiveNotificationToastProps) {
  // Setup automatic dismissal for each notification toast
  useEffect(() => {
    if (toasts.length === 0) return;

    // Monitor the latest toast and set a timer to dismiss it after 5 seconds
    const latestToast = toasts[toasts.length - 1];
    const timer = setTimeout(() => {
      onDismiss(latestToast.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "policy_update":
        return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case "mention":
        return <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case "dm":
        return <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case "reply":
      default:
        return <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    }
  };

  const getThemeColor = (type: string) => {
    switch (type) {
      case "policy_update":
        return "border-blue-500 bg-blue-50/95 dark:bg-slate-900/95";
      case "mention":
        return "border-indigo-500 bg-indigo-50/95 dark:bg-slate-900/95";
      case "dm":
        return "border-emerald-500 bg-emerald-50/95 dark:bg-slate-900/95";
      case "reply":
      default:
        return "border-amber-500 bg-amber-50/95 dark:bg-slate-900/95";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex gap-3 p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-2xl transition-all duration-300 transform translate-y-0 animate-in slide-in-from-bottom-5 fade-in duration-200 border-l-4 ${getThemeColor(
            toast.type
          )}`}
        >
          {/* Left Icon Area */}
          <div className="p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm self-start flex-shrink-0">
            {getIcon(toast.type)}
          </div>

          {/* Core Text Info Area */}
          <div
            onClick={() => onClickToast(toast)}
            className="flex-1 text-left cursor-pointer space-y-1 pr-4"
          >
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              {toast.title}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium">
              {toast.content}
            </p>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase tracking-widest block pt-0.5">
              Live Notification
            </span>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-950 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 self-start flex-shrink-0 cursor-pointer transition duration-150"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
