import React, { useState } from 'react';
import { Patient, DiagnosisRecord, Prescription } from '../types';
import { ClipboardList, Plus, Trash2, CalendarCheck2 } from 'lucide-react';

interface EMRSectionProps {
  patient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => void;
}

export const EMRSection: React.FC<EMRSectionProps> = ({ patient, onUpdatePatient }) => {
  const [diagDesc, setDiagDesc] = useState('');
  const [diagIcd, setDiagIcd] = useState('');
  const [diagNotes, setDiagNotes] = useState('');

  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFreq, setMedFreq] = useState('TID (每日三次)');
  const [medRoute, setMedRoute] = useState('PO (口服)');
  const [medDays, setMedDays] = useState(3);

  const handleAddDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagDesc.trim()) return;

    const newDiag: DiagnosisRecord = {
      id: `diag-${Date.now()}`,
      description: diagDesc.trim(),
      icdCode: diagIcd.trim() || undefined,
      notes: diagNotes.trim(),
      recordedAt: new Date().toISOString()
    };

    const updatedPatient: Patient = {
      ...patient,
      diagnoses: [newDiag, ...patient.diagnoses]
    };

    onUpdatePatient(updatedPatient);
    setDiagDesc('');
    setDiagIcd('');
    setDiagNotes('');
  };

  const handleDeleteDiagnosis = (id: string) => {
    const updatedPatient: Patient = {
      ...patient,
      diagnoses: patient.diagnoses.filter(d => d.id !== id)
    };
    onUpdatePatient(updatedPatient);
  };

  const handleAddPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim() || !medDosage.trim()) return;

    const newRx: Prescription = {
      id: `rx-${Date.now()}`,
      medicineName: medName.trim(),
      dosage: medDosage.trim(),
      frequency: medFreq,
      route: medRoute,
      days: Number(medDays) || 3,
      orderedAt: new Date().toISOString()
    };

    const updatedPatient: Patient = {
      ...patient,
      prescriptions: [newRx, ...patient.prescriptions]
    };

    onUpdatePatient(updatedPatient);
    setMedName('');
    setMedDosage('');
    setMedDays(3);
  };

  const handleDeletePrescription = (id: string) => {
    const updatedPatient: Patient = {
      ...patient,
      prescriptions: patient.prescriptions.filter(p => p.id !== id)
    };
    onUpdatePatient(updatedPatient);
  };

  const frequencyOptions = [
    'QD (每日一次)',
    'BID (每日兩次)',
    'TID (每日三次)',
    'QID (每日四次)',
    'Q8H (每8小時一次)',
    'Q12H (每12小時一次)',
    'PRN (需要時使用)',
    'STAT (立刻執行一次)',
    'Continuous (持續點滴滴注)'
  ];

  const routeOptions = [
    'PO (口服)',
    'IV (靜脈注射)',
    'SC (皮下注射)',
    'IM (肌肉注射)',
    'Inhalation (吸入治療)',
    'Topical (外用藥膏)',
    'PR (肛門塞劑)'
  ];

  const standardMedicationMocks = [
    { name: 'Cefazolin Injection', dosage: '1 g', freq: 'Q8H (每8小時一次)', route: 'IV (靜脈注射)' },
    { name: 'Amoxicillin/Clavulanate', dosage: '1.2 g', freq: 'Q8H (每8小時一次)', route: 'IV (靜脈注射)' },
    { name: 'Levofloxacin IV', dosage: '500 mg', freq: 'QD (每日一次)', route: 'IV (靜脈注射)' },
    { name: 'Regular Insulin (RI)', dosage: '0.1 U/kg/hr', freq: 'Continuous (持續點滴滴注)', route: 'IV (靜脈注射)' },
    { name: 'Acetaminophen (Panadol)', dosage: '500 mg', freq: 'PRN (需要時使用)', route: 'PO (口服)' },
    { name: 'Keto Intravenous Amp', dosage: '30 mg', freq: 'Q8H (每8小時一次)', route: 'IV (靜脈注射)' },
    { name: 'Normal Saline 0.9%', dosage: '1000 mL', freq: 'Continuous (持續點滴滴注)', route: 'IV (靜脈注射)' },
    { name: 'Glucose Water 5% (D5W)', dosage: '500 mL', freq: 'Continuous (持續點滴滴注)', route: 'IV (靜脈注射)' }
  ];

  const handleApplyQuickMed = (mock: typeof standardMedicationMocks[0]) => {
    setMedName(mock.name);
    setMedDosage(mock.dosage);
    setMedFreq(mock.freq);
    setMedRoute(mock.route);
  };

  return (
    <div className="space-y-6 text-slate-900" id="emr-section-container">
      {/* Grid Layout: Left is Diagnosis, Right is Medication */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* DIAGNOSIS SECTION */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-sm" id="diagnosis-panel">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
            <ClipboardList className="text-blue-600 w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-800">臨床診斷紀錄 (Diagnoses)</h3>
          </div>

          {/* Form to add Diagnosis */}
          <form onSubmit={handleAddDiagnosis} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-[11px] font-bold text-blue-900 uppercase tracking-wide">新增診斷紀錄</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[10px] text-slate-550 font-semibold mb-0.5">診斷描述 (必填)</label>
                <input
                  type="text"
                  required
                  value={diagDesc}
                  onChange={(e) => setDiagDesc(e.target.value)}
                  placeholder="例如: 急性闌尾炎"
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-950 focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-550 font-semibold mb-0.5">ICD-10 編碼</label>
                <input
                  type="text"
                  value={diagIcd}
                  onChange={(e) => setDiagIcd(e.target.value)}
                  placeholder="K35.80"
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-950 focus:outline-none focus:border-blue-500 font-mono shadow-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-550 font-semibold mb-0.5">理學檢查或備註</label>
              <textarea
                value={diagNotes}
                onChange={(e) => setDiagNotes(e.target.value)}
                placeholder="痛點、反彈痛、臨床特定指數等簡短紀錄..."
                rows={2}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-950 focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-2.5 rounded font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> 登載此項診斷
            </button>
          </form>

          {/* Diagnosis List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {patient.diagnoses.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-semibold">目前尚無診斷記錄</div>
            ) : (
              patient.diagnoses.map((d) => (
                <div key={d.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs flex justify-between items-start gap-2 group hover:border-slate-300 hover:bg-slate-50 transition-all shadow-xs">
                  <div className="space-y-1.5 flex-1 w-0">
                    <div className="flex items-center gap-2">
                      {d.icdCode && (
                        <span className="font-mono text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-bold">
                          {d.icdCode}
                        </span>
                      )}
                      <span className="font-bold text-slate-900 text-xs truncate">{d.description}</span>
                    </div>
                    {d.notes && <p className="text-slate-600 text-[11px] bg-white p-2 rounded border border-slate-1.5 border-slate-200 shadow-xs leading-relaxed">{d.notes}</p>}
                    <div className="text-[9px] text-slate-550 flex items-center gap-1 font-mono">
                      <span>錄載時間:</span>
                      <span>{new Date(d.recordedAt).toLocaleString('zh-TW')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDiagnosis(d.id)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-white rounded border border-transparent hover:border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                    title="刪除此診斷"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PRESCRIPTION MEDICINE SECTION */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-sm" id="prescription-panel">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
            <CalendarCheck2 className="text-teal-600 w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-800">處方點滴與藥物管理 (Prescriptions)</h3>
          </div>

          {/* Form to add Prescription */}
          <form onSubmit={handleAddPrescription} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-[11px] font-bold text-teal-900 uppercase tracking-wide">新增處方藥物/輸液</h4>
            
            {/* Quick picker */}
            <div>
              <label className="block text-[9px] text-slate-550 font-bold mb-1">一般常見醫囑複查 (快速帶入)</label>
              <div className="flex flex-wrap gap-1">
                {standardMedicationMocks.map((mock, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyQuickMed(mock)}
                    className="text-[9px] bg-white hover:bg-slate-150 text-slate-700 border border-slate-250 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-xs"
                  >
                    {mock.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-550 font-bold mb-0.5">藥物品名 / 點滴名稱 *</label>
                <input
                  type="text"
                  required
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="Cefazolin, Acetaminophen..."
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-950 focus:outline-none focus:border-teal-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-550 font-bold mb-0.5">劑量 (Dosage) *</label>
                <input
                  type="text"
                  required
                  value={medDosage}
                  onChange={(e) => setMedDosage(e.target.value)}
                  placeholder="500 mg / 1 g / 1000 mL"
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-950 focus:outline-none focus:border-teal-500 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-550 font-bold mb-0.5">頻率 (Frequency)</label>
                <select
                  value={medFreq}
                  onChange={(e) => setMedFreq(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-950 focus:outline-none focus:border-teal-500 shadow-sm"
                >
                  {frequencyOptions.map((f, i) => (
                    <option key={i} value={f}>{f.split(' ')[0]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-550 font-bold mb-0.5">給藥途徑 (Route)</label>
                <select
                  value={medRoute}
                  onChange={(e) => setMedRoute(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-950 focus:outline-none focus:border-teal-500 shadow-sm"
                >
                  {routeOptions.map((r, i) => (
                    <option key={i} value={r}>{r.split(' ')[0]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-550 font-bold mb-0.5">給藥天數 (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={medDays}
                  onChange={(e) => setMedDays(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-950 focus:outline-none focus:border-teal-500 shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-1.5 px-2.5 rounded font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> 開立此處方箋
            </button>
          </form>

          {/* Prescriptions List */}
          <div className="space-y-1.5 max-h-[224px] overflow-y-auto pr-1">
            {patient.prescriptions.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-semibold overflow-hidden">目前尚無處方點滴</div>
            ) : (
              <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200 shadow-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-250 text-[10px] text-slate-550 font-semibold">
                    <th className="p-2 font-bold">品名學名</th>
                    <th className="p-2 font-bold">單次劑量</th>
                    <th className="p-2 font-bold">頻率/途徑</th>
                    <th className="p-2 font-bold">天數</th>
                    <th className="p-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {patient.prescriptions.map((rx) => (
                    <tr key={rx.id} className="group hover:bg-slate-50 text-[11px]">
                      <td className="p-2 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{rx.medicineName}</span>
                          <span className="bg-teal-50/70 text-teal-800 border border-teal-150/70 px-1 py-0.2 rounded text-[8px] font-bold shrink-0">
                            {rx.dept || '門診'}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 text-slate-700">{rx.dosage}</td>
                      <td className="p-2 text-slate-750">
                        <span className="text-teal-700 font-bold font-mono">{rx.frequency.split(' ')[0]}</span>
                        <span className="text-slate-400 ml-1">({rx.route.split(' ')[0]})</span>
                      </td>
                      <td className="p-2 font-mono text-slate-600">{rx.days}天</td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => handleDeletePrescription(rx.id)}
                          className="p-1 text-slate-450 hover:text-red-500 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-transparent hover:border-slate-200"
                          title="刪除此處方"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
