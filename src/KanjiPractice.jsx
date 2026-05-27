import React, { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import * as htmlToImage from "html-to-image";

// ---------------- MINIMAL ICONS ----------------
const TrashIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
);
const EditIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
);
const DownloadIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);
const SearchIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const PlusIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

// ---------------- DATA ----------------
const DEFAULT_DOCUMENTS = [
  {
    id: "doc-1",
    title: "JLPT N5 Practice",
    entries: [
      { id: "1", kanji: "一", english: "One, One Radical", onyomi: "いち、いつ", kunyomi: "ひと、ひとつ" },
      { id: "2", kanji: "二", english: "Two, Two Radical", onyomi: "に、じ", kunyomi: "ふた、ふたつ" },
      { id: "3", kanji: "七", english: "Seven", onyomi: "しち", kunyomi: "なな、なの" },
      { id: "4", kanji: "万", english: "Ten Thousand", onyomi: "まん、ばん", kunyomi: "よろず" },
    ]
  }
];

const EMPTY_FORM = { id: null, kanji: "", english: "", onyomi: "", kunyomi: "" };

// ---------------- APP ----------------
export default function KanjiPractice() {
  // --- STATE ---
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem("kanji-documents");
    if (!saved) return DEFAULT_DOCUMENTS;
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_DOCUMENTS;
    }
  });

  const [activeDocId, setActiveDocId] = useState(documents[0]?.id || null);
  const [newDocTitle, setNewDocTitle] = useState("");
  
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("gallery"); // 'gallery' | 'preview'
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem("kanji-documents", JSON.stringify(documents));
    // Ensure we always have an active document selected if available
    if (!activeDocId && documents.length > 0) {
      setActiveDocId(documents[0].id);
    }
  }, [documents, activeDocId]);

  // --- DERIVED STATE ---
  const activeDocument = useMemo(() => {
    return documents.find(doc => doc.id === activeDocId) || null;
  }, [documents, activeDocId]);

  const activeEntries = activeDocument?.entries || [];

  const filteredEntries = useMemo(() => {
    return activeEntries.filter(e => 
      e.kanji.includes(searchQuery) || 
      e.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.onyomi.includes(searchQuery) ||
      e.kunyomi.includes(searchQuery)
    );
  }, [activeEntries, searchQuery]);

  const pages = useMemo(() => {
    const chunked = [];
    for (let i = 0; i < activeEntries.length; i += 5) {
      chunked.push(activeEntries.slice(i, i + 5));
    }
    return chunked;
  }, [activeEntries]);

  // --- DOCUMENT HANDLERS ---
  const handleCreateDocument = (e) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    const newDoc = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      entries: []
    };

    setDocuments(prev => [...prev, newDoc]);
    setActiveDocId(newDoc.id);
    setNewDocTitle("");
    resetForm();
  };

  const handleDeleteDocument = (id) => {
    const ok = window.confirm("Are you sure you want to delete this entire document?");
    if (!ok) return;

    setDocuments(prev => {
      const filtered = prev.filter(doc => doc.id !== id);
      if (activeDocId === id) {
        setActiveDocId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
    resetForm();
  };

  // --- KANJI HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setIsEditing(false);
  };

  const handleKanjiSubmit = (e) => {
    e.preventDefault();
    if (!activeDocId || !formData.kanji.trim() || !formData.english.trim()) return;

    const item = { ...formData, id: formData.id || Date.now().toString() };

    setDocuments((prevDocs) => 
      prevDocs.map(doc => {
        if (doc.id !== activeDocId) return doc;

        const newEntries = isEditing 
          ? doc.entries.map(x => x.id === item.id ? item : x)
          : [...doc.entries, item];

        return { ...doc, entries: newEntries };
      })
    );
    resetForm();
  };

  const handleEdit = (entry) => {
    setFormData(entry);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteKanji = (id) => {
    const ok = window.confirm("Are you sure you want to delete this Kanji?");
    if (!ok) return;
    
    setDocuments((prevDocs) => 
      prevDocs.map(doc => {
        if (doc.id !== activeDocId) return doc;
        return { ...doc, entries: doc.entries.filter(x => x.id !== id) };
      })
    );

    if (formData.id === id) resetForm();
  };

  // --- EXPORT ---
  const handleDownloadPDF = async () => {
    if (!activeDocument) return;
    
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

      // Temporarily render preview if hidden to capture it
      const wasGallery = activeTab === "gallery";
      if (wasGallery) setActiveTab("preview");

      // Delay to ensure DOM fully updates and renders the off-screen sheets
      await new Promise(r => setTimeout(r, 400)); 

      const pageElements = document.querySelectorAll(".kanji-pdf-page");
      if (document.fonts?.ready) await document.fonts.ready;

      for (let i = 0; i < pageElements.length; i++) {
        const page = pageElements[i];
        const imgData = await htmlToImage.toJpeg(page, {
          quality: 1.0,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
        });

        if (i !== 0) pdf.addPage([PDF_WIDTH, PDF_HEIGHT], "portrait");
        pdf.addImage(imgData, "JPEG", 0, 0, PDF_WIDTH, PDF_HEIGHT, undefined, "FAST");
      }
      
      const safeTitle = activeDocument.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      pdf.save(`${safeTitle}_practice_sheet.pdf`);
      
      if (wasGallery) setActiveTab("gallery");
    } catch (err) {
      console.error(err);
      alert("PDF generation failed");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EB] text-[#2D2C2A] font-sans flex flex-col selection:bg-[#B33B2E] selection:text-white">
      {/* ---------------- HEADER ---------------- */}
      <header className="border-b border-[#E3DFD5] bg-[#F4F1EB] px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-50 shadow-[0_4px_20px_-15px_rgba(0,0,0,0.1)]">
        
        {/* Branding */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 border-2 border-[#B33B2E] text-[#B33B2E] flex items-center justify-center text-2xl jp-serif font-medium bg-[#F4F1EB]">
            泉
          </div>
          <div>
            <h1 className="text-xl tracking-[0.2em] font-serif font-bold text-[#1A1A1A] leading-tight">Washi Kanji</h1>
            <p className="text-[10px] tracking-widest text-[#B33B2E] jp-serif font-medium mt-0.5">和紙漢字</p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8A85]">
              <SearchIcon />
            </div>
            <input 
              type="text" 
              placeholder="Search kanji, meaning, or romaji..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!activeDocument}
              className="w-full bg-white border border-[#E3DFD5] rounded-sm py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#B33B2E] transition-colors placeholder:text-[#AAA8A3] disabled:bg-[#EBE7DF]"
            />
          </div>
          
          <button 
            onClick={handleDownloadPDF} 
            disabled={isGeneratingPdf || activeEntries.length === 0}
            className="shrink-0 bg-white border border-[#E3DFD5] text-[#2D2C2A] hover:border-[#B33B2E] hover:text-[#B33B2E] px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadIcon />
            {isGeneratingPdf ? "Exporting..." : "Export Document"}
          </button>
        </div>
      </header>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden relative max-w-[1600px] mx-auto w-full">
        
        {/* SIDEBAR */}
        <aside className="w-full lg:w-[340px] bg-[#EBE7DF] border-r border-[#E3DFD5] flex flex-col shrink-0 lg:h-[calc(100vh-89px)]">
          
          <div className="flex-1 overflow-y-auto p-6">
            {/* DOCUMENT MANAGEMENT */}
            <div className="mb-8 pb-8 border-b border-[#E3DFD5]">
              <h2 className="text-xs font-bold tracking-widest text-[#8C8A85] uppercase mb-4">
                Documents
              </h2>
              
              <select 
                value={activeDocId || ""} 
                onChange={(e) => {
                  setActiveDocId(e.target.value);
                  resetForm();
                }}
                className="w-full bg-white border border-[#E3DFD5] py-2 px-3 text-sm focus:outline-none focus:border-[#B33B2E] font-serif mb-4 appearance-none rounded-none"
              >
                {documents.length === 0 && <option value="" disabled>No documents available</option>}
                {documents.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({doc.entries.length})
                  </option>
                ))}
              </select>

              <form onSubmit={handleCreateDocument} className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  placeholder="New Document Title..." 
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="flex-1 bg-white border border-[#E3DFD5] py-2 px-3 text-sm focus:outline-none focus:border-[#B33B2E] font-serif"
                />
                <button type="submit" disabled={!newDocTitle.trim()} className="bg-[#1A1A1A] text-white px-3 disabled:opacity-50 hover:bg-[#B33B2E] transition-colors flex items-center justify-center">
                  <PlusIcon size={18} />
                </button>
              </form>

              {activeDocId && documents.length > 0 && (
                <button 
                  onClick={() => handleDeleteDocument(activeDocId)}
                  className="w-full text-[10px] font-bold tracking-widest uppercase text-[#B33B2E] border border-[#B33B2E] py-2 hover:bg-[#B33B2E] hover:text-white transition-colors"
                >
                  Delete Active Document
                </button>
              )}
            </div>

            {/* KANJI FORM */}
            {activeDocument ? (
              <div className="mb-8">
                <h2 className="text-xs font-bold tracking-widest text-[#8C8A85] uppercase mb-4">
                  {isEditing ? "Edit Character" : "Add Character"}
                </h2>
                <form onSubmit={handleKanjiSubmit} className="space-y-4">
                  
                  <div className="bg-white p-4 border border-[#E3DFD5] shadow-sm flex justify-center mb-6">
                    <input 
                      type="text" name="kanji" value={formData.kanji} onChange={handleInputChange} 
                      required placeholder="字" 
                      className="w-full text-center text-6xl jp-serif text-[#1A1A1A] bg-transparent focus:outline-none placeholder:text-[#E3DFD5]" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-[#8C8A85] uppercase block mb-1">Meaning</label>
                    <input type="text" name="english" value={formData.english} onChange={handleInputChange} required className="w-full bg-white border border-[#E3DFD5] py-2 px-3 text-sm focus:outline-none focus:border-[#B33B2E] font-serif" />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold tracking-widest text-[#8C8A85] uppercase block mb-1">On-yomi</label>
                      <input type="text" name="onyomi" value={formData.onyomi} onChange={handleInputChange} className="w-full bg-white border border-[#E3DFD5] py-2 px-3 text-sm focus:outline-none focus:border-[#B33B2E] jp-serif" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold tracking-widest text-[#8C8A85] uppercase block mb-1">Kun-yomi</label>
                      <input type="text" name="kunyomi" value={formData.kunyomi} onChange={handleInputChange} className="w-full bg-white border border-[#E3DFD5] py-2 px-3 text-sm focus:outline-none focus:border-[#B33B2E] jp-serif" />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="submit" className="flex-1 bg-[#1A1A1A] text-white py-3 text-xs font-bold tracking-widest uppercase hover:bg-[#B33B2E] transition-colors">
                      {isEditing ? "Save Changes" : "Add Kanji"}
                    </button>
                    {isEditing && (
                      <button type="button" onClick={resetForm} className="px-4 bg-transparent border border-[#1A1A1A] text-[#1A1A1A] py-3 text-xs font-bold tracking-widest uppercase hover:bg-[#E3DFD5] transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-[#E3DFD5] text-[#8C8A85] font-serif text-sm">
                Create a document to start adding Kanji.
              </div>
            )}
          </div>
          
          {/* VIEW MODE TOGGLE */}
          <div className="p-6 border-t border-[#E3DFD5] bg-[#EBE7DF]">
            <h3 className="text-xs font-bold tracking-widest text-[#8C8A85] uppercase mb-2">View Mode</h3>
            <div className="flex bg-[#F4F1EB] p-1 border border-[#E3DFD5]">
               <button onClick={() => setActiveTab('gallery')} className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === 'gallery' ? 'bg-white shadow-sm text-[#B33B2E]' : 'text-[#8C8A85] hover:text-[#1A1A1A]'}`}>
                 Gallery
               </button>
               <button onClick={() => setActiveTab('preview')} className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === 'preview' ? 'bg-white shadow-sm text-[#B33B2E]' : 'text-[#8C8A85] hover:text-[#1A1A1A]'}`}>
                 Sheet
               </button>
            </div>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 p-6 lg:p-12 overflow-y-auto lg:h-[calc(100vh-89px)]">
          
          <div className="flex items-end justify-between mb-10 pb-4 border-b border-[#E3DFD5]">
            <div>
              <h2 className="text-3xl font-serif tracking-widest font-bold text-[#1A1A1A] uppercase">
                {activeDocument ? activeDocument.title : "No Document Selected"}
              </h2>
            </div>
            <div className="text-[11px] font-bold tracking-widest text-[#8C8A85] uppercase">
              SHOWING {filteredEntries.length} / {activeEntries.length}
            </div>
          </div>

          {/* GALLERY VIEW */}
          {activeTab === "gallery" && activeDocument && (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="bg-white border border-[#E3DFD5] p-0 flex flex-col group hover:shadow-xl transition-shadow duration-300 relative">
                  
                  {/* Card Header */}
                  <div className="p-6 pb-2 flex justify-between items-start">
                    <span className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-1 tracking-widest uppercase truncate max-w-[120px]">
                      {activeDocument.title}
                    </span>
                    <span className="text-[10px] font-bold text-[#AAA8A3] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      NO. {entry.id.substring(entry.id.length - 4)}
                    </span>
                  </div>

                  {/* Character & Meaning */}
                  <div className="flex-1 flex flex-col items-center justify-center py-8">
                    <span className="text-8xl text-[#1A1A1A] jp-serif leading-none mb-6 group-hover:scale-110 transition-transform duration-500 ease-out">{entry.kanji}</span>
                    <h3 className="text-lg font-serif text-[#1A1A1A] text-center px-4">{entry.english}</h3>
                  </div>

                  {/* Readings Grid */}
                  <div className="grid grid-cols-2 border-t border-[#F4F1EB] mt-4">
                    <div className="p-4 border-r border-[#F4F1EB] flex flex-col items-center text-center">
                      <span className="text-[10px] font-bold text-[#8C8A85] tracking-[0.2em] mb-2">ON</span>
                      <span className="text-sm jp-serif text-[#1A1A1A] truncate w-full">{entry.onyomi || "—"}</span>
                    </div>
                    <div className="p-4 flex flex-col items-center text-center">
                      <span className="text-[10px] font-bold text-[#8C8A85] tracking-[0.2em] mb-2">KUN</span>
                      <span className="text-sm jp-serif text-[#1A1A1A] truncate w-full">{entry.kunyomi || "—"}</span>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="border-t border-[#F4F1EB] bg-[#FAF9F7] flex items-center justify-between px-6 py-3">
                    <span className="text-[10px] font-bold text-[#8C8A85] tracking-widest uppercase group-hover:text-[#B33B2E] transition-colors">
                      Actions
                    </span>
                    <div className="flex gap-4">
                      <button onClick={() => handleEdit(entry)} className="text-[#8C8A85] hover:text-[#1A1A1A] transition-colors"><EditIcon /></button>
                      <button onClick={() => handleDeleteKanji(entry.id)} className="text-[#8C8A85] hover:text-[#B33B2E] transition-colors"><TrashIcon /></button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredEntries.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-[#E3DFD5]">
                   <span className="text-4xl text-[#E3DFD5] jp-serif mb-4">空</span>
                   <p className="text-[#8C8A85] font-serif text-lg tracking-wide">No characters found.</p>
                </div>
              )}
            </div>
          )}

          {/* PDF PREVIEW VIEW */}
          <div className={activeTab === "preview" && activeDocument ? "block" : "hidden"}>
             <div className="flex flex-col items-center gap-12 min-w-max mx-auto origin-top" style={{ transform: 'scale(0.95)' }}>
                {pages.map((pageData, pageIndex) => (
                  <div
                    key={pageIndex}
                    className="kanji-pdf-page bg-white shadow-2xl flex flex-col overflow-hidden shrink-0 border border-[#E3DFD5]"
                    style={{ width: "794px", height: "1123px", padding: "50px", boxSizing: "border-box" }}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-end mb-8 border-b-2 border-[#1A1A1A] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border border-[#B33B2E] text-[#B33B2E] flex items-center justify-center text-lg jp-serif">漢</div>
                        <div className="text-[20px] font-serif text-[#1A1A1A] font-bold tracking-widest uppercase max-w-[400px] truncate">
                          {activeDocument.title}
                        </div>
                      </div>
                      <span className="text-[#8C8A85] text-sm tracking-widest font-bold">PAGE {pageIndex + 1}</span>
                    </div>

                    {/* Grid Content */}
                    <div className="flex-1 flex flex-col justify-start">
                      {pageData.map((entry, idx) => (
                        <div
                          key={entry.id}
                          className="border-[2px] border-[#1A1A1A] flex flex-col bg-white shrink-0 box-border w-full"
                          style={{ height: "185px", marginBottom: idx !== 4 ? "15px" : "0" }}
                        >
                          {/* Info Row */}
                          <div className="flex h-[36px] border-b-[2px] border-[#1A1A1A] shrink-0 bg-[#FAF9F7]">
                            <div className="flex-1 border-r-[2px] border-[#1A1A1A] flex items-center justify-center px-4">
                              <span className="text-xs tracking-widest font-bold uppercase truncate">{entry.english}</span>
                            </div>
                            <div className="flex-1 border-r-[2px] border-[#1A1A1A] flex items-center justify-center px-4 gap-2">
                              <span className="text-[10px] text-[#8C8A85] tracking-widest font-bold">ON</span>
                              <span className="text-sm jp-serif truncate">{entry.onyomi}</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center px-4 gap-2">
                              <span className="text-[10px] text-[#8C8A85] tracking-widest font-bold">KUN</span>
                              <span className="text-sm jp-serif truncate">{entry.kunyomi}</span>
                            </div>
                          </div>

                          {/* Writing Row */}
                          <div className="flex flex-1 overflow-hidden">
                            {/* Model Kanji */}
                            <div className="w-[150px] border-r-[2px] border-[#1A1A1A] relative bg-[#F4F1EB] shrink-0">
                              <span className="absolute inset-0 flex items-center justify-center text-[75px] text-[#1A1A1A] jp-serif leading-none">
                                {entry.kanji}
                              </span>
                            </div>

                            {/* Practice Cells */}
                            <div className="flex-1 flex flex-col h-full">
                              <div className="flex-1 flex border-b-[2px] border-[#1A1A1A]">
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <div key={i} className="flex-1 border-r border-[#E3DFD5] last:border-r-0 relative box-border bg-white">
                                    <div className="absolute inset-0 border-b border-r border-[#E3DFD5] border-dashed pointer-events-none w-1/2 h-1/2"></div>
                                    <div className="absolute inset-0 border-l border-t border-[#E3DFD5] border-dashed pointer-events-none w-1/2 h-1/2 left-1/2 top-1/2"></div>
                                    <span className="absolute inset-0 flex items-center justify-center text-[45px] text-[#E3DFD5] jp-serif leading-none z-10">
                                      {entry.kanji}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex-1 flex">
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <div key={i} className="flex-1 border-r border-[#E3DFD5] last:border-r-0 relative box-border bg-white">
                                    <div className="absolute inset-0 border-b border-r border-[#E3DFD5] border-dashed pointer-events-none w-1/2 h-1/2"></div>
                                    <div className="absolute inset-0 border-l border-t border-[#E3DFD5] border-dashed pointer-events-none w-1/2 h-1/2 left-1/2 top-1/2"></div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Blank Fillers */}
                      {Array.from({ length: 5 - pageData.length }).map((_, i) => (
                        <div key={`blank-${i}`} className="w-full shrink-0" style={{ height: "185px", marginBottom: (i + pageData.length) !== 4 ? "15px" : "0" }}></div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="text-center text-[#8C8A85] text-[10px] tracking-widest font-bold uppercase mt-8 border-t border-[#E3DFD5] pt-4">
                      {activeDocument.title} • Generated via Kanji Studio
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </main>
      </div>

      {/* ---------------- GLOBAL STYLES ---------------- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;700&family=Playfair+Display:wght@400;600;700&display=swap');

        .font-serif {
          font-family: 'Playfair Display', serif;
        }

        .jp-serif {
          font-family: 'Noto Serif JP', serif;
        }

        .kanji-pdf-page {
          image-rendering: high-quality;
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
          font-kerning: none;
        }
        
        /* Custom scrollbar for webkit */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #F4F1EB;
        }
        ::-webkit-scrollbar-thumb {
          background: #E3DFD5;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #B33B2E;
        }
      `}</style>
    </div>
  );
}