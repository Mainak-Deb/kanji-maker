import { useState, useCallback } from "react";
import KanjiExplorer from "./KanjiExplorer";
import KanjiPractice from "./KanjiPractice";
import { KanjiModal } from "./KanjiExplorer"; // Import the modal directly

export default function App() {
  const [activeTab, setActiveTab] = useState("explorer");
  const [selectedKanji, setSelectedKanji] = useState(null);

  // Native Speech Synthesis Engine
  const playAudio = useCallback((text, e) => {
    if (e) e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.85; 
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return (
    <main className="relative min-h-screen w-full bg-[#EBE7DF] text-slate-900">
      
      {/* Explorer Panel */}
      <section
        className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center ${
          activeTab === "explorer"
            ? "opacity-100 translate-x-0 scale-100 relative z-10 pointer-events-auto block"
            : "opacity-0 -translate-x-8 scale-[0.98] absolute inset-0 z-0 pointer-events-none hidden"
        }`}
      >
        <div className="w-full flex flex-col">
          {/* Passed modal trigger state upward */}
          <KanjiExplorer onSelectKanji={setSelectedKanji} onPlayAudio={playAudio} />
        </div>
      </section>

      {/* Practice Panel */}
      <section
        className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center ${
          activeTab === "practice"
            ? "opacity-100 translate-x-0 scale-100 relative z-10 pointer-events-auto block"
            : "opacity-0 translate-x-8 scale-[0.98] absolute inset-0 z-0 pointer-events-none hidden"
        }`}
      >
        <div className="w-full flex flex-col">
          <KanjiPractice />
        </div>
      </section>

      {/* GLOBAL MODAL LAYER: Completely outside the absolute/transform panels */}
      {selectedKanji && (
        <KanjiModal 
          kanji={selectedKanji} 
          onClose={() => setSelectedKanji(null)} 
          onPlayAudio={playAudio} 
        />
      )}

      {/* Floating Pill Navbar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 shadow-2xl rounded-full">
        <nav className="relative flex rounded-full bg-white/80 p-1.5 backdrop-blur-md shadow-lg ring-1 ring-slate-900/10">
          <div
            className="absolute inset-y-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-full bg-[#B92A2C] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              transform: activeTab === "explorer" ? "translateX(0)" : "translateX(100%)",
            }}
          />

          <button
            onClick={() => setActiveTab("explorer")}
            className={`relative z-10 flex w-32 md:w-36 items-center justify-center rounded-full py-2.5 text-sm font-semibold transition-colors duration-300 ${
              activeTab === "explorer" ? "text-white" : "text-slate-700 hover:text-slate-900"
            }`}
          >
            Explorer
          </button>

          <button
            onClick={() => setActiveTab("practice")}
            className={`relative z-10 flex w-32 md:w-36 items-center justify-center rounded-full py-2.5 text-sm font-semibold transition-colors duration-300 ${
              activeTab === "practice" ? "text-white" : "text-slate-700 hover:text-slate-900"
            }`}
          >
            Practice
          </button>
        </nav>
      </div>
    </main>
  );
}