import React, { useState } from 'react';
import { Patient, EcgReport } from '../types';
import { Activity, Calendar, Eye, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { InteractiveImageViewer } from './InteractiveImageViewer';

interface EcgSectionProps {
  patient: Patient | null;
}

export function EcgSection({ patient }: EcgSectionProps) {
  const [selectedEcg, setSelectedEcg] = useState<EcgReport | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [failedEcgUrls, setFailedEcgUrls] = useState<Record<string, boolean>>({});

  if (!patient) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 font-sans shadow-xs">
        請先選擇病患以檢視其心電圖報告。
      </div>
    );
  }

  // Filter visible ECGs for students
  const visibleEcgs = (patient.ecgReports || []).filter(ecg => ecg.visible !== false);

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomScale(1);

  return (
    <div className="space-y-5 font-sans">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
            <span>心電圖檢查報告區 (Electrocardiogram - ECG)</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            呈現臨床開立或目前已發布之 12 導程心電圖 (12-Lead ECG) 或床邊心律監視波形。
          </p>
        </div>
        <div className="bg-rose-50 border border-rose-200/80 rounded-full px-3.5 py-1 flex items-center gap-2 shrink-0 shadow-2xs">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-bold text-rose-700 font-sans tracking-wide">
            已發布報告: <span className="font-mono text-sm font-extrabold text-rose-800 ml-1">{visibleEcgs.length}</span> 份
          </span>
        </div>
      </div>

      {visibleEcgs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs">
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Activity className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-600 font-bold text-sm">目前此病患尚無任何已發布的心電圖報告</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
            若已開立檢查醫囑，可能正在等待教官手動發布、排程發布時間未到，或臨床端正在安排檢測。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ECG List Side */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">心電圖報告清單</div>
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {visibleEcgs.map((ecg) => {
                const isSelected = selectedEcg?.id === ecg.id || (!selectedEcg && visibleEcgs[0].id === ecg.id);
                const isHighlighted = ecg.description ? (ecg.description.includes("危急") || ecg.description.includes("STEMI") || ecg.description.includes("顫動")) : false;
                
                // Set default auto selection
                if (!selectedEcg && isSelected) {
                  setSelectedEcg(ecg);
                }

                return (
                  <button
                    key={ecg.id}
                    onClick={() => {
                      setSelectedEcg(ecg);
                      handleResetZoom();
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer font-sans block ${
                      isSelected
                        ? 'bg-rose-50/70 border-rose-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-[11.5px] font-bold block truncate ${isSelected ? 'text-rose-900 font-semibold' : 'text-slate-700'}`}>
                        {ecg.title}
                      </span>
                      {isHighlighted && (
                        <span className="px-1 py-0.5 bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[8px] rounded shrink-0 leading-none">
                          🚨 異常心律
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1.5 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {ecg.dateTime.replace('T', ' ')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ECG Detail and Waveform View */}
          <div className="lg:col-span-8">
            {selectedEcg && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-full">
                {/* Header detail */}
                <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{selectedEcg.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-bold text-[9px] font-mono">
                        ID: {selectedEcg.id}
                      </span>
                      <span className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        報告時間: {selectedEcg.dateTime.replace('T', ' ')}
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

                {/* Interactive Waveform Canvas Area */}
                <InteractiveImageViewer
                  title={selectedEcg.title}
                  patientName={patient.name}
                  chartNumber={patient.chartNumber}
                  dateStr={selectedEcg.dateTime.replace('T', ' ')}
                  minHeight="min-h-[360px]"
                >
                  {((selectedEcg.imageUrl.startsWith('http') || selectedEcg.imageUrl.startsWith('data:') || selectedEcg.imageUrl.startsWith('/') || selectedEcg.imageUrl.startsWith('./')) && !failedEcgUrls[selectedEcg.imageUrl]) ? (
                    <img
                      src={selectedEcg.imageUrl}
                      alt="ECG Waveform"
                      referrerPolicy="no-referrer"
                      className="rounded border border-slate-800 shadow-md max-h-[500px] object-contain"
                      onError={() => {
                        setFailedEcgUrls(prev => ({ ...prev, [selectedEcg.imageUrl]: true }));
                      }}
                    />
                  ) : (
                    // Custom interactive SVG ECG Grid when no image or default fallback
                    <div className="bg-[#111827] border-2 border-red-950 rounded-lg p-3 min-w-[500px] font-mono select-none">
                      <div className="flex justify-between text-[10px] text-red-500/70 border-b border-red-950/50 pb-1 mb-2">
                        <span>LEAD II (MONITORING 25mm/s 10mm/mV)</span>
                        <span>HR: {selectedEcg.description ? (selectedEcg.description.includes("115") ? "115" : selectedEcg.description.includes("105") ? "105" : "82") : "82"} bpm</span>
                      </div>
                      {/* ECG Red Grid Pattern Background */}
                      <div className="relative h-28 bg-[radial-gradient(#3f0f15_1px,transparent_1px)] [background-size:10px_10px] border border-red-900/45 rounded overflow-hidden flex items-center">
                        {/* Animated heartbeat SVG line */}
                        <svg className="w-full h-full stroke-emerald-400 fill-none stroke-[2]" viewBox="0 0 500 100">
                          {selectedEcg.description && (selectedEcg.description.includes("心房顫動") || selectedEcg.description.includes("顫動")) ? (
                            <path d="M 0 50 Q 5 52 10 48 T 20 53 Q 23 49 25 20 T 28 85 T 32 48 Q 40 51 50 49 T 60 52 Q 65 50 70 51 T 80 49 Q 82 25 85 15 T 88 88 T 92 50 Q 100 52 110 48 T 120 53 Q 123 49 125 20 T 128 85 T 132 48 Q 140 51 150 49 T 160 52 Q 170 50 180 51 T 192 49 Q 195 25 198 15 T 201 88 T 205 50 Q 215 52 225 48 T 235 53 Q 245 49 255 51 Q 260 52 265 20 T 268 85 T 272 48 Q 280 51 290 49 T 300 52 Q 315 50 325 51 T 335 49 Q 338 25 341 15 T 344 88 T 348 50 Q 360 52 370 48 T 380 53 Q 390 49 400 51 Q 410 52 415 20 T 418 85 T 422 48 Q 430 51 445 49 T 455 52 Q 465 50 475 51 T 485 49" />
                          ) : (selectedEcg.description && selectedEcg.description.includes("STEMI")) ? (
                            <path d="M 0 50 L 40 50 L 45 45 L 48 10 L 52 90 L 55 50 L 70 30 L 110 30 L 120 50 L 160 50 L 165 45 L 168 10 L 172 90 L 175 50 L 190 30 L 230 30 L 240 50 L 280 50 L 285 45 L 288 10 L 292 90 L 295 50 L 310 30 L 350 30 L 360 50 L 400 50 L 405 45 L 408 10 L 412 90 L 415 50 L 430 30 L 470 30 L 480 50" />
                          ) : (
                            <path d="M 0 50 L 45 50 Q 50 47 53 50 T 57 50 L 60 45 L 63 15 L 67 85 L 70 50 L 75 50 Q 82 55 88 50 T 95 50 L 150 50 Q 155 47 158 50 T 162 50 L 165 45 L 168 15 L 172 85 L 175 50 L 180 50 Q 187 55 193 50 T 200 50 L 255 50 Q 260 47 263 50 T 267 50 L 270 45 L 273 15 L 277 85 L 280 50 L 285 50 Q 292 55 298 50 T 305 50 L 360 50 Q 365 47 368 50 T 372 50 L 375 45 L 378 15 L 382 85 L 385 50 L 390 50 Q 397 55 403 50 T 410 50 L 465 50" />
                          )}
                        </svg>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-900/10 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  )}
                </InteractiveImageViewer>

                {/* ECG observation guidance */}
                <div className="p-3 border-t border-slate-200 bg-slate-50/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                    <Activity className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>心電圖波形觀察 (ECG Waveform Analysis)</span>
                  </div>
                  <div className="text-[10.5px] text-slate-500 font-mono bg-white border border-slate-200 px-2.5 py-1 rounded">
                    💡 提示：請觀察上方 12 導程波形自主判讀 (無預設文字解說)
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
