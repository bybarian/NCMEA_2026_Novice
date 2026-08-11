import React, { useState } from 'react';
import { Patient, ImagingStudy, EcgReport, UltrasoundReport } from '../types';
import { 
  X, Upload, Image as ImageIcon, Activity, Video, Users, Eye, EyeOff, 
  Trash2, Plus, CheckCircle2, Clock, AlertCircle, FileText, Check, Sparkles
} from 'lucide-react';

interface AdminBackstageModalProps {
  patients: Patient[];
  activePatientId: string | null;
  onClose: () => void;
  onUpdatePatient: (updatedPatient: Patient) => void;
}

export const AdminBackstageModal: React.FC<AdminBackstageModalProps> = ({
  patients,
  activePatientId,
  onClose,
  onUpdatePatient
}) => {
  const [activeTab, setActiveTab] = useState<'radiology' | 'ecg' | 'ultrasound' | 'patients'>('radiology');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(activePatientId || (patients[0]?.id || ''));

  // Notification status
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showSuccessToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  // ==========================================
  // Form State: Radiology / Imaging (影像)
  // ==========================================
  const [radTitle, setRadTitle] = useState('');
  const [radStudyType, setRadStudyType] = useState<'XRAY' | 'CT' | 'MRI' | 'ULTRASOUND' | 'OTHER'>('XRAY');
  const [radDescription, setRadDescription] = useState('');
  const [radDateTime, setRadDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [radPublishMode, setRadPublishMode] = useState<'immediate' | 'manual' | 'timer'>('immediate');
  const [radTimerMinutes, setRadTimerMinutes] = useState<number>(9);
  const [radFilePreview, setRadFilePreview] = useState<string | null>(null);
  const [radUrlInput, setRadUrlInput] = useState('');

  // State for file compression status
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  /**
   * Safely compress image files down to max dimensions (1000px) and JPEG 0.75 quality.
   * Prevents 10MB+ base64 string freeze, LocalStorage QuotaExceededError, and Firestore size overflow.
   */
  const compressFileToDataUrl = async (file: File, maxDim = 1000, quality = 0.75): Promise<string> => {
    if (!file) throw new Error('未選擇任何檔案');

    if (!file.type.startsWith('image/')) {
      if (file.size > 8 * 1024 * 1024) {
        throw new Error('此影音檔案過大（超過 8MB），為避免網頁讀取停頓，請選擇較小的動畫或圖檔。');
      }
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('檔案讀取失敗'));
        reader.readAsDataURL(file);
      });
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const rawUrl = e.target?.result as string;
        const img = new Image();
        img.src = rawUrl;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawUrl);
            return;
          }

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to lightweight JPEG base64 (~50KB - 120KB)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(rawUrl);
      };
      reader.onerror = () => reject(new Error('檔案無法正確讀取'));
    });
  };

  const handleRadFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressFileToDataUrl(file);
        setRadFilePreview(compressed);
        showSuccessToast('✓ 影像檔案已自動完成高效能壓縮優化');
      } catch (err: any) {
        alert(err.message || '影像圖檔讀取失敗');
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleUploadRadiology = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const finalImgUrl = radFilePreview || radUrlInput.trim() || '/images/cxr1_l35.svg';

    const newStudy: ImagingStudy = {
      id: `img-admin-${Date.now()}`,
      title: radTitle.trim() || `${radStudyType} 檢查影像`,
      studyType: radStudyType,
      imageUrl: finalImgUrl,
      description: radDescription.trim() || '尚無異常敘述報告。',
      dateTime: radDateTime.replace('T', ' '),
      visible: radPublishMode === 'immediate',
      publishMode: radPublishMode,
      publishMinutesRemaining: radPublishMode === 'timer' ? radTimerMinutes : undefined,
    };

    const updatedPatient: Patient = {
      ...selectedPatient,
      imagingStudies: [newStudy, ...(selectedPatient.imagingStudies || [])]
    };

    onUpdatePatient(updatedPatient);
    showSuccessToast(`成功為【${selectedPatient.name}】新增影像檔案：${newStudy.title}`);

    // Reset Form
    setRadTitle('');
    setRadDescription('');
    setRadFilePreview(null);
    setRadUrlInput('');
  };

  // ==========================================
  // Form State: ECG (心電圖)
  // ==========================================
  const [ecgTitle, setEcgTitle] = useState('');
  const [ecgDescription, setEcgDescription] = useState('');
  const [ecgDateTime, setEcgDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [ecgPublishMode, setEcgPublishMode] = useState<'immediate' | 'manual' | 'timer'>('immediate');
  const [ecgTimerMinutes, setEcgTimerMinutes] = useState<number>(9);
  const [ecgFilePreview, setEcgFilePreview] = useState<string | null>(null);
  const [ecgUrlInput, setEcgUrlInput] = useState('');

  const handleEcgFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressFileToDataUrl(file);
        setEcgFilePreview(compressed);
        showSuccessToast('✓ 心電圖已自動完成高效能壓縮優化');
      } catch (err: any) {
        alert(err.message || '心電圖讀取失敗');
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleUploadEcg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const finalImgUrl = ecgFilePreview || ecgUrlInput.trim() || '/images/ecg1_bradycardia.svg';

    const newEcg: EcgReport = {
      id: `ecg-admin-${Date.now()}`,
      title: ecgTitle.trim() || '標準 12 導程心電圖 (12-Lead ECG)',
      imageUrl: finalImgUrl,
      description: ecgDescription.trim() || 'Normal sinus rhythm, non-specific ST-T wave changes.',
      dateTime: ecgDateTime.replace('T', ' '),
      visible: ecgPublishMode === 'immediate',
      publishMode: ecgPublishMode,
      publishMinutesRemaining: ecgPublishMode === 'timer' ? ecgTimerMinutes : undefined,
    };

    const updatedPatient: Patient = {
      ...selectedPatient,
      ecgReports: [newEcg, ...(selectedPatient.ecgReports || [])]
    };

    onUpdatePatient(updatedPatient);
    showSuccessToast(`成功為【${selectedPatient.name}】新增心電圖報告：${newEcg.title}`);

    // Reset Form
    setEcgTitle('');
    setEcgDescription('');
    setEcgFilePreview(null);
    setEcgUrlInput('');
  };

  // ==========================================
  // Form State: Ultrasound / POCUS (超音波)
  // ==========================================
  const [ultraTitle, setUltraTitle] = useState('');
  const [ultraDescription, setUltraDescription] = useState('');
  const [ultraDateTime, setUltraDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [ultraPublishMode, setUltraPublishMode] = useState<'immediate' | 'manual' | 'timer'>('immediate');
  const [ultraTimerMinutes, setUltraTimerMinutes] = useState<number>(9);
  const [ultraFilePreview, setUltraFilePreview] = useState<string | null>(null);
  const [ultraUrlInput, setUltraUrlInput] = useState('');

  const handleUltraFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressFileToDataUrl(file);
        setUltraFilePreview(compressed);
        showSuccessToast('✓ 超音波檔案已自動完成壓縮優化');
      } catch (err: any) {
        alert(err.message || '超音波讀取失敗');
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleUploadUltrasound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const finalImgUrl = ultraFilePreview || ultraUrlInput.trim() || 'ultrasound';

    const newUltra: UltrasoundReport = {
      id: `ultra-admin-${Date.now()}`,
      title: ultraTitle.trim() || '重點式床邊超音波 POCUS',
      imageUrl: finalImgUrl,
      description: ultraDescription.trim() || 'Target sign noted, non-compressible fluid collection.',
      dateTime: ultraDateTime.replace('T', ' '),
      visible: ultraPublishMode === 'immediate',
      publishMode: ultraPublishMode,
      publishMinutesRemaining: ultraPublishMode === 'timer' ? ultraTimerMinutes : undefined,
    };

    const updatedPatient: Patient = {
      ...selectedPatient,
      ultrasoundReports: [newUltra, ...(selectedPatient.ultrasoundReports || [])]
    };

    onUpdatePatient(updatedPatient);
    showSuccessToast(`成功為【${selectedPatient.name}】新增重點式超音波報告：${newUltra.title}`);

    // Reset Form
    setUltraTitle('');
    setUltraDescription('');
    setUltraFilePreview(null);
    setUltraUrlInput('');
  };

  // Toggle Visibility helpers
  const handleToggleImagingVisibility = (studyId: string) => {
    if (!selectedPatient) return;
    const updatedStudies = (selectedPatient.imagingStudies || []).map(s => {
      if (s.id === studyId) {
        return { ...s, visible: !s.visible };
      }
      return s;
    });
    onUpdatePatient({ ...selectedPatient, imagingStudies: updatedStudies });
    showSuccessToast('已更新影像發布狀態');
  };

  const handleDeleteImaging = (studyId: string) => {
    if (!selectedPatient) return;
    const updatedStudies = (selectedPatient.imagingStudies || []).filter(s => s.id !== studyId);
    onUpdatePatient({ ...selectedPatient, imagingStudies: updatedStudies });
    showSuccessToast('已刪除該筆影像');
  };

  const handleToggleEcgVisibility = (ecgId: string) => {
    if (!selectedPatient) return;
    const updatedEcgs = (selectedPatient.ecgReports || []).map(e => {
      if (e.id === ecgId) {
        return { ...e, visible: !e.visible };
      }
      return e;
    });
    onUpdatePatient({ ...selectedPatient, ecgReports: updatedEcgs });
    showSuccessToast('已更新心電圖發布狀態');
  };

  const handleDeleteEcg = (ecgId: string) => {
    if (!selectedPatient) return;
    const updatedEcgs = (selectedPatient.ecgReports || []).filter(e => e.id !== ecgId);
    onUpdatePatient({ ...selectedPatient, ecgReports: updatedEcgs });
    showSuccessToast('已刪除該筆心電圖');
  };

  const handleToggleUltraVisibility = (ultraId: string) => {
    if (!selectedPatient) return;
    const updatedUltras = (selectedPatient.ultrasoundReports || []).map(u => {
      if (u.id === ultraId) {
        return { ...u, visible: !u.visible };
      }
      return u;
    });
    onUpdatePatient({ ...selectedPatient, ultrasoundReports: updatedUltras });
    showSuccessToast('已更新超音波發布狀態');
  };

  const handleDeleteUltra = (ultraId: string) => {
    if (!selectedPatient) return;
    const updatedUltras = (selectedPatient.ultrasoundReports || []).filter(u => u.id !== ultraId);
    onUpdatePatient({ ...selectedPatient, ultrasoundReports: updatedUltras });
    showSuccessToast('已刪除該筆超音波');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-[9999] p-3 md:p-6 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full h-[90vh] max-h-[850px] flex flex-col overflow-hidden">
        
        {/* Toast Alert Header */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shrink-0 animate-bounce">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {toastMessage}
            </span>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-5 text-white flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-400/30 text-emerald-300">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-base md:text-lg text-white tracking-wide flex items-center gap-2">
                <span>教研考官與醫學資訊後台</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/40 font-mono">
                  Upload & Backstage Admin
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                可以在此上傳並發布影像、心電圖及重點式超音波資料給學生端試驗或測驗使用。
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer"
            title="關閉後台"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Patient Selector Bar */}
        <div className="bg-slate-100 border-b border-slate-200 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Users className="w-4 h-4 text-[#00824F]" />
            <span>選擇上傳對象病患：</span>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-600 shadow-xs cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.bedNumber} 床 - {p.name} (病歷號: {p.chartNumber})
                </option>
              ))}
            </select>
          </div>

          {selectedPatient && (
            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
              <span>現有影像: <strong className="text-slate-800">{selectedPatient.imagingStudies?.length || 0}</strong> 筆</span> |
              <span>心電圖: <strong className="text-slate-800">{selectedPatient.ecgReports?.length || 0}</strong> 筆</span> |
              <span>超音波: <strong className="text-slate-800">{selectedPatient.ultrasoundReports?.length || 0}</strong> 筆</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 px-4 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('radiology')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'radiology'
                ? 'bg-white border-slate-300 text-[#00824F] shadow-xs border-b-2 border-b-white -mb-px'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-[#00824F]" />
            <span>1. 影像上傳 (Radiology / CT / X-Ray)</span>
          </button>

          <button
            onClick={() => setActiveTab('ecg')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'ecg'
                ? 'bg-white border-slate-300 text-rose-600 shadow-xs border-b-2 border-b-white -mb-px'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4 text-rose-500" />
            <span>2. 心電圖上傳 (12-Lead ECG)</span>
          </button>

          <button
            onClick={() => setActiveTab('ultrasound')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'ultrasound'
                ? 'bg-white border-slate-300 text-cyan-600 shadow-xs border-b-2 border-b-white -mb-px'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Video className="w-4 h-4 text-cyan-600" />
            <span>3. 超音波上傳 (POCUS / Ultrasound)</span>
          </button>
        </div>

        {/* Modal Main View Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
          
          {/* ================= TAB 1: RADIOLOGY / IMAGING ================= */}
          {activeTab === 'radiology' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Form */}
              <form onSubmit={handleUploadRadiology} className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#00824F]" />
                    <span>上傳新放射線影像檔案</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">XRAY / CT / MRI / Ultrasound</span>
                </div>

                {/* File Dropzone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">影像圖檔上傳 (請點選或拖曳圖檔)</label>
                  <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 text-center bg-slate-50/80 hover:bg-emerald-50/30 transition-all cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleRadFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {isCompressing ? (
                      <div className="space-y-2 py-3">
                        <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-bold text-emerald-800">正在進行高效能影像處理與壓縮，請稍候...</p>
                      </div>
                    ) : radFilePreview ? (
                      <div className="space-y-2">
                        <img src={radFilePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg shadow-md border" />
                        <span className="text-[10px] text-emerald-700 font-bold block">✓ 已載入壓縮優化圖檔 (Ready)</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-2">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">點擊選擇電腦中的影像檔 (PNG, JPG, SVG, WebP)</p>
                        <p className="text-[10px] text-slate-400">系統自動開啟高壓縮防卡頓模式</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Image URL fallback */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">或 輸入影像網址 / 預設檔名 (非必填)</label>
                  <input
                    type="text"
                    value={radUrlInput}
                    onChange={(e) => setRadUrlInput(e.target.value)}
                    placeholder="https://... 或 /images/cxr1_l35.svg"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">影像標題 *</label>
                    <input
                      type="text"
                      required
                      value={radTitle}
                      onChange={(e) => setRadTitle(e.target.value)}
                      placeholder="例如: 胸部X光 PA View - 術後照"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">檢查種類 *</label>
                    <select
                      value={radStudyType}
                      onChange={(e) => setRadStudyType(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="XRAY">XRAY (X光照片)</option>
                      <option value="CT">CT (電腦斷層掃描)</option>
                      <option value="MRI">MRI (核磁共振)</option>
                      <option value="ULTRASOUND">ULTRASOUND (超音波)</option>
                      <option value="OTHER">OTHER (其他專科)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">影像判讀報告與診斷敘述 (Findings & Report)</label>
                  <textarea
                    value={radDescription}
                    onChange={(e) => setRadDescription(e.target.value)}
                    placeholder="例如: 右上肺點狀斑片浸潤，氣管插管位置良好，微量胸膜積水..."
                    rows={3}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">檢查日期時間</label>
                    <input
                      type="datetime-local"
                      value={radDateTime}
                      onChange={(e) => setRadDateTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">發布狀態控制</label>
                    <select
                      value={radPublishMode}
                      onChange={(e) => setRadPublishMode(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="immediate">🟢 立即發布 (學生端可見)</option>
                      <option value="manual">🟡 手動控制 (隱藏, 考官解鎖)</option>
                      <option value="timer">⏱️ 計時器倒數解鎖</option>
                    </select>
                  </div>
                </div>

                {radPublishMode === 'timer' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> 設定解鎖倒數剩餘分鐘數：
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={radTimerMinutes}
                        onChange={(e) => setRadTimerMinutes(Number(e.target.value))}
                        className="w-20 bg-white border border-amber-300 rounded p-1 text-center font-bold text-amber-900"
                      />
                      <span>分鐘 (例如: 設為 9 分鐘時，當倒數到 09:00 自動解鎖發布)</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#00824F] hover:bg-[#007043] text-white py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> 上傳並儲存至【{selectedPatient?.name}】病歷
                </button>
              </form>

              {/* Right Existing List */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                    【{selectedPatient?.name}】現有放射線影像檔 ({selectedPatient?.imagingStudies?.length || 0})
                  </h4>
                </div>

                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {(!selectedPatient?.imagingStudies || selectedPatient.imagingStudies.length === 0) ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs italic">
                      此病患目前尚無任何影像紀錄，請於左側表單上傳。
                    </div>
                  ) : (
                    selectedPatient.imagingStudies.map((study) => (
                      <div key={study.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-start gap-3">
                        <div className="w-20 h-20 bg-slate-900 rounded-lg overflow-hidden border shrink-0 flex items-center justify-center">
                          {study.imageUrl?.startsWith('data:') || study.imageUrl?.startsWith('http') || study.imageUrl?.startsWith('/') ? (
                            <img src={study.imageUrl} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-slate-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-slate-900 truncate">{study.title}</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono text-[9px] font-bold rounded">
                              {study.studyType}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-150">
                            {study.description || '無備註'}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                            <span>時間: {study.dateTime}</span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleImagingVisibility(study.id)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                  study.visible !== false
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {study.visible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                {study.visible !== false ? '已公開發布' : '隱藏中'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteImaging(study.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-colors"
                                title="刪除此影像"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: ECG REPORTS ================= */}
          {activeTab === 'ecg' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Form */}
              <form onSubmit={handleUploadEcg} className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-rose-500" />
                    <span>上傳心電圖報告 (12-Lead ECG)</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">12-Lead / Rhythm Strip</span>
                </div>

                {/* File Dropzone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">心電圖圖檔上傳 (請點選或拖曳圖檔)</label>
                  <div className="border-2 border-dashed border-slate-300 hover:border-rose-500 rounded-xl p-4 text-center bg-slate-50/80 hover:bg-rose-50/30 transition-all cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEcgFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {isCompressing ? (
                      <div className="space-y-2 py-3">
                        <div className="w-7 h-7 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-bold text-rose-800">心電圖自動處理與壓縮中...</p>
                      </div>
                    ) : ecgFilePreview ? (
                      <div className="space-y-2">
                        <img src={ecgFilePreview} alt="ECG Preview" className="max-h-40 mx-auto rounded-lg shadow-md border" />
                        <span className="text-[10px] text-rose-700 font-bold block">✓ 已載入心電圖檔 (Ready)</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-2">
                        <Activity className="w-8 h-8 text-rose-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">點擊選擇心電圖掃描檔 (PNG, JPG, SVG)</p>
                        <p className="text-[10px] text-slate-400">系統自動優化尺寸防卡頓</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct ECG URL fallback */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">或 輸入心電圖網址 / 預設檔名 (非必填)</label>
                  <input
                    type="text"
                    value={ecgUrlInput}
                    onChange={(e) => setEcgUrlInput(e.target.value)}
                    placeholder="https://... 或 /images/ecg1_bradycardia.svg"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">心電圖報告標題 *</label>
                  <input
                    type="text"
                    required
                    value={ecgTitle}
                    onChange={(e) => setEcgTitle(e.target.value)}
                    placeholder="例如: 標準 12 導程心電圖 (12-Lead ECG) - 術後急查"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">波形判讀與診斷描述 (ECG Interpretation)</label>
                  <textarea
                    value={ecgDescription}
                    onChange={(e) => setEcgDescription(e.target.value)}
                    placeholder="例如: Normal sinus rhythm, HR 72 bpm, ST elevation in leads II, III, aVF, suspicious for inferior MI..."
                    rows={3}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">檢查日期時間</label>
                    <input
                      type="datetime-local"
                      value={ecgDateTime}
                      onChange={(e) => setEcgDateTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">發布狀態控制</label>
                    <select
                      value={ecgPublishMode}
                      onChange={(e) => setEcgPublishMode(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-rose-500 cursor-pointer"
                    >
                      <option value="immediate">🟢 立即發布 (學生端可見)</option>
                      <option value="manual">🟡 手動控制 (隱藏, 考官解鎖)</option>
                      <option value="timer">⏱️ 計時器倒數解鎖</option>
                    </select>
                  </div>
                </div>

                {ecgPublishMode === 'timer' && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-900 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-600" /> 設定解鎖倒數剩餘分鐘數：
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={ecgTimerMinutes}
                        onChange={(e) => setEcgTimerMinutes(Number(e.target.value))}
                        className="w-20 bg-white border border-rose-300 rounded p-1 text-center font-bold text-rose-900"
                      />
                      <span>分鐘</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> 上傳並儲存心電圖至【{selectedPatient?.name}】
                </button>
              </form>

              {/* Right Existing List */}
              <div className="lg:col-span-6 space-y-3">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                  【{selectedPatient?.name}】現有心電圖報告 ({selectedPatient?.ecgReports?.length || 0})
                </h4>

                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {(!selectedPatient?.ecgReports || selectedPatient.ecgReports.length === 0) ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs italic">
                      此病患目前尚無心電圖紀錄，請由左側表單新增。
                    </div>
                  ) : (
                    selectedPatient.ecgReports.map((ecg) => (
                      <div key={ecg.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-start gap-3">
                        <div className="w-20 h-20 bg-slate-900 rounded-lg overflow-hidden border shrink-0 flex items-center justify-center">
                          {ecg.imageUrl?.startsWith('data:') || ecg.imageUrl?.startsWith('http') || ecg.imageUrl?.startsWith('/') ? (
                            <img src={ecg.imageUrl} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            <Activity className="w-8 h-8 text-rose-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-slate-900 truncate">{ecg.title}</span>
                          </div>

                          <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-150">
                            {ecg.description || '無描述報告'}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                            <span>時間: {ecg.dateTime}</span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleEcgVisibility(ecg.id)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                  ecg.visible !== false
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {ecg.visible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                {ecg.visible !== false ? '已公開發布' : '隱藏中'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteEcg(ecg.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-colors"
                                title="刪除心電圖"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: ULTRASOUND REPORTS ================= */}
          {activeTab === 'ultrasound' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Form */}
              <form onSubmit={handleUploadUltrasound} className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Video className="w-5 h-5 text-cyan-600" />
                    <span>上傳重點式超音波 (POCUS) 影像/影片</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">POCUS / Video / GIF</span>
                </div>

                {/* File Dropzone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">超音波影音檔上傳 (請點選或拖曳檔案)</label>
                  <div className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-xl p-4 text-center bg-slate-50/80 hover:bg-cyan-50/30 transition-all cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleUltraFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {isCompressing ? (
                      <div className="space-y-2 py-3">
                        <div className="w-7 h-7 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-bold text-cyan-800">超音波檔案處理壓縮中...</p>
                      </div>
                    ) : ultraFilePreview ? (
                      <div className="space-y-2">
                        {ultraFilePreview.startsWith('data:video') ? (
                          <video src={ultraFilePreview} controls className="max-h-40 mx-auto rounded-lg shadow-md border" />
                        ) : (
                          <img src={ultraFilePreview} alt="Ultrasound Preview" className="max-h-40 mx-auto rounded-lg shadow-md border" />
                        )}
                        <span className="text-[10px] text-cyan-700 font-bold block">✓ 已載入超音波檔案 (Ready)</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-2">
                        <Video className="w-8 h-8 text-cyan-500 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">點擊選擇超音波動態影片/圖片 (MP4, GIF, PNG, JPG)</p>
                        <p className="text-[10px] text-slate-400">系統自動優化防卡頓</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Ultrasound URL fallback */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">或 輸入網址 / 預設標記 (非必填)</label>
                  <input
                    type="text"
                    value={ultraUrlInput}
                    onChange={(e) => setUltraUrlInput(e.target.value)}
                    placeholder="https://... 或 ultrasound"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">重點式超音波報告標題 *</label>
                  <input
                    type="text"
                    required
                    value={ultraTitle}
                    onChange={(e) => setUltraTitle(e.target.value)}
                    placeholder="例如: 床邊腹部重點式超音波 (POCUS) - 右下腹掃描"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">超音波掃描描述與判讀報告 (Ultra Findings)</label>
                  <textarea
                    value={ultraDescription}
                    onChange={(e) => setUltraDescription(e.target.value)}
                    placeholder="例如: Target sign noted in the RLQ, blind-ending tubular structure with outer diameter 9.2 mm, non-compressible, wall hypervascularity..."
                    rows={3}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">檢查日期時間</label>
                    <input
                      type="datetime-local"
                      value={ultraDateTime}
                      onChange={(e) => setUltraDateTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">發布狀態控制</label>
                    <select
                      value={ultraPublishMode}
                      onChange={(e) => setUltraPublishMode(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="immediate">🟢 立即發布 (學生端可見)</option>
                      <option value="manual">🟡 手動控制 (隱藏, 考官解鎖)</option>
                      <option value="timer">⏱️ 計時器倒數解鎖</option>
                    </select>
                  </div>
                </div>

                {ultraPublishMode === 'timer' && (
                  <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-2.5 text-xs text-cyan-900 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-600" /> 設定解鎖倒數剩餘分鐘數：
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={ultraTimerMinutes}
                        onChange={(e) => setUltraTimerMinutes(Number(e.target.value))}
                        className="w-20 bg-white border border-cyan-300 rounded p-1 text-center font-bold text-cyan-900"
                      />
                      <span>分鐘</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> 上傳並儲存超音波至【{selectedPatient?.name}】
                </button>
              </form>

              {/* Right Existing List */}
              <div className="lg:col-span-6 space-y-3">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                  【{selectedPatient?.name}】現有超音波報告 ({selectedPatient?.ultrasoundReports?.length || 0})
                </h4>

                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {(!selectedPatient?.ultrasoundReports || selectedPatient.ultrasoundReports.length === 0) ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs italic">
                      此病患目前尚無超音波紀錄，請由左側表單新增。
                    </div>
                  ) : (
                    selectedPatient.ultrasoundReports.map((ultra) => (
                      <div key={ultra.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-start gap-3">
                        <div className="w-20 h-20 bg-slate-900 rounded-lg overflow-hidden border shrink-0 flex items-center justify-center">
                          {ultra.imageUrl?.startsWith('data:') || ultra.imageUrl?.startsWith('http') || ultra.imageUrl?.startsWith('/') ? (
                            <img src={ultra.imageUrl} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            <Video className="w-8 h-8 text-cyan-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-slate-900 truncate">{ultra.title}</span>
                          </div>

                          <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-150">
                            {ultra.description || '無描述報告'}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                            <span>時間: {ultra.dateTime}</span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleUltraVisibility(ultra.id)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                  ultra.visible !== false
                                    ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {ultra.visible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                {ultra.visible !== false ? '已公開發布' : '隱藏中'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUltra(ultra.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-colors"
                                title="刪除超音波"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>所有在後台新增的影像/心電圖/超音波皆會同步至 Firestore 雲端資料庫。</span>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            完成並關閉後台
          </button>
        </div>

      </div>
    </div>
  );
};
