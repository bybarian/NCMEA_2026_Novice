import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, Move, Expand } from 'lucide-react';

interface InteractiveImageViewerProps {
  children: React.ReactNode;
  title?: string;
  patientName?: string;
  chartNumber?: string;
  dateStr?: string;
  className?: string;
  minHeight?: string;
}

export const InteractiveImageViewer: React.FC<InteractiveImageViewerProps> = ({
  children,
  title,
  patientName,
  chartNumber,
  dateStr,
  className = '',
  minHeight = 'min-h-[380px]'
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset offset & zoom
  const handleReset = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoomLevel(prev => {
      const next = prev * zoomFactor;
      return Math.min(8.0, Math.max(0.3, next));
    });
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const controlsBar = (
    <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex flex-wrap justify-between items-center text-xs text-slate-300 z-30 select-none gap-2">
      <div className="flex items-center gap-2 font-sans font-semibold">
        <span className="text-slate-400 text-[11px] hidden sm:inline">🔍 縮放比例：</span>
        <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-900 px-2 py-0.5 rounded font-mono text-xs font-bold shadow-inner">
          {Math.round(zoomLevel * 100)}%
        </span>
        <span className="text-[10px] text-slate-500 font-normal hidden md:inline ml-2">
          (滑鼠滾輪縮放 | 左鍵按住拖曳平移)
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setZoomLevel(prev => Math.max(0.3, prev * 0.85))}
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded cursor-pointer transition-colors border border-slate-700/50"
          title="縮小 (Zoom Out - 滾輪向下)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-2.5 py-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded text-[11px] font-bold cursor-pointer transition-colors border border-slate-700/50 flex items-center gap-1.5"
          title="重設大小與位置 (100% Reset)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>100% 重設</span>
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel(prev => Math.min(8.0, prev * 1.15))}
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded cursor-pointer transition-colors border border-slate-700/50"
          title="放大 (Zoom In + 滾輪向上)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-800 mx-1"></div>
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5 border ${
            isFullscreen 
              ? 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border-rose-700' 
              : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-800/80'
          }`}
          title={isFullscreen ? "退出全螢幕 (ESC)" : "開啟全螢幕檢視"}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span>退出全螢幕</span>
            </>
          ) : (
            <>
              <Expand className="w-3.5 h-3.5" />
              <span>⛶ 全螢幕檢視</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  const canvasContent = (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={() => setIsFullscreen(!isFullscreen)}
      className={`relative overflow-hidden bg-black flex-1 flex items-center justify-center select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{ touchAction: 'none' }}
    >
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
        className="max-w-full max-h-full flex items-center justify-center pointer-events-none"
      >
        <div className="pointer-events-auto">
          {children}
        </div>
      </div>

      {/* Floating Watermarks / Info overlay */}
      {dateStr && (
        <div className="absolute top-3 left-3 text-emerald-400 font-mono text-[10px] leading-tight font-bold bg-black/75 px-2.5 py-1 rounded border border-emerald-500/30 shadow-md z-10 pointer-events-none backdrop-blur-xs">
          📅 {dateStr}
        </div>
      )}

      {(patientName || chartNumber || title) && (
        <div className="absolute top-3 right-3 text-emerald-400 font-mono text-[10px] leading-tight font-bold bg-black/75 px-2.5 py-1 rounded border border-emerald-500/30 shadow-md z-10 text-right pointer-events-none backdrop-blur-xs space-y-0.5">
          {title && <div className="text-white text-xs font-sans font-extrabold">{title}</div>}
          {patientName && <div>姓名: {patientName}</div>}
          {chartNumber && <div>病歷號: {chartNumber}</div>}
        </div>
      )}

      {/* Corner crosshairs */}
      <div className="absolute top-2 left-2 border-l border-t border-slate-500/30 w-4 h-4 pointer-events-none"></div>
      <div className="absolute top-2 right-2 border-r border-t border-slate-500/30 w-4 h-4 pointer-events-none"></div>
      <div className="absolute bottom-2 left-2 border-l border-b border-slate-500/30 w-4 h-4 pointer-events-none"></div>
      <div className="absolute bottom-2 right-2 border-r border-b border-slate-500/30 w-4 h-4 pointer-events-none"></div>

      {/* Floating helper badge */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-slate-900/80 text-slate-300 text-[10px] px-3 py-1 rounded-full border border-slate-700/60 pointer-events-none backdrop-blur-xs opacity-75 hover:opacity-100 transition-opacity flex items-center gap-1.5 font-sans">
        <Move className="w-3 h-3 text-emerald-400" />
        <span>雙擊或點擊全螢幕 | 滾輪縮放 | 左鍵拖曳平移</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Normal Embedded Viewport */}
      <div className={`bg-black rounded-lg border border-slate-800 overflow-hidden flex flex-col relative ${minHeight} ${className}`}>
        {controlsBar}
        {canvasContent}
      </div>

      {/* Fullscreen Modal Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[99999] bg-black/95 flex flex-col animate-fade-in backdrop-blur-md">
          {/* Fullscreen Header Bar */}
          <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex justify-between items-center text-white z-40">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <h3 className="font-bold text-sm tracking-wide font-sans text-emerald-400">
                  {title || '高解析度 DICOM / 醫療影像全螢幕閱讀器'}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  {patientName ? `病患: ${patientName} (${chartNumber || ''})` : ''} {dateStr ? `| 日期: ${dateStr}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-md"
              >
                <Minimize2 className="w-4 h-4" />
                <span>關閉全螢幕 (ESC)</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Controls & Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {controlsBar}
            {canvasContent}
          </div>
        </div>
      )}
    </>
  );
};
