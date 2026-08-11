import React from 'react';
import { Patient } from '../types';
import { User, ShieldAlert, Award, FileSpreadsheet, Heart, GraduationCap, Compass, Briefcase, Activity, Landmark, Users, IdCard } from 'lucide-react';

interface DiagnosesSectionProps {
  patient: Patient;
}

export const DiagnosesSection: React.FC<DiagnosesSectionProps> = ({ patient }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-6 shadow-sm text-slate-805" id="patient-basic-info-panel">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3 bg-slate-50/60 p-4 -mx-5 -mt-5 rounded-t-lg">
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-50 text-[#00824F] p-1.5 rounded border border-emerald-200">
            <User className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 font-sans">病人基本資料</h3>
          </div>
        </div>
        

      </div>

      {/* Grid Layout for Structured Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="demographics-grid">
        
        {/* Box 1: Biological and General Demographics */}
        <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/30">
          <h4 className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-1.5 tracking-wide flex items-center gap-1.5">
            <IdCard className="w-4 h-4 text-emerald-600" />
            生理、基本身份資訊
          </h4>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
            <div>
              <span className="text-slate-450 block font-semibold">患者姓名：</span>
              <span className="font-bold text-slate-800 text-sm">{patient.name}</span>
            </div>
            <div>
              <span className="text-slate-450 block font-semibold">病歷號碼：</span>
              <span className="font-mono font-bold text-[#00824F] text-xs bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150">{patient.chartNumber}</span>
            </div>
            <div>
              <span className="text-slate-450 block font-semibold">性別：</span>
              <span className="font-semibold text-slate-700">{patient.gender === 'M' ? '男' : patient.gender === 'F' ? '女' : '其他'}</span>
            </div>
            <div>
              <span className="text-slate-450 block font-semibold">年齡：</span>
              <span className="font-bold text-slate-800">{patient.age} 歲</span>
            </div>
            <div>
              <span className="text-slate-450 block font-semibold">出生日期：</span>
              <span className="font-mono text-slate-700 font-semibold">{patient.birthDate}</span>
            </div>
            <div>
              <span className="text-slate-450 block font-semibold">床位編號：</span>
              <span className="font-mono text-amber-700 font-bold">{patient.bedNumber}</span>
            </div>
            <div>
              <span className="text-slate-450 block font-semibold">體重 / 身高：</span>
              <span className="font-mono text-slate-700 font-semibold">{patient.weight ? `${patient.weight} kg / ${patient.height} cm` : '72 kg / 173 cm'}</span>
            </div>
            <div>
              <span className="text-slate-450 block font-semibold">現有身體狀況：</span>
              <span className="text-red-700 font-bold">{patient.physicalStatus || '正常'}</span>
            </div>
          </div>
        </div>

        {/* Box 2: Social History, Education, Religion */}
        <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/30">
          <h4 className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-1.5 tracking-wide flex items-center gap-1">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            教研/宗教/社會經濟背景
          </h4>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
            <div>
              <span className="text-slate-450 block font-semibold">教育程度：</span>
              <span className="text-slate-750 font-bold">{patient.education || '大學畢業'}</span>
            </div>
            <div>
              <span className="text-slate-450 block font-semibold">宗教信仰：</span>
              <span className="text-slate-750 font-bold">{patient.religion || '佛教'}</span>
            </div>
            <div>
              <span className="text-slate-450 block font-semibold">職業背景：</span>
              <span className="text-slate-750 font-semibold">{patient.occupation || '退休'}</span>
            </div>
            <div>
              <span className="text-slate-450 block font-semibold">運動/生活習慣：</span>
              <span className="text-slate-750 font-semibold">{patient.habits || '無特別述明'}</span>
            </div>
            <div>
              <span className="text-slate-450 block font-semibold">社會經濟背景：</span>
              <span className="text-slate-750 font-semibold">{patient.socialEconomic || '中等'}</span>
            </div>
            <div>
              <span className="text-slate-450 block font-semibold">家庭生活狀況：</span>
              <span className="text-slate-750 font-semibold truncate" title={patient.familyStatus}>{patient.familyStatus || '與同住人生活'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Box 3: Touch point - FAMILY SUPPORT (家庭支持) - High visibility requested */}
      <div className="border border-emerald-200 rounded-lg p-4.5 bg-emerald-50/30 space-y-2" id="family-support-card">
        <h4 className="text-xs font-bold text-[#00824F] flex items-center gap-1.5 border-b border-emerald-100 pb-1.5">
          <Users className="w-4 h-4 text-[#00824F]" />
          家庭支持與照顧結構 (Family Support Details)
        </h4>
        <p className="text-xs text-slate-750 font-sans leading-relaxed">
          {patient.familySupport || '配偶與其成年子女支持度良好，配合度高。'}
        </p>
      </div>

      {/* Box 4: PRE-OP ADL ASSESSMENT */}
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/20 space-y-2">
        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
          <Compass className="w-4 h-4 text-indigo-600" />
          日常生活活動能力評估 (Functional Independence / ADL)
        </h4>
        <div className="text-xs space-y-1 text-slate-750">
          <div><span className="font-semibold text-slate-500">平日術前活動度 (Pre-op ADL)：</span><strong className="text-slate-800">{patient.preOpADL || '原本可自行走路與生活自理'}</strong></div>
          <p className="text-[11px] text-slate-550 pt-0.5 font-sans leading-relaxed">
            * 備註：主要日常生活功能判定需搭配目前 SICU/病房住院後生命徵象與譫妄量表(CAM-ICU)持續評分核對。
          </p>
        </div>
      </div>

      {/* Clinical Diagnosis display kept for coherence */}
      <div className="border border-slate-200 rounded-lg p-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-slate-650" />
          現行主要住院核定診斷 (Current Registered Diagnoses)
        </h4>

        {patient.diagnoses.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium">目前本案無申報正式診斷</p>
        ) : (
          <div className="space-y-2.5">
            {patient.diagnoses.map((diag) => (
              <div key={diag.id} className="text-xs flex items-start gap-2 bg-slate-50/50 p-2.5 rounded border border-slate-150">
                <span className="bg-[#00824F]/10 text-[#00824F] px-2 py-0.5 rounded font-mono font-bold text-[9px] shrink-0 border border-[#00824F]/10">
                  {diag.icdCode || 'ICD code'}
                </span>
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-850 font-sans">{diag.description}</div>
                  {diag.notes && <div className="text-[10px] text-slate-550 italic">附註: {diag.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
