import React, { useState } from 'react';
import { Patient } from '../types';
import { ClipboardCheck, Search, Filter, Calendar, HelpCircle } from 'lucide-react';

interface MedicationHistorySectionProps {
  patient: Patient;
}

export const MedicationHistorySection: React.FC<MedicationHistorySectionProps> = ({ patient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [routeFilter, setRouteFilter] = useState<'ALL' | 'PO' | 'IV' | 'OTHER'>('ALL');

  // Filter historical/issued medication items
  const filteredRx = patient.prescriptions.filter((rx) => {
    // Search keyword
    const matchesSearch = rx.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rx.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rx.frequency.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Route filter
    if (routeFilter === 'ALL') return matchesSearch;
    
    const parsedRoute = rx.route.toUpperCase();
    if (routeFilter === 'PO') return matchesSearch && parsedRoute.includes('PO');
    if (routeFilter === 'IV') return matchesSearch && parsedRoute.includes('IV');
    
    // OTHER
    return matchesSearch && !parsedRoute.includes('PO') && !parsedRoute.includes('IV');
  });

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-6 shadow-sm text-slate-800" id="medication-history-workspace">
      
      {/* Header and overview */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3 bg-slate-50 p-4 -mx-5 -mt-5 rounded-t-lg">
        <div className="flex items-center gap-2.5">
          <div className="bg-teal-50 text-teal-700 p-1.5 rounded border border-teal-200">
            <ClipboardCheck className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 font-sans">病人用藥一覽表</h3>
          </div>
        </div>
      </div>

      {/* Lookup Controls */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center justify-between text-xs">
        {/* Search bar */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋藥商品名 / 學名 / 劑量 / 醫囑頻率..."
            className="w-full bg-white border border-slate-300 rounded-md py-1.5 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-start md:justify-end">
          <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            途徑過濾:
          </span>
          <div className="flex bg-white border border-slate-200 rounded p-0.5 shadow-xs">
            {(['ALL', 'PO', 'IV', 'OTHER'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRouteFilter(r)}
                className={`py-1 px-3 text-[10px] rounded font-bold transition-colors cursor-pointer ${
                  routeFilter === r 
                    ? 'bg-teal-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {r === 'ALL' ? '全部' : r === 'PO' ? '口服 (PO)' : r === 'IV' ? '靜脈 (IV)' : '其他'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main List Table */}
      {filteredRx.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
          🔍 依據目前的關鍵字或途徑過濾，查無任何符合之用藥歷史紀錄。
          <p className="text-[10px] text-slate-450 mt-1 max-w-xs mx-auto">
            小叮嚀：您可於上方搜尋列清除檢索或更換途徑分類。
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-xs bg-white">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider font-sans">
                <th className="py-2.5 px-4 font-bold">處方藥品 / 點滴學名</th>
                <th className="py-2.5 px-4 font-bold">單次劑量 (Dosage)</th>
                <th className="py-2.5 px-4 font-bold">給藥頻率 (Freq)</th>
                <th className="py-2.5 px-4 font-bold">給藥途徑 (Route)</th>
                <th className="py-2.5 px-4 font-bold">開立單位</th>
                <th className="py-2.5 px-4 font-bold">療程天數</th>
                <th className="py-2.5 px-4 font-bold">時間戳記 (Ordered At)</th>
                <th className="py-2.5 px-4 font-bold text-center">健保審查</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-xs text-slate-700">
              {filteredRx.map((rx) => {
                const isIv = rx.route.toUpperCase().includes('IV');
                return (
                  <tr key={rx.id} className="hover:bg-slate-50 transition-colors">
                    {/* Medicine Name */}
                    <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isIv ? 'bg-indigo-500' : 'bg-teal-500'}`}></span>
                        <span>{rx.medicineName}</span>
                      </div>
                    </td>
                    
                    {/* Dosage */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-750">{rx.dosage}</td>
                    
                    {/* Frequency */}
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                        {rx.frequency}
                      </span>
                    </td>
                    
                    {/* Route */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-sans ${
                        isIv 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                          : rx.route.toUpperCase().includes('PO')
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-250 bg-emerald-50'
                          : 'bg-slate-100 text-slate-650 border-slate-200'
                      }`}>
                        {rx.route}
                      </span>
                    </td>

                    {/* Department / Unit */}
                    <td className="py-3 px-4">
                      <span className="bg-teal-50 text-teal-800 border border-teal-150 px-2 py-0.5 rounded text-[10px] font-bold">
                        {rx.dept ? `🏥 ${rx.dept}` : '🏥 門診'}
                      </span>
                    </td>
                    
                    {/* Days */}
                    <td className="py-3 px-4 font-semibold text-slate-600 font-mono">
                      {rx.days} 天
                    </td>
                    
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{new Date(rx.orderedAt).toLocaleString('zh-TW', { hour12: false })}</span>
                      </div>
                    </td>

                    {/* Quality stamp */}
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] text-[#00824F] font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        核可開架
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}



    </div>
  );
};
