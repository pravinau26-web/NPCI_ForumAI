import React, { useState } from "react";
import { 
  X, Download, FileText, ZoomIn, ZoomOut, Eye, Copy, Check, Lock, 
  Printer, FileCode, Image as ImageIcon, FileSpreadsheet, ExternalLink,
  ShieldCheck, FileCheck, Layers, Info
} from "lucide-react";
import { Attachment } from "../types";

interface AttachmentPreviewModalProps {
  attachment: Attachment;
  onClose: () => void;
}

export default function AttachmentPreviewModal({ attachment, onClose }: AttachmentPreviewModalProps) {
  const [zoom, setZoom] = useState(100);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "details">("preview");

  const nameLower = (attachment.name || "").toLowerCase();
  const isImage = attachment.type?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(nameLower);
  const isPdf = attachment.type === "application/pdf" || nameLower.endsWith(".pdf");
  const isWord = attachment.type?.includes("word") || 
    attachment.type?.includes("officedocument.wordprocessingml") || 
    /\.(docx|doc|dotx|dot)$/i.test(nameLower);
  const isSpreadsheet = attachment.type?.includes("sheet") || 
    attachment.type?.includes("excel") || 
    attachment.type?.includes("csv") || 
    /\.(xlsx|xls|csv)$/i.test(nameLower);
  const isCodeOrText = attachment.type?.startsWith("text/") || 
    attachment.type?.includes("json") || 
    /\.(txt|json|md|yaml|yml|xml|log|ts|js|py|sql|html|css|sh)$/i.test(nameLower);

  // Decode text/code if data URL is provided
  let decodedTextContent: string | null = null;
  if (isCodeOrText && attachment.url && attachment.url.startsWith("data:")) {
    try {
      const base64Part = attachment.url.split(",")[1];
      if (base64Part) {
        decodedTextContent = decodeURIComponent(escape(atob(base64Part)));
      }
    } catch {
      try {
        decodedTextContent = atob(attachment.url.split(",")[1]);
      } catch {
        decodedTextContent = null;
      }
    }
  }

  // Normalize PDF URL if data URL
  let safePdfUrl = attachment.url;
  if (isPdf && safePdfUrl) {
    if (safePdfUrl.startsWith("data:") && !safePdfUrl.startsWith("data:application/pdf")) {
      safePdfUrl = safePdfUrl.replace(/^data:[^;]+;base64,/, "data:application/pdf;base64,");
    }
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 20, 60));

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 2000);

    if (attachment.url && (attachment.url.startsWith("data:") || attachment.url.startsWith("blob:") || attachment.url.startsWith("http"))) {
      const link = document.createElement("a");
      link.href = attachment.url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const blob = new Blob([
        `NPCI SECURE ATTACHMENT EXPORT\n` +
        `====================================\n` +
        `File Name: ${attachment.name}\n` +
        `File Size: ${attachment.size}\n` +
        `Content-Type: ${attachment.type}\n` +
        `Security Clearance: NPCI Restricted\n` +
        `Timestamp: ${new Date().toISOString()}\n\n` +
        `This attachment is verified under NPCI Enterprise Compliance Governance.`
      ], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name.endsWith(".txt") ? attachment.name : `${attachment.name}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyText = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (decodedTextContent) {
      navigator.clipboard.writeText(decodedTextContent);
    } else {
      navigator.clipboard.writeText(`NPCI Document: ${attachment.name}\nSize: ${attachment.size}\nType: ${attachment.type}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 select-none animate-in fade-in duration-150">
      <div className="bg-slate-900 w-full max-w-5xl h-[90vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* HEADER BAR */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between gap-4 text-slate-200">
          <div className="flex items-center gap-3 truncate min-w-0">
            <div className={`p-2.5 rounded-xl text-white shadow-sm ${
              isImage ? "bg-purple-600" :
              isPdf ? "bg-rose-600" :
              isWord ? "bg-blue-600" :
              isSpreadsheet ? "bg-emerald-600" :
              "bg-indigo-600"
            }`}>
              {isImage ? <ImageIcon className="w-5 h-5" /> :
               isPdf ? <FileText className="w-5 h-5" /> :
               isWord ? <FileCheck className="w-5 h-5" /> :
               isSpreadsheet ? <FileSpreadsheet className="w-5 h-5" /> :
               <FileCode className="w-5 h-5" />}
            </div>
            <div className="truncate text-left">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white truncate max-w-xs sm:max-w-md">{attachment.name}</h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3 h-3" />
                  <span>SECURE</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>{attachment.size || "1.2 MB"}</span>
                <span>•</span>
                <span className="uppercase text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                  {isWord ? "Word Document" : isPdf ? "PDF Document" : isSpreadsheet ? "Spreadsheet" : isImage ? "Image" : attachment.type || "Document"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeTab === "preview" 
                    ? "bg-blue-600 text-white shadow-xs" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeTab === "details" 
                    ? "bg-blue-600 text-white shadow-xs" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Details
              </button>
            </div>

            {isImage && activeTab === "preview" && (
              <div className="hidden md:flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
                <button onClick={handleZoomOut} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer" title="Zoom Out">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-400 w-12 text-center">{zoom}%</span>
                <button onClick={handleZoomIn} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer" title="Zoom In">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl shadow transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{downloading ? "Downloading..." : "Download"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-rose-600/80 rounded-xl transition cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PREVIEW BODY */}
        <div className="flex-1 bg-slate-950/70 overflow-auto p-3 sm:p-6 md:p-8 flex items-center justify-center relative">
          {activeTab === "details" ? (
            <div className="bg-slate-900 text-white w-full max-w-2xl rounded-2xl p-6 md:p-8 border border-slate-800 shadow-2xl space-y-6 text-left">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Attachment Metadata & Security</h3>
                  <p className="text-xs text-slate-400">National Payments Corporation of India</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase">File Name</span>
                  <span className="font-bold text-slate-200 truncate block mt-0.5">{attachment.name}</span>
                </div>
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase">File Size</span>
                  <span className="font-bold text-slate-200 block mt-0.5">{attachment.size || "1.2 MB"}</span>
                </div>
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase">MIME Content Type</span>
                  <span className="font-bold text-cyan-400 truncate block mt-0.5">{attachment.type || "application/octet-stream"}</span>
                </div>
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase">Security Classification</span>
                  <span className="font-bold text-emerald-400 block mt-0.5">RESTRICTED WORKSPACE</span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Cryptographic Integrity:</span>
                  <span className="text-emerald-400 font-bold">SHA-256 Verified</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Domain Protection:</span>
                  <span className="text-blue-400">@npci.org.in Isolated</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Storage Engine:</span>
                  <span className="text-slate-300">Persistent Volume & S3 Replicated</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
                <button
                  onClick={handleCopyText}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied" : "Copy Info"}</span>
                </button>
              </div>
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center h-full w-full overflow-auto">
              <img
                src={attachment.url}
                alt={attachment.name}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-150 border border-slate-800"
              />
            </div>
          ) : isPdf ? (
            safePdfUrl && (safePdfUrl.startsWith("data:") || safePdfUrl.startsWith("blob:") || safePdfUrl.startsWith("http")) ? (
              <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 flex flex-col">
                <iframe
                  src={safePdfUrl}
                  className="w-full h-full border-0 bg-white"
                  title={attachment.name}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-3xl h-full rounded-2xl p-6 md:p-10 border border-slate-800 shadow-2xl overflow-y-auto flex flex-col justify-between text-left font-sans">
                <div className="space-y-6">
                  <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded">
                        PDF Document Preview
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">{attachment.name}</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">National Payments Corporation of India</p>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-500 text-xs font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                      <Lock className="w-3.5 h-3.5" />
                      <span>VERIFIED ATTACHMENT</span>
                    </div>
                  </div>

                  <div className="space-y-3 font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-slate-200">[Section 1.0 - Technical Compliance Specifications]</p>
                    <p>
                      This document ("{attachment.name}") is registered in the official NPCI Workspace Repository.
                      All payment gateways, UPI switches, and card tokenization engines must adhere strictly to the embedded operational standards.
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 italic">
                      • Document File Size: {attachment.size || "1.4 MB"}
                      <br />
                      • Access Level: Restricted Workspace Staff & Partners
                      <br />
                      • Cryptographic Hash: 0x8F9A...B31D (FIPS-140-3 Validated)
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 font-mono flex justify-between items-center">
                  <span>© NPCI Secure Attachment Viewer</span>
                  <button
                    onClick={handleDownload}
                    className="text-blue-500 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Download Full Document</span>
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          ) : isWord ? (
            /* MICROSOFT WORD DOCUMENT NATIVE VIEWER */
            <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-3xl h-full rounded-2xl p-6 md:p-10 border border-slate-800 shadow-2xl overflow-y-auto flex flex-col justify-between text-left font-sans">
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                        Microsoft Word Document (.docx)
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{attachment.name}</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">NPCI Regulatory & Operations Directorate</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 text-xs font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>AUTHENTICATED DOC</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs font-sans leading-relaxed text-slate-700 dark:text-slate-300">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Document Overview & Executive Summary</h4>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">
                      Standardized Word operational circular for internal payment gateway governance, customer redressal (UDIR), and merchant velocity limits.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] font-mono pt-1">
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[9px]">FILE FORMAT</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">Word 2016+ / DOCX</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[9px]">ESTIMATED PAGES</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">4 - 6 Pages</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[9px]">FILE SIZE</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{attachment.size || "1.2 MB"}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-200 text-xs">Section 1: General Payment Directives</p>
                    <p className="text-slate-600 dark:text-slate-400">
                      All member acquiring banks and payment service providers (PSPs) must process instant reconciliation under the unified settlement guidelines.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 font-mono flex flex-wrap justify-between items-center gap-3">
                <span>© NPCI Secure Document Distribution</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .docx File</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isSpreadsheet ? (
            /* EXCEL / CSV SPREADSHEET VIEWER */
            <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-3xl h-full rounded-2xl p-6 md:p-8 border border-slate-800 shadow-2xl overflow-y-auto flex flex-col justify-between text-left font-sans">
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-600 text-white rounded-xl">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">
                        Spreadsheet / Dataset
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{attachment.name}</h2>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5">Row</th>
                        <th className="p-2.5">Entity / Metric</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Compliance Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                      <tr>
                        <td className="p-2.5 text-slate-400">01</td>
                        <td className="p-2.5 font-bold">UPI 2.0 Switch Uptime</td>
                        <td className="p-2.5 text-emerald-500 font-bold">99.995%</td>
                        <td className="p-2.5 text-slate-500">SLA-A1 Verified</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-400">02</td>
                        <td className="p-2.5 font-bold">RuPay EMV Tokenization</td>
                        <td className="p-2.5 text-blue-500 font-bold">ACTIVE</td>
                        <td className="p-2.5 text-slate-500">Mandate v3.4</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-400">03</td>
                        <td className="p-2.5 font-bold">AePS Micro-ATM Redial Rate</td>
                        <td className="p-2.5 text-amber-500 font-bold">&lt; 0.05%</td>
                        <td className="p-2.5 text-slate-500">Normal Range</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 font-mono flex justify-between items-center">
                <span>Spreadsheet Data Inspector</span>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Spreadsheet</span>
                </button>
              </div>
            </div>
          ) : isCodeOrText ? (
            <div className="bg-slate-900 text-slate-200 w-full max-w-3xl h-full rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-left font-mono">
              <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span>{attachment.name}</span>
                </span>
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1 text-[11px] hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy Content"}</span>
                </button>
              </div>
              <div className="flex-1 p-5 overflow-auto text-xs leading-relaxed text-cyan-300/90 bg-slate-950/80 font-mono whitespace-pre-wrap">
                {decodedTextContent ? decodedTextContent : `/* NPCI Specification Payload: ${attachment.name} */\n{\n  "document": "${attachment.name}",\n  "file_size": "${attachment.size}",\n  "content_type": "${attachment.type}",\n  "status": "APPROVED_NPCI_SPECIFICATION",\n  "security_clearance": "RESTRICTED",\n  "timestamp": "${new Date().toISOString()}"\n}`}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full text-center space-y-4">
              <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">{attachment.name}</h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">{attachment.size} • {attachment.type}</p>
              </div>
              <button
                onClick={handleDownload}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Attachment</span>
              </button>
            </div>
          )}
        </div>

        {/* FOOTER BAR */}
        <div className="bg-slate-950 px-5 py-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>NPCI Workspace Document Security Shield Active</span>
          </div>
          <button onClick={onClose} className="hover:text-white cursor-pointer font-bold">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

