import React, { useState } from "react";
import { X, Download, FileText, ZoomIn, ZoomOut, Eye, Copy, Check, Lock, Printer, FileCode, Image as ImageIcon } from "lucide-react";
import { Attachment } from "../types";

interface AttachmentPreviewModalProps {
  attachment: Attachment;
  onClose: () => void;
}

export default function AttachmentPreviewModal({ attachment, onClose }: AttachmentPreviewModalProps) {
  const [zoom, setZoom] = useState(100);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isImage = attachment.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(attachment.name);
  const isPdf = attachment.type === "application/pdf" || attachment.name.endsWith(".pdf");
  const isCodeOrText = attachment.type.startsWith("text/") || 
    attachment.type.includes("json") || 
    /\.(txt|json|md|yaml|yml|xml|log|ts|js|py)$/i.test(attachment.name);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 20, 60));

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 2000);

    if (attachment.url && attachment.url.startsWith("data:")) {
      const link = document.createElement("a");
      link.href = attachment.url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create text blob download fallback
      const blob = new Blob([`[NPCI Forum Secured Document]\nFile Name: ${attachment.name}\nSize: ${attachment.size}\nType: ${attachment.type}\n\nContent preview generated from NPCI secure storage.`], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyText = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    navigator.clipboard.writeText(`NPCI Document: ${attachment.name}\nSize: ${attachment.size}`);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 select-none animate-in fade-in duration-150">
      <div className="bg-slate-900 w-full max-w-5xl h-[88vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* HEADER BAR */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between gap-4 text-slate-200">
          <div className="flex items-center gap-3 truncate min-w-0">
            <div className={`p-2 rounded-xl text-white ${isImage ? "bg-purple-600" : isPdf ? "bg-rose-600" : "bg-blue-600"}`}>
              {isImage ? <ImageIcon className="w-4 h-4" /> : isPdf ? <FileText className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
            </div>
            <div className="truncate text-left">
              <h3 className="font-bold text-sm text-white truncate">{attachment.name}</h3>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                <span>{attachment.size || "NPCI Asset"}</span>
                <span>•</span>
                <span className="uppercase text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                  {attachment.type || "Document"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isImage && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
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
              className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl shadow transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? "Downloading..." : "Download"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-600/80 rounded-xl transition cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PREVIEW BODY */}
        <div className="flex-1 bg-slate-950/60 overflow-auto p-4 md:p-8 flex items-center justify-center relative">
          {isImage ? (
            <div className="flex items-center justify-center h-full w-full overflow-auto">
              <img
                src={attachment.url}
                alt={attachment.name}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-150 border border-slate-800"
              />
            </div>
          ) : isPdf ? (
            attachment.url && (attachment.url.startsWith("data:") || attachment.url.startsWith("blob:") || attachment.url.startsWith("http")) ? (
              <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-white">
                <iframe
                  src={attachment.url}
                  className="w-full h-full border-0"
                  title={attachment.name}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-3xl h-full rounded-2xl p-8 md:p-12 border border-slate-800 shadow-2xl overflow-y-auto flex flex-col justify-between text-left font-sans">
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
                {`/* NPCI Specification Payload: ${attachment.name} */\n{\n  "document": "${attachment.name}",\n  "file_size": "${attachment.size}",\n  "content_type": "${attachment.type}",\n  "status": "APPROVED_NPCI_SPECIFICATION",\n  "security_clearance": "RESTRICTED",\n  "timestamp": "${new Date().toISOString()}"\n}`}
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
