import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, ExternalLink, ShieldCheck, User, Calendar, AlertTriangle, RotateCcw } from 'lucide-react';

export default function ImageLightbox({ imageUrl, title, subtitle, reporter, timestamp, severity, onClose }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setScale(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setScale(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleResetZoom = (e) => {
    e.stopPropagation();
    setScale(1);
  };

  return (
    <div 
      className="fixed inset-0 z-[5000] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200 select-none font-sans"
      onClick={onClose}
    >
      {/* Top HUD Bar */}
      <div 
        className="w-full max-w-5xl flex items-center justify-between bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 sm:px-5 shadow-2xl backdrop-blur-lg z-10 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-sm sm:text-base font-display font-extrabold text-slate-100 truncate">{title || "Grievance Evidence Photo"}</h3>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-0.5">
              {reporter && (
                <span className="flex items-center gap-1 text-emerald-400 font-bold truncate">
                  <User className="w-3 h-3 shrink-0" />
                  {reporter}
                </span>
              )}
              {timestamp && (
                <span className="flex items-center gap-1 text-slate-400 shrink-0 hidden sm:flex">
                  <Calendar className="w-3 h-3 shrink-0" />
                  {new Date(timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {severity && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-red-950/30 border border-red-900/40 rounded-xl text-red-400 text-xs font-mono font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>AI Severity {severity}/10</span>
            </div>
          )}

          <div className="h-6 w-[1px] bg-slate-800 hidden sm:block mx-1" />

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition rounded-lg hover:bg-slate-850 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-xs font-bold text-slate-300 min-w-[40px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition rounded-lg hover:bg-slate-850 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {scale !== 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1.5 text-orange-400 hover:text-orange-300 transition rounded-lg hover:bg-slate-850 cursor-pointer ml-1"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
            title="Open Original in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl transition cursor-pointer ml-1"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image Viewport */}
      <div className="flex-1 w-full max-w-6xl flex items-center justify-center overflow-auto my-4 relative">
        <div className="relative transition-transform duration-200 ease-out" style={{ transform: `scale(${scale})` }}>
          <img
            src={imageUrl}
            alt={title || "Expanded Evidence"}
            className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-slate-800 bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Bottom Tip Bar */}
      <div 
        className="px-4 py-2 bg-slate-900/80 border border-slate-800/80 rounded-full text-[11px] font-mono text-slate-400 shadow-xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        💡 <span className="font-bold text-slate-300">Pro-tip:</span> Scroll or click buttons to zoom • Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-200">ESC</kbd> or click backdrop to close
      </div>
    </div>
  );
}
