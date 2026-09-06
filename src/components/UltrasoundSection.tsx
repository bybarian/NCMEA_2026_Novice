import React, { useState } from 'react';
import { Patient, UltrasoundReport } from '../types';
import { Video, Calendar, Eye, ZoomIn, ZoomOut, AlertCircle, Play, Pause } from 'lucide-react';
import { UltrasoundDrawing } from './MedicalDrawings';
import { InteractiveImageViewer } from './InteractiveImageViewer';
import { SmartMedicalImage, resolveAssetUrl } from '../utils/assetHelper';

interface UltrasoundSectionProps {
  patient: Patient | null;
}

export function UltrasoundSection({ patient }: UltrasoundSectionProps) {
  const [selectedUltra, setSelectedUltra] = useState<UltrasoundReport | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [failedUltraUrls, setFailedUltraUrls] = useState<Record<string, boolean>>({});

  if (!patient) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 font-sans shadow-xs">
        請先選擇病患以檢視其重點式超音波檢查。
      </div>
    );
  }

  // Filter visible Ultrasounds for students
  const visibleUltrasounds = (patient.ultrasoundReports || []).filter(u => u.visible !== false);

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomScale(1);

  // Check if media is video (base64 video, file URL, or ending with common video extensions)
  const isVideoFile = (url: string) => {
    if (!url) return false;
    return (
      url.startsWith('data:video/') ||
      url.endsWith('.mp4') ||
      url.endsWith('.mov') ||
      url.endsWith('.webm') ||
      url.includes('blob:')
    );
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-600 animate-pulse" />
            <span>重點式超音波檢查區 (Point of Care Ultrasound - POCUS)</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            呈現臨床開立或目前已發布之重點式超音波（POCUS）動態影像、GIF 循環影片或報告判讀。
          </p>
        </div>
        <div className="bg-rose-50 border border-rose-200/80 rounded-full px-3.5 py-1 flex items-center gap-2 shrink-0 shadow-2xs">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-bold text-rose-700 font-sans tracking-wide">
            已發布報告: <span className="font-mono text-sm font-extrabold text-rose-800 ml-1">{visibleUltrasounds.length}</span> 份
          </span>
        </div>
      </div>

      {visibleUltrasounds.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs">
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Video className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-600 font-bold text-sm">目前此病患尚無任何已發布的重點式超音波檢查報告</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
            若已開立檢查醫囑，可能正在等待教官手動發布、排程發布時間未到，或臨床端正在床邊進行動態掃描。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Ultrasound List Side */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">重點式超音波報告與動態影像</div>
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {visibleUltrasounds.map((ultra) => {
                const isSelected = selectedUltra?.id === ultra.id || (!selectedUltra && visibleUltrasounds[0].id === ultra.id);
                
                // Set default auto selection
                if (!selectedUltra && isSelected) {
                  setSelectedUltra(ultra);
                }

                return (
                  <button
                    key={ultra.id}
                    onClick={() => {
                      setSelectedUltra(ultra);
                      handleResetZoom();
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer font-sans block ${
                      isSelected
                        ? 'bg-cyan-50/70 border-cyan-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-[11.5px] font-bold block truncate ${isSelected ? 'text-cyan-900 font-semibold' : 'text-slate-700'}`}>
                        {ultra.title}
                      </span>
                      {isVideoFile(ultra.imageUrl) && (
                        <span className="px-1 py-0.5 bg-cyan-100 border border-cyan-200 text-cyan-700 font-bold text-[8px] rounded shrink-0 leading-none flex items-center gap-0.5">
                          📹 動態短片
                        </span>
                      )}
                      {!isVideoFile(ultra.imageUrl) && ultra.imageUrl && (ultra.imageUrl.includes('.gif') || ultra.imageUrl.startsWith('data:image/gif')) && (
                        <span className="px-1 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[8px] rounded shrink-0 leading-none">
                          GIF 動畫
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1.5 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {ultra.dateTime.replace('T', ' ')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail and Video View */}
          <div className="lg:col-span-8">
            {selectedUltra && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-full">
                {/* Header detail */}
                <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{selectedUltra.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-bold text-[9px] font-mono">
                        ID: {selectedUltra.id}
                      </span>
                      <span className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        報告時間: {selectedUltra.dateTime.replace('T', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 shrink-0">
                    <button
                      onClick={handleZoomOut}
                      className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer"
                      title="縮小"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10.5px] font-bold text-slate-600 px-1 font-mono">{Math.round(zoomScale * 100)}%</span>
                    <button
                      onClick={handleZoomIn}
                      className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer"
                      title="放大"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className="px-1.5 py-0.5 hover:bg-slate-100 text-slate-500 text-[9px] font-bold rounded border border-slate-200 cursor-pointer"
                    >
                      重設
                    </button>
                  </div>
                </div>

                {/* Interactive Media Playback Canvas Area */}
                <InteractiveImageViewer
                  title={selectedUltra.title}
                  patientName={patient.name}
                  chartNumber={patient.chartNumber}
                  dateStr={selectedUltra.dateTime.replace('T', ' ')}
                  minHeight="min-h-[360px]"
                >
                  {(!failedUltraUrls[selectedUltra.imageUrl] && isVideoFile(selectedUltra.imageUrl)) ? (
                    <div className="relative rounded overflow-hidden border border-slate-800 shadow-md">
                      <video
                        key={selectedUltra.id} // Re-mount video on report switch
                        src={resolveAssetUrl(selectedUltra.imageUrl)}
                        controls
                        loop
                        autoPlay
                        muted
                        playsInline
                        className="max-h-[480px] max-w-full object-contain bg-black"
                        onError={() => {
                          setFailedUltraUrls(prev => ({ ...prev, [selectedUltra.imageUrl]: true }));
                        }}
                      />
                    </div>
                  ) : (!failedUltraUrls[selectedUltra.imageUrl] && (selectedUltra.imageUrl.startsWith('http') || selectedUltra.imageUrl.startsWith('data:') || selectedUltra.imageUrl.startsWith('/') || selectedUltra.imageUrl.startsWith('./') || selectedUltra.imageUrl.includes('.'))) ? (
                    <SmartMedicalImage
                      rawSrc={selectedUltra.imageUrl}
                      alt="Ultrasound Scan"
                      className="rounded border border-slate-800 shadow-md max-h-[480px] object-contain"
                      onAllFailed={() => {
                        setFailedUltraUrls(prev => ({ ...prev, [selectedUltra.imageUrl]: true }));
                      }}
                    />
                  ) : (
                    // Custom interactive fallback SVG Ultrasound radar
                    <div className="relative">
                      <UltrasoundDrawing className="w-80 h-80" />
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-cyan-950/80 text-cyan-400 border border-cyan-800 text-[8px] font-mono rounded">
                        {selectedUltra.imageUrl === 'ultrasound_appendix' ? '闌尾重點式超音波掃描模擬' : 'POCUS SIMULATOR'}
                      </div>
                    </div>
                  )}
                </InteractiveImageViewer>

                {/* Ultrasound observation guidance */}
                <div className="p-3 border-t border-slate-200 bg-slate-50/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-sans">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                    <Video className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>重點式超音波動態掃描觀察 (POCUS Ultrasound Analysis)</span>
                  </div>
                  <div className="text-[10.5px] text-slate-500 font-mono bg-white border border-slate-200 px-2.5 py-1 rounded">
                    💡 提示：請觀察上方動態/影像進行自主判讀 (無預設文字解說)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
