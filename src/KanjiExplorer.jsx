import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, X, ChevronDown, BookOpen, Volume1, PenTool, RotateCcw, Info, Search, ChevronRight, Hash, TrendingUp, Sparkles } from 'lucide-react';

// Compact engine to convert Hiragana/Katakana to Romaji
const kanaToRomajiMap = {
  'あ':'a', 'い':'i', 'う':'u', 'え':'e', 'お':'o',
  'か':'ka', 'き':'ki', 'く':'ku', 'け':'ke', 'こ':'ko',
  'さ':'sa', 'し':'shi', 'す':'su', 'せ':'se', 'そ':'so',
  'た':'ta', 'ち':'chi', 'つ':'tsu', 'て':'te', 'と':'to',
  'な':'na', 'に':'ni', 'ぬ':'nu', 'ね':'ne', 'の':'no',
  'は':'ha', 'ひ':'hi', 'ふ':'fu', 'へ':'he', 'ほ':'ho',
  'ま':'ma', 'み':'mi', 'む':'mu', 'め':'me', 'も':'mo',
  'や':'ya', 'ゆ':'yu', 'よ':'yo',
  'ら':'ra', 'り':'ri', 'る':'ru', 'れ':'re', 'ろ':'ro',
  'わ':'wa', 'を':'wo', 'ん':'n',
  'が':'ga', 'ぎ':'gi', 'ぐ':'gu', 'げ':'ge', 'ご':'go',
  'ざ':'za', 'じ':'ji', 'ず':'zu', 'ぜ':'ze', 'ぞ':'zo',
  'だ':'da', 'ぢ':'ji', 'づ':'zu', 'で':'de', 'ど':'do',
  'ば':'ba', 'び':'bi', 'ぶ':'bu', 'べ':'be', 'ぼ':'bo',
  'ぱ':'pa', 'ぴ':'pi', 'ぷ':'pu', 'ぺ':'pe', 'ぽ':'po',
  'きゃ':'kya', 'きゅ':'kyu', 'きょ':'kyo', 'しゃ':'sha', 'しゅ':'shu', 'しょ':'sho',
  'ちゃ':'cha', 'ちゅ':'chu', 'ちょ':'cho', 'にゃ':'nya', 'にゅ':'nyu', 'にょ':'nyo',
  'ひゃ':'hya', 'ひゅ':'hyu', 'ひょ':'hyo', 'みゃ':'mya', 'みゅ':'myu', 'みょ':'myo',
  'りゃ':'rya', 'りゅ':'ryu', 'りょ':'ryo', 'ぎゃ':'gya', 'ぎゅ':'gyu', 'ぎょ':'gyo',
  'じゃ':'ja', 'じゅ':'ju', 'じょ':'jo', 'びゃ':'bya', 'びゅ':'byu', 'びょ':'byo',
  'ぴゃ':'pya', 'ぴゅ':'pyu', 'ぴょ':'pyo',
  'ア':'a', 'イ':'i', 'ウ':'u', 'エ':'e', 'オ':'o',
  'カ':'ka', 'キ':'ki', 'ク':'ku', 'ケ':'ke', 'コ':'ko',
  'サ':'sa', 'シ':'shi', 'ス':'su', 'セ':'se', 'ソ':'so',
  'タ':'ta', 'チ':'chi', 'ツ':'tsu', 'テ':'te', 'ト':'to',
  'ナ':'na', 'ニ':'ni', 'ヌ':'nu', 'ネ':'ne', 'ノ':'no',
  'ハ':'ha', 'ヒ':'hi', 'フ':'fu', 'ヘ':'he', 'ホ':'ho',
  'マ':'ma', 'ミ':'mi', 'ム':'mu', 'メ':'me', 'モ':'mo',
  'ヤ':'ya', 'ユ':'yu', 'ヨ':'yo',
  'ラ':'ra', 'リ':'ri', 'ル':'ru', 'レ':'re', 'ロ':'ro',
  'ワ':'wa', 'ヲ':'wo', 'ン':'n',
  'ガ':'ga', 'ギ':'gi', 'グ':'gu', 'ゲ':'ge', 'ゴ':'go',
  'ザ':'za', 'ジ':'ji', 'ず':'zu', 'ぜ':'ze', 'ぞ':'zo',
  'ダ':'da', 'ヂ':'ji', 'ヅ':'zu', 'デ':'de', 'ど':'do',
  'バ':'ba', 'ビ':'bi', 'ブ':'bu', 'べ':'be', 'ぼ':'bo',
  'パ':'pa', 'ピ':'pi', 'プ':'pu', 'ペ':'pe', 'ポ':'po',
  'キャ':'kya', 'キュ':'kyu', 'キョ':'kyo', 'シャ':'sha', 'シュ':'shu', 'ショ':'sho',
  'チャ':'cha', 'チュ':'chu', 'チョ':'cho', 'ニャ':'nya', 'ニュ':'nyu', 'ニョ':'nyo',
  'ヒャ':'hya', 'ヒュ':'hyu', 'ヒょ':'hyo', 'ミゃ':'mya', 'ミュ':'myu', 'ミョ':'myo',
  'リゃ':'rya', 'リュ':'ryo', 'リョ':'ryo', 'ギャ':'gya', 'ギュ':'gyu', 'ギョ':'gyo',
  'じゃ':'ja', 'ジュ':'ju', 'ジョ':'jo', 'ビゃ':'bya', 'ビュ':'byu', 'ビョ':'byo',
  'ピゃ':'pya', 'ピュ':'pyu', 'ピョ':'pyo'
};

const convertToRomaji = (kana) => {
  if (!kana) return '';
  let result = '';
  let i = 0;
  const cleanKana = kana.replace(/[\.\-]/g, ''); 
  
  while (i < cleanKana.length) {
    let char2 = cleanKana.substring(i, i + 2);
    let char1 = cleanKana.substring(i, i + 1);
    
    if (char1 === 'っ' || char1 === 'ッ') {
      let nextKana = cleanKana.substring(i + 1, i + 2);
      let nextRomaji = kanaToRomajiMap[nextKana];
      if (nextRomaji) result += nextRomaji[0];
      i += 1;
      continue;
    }
    if (char1 === 'ー') {
      result += '-';
      i += 1;
      continue;
    }

    if (kanaToRomajiMap[char2]) {
      result += kanaToRomajiMap[char2];
      i += 2;
    } else if (kanaToRomajiMap[char1]) {
      result += kanaToRomajiMap[char1];
      i += 1;
    } else {
      result += char1;
      i += 1;
    }
  }
  return result;
};

const KanjiExplorer = ({ onSelectKanji }) => {
  const [kanjiData, setKanjiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(5); 
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedCount, setDisplayedCount] = useState(30);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const observerTarget = useRef(null);
  const CHUNK_SIZE = 30;

  useEffect(() => {
    const fetchKanji = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji.json');
        const json = await response.json();
        
        const grouped = { 5: [], 4: [], 3: [], 2: [], 1: [] };
        Object.entries(json).forEach(([kanji, info]) => {
          if (info.jlpt_new) {
            grouped[info.jlpt_new].push({ kanji, ...info });
          }
        });
        
        setKanjiData(grouped);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch kanji data:", error);
        setLoading(false);
      }
    };
    fetchKanji();
  }, []);

  const allKanji = useMemo(() => {
    if (!kanjiData) return [];
    return [
      ...(kanjiData[1] || []),
      ...(kanjiData[2] || []),
      ...(kanjiData[3] || []),
      ...(kanjiData[4] || []),
      ...(kanjiData[5] || [])
    ];
  }, [kanjiData]);

  const currentList = useMemo(() => {
    if (!kanjiData) return [];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      return allKanji.filter(k => 
        k.kanji.includes(query) ||
        k.meanings.some(m => m.toLowerCase().includes(query)) ||
        k.readings_on.some(r => convertToRomaji(r).toLowerCase().includes(query)) ||
        k.readings_kun.some(r => convertToRomaji(r).toLowerCase().includes(query)) ||
        k.readings_on.some(r => r.includes(query)) ||
        k.readings_kun.some(r => r.includes(query))
      );
    }
    return kanjiData[selectedLevel] || [];
  }, [kanjiData, selectedLevel, searchQuery, allKanji]);

  useEffect(() => {
    setDisplayedCount(CHUNK_SIZE);
  }, [selectedLevel, searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayedCount((prev) => Math.min(prev + CHUNK_SIZE, currentList.length));
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [observerTarget, currentList.length]);

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
    setSearchQuery('');
    setIsDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBE7DF] flex flex-col items-center justify-center font-serif text-[#1A1A1A]">
        <div className="w-16 h-16 border-4 border-[#B92A2C] flex items-center justify-center rounded-sm mb-6 animate-pulse">
          <span className="text-2xl font-bold text-[#B92A2C]">漢</span>
        </div>
        <p className="text-xl tracking-widest text-[#1A1A1A]">読み込み中...</p>
        <p className="text-sm mt-2 opacity-60 tracking-wider">Loading Kanji Data</p>
      </div>
    );
  }

  return (
    <div className="bg-[#EBE7DF] font-serif text-[#1A1A1A] relative selection:bg-[#B92A2C] selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        .font-jp { font-family: 'Shippori Mincho', serif; }
        .font-mono-custom { font-family: 'JetBrains Mono', monospace; }
        
        .bg-washi {
          background-color: #EBE7DF;
          background-image: 
            radial-gradient(#d5d1c8 1px, transparent 1px),
            radial-gradient(#d5d1c8 1px, transparent 1px);
          background-size: 20px 20px;
          background-position: 0 0, 10px 10px;
        }

        .bg-sudare {
          background-image: repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,0,0,0.03) 39px, rgba(0,0,0,0.03) 40px);
        }

        .text-hanko { color: #B92A2C; }
        .bg-hanko { background-color: #B92A2C; }
        .border-hanko { border-color: #B92A2C; }
        .text-sumi { color: #1A1A1A; }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d5d1c8; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #B92A2C; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#EBE7DF]/95 backdrop-blur-md border-b-2 border-[#1A1A1A]/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 hidden sm:flex">
            <div className="w-12 h-12 bg-transparent border-2 border-hanko rounded-sm flex items-center justify-center text-hanko rotate-3">
              <span className="text-3xl font-jp font-bold">漢</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-widest text-sumi">KANJI</h1>
              <p className="text-xs text-hanko font-bold tracking-[0.2em] uppercase">日本語能力試験</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sumi/40" />
            <input 
              type="text" 
              placeholder="Search kanji, meaning, or romaji..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-sumi/20 rounded-sm focus:outline-none focus:border-hanko focus:bg-white transition-all text-sm font-sans shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-sumi/40 hover:text-sumi">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 bg-white/50 border border-sumi/20 px-4 sm:px-5 py-2.5 rounded-sm hover:border-hanko hover:text-hanko transition-all shadow-sm"
            >
              <span className="font-bold tracking-widest hidden sm:inline">JLPT N{selectedLevel}</span>
              <span className="font-bold tracking-widest sm:hidden">N{selectedLevel}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-[#F5F3ED] border-2 border-sumi/10 shadow-xl z-50 rounded-sm overflow-hidden">
                {[5, 4, 3, 2, 1].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleLevelChange(level)}
                    className={`w-full text-left px-5 py-3 text-sm transition-all flex justify-between items-center group
                      ${selectedLevel === level ? 'bg-hanko text-white font-bold' : 'text-sumi hover:bg-[#EBE7DF]'}`}
                  >
                    <span className="tracking-widest font-bold">N{level}</span>
                    <span className={`text-xs ${selectedLevel === level ? 'opacity-90' : 'opacity-40 group-hover:opacity-100'}`}>
                      {kanjiData[level]?.length} 字
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-washi bg-sudare">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between border-b border-sumi/10 pb-4 gap-4">
          <div>
            {searchQuery ? (
               <h2 className="text-2xl font-bold text-sumi tracking-widest flex items-baseline gap-3">
                 SEARCH RESULTS <span className="text-hanko text-lg font-sans font-normal opacity-80">"{searchQuery}"</span>
               </h2>
            ) : (
               <h2 className="text-3xl font-bold text-sumi tracking-widest flex items-baseline gap-3">
                 LEVEL <span className="text-hanko text-5xl font-jp">N{selectedLevel}</span>
               </h2>
            )}
          </div>
          <div className="flex items-center gap-3">
             <div className="h-[1px] w-12 bg-sumi/20 hidden sm:block"></div>
             <span className="text-sm font-medium opacity-60 tracking-widest uppercase">
               Showing {Math.min(displayedCount, currentList.length)} / {currentList.length}
             </span>
          </div>
        </div>

        {/* Kanji Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {currentList.slice(0, displayedCount).map((item, index) => (
            <KanjiCard
              key={`${item.kanji}-${index}`}
              item={item}
              onClick={() => onSelectKanji(item)} // Notify root app state directly
            />
          ))}
        </div>

        {/* Loading Sentinel */}
        {displayedCount < currentList.length && (
          <div ref={observerTarget} className="h-32 flex items-center justify-center mt-8">
             <div className="flex space-x-2">
                <div className="w-3 h-3 bg-hanko rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-3 h-3 bg-hanko rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-3 h-3 bg-hanko rounded-full animate-bounce"></div>
              </div>
          </div>
        )}
      </main>
    </div>
  );
};

const KanjiCard = ({ item, onClick }) => {
  const onReadings = item.readings_on.slice(0, 2);
  const kunReadings = item.readings_kun.slice(0, 2);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white border border-[#E5E5E5] shadow-sm hover:shadow-md hover:border-hanko/30 transition-all duration-300 flex flex-col h-[420px] rounded-sm relative overflow-hidden"
    >
      <div className="flex justify-between items-center p-5 pb-0 z-10 relative">
        <span className="bg-[#1A1A1A] text-white text-[11px] font-bold px-2.5 py-1 rounded-[3px] tracking-widest">
          N{item.jlpt_new}
        </span>
        <span className="text-[11px] text-[#A3A3A3] font-mono-custom tracking-widest uppercase">
          Strokes: {item.strokes}
        </span>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center px-6 z-10 relative">
        <span className="font-jp text-[80px] text-sumi leading-none mb-6 drop-shadow-sm group-hover:text-hanko transition-colors duration-300">
          {item.kanji}
        </span>
        <p className="text-[20px] font-serif text-sumi text-center capitalize leading-tight max-w-[90%]">
          {item.meanings.join(', ')}
        </p>
      </div>

      <div className="px-5 pb-6 w-full flex flex-row justify-between z-10 relative mt-4">
        <div className="flex-1 flex flex-col items-center text-center">
          <span className="text-[10px] text-[#A3A3A3] font-bold tracking-widest uppercase mb-1.5">ON</span>
          <span className="text-[13px] text-[#555] font-jp leading-tight">
            {onReadings.join('、') || 'ー'}
          </span>
          {onReadings.length > 0 && (
            <span className="text-[9px] text-hanko/80 font-mono-custom uppercase tracking-wider mt-1 font-bold">
              {onReadings.map(convertToRomaji).join(' · ')}
            </span>
          )}
        </div>
        
        <div className="w-[1px] bg-[#F0F0F0] self-stretch mx-2"></div>
        
        <div className="flex-1 flex flex-col items-center text-center">
          <span className="text-[10px] text-[#A3A3A3] font-bold tracking-widest uppercase mb-1.5">KUN</span>
          <span className="text-[13px] text-[#555] font-jp leading-tight">
            {kunReadings.join('、') || 'ー'}
          </span>
          {kunReadings.length > 0 && (
            <span className="text-[9px] text-hanko/80 font-mono-custom uppercase tracking-wider mt-1 font-bold">
              {kunReadings.map(convertToRomaji).join(' · ')}
            </span>
          )}
        </div>
      </div>
      
      <div className="bg-[#FAFAFA] border-t border-[#E5E5E5] p-3 flex justify-between items-center text-[10px] text-[#888] font-mono-custom tracking-[0.15em] uppercase group-hover:bg-[#F0F0F0] group-hover:text-hanko transition-colors z-10 relative">
        <span>View Details</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
};

const PracticePad = ({ kanjiChar, maxStrokes }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokesUsed, setStrokesUsed] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 14; 
      ctx.strokeStyle = '#1A1A1A'; 
    }
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e) => {
    e.preventDefault(); 
    if (strokesUsed >= maxStrokes) return; 

    const coords = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const coords = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (e) e.preventDefault();
    if (isDrawing) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.closePath();
      setIsDrawing(false);
      setStrokesUsed(prev => prev + 1);
    }
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokesUsed(0);
  };

  const remaining = maxStrokes - strokesUsed;

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-[11px] uppercase tracking-widest text-sumi font-bold flex items-center gap-2">
          <PenTool className="w-4 h-4 text-hanko"/> Kanji Canvas
        </h3>
        <div className="flex items-center gap-4">
          <span className={`text-[10px] font-bold tracking-widest uppercase ${remaining === 0 ? 'text-hanko' : 'text-sumi/60'}`}>
            {remaining} Strokes Left
          </span>
          <button 
            onClick={clearPad}
            className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-hanko bg-hanko/10 px-3 py-1.5 rounded-sm hover:bg-hanko hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      <div className="relative flex-1 w-full bg-white border-2 border-sumi/10 rounded-sm overflow-hidden flex items-center justify-center min-h-[300px] touch-none shadow-inner">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
           <div className="w-full h-px bg-black absolute top-1/2 -translate-y-1/2"></div>
           <div className="h-full w-px bg-black absolute left-1/2 -translate-x-1/2"></div>
           <div className="w-full h-full border border-black absolute scale-[0.85]"></div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
          <span className="font-jp text-[200px] text-[#1A1A1A]/10">{kanjiChar}</span>
        </div>
        
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
        />
        
        {remaining === 0 && (
          <div className="absolute bottom-4 bg-hanko/90 text-white px-4 py-2 rounded-full text-xs font-bold tracking-widest shadow-lg animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
            Stroke Limit Reached
          </div>
        )}
      </div>
    </div>
  );
};

// Exported separately so it can mount safely to the App root layer
export const KanjiModal = ({ kanji, onClose, onPlayAudio }) => {
  const [exampleWords, setExampleWords] = useState([]);
  const [loadingWords, setLoadingWords] = useState(true);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    
    // Prevent underlying main layout content body from shifting/scrolling
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  useEffect(() => {
    const fetchWords = async () => {
      setLoadingWords(true);
      try {
        const res = await fetch(`https://kanjiapi.dev/v1/words/${kanji.kanji}`);
        if (!res.ok) throw new Error('Failed to fetch words');
        const data = await res.json();
        const validWords = data.filter(w => w.variants.length > 0 && w.meanings.length > 0);
        setExampleWords(validWords.slice(0, 6));
      } catch (err) {
        console.error("Failed to fetch example words:", err);
        setExampleWords([]);
      } finally {
        setLoadingWords(false);
      }
    };
    fetchWords();
  }, [kanji.kanji]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div 
        className="fixed inset-0 bg-sumi/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-[#FCFAF5] w-full max-w-6xl my-auto rounded-sm shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 border-2 border-[#EBE7DF] z-10 max-h-[85vh] overflow-y-auto"> 
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-sumi/50 hover:text-hanko bg-white/80 backdrop-blur rounded-sm shadow-sm z-50 transition-colors"
        >
           <X className="w-6 h-6" />
        </button>

        <div className="p-6 lg:p-10 bg-washi bg-sudare relative border-b border-sumi/10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 flex flex-col border-b lg:border-b-0 lg:border-r border-sumi/10 pb-8 lg:pb-0 lg:pr-10 relative">
            <div className="absolute -top-2 left-0 bg-sumi text-white text-[11px] font-bold px-3 py-1.5 rounded-sm tracking-widest z-10 shadow-sm">
              JLPT N{kanji.jlpt_new}
            </div>
            
            <div className="mt-8 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="w-full flex justify-center lg:justify-start">
                <span className="font-jp text-[120px] sm:text-[140px] leading-none text-sumi drop-shadow-sm mb-6">
                  {kanji.kanji}
                </span>
              </div>
              
              <h3 className="text-[11px] uppercase tracking-widest text-hanko mb-2 font-bold flex items-center gap-2 justify-center lg:justify-start w-full">
                 English Meaning
              </h3>
              <p className="text-3xl sm:text-4xl capitalize font-serif font-medium text-sumi leading-tight mb-8">
                {kanji.meanings.join(', ')}
              </p>

              <button
                onClick={(e) => onPlayAudio(kanji.kanji, e)}
                className="group flex items-center justify-center space-x-3 bg-hanko text-white px-8 py-4 rounded-sm hover:bg-opacity-90 transition-all shadow-md w-full max-w-[280px]"
              >
                <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold tracking-widest uppercase">Pronounce</span>
              </button>
              
              <div className="grid grid-cols-3 gap-3 w-full mt-10 pt-8 border-t border-sumi/10">
                <div className="bg-white/50 border border-sumi/10 p-3 rounded-sm flex flex-col items-center">
                  <Hash className="w-4 h-4 text-hanko/60 mb-1" />
                  <h3 className="text-[9px] uppercase tracking-widest text-sumi/50 font-bold mb-0.5">Grade</h3>
                  <p className="font-bold text-sumi">{kanji.grade || 'N/A'}</p>
                </div>
                <div className="bg-white/50 border border-sumi/10 p-3 rounded-sm flex flex-col items-center">
                  <TrendingUp className="w-4 h-4 text-hanko/60 mb-1" />
                  <h3 className="text-[9px] uppercase tracking-widest text-sumi/50 font-bold mb-0.5">Freq</h3>
                  <p className="font-bold text-sumi">{kanji.freq ? `#${kanji.freq}` : 'N/A'}</p>
                </div>
                <div className="bg-white/50 border border-sumi/10 p-3 rounded-sm flex flex-col items-center">
                  <Sparkles className="w-4 h-4 text-hanko/60 mb-1" />
                  <h3 className="text-[9px] uppercase tracking-widest text-sumi/50 font-bold mb-0.5">Radicals</h3>
                  <p className="font-bold text-sumi text-xs truncate max-w-full" title={kanji.wk_radicals?.join(', ')}>
                    {kanji.wk_radicals?.join(', ') || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col space-y-10 lg:pl-2">
            <div>
              <div className="flex items-center gap-2 mb-6 pb-2 border-b-2 border-hanko/20">
                <BookOpen className="w-5 h-5 text-hanko"/>
                <h2 className="text-lg font-bold text-sumi tracking-widest uppercase">Pronunciation</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="bg-white/60 p-5 rounded-sm border border-sumi/5 shadow-sm">
                  <h3 className="text-[11px] uppercase tracking-widest text-sumi/60 mb-4 font-bold border-l-2 border-hanko pl-2">
                    Onyomi (Chinese)
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {kanji.readings_on.length > 0 ? kanji.readings_on.map((reading, i) => (
                      <button 
                        key={i} 
                        onClick={(e) => onPlayAudio(reading, e)}
                        className="group flex flex-col items-center bg-white border border-sumi/10 px-4 py-2 rounded-sm shadow-sm hover:border-hanko hover:shadow-md transition-all text-left"
                      >
                        <span className="text-[15px] font-jp text-sumi group-hover:text-hanko transition-colors mb-1">
                          {reading}
                        </span>
                        <span className="text-[10px] text-hanko/80 font-mono-custom font-bold tracking-widest uppercase">
                          {convertToRomaji(reading)}
                        </span>
                      </button>
                    )) : <span className="text-sumi/30 text-sm italic py-2">None</span>}
                  </div>
                </div>

                <div className="bg-white/60 p-5 rounded-sm border border-sumi/5 shadow-sm">
                  <h3 className="text-[11px] uppercase tracking-widest text-sumi/60 mb-4 font-bold border-l-2 border-sumi pl-2">
                    Kunyomi (Japanese)
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {kanji.readings_kun.length > 0 ? kanji.readings_kun.map((reading, i) => (
                      <button 
                        key={i} 
                        onClick={(e) => onPlayAudio(reading, e)}
                        className="group flex flex-col items-center bg-white border border-sumi/10 px-4 py-2 rounded-sm shadow-sm hover:border-hanko hover:shadow-md transition-all text-left"
                      >
                        <span className="text-[15px] font-jp text-sumi group-hover:text-hanko transition-colors mb-1">
                          {reading}
                        </span>
                        <span className="text-[10px] text-hanko/80 font-mono-custom font-bold tracking-widest uppercase">
                          {convertToRomaji(reading)}
                        </span>
                      </button>
                    )) : <span className="text-sumi/30 text-sm italic py-2">None</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-hanko/20">
                <Volume1 className="w-5 h-5 text-hanko"/>
                <h2 className="text-lg font-bold text-sumi tracking-widest uppercase">Compound Words</h2>
              </div>
              
              {loadingWords ? (
                <div className="flex space-x-2 animate-pulse p-4 justify-center">
                  <div className="w-2.5 h-2.5 bg-hanko/50 rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-hanko/50 rounded-full [animation-delay:-0.15s]"></div>
                  <div className="w-2.5 h-2.5 bg-hanko/50 rounded-full [animation-delay:-0.3s]"></div>
                </div>
              ) : exampleWords.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {exampleWords.map((word, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white border border-sumi/10 p-4 rounded-sm shadow-sm flex flex-col justify-center hover:border-hanko/40 hover:shadow-md transition-all group cursor-pointer"
                      onClick={(e) => onPlayAudio(word.variants[0].written, e)}
                    >
                      <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                        <span className="font-jp text-2xl text-sumi font-bold group-hover:text-hanko transition-colors">
                          {word.variants[0].written}
                        </span>
                        <div className="flex flex-col">
                           <span className="text-[11px] text-sumi/60 font-bold font-jp">
                             {word.variants[0].pronounced}
                           </span>
                           <span className="text-[9px] text-hanko font-mono-custom font-bold tracking-widest uppercase">
                             {convertToRomaji(word.variants[0].pronounced)}
                           </span>
                        </div>
                      </div>
                      <p className="text-xs text-sumi/70 capitalize line-clamp-2 leading-relaxed" title={word.meanings[0].glosses.join(', ')}>
                        {word.meanings[0].glosses.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/50 border border-sumi/5 p-6 rounded-sm text-center mt-2">
                   <p className="text-sm text-sumi/50 italic">No examples available.</p>
                </div>
              )}
            </div>

            <div className="pt-2 mt-auto">
              <div className="flex items-center gap-2 text-[11px] text-sumi/60 bg-white/40 p-3 rounded-sm border border-sumi/5 shadow-inner">
                <Info className="w-4 h-4 text-hanko flex-shrink-0" />
                <p>Click any pronunciation box or compound word above to hear it spoken.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-10 bg-[#EBE7DF] border-t border-sumi/10">
          <div className="h-[400px] max-w-4xl mx-auto">
            <PracticePad kanjiChar={kanji.kanji} maxStrokes={kanji.strokes} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanjiExplorer;