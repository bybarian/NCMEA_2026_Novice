import React, { useState } from 'react';
import { Patient, LabReport } from '../types';
import { Microscope, Calendar, CheckCircle, Clock, FileSpreadsheet, Eye, ChevronRight } from 'lucide-react';

interface LabResultsSectionProps {
  patient: Patient;
  clinicalTime?: string;
}

export const LabResultsSection: React.FC<LabResultsSectionProps> = ({ patient, clinicalTime = '' }) => {
  const visibleReports = (patient.labReports || []).filter(r => {
    if (r.visible === false) return false;
    
    // Check scheduled display time compared to active clinical timeline
    if (r.dateTime && clinicalTime) {
      try {
        const reportTime = new Date(r.dateTime.replace(' ', 'T')).getTime();
        const curTime = new Date(clinicalTime.replace(' ', 'T')).getTime();
        if (!isNaN(reportTime) && !isNaN(curTime)) {
          if (reportTime > curTime) {
            return false; // hide scheduled future reports
          }
        }
      } catch (e) {
        // ignore date mismatch
      }
    }
    return true;
  });

  const [activeReportId, setActiveReportId] = useState<string | null>(() => {
    return visibleReports.length > 0 ? visibleReports[0].id : null;
  });

  // Sync active report if active patient is switched
  React.useEffect(() => {
    if (visibleReports.length > 0) {
      const exists = visibleReports.some(r => r.id === activeReportId);
      setActiveReportId(exists ? activeReportId : visibleReports[0].id);
    } else {
      setActiveReportId(null);
    }
  }, [patient, patient.labReports]);

  const activeReport = visibleReports.find(r => r.id === activeReportId) || null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-800" id="lab-results-workspace">
      
      {/* Tab Header with Clinical Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4 bg-slate-50 p-4 -mx-5 -mt-5 rounded-t-lg">
        <div className="flex items-center gap-2.5">
          <Microscope className="text-[#00824F] w-5.5 h-5.5 shrink-0" />
          <div>
            <h3 className="font-bold text-sm text-slate-900 font-sans">檢驗報告系統 (LIS Lab Reports)</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
              呈現臨床開立或目前已發布之抽血、尿液、生化檢驗及微生物化驗報告。
            </p>
          </div>
        </div>

        {/* Published Reports Badge Notice */}
        <div className="bg-rose-50 border border-rose-200/80 rounded-full px-3.5 py-1 flex items-center gap-2 shrink-0 shadow-2xs">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-bold text-rose-700 font-sans tracking-wide">
            已發布報告: <span className="font-mono text-sm font-extrabold text-rose-800 ml-1">{visibleReports.length}</span> 份
          </span>
        </div>
      </div>

      {visibleReports.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-xs flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-slate-50 rounded-full border border-slate-200 shadow-inner">
            <Microscope className="w-12 h-12 text-slate-350 stroke-1" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <p className="font-bold text-slate-700">目前本病案尚無任何化驗報告 (LIS Archive Empty)</p>
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              請到<strong>「開立醫囑（可開藥物）」</strong>分頁中進行抽血檢體派發。檢驗室收單後，化驗儀器將依設定時長倒數，倒數完畢後報告將立即由系統連線在此呈現。
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="lab-reports-stage-grid">
          
          {/* Left Panel: Completed Clinical Reports Directory (4 cols) */}
          <div className="lg:col-span-4 space-y-3" id="lab-directory-left-panel">
            <div className="border-b border-slate-200 pb-1.5 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>報告目錄 (Reports Archive)</span>
              <span>總共 {visibleReports.length} 筆</span>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {visibleReports.map((report) => {
                const isActive = report.id === activeReportId;
                const dateStr = new Date(report.dateTime).toLocaleDateString('zh-TW');
                const timeStr = new Date(report.dateTime).toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' });

                return (
                  <button
                    key={report.id}
                    onClick={() => setActiveReportId(report.id)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer flex items-start gap-2.5 relative group ${
                      isActive 
                        ? 'bg-[#00824F]/5 border-[#00824F] shadow-xs' 
                        : 'bg-slate-50/50 hover:bg-slate-50 border-slate-250 hover:border-slate-300'
                    }`}
                  >
                    <div className="p-1.5 bg-white rounded border border-slate-200 text-slate-600 shadow-xs shrink-0 mt-0.5">
                      <FileSpreadsheet className={`w-3.5 h-3.5 ${isActive ? 'text-[#00824F]' : 'text-slate-400'}`} />
                    </div>

                    <div className="flex-1 w-0 space-y-1">
                      <div className="font-bold text-slate-900 truncate leading-tight group-hover:text-[#00824F]">
                        {report.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{dateStr} {timeStr}</span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 self-center shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Selected Specific Report Display Sheet (8 cols) */}
          <div className="lg:col-span-8 bg-slate-50/30 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4" id="lab-details-view-panel">
            {activeReport ? (
              <div className="space-y-4">
                
                {/* Simulated Hardcopy Medical Lab Sheet Header */}
                <div className="bg-white border border-slate-250 rounded-lg p-4 shadow-xs space-y-3">
                  <div className="flex justify-between items-start gap-4 border-b border-dashed border-slate-200 pb-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 font-sans tracking-tight">泰萬綜合醫院 LIS 臨床生化檢體檢定電子報告</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">檢驗分析儀：Taiwan automated core chemistry analyzer v4.2</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border text-[#00824F] bg-emerald-50 border-emerald-200 shrink-0">
                      LIS_PASSED_QA
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-[10px] text-slate-600 font-mono">
                    <div>姓名：<span className="text-slate-900 font-bold font-sans">{patient.name}</span></div>
                    <div>病歷編號：<span className="text-slate-900 font-bold">{patient.chartNumber}</span></div>
                    <div>臨床床位：<span className="text-red-600 font-bold">{patient.bedNumber}</span></div>
                    <div>檢體採集時間：<span className="text-slate-800 font-semibold">{new Date(activeReport.dateTime).toLocaleString('zh-TW', { hour12: false })}</span></div>
                    <div className="col-span-2">報告列印時間：<span className="text-slate-800 font-semibold">{new Date().toLocaleString('zh-TW', { hour12: false })}</span></div>
                  </div>
                </div>

                {/* Lab Items Value Table */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] text-slate-500 font-bold border-b border-slate-200">
                        <th className="py-2 px-3 font-semibold">檢測項目學名 (Biomarker Name)</th>
                        <th className="py-2 px-3 text-center font-semibold">檢測結果 (Measured Value)</th>
                        <th className="py-2 px-3 text-center font-semibold text-[10px]">結果狀態</th>
                        <th className="py-2 px-3 font-semibold">標準範圍 (Reference Range)</th>
                        <th className="py-2 px-3 font-semibold">單位</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-slate-700">
                      {activeReport.items.map((item, idx) => {
                        const isHigh = item.status === 'high';
                        const isLow = item.status === 'low';
                        const isAbnormal = isHigh || isLow;

                        return (
                          <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${isAbnormal ? 'bg-amber-50/5' : ''}`}>
                            {/* Biomarker name */}
                            <td className="py-2 px-3 font-semibold font-mono text-slate-850">
                              {item.name}
                            </td>

                            {/* Measured value */}
                            <td className="py-2 px-3 text-center font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                isHigh ? 'text-red-600 font-bold font-mono underline bg-red-50/60' :
                                isLow ? 'text-blue-600 font-bold font-mono underline bg-blue-50/60' :
                                'text-slate-900'
                              }`}>
                                {item.value}
                              </span>
                            </td>

                            {/* Range condition status icon text */}
                            <td className="py-2 px-3 text-center">
                              {isHigh && (
                                <span className="font-mono font-bold text-[9px] bg-red-100 text-red-700 border border-red-300 px-1.5 py-0.2 rounded-full">
                                  ▲ HIGH (偏高)
                                </span>
                              )}
                              {isLow && (
                                <span className="font-mono font-bold text-[9px] bg-blue-100 text-blue-700 border border-blue-300 px-1.5 py-0.2 rounded-full">
                                  ▼ LOW (偏低)
                                </span>
                              )}
                              {!isAbnormal && (
                                <span className="font-mono font-bold text-[9px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.2 rounded-full">
                                  NORMAL (正常)
                                </span>
                              )}
                            </td>

                            {/* Normal bounds */}
                            <td className="py-2 px-3 font-mono text-slate-500 font-medium">
                              {item.referenceRange}
                            </td>

                            {/* Measurement unit */}
                            <td className="py-2 px-3 text-slate-450 font-mono text-[10px]">
                              {item.unit || 'n/a'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>



              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                <p>請點擊左側檢驗報告目錄，載入並檢視完整檢測數據明細。</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
