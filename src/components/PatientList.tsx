import React, { useState } from 'react';
import { Patient } from '../types';
import { Search, Plus, UserPlus, HeartPulse, Trash2, Milestone } from 'lucide-react';
import { getTemplateLab } from '../presetPatients';

interface PatientListProps {
  patients: Patient[];
  activePatientId: string | null;
  onSelectPatient: (id: string) => void;
  onAddPatient: (patient: Patient) => void;
  onDeletePatient: (id: string, passwordVerified?: boolean) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  activePatientId,
  onSelectPatient,
  onAddPatient,
  onDeletePatient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // New patient state form
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | 'Other'>('M');
  const [age, setAge] = useState<number>(30);
  const [bed, setBed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [summary, setSummary] = useState('');
  const [presetType, setPresetType] = useState<'blank' | 'appendicitis' | 'pneumonia' | 'dka'>('blank');

  const nonHiddenPatients = patients.filter((p) => !p.hidden);

  const filteredPatients = nonHiddenPatients.filter((p) => {
    const s = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      p.chartNumber.toLowerCase().includes(s) ||
      p.bedNumber.toLowerCase().includes(s)
    );
  });

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newId = `pat-${Date.now()}`;
    const cleanBed = bed.trim() || `ER-${Math.floor(Math.random() * 20)+1}`;
    const cleanDob = birthDate || new Date(2026 - age, 5, 15).toISOString().split('T')[0];
    const cleanChart = Math.floor(10000000 + Math.random() * 90000000).toString();

    let newPatient: Patient = {
      id: newId,
      chartNumber: cleanChart,
      name: name.trim(),
      gender,
      age,
      bedNumber: cleanBed,
      birthDate: cleanDob,
      summary: summary.trim() || `${name}是由一般診察系統收入之病罹。主訴無明顯不適。`,
      diagnoses: [],
      prescriptions: [],
      imagingStudies: [],
      labReports: [],
      clinicalOrders: []
    };

    // Apply template data if selected
    if (presetType === 'appendicitis') {
      newPatient.summary = `${name}，${age}歲${gender === 'M' ? '男性' : '女性'}，主訴急性右下腹疼痛合併輕微發熱、噁心。急診理學檢查 McBurney點明顯反彈痛。高度疑似急性闌尾炎。`;
      newPatient.diagnoses = [
        {
          id: `diag-${Date.now()}-1`,
          description: '急性闌尾炎 (Acute appendicitis)',
          icdCode: 'K35.80',
          recordedAt: new Date().toISOString(),
          notes: 'Strong clinical signs of localized peritoneal irritation. Recommended NPO.'
        }
      ];
      newPatient.labReports = [
        {
          id: `lab-${Date.now()}-1`,
          category: 'CBC',
          title: 'CBC 血液常規檢查',
          items: getTemplateLab('CBC', 'appendicitis'),
          dateTime: new Date().toISOString().substring(0, 16)
        },
        {
          id: `lab-${Date.now()}-2`,
          category: 'DC',
          title: 'DC 白血球分類計數',
          items: getTemplateLab('DC', 'appendicitis'),
          dateTime: new Date().toISOString().substring(0, 16)
        }
      ];
    } else if (presetType === 'pneumonia') {
      newPatient.summary = `${name}，${age}歲${gender === 'M' ? '男性' : '女性'}，主訴有發燒、嚴重黃黏痰及喘鳴症狀，胸部核對發現右下肺有濕囉音（crackles），高度懷疑肺炎。`;
      newPatient.diagnoses = [
        {
          id: `diag-${Date.now()}-1`,
          description: '社區型肺炎 (Community-acquired pneumonia)',
          icdCode: 'J15.9',
          recordedAt: new Date().toISOString(),
          notes: 'Cough with productive sputum, fever up to 38.3C.'
        }
      ];
      newPatient.labReports = [
        {
          id: `lab-${Date.now()}-1`,
          category: 'CBC',
          title: 'CBC 血液常規檢查',
          items: getTemplateLab('CBC', 'pneumonia'),
          dateTime: new Date().toISOString().substring(0, 16)
        }
      ];
    } else if (presetType === 'dka') {
      newPatient.summary = `${name}，${age}歲${gender === 'M' ? '男性' : '女性'}，呈現深快呼吸（Kussmaul breathing），意識嗜睡，血清血糖過高。高度懷疑糖尿病酮酸中毒（DKA）。`;
      newPatient.diagnoses = [
        {
          id: `diag-${Date.now()}-1`,
          description: '糖尿病酮酸中毒 (Diabetic ketoacidosis)',
          icdCode: 'E10.10',
          recordedAt: new Date().toISOString(),
          notes: 'Significant acidosis and fluid depletion.'
        }
      ];
      newPatient.labReports = [
        {
          id: `lab-${Date.now()}-1`,
          category: 'BLOOD_GAS',
          title: '動脈血氣分析 (Arterial Blood Gas)',
          items: getTemplateLab('BLOOD_GAS', 'dka'),
          dateTime: new Date().toISOString().substring(0, 16)
        },
        {
          id: `lab-${Date.now()}-2`,
          category: 'BIO',
          title: '生化檢驗報告 (電解質 & 糖)',
          items: getTemplateLab('BIO', 'dka'),
          dateTime: new Date().toISOString().substring(0, 16)
        }
      ];
    }

    onAddPatient(newPatient);
    onSelectPatient(newId);

    // Reset Form
    setName('');
    setGender('M');
    setAge(30);
    setBed('');
    setBirthDate('');
    setSummary('');
    setPresetType('blank');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-900 w-full" id="patient-list-sidebar">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <HeartPulse className="text-red-500 w-5 h-5" />
          <h2 className="font-bold text-sm tracking-tight text-slate-800 font-sans">住院病人名冊 (CPOE)</h2>
        </div>
      </div>

      {/* Add Patient Collapsible Panel */}
      {isAdding && (
        <form onSubmit={handleCreatePatient} className="p-4 border-b border-slate-200 bg-slate-50 text-xs text-slate-700 space-y-3 max-h-[480px] overflow-y-auto shadow-inner" id="form-add-patient">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[#00824F] flex items-center gap-1">
              <Milestone className="w-4 h-4" /> 登錄病人基本資料
            </span>
            <span className="text-[10px] text-slate-400">HN預配置發</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-500 mb-1 font-semibold">姓名 *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如: 王智慧"
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:border-[#00824F] text-xs shadow-sm"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-semibold">床號 (可選)</label>
              <input
                type="text"
                value={bed}
                onChange={(e) => setBed(e.target.value)}
                placeholder="例如: 12C-05"
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:border-[#00824F] text-xs shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-slate-500 mb-1 font-semibold">年齡</label>
              <input
                type="number"
                min="0"
                max="130"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:border-[#00824F] text-xs shadow-sm"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-semibold">性別</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'M' | 'F' | 'Other')}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:border-[#00824F] text-xs shadow-sm"
              >
                <option value="M">男 (M)</option>
                <option value="F">女 (F)</option>
                <option value="Other">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-semibold">出生日期</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:border-[#00824F] text-xs shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-semibold">預設臨床案例範本 (加速培訓測試)</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setPresetType('blank')}
                className={`py-1.5 px-1.5 rounded border text-left flex justify-center items-center font-bold text-[10px] shadow-sm cursor-pointer transition-colors ${presetType === 'blank' ? 'bg-[#00824F] text-white border-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                無 (空白病歷)
              </button>
              <button
                type="button"
                onClick={() => setPresetType('appendicitis')}
                className={`py-1.5 px-1.5 rounded border text-left flex flex-col items-center justify-center font-bold text-[10px] shadow-sm cursor-pointer transition-colors ${presetType === 'appendicitis' ? 'bg-red-50 text-red-900 border-red-300' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                <span>急性闌尾炎</span>
                <span className="text-[9px] text-slate-500 font-normal">含CBC, DC異常</span>
              </button>
              <button
                type="button"
                onClick={() => setPresetType('pneumonia')}
                className={`py-1.5 px-1.5 rounded border text-left flex flex-col items-center justify-center font-bold text-[10px] shadow-sm cursor-pointer transition-colors ${presetType === 'pneumonia' ? 'bg-emerald-50 text-emerald-950 border-emerald-200' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                <span>社區型肺炎</span>
                <span className="text-[9px] text-slate-500 font-normal">含發炎白血球增高</span>
              </button>
              <button
                type="button"
                onClick={() => setPresetType('dka')}
                className={`py-1.5 px-1.5 rounded border text-left flex flex-col items-center justify-center font-bold text-[10px] shadow-sm cursor-pointer transition-colors ${presetType === 'dka' ? 'bg-purple-50 text-purple-900 border-purple-300' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                <span>糖尿病酮酸中毒</span>
                <span className="text-[9px] text-slate-500 font-normal">含ABG, BIO異常</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-semibold">入院基本主訴 (病摘要初稿)</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="請述寫病患入院理學檢查、主訴等病摘資訊..."
              rows={3}
              className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:border-[#00824F] text-xs shadow-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#00824F] hover:bg-[#007043] text-white py-2 rounded font-bold text-xs tracking-wider uppercase transition-colors cursor-pointer shadow"
          >
            完成登錄並載入病歷檔案
          </button>
        </form>
      )}

      {/* Search Input */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/50 relative">
        <Search className="absolute left-6 top-5 text-slate-400 w-4 h-4" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜尋病患姓名 / 病歷號 / 床號..."
          className="w-full bg-white border border-slate-300 rounded-md py-1.5 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00824F] shadow-sm"
        />
      </div>

      {/* Patient List Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-150" id="patient-list">
        {filteredPatients.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold leading-relaxed">
            {nonHiddenPatients.length === 0 ? '目前無公開住院病患' : '查無相符的住院病人'}
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const isActive = patient.id === activePatientId;
            const hasPendingOrders = patient.clinicalOrders.some(o => o.status === 'PENDING');
            
            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient.id)}
                className={`p-3.5 flex items-start justify-between cursor-pointer group transition-all relative ${
                  isActive
                    ? 'bg-emerald-50/50 border-l-4 border-[#00824F] text-slate-950'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
                id={`patient-card-${patient.id}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm font-sans tracking-wide text-slate-900">
                      {patient.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 bg-slate-100 border border-slate-200 rounded-full font-sans text-slate-600 font-semibold">
                      {patient.age} 歲 / {patient.gender === 'M' ? '男' : patient.gender === 'F' ? '女' : '其他'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold font-mono tracking-wide">
                    <span className="bg-red-50 border border-red-100 px-1.5 py-0.2 rounded text-red-700 font-mono font-bold">
                      {patient.bedNumber} 床
                    </span>
                    <span className="font-mono">病歷: {patient.chartNumber}</span>
                  </div>
                  {/* Diagnosis Tag Preview */}
                  {patient.diagnoses.length > 0 && (
                    <div className="text-[10px] text-[#00824F] truncate max-w-[190px] font-semibold italic">
                      Dx: {patient.diagnoses[0].description}
                    </div>
                  )}
                  {hasPendingOrders && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <span className="text-[10px] text-amber-600 font-bold font-sans">醫囑檢驗分析中</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
