import React from "react";
import { User } from "../types";

interface MentionTextProps {
  text: string;
  users: User[];
  onViewProfile?: (user: User) => void;
}

export default function MentionText({ text, users, onViewProfile }: MentionTextProps) {
  if (!text) return null;

  // Split by @username tokens
  const parts = text.split(/(@\w+)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith("@")) {
          const username = part.substring(1);
          const matchedUser = users.find(
            (u) => u.username.toLowerCase() === username.toLowerCase()
          );

          if (matchedUser) {
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewProfile) onViewProfile(matchedUser);
                }}
                className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold px-1.5 py-0.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer inline-flex items-center gap-0.5 transition"
              >
                {part}
              </button>
            );
          } else if (username.toLowerCase() === "npci_assistant" || username.toLowerCase() === "npci assistant" || username.toLowerCase() === "npci") {
            // Also highlight NPCI Assistant specially
            return (
              <span
                key={index}
                className="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-extrabold px-1.5 py-0.5 rounded-lg inline-flex items-center gap-0.5"
              >
                {part}
              </span>
            );
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
