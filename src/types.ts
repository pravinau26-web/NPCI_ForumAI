export type UserRole = "employee" | "lead" | "policy_admin" | "platform_admin";
export type UserStatus = "online" | "offline" | "away";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  department?: string;
  bio?: string;
  lastActive?: string;
  password?: string;
  reportsTo?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  creatorId?: string;
  createdAt: string;
  isPrivate: boolean;
  memberIds: string[];
  allowedUserIds?: string[];
  allowedDepartments?: string[];
}

export interface Attachment {
  name: string;
  type: string;
  size: string;
  url: string;
}

export interface Thread {
  id: string;
  communityId: string;
  title: string;
  content: string;
  authorId: string;
  creatorId?: string;
  createdAt: string;
  upvotes: string[]; // List of user IDs who upvoted
  isPinned: boolean;
  tags: string[];
  attachments?: Attachment[];
}

export interface Comment {
  id: string;
  threadId: string;
  parentId?: string; // For nested comments
  content: string;
  authorId: string;
  creatorId?: string;
  createdAt: string;
  upvotes: string[];
  attachments?: Attachment[];
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  creatorId?: string;
  createdAt: string;
  status: "sent" | "delivered" | "read";
  readBy: string[]; // User IDs who read this message
  attachments?: Attachment[];
}

export interface Chat {
  id: string;
  name?: string; // Optional for 1:1, required for Group
  isGroup: boolean;
  participants: string[]; // User IDs
  creatorId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "mention" | "reply" | "dm" | "policy_update";
  title: string;
  content: string;
  sourceId: string; // ID of thread, chat, etc.
  isRead: boolean;
  creatorId?: string;
  createdAt: string;
}

export interface PolicyChunk {
  section: string;
  text: string;
}

export interface PolicyDocument {
  id: string;
  title: string;
  description: string;
  fileName: string;
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  chunks: PolicyChunk[];
  type?: "spec" | "complaint";
  parentPolicyTitle?: string;
}

export interface PolicyDiff {
  type: "added" | "removed" | "modified";
  section: string;
  oldText?: string;
  newText?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  timestamp: string;
  details: string;
}
