import React, { useEffect, useMemo, useState } from "react";
// Import the libraries directly!
import { jsPDF } from "jspdf";
import * as htmlToImage from "html-to-image";

// ---------------- ICONS ----------------
const TrashIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
);
const EditIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
);
const PlusIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const DownloadIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);
const EyeIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
);

// ---------------- DATA ----------------
const DEFAULT_DATA = [
  { id: "1", kanji: "一", english: "One", onyomi: "いち、いつ", kunyomi: "ひと" },
  { id: "2", kanji: "七", english: "Seven", onyomi: "しち", kunyomi: "なな、なの" },
  { id: "3", kanji: "万", english: "Ten Thousand", onyomi: "まん、ばん", kunyomi: "" },
  { id: "4", kanji: "三", english: "Three", onyomi: "さん", kunyomi: "み" },
];

const EMPTY_FORM = { id: null, kanji: "", english: "", onyomi: "", kunyomi: "" };

// ---------------- APP ----------------
export default function App() {
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem("kanji-entries");
    if (!saved) return DEFAULT_DATA;
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_DATA;
    }
  });

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    localStorage.setItem("kanji-entries", JSON.stringify(entries));
  }, [entries]);

  // ---------------- HELPERS ----------------
  const pages = useMemo(() => {
    const chunked = [];
    for (let i = 0; i < entries.length; i += 5) {
      chunked.push(entries.slice(i, i + 5));
    }
    return chunked;
  }, [entries]);

  // ---------------- HANDLERS ----------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setIsEditing(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.kanji.trim() || !formData.english.trim()) return;

    const item = { ...formData, id: formData.id || Date.now().toString() };

    setEntries((prev) => {
      if (isEditing) {
        return prev.map((x) => (x.id === item.id ? item : x));
      }
      return [...prev, item];
    });

    resetForm();
    
    if (!isEditing && entries.length > 0 && (entries.length + 1) % 5 === 0) {
      setActiveTab('preview');
    }
  };

  const handleEdit = (entry, e) => {
    e.stopPropagation();
    setFormData(entry);
    setIsEditing(true);
    setActiveTab("edit");
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    const ok = window.confirm("Delete this Kanji?");
    if (!ok) return;

    setEntries((prev) => prev.filter((x) => x.id !== id));
    if (formData.id === id) resetForm();
  };

  // ---------------- HTML-TO-IMAGE EXPORT ----------------
  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);

    try {
      const PDF_WIDTH = 794;
      const PDF_HEIGHT = 1123;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [PDF_WIDTH, PDF_HEIGHT],
        compress: true,
      });

      const pageElements = document.querySelectorAll(".kanji-pdf-page");

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      for (let i = 0; i < pageElements.length; i++) {
        const page = pageElements[i];

        await new Promise((r) => requestAnimationFrame(r));

        // Use html-to-image instead of html2canvas
        const imgData = await htmlToImage.toJpeg(page, {
          quality: 1.0,
          backgroundColor: "#ffffff",
          pixelRatio: 2, 
          skipFonts: false,
        });

        if (i !== 0) pdf.addPage([PDF_WIDTH, PDF_HEIGHT], "portrait");
        pdf.addImage(imgData, "JPEG", 0, 0, PDF_WIDTH, PDF_HEIGHT, undefined, "FAST");
      }

      pdf.save("Kanji_Practice_Sheet.pdf");
    } catch (err) {
      console.error(err);
      alert("PDF generation failed");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside
        className={`
          bg-white border-r border-slate-200 w-full lg:w-[380px] shrink-0 flex flex-col
          ${activeTab === "edit" ? "flex" : "hidden lg:flex"}
        `}
      >
        {/* HEADER */}
        <div className="bg-indigo-600 text-white p-5 shrink-0">
          <h1 className="text-2xl font-bold">TrishaChan Kanji Maker</h1>
          <p className="text-indigo-100 text-sm mt-1">JLPT Practice Sheet Generator</p>
        </div>

        {/* FORM */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Kanji</label>
              <input type="text" name="kanji" value={formData.kanji} onChange={handleInputChange} required placeholder="字" className="w-full border border-slate-300 rounded-lg p-3 text-center text-3xl font-serif" />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">English</label>
              {/* text-base prevents iOS zoom */}
              <input type="text" name="english" value={formData.english} onChange={handleInputChange} required placeholder="Meaning" className="w-full border border-slate-300 rounded-lg p-3 text-base md:text-sm" />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Onyomi</label>
              <input type="text" name="onyomi" value={formData.onyomi} onChange={handleInputChange} placeholder="いち" className="w-full border border-slate-300 rounded-lg p-3 text-base md:text-sm" />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Kunyomi</label>
              <input type="text" name="kunyomi" value={formData.kunyomi} onChange={handleInputChange} placeholder="ひと" className="w-full border border-slate-300 rounded-lg p-3 text-base md:text-sm" />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-3 flex items-center justify-center gap-2 font-medium">
                <PlusIcon /> {isEditing ? "Update" : "Add"}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} className="bg-slate-200 hover:bg-slate-300 px-4 rounded-lg font-medium text-slate-700">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4 bg-white">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-slate-700">Kanji List</h2>
            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">{entries.length} items</span>
          </div>

          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-3xl text-indigo-700 font-serif leading-none">{entry.kanji}</div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 truncate">{entry.english}</div>
                    <div className="text-xs text-slate-500 truncate">{entry.onyomi || "-"} | {entry.kunyomi || "-"}</div>
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={(e) => handleEdit(entry, e)} className="p-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-400">
                    <EditIcon />
                  </button>
                  <button type="button" onClick={(e) => handleDelete(entry.id, e)} className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-400">
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
            {entries.length === 0 && (
              <div className="text-slate-400 text-sm italic text-center p-6 border-2 border-dashed border-slate-200 rounded-lg">
                No kanji added yet.
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* PREVIEW */}
      <main
        className={`
          flex-1 flex flex-col bg-slate-200/60 relative w-full
          ${activeTab === "preview" ? "flex" : "hidden lg:flex"}
        `}
      >
        {/* TOP BAR */}
        <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shrink-0 shadow-sm z-10">
          <div>
            <h2 className="font-semibold text-lg text-slate-800">Document Preview</h2>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf || pages.length === 0}
            className={`
              px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all shadow-sm
              ${isGeneratingPdf || pages.length === 0 ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white hover:shadow-md"}
            `}
          >
            <DownloadIcon /> {isGeneratingPdf ? "Generating..." : "Export PDF"}
          </button>
        </div>

        {/* PAGES WRAPPER */}
        <div className="flex-1 overflow-auto p-4 md:p-8 pb-24 lg:pb-8 document-scroll-container">
          
          {pages.length === 0 && (
             <div className="text-slate-500 mt-20 text-center flex flex-col items-center bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md mx-auto w-11/12">
                <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <p className="text-lg font-medium">Your document is empty</p>
                <p className="text-sm mt-1">Add some Kanji from the list to see the preview.</p>
             </div>
          )}

          <div className="flex flex-col items-center gap-8 min-w-max mx-auto">
            {pages.map((pageData, pageIndex) => (
              <div
                key={pageIndex}
                className="kanji-pdf-page bg-white shadow-xl flex flex-col overflow-hidden shrink-0"
                style={{
                  width: "794px",
                  height: "1123px",
                  padding: "40px",
                  boxSizing: "border-box",
                }}
              >
                {/* HEADER */}
                <div className="flex justify-between items-end mb-6 h-[30px] shrink-0">
                  <div className="text-[28px] font-bold text-slate-700 tracking-wide">
                    JLPT Level N5 Kanji
                    <span className="ml-4 text-slate-400 text-[22px] font-normal">Page {pageIndex + 1}</span>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 flex flex-col justify-start">
                  {pageData.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="border-[2px] border-slate-800 flex flex-col bg-white shrink-0 box-border w-full"
                      style={{
                        height: "185px",
                        marginBottom: idx !== 4 ? "15px" : "0",
                      }}
                    >
                      {/* TOP ROW */}
                      <div className="flex h-[36px] border-b-[2px] border-slate-800 shrink-0">
                        <div className="flex-1 border-r-[2px] border-slate-800 flex items-center justify-center px-2">
                          <span className="text-[14px] leading-none font-medium truncate">{entry.english}</span>
                        </div>
                        <div className="flex-1 border-r-[2px] border-slate-800 flex items-center justify-center px-2">
                          <span className="text-[14px] leading-none truncate">{entry.onyomi}</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center px-2">
                          <span className="text-[14px] leading-none truncate">{entry.kunyomi}</span>
                        </div>
                      </div>

                      {/* BOTTOM ROW */}
                      <div className="flex flex-1 overflow-hidden">
                        {/* BIG KANJI */}
                        <div className="w-[150px] border-r-[2px] border-slate-800 relative bg-slate-50/20 shrink-0">
                          <span
                            style={{ fontFamily: '"Noto Serif JP", "Yu Mincho", "MS PMincho", serif' }}
                            className="absolute inset-0 flex items-center justify-center text-[82px] text-slate-900 leading-none"
                          >
                            {entry.kanji}
                          </span>
                        </div>

                        {/* GRIDS */}
                        <div className="flex-1 flex flex-col h-full">
                          {/* TRACE ROW */}
                          <div className="flex-1 flex border-b-[2px] border-slate-800">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div key={i} className="flex-1 border-r border-slate-300 last:border-r-0 relative box-border">
                                <div className="absolute inset-0 border-b border-r border-slate-200 border-dashed pointer-events-none w-1/2 h-1/2"></div>
                                <div className="absolute inset-0 border-l border-t border-slate-200 border-dashed pointer-events-none w-1/2 h-1/2 left-1/2 top-1/2"></div>

                                <span
                                  style={{ fontFamily: '"Noto Serif JP", "Yu Mincho", "MS PMincho", serif' }}
                                  className="absolute inset-0 flex items-center justify-center text-[42px] text-slate-300 leading-none z-10"
                                >
                                  {entry.kanji}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* EMPTY ROW */}
                          <div className="flex-1 flex">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div key={i} className="flex-1 border-r border-slate-300 last:border-r-0 relative box-border">
                                <div className="absolute inset-0 border-b border-r border-slate-200 border-dashed pointer-events-none w-1/2 h-1/2"></div>
                                <div className="absolute inset-0 border-l border-t border-slate-200 border-dashed pointer-events-none w-1/2 h-1/2 left-1/2 top-1/2"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* BLANK FILLERS */}
                  {Array.from({ length: 5 - pageData.length }).map((_, i) => (
                    <div 
                      key={`blank-${i}`} 
                      className="w-full shrink-0"
                      style={{ 
                        height: "185px", 
                        marginBottom: (i + pageData.length) !== 4 ? "15px" : "0" 
                      }}
                    ></div>
                  ))}
                </div>

                {/* FOOTER */}
                <div className="text-center text-slate-400 text-xs mt-4 h-[20px] shrink-0">
                  Created with TrishaChan Kanji Practice Generator
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* MOBILE NAV */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setActiveTab("edit")}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
            activeTab === "edit" ? "text-indigo-600 font-semibold" : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <EditIcon />
          <span className="text-[10px] uppercase tracking-wide">Edit List</span>
        </button>

        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
            activeTab === "preview" ? "text-indigo-600 font-semibold" : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <div className="relative">
             <EyeIcon />
             {entries.length > 0 && <span className="absolute -top-1.5 -right-2 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{entries.length}</span>}
          </div>
          <span className="text-[10px] uppercase tracking-wide">Preview</span>
        </button>
      </div>

      {/* GLOBAL FIXES */}
      <style>{`
        .kanji-pdf-page {
          image-rendering: high-quality;
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
          font-kerning: none;
        }

        .kanji-pdf-page span {
          line-height: 1 !important;
        }

        html {
          scroll-behavior: smooth;
        }
        
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }

        .document-scroll-container {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
        }
      `}</style>
    </div>
  );
}