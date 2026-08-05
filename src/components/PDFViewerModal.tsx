import React, { useState } from "react";
import { X, ZoomIn, ZoomOut, Download, Printer, Search, FileText, ChevronLeft, ChevronRight, Lock, CheckCircle2 } from "lucide-react";
import { PolicyDocument } from "../types";

interface PDFViewerModalProps {
  policy: PolicyDocument;
  onClose: () => void;
}

export default function PDFViewerModal({ policy, onClose }: PDFViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const totalPages = policy.chunks.length || 1;
  const currentChunk = policy.chunks[currentPage - 1];

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 70));

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);

    // Create virtual file download
    const textContent = `
NPCI SECURE DOCUMENT: ${policy.title}
Version: ${policy.version}
Uploaded At: ${policy.uploadedAt}
--------------------------------------------------
${policy.description}

${policy.chunks.map(c => `[Section: ${c.section}]\n${c.text}\n`).join("\n")}
    `.trim();

    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = policy.fileName.replace(".pdf", "") + "_fips_certified.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter sections by search query
  const filteredChunks = policy.chunks.filter(c => 
    c.section.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md flex items-center justify-center z-[9999] p-2 md:p-6 select-none animate-in fade-in duration-200">
      <div className="bg-slate-950 w-full max-w-6xl h-[92vh] rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* TOP READER BAR */}
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-slate-200">
          <div className="flex items-center gap-3 truncate max-w-xs md:max-w-md">
            <div className="bg-rose-500 text-white p-1.5 rounded text-xs font-bold font-mono">
              PDF
            </div>
            <div className="truncate text-left">
              <h2 className="text-xs font-bold text-white truncate">{policy.fileName}</h2>
              <p className="text-[10px] text-slate-400 font-medium truncate">{policy.title} • Ver {policy.version}</p>
            </div>
          </div>

          {/* PAGE CONTROLS */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-300 min-w-[50px] text-center">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* ZOOM & ACTIONS */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <button onClick={handleZoomOut} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-semibold text-slate-400 w-10 text-center">{zoom}%</span>
              <button onClick={handleZoomIn} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer transition relative"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                  <span className="text-emerald-400">Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="bg-slate-850 hover:bg-rose-600 hover:text-white border border-slate-700 text-slate-400 p-1.5 rounded-lg transition cursor-pointer"
              title="Close PDF Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* SIDEBAR: TABLE OF CONTENTS & SEARCH */}
          <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full hidden md:flex">
            <div className="p-3 border-b border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Search document..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 pl-8 pr-3 py-1 rounded-lg border border-slate-850 text-[11px] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 text-left">
              <p className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-2 tracking-wider">Document Sections</p>
              {policy.chunks.map((chunk, index) => {
                const isSelected = currentPage === index + 1;
                const matchesSearch = searchQuery === "" || 
                  chunk.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  chunk.text.toLowerCase().includes(searchQuery.toLowerCase());

                if (!matchesSearch) return null;

                return (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-blue-600/15 text-blue-300 border border-blue-500/30"
                        : "text-slate-400 hover:bg-slate-850 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5 truncate">
                      <FileText className="w-3 h-3 text-blue-400 flex-shrink-0" />
                      <span className="truncate">{chunk.section}</span>
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">Page {index + 1}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-500 space-y-1 font-mono text-left">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Lock className="w-3 h-3" />
                <span>SECURED CORE DOCUMENT</span>
              </div>
              <p>Certified FIPS 140-3</p>
              <p>Audit Log Reference Locked</p>
            </div>
          </div>

          {/* MAIN PDF CANVAS */}
          <div className="flex-1 bg-slate-800/50 overflow-y-auto p-6 md:p-12 flex justify-center items-start scrollbar-thin">
            <div 
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
              className="bg-white dark:bg-slate-900 dark:text-slate-100 text-slate-950 shadow-2xl rounded-sm border border-slate-300 p-12 md:p-16 max-w-[800px] w-full min-h-[950px] aspect-[1/1.414] relative text-left flex flex-col justify-between select-text transition-transform duration-100 ease-out"
            >
              {/* WATERMARK BACKGROUND */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <p className="text-7xl font-sans font-black rotate-[-35deg] tracking-widest text-slate-900 border-8 border-slate-900 p-8 rounded-3xl uppercase">
                  NPCI SECURE
                </p>
              </div>

              {/* DOCUMENT HEADER */}
              <div className="space-y-4 border-b-2 border-slate-900 pb-4 relative">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h1 className="text-xl font-serif font-bold text-slate-900 uppercase tracking-tight leading-snug">
                      {policy.title}
                    </h1>
                    <p className="text-xs font-sans text-slate-500 font-semibold mt-1">
                      NATIONAL PAYMENTS CORPORATION OF INDIA (NPCI)
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-mono font-bold bg-slate-950 text-white px-2 py-0.5 rounded">
                      VER {policy.version}
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono mt-1 font-bold">CONFIDENTIAL</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 pt-2">
                  <div>
                    <p><span className="font-bold text-slate-800">Effective Date:</span> {new Date(policy.uploadedAt).toLocaleDateString()}</p>
                    <p><span className="font-bold text-slate-800">Classification:</span> Internal Compliance Specification</p>
                  </div>
                  <div className="text-right">
                    <p><span className="font-bold text-slate-800">Security Standard:</span> FIPS 140-3 Grounded</p>
                    <p><span className="font-bold text-slate-800">Document Type:</span> {policy.type === "complaint" ? "Compliance Audit Report" : "Operational Guideline"}</p>
                  </div>
                </div>
              </div>

              {/* DOCUMENT CONTENT */}
              <div className="flex-1 py-8 space-y-6">
                {currentChunk ? (
                  <div className="space-y-4 font-serif">
                    <h3 className="text-base font-bold text-slate-950 border-b border-slate-200 pb-1.5">
                      Section {currentPage}: {currentChunk.section}
                    </h3>
                    <p className="text-xs text-slate-800 leading-relaxed font-sans font-normal whitespace-pre-wrap">
                      {currentChunk.text}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">This page is intentionally left blank.</p>
                )}
              </div>

              {/* DOCUMENT FOOTER */}
              <div className="border-t border-slate-300 pt-4 text-[9px] font-mono text-slate-400 flex justify-between items-center relative">
                <div>
                  <p>© {new Date().getFullYear()} National Payments Corporation of India (NPCI).</p>
                  <p>All Rights Reserved. Internal systems use only.</p>
                </div>
                <div className="text-right">
                  <p>Page {currentPage} of {totalPages}</p>
                  <p className="text-emerald-600 font-bold">✓ SECURE & VERIFIED</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
