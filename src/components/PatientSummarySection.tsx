import React from 'react';
import { Patient } from '../types';
import { FileText, Eye, AlertCircle, Bookmark, History, Users } from 'lucide-react';

interface PatientSummarySectionProps {
  patient: Patient;
}

export const PatientSummarySection: React.FC<PatientSummarySectionProps> = ({ patient }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-slate-800" id="summary-section-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4 bg-slate-50/65 p-4 -mx-5 -mt-5 rounded-t-lg">
        <div className="flex items-center gap-2">
          <FileText className="text-[#00824F] w-5.5 h-5.5" />
          <div>
            <h3 className="font-bold text-sm text-slate-900 font-sans">病情摘要</h3>
          </div>
        </div>


      </div>

      <div className="space-y-4">
        
        {/* SECTION 1: 入院主診斷 */}
        <div className="border border-red-100 rounded-lg p-4 bg-red-50/20 space-y-1.5">
          <h4 className="text-xs font-bold text-red-800 flex items-center gap-1.5 tracking-wide">
            <AlertCircle className="w-4 h-4 text-red-650" />
            一、入院主診斷
          </h4>
          <p className="text-xs text-slate-800 font-sans font-bold leading-relaxed pl-5.5">
            「 {patient.admissionDiag || patient.chiefComplaint || '灌食完畢後呼吸喘、腹痛以及急慢性發熱'} 」
          </p>
        </div>

        {/* SECTION 2: 現在疾病 (History of Present Illness - HPI) */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/30 space-y-2">
          <h4 className="text-xs font-bold text-slate-850 flex items-center gap-1.5 tracking-wide">
            <Bookmark className="w-4 h-4 text-[#00824F]" />
            二、現在疾病
          </h4>
          <div className="text-xs text-slate-755 text-slate-750 font-sans leading-relaxed pl-5.5 whitespace-pre-line">
            {patient.presentIllness || patient.summary || '今日由家屬護送入院。病患主訴全身不適、病況持續進展，出現臨床發熱病徵。'}
          </div>
        </div>

        {/* SECTION 3: 過去病史 (Past Medical History - PMH) */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/30 space-y-2">
          <h4 className="text-xs font-bold text-slate-850 flex items-center gap-1.5 tracking-wide">
            <History className="w-4 h-4 text-indigo-600" />
            三、過去病史
          </h4>
          <div className="text-xs text-slate-750 font-sans leading-relaxed pl-5.5 whitespace-pre-line">
            {patient.pastMedicalHistory || '無特別系統性疾病慢性病史提報。'}
          </div>
        </div>

        {/* SECTION 4: 家族史 (Family History - FH) */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/30 space-y-2">
          <h4 className="text-xs font-bold text-slate-850 flex items-center gap-1.5 tracking-wide">
            <Users className="w-4 h-4 text-teal-600" />
            四、家族史
          </h4>
          <div className="text-xs text-slate-750 font-mono leading-relaxed pl-5.5 font-sans">
            {patient.familyHistory ? `家族遺傳與系統病史： ${patient.familyHistory}` : '無已知或顯著高血糖、心臟病或遺傳性高血壓家族病史記載。'}
          </div>
        </div>
        
      </div>
    </div>
  );
};
