import React, { useState } from 'react';
import { Patient, ImagingStudy } from '../types';
import { Image as ImageIcon, Calendar, FileText, LayoutGrid, Eye, Search } from 'lucide-react';
import { ChestXrayDrawing, AbdominalCtDrawing, BrainCtDrawing, UltrasoundDrawing, PlaceholderDrawing } from './MedicalDrawings';
import { InteractiveImageViewer } from './InteractiveImageViewer';

interface RadiologySectionProps {
  patient: Patient;
  clinicalTime?: string;
}

const formatWatermarkDate = (dateTimeStr: string) => {
  try {
    const d = new Date(dateTimeStr.replace(' ', 'T'));
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      return `${y}年${m}月${date}日`;
    }
  } catch (e) {
    // ignore
  }
  // Fallback if not standard Date
  return dateTimeStr.split(' ')[0] || dateTimeStr;
};

export const RadiologySection: React.FC<RadiologySectionProps> = ({ patient, clinicalTime = '' }) => {
  const visibleStudies = (patient.imagingStudies || []).filter(study => {
    if (study.visible === false) return false;
    
    // Check scheduled display time compared to active clinical timeline ONLY if publishMode is 'scheduled'
    if (study.publishMode === 'scheduled' && study.dateTime && clinicalTime) {
      try {
        const studyTime = new Date(study.dateTime.replace(' ', 'T')).getTime();
        const curTime = new Date(clinicalTime.replace(' ', 'T')).getTime();
        if (!isNaN(studyTime) && !isNaN(curTime)) {
          if (studyTime > curTime) {
            return false; // hide scheduled future studies
          }
        }
      } catch (e) {
        // ignore date mismatch
      }
    }
    return true;
  });

  const [activeStudyId, setActiveStudyId] = useState<string | null>(() => {
    return visibleStudies.length > 0 ? visibleStudies[0].id : null;
  });

  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Sync active study if active patient is switched
  React.useEffect(() => {
    if (visibleStudies.length > 0) {
      const exists = visibleStudies.some(s => s.id === activeStudyId);
      setActiveStudyId(exists ? activeStudyId : visibleStudies[0].id);
    } else {
      setActiveStudyId(null);
    }
  }, [patient, patient.imagingStudies]);

  // Reset zoom when switching active study
  React.useEffect(() => {
    setZoomLevel(1.0);
  }, [activeStudyId]);

  const activeStudy = visibleStudies.find(s => s.id === activeStudyId) || null;

  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, boolean>>({});

  // Helper to render the relevant medical image/SVG
  const renderImagingVisual = (imgUrl: string, type: string) => {
    const isImageFile = imgUrl && (
      imgUrl.startsWith('data:') || 
      imgUrl.startsWith('http://') || 
      imgUrl.startsWith('https://') || 
      imgUrl.startsWith('/') || 
      imgUrl.startsWith('./') ||
      imgUrl.includes('.jpg') ||
      imgUrl.includes('.png') ||
      imgUrl.includes('.jpeg') ||
      imgUrl.includes('.webp') ||
      imgUrl.includes('.gif')
    );

    // If an image URL failed to load or is not an image file path, render vector fallback drawings
    if (!isImageFile || failedImageUrls[imgUrl]) {
      switch (imgUrl) {
        case 'appendicitis':
        case 'ct_appendicitis':
          return <AbdominalCtDrawing className="w-full h-80" hasAppendicitis={true} />;
        case 'pneumonia':
        case 'cxr_pneumonia':
          return <ChestXrayDrawing className="w-full h-80" hasInfiltration={true} />;
        case 'cxr2_severe':
          return <ChestXrayDrawing className="w-full h-80" hasCxr2={true} />;
        case 'cxr3_tubes':
          return <ChestXrayDrawing className="w-full h-80" hasCxr3={true} />;
        case 'brain':
          return <BrainCtDrawing className="w-full h-80" hasBrainLesion={true} />;
        case 'ultrasound':
        case 'ultrasound_appendix':
          return <UltrasoundDrawing className="w-full h-80" />;
        case 'ct_diaphragmatic_hernia':
          return <AbdominalCtDrawing className="w-full h-80" hasAppendicitis={false} />;
        case 'blank_cxr':
          return <ChestXrayDrawing className="w-full h-80" hasInfiltration={false} />;
        case 'blank_ct':
          return <AbdominalCtDrawing className="w-full h-80" hasAppendicitis={false} />;
        default:
          if (type === 'XRAY') {
            return <ChestXrayDrawing className="w-full h-80" hasInfiltration={true} />;
          } else if (type === 'CT') {
            return <AbdominalCtDrawing className="w-full h-80" hasAppendicitis={true} />;
          } else if (type === 'ULTRASOUND') {
            return <UltrasoundDrawing className="w-full h-80" />;
          }
          return <PlaceholderDrawing className="w-full h-80" />;
      }
    }

    return (
      <div className="w-full h-80 bg-slate-950 flex items-center justify-center rounded-lg overflow-hidden border border-slate-800">
        <img 
          src={imgUrl} 
          alt="Radiology imaging study" 
          className="max-w-full max-h-full object-contain" 
          referrerPolicy="no-referrer"
          onError={() => {
            setFailedImageUrls(prev => ({ ...prev, [imgUrl]: true }));
          }}
        />
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-800" id="radiology-workspace-container">
      
      {/* Header and Clinical overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4 bg-slate-50 p-4 -mx-5 -mt-5 rounded-t-lg">
        <div className="flex items-center gap-2.5">
          <ImageIcon className="text-[#00824F] w-5.5 h-5.5 shrink-0" />
          <div>
            <h3 className="font-bold text-sm text-slate-900 font-sans">影像顯示系統 (PACS Radiology)</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
              呈現臨床開立或目前已發布之 X 光 (CXR)、電腦斷層 (CT) 等放射學影像診斷結果。
            </p>
          </div>
        </div>

        {/* Published Reports Badge Notice */}
        <div className="bg-rose-50 border border-rose-200/80 rounded-full px-3.5 py-1 flex items-center gap-2 shrink-0 shadow-2xs">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-bold text-rose-700 font-sans tracking-wide">
            已發布報告: <span className="font-mono text-sm font-extrabold text-rose-800 ml-1">{visibleStudies.length}</span> 份
          </span>
        </div>
      </div>

       {visibleStudies.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-xs flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-slate-50 rounded-full border border-slate-200 shadow-inner">
            <ImageIcon className="w-12 h-12 text-slate-350 stroke-1" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <p className="font-bold text-slate-700">放射與電切片庫房空置中 (No Imaging Reports)</p>
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              請到<strong>「開立醫囑（可開藥物）」</strong>分頁中追加電腦斷層掃描檢查（CT Scan）。
              影像儀校準並啟動掃描傳輸後，將依放射學時效完成，隨即同步推播影像底片至此分頁。
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="radiology-main-portal-grid">
          
          {/* Left Panel: Completed Studies List (4 cols) */}
          <div className="lg:col-span-4 space-y-3" id="PACS-indexes-list">
            <div className="border-b border-slate-200 pb-1.5 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>影像儀切片列表 (Studies Archive)</span>
              <span>共 {visibleStudies.length} 份</span>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {visibleStudies.map((study) => {
                const isActive = study.id === activeStudyId;
                const isCt = study.studyType === 'CT';
                const isXray = study.studyType === 'XRAY';

                return (
                  <button
                    key={study.id}
                    onClick={() => setActiveStudyId(study.id)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer flex items-start gap-2.5 relative group ${
                      isActive 
                        ? 'bg-[#00824F]/5 border-[#00824F] shadow-xs font-bold' 
                        : 'bg-slate-50/50 hover:bg-slate-50 border-slate-250 hover:border-slate-300'
                    }`}
                  >
                    <div className="p-1.5 bg-white rounded border border-slate-200 text-slate-600 shadow-xs shrink-0 mt-0.5">
                      <LayoutGrid className={`w-3.5 h-3.5 ${isActive ? 'text-[#00824F]' : 'text-slate-400'}`} />
                    </div>

                    <div className="flex-1 w-0 space-y-1">
                      <div className="font-bold text-slate-900 truncate leading-tight group-hover:text-[#00824F]">
                        {study.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                        <span className="font-bold text-[#00824F] bg-emerald-50 px-1 rounded border border-emerald-150">
                          {study.studyType}
                        </span>
                        <span>{new Date(study.dateTime).toLocaleDateString('zh-TW')} {new Date(study.dateTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Integrated DICOM viewport simulation (8 cols) */}
          <div className="lg:col-span-8 bg-slate-950 rounded-xl p-4 flex flex-col justify-between border border-slate-800" id="PACS-dicom-viewport">
            {activeStudy ? (
              <div className="space-y-4">
                {/* Viewport Head */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-slate-100 font-bold">{activeStudy.title}</span>
                  </div>
                  <span>DICOM WINDOW: WIDTH 350 / LEVEL 40</span>
                </div>

                {/* Interactive DICOM Viewer Component */}
                <InteractiveImageViewer
                  title={activeStudy.title}
                  patientName={patient.name}
                  chartNumber={patient.chartNumber}
                  dateStr={formatWatermarkDate(activeStudy.dateTime)}
                  minHeight="min-h-[380px]"
                >
                  {renderImagingVisual(activeStudy.imageUrl, activeStudy.studyType)}
                </InteractiveImageViewer>

              </div>
            ) : (
              <div className="py-24 text-center text-slate-550 text-xs font-semibold flex flex-col items-center justify-center space-y-2">
                <p>請點擊左側目錄加載病患 PACS 顯影與放射切片</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
