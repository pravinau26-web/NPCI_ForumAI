import React, { useState } from "react";
import { 
  FileText, Shield, Plus, Check, RefreshCw, Upload, Eye, FileSpreadsheet, 
  Trash2, Layers, BookOpen, AlertTriangle, MessageSquare, Sparkles, Search, X, Bot, Send
} from "lucide-react";
import { PolicyDocument, User, AuditLog } from "../types";
import MentionText from "./MentionText";

interface PolicyManagerProps {
  policies: PolicyDocument[];
  currentUser: User;
  onUploadPolicy: (policyData: {
    title: string;
    description: string;
    fileName: string;
    version: string;
    chunks: { section: string; text: string }[];
    type?: "spec" | "complaint";
    parentPolicyTitle?: string;
    pdfData?: string;
  }) => Promise<string>;
  auditLogs: AuditLog[];
  onViewPdf?: (fileName: string, title?: string) => void;
  onViewProfile?: (user: User) => void;
  users?: User[];
  onDeletePolicy?: (id: string) => void;
}

export default function PolicyManager({
  policies,
  currentUser,
  onUploadPolicy,
  auditLogs,
  onViewPdf,
  onViewProfile,
  users = [],
  onDeletePolicy,
}: PolicyManagerProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [titleMode, setTitleMode] = useState<"preset" | "custom">("custom");
  const [selectedPresetTitle, setSelectedPresetTitle] = useState("");
  const [customTitleInput, setCustomTitleInput] = useState("");
  const [isSubCompliance, setIsSubCompliance] = useState(false);
  const [parentPolicyTitle, setParentPolicyTitle] = useState("");

  const [complaintRefNumber, setComplaintRefNumber] = useState(() => `CMP-2026-${Math.floor(100000 + Math.random() * 900000)}`);
  const [specRefNumber, setSpecRefNumber] = useState(() => `SPEC-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("v1.0");
  const [fileName, setFileName] = useState("");
  const [uploadedPdfData, setUploadedPdfData] = useState<string | undefined>(undefined);
  const [docType, setDocType] = useState<"spec" | "complaint">("spec");
  const [sections, setSections] = useState<{ section: string; text: string }[]>([
    { section: "Operational Guidelines", text: "" },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [aiChangelogResult, setAiChangelogResult] = useState("");
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);
  const [policySearchQuery, setPolicySearchQuery] = useState("");
  const [rightTab, setRightTab] = useState<"audit" | "chat">("chat");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: "user" | "assistant", content: string, confidence?: string, citations?: any[]}[]>([
    { role: "assistant", content: "Hello! I am the Compliance Assistant. Ask me questions about NPCI policies, specs, or limits, and I will search the database to give you an answer based on uploaded documents." }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleDocTypeChange = (newType: "spec" | "complaint") => {
    setDocType(newType);
    setFormError(null);
    if (newType === "complaint") {
      setSections([
        { section: "Incident Summary & Audit Breach", text: "" },
        { section: "Root Cause & Impacted Switch Endpoints", text: "" },
        { section: "Remediation Target & SLA Directive", text: "" },
      ]);
    } else {
      setSections([
        { section: "Operational Guidelines", text: "" },
        { section: "Transaction Limits & Rules", text: "" },
      ]);
    }
  };

  const handleAskAssistant = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsChatLoading(true);
    
    try {
      const res = await fetch("/api/compliance/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.answer, 
          confidence: data.confidence, 
          citations: data.citations 
        }]);
      } else {
        setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, an error occurred while fetching the answer." }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const filteredPolicies = policies.filter((doc) => {
    const q = policySearchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      (doc.description && doc.description.toLowerCase().includes(q)) ||
      (doc.parentPolicyTitle && doc.parentPolicyTitle.toLowerCase().includes(q)) ||
      doc.chunks.some(
        (chunk) =>
          chunk.section.toLowerCase().includes(q) ||
          chunk.text.toLowerCase().includes(q)
      )
    );
  });

  const isComplianceAdmin = currentUser.role === "policy_admin" || currentUser.role === "platform_admin";

  const handleAddSection = () => {
    setSections([...sections, { section: "", text: "" }]);
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index: number, field: "section" | "text", value: string) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const activeTitle = titleMode === "preset" ? selectedPresetTitle : customTitleInput.trim();

    if (!activeTitle) {
      setFormError("Document title is required. Select an existing policy or enter a fresh custom title.");
      return;
    }

    if (activeTitle.length < 3) {
      setFormError("Document title must be at least 3 characters long.");
      return;
    }

    if (!version.trim()) {
      setFormError("Version identifier is required (e.g. v1.0, 2026.1).");
      return;
    }

    setIsSubmitting(true);
    setAiChangelogResult("");
    try {
      const defaultFileName = fileName.trim() || `${activeTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_${version.replace(/\./g, "_")}.pdf`;
      const formattedChunks = sections.map((s, idx) => {
        const textVal = s.text.trim() || `Official NPCI grounded guidelines for ${activeTitle}. Verified under FIPS-140-3 compliance framework.`;
        const secVal = s.section.trim() || `PDF Section ${idx + 1}: ${activeTitle}`;
        if (docType === "complaint" && !textVal.includes("Complaint Ref:")) {
          return {
            section: secVal,
            text: `[Complaint Ref: ${complaintRefNumber} | Spec Ref: ${specRefNumber}]\n${textVal}`
          };
        }
        return { section: secVal, text: textVal };
      });

      const changelog = await onUploadPolicy({
        title: activeTitle,
        description: description.trim(),
        fileName: defaultFileName,
        version: version.trim(),
        chunks: formattedChunks,
        type: docType,
        parentPolicyTitle: isSubCompliance && parentPolicyTitle ? parentPolicyTitle : undefined,
        pdfData: uploadedPdfData
      });
      setAiChangelogResult(changelog);

      // Reset form
      setSelectedPresetTitle("");
      setCustomTitleInput("");
      setParentPolicyTitle("");
      setIsSubCompliance(false);
      setDescription("");
      setVersion("v1.0");
      setFileName("");
      setDocType("spec");
      setSections([{ section: "Operational Guidelines", text: "" }]);
      setFormError(null);
      setShowUploadForm(false);
    } catch (err) {
      console.error(err);
      setFormError("Failed to ingest policy document. Please check connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto h-full text-left transition-colors duration-200">
      {/* Upper Title Section */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
        <div>
          <h1 className="font-bold text-slate-900 dark:text-slate-100 text-xl flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-indigo-400" />
            <span>NPCI Compliance & Policy Database</span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
            Centralized document ingestion center for UPI, RuPay, and AePS. Grounded on FIPS-compliant RAG memory.
          </p>
        </div>

        {isComplianceAdmin && (
          <button
            onClick={() => {
              setShowUploadForm(!showUploadForm);
              setFormError(null);
              setAiChangelogResult("");
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow"
          >
            <Upload className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>{showUploadForm ? "Close Ingestion Form" : "Upload New Policy / Complaint"}</span>
          </button>
        )}
      </div>

      {/* AI Changelog Notification Overlay */}
      {aiChangelogResult && (
        <div className="mb-6 bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-6 rounded-2xl border border-blue-800 shadow-2xl relative animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 mb-3 border-b border-blue-800 pb-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" />
            <h3 className="font-bold text-sm tracking-wide">AI Policy Changelog Generated Successfully!</h3>
          </div>
          <div className="text-slate-200 font-sans text-xs leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto pr-2 bg-slate-950/40 p-4 rounded-xl border border-blue-950">
            {aiChangelogResult}
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-cyan-300 font-semibold font-mono">
            <Check className="w-3.5 h-3.5" />
            <span>PROACTIVE COWORKER NOTIFICATIONS BROADCASTED OVER WEBSOCKETS</span>
          </div>
          <button
            onClick={() => setAiChangelogResult("")}
            className="absolute top-4 right-4 hover:bg-white/10 p-1 rounded-lg text-slate-300"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT TWO-THIRDS: Active Policies & Ingestion Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Policy Ingestion Composer Drawer */}
          {showUploadForm && (
            <div className="bg-white dark:bg-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Ingest Policy Spec / System Complaint</span>
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-mono font-bold px-2 py-0.5 rounded">
                  RAG Embeddings Primed
                </span>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Mode Selector: Preset vs Custom Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Document Title Source
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTitleMode("custom");
                          setFormError(null);
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition ${
                          titleMode === "custom"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        ➕ Custom New Title
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTitleMode("preset");
                          setFormError(null);
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition ${
                          titleMode === "preset"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        📋 Choose Existing Master Policy
                      </button>
                    </div>
                  </div>

                  {titleMode === "preset" ? (
                    <select
                      value={selectedPresetTitle}
                      onChange={(e) => {
                        setSelectedPresetTitle(e.target.value);
                        if (e.target.value === "NPCI UPI 2.0 Compliance Guide") {
                          setDescription("Rules regarding UPI transaction limits, MCC eligibility, merchant onboarding risk, and Unified Dispute Redressal (UDIR).");
                        } else if (e.target.value === "RuPay Card Security Protocol") {
                          setDescription("Compliance protocols for EMV card issuing, tokenization mandates, and offline contactless payments.");
                        } else if (e.target.value === "AePS Operation Guidelines 2026") {
                          setDescription("Biometric authentication standards, Micro-ATM operations, and withdrawal limit guides.");
                        }
                      }}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none"
                    >
                      <option value="">-- Select Master Document --</option>
                      <option value="NPCI UPI 2.0 Compliance Guide">NPCI UPI 2.0 Compliance Guide</option>
                      <option value="RuPay Card Security Protocol">RuPay Card Security Protocol</option>
                      <option value="AePS Operation Guidelines 2026">AePS Operation Guidelines 2026</option>
                      {policies.map(p => (
                        <option key={p.id} value={p.title}>{p.title}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Enter new policy title (e.g. AePS Operation Guidelines 2026 - Sub-Compliance Delta or Audit Complaint #402)"
                      value={customTitleInput}
                      onChange={(e) => setCustomTitleInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none font-semibold"
                    />
                  )}
                </div>

                {/* Sub-compliance parent link toggle */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isSubCompliance}
                      onChange={(e) => setIsSubCompliance(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Is this a Sub-Compliance under a Master Policy? (e.g. under AePS Operation Guidelines 2026)</span>
                  </label>

                  {isSubCompliance && (
                    <div className="pt-1">
                      <select
                        value={parentPolicyTitle}
                        onChange={(e) => setParentPolicyTitle(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 focus:outline-none"
                      >
                        <option value="">-- Select Parent Specification --</option>
                        <option value="AePS Operation Guidelines 2026">AePS Operation Guidelines 2026</option>
                        <option value="NPCI UPI 2.0 Compliance Guide">NPCI UPI 2.0 Compliance Guide</option>
                        <option value="RuPay Card Security Protocol">RuPay Card Security Protocol</option>
                        {policies.map(p => (
                          <option key={p.id} value={p.title}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      New Version Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. v1.0 or 2026.2"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      File Name (Simulated PDF)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AePS_SubCompliance_v1.0.pdf"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                    Document Classification Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleDocTypeChange("spec")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                        docType === "spec"
                          ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span>Compliance Specification</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDocTypeChange("complaint")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                        docType === "complaint"
                          ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>System Complaint / Audit Breach</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                    Brief Summary Description
                  </label>
                  <input
                    type="text"
                    placeholder="Short summary of this compliance spec or complaint report..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none"
                  />
                </div>

                {/* PDF File Upload & Auto-Chunking Dropzone */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-blue-500" />
                      <span>Upload PDF Document / Complaint File (Auto-Chunk & Vectorize)</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">PDF, TXT, DOC, MD</span>
                  </div>

                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setFileName(file.name);
                      
                      // 1. Read Data URL for Native PDF Renderer / Viewer
                      const dataReader = new FileReader();
                      dataReader.onload = async (event) => {
                        const pdfDataUrl = event.target?.result as string;
                        setUploadedPdfData(pdfDataUrl);

                        if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
                          setIsParsingPdf(true);
                          try {
                            const parseRes = await fetch("/api/policies/parse-pdf", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                pdfData: pdfDataUrl,
                                fileName: file.name,
                                docTitle: (titleMode === "preset" ? selectedPresetTitle : customTitleInput.trim()) || file.name.replace(/\.[^/.]+$/, "")
                              })
                            });

                            if (parseRes.ok) {
                              const data = await parseRes.json();
                              if (data.summary && (!description || description.trim() === "")) {
                                setDescription(data.summary);
                              }
                              if (data.chunks && Array.isArray(data.chunks) && data.chunks.length > 0) {
                                setSections(data.chunks);
                              }
                            }
                          } catch (err) {
                            console.error("Failed to parse PDF via AI:", err);
                          } finally {
                            setIsParsingPdf(false);
                          }
                        } else {
                          // Text or Markdown file
                          const textReader = new FileReader();
                          textReader.onload = (e2) => {
                            const fileContent = (e2.target?.result as string) || "";
                            setSections([{ section: `Section 1: ${file.name.replace(/\.[^/.]+$/, "")}`, text: fileContent.trim() }]);
                          };
                          textReader.readAsText(file);
                        }
                      };
                      dataReader.readAsDataURL(file);
                    }}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-300 cursor-pointer"
                  />
                  {isParsingPdf ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 py-1 font-mono animate-pulse">
                      <Sparkles className="w-4 h-4 animate-spin text-blue-500" />
                      <span>Parsing PDF & extracting clean English policy text chunks via AI...</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-mono">
                      💡 Selecting a PDF parses its contents into clean, readable English chunks, populates the vector chunk list below, and indexes them into Vector DB upon submission!
                    </p>
                  )}
                </div>

                {/* Chunks/Sections array editor */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Sub-Compliances / Grounded Policy Chunks
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Section Chunk</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {sections.map((sec, index) => (
                      <div key={index} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 relative">
                        <div className="flex justify-between items-center gap-4">
                          <input
                            type="text"
                            required
                            placeholder="Section Title (e.g. Biometric Authentication Standards)"
                            value={sec.section}
                            onChange={(e) => handleSectionChange(index, "section", e.target.value)}
                            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 w-2/3 focus:outline-none"
                          />
                          {sections.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSection(index)}
                              className="text-rose-500 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <textarea
                          placeholder="Section text guidelines... Write descriptive specifications so the AI RAG engine can ground and cite properly!"
                          value={sec.text}
                          onChange={(e) => handleSectionChange(index, "text", e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-2.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 h-20 resize-none focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Indexing & Running AI Diff...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ingest Policy & Broadcast</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Current policy Database Cards */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-750 dark:text-slate-200 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-550 dark:text-slate-450" />
                <span>Active Specifications & Complaints ({filteredPolicies.length})</span>
              </h3>
              
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search by title, specs, or sections..."
                  value={policySearchQuery}
                  onChange={(e) => setPolicySearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-500 pl-8.5 pr-8 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                />
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                {policySearchQuery && (
                  <button
                    onClick={() => setPolicySearchQuery("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-650 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredPolicies.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-8 rounded-2xl text-center">
                <p className="text-sm text-slate-450 italic">No specifications or complaints matched your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPolicies.map((doc) => {
                  const isExpanded = expandedPolicyId === doc.id;
                  return (
                    <div 
                      key={doc.id} 
                      onClick={() => setExpandedPolicyId(isExpanded ? null : doc.id)}
                      className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer text-left ${
                        isExpanded 
                          ? "border-blue-500 ring-2 ring-blue-500/20 col-span-1 md:col-span-2 shadow-md" 
                          : "border-slate-200 dark:border-slate-800 hover:shadow-md"
                      }`}
                    >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {doc.type === "complaint" ? (
                            <span className="text-[9px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/40 uppercase tracking-wider">
                              Complaint
                            </span>
                          ) : (
                            <span className="text-[9px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/40 uppercase tracking-wider">
                              Specification
                            </span>
                          )}
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            Ver: {doc.version}
                          </span>
                          <span className="text-[9px] bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800 uppercase tracking-wider">
                            {isExpanded ? "Collapse" : "Inspect"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {doc.parentPolicyTitle && (
                          <div className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900/50 mb-1">
                            <span>Sub-Compliance under:</span>
                            <span className="font-extrabold">{doc.parentPolicyTitle}</span>
                          </div>
                        )}
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug">{doc.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-left">
                          <MentionText text={doc.description} users={users} onViewProfile={onViewProfile} />
                        </p>
                      </div>
                    </div>

                    {/* Grounded policy Chunks */}
                    {isExpanded && (
                      <div className="mt-2 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3.5 animate-in slide-in-from-top-2 duration-150">
                        <h5 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 animate-pulse" />
                          <span>Active Grounded Specifications</span>
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {doc.chunks.map((chunk, idx) => (
                            <div 
                              key={idx} 
                              onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking inner content
                              className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/50 dark:border-slate-850 space-y-1.5 hover:border-slate-300 dark:hover:border-slate-700 transition"
                            >
                              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1 flex justify-between items-center">
                                <span>{chunk.section}</span>
                                <span className="text-[8px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-mono">SPEC {idx + 1}</span>
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans text-left">
                                <MentionText text={chunk.text} users={users} onViewProfile={onViewProfile} />
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                        {(() => {
                          const creator = users.find(u => u.id === doc.uploadedBy);
                          if (creator) {
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onViewProfile) onViewProfile(creator);
                                }}
                                className="flex items-center gap-1 hover:opacity-80 transition cursor-pointer text-left truncate"
                                title={`Uploaded by Compliance Officer @${creator.username}`}
                              >
                                <img
                                  src={creator.avatar}
                                  alt={creator.username}
                                  className="w-4 h-4 rounded-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="text-[10px] font-bold text-slate-500 hover:text-blue-500 truncate">
                                  @{creator.username}
                                </span>
                              </button>
                            );
                          }
                          return <span className="text-[10px] text-slate-400 font-mono">System</span>;
                        })()}
                      </div>

                      <div className="flex items-center gap-2">
                        {(() => {
                          const isComplaint = doc.type === "complaint";
                          const canDeleteComplaint = currentUser.role === "platform_admin" || currentUser.role === "policy_admin" || currentUser.role === "lead";
                          const canDeleteDoc = isComplaint 
                            ? canDeleteComplaint 
                            : (currentUser.role === "platform_admin" || currentUser.role === "policy_admin" || currentUser.role === "lead" || doc.uploadedBy === currentUser.id);

                          if (canDeleteDoc) {
                            return (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to delete ${isComplaint ? "complaint record" : "document"} "${doc.title}"?`)) {
                                    if (onDeletePolicy) {
                                      onDeletePolicy(doc.id);
                                    } else {
                                      try {
                                        const res = await fetch(`/api/policies/${doc.id}?actorId=${currentUser.id}`, {
                                          method: "DELETE",
                                          headers: { "x-user-id": currentUser.id }
                                        });
                                        if (!res.ok) {
                                          const err = await res.json();
                                          alert(err.error || "Failed to delete document.");
                                        }
                                      } catch (err) {
                                        alert("Network error deleting document.");
                                      }
                                    }
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                                title={isComplaint ? "Delete Complaint Record (Admin Authorized)" : "Delete Document"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            );
                          } else if (isComplaint) {
                            return (
                              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono px-2 py-1 rounded-md font-bold uppercase" title="Deleting complaints is restricted to Compliance Admins and Platform Administrators">
                                Restricted Record
                              </span>
                            );
                          }
                          return null;
                        })()}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewPdf) onViewPdf(doc.fileName, doc.title);
                          }}
                          className="flex items-center gap-1 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded-lg shadow-xs transition cursor-pointer"
                          title="Open Interactive PDF Reader"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View PDF</span>
                        </button>
                        <span className="text-[10px] bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 px-2 py-1 rounded font-bold uppercase tracking-wider font-mono">
                          {doc.chunks.length} pages
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>
        {/* RIGHT ONE-THIRD: Audit Logs & Assistant */}
        <div className="space-y-4 flex flex-col h-full max-h-[85vh]">
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setRightTab("chat")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                rightTab === "chat" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>
            <button
              onClick={() => setRightTab("audit")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                rightTab === "audit" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Audit Logs</span>
            </button>
          </div>
          
          {rightTab === "audit" ? (
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex-1 overflow-y-auto space-y-3.5 scrollbar-thin">
              {auditLogs.length === 0 ? (
                <p className="text-center text-slate-400 dark:text-slate-500 text-xs py-4">No audit actions recorded.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="border-b border-slate-100 dark:border-slate-850 pb-3 last:border-0 last:pb-0 text-left space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{log.action}</span>
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">{log.details}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-mono">
                      Actor: {log.actorName} ({log.actorId.substring(0, 8)})
                    </p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[90%] p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                      msg.role === "user" 
                        ? "bg-blue-600 text-white rounded-br-none" 
                        : "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none"
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.confidence && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] flex items-center gap-1 font-bold">
                          {msg.confidence === "high" ? <span className="text-emerald-600 dark:text-emerald-400">✅ Grounded Source</span> : <span className="text-amber-600 dark:text-amber-400">⚠️ Unverified Info</span>}
                        </div>
                      )}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Grounded Sources (Click to View):</p>
                          {msg.citations.map((c, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (onViewPdf) {
                                  onViewPdf(c.fileName || "UPI_Compliance_v2.1.pdf", c.docTitle);
                                }
                              }}
                              className="w-full text-left text-[10px] bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800/80 px-2.5 py-1.5 rounded-lg font-mono text-blue-700 dark:text-blue-300 truncate transition cursor-pointer flex items-center gap-1.5 shadow-2xs group"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="truncate font-semibold">{c.docTitle} (v{c.version}) — {c.section}</span>
                              <Eye className="w-3 h-3 text-blue-500 shrink-0 ml-auto opacity-70 group-hover:opacity-100" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-start">
                    <div className="max-w-[85%] p-3 rounded-2xl text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none flex gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                      <span>Searching compliance documents...</span>
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleAskAssistant} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask policy questions..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 dark:text-slate-100 placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-xl transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
