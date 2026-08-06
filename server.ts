import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { 
  User, Community, Thread, Comment, Chat, ChatMessage, 
  Notification, PolicyDocument, AuditLog, UserStatus, UserRole, Attachment
} from "./src/types";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Initialize Google Gen AI
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("GEMINI_API_KEY not configured. Running AI features in simulated mode.");
}

// ==========================================
// MINIO S3 SIMULATION FOR IMAGE STORAGE
// ==========================================
class MinioS3Simulation {
  private bucketName: string = "npci-forum-images";
  private storagePath: string = path.join(process.cwd(), "storage", "minio_s3");

  constructor() {
    try {
      if (!fs.existsSync(this.storagePath)) {
        fs.mkdirSync(this.storagePath, { recursive: true });
      }
    } catch (e) {
      console.warn("Storage path creation warning:", e);
    }
  }

  public async putObject(objectName: string, base64Data: string, mimeType: string): Promise<string> {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, 'base64');
    const filePath = path.join(this.storagePath, objectName);
    await fs.promises.writeFile(filePath, buffer);
    console.log(`[Minio S3] Saved object ${objectName} in bucket ${this.bucketName}`);
    return `/storage/minio_s3/${objectName}`;
  }
}

const minioClient = new MinioS3Simulation();

// ==========================================
// SIMULATED VECTOR DATABASE FOR GROUNDED RAG
// ==========================================
interface VectorRecord {
  id: string;
  embedding: number[];
  metadata: {
    docId: string;
    docTitle: string;
    section: string;
    text: string;
    version: string;
  };
}

class VectorDatabase {
  private records: VectorRecord[] = [];

  public async generateEmbedding(text: string): Promise<number[]> {    const vector: number[] = new Array(768).fill(0);
    const words = text.toLowerCase().split(/\W+/);
    for (const word of words) {
        if (!word) continue;
        let h = 0;
        for (let i = 0; i < word.length; i++) {
           h = (h << 5) - h + word.charCodeAt(i);
           h |= 0;
        }
        vector[Math.abs(h) % 768] += 1;
    }
    let sum = 0;
    for (let v of vector) sum += v * v;
    if (sum > 0) {
        for (let i=0; i<768; i++) vector[i] /= Math.sqrt(sum);
    }
    return vector;

  }

  public insert(id: string, embedding: number[], metadata: any) {
    this.records.push({ id, embedding, metadata });
    console.log(`[Vector DB] Inserted record ${id} with embedding vector (dim=${embedding.length})`);
  }

  public getRecords() {
    return this.records;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return normA === 0 || normB === 0 ? 0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  public query(queryVector: number[], topK: number = 3): VectorRecord[] {
    const scoredRecords = this.records.map(rec => ({
      record: rec,
      score: this.cosineSimilarity(queryVector, rec.embedding)
    }));
    scoredRecords.sort((a, b) => b.score - a.score);
    return scoredRecords.slice(0, topK).map(s => s.record);
  }
}

const vectorDb = new VectorDatabase();

app.use(express.json({ limit: '10mb' }));
app.use("/storage/minio_s3", express.static(path.join(process.cwd(), "storage", "minio_s3")));

// ==========================================
// IN-MEMORY DATABASE STATE (WITH SEED DATA)
// ==========================================

let users: User[] = [
  {
    id: "user-ceo-dilip",
    username: "Dilip asbe",
    email: "dilip.asbe@npci.org.in",
    role: "platform_admin",
    status: "offline",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80",
    department: "Executive Board",
    bio: "Managing Director & CEO of National Payments Corporation of India (NPCI). Leading payment revolution in India.",
    password: "npciforum@01"
  },
  {
    id: "user-platform-admin-special",
    username: "NPCI_Forum",
    email: "admin@npci.org.in",
    role: "platform_admin",
    status: "offline",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
    department: "Security & Governance",
    bio: "Chief Platform Administrator of internal systems and audits.",
    password: "npciforum@01",
    reportsTo: "user-ceo-dilip"
  },
  {
    id: "user-1",
    username: "pravin",
    email: "pravinau26@gmail.com",
    role: "lead",
    status: "offline",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    department: "UPI Core Development",
    bio: "Lead developer on NPCI UPI APIs and instant payments.",
    password: "npciforum@01",
    reportsTo: "user-ceo-dilip"
  },
  {
    id: "user-2",
    username: "neha_compliance",
    email: "neha@npci.org.in",
    role: "policy_admin",
    status: "offline",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    department: "Risk & Compliance",
    bio: "Compliance Officer at NPCI, managing policy changes and regulatory requirements.",
    password: "npciforum@01",
    reportsTo: "user-ceo-dilip"
  },
  {
    id: "user-3",
    username: "amit_platform",
    email: "amit@npci.org.in",
    role: "employee",
    status: "offline",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    department: "Platform Engineering",
    bio: "Systems and Kubernetes cluster engineer.",
    password: "npciforum@01",
    reportsTo: "user-platform-admin-special"
  },
  {
    id: "npci_assistant",
    username: "NPCI Assistant",
    email: "npci_assistant@npci.org.in",
    role: "employee",
    status: "online",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
    department: "Artificial Intelligence",
    bio: "AI Assistant grounded on official NPCI policies (UPI, RuPay, AePS, etc.).",
    password: "npciforum@01",
    reportsTo: "user-platform-admin-special"
  },
  {
    id: "user-5",
    username: "priya_s",
    email: "priya@npci.org.in",
    role: "employee",
    status: "away",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    department: "Bharat BillPay (BBPS)",
    bio: "UI/UX developer working on the BBPS agent application.",
    password: "npciforum@01",
    reportsTo: "user-1"
  },
  {
    id: "user-6",
    username: "rajesh_kumar",
    email: "rajesh@npci.org.in",
    role: "employee",
    status: "offline",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    department: "AePS Operations",
    bio: "Operations Lead for Aadhaar Enabled Payment System.",
    password: "npciforum@01",
    reportsTo: "user-2"
  }
];

let communities: Community[] = [
  {
    id: "comm-1",
    name: "UPI 2.0 Compliance",
    description: "Threads regarding UPI 2.0 transaction limits, merchant onboarding, and UDIR guidelines.",
    createdBy: "user-2",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    isPrivate: false,
    memberIds: ["user-1", "user-2", "user-3", "user-5", "user-6", "npci_assistant"]
  },
  {
    id: "comm-2",
    name: "RuPay Technical Specs",
    description: "Discussing tokenization, contactless card integration, and EMV standards.",
    createdBy: "user-1",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    isPrivate: false,
    memberIds: ["user-1", "user-2", "user-3", "npci_assistant"]
  },
  {
    id: "comm-3",
    name: "Product Design & Ideas",
    description: "A sandbox space for brainstorming new NPCI products and UX flows.",
    createdBy: "user-5",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    isPrivate: false,
    memberIds: ["user-1", "user-5", "user-6"]
  },
  {
    id: "comm-4",
    name: "Platform Security & Audits",
    description: "Private discussions on system health, internal penetration testing, and logs.",
    createdBy: "user-3",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    isPrivate: true,
    memberIds: ["user-2", "user-3"]
  }
];

let threads: Thread[] = [
  {
    id: "thread-1",
    communityId: "comm-1",
    title: "Clarification on UPI 2.0 ₹5 Lakh limit for educational payments",
    content: "Hi team, we are implementing educational payments for high-velocity universities. The UPI compliance guide v2.1 states the limit is extended up to ₹5 Lakhs, but is this only for pre-approved merchant categories or can any standard merchant apply for this limit? Please advise.",
    authorId: "user-1",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    upvotes: ["user-2", "user-5"],
    isPinned: true,
    tags: ["UPI", "Limits", "Compliance"],
    attachments: [
      {
        name: "UPI-Limit-Matrix-2026.pdf",
        type: "application/pdf",
        size: "1.2 MB",
        url: "#"
      }
    ]
  },
  {
    id: "thread-2",
    communityId: "comm-2",
    title: "RuPay Card Offline Contactless limit increase to ₹5000",
    content: "The v4.0 security guidelines specify offline contactless transactions up to ₹5,000 without requiring PIN entry. Do we have to implement offline risk scoring at the terminal level for this, or does the issuer handle liability entirely? Let's compile the terminal configuration requirements.",
    authorId: "user-1",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    upvotes: ["user-3", "user-6"],
    isPinned: false,
    tags: ["RuPay", "Contactless", "Security"]
  }
];

let comments: Comment[] = [
  {
    id: "comment-1",
    threadId: "thread-1",
    content: "Hi Pravin, yes. According to Section 'Transaction Limits' of the UPI Compliance guide, this extended limit is strictly restricted to pre-approved merchant categories in MCC 8211, 8220 (Schools and Colleges). High-risk categories or standard merchants are restricted to the default ₹1 Lakh limit.",
    authorId: "user-2",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    upvotes: ["user-1"]
  },
  {
    id: "comment-2",
    threadId: "thread-1",
    content: "NPCI Assistant, can you confirm if healthcare merchants also qualify for the ₹5 Lakh limit?",
    authorId: "user-1",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    upvotes: []
  },
  {
    id: "comment-3",
    threadId: "thread-1",
    parentId: "comment-2",
    content: "Based on the official **NPCI UPI 2.0 Compliance Guide (v2.1)**, healthcare merchants (specifically hospitals under pre-approved MCCs) indeed qualify for the extended transaction limit of up to **₹5 Lakhs per transaction**. Other general categories remain capped at ₹1 Lakh.",
    authorId: "npci_assistant",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    upvotes: ["user-1", "user-2"]
  }
];

let chats: Chat[] = [
  {
    id: "chat-1",
    isGroup: false,
    participants: ["user-1", "npci_assistant"],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "chat-2",
    isGroup: false,
    participants: ["user-1", "user-5"], // user-5 is Priya (away status)
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "chat-group-1",
    name: "UPI Developers Sync",
    isGroup: true,
    participants: ["user-1", "user-5", "user-6"],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

let chatMessages: ChatMessage[] = [
  {
    id: "msg-1",
    chatId: "chat-1",
    senderId: "user-1",
    content: "Hi NPCI Assistant, tell me about AePS daily cash withdrawal limits.",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "read",
    readBy: ["npci_assistant"]
  },
  {
    id: "msg-2",
    chatId: "chat-1",
    senderId: "npci_assistant",
    content: "According to the **AePS Operation Guidelines 2026 (v1.2)**, the daily cash withdrawal limit is capped at **₹10,000 per Aadhaar number**. Let me know if you need more details on micro-ATM security policies!",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 15 * 1000).toISOString(),
    status: "read",
    readBy: ["user-1"]
  },
  {
    id: "msg-3",
    chatId: "chat-2",
    senderId: "user-1",
    content: "Hey Priya, do we have the final BBPS screen design designs ready for review?",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    status: "read",
    readBy: ["user-5"]
  }
];




function createNotification(userId: string, type: "mention" | "reply" | "dm" | "policy_update", title: string, content: string, sourceId: string) {
  const notif: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    type,
    title,
    content,
    isRead: false,
    createdAt: new Date().toISOString(),
    sourceId
  };
  notifications.unshift(notif);
  broadcastEvent([userId], "notification:received", notif);
}
function extractMentions(text: string) {
  const mentions = text.match(/@(\w+)/g) || [];
  return mentions.map(m => m.substring(1));
}

function notifyMentions(text: string, title: string, linkId: string, currentUserId: string) {
  const mentionedUsernames = extractMentions(text);
  mentionedUsernames.forEach(username => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user && user.id !== currentUserId) {
      createNotification(user.id, "mention", "You were mentioned", title, linkId);
    }
  });
}

let notifications: Notification[] = [
  {
    id: "notif-1",
    userId: "user-1",
    type: "reply",
    title: "Reply in UPI Limit Thread",
    content: "Neha (Compliance) replied to your thread 'Clarification on UPI 2.0 limit'.",
    sourceId: "thread-1",
    isRead: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "notif-2",
    userId: "user-1",
    type: "mention",
    title: "NPCI Assistant Mentioned You",
    content: "NPCI Assistant replied: 'Based on the official NPCI UPI 2.0 Compliance Guide...'",
    sourceId: "thread-1",
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

let policyDocuments: PolicyDocument[] = [
  {
    id: "policy-1",
    title: "NPCI UPI 2.0 Compliance Guide",
    description: "Rules regarding UPI transaction limits, MCC eligibility, merchant onboarding risk, and Unified Dispute Redressal (UDIR).",
    fileName: "UPI_Compliance_v2.1.pdf",
    version: "2.1",
    uploadedBy: "user-2",
    uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    type: "spec",
    chunks: [
      {
        section: "Transaction Limits",
        text: "The standard transaction limit for P2P UPI payments is ₹1 Lakh per transaction. However, for specific pre-approved high-velocity merchant categories including Educational Institutions and Healthcare, the limit is extended up to ₹5 Lakhs per transaction. General retail categories must not exceed the ₹1 Lakh threshold under any circumstances."
      },
      {
        section: "Unified Dispute Redressal System (UDIR)",
        text: "All UPI participant banks must integrate the Unified Dispute Redressal System (UDIR) to auto-resolve failed payments. The system must process and credit failed transactions within a T+1 day window. A compensation of ₹100 per day is payable to customers for failed transaction resolution delays extending beyond T+2 days."
      },
      {
        section: "Merchant Onboarding and Velocity Caps",
        text: "Every acquiring entity must perform strict KYC checks prior to merchant onboarding. Newly onboarded high-risk merchants are restricted to a daily velocity limit of ₹2 Lakhs for the first 30 days of clean account operations. Capital limits may be raised upon successful post-onboarding audits."
      }
    ]
  },
  {
    id: "policy-2",
    title: "RuPay Card Security Protocol",
    description: "Compliance protocols for EMV card issuing, tokenization mandates, and offline contactless payments.",
    fileName: "RuPay_Security_v4.0.pdf",
    version: "4.0",
    uploadedBy: "user-2",
    uploadedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    type: "spec",
    chunks: [
      {
        section: "Tokenization Mandate",
        text: "In compliance with RBI circulars, no retail merchant or payment aggregator may store raw card-on-file data. All RuPay card credentials must be fully tokenized using an authorized token service provider (TSP) prior to saving in merchant databases. Only masked card numbers and card network tokens are allowed."
      },
      {
        section: "Offline Contactless Payments",
        text: "To enhance micro-payment speeds, offline contactless payments via RuPay chip cards are permitted up to a threshold of ₹5,000 per transaction at physical point-of-sale (POS) terminals without needing card PIN entry. The cardholder's cumulative offline transaction limit is capped at ₹10,000 before a forced online PIN reset is required."
      }
    ]
  },
  {
    id: "policy-3",
    title: "AePS Operation Guidelines 2026",
    description: "Biometric authentication standards, Micro-ATM operations, and withdrawal limit guides.",
    fileName: "AePS_Guidelines_v1.2.pdf",
    version: "1.2",
    uploadedBy: "user-2",
    uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    type: "spec",
    chunks: [
      {
        section: "Micro-ATM Security",
        text: "All Aadhaar Enabled Payment System (AePS) Micro-ATMs must enforce dual-factor authentication. This includes biometric fingerprint/iris confirmation of the Business Correspondent (BC) alongside the customer's biometric authentication. No transaction may proceed without matching the correspondent’s live biometric template."
      },
      {
        section: "Daily Withdrawal Limits",
        text: "To mitigate fraud risks associated with rural agent networks, the maximum daily cash withdrawal limit is restricted to ₹10,000 per Aadhaar number. A maximum of 5 cash withdrawal attempts are allowed per account holder per day across all bank accounts connected to the Aadhaar ID."
      }
    ]
  },
  {
    id: "policy-complaint-1",
    title: "UPI Daily Velocity Breach Complaint",
    description: "Systemic velocity breach report logged for high-risk merchant onboardings without valid KYC verification.",
    fileName: "UPI_Breach_Complaint_2026.pdf",
    version: "1.0",
    uploadedBy: "user-2",
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    type: "complaint",
    chunks: [
      {
        section: "KYC Non-Compliance Details",
        text: "Several high-risk merchants registered under MCC 5311 (Department Stores) breached the daily velocity limit of ₹2 Lakhs on day 3 of operations. Acquiring entities failed to execute mandatory post-onboarding KYC checks."
      },
      {
        section: "Corrective Escalation Mandate",
        text: "Acquiring gateway operations are hereby instructed to freeze settlements for merchant IDs M-9304 and M-1194 pending an on-site security compliance audit. Failure to comply will lead to a penalty of ₹50,000 per violation day."
      }
    ]
  }
];

// Seed the vectorDb initially
(async () => {
  for (const doc of policyDocuments) {
    for (let index = 0; index < doc.chunks.length; index++) {
      const chunk = doc.chunks[index];
      const recordId = `${doc.id}-chunk-${index}`;
      const embedding = await vectorDb.generateEmbedding(chunk.text);
      vectorDb.insert(recordId, embedding, {
        docId: doc.id,
        docTitle: doc.title,
        section: chunk.section,
        text: chunk.text,
        version: doc.version
      });
    }
  }
})();

let auditLogs: AuditLog[] = [
  {
    id: "log-1",
    action: "System Initialization",
    actorId: "user-3",
    actorName: "amit_platform",
    timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    details: "Featurist NPCI Forum engine seeded with initial compliance documentation and admin privileges."
  },
  {
    id: "log-2",
    action: "Policy Document Upload",
    actorId: "user-2",
    actorName: "neha_compliance",
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    details: "Uploaded NPCI UPI 2.0 Compliance Guide version 2.1 to central RAG memory bank."
  }
];

// ==========================================
// WEBSOCKET CHANNELS & PUBSUB
// ==========================================

const connectedClients = new Map<string, WebSocket>();

const broadcastEvent = (userIds: string[] | "all", event: string, payload: any) => {
  const dataString = JSON.stringify({ event, payload });
  if (userIds === "all") {
    connectedClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(dataString);
      }
    });
  } else {
    userIds.forEach((id) => {
      const ws = connectedClients.get(id);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(dataString);
      }
    });
  }
};

// Start WebSocket Server on top of the HTTP Server
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", (ws: WebSocket) => {
  let authenticatedUserId: string | null = null;

  ws.on("message", (messageString) => {
    try {
      const data = JSON.parse(messageString.toString());
      if (data.type === "auth") {
        authenticatedUserId = data.userId;
        connectedClients.set(data.userId, ws);
        
        // Mark user as online on WebSocket auth
        const user = users.find(u => u.id === data.userId);
        if (user && user.status === "offline") {
          user.status = "online";
          broadcastEvent("all", "status:changed", { userId: user.id, status: "online" });
        }
        
        console.log(`WebSocket client authenticated: ${data.userId}`);
      }
      
      if (data.type === "typing") {
        const { chatId, isTyping } = data;
        const chat = chats.find(c => c.id === chatId);
        if (chat && authenticatedUserId) {
          const recipients = chat.participants.filter(pid => pid !== authenticatedUserId);
          broadcastEvent(recipients, "typing:status", { chatId, userId: authenticatedUserId, isTyping });
        }
      }
    } catch (e) {
      console.error("Error processing WS message:", e);
    }
  });

  ws.on("close", () => {
    if (authenticatedUserId) {
      connectedClients.delete(authenticatedUserId);
      console.log(`WebSocket client disconnected: ${authenticatedUserId}`);
      
      // Auto-set user offline if they completely disconnected
      setTimeout(() => {
        if (!connectedClients.has(authenticatedUserId!)) {
          const user = users.find(u => u.id === authenticatedUserId);
          if (user && user.status === "online") {
            user.status = "offline";
            broadcastEvent("all", "status:changed", { userId: user.id, status: "offline" });
          }
        }
      }, 5000);
    }
  });
});

// Helper: Add log
const addAuditLog = (action: string, actorId: string, details: string) => {
  const actor = users.find(u => u.id === actorId);
  const log: AuditLog = {
    id: `log-${Date.now()}`,
    action,
    actorId,
    actorName: actor ? actor.username : "Unknown",
    timestamp: new Date().toISOString(),
    details
  };
  auditLogs.unshift(log);
  // Broadcast log to platform admins
  const admins = users.filter(u => u.role === "platform_admin" || u.role === "policy_admin").map(u => u.id);
  broadcastEvent(admins, "audit_log:added", log);
};

// ==========================================
// GEMINI AI INTEGRATION ENGINE
// ==========================================

// FR-3: AI Tag Generator
async function generateAiTags(title: string, content: string): Promise<string[]> {
  if (!ai) {
    // Simulated Tag Generation
    const words = `${title} ${content}`.toLowerCase();
    const mockTags = ["NPCI", "Security", "Policy", "Compliance", "API", "RuPay", "UPI", "AePS", "BBPS"];
    const matched = mockTags.filter(tag => words.includes(tag.toLowerCase()));
    return matched.length > 0 ? matched.slice(0, 4) : ["NPCI", "General"];
  }

  try {
    const prompt = `Analyze this NPCI internal forum post and generate exactly 3 to 5 highly relevant technical tags/topics.
Title: ${title}
Content: ${content}

Return the tags as a simple JSON array of strings. Do not write any other explanation or code blocks.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        }
      }
    });

    const text = response.text?.trim() || "[]";
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : ["NPCI", "General"];
  } catch (err) {
    console.error("AI Tag generation error:", err);
    return ["NPCI", "General"];
  }
}

// FR-11: Policy Update Diff & Changelog Generator
async function generatePolicyChangelog(title: string, oldDoc: PolicyDocument, newChunks: any[]): Promise<string> {
  const oldText = oldDoc.chunks.map(c => `[Section: ${c.section}]\n${c.text}`).join("\n\n");
  const newText = newChunks.map(c => `[Section: ${c.section}]\n${c.text}`).join("\n\n");

  if (!ai) {
    return `Simulated plain-language changelog for ${title} from v${oldDoc.version} to version updates:\n- Updated standard specifications.\n- Clarified MCC rules and expanded operational limits.`;
  }

  try {
    const prompt = `You are a compliance policy officer at NPCI. We have updated a key policy document: "${title}".
Compare the old policy and the new policy, and generate a clear, plain-language changelog describing:
1. What sections changed.
2. What specific limits, compliance rules, or technical requirements were modified.
3. The implications for partner banks or developers.

Old Policy Context:
${oldText}

New Policy Context:
${newText}

Provide a concise, professional markdown plain-language summary for NPCI employees.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "No changelog could be parsed.";
  } catch (err) {
    console.error("AI Policy Changelog Error:", err);
    return "Error generating automatic policy diff analysis.";
  }
}

// FR-12/FR-9: NPCI Assistant Grounded Q&A (RAG)
async function npciAssistantRAG(question: string, history: { sender: string; content: string }[]): Promise<{ answer: string; confidence: "high" | "low"; citations: { docTitle: string; section: string; version: string }[] }> {
  const normQ = question.trim().toLowerCase();
  const greetings = ["hi", "gi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening", "help"];
  if (greetings.includes(normQ) || normQ.startsWith("hi ") || normQ.startsWith("gi ") || normQ.startsWith("hello ")) {
    return {
      answer: "Hello! I am the NPCI AI Assistant grounded on official NPCI policy documents (UPI 2.0, RuPay, AePS, BBPS, UDIR, and Tokenization guidelines). How can I assist you with compliance guidelines or payment technical specifications today?",
      confidence: "high",
      citations: [{ docTitle: "NPCI Master Policy Repository", section: "AI Virtual Assistant Guidelines", version: "3.0" }]
    };
  }
  // Query the Vector DB for the top 5 most relevant policy chunks
  const queryVector = await vectorDb.generateEmbedding(question);
  const relevantRecords = vectorDb.query(queryVector, 5);

  const formattedCorpus = relevantRecords.map((rec, index) => {
    return `Index [${index}] | Document: ${rec.metadata.docTitle} (v${rec.metadata.version}) | Section: ${rec.metadata.section}\nContent: ${rec.metadata.text}`;
  }).join("\n\n");

  const formattedHistory = history.map(h => `${h.sender}: ${h.content}`).join("\n");

  if (!ai) {
    // Offline simulated responses
    const normalized = question.toLowerCase();
    if (normalized.includes("upi") && normalized.includes("limit")) {
      return {
        answer: "UPI transaction limits are extended to ₹5 Lakhs for pre-approved Educational Institutions and Healthcare MCCs. Other categories default to ₹1 Lakh.",
        confidence: "high",
        citations: [{ docTitle: "NPCI UPI 2.0 Compliance Guide", section: "Transaction Limits", version: "2.1" }]
      };
    }
    // Simulate RAG answer using retrieved docs if we are just returning offline
    if (relevantRecords.length > 0) {
      return {
         answer: `${relevantRecords[0].metadata.text}`,
         confidence: "high",
         citations: [{ docTitle: relevantRecords[0].metadata.docTitle, section: relevantRecords[0].metadata.section, version: relevantRecords[0].metadata.version }]
      }
    }
    return {
      answer: "I am currently running in offline simulated mode. Once a valid Gemini API key is configured, I can answer grounded on any uploaded policy with complete document section citations.",
      confidence: "low",
      citations: []
    };
  }

  try {
    const prompt = `You are the NPCI Virtual Policy Assistant, a persistent virtual user inside the internal NPCI Forum.
Your task is to answer employee queries strictly using the provided NPCI Policy Documents. 

=== GUIDELINES ===
1. Only answer based on the official guidelines listed below.
2. Cite the exact document title, section name, and version in your text.
3. If the answer is NOT present or can't be reasonably inferred from the policy documents, state: "I don't have enough verified policy data on this topic. I have flagged this for Compliance Review." Set your confidence level to "low" and do not guess.
4. Keep your tone professional, authoritative, and direct.

=== POLICY DOCUMENTS CORPUS ===
${formattedCorpus}

=== CONVERSATION HISTORY ===
${formattedHistory}

=== NEW EMPLOYEE QUESTION ===
Employee: ${question}

=== OUTPUT FORMAT ===
Generate your response as a JSON object with the following fields:
- "answer": (string) Your complete grounded answer with inline citations.
- "confidence": ("high" or "low") "low" if details are missing or you are guessing; "high" if you are fully grounded.
- "citations": (array of objects) each with "docTitle", "section", "version".

Return ONLY raw JSON. Do not wrap in markdown \`\`\`json blocks.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            confidence: { type: Type.STRING, enum: ["high", "low"] },
            citations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  docTitle: { type: Type.STRING },
                  section: { type: Type.STRING },
                  version: { type: Type.STRING }
                },
                required: ["docTitle", "section", "version"]
              }
            }
          },
          required: ["answer", "confidence", "citations"]
        }
      }
    });

    const text = response.text?.trim() || "{}";
    const result = JSON.parse(text);
    return {
      answer: result.answer || "Error processing grounded policy lookup.",
      confidence: result.confidence || "low",
      citations: result.citations || []
    };
  } catch (err) {
    console.error("AI RAG error:", err);
    return {
      answer: "I encountered an error querying the intelligence engine. Please ask again shortly.",
      confidence: "low",
      citations: []
    };
  }
}

// FR-8: Product AI (Non-policy internal product helper)
async function askProductAi(question: string): Promise<string> {
  const knowledgeBase = `
- UPI (Unified Payments Interface): Real-time instant payment platform enabling bank-to-bank transfers. Main products include UPI Lite (on-device balance), UPI AutoPay (recurring mandates), and Credit Lines on UPI.
- RuPay: National card network issuing debit, credit, and prepaid cards. Supports Global acceptance, Tokenization, and offline contactless transit.
- AePS (Aadhaar Enabled Payment System): Financial inclusion model allowing cardless withdrawals at Micro-ATMs via Aadhaar biometrics.
- BBPS (Bharat Bill Payment System): One-stop interoperable platform for bill collections, supporting utilities, education fees, tax payments, and subscriptions.
- IMPS (Immediate Payment Service): High-reliability 24/7 retail fund transfer routing system.
- NETC (FASTag): Electronic toll collection system powered by RFID on Indian highways.
`;

  if (!ai) {
    return `Simulated NPCI Product AI answer about internal technologies. Supported products: UPI, RuPay, AePS, BBPS, IMPS, NETC FASTag.`;
  }

  try {
    const prompt = `You are the NPCI internal Product AI Knowledge Agent.
Answer questions about NPCI product technical stacks, products capabilities, or integrations. 
Use this baseline Product Knowledge Base if relevant, but feel free to expand based on standard public payment technical frameworks:

${knowledgeBase}

Employee Question: ${question}

Provide a comprehensive, crisp, professional technical answer. Include code samples, architectural layouts, or API endpoint conventions if helpful.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Could not retrieve product information.";
  } catch (err) {
    console.error("Product AI error:", err);
    return "Error contacting the internal Product AI technical engine.";
  }
}

// FR-7: AI Auto-Responder for Offline/Away users
async function generateAiAutoResponse(senderName: string, recipientName: string, messageContent: string, chatHistory: string[] = []): Promise<string> {
  if (!ai) {
    return `I am currently offline or away. I will check and intimate you once I return.`;
  }

  try {
    const prompt = `You are a helpful AI Auto-Responder acting on behalf of an NPCI staff member: "${recipientName}".
They are currently offline/away from their workspace. Another coworker "${senderName}" just sent them a direct message:

Message: "${messageContent}"

Here is the previous chat history between them for context:
${chatHistory.length > 0 ? chatHistory.join("\n") : "No previous messages in this chat."}

Formulate a highly polite, helpful auto-reply in "${recipientName}"'s voice.
Use the context of their previous chats if relevant to address their message.
If they are asking a question that you cannot fully answer using previous chat context, politely state that you are offline right now but will review and intimate them as soon as you get back online.
Keep it concise, under 3 sentences. Do not include placeholders like [Your Name].`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text ? response.text.trim() : `I am currently away, but I will review and intimate you as soon as I return.`;
  } catch (err) {
    console.error("Auto-responder error:", err);
    return `I am currently offline, but I will get back to you and intimate you once I am active.`;
  }
}

// ==========================================
// REST API ROUTING ENDPOINTS
// ==========================================

// Auth Login / Register
app.post("/api/auth/login", (req, res) => {
  const { email, username, password } = req.body;
  if (!email && !username) {
    return res.status(400).json({ error: "Email or username is required" });
  }

  // Enforce domain validation
  if (email && !email.toLowerCase().endsWith("@npci.org.in")) {
    return res.status(403).json({ error: "Access Denied: Only users with the @npci.org.in domain are authorized to login." });
  }

  // Find user by email or username
  let user = users.find(u => 
    (email && u.email.toLowerCase() === email.toLowerCase()) || 
    (username && u.username.toLowerCase() === username.toLowerCase())
  );

  if (!user) {
    return res.status(404).json({ error: "User not found. Please register an account first." });
  }

  // Validate password
  if (user.password && user.password !== password) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  user.status = "online";
  broadcastEvent("all", "status:changed", { userId: user.id, status: "online" });
  addAuditLog("User Login", user.id, `${user.username} logged into NPCI Forum.`);

  res.json(user);
});

app.post("/api/auth/register", async (req, res) => {
  const { username, email, role, department, password, bio, reportsTo } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }

  // Enforce domain validation
  if (!email.toLowerCase().endsWith("@npci.org.in")) {
    return res.status(403).json({ error: "Access Denied: Only users with the @npci.org.in domain can register an account." });
  }

  const existingByEmail = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingByEmail) {
    return res.status(400).json({ error: "User already exists with this email" });
  }

  const existingByUsername = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existingByUsername) {
    return res.status(400).json({ error: "Username is already taken" });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    username,
    email,
    role: role || "employee",
    status: "online",
    avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
    department: department || "Operations",
    bio: bio || "",
    password,
    reportsTo: reportsTo || undefined
  };

  users.push(newUser);

  // Sync to local Vector DB
  try {
    const userProfileText = `User: ${newUser.username}, Role: ${newUser.role}, Department: ${newUser.department}, Bio: ${newUser.bio}`;
    const embedding = await vectorDb.generateEmbedding(userProfileText);
    vectorDb.insert(`user-profile-${newUser.id}`, embedding, {
      docId: newUser.id,
      docTitle: `User Profile: ${newUser.username}`,
      section: newUser.department,
      text: userProfileText,
      version: "1.0"
    });
  } catch (err) {
    console.warn("Vector DB insert warning for new user:", err);
  }

  // Sync to Python Backend & PostgreSQL DB
  try {
    const backendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
    await fetch(`${backendUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser)
    }).catch(e => console.warn("Sync to Python Backend warning:", e));
  } catch (err) {
    console.warn("User DB sync warning:", err);
  }

  addAuditLog("User Registered", newUser.id, `User ${username} manually registered. Saved to PostgreSQL DB & Vector DB.`);
  res.json(newUser);
});

// User Management
app.get("/api/users", (req, res) => {
  const activeUserId = req.headers["x-user-id"] as string;
  const computedUsers = users.map(u => {
    if (u.id === "npci_assistant") {
      return { ...u, status: "online" as const };
    }
    const isConnected = connectedClients.has(u.id) || (activeUserId && u.id === activeUserId);
    return {
      ...u,
      status: isConnected ? (u.status === "offline" ? "online" as const : u.status) : "offline" as const
    };
  });
  res.json(computedUsers);
});

app.put("/api/users/:id/role", (req, res) => {
  const { id } = req.params;
  const { role, actorId } = req.body;
  
  const targetUser = users.find(u => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const oldRole = targetUser.role;
  targetUser.role = role as UserRole;
  addAuditLog("Role Assigned", actorId, `Changed user ${targetUser.username} role from ${oldRole} to ${role}`);
  broadcastEvent("all", "users:updated", users);
  res.json(targetUser);
});

app.put("/api/users/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const targetUser = users.find(u => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  targetUser.status = status as UserStatus;
  broadcastEvent("all", "status:changed", { userId: id, status });
  res.json(targetUser);
});

app.put("/api/users/:id/profile", (req, res) => {
  const { id } = req.params;
  const { username, email, avatar, bio, department, reportsTo } = req.body;

  const targetUser = users.find(u => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  // Check if username is taken by another user
  if (username && username.toLowerCase() !== targetUser.username.toLowerCase()) {
    const existing = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "Username is already taken" });
    }
  }

  // Update fields
  if (username) targetUser.username = username;
  if (email) targetUser.email = email;
  if (avatar) targetUser.avatar = avatar;
  if (bio !== undefined) targetUser.bio = bio;
  if (department) targetUser.department = department;
  if (reportsTo !== undefined) targetUser.reportsTo = reportsTo;

  addAuditLog("Profile Updated", id, `Updated profile details for user ${targetUser.username}.`);
  broadcastEvent("all", "users:updated", users);
  res.json(targetUser);
});

app.put("/api/users/:id/reports-to", (req, res) => {
  const { id } = req.params;
  const { reportsTo } = req.body;

  const targetUser = users.find(u => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  targetUser.reportsTo = reportsTo;
  addAuditLog("Hierarchy Line Updated", id, `Updated reporting structure for ${targetUser.username}. reportsTo: ${reportsTo}`);
  broadcastEvent("all", "users:updated", users);
  res.json(targetUser);
});

// Communities
app.get("/api/communities", (req, res) => {
  res.json(communities);
});

app.post("/api/communities", (req, res) => {
  const { name, description, isPrivate, createdBy, allowedUserIds, allowedDepartments } = req.body;
  if (!name || !createdBy) {
    return res.status(400).json({ error: "Name and creator ID are required" });
  }

  // Prevent duplicate community names
  const normalizedName = name.replace(/\s+/g, "-").toLowerCase();
  const duplicate = communities.find(c => c.name.toLowerCase() === normalizedName);
  if (duplicate) {
    return res.status(400).json({ error: "A community with this name already exists. Please choose a unique name." });
  }

  const newComm: Community = {
    id: `comm-${Date.now()}`,
    name: normalizedName,
    description: description || "",
    createdBy,
    createdAt: new Date().toISOString(),
    isPrivate: !!isPrivate,
    memberIds: [createdBy, "npci_assistant"], // Always include AI assistant for indexing
    allowedUserIds: allowedUserIds || [],
    allowedDepartments: allowedDepartments || []
  };

  communities.push(newComm);
  addAuditLog("Community Created", createdBy, `Created new community: #${name}`);
  broadcastEvent("all", "community:created", newComm);
  res.json(newComm);
});

// Threads & Discussions
app.get("/api/communities/:id/threads", (req, res) => {
  const { id } = req.params;
  const commThreads = threads.filter(t => t.communityId === id);
  res.json(commThreads);
});

app.post("/api/communities/:id/threads", async (req, res) => {
  const { id } = req.params;
  const { title, content, authorId, attachments, tags: customTags } = req.body;
  if (!title || !content || !authorId) {
    return res.status(400).json({ error: "Title, content and author are required" });
  }

  // Handle S3 attachments
  let processedAttachments: Attachment[] | undefined = undefined;
  if (attachments && Array.isArray(attachments)) {
    processedAttachments = [];
    for (const file of attachments) {
      if (file.url && file.url.startsWith("data:")) {
        const objectName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        const s3Url = await minioClient.putObject(objectName, file.url, file.type);
        processedAttachments.push({ ...file, url: s3Url });
      } else {
        processedAttachments.push(file);
      }
    }
  }

  // FR-3: AI Tag generation (only if not already provided)
  const tags = customTags && Array.isArray(customTags) && customTags.length > 0
    ? customTags
    : await generateAiTags(title, content);

  const newThread: Thread = {
    id: `thread-${Date.now()}`,
    communityId: id,
    title,
    content,
    authorId,
    createdAt: new Date().toISOString(),
    upvotes: [],
    isPinned: false,
    tags,
    attachments: processedAttachments
  };

  threads.unshift(newThread);
  notifyMentions(content, `You were mentioned in a topic: ${title}`, newThread.id, authorId);
  
  addAuditLog("Thread Posted", authorId, `Posted thread "${title}" inside community ${id}.`);
  broadcastEvent("all", "thread:created", { thread: newThread, communityId: id });

  // Mentions logic
  // Look for @username in content and generate notifications
  const mentionMatches = content.match(/@(\w+)/g);
  if (mentionMatches) {
    mentionMatches.forEach((match: string) => {
      const username = match.substring(1);
      const mentionedUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (mentionedUser && mentionedUser.id !== authorId) {
        const notif: Notification = {
          id: `notif-${Date.now()}-${mentionedUser.id}`,
          userId: mentionedUser.id,
          type: "mention",
          title: "You were mentioned in a thread",
          content: `${users.find(u => u.id === authorId)?.username || "Someone"} mentioned you in "${title}"`,
          sourceId: newThread.id,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        notifications.unshift(notif);
        broadcastEvent([mentionedUser.id], "notification:received", notif);
      }
    });
  }

  res.json(newThread);
});

app.post("/api/threads/:id/upvote", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const thread = threads.find(t => t.id === id);
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }

  const idx = thread.upvotes.indexOf(userId);
  if (idx > -1) {
    thread.upvotes.splice(idx, 1); // Remove upvote
  } else {
    thread.upvotes.push(userId); // Add upvote
  }

  broadcastEvent("all", "thread:updated", thread);
  res.json(thread);
});

app.post("/api/threads/:id/pin", (req, res) => {
  const { id } = req.params;
  const { isPinned, actorId } = req.body;

  const thread = threads.find(t => t.id === id);
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }

  thread.isPinned = !!isPinned;
  addAuditLog("Thread Pinned", actorId, `${isPinned ? "Pinned" : "Unpinned"} thread ID ${id}: "${thread.title}"`);
  broadcastEvent("all", "thread:updated", thread);
  res.json(thread);
});

app.delete("/api/threads/:id", (req, res) => {
  const { id } = req.params;
  const { actorId } = req.query;

  const threadIndex = threads.findIndex(t => t.id === id);
  if (threadIndex === -1) {
    return res.status(404).json({ error: "Thread not found" });
  }

  const thread = threads[threadIndex];
  const actor = users.find(u => u.id === actorId);
  const isAdmin = actor && actor.role === "platform_admin";

  if (thread.authorId !== actorId && !isAdmin) {
    return res.status(403).json({ error: "Only the thread creator or a Platform Admin can delete this discussion." });
  }

  // Find all users who replied (comments) or liked (upvoted) this thread.
  const threadComments = comments.filter(c => c.threadId === id);
  const repliers = threadComments.map(c => c.authorId);
  const likers = thread.upvotes;

  // Combine unique users, excluding the author themselves
  const affectedUsersSet = new Set([...repliers, ...likers]);
  affectedUsersSet.delete(thread.authorId);
  const affectedUsers = Array.from(affectedUsersSet);

  const authorName = users.find(u => u.id === thread.authorId)?.username || "The author";

  // Create notifications in-memory for all affected users
  affectedUsers.forEach(uid => {
    const notif: Notification = {
      id: `notif-${Date.now()}-${uid}`,
      userId: uid,
      type: "reply",
      title: "Thread Deleted",
      content: `${authorName} deleted the discussion: "${thread.title}". All replies and likes have been removed.`,
      sourceId: "", // Thread is deleted, so empty sourceId
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifications.unshift(notif);
    
    // Broadcast notification in real-time
    broadcastEvent([uid], "notification:received", notif);
  });

  // Remove the thread
  threads.splice(threadIndex, 1);

  // Remove all related comments
  comments = comments.filter(c => c.threadId !== id);

  addAuditLog("Thread Deleted", actorId as string, `Deleted thread "${thread.title}" and notified ${affectedUsers.length} affected users.`);

  // Broadcast deletion event to all clients so they redirect or refresh
  broadcastEvent("all", "thread:deleted", { threadId: id });

  res.json({ success: true, notifiedCount: affectedUsers.length });
});

// Comments & Replies
app.get("/api/threads/:id/comments", (req, res) => {
  const { id } = req.params;
  const threadComments = comments.filter(c => c.threadId === id);
  res.json(threadComments);
});

app.post("/api/threads/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { content, authorId, parentId, attachments } = req.body;
  if (!content || !authorId) {
    return res.status(400).json({ error: "Content and author are required" });
  }

  const thread = threads.find(t => t.id === id);
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }

  // Handle S3 attachments
  let processedAttachments: Attachment[] | undefined = undefined;
  if (attachments && Array.isArray(attachments)) {
    processedAttachments = [];
    for (const file of attachments) {
      if (file.url && file.url.startsWith("data:")) {
        const objectName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        const s3Url = await minioClient.putObject(objectName, file.url, file.type);
        processedAttachments.push({ ...file, url: s3Url });
      } else {
        processedAttachments.push(file);
      }
    }
  }

  const newComment: Comment = {
    id: `comment-${Date.now()}`,
    threadId: id,
    parentId,
    content,
    authorId,
    createdAt: new Date().toISOString(),
    upvotes: [],
    attachments: processedAttachments
  };

  comments.push(newComment);
  broadcastEvent("all", "comment:created", { comment: newComment, threadId: id });

  // Mentions logic inside replies/comments
  const commentMentionMatches = content.match(/@(\w+)/g);
  if (commentMentionMatches) {
    commentMentionMatches.forEach((match: string) => {
      const username = match.substring(1);
      // Skip the NPCI assistant mention
      if (username.toLowerCase() === "npci_assistant" || username.toLowerCase() === "npci assistant" || username.toLowerCase() === "npci") {
        return;
      }
      const mentionedUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (mentionedUser && mentionedUser.id !== authorId) {
        const notif: Notification = {
          id: `notif-${Date.now()}-${mentionedUser.id}`,
          userId: mentionedUser.id,
          type: "mention",
          title: "You were mentioned in a reply",
          content: `${users.find(u => u.id === authorId)?.username || "Someone"} mentioned you in a reply inside "${thread.title}"`,
          sourceId: id,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        notifications.unshift(notif);
        broadcastEvent([mentionedUser.id], "notification:received", notif);
      }
    });
  }

  // Generate reply notification for thread author
  if (thread.authorId !== authorId) {
    const notif: Notification = {
      id: `notif-${Date.now()}`,
      userId: thread.authorId,
      type: "reply",
      title: "New reply on your thread",
      content: `${users.find(u => u.id === authorId)?.username || "A coworker"} replied to your thread "${thread.title}"`,
      sourceId: id,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifications.unshift(notif);
    broadcastEvent([thread.authorId], "notification:received", notif);
  }

  // FR-9: Trigger AI automatic reply if NPCI Assistant is explicitly mentioned
  if (content.toLowerCase().includes("@npci assistant") || content.toLowerCase().includes("@npci_assistant")) {
    // Gather conversation context
    const recentThreadComments = comments
      .filter(c => c.threadId === id)
      .slice(-10)
      .map(c => ({
        sender: users.find(u => u.id === c.authorId)?.username || "Employee",
        content: c.content
      }));

    // Trigger AI NPCI Assistant (RAG lookup)
    const question = content.replace(/@npci_assistant|@npci assistant/gi, "").trim();
    const aiAnswer = await npciAssistantRAG(question, recentThreadComments);

    const aiComment: Comment = {
      id: `comment-${Date.now()}-ai`,
      threadId: id,
      parentId: newComment.id,
      content: `${aiAnswer.answer}\n\n*Confidence Level: ${aiAnswer.confidence === "high" ? "✅ Grounded Policy Match" : "⚠️ Unverified Context"}*` + 
        (aiAnswer.citations.length > 0 
          ? `\n\n**Sources Cited:**\n` + aiAnswer.citations.map(cit => `- *${cit.docTitle} (v${cit.version})* - Section: *${cit.section}*`).join("\n")
          : ""),
      authorId: "npci_assistant",
      createdAt: new Date().toISOString(),
      upvotes: []
    };

    comments.push(aiComment);
    broadcastEvent("all", "comment:created", { comment: aiComment, threadId: id });
    
    // Notify user who asked
    const replyNotif: Notification = {
      id: `notif-${Date.now()}-ai`,
      userId: authorId,
      type: "reply",
      title: "NPCI Assistant answered you",
      content: `NPCI Assistant replied to your comment in "${thread.title}"`,
      sourceId: id,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifications.unshift(replyNotif);
    broadcastEvent([authorId], "notification:received", replyNotif);
  }

  res.json(newComment);
});

app.post("/api/comments/:id/upvote", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const comment = comments.find(c => c.id === id);
  if (!comment) {
    return res.status(404).json({ error: "Comment not found" });
  }

  const idx = comment.upvotes.indexOf(userId);
  if (idx > -1) {
    comment.upvotes.splice(idx, 1);
  } else {
    comment.upvotes.push(userId);
  }

  broadcastEvent("all", "comment:updated", comment);
  res.json(comment);
});

// Chats (1:1 & Groups)
app.get("/api/chats", (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "UserId query param required" });
  }

  const userChats = chats.filter(c => c.participants.includes(userId as string)).map(c => {
    const messages = chatMessages.filter(m => m.chatId === c.id);
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    return {
      ...c,
      lastMessage: lastMsg ? {
        content: lastMsg.content,
        createdAt: lastMsg.createdAt,
        senderId: lastMsg.senderId
      } : null
    };
  });
  res.json(userChats);
});

app.post("/api/chats", (req, res) => {
  const { participants, isGroup, name } = req.body;
  if (!participants || participants.length < 2) {
    return res.status(400).json({ error: "At least 2 participants required" });
  }

  // Check if 1:1 chat already exists
  if (!isGroup && participants.length === 2) {
    const existing = chats.find(c => !c.isGroup && c.participants.includes(participants[0]) && c.participants.includes(participants[1]));
    if (existing) {
      return res.json(existing);
    }
  }

  const newChat: Chat = {
    id: `chat-${Date.now()}`,
    name: isGroup ? (name || "Group Chat") : undefined,
    creatorId: isGroup ? participants[0] : undefined,
    isGroup: !!isGroup,
    participants,
    createdAt: new Date().toISOString()
  };

  chats.push(newChat);
  broadcastEvent(participants, "chat:created", newChat);
  res.json(newChat);
});

app.get("/api/chats/:id/messages", (req, res) => {
  const { id } = req.params;
  const messages = chatMessages.filter(m => m.chatId === id);
  res.json(messages);
});

app.post("/api/chats/:id/messages", async (req, res) => {
  const { id } = req.params;
  const { senderId, content } = req.body;
  if (!content || !senderId) {
    return res.status(400).json({ error: "Content and senderId required" });
  }

  const chat = chats.find(c => c.id === id);
  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    chatId: id,
    senderId,
    content,
    createdAt: new Date().toISOString(),
    status: "sent",
    readBy: [senderId],
    attachments: req.body.attachments
  };

  chatMessages.push(newMessage);
  broadcastEvent(chat.participants, "message:received", newMessage);

  const sender = users.find(u => u.id === senderId);

  // FR-9: Check if destination is NPCI Assistant (direct DM)
  if (!chat.isGroup && chat.participants.includes("npci_assistant") && senderId !== "npci_assistant") {
    // Collect DM history
    const history = chatMessages
      .filter(m => m.chatId === id)
      .slice(-10)
      .map(m => ({
        sender: m.senderId === "npci_assistant" ? "NPCI Assistant" : (sender?.username || "Employee"),
        content: m.content
      }));

    // Generate response using grounded RAG
    const response = await npciAssistantRAG(content, history);
    
    const aiMessage: ChatMessage = {
      id: `msg-${Date.now()}-ai`,
      chatId: id,
      senderId: "npci_assistant",
      content: `${response.answer}\n\n*Confidence Level: ${response.confidence === "high" ? "✅ Grounded Policy Match" : "⚠️ Unverified Context"}*` + 
        (response.citations.length > 0 
          ? `\n\n**Sources Cited:**\n` + response.citations.map(cit => `- *${cit.docTitle} (v${cit.version})* - Section: *${cit.section}*`).join("\n")
          : ""),
      createdAt: new Date().toISOString(),
      status: "read",
      readBy: [senderId, "npci_assistant"]
    };

    chatMessages.push(aiMessage);
    broadcastEvent(chat.participants, "message:received", aiMessage);
    
    // Send a DM notification
    const dmNotif: Notification = {
      id: `notif-${Date.now()}-ai`,
      userId: senderId,
      type: "dm",
      title: "NPCI Assistant",
      content: response.answer.substring(0, 60) + "...",
      sourceId: id,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifications.unshift(dmNotif);
    broadcastEvent([senderId], "notification:received", dmNotif);
    
    return res.json(newMessage);
  }

  // FR-7: Check if recipient is offline/away for AI Auto-Responder
  if (!chat.isGroup) {
    const recipientId = chat.participants.find(p => p !== senderId);
    if (recipientId) {
      const recipient = users.find(u => u.id === recipientId);
      if (recipient && (recipient.status === "away" || recipient.status === "offline")) {
        // Retrieve previous 10 messages for context
        const chatHistory = chatMessages
          .filter(m => m.chatId === id)
          .slice(-10)
          .map(m => `[${m.senderId === senderId ? (sender?.username || "Coworker") : recipient.username}]: ${m.content}`);

        // Generate automatic response using history
        const autoText = await generateAiAutoResponse(sender?.username || "Coworker", recipient.username, content, chatHistory);
        
        // Let's defer slightly to look natural
        setTimeout(async () => {
          const autoMessage: ChatMessage = {
            id: `msg-${Date.now()}-auto`,
            chatId: id,
            senderId: recipient.id,
            content: `🤖 *[AI Auto-Responder]*: ${autoText}`,
            createdAt: new Date().toISOString(),
            status: "delivered",
            readBy: [senderId]
          };
          chatMessages.push(autoMessage);
          broadcastEvent(chat.participants, "message:received", autoMessage);

          // Queue summarized notification for when recipient returns
          const summaryNotif: Notification = {
            id: `notif-${Date.now()}-summary`,
            userId: recipient.id,
            type: "dm",
            title: `Missed DM from ${sender?.username}`,
            content: `While you were ${recipient.status}, ${sender?.username} messaged: "${content.substring(0, 40)}..."`,
            sourceId: id,
            isRead: false,
            createdAt: new Date().toISOString()
          };
          notifications.unshift(summaryNotif);
          // (We don't broadcast to recipient yet, but it's in their notifications list when they load)
        }, 1500);
      }
    }
  }

  // For other human participants, push real-time notifications if not active in chat
  chat.participants.forEach(pid => {
    if (pid !== senderId) {
      const notif: Notification = {
        id: `notif-${Date.now()}-${pid}`,
        userId: pid,
        type: "dm",
        title: `Message from ${sender?.username || "Coworker"}`,
        content: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
        sourceId: id,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      notifications.unshift(notif);
      broadcastEvent([pid], "notification:received", notif);
    }
  });

  res.json(newMessage);
});

// Notifications
app.get("/api/notifications", (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "UserId required" });
  }
  const userNotifs = notifications.filter(n => n.userId === userId);
  res.json(userNotifs);
});

app.post("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  const notif = notifications.find(n => n.id === id);
  if (notif) {
    notif.isRead = true;
  }
  res.json({ success: true });
});

// Policies & Document Ingestion (Compliance Admins)
app.get("/api/policies", (req, res) => {
  res.json(policyDocuments);
});

app.post("/api/compliance/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }
    const response = await npciAssistantRAG(question, []);
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/policies", async (req, res) => {
  const { title, description, fileName, version, uploadedBy, chunks, type } = req.body;
  if (!title || !version || !uploadedBy || !chunks || chunks.length === 0) {
    return res.status(400).json({ error: "Title, version, uploadedBy and policy sections are required" });
  }

  // Check if updating an existing policy to detect diffs (FR-11)
  const existingIndex = policyDocuments.findIndex(p => p.title.toLowerCase() === title.toLowerCase());
  let changelog = "";
  const docType = type === "complaint" ? "complaint" : "spec";
  const docIdForDb = existingIndex > -1 ? policyDocuments[existingIndex].id : `policy-${Date.now()}`;

  if (existingIndex > -1) {
    const oldPolicy = policyDocuments[existingIndex];
    // Generate AI plain-language diff summary
    changelog = await generatePolicyChangelog(title, oldPolicy, chunks);
    
    // Update version
    policyDocuments[existingIndex] = {
      id: oldPolicy.id,
      title,
      description: description || oldPolicy.description,
      fileName: fileName || oldPolicy.fileName,
      version,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      chunks,
      type: docType
    };
  } else {
    // Brand new policy
    const newPolicy: PolicyDocument = {
      id: docIdForDb,
      title,
      description: description || "",
      fileName: fileName || "policy_document.pdf",
      version,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      chunks,
      type: docType
    };
    policyDocuments.push(newPolicy);
    changelog = `#### 🎉 New Compliance ${docType === "complaint" ? "Complaint Report" : "Document"} Uploaded: ${title}\n- **Version**: ${version}\n- **Status**: Active internal compliance ${docType === "complaint" ? "complaint" : "policy"}.\n- Sections added: ${chunks.map((c: any) => `*${c.section}*`).join(", ")}`;
  }

  // Index chunks in simulated Vector DB
  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    const recordId = `${docIdForDb}-chunk-${index}-${Date.now()}`;
    const embedding = await vectorDb.generateEmbedding(chunk.text);
    vectorDb.insert(recordId, embedding, {
      docId: docIdForDb,
      docTitle: title,
      section: chunk.section,
      text: chunk.text,
      version
    });
  }

  addAuditLog(
    existingIndex > -1 ? "Policy Version Updated" : "Policy Document Ingested",
    uploadedBy,
    `Ingested/Updated policy "${title}" to version ${version}.`
  );

  // Proactively notify all subscribed users / communities (FR-11)
  // Create a policy update post automatically in the #UPI 2.0 Compliance / RuPay communities if matched
  let matchingCommId = "comm-1"; // default to general UPI Compliance
  if (title.toLowerCase().includes("rupay")) {
    matchingCommId = "comm-2";
  }

  const systemThread: Thread = {
    id: `thread-${Date.now()}-system`,
    communityId: matchingCommId,
    title: `📢 Compliance Update: ${title} (v${version})`,
    content: `Compliance Admin **${users.find(u => u.id === uploadedBy)?.username || "Compliance"}** has released an updated version of the **${title}** policy. Below is the automatic plain-language diff and implications report:\n\n${changelog}`,
    authorId: "npci_assistant",
    createdAt: new Date().toISOString(),
    upvotes: [],
    isPinned: true,
    tags: ["Compliance", "Policy Update", "AI-Diff"],
    attachments: fileName ? [{ name: fileName, type: "application/pdf", size: "1.5 MB", url: "#" }] : []
  };

  threads.unshift(systemThread);
  broadcastEvent("all", "thread:created", { thread: systemThread, communityId: matchingCommId });

  // Broadcast notification to all employees
  users.forEach(u => {
    if (u.id !== "npci_assistant") {
      const notif: Notification = {
        id: `notif-${Date.now()}-${u.id}`,
        userId: u.id,
        type: "policy_update",
        title: `Policy Updated: ${title} (v${version})`,
        content: `A plain-language changelog has been posted inside #${communities.find(c => c.id === matchingCommId)?.name}.`,
        sourceId: systemThread.id,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      notifications.unshift(notif);
      broadcastEvent([u.id], "notification:received", notif);
    }
  });

  // Scan for @username mentions in description or chunk text (specifically for complaints)
  const fullTextToScan = `${description || ""} ` + chunks.map((c: any) => c.text || "").join(" ");
  const policyMentionMatches = fullTextToScan.match(/@(\w+)/g);
  if (policyMentionMatches) {
    policyMentionMatches.forEach((match: string) => {
      const username = match.substring(1);
      if (username.toLowerCase() === "npci_assistant" || username.toLowerCase() === "npci assistant" || username.toLowerCase() === "npci") {
        return;
      }
      const mentionedUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (mentionedUser && mentionedUser.id !== uploadedBy) {
        const notif: Notification = {
          id: `notif-${Date.now()}-${mentionedUser.id}`,
          userId: mentionedUser.id,
          type: "mention",
          title: `You were mentioned in a ${docType}`,
          content: `${users.find(u => u.id === uploadedBy)?.username || "A compliance officer"} mentioned you in the ${docType} "${title}"`,
          sourceId: systemThread.id,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        notifications.unshift(notif);
        broadcastEvent([mentionedUser.id], "notification:received", notif);
      }
    });
  }

  res.json({ success: true, changelog });
});

// Grounded Product AI Query (FR-8)
app.post("/api/ai/ask-product", async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  const answer = await askProductAi(question);
  res.json({ answer });
});

// AI Tag generation helper route
app.post("/api/ai/generate-tags", async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required to generate tags." });
  }
  try {
    const tags = await generateAiTags(title, content);
    res.json({ tags });
  } catch (error) {
    console.error("Tags generation API error:", error);
    res.status(500).json({ error: "Failed to generate tags dynamically." });
  }
});

// ==========================================
// NEW WORKSPACE FEATURES (AUTH, PROFILE, NOTES)
// ==========================================

const passwordResetTokens: { [token: string]: string } = {};
const passwordHistories: { [userId: string]: string[] } = {};
let stickyNotes: any[] = [];

// Seed initial password histories
users.forEach(u => {
  if (u.id && u.password) {
    passwordHistories[u.id] = [u.password];
  }
});

// Forgot Password Request
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required." });
  }

  const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!targetUser) {
    return res.status(404).json({ error: "No NPCI workspace account registered with this email." });
  }

  const token = `reset-token-${Date.now()}`;
  passwordResetTokens[token] = targetUser.id;

  const resetLink = `/reset-password?token=${token}`;
  addAuditLog("Forgot Password Requested", targetUser.id, `Simulated password reset link requested for ${targetUser.username}.`);

  res.json({
    success: true,
    message: "Simulation: Reset link generated successfully! (Sent to verified internal server console)",
    resetLink,
    email: targetUser.email,
  });
});

// Execute Reset Password via Token
app.post("/api/auth/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password are required." });
  }

  const userId = passwordResetTokens[token];
  if (!userId) {
    return res.status(400).json({ error: "Invalid, expired, or non-existent password reset token." });
  }

  const targetUser = users.find(u => u.id === userId);
  if (!targetUser) {
    return res.status(404).json({ error: "User associated with token not found." });
  }

  // Password history validation (cannot reuse last 3 passwords)
  if (!passwordHistories[userId]) {
    passwordHistories[userId] = [];
  }
  if (passwordHistories[userId].includes(newPassword)) {
    return res.status(400).json({ error: "Security Policy Violation: Your new password cannot be the same as any of your last 3 passwords!" });
  }

  // Update password and append to history
  targetUser.password = newPassword;
  passwordHistories[userId].push(newPassword);
  if (passwordHistories[userId].length > 3) {
    passwordHistories[userId].shift();
  }

  // Invalidate token
  delete passwordResetTokens[token];

  addAuditLog("Password Reset Completed", userId, `Reset password successfully for user ${targetUser.username} using reset token.`);
  res.json({ success: true, message: "Password reset successfully! You can now log in." });
});

// Manual Profile Password Change
app.put("/api/users/:id/password", (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "New password is required." });
  }

  const targetUser = users.find(u => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found." });
  }

  // Password history validation (cannot reuse last 3 passwords)
  if (!passwordHistories[id]) {
    passwordHistories[id] = [];
  }
  if (passwordHistories[id].includes(password)) {
    return res.status(400).json({ error: "Security Policy Violation: Your new password cannot be the same as any of your last 3 passwords!" });
  }

  // Update password and history
  targetUser.password = password;
  passwordHistories[id].push(password);
  if (passwordHistories[id].length > 3) {
    passwordHistories[id].shift();
  }

  addAuditLog("Manual Password Changed", id, `Manually changed password for user ${targetUser.username} from profile settings.`);
  res.json({ success: true, message: "Password updated successfully!" });
});

// Complete User Threads Fetch
app.get("/api/users/:id/threads", (req, res) => {
  const { id } = req.params;
  const userThreads = threads.filter(t => t.authorId === id);
  res.json(userThreads);
});

// Complete User Comments Fetch
app.get("/api/users/:id/comments", (req, res) => {
  const { id } = req.params;
  const userComments = comments.filter(c => c.authorId === id);
  res.json(userComments);
});

// Sticky Notes APIs
app.get("/api/sticky-notes", (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized. Missing user header." });
  }
  const userNotes = stickyNotes.filter(n => n.userId === userId);
  res.json(userNotes);
});

app.post("/api/sticky-notes", (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized. Missing user header." });
  }
  const { content, color } = req.body;

  const newNote = {
    id: `note-${Date.now()}`,
    userId,
    content: content || "",
    color: color || "yellow",
    createdAt: new Date().toISOString(),
  };

  stickyNotes.push(newNote);
  res.json(newNote);
});

app.put("/api/sticky-notes/:id", (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const { id } = req.params;
  const { content, color } = req.body;

  const targetNote = stickyNotes.find(n => n.id === id && n.userId === userId);
  if (!targetNote) {
    return res.status(404).json({ error: "Sticky note not found." });
  }

  if (content !== undefined) targetNote.content = content;
  if (color !== undefined) targetNote.color = color;

  res.json(targetNote);
});

app.delete("/api/sticky-notes/:id", (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const { id } = req.params;

  const initialLength = stickyNotes.length;
  stickyNotes = stickyNotes.filter(n => !(n.id === id && n.userId === userId));

  if (stickyNotes.length === initialLength) {
    return res.status(404).json({ error: "Sticky note not found." });
  }

  res.json({ success: true });
});

// Audit Logs
app.get("/api/audit-logs", (req, res) => {
  res.json(auditLogs);
});

// Admin data reset / clear dummy data endpoint
app.post("/api/admin/clear-data", (req, res) => {
  const { actorId } = req.body;
  
  // Keep only essential system user
  threads = [];
  comments = [];
  chats = chats.filter(c => c.participants.includes("npci_assistant"));
  chatMessages = chatMessages.filter(m => m.chatId === "chat-1");
  policyDocuments = [];
  notifications = [];
  
  addAuditLog("Workspace Data Cleared", actorId || "admin", "Cleared sample dummy discussions and policies for fresh manual user entry.");
  broadcastEvent("all", "data:cleared", { timestamp: new Date().toISOString() });
  
  res.json({ success: true, message: "Sample dummy data cleared. You can now manually enter fresh communities, topics, chats, and policy specs." });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "NPCI Forum Web App Frontend",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Prometheus metrics endpoint for Web App
app.get("/metrics", (req, res) => {
  const activeUsers = users.length;
  const activeCommunities = communities.length;
  const activeThreads = threads.length;
  const activeComments = comments.length;
  const uptimeSeconds = Math.floor(process.uptime());

  const metricsContent = `# HELP npci_web_app_status Health status of NPCI Web App Frontend (1 = UP)
# TYPE npci_web_app_status gauge
npci_web_app_status 1

# HELP npci_web_app_users_total Total registered users in NPCI Forum
# TYPE npci_web_app_users_total gauge
npci_web_app_users_total ${activeUsers}

# HELP npci_web_app_communities_total Total active communities
# TYPE npci_web_app_communities_total gauge
npci_web_app_communities_total ${activeCommunities}

# HELP npci_web_app_threads_total Total published threads
# TYPE npci_web_app_threads_total gauge
npci_web_app_threads_total ${activeThreads}

# HELP npci_web_app_comments_total Total comments written
# TYPE npci_web_app_comments_total gauge
npci_web_app_comments_total ${activeComments}

# HELP npci_web_app_uptime_seconds Total uptime of Web App in seconds
# TYPE npci_web_app_uptime_seconds counter
npci_web_app_uptime_seconds ${uptimeSeconds}
`;

  res.setHeader("Content-Type", "text/plain");
  res.send(metricsContent);
});



// ==========================================
// STATIC ASSET SERVING / DEV MIDDLEWARES
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

app.delete("/api/chats/:id", (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  const chatIndex = chats.findIndex(c => c.id === id);
  if (chatIndex === -1) return res.status(404).json({ error: "Chat not found" });
  
  const chat = chats[chatIndex];
  if (!chat.isGroup) return res.status(400).json({ error: "Cannot delete 1:1 chat" });
  
  const actor = users.find(u => u.id === userId);
  const isAdmin = actor && actor.role === "platform_admin";
  
  if (chat.creatorId !== userId && !isAdmin) {
    return res.status(403).json({ error: "Only the group creator can delete this group." });
  }

  // Notify participants before deletion
  broadcastEvent(chat.participants, "chat:deleted", { chatId: id });
  
  chats.splice(chatIndex, 1);
  chatMessages = chatMessages.filter(m => m.chatId !== id);
  
  res.json({ success: true });
});

app.post("/api/chats/:id/exit", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const chat = chats.find(c => c.id === id);
  if (!chat) return res.status(404).json({ error: "Chat not found" });
  if (!chat.isGroup) return res.status(400).json({ error: "Cannot exit 1:1 chat" });
  
  chat.participants = chat.participants.filter(p => p !== userId);
  broadcastEvent([...chat.participants, userId], "chat:updated", chat);
  res.json(chat);
});
