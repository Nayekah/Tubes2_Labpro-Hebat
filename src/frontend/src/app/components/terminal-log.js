import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/components/language-context";

const TerminalLog = ({ messages = [] }) => {
  const [lines, setLines] = useState([]);
  const terminalRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(true);
  const lastMessageCount = useRef(0);
  const { language } = useLanguage();
  
  const terminalTexts = {
    id: {
      header: "$ Labpro hebat v1.0",
      ready: "Siap untuk eksplorasi alkimia.",
      clear: "$ hapus",
      cleared: "Terminal dibersihkan.",
      readyForSearch: "Siap untuk operasi pencarian.",
      searching: "Mencari",
      method: "Metode",
      option: "Opsi",
      recipesToShow: "Resep untuk Ditampilkan",
      nodesVisited: "Node yang Dikunjungi",
      serverExecutionTime: "Waktu Eksekusi Server",
      clientRequestTime: "Waktu Permintaan Klien",
      serverResponded: "Server berhasil merespons",
      visualizationComplete: "Visualisasi selesai",
      error: "Error"
    },
    en: {
      header: "$ Labpro Hebat v1.0",
      ready: "Ready for alchemical explorations.",
      clear: "$ clear",
      cleared: "Terminal cleared.",
      readyForSearch: "Ready for search operations.",
      searching: "Searching for",
      method: "Method",
      option: "Option", 
      recipesToShow: "Recipes to Show",
      nodesVisited: "Nodes visited",
      serverExecutionTime: "Server execution time",
      clientRequestTime: "Client request time",
      serverResponded: "Server responded successfully",
      visualizationComplete: "Visualization complete",
      error: "Error"
    }
  };
  
  const t = terminalTexts[language];
  
  const [terminalHeight, setTerminalHeight] = useState(200);
  const maxTerminalHeight = window.innerHeight * 0.5;
  const isDragging = useRef(false);
  const lastY = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    setLines([
      { text: t.header, time: new Date().toLocaleTimeString(), type: 'header' },
      { text: t.ready, time: new Date().toLocaleTimeString(), type: 'success' },
      { text: "-----------------------------------", time: new Date().toLocaleTimeString(), type: 'divider' }
    ]);
  }, [language]);

  useEffect(() => {
    if (messages.length === 0) return;

    const newMessages = messages.slice(lastMessageCount.current);
    if (newMessages.length > 0) {
      setLines(prev => [...prev, ...newMessages]);
      lastMessageCount.current = messages.length;
    }
  }, [messages]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    const updateMaxHeight = () => {
      const newMaxHeight = window.innerHeight * 0.5;
      setTerminalHeight(prevHeight => 
        Math.min(prevHeight, newMaxHeight)
      );
    };

    window.addEventListener('resize', updateMaxHeight);
    return () => window.removeEventListener('resize', updateMaxHeight);
  }, []);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    lastY.current = e.clientY;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const handleTouchStart = (e) => {
    isDragging.current = true;
    lastY.current = e.touches[0].clientY;
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      
      const deltaY = lastY.current - e.clientY;
      lastY.current = e.clientY;
      
      setTerminalHeight(prevHeight => {
        const newHeight = prevHeight + deltaY;
        return Math.min(Math.max(newHeight, 100), window.innerHeight * 0.5);
      });
    };

    const handleTouchMove = (e) => {
      if (!isDragging.current) return;
      
      const touch = e.touches[0];
      const deltaY = lastY.current - touch.clientY;
      lastY.current = touch.clientY;
      
      setTerminalHeight(prevHeight => {
        const newHeight = prevHeight + deltaY;
        return Math.min(Math.max(newHeight, 100), window.innerHeight * 0.5);
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
      document.body.style.userSelect = 'auto';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const clearTerminal = () => {
    setLines([
      { text: t.clear, time: new Date().toLocaleTimeString(), type: 'command' },
      { text: t.cleared, time: new Date().toLocaleTimeString(), type: 'info' },
      { text: t.readyForSearch, time: new Date().toLocaleTimeString(), type: 'success' },
      { text: "-----------------------------------", time: new Date().toLocaleTimeString(), type: 'divider' }
    ]);
    lastMessageCount.current = messages.length;
  };

  const getTextStyle = (type, text) => {
    if (text.includes('✓')) return 'text-emerald-400 font-bold';
    if (text.includes('✗')) return 'text-red-400 font-bold';
    if (text.includes(`${t.searching}:`) || text.includes('Searching for:')) return 'text-cyan-400 font-semibold';
    if (text.includes(`${t.method}:`) || text.includes('Method:')) return 'text-blue-400 font-semibold';
    if (text.includes(`${t.option}:`) || text.includes('Option:')) return 'text-purple-400 font-semibold';
    if (text.includes(`${t.recipesToShow}:`) || text.includes('Recipes to Show:')) return 'text-yellow-400 font-semibold';
    if (text.includes(`${t.nodesVisited}:`) || text.includes('Nodes visited:')) return 'text-amber-400 font-semibold';
    if (text.includes(`${t.serverExecutionTime}:`) || text.includes('Server execution time:')) return 'text-fuchsia-400 font-semibold';
    if (text.includes(`${t.clientRequestTime}:`) || text.includes('Client request time:')) return 'text-violet-400 font-semibold';
    if (text.includes('---')) return 'text-gray-500';
    
    switch (type) {
      case 'header':
        return 'text-teal-400 font-bold text-base';
      case 'command':
        return 'text-blue-400 font-medium';
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-emerald-400';
      case 'warning':
        return 'text-amber-400';
      case 'info':
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`fixed bottom-0 left-0 right-0 text-sm z-40 transition-all duration-300 
        bg-gradient-to-b from-gray-900/95 to-black/95 shadow-2xl
        border-t border-gray-700/50`}
      style={{ height: isMinimized ? '40px' : `${terminalHeight}px` }}
    >
      {/* Resize handle */}
      {!isMinimized && (
        <div 
          className="absolute top-0 left-0 right-0 h-3 cursor-row-resize hover:bg-gray-700/30 transition-colors"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-1 bg-gray-600 rounded-full" />
        </div>
      )}

      {/* Terminal Header */}
      <div className={`flex items-center justify-between bg-gray-800/80 backdrop-blur-sm px-4 py-2 border-b border-gray-700 ${isMinimized ? '' : 'mt-3'}`}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
          <span className="ml-2 text-gray-300 font-mono">visual:~/logs</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearTerminal}
            className="text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
          >
            {language === 'id' ? 'Hapus' : 'Clear'}
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
          >
            {isMinimized ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      {!isMinimized && (
        <div 
          ref={terminalRef}
          className="overflow-y-auto p-4 font-mono"
          style={{ 
            height: `calc(100% - 52px)`,
            backgroundColor: 'rgba(10, 10, 10, 0.95)',
            scrollbarWidth: 'thin',
            scrollbarColor: '#4a5568 transparent'
          }}
        >
          {lines.map((line, index) => (
            <div key={index} className="mb-1.5">
              <span className={getTextStyle(line.type, line.text)}>
                <span className="text-gray-500 mr-2">[{line.time}]</span>
                {line.text}
              </span>
            </div>
          ))}
          <div className="text-cyan-400 animate-pulse mt-2">
            <span className="text-gray-500">$</span> _
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminalLog;