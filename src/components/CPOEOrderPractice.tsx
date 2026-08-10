import React, { useState, useEffect } from 'react';
import { Patient, ClinicalOrder } from '../types';
import { 
  Send, Clock, CheckCircle, Database, Loader2, CheckSquare, 
  Square, Pill, ShieldAlert, FileText, Sparkles, Microscope, 
  Image, Layers, Trash2, FastForward 
} from 'lucide-react';
import { CBC_DC_ITEMS, BIO_ITEMS, ABG_ITEMS } from '../labCatalog';

interface CPOEOrderPracticeProps {
  patient: Patient;
  onPlaceOrder: (
    orderType: ClinicalOrder['orderType'],
    details: string,
    delaySeconds: number,
    targetDisplayTime: string,
    selectedItems?: string[]
  ) => void;
  onFastForwardOrder: (orderId: string) => void; 
  onCancelOrder: (orderId: string) => void;
}

interface DrugDBItem {
  id: string;
  name: string;
  dosage: string;
  freq: string;
  route: string;
  days: number;
  desc: string;
}

const DRUG_DB: DrugDBItem[] = [
  { id: 'atropine', name: 'Atropine 0.5mg/amp', dosage: '0.5 mg', freq: 'Q5M PRN', route: 'IV (靜脈點滴/注射)', days: 1, desc: '心跳過緩急性急救處置' },
  { id: 'dopamine', name: 'Dopamine 200mg/5mL', dosage: '5-15 mcg/kg/min', freq: 'Continuous (持續點滴)', route: 'IV (靜脈點滴/注射)', days: 1, desc: '急重症低血壓與休克點滴輸注' },
  { id: 'norepinephrine', name: 'Norepinephrine 4mg/4mL', dosage: '0.05-0.3 mcg/kg/min', freq: 'Continuous (持續點滴)', route: 'IV (靜脈點滴/注射)', days: 1, desc: '嚴重敗血性休克點滴維持升壓' },
  { id: 'epinephrine', name: 'Epinephrine 1mg/amp', dosage: '1 mg', freq: 'Q3-5M PRN', route: 'IV (靜脈點滴/注射)', days: 1, desc: 'ACLS 心肺復甦與過敏性休克一線急救' },
  { id: 'insulin', name: 'Insulin (Regular Insulin/RI)', dosage: '0.1 U/kg/hr', freq: 'Continuous (持續點滴)', route: 'SC (皮下/如胰島素)', days: 1, desc: '糖尿病酮酸中毒（DKA）或嚴重高血糖控制' },
  { id: 'glucose_water_50%', name: 'Glucose water 50% 20mL/amp', dosage: '40 mL (2 amps)', freq: 'STAT (立刻給予)', route: 'IV (靜脈點滴/注射)', days: 1, desc: '急性低血糖性昏迷急救' },
  { id: 'sodium_bicarbonate', name: 'Sodium bicarbonate 7.5% 20mL', dosage: '50 mEq (1 amp)', freq: 'STAT (立刻給予)', route: 'IV (靜脈點滴/注射)', days: 1, desc: '嚴重代謝性酸中毒或緊急降血鉀處置' },
  { id: 'calcium_gluconate', name: 'Calcium gluconate 10% 10mL', dosage: '1 g (1 amp)', freq: 'STAT (立刻給予)', route: 'IV (靜脈點滴/注射)', days: 1, desc: '高血鉀之心肌電生理保護' },
  { id: 'normal_saline_50cc', name: 'Normal saline 500cc', dosage: '500 mL', freq: 'Continuous (持續點滴)', route: 'IV (靜脈點滴/注射)', days: 1, desc: '補充足量水分與維持體液平衡' },
  { id: 'lokelma', name: 'Lokelma 5g', dosage: '5 g', freq: 'TID (每日三次)', route: 'PO (口服)', days: 3, desc: '新型高血鉀症口服降鉀排鉀粉劑' },
  { id: 'kalimate', name: 'Kalimate 5g', dosage: '5 g', freq: 'TID (每日三次)', route: 'PO (口服)', days: 3, desc: '高血鉀症常規降鉀口服或灌腸劑' },
  { id: 'bricanyl', name: 'Bricanyl (Terbutaline) 0.5mg/mL', dosage: '0.5 mg', freq: 'Q6H PRN', route: 'SC (皮下/如胰島素)', days: 3, desc: '急性支氣管痙攣/嚴重氣喘擴張' },
  { id: 'acetylcysteine', name: 'Acetylcysteine 600mg', dosage: '600 mg', freq: 'BID (每日二次)', route: 'PO (口服)', days: 5, desc: '稀釋痰液或預防顯影劑腎病變' },
  { id: 'acetaminophen_iv', name: 'Acetaminophen IV (Apotel) 1000mg/100mL', dosage: '1000 mg', freq: 'Q6H PRN', route: 'IV (靜脈點滴/注射)', days: 3, desc: '中至重度急性疼痛或退燒注射藥' },
  { id: 'acetaminophen_po', name: 'Acetaminophen PO (Panadol) 505mg', dosage: '500 mg', freq: 'Q6H PRN', route: 'PO (口服)', days: 3, desc: '輕中度疼痛或發燒退熱常規口服藥' },
  { id: 'tazocin', name: 'Tazocin (Piperacillin/Tazobactam) 4.5g', dosage: '4.5 g', freq: 'Q8H (每8小時一次)', route: 'IV (靜脈點滴/注射)', days: 7, desc: '中重度全身性細菌感染（涵蓋綠膿桿菌）' },
  { id: 'flumarin', name: 'Flumarin (Flomoxef) 1g', dosage: '1 g', freq: 'Q12H (每12小時一次)', route: 'IV (靜脈點滴/注射)', days: 5, desc: '第二代新型頭孢，針對抗藥性菌株感染' },
  { id: 'ceftriaxone', name: 'Ceftriaxone 2g', dosage: '2 g', freq: 'QD (每日一次)', route: 'IV (靜脈點滴/注射)', days: 5, desc: '經驗性第三代廣效抗生素' },
  { id: 'ceftazidime', name: 'Ceftazidime 2g', dosage: '2 g', freq: 'Q8H (每8小時一次)', route: 'IV (靜脈點滴/注射)', days: 5, desc: '第三代頭孢針對綠膿桿菌或敗血性急性感染' },
  { id: 'cefuroxime', name: 'Cefuroxime 750mg', dosage: '750 mg', freq: 'Q8H (每8小時一次)', route: 'IV (靜脈點滴/注射)', days: 5, desc: '第二代廣效抗生素，用於呼吸、軟組織、泌尿感染' },
  { id: 'cefepime', name: 'Cefepime 2g', dosage: '2 g', freq: 'Q12H (每12小時一次)', route: 'IV (靜脈點滴/注射)', days: 5, desc: '第四代強效頭孢，主要針對綠膿桿菌及革蘭氏陰性菌感染' },
  { id: 'ertapenem', name: 'Ertapenem (Ertapenum) 1g', dosage: '1 g', freq: 'QD (每日一次)', route: 'IV (靜脈點滴/注射)', days: 7, desc: '碳青黴烯類，用於中重度腹腔或肺部感染（排除綠膿）' },
  { id: 'meropenem', name: 'Meropenem (Meropenum) 1g', dosage: '1 g', freq: 'Q8H (每8小時一次)', route: 'IV (靜脈點滴/注射)', days: 7, desc: '碳青黴烯類一線後線強效抗生素，多重抗藥極重感染' },
  { id: 'levofloxacin', name: 'Levofloxacin (Cravit) 500mg', dosage: '500 mg', freq: 'QD (每日一次)', route: 'IV (靜脈點滴/注射)', days: 5, desc: 'QUINOLONE 類廣效呼吸道及泌尿道感染抗生素' },
  { id: 'moxifloxacin', name: 'Moxifloxacin (Avelox) 400mg', dosage: '400 mg', freq: 'QD (每日一次)', route: 'IV (靜脈點滴/注射)', days: 5, desc: 'QUINOLONE 類，針對肺炎、軟組織及腹腔複雜感染' },
  { id: 'ciprofloxacin', name: 'Ciprofloxacin 400mg', dosage: '400 mg', freq: 'Q12H (每12小時一次)', route: 'IV (靜脈點滴/注射)', days: 5, desc: 'QUINOLONE 類，泌尿道或腹內與腸道內菌感染廣效抗生素' },
];

export const CPOEOrderPractice: React.FC<CPOEOrderPracticeProps> = ({
  patient,
  onPlaceOrder,
  onFastForwardOrder,
  onCancelOrder,
}) => {
  // Part 1: LAB TESTS ITEMS (derived from comprehensive labCatalog)
  const LAB_ITEMS = {
    cbc: CBC_DC_ITEMS.map(item => ({ id: item.id, label: item.name })),
    bio: BIO_ITEMS.map(item => ({ id: item.id, label: item.name })),
    abg: ABG_ITEMS.map(item => ({ id: item.id, label: item.name }))
  };

  // State for selected lab checkboxes
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);

  // Part 2: IMAGING STUDIES options
  const IMAGING_OPTIONS = [
    { id: 'Chest_Xray', label: 'Chest X-ray', category: 'XRAY' },
    { id: 'Abd_Xray', label: 'Abd X-ray', category: 'XRAY' },
    { id: 'KUB', label: 'KUB', category: 'XRAY' },
    { id: 'Left_decubitis_abdomen_X_ray', label: 'Left decubitis abdomen X-ray', category: 'XRAY' },
    { id: 'Right_decubitus_abdomen_X_ray', label: 'Right decubitus abdomen X-ray', category: 'XRAY' },
    { id: 'Left_decubitis_chest_X_ray', label: 'Left decubitis chest X-ray', category: 'XRAY' },
    { id: 'Right_decubitus_chest_X_ray', label: 'Right decubitus chest X-ray', category: 'XRAY' },
    { id: 'Brain_CT_with_contrast', label: 'Brain CT with contrast', category: 'CT' },
    { id: 'Brain_CT_without_contrast', label: 'Brain CT without contrast', category: 'CT' },
    { id: 'Chest_CT_with_contrast', label: 'Chest CT with contrast', category: 'CT' },
    { id: 'Chest_CT_without_contrast', label: 'Chest CT without contrast', category: 'CT' },
    { id: 'Abdomen_pelvis_CT_with_contrast', label: 'Abdomen + pelvis CT with contrast', category: 'CT' },
    { id: 'Abdomen_pelvis_CT_without_contrast', label: 'Abdomen + pelvis CT without contrast', category: 'CT' },
    { id: 'POCUS', label: 'POCUS (Point of care ultrasound)', category: 'ULTRASOUND' },
  ];
  const [selectedImaging, setSelectedImaging] = useState<string>('Chest_Xray');
  const [imagingIndications, setImagingIndications] = useState('');

  // Part 3: THERMAL TREATMENT / MEDICATIONS
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('QD (每日一次)');
  const [medRoute, setMedRoute] = useState('PO (口服)');
  const [medDays, setMedDays] = useState(3);
  const [medIndications, setMedIndications] = useState('');
  const [showDrugSuggestions, setShowDrugSuggestions] = useState(false);

  // Timers & settings
  const [labDelaySeconds, setLabDelaySeconds] = useState(540);
  const [imgDelaySeconds, setImgDelaySeconds] = useState(15);
  const [medDelaySeconds, setMedDelaySeconds] = useState(5);

  // Helper selectors
  const toggleLabCheckbox = (labId: string) => {
    if (selectedLabs.includes(labId)) {
      setSelectedLabs(prev => prev.filter(x => x !== labId));
    } else {
      setSelectedLabs(prev => [...prev, labId]);
    }
  };

  const handleSelectAllLabs = () => {
    const allIds = [
      ...LAB_ITEMS.cbc.map(x => x.id),
      ...LAB_ITEMS.bio.map(x => x.id),
      ...LAB_ITEMS.abg.map(x => x.id)
    ];
    setSelectedLabs(allIds);
  };

  const handleClearAllLabs = () => {
    setSelectedLabs([]);
  };

  // 1. Submit Labs (分拆成 CBC / DC / BIO / BLOOD_GAS 並傳送至 App.tsx)
  const handleOrderLabsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLabs.length === 0) {
      alert('⚠️ 請至少選取一項實驗室檢驗項目！');
      return;
    }

    // Determine targeted categories
    const chosenCbc = selectedLabs.filter(id => LAB_ITEMS.cbc.some(item => item.id === id));
    const chosenBio = selectedLabs.filter(id => LAB_ITEMS.bio.some(item => item.id === id));
    const chosenAbg = selectedLabs.filter(id => LAB_ITEMS.abg.some(item => item.id === id));

    // Calculate times
    const targetTime = new Date();
    targetTime.setSeconds(targetTime.getSeconds() + labDelaySeconds);
    const targetTimeStr = targetTime.toISOString().substring(0, 16);

    const DC_IDS = ['Neutrophil_Band', 'Seg', 'Lymphocyte_S', 'L_Percent', 'Monocyte', 'Eosinophil', 'Basophil', 'Neutrophil', 'Band form', 'Lymphocyte'];

    // CBC family (excluding DC items split off)
    const actualCbcItemsOnly = chosenCbc.filter(id => !DC_IDS.includes(id));
    if (actualCbcItemsOnly.length > 0) {
      onPlaceOrder(
        'CBC', 
        `開立常規血球檢驗 (包含: ${actualCbcItemsOnly.join(', ')})`, 
        labDelaySeconds, 
        targetTimeStr, 
        actualCbcItemsOnly
      );
    }

    // DC items (Neutrophils, Lymphocytes, etc.)
    const actualDcItems = selectedLabs.filter(id => DC_IDS.includes(id));
    if (actualDcItems.length > 0) {
      onPlaceOrder(
        'DC', 
        `開立白血球分類精細測定 (包含: ${actualDcItems.join(', ')})`, 
        labDelaySeconds, 
        targetTimeStr, 
        actualDcItems
      );
    }

    // BIO items (excluding any accidental DC items)
    const actualBioItems = chosenBio.filter(id => !DC_IDS.includes(id));
    if (actualBioItems.length > 0) {
      onPlaceOrder(
        'BIO', 
        `開立臨床核心生化測定 (包含: ${actualBioItems.join(', ')})`, 
        labDelaySeconds, 
        targetTimeStr, 
        actualBioItems
      );
    }

    // BLOOD_GAS items
    if (chosenAbg.length > 0) {
      onPlaceOrder(
        'BLOOD_GAS', 
        `開立動脈血氣與酸鹼飽和度測定 (包含: ${chosenAbg.join(', ')})`, 
        labDelaySeconds, 
        targetTimeStr, 
        chosenAbg
      );
    }

    setSelectedLabs([]);
  };

  // 2. Submit Imaging
  const handleOrderImagingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = IMAGING_OPTIONS.find(o => o.id === selectedImaging);
    const label = match ? match.label : '電腦斷層檢查';

    const targetTime = new Date();
    targetTime.setSeconds(targetTime.getSeconds() + imgDelaySeconds);
    const targetTimeStr = targetTime.toISOString().substring(0, 16);

    onPlaceOrder(
      'CT', 
      `開立影像檢查：${label}`, 
      imgDelaySeconds, 
      targetTimeStr, 
      undefined
    );

    setImagingIndications('');
  };

  // 3. Submit Medication
  const handleOrderMedicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim() || !medDosage.trim()) {
      return;
    }

    // Encoded MED format parser
    const encodedMedDetails = `[MED_ORDER]名稱:${medName.trim()}|劑量:${medDosage.trim()}|頻率:${medFrequency}|途徑:${medRoute}|天數:${medDays}|適應症:${medIndications.trim() || '無臨床描述'}`;

    const medDisplayTime = new Date();
    medDisplayTime.setSeconds(medDisplayTime.getSeconds() + medDelaySeconds);
    const medDisplayTimeStr = medDisplayTime.toISOString().substring(0, 16);

    onPlaceOrder(
      'MED',
      encodedMedDetails,
      medDelaySeconds,
      medDisplayTimeStr,
      undefined
    );

    setMedName('');
    setMedDosage('');
    setMedIndications('');
  };

  return (
    <div className="space-y-6 text-slate-800" id="cpoe-workspace-root">
      
      {/* SECTION HEADER */}
      <div className="border-b border-slate-200 pb-2">
        <h2 className="text-base font-bold font-sans tracking-tight text-slate-905 text-slate-950">臨床醫囑與處方開立系統</h2>
      </div>

      {/* THREE CARDS LAYOUT FOR ORDERS ADDITION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" id="cpoe-three-parts-grid">
        
        {/* PART 1: 開立實驗室檢驗 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-4 shadow-sm flex flex-col justify-between" id="cpoe-part1-lab">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-150 pb-2.5">
              <span className="bg-emerald-50 text-[#00824F] p-1 rounded font-mono font-bold text-xs">第一部分</span>
              <h3 className="font-bold text-sm text-slate-900 font-sans flex items-center gap-1">
                <Microscope className="w-4 h-4 text-[#00824F]" />
                開立實驗室檢驗 (Lab Check)
              </h3>
            </div>

            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500 font-bold">送驗項目明細 (31點多變篩選)：</span>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={handleSelectAllLabs} 
                  className="text-[#00824F] hover:underline font-mono font-bold cursor-pointer"
                >
                  【全選】
                </button>
                <button 
                  type="button" 
                  onClick={handleClearAllLabs} 
                  className="text-slate-500 hover:underline font-mono font-bold cursor-pointer"
                >
                  【清空】
                </button>
              </div>
            </div>

            {/* Scrollable list inside to maintain neatness */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 max-h-[350px] overflow-y-auto space-y-3 font-mono text-[11px]" id="lab-checklist-canvas">
              {/* CBC GRUP */}
              <div>
                <span className="text-[10px] text-[#00824F] font-bold block border-b border-dashed border-slate-200 pb-1 mb-1.5">CBC/DC</span>
                <div className="grid grid-cols-1 gap-1">
                  {(() => {
                    const dcIds = ['Neutrophil_Band', 'Seg', 'Lymphocyte_S', 'L_Percent', 'Monocyte', 'Eosinophil', 'Basophil'];
                    const isAllDcChecked = dcIds.every(id => selectedLabs.includes(id));
                    const isAnyDcChecked = dcIds.some(id => selectedLabs.includes(id));
                    
                    const toggleAllDc = () => {
                      if (isAllDcChecked) {
                        setSelectedLabs(prev => prev.filter(id => !dcIds.includes(id)));
                      } else {
                        setSelectedLabs(prev => {
                          const withoutDc = prev.filter(id => !dcIds.includes(id));
                          return [...withoutDc, ...dcIds];
                        });
                      }
                    };

                    const renderedElements: React.ReactNode[] = [];
                    let dcHeaderInserted = false;

                    LAB_ITEMS.cbc.forEach(item => {
                      const isDcItem = dcIds.includes(item.id);

                      if (isDcItem && !dcHeaderInserted) {
                        dcHeaderInserted = true;
                        // Insert the group controller row
                        renderedElements.push(
                          <div key="dc-group-controller" className="bg-emerald-50/50 p-1 rounded border border-emerald-100/70 my-0.5">
                            <button
                              type="button"
                              onClick={toggleAllDc}
                              className="flex items-center gap-2 text-left hover:bg-emerald-100/50 p-1 rounded font-bold text-emerald-800 w-full cursor-pointer"
                            >
                              {isAllDcChecked ? (
                                <CheckSquare className="w-4 h-4 text-[#00824F] shrink-0" />
                              ) : isAnyDcChecked ? (
                                <div className="w-4 h-4 bg-[#00824F]/20 border border-[#00824F] rounded flex items-center justify-center shrink-0">
                                  <div className="w-2 h-0.5 bg-[#00824F]" />
                                </div>
                              ) : (
                                <span className="w-4 h-4 border border-slate-350 bg-white rounded block shrink-0" />
                              )}
                              <span className="truncate">📋 一鍵勾選所有 DC (白血球分類計數)</span>
                            </button>
                          </div>
                        );
                      }

                      const isChecked = selectedLabs.includes(item.id);
                      renderedElements.push(
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleLabCheckbox(item.id)}
                          className={`flex items-center gap-2 text-left hover:bg-white p-1 rounded font-mono transition-all cursor-pointer ${
                            isDcItem ? 'pl-6 border-l border-dashed border-emerald-200 ml-3.5 hover:border-emerald-400' : ''
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#00824F] shrink-0" />
                          ) : (
                            <span className="w-4 h-4 border border-slate-350 bg-white rounded block shrink-0" />
                          )}
                          <span className={`truncate ${isDcItem ? 'text-slate-500 italic' : ''}`}>{item.label}</span>
                        </button>
                      );
                    });

                    return renderedElements;
                  })()}
                </div>
              </div>

              {/* BIO GRUP */}
              <div className="pt-2">
                <span className="text-[10px] text-indigo-600 font-bold block border-b border-dashed border-slate-200 pb-1 mb-1.5">Biochemistry</span>
                <div className="grid grid-cols-1 gap-1">
                  {LAB_ITEMS.bio.map(item => {
                    const isChecked = selectedLabs.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleLabCheckbox(item.id)}
                        className="flex items-center gap-2 text-left hover:bg-white p-1 rounded font-mono"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 border border-slate-350 bg-white rounded block shrink-0" />
                        )}
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ABG GRUP */}
              <div className="pt-2">
                <span className="text-[10px] text-amber-600 font-bold block border-b border-dashed border-slate-200 pb-1 mb-1.5">Atrial blood gas</span>
                <div className="grid grid-cols-1 gap-1">
                  {LAB_ITEMS.abg.map(item => {
                    const isChecked = selectedLabs.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleLabCheckbox(item.id)}
                        className="flex items-center gap-2 text-left hover:bg-white p-1 rounded font-mono"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 border border-slate-350 bg-white rounded block shrink-0" />
                        )}
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Timer setting hidden */}

          </div>

          <button
            type="button"
            onClick={handleOrderLabsSubmit}
            className="w-full mt-3 bg-[#00824F] hover:bg-[#007043] text-white py-2 rounded-lg font-bold text-xs tracking-wider transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> 送出實驗室檢驗醫囑
          </button>
        </div>

        {/* PART 2: 開立影像檢查 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm flex flex-col justify-between" id="cpoe-part2-imaging">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-150 pb-2.5">
              <span className="bg-[#00824F] text-white p-1 rounded font-mono font-bold text-xs">第二部分</span>
              <h3 className="font-bold text-sm text-slate-900 font-sans flex items-center gap-1">
                <Image className="w-4 h-4 text-indigo-600" />
                開立影像檢查 (PACS)
              </h3>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">1. 選取造影學項目 (Imaging Type)</span>
              <div className="space-y-1.5" id="imaging-selectors-font-sans-text-xs">
                {IMAGING_OPTIONS.map(opt => {
                  const isSelected = selectedImaging === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedImaging(opt.id)}
                      className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/20 text-indigo-950 font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-650'
                      }`}
                    >
                      <span className="font-sans text-xs leading-snug">{opt.label}</span>
                      <span className="text-[9px] font-mono text-slate-400 font-medium px-1 bg-slate-100 rounded border">{opt.category}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          <button
            type="button"
            onClick={handleOrderImagingSubmit}
            className="w-full mt-3 bg-indigo-600 hover:bg-indigo-750 hover:bg-indigo-700 text-white py-2 rounded-lg font-bold text-xs tracking-wider transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> 送出影像管制醫囑
          </button>
        </div>

        {/* PART 3: 開立處置及藥物 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm flex flex-col justify-between" id="cpoe-part3-drugs">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-150 pb-2.5">
              <span className="bg-purple-100 text-purple-800 p-1 rounded font-mono font-bold text-xs border border-purple-200">第三部分</span>
              <h3 className="font-bold text-sm text-slate-900 font-sans flex items-center gap-1">
                <Pill className="w-4 h-4 text-purple-700" />
                開立處置及藥物
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">藥品/處置名稱 *</span>
                  <input
                    type="text"
                    required
                    value={medName}
                    onChange={(e) => {
                      setMedName(e.target.value);
                      setShowDrugSuggestions(true);
                    }}
                    onFocus={() => setShowDrugSuggestions(true)}
                    onBlur={() => {
                      // Small delay to allow click event to register on suggestions list
                      setTimeout(() => {
                        setShowDrugSuggestions(false);
                      }, 250);
                    }}
                    placeholder="如: Atropine, Ceftriaxone"
                    className="w-full bg-white border border-slate-300 rounded p-1.5 focus:outline-none focus:border-purple-600 font-bold font-sans text-xs"
                  />

                  {/* Suggestion overlay */}
                  {showDrugSuggestions && medName.trim().length >= 3 && (
                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50 divide-y divide-slate-100">
                      {DRUG_DB.filter(d => 
                        d.name.toLowerCase().includes(medName.toLowerCase()) || 
                        d.id.toLowerCase().includes(medName.toLowerCase())
                      ).map(drug => (
                        <button
                          key={drug.id}
                          type="button"
                          onMouseDown={() => {
                            setMedName(drug.name);
                            setMedDosage(drug.dosage);
                            setMedFrequency(drug.freq);
                            setMedRoute(drug.route);
                            setMedDays(drug.days);
                            setMedIndications(drug.desc);
                            setShowDrugSuggestions(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-purple-50 hover:text-purple-950 transition-colors flex flex-col cursor-pointer"
                        >
                          <span className="font-bold text-purple-900 text-[11px]">{drug.name}</span>
                          <span className="text-[9px] text-slate-500 truncate">
                            預設: {drug.dosage} | {drug.freq} | {drug.route}
                          </span>
                        </button>
                      ))}
                      {DRUG_DB.filter(d => 
                        d.name.toLowerCase().includes(medName.toLowerCase()) || 
                        d.id.toLowerCase().includes(medName.toLowerCase())
                      ).length === 0 && (
                        <div className="px-2.5 py-1.5 text-[10px] text-slate-400 italic">
                          (無相符預設，可自行輸入)
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">單次劑量 *</span>
                  <input
                    type="text"
                    required
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    placeholder="如: 1 g, 20 mEq"
                    className="w-full bg-white border border-slate-300 rounded p-1.5 focus:outline-none focus:border-purple-600 font-sans text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">用藥頻率</span>
                  <select
                    value={medFrequency}
                    onChange={(e) => setMedFrequency(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-1 focus:outline-none focus:border-purple-600 font-sans text-xs"
                  >
                    <option value="QD (每日一次)">QD (每日一次)</option>
                    <option value="BID (每日二次)">BID (每日二次)</option>
                    <option value="TID (每日三次)">TID (每日三次)</option>
                    <option value="Q8H (每8小時一次)">Q8H (每8小時一次)</option>
                    <option value="Q12H (每12小時一次)">Q12H (每12小時一次)</option>
                    <option value="PRN (必要時)">PRN (必要時)</option>
                    <option value="STAT (立刻給予)">STAT (立刻一次)</option>
                    <option value="Continuous (持續點滴)">Continuous (持續點滴)</option>
                  </select>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">給藥途徑</span>
                  <select
                    value={medRoute}
                    onChange={(e) => setMedRoute(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-1 focus:outline-none focus:border-purple-600 font-sans text-xs"
                  >
                    <option value="PO (口服)">PO (口服)</option>
                    <option value="IV (靜脈注射)">IV (靜脈注射)</option>
                    <option value="IV (靜脈點滴/注射)">IV (靜脈點滴)</option>
                    <option value="SC (皮下/如胰島素)">SC (皮下注射)</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 block mb-1">給藥天數 (Days)</span>
                <input
                  type="number"
                  min={1}
                  required
                  value={medDays}
                  onChange={(e) => setMedDays(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 focus:outline-none text-xs font-sans"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block">臨床用藥備註與適應症</span>
                <input
                  type="text"
                  value={medIndications}
                  onChange={(e) => setMedIndications(e.target.value)}
                  placeholder="如：控制泌尿道急性發炎.."
                  className="w-full p-1 border border-slate-300 rounded text-xs focus:outline-none font-sans"
                />
              </div>

            </div>

          </div>

          <button
            type="button"
            onClick={handleOrderMedicationSubmit}
            className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-bold text-xs tracking-wider transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> 傳送處方治療藥令
          </button>
        </div>

      </div>

      {/* RENAME SECTION TO ORDER MONITOR AT THE BOTTOM (FULL WIDTH) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm space-y-4" id="cpoe-currently-orders-bottom">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-150 pb-3 bg-slate-50 p-4 -mx-4.5 -mt-4.5 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Clock className="text-[#00824F] w-5 h-5" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 font-sans">
                目前醫囑彙整
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-250 px-2 rounded-full text-[10px] text-[#00824F] font-bold font-mono py-0.5 shrink-0 self-start sm:self-center">
            <span>PIPELINE_COUNTDOWN_ACTIVE</span>
          </div>
        </div>

        {patient.clinicalOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
            <p className="font-bold text-slate-705 text-slate-600">目前本病案尚無任何作用中之醫囑 (CPOE Queue is Empty)</p>
            <p className="text-[10px] text-slate-450 max-w-lg leading-relaxed font-sans">
              請從上方「第一部分、第二部分、或第三部分」開立對應診治抽血、影像或藥理，傳送後將即時進入上方儀器倒數監控，倒數完成後將對應解鎖 LIS 與 PACS 結果！
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pt-1 pr-1" id="bottom-orders-board">
            {patient.clinicalOrders.map((order) => {
              const isPending = order.status === 'PENDING';
              const isMedType = order.orderType === 'MED';

              // Decode prescription values if medicine
              let displayMedicineName = '未明確處方項目';
              let displayDetailLabel = order.details;

              if (isMedType && order.details.startsWith('[MED_ORDER]')) {
                const parts = order.details.split('|');
                displayMedicineName = parts.find(p => p.startsWith('名稱:'))?.replace('名稱:', '') || 'Unknown Formula';
                const dosage = parts.find(p => p.startsWith('劑量:'))?.replace('劑量:', '') || '';
                const freq = parts.find(p => p.startsWith('頻率:'))?.replace('頻率:', '') || '';
                const route = parts.find(p => p.startsWith('途徑:'))?.replace('途徑:', '') || '';
                const days = parts.find(p => p.startsWith('天數:'))?.replace('天數:', '') || '';
                displayDetailLabel = `開藥：${displayMedicineName} (${dosage}) | 頻率：${freq} | 途徑：${route} | 療程：${days} 天`;
              }

              return (
                <div 
                  key={order.id}
                  className={`p-3.5 rounded-lg border text-xs transition-all flex justify-between items-start gap-4 relative ${
                    isPending 
                      ? 'bg-amber-50/20 border-amber-300 text-slate-800' 
                      : 'bg-slate-50 border-slate-205 border-slate-200 text-slate-750'
                  }`}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                        isMedType 
                          ? 'bg-purple-50 text-purple-800 border-purple-250' 
                          : isPending 
                          ? 'bg-amber-100 text-amber-805 border-amber-300' 
                          : 'bg-emerald-50 text-[#00824F] border-emerald-300'
                      }`}>
                        {order.orderType === 'MED' ? '藥物處方' : order.orderType === 'CT' ? '放射造影' : order.orderType}
                      </span>
                      <span className="font-bold text-slate-900 truncate">
                        {isMedType ? displayMedicineName : (
                          order.orderType === 'CBC' ? '全血常規細胞分析項目' :
                          order.orderType === 'DC' ? '白血球細胞分類計數項目' :
                          order.orderType === 'BIO' ? '臨床生化電解質與發炎分析' :
                          order.orderType === 'BLOOD_GAS' ? '動脈血管氣體與血氧分子檢測' : '電腦斷層或超音波'
                        )}
                      </span>
                    </div>

                    <div className="text-[11px] leading-relaxed bg-white p-2 rounded border border-slate-200 text-slate-700 select-text break-words font-sans">
                      {displayDetailLabel}
                    </div>

                    {order.selectedItems && order.selectedItems.length > 0 && (
                      <div className="text-[9px] text-slate-500 font-mono bg-slate-100/50 p-1.5 rounded border border-slate-200/50 flex flex-wrap gap-x-2">
                        <strong className="text-[#00824F]">包含指定項目:</strong>
                        <span>{order.selectedItems.join(', ')}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[9px] font-mono text-slate-450 border-t border-dashed border-slate-200/60 pt-1.5">
                      <span>發送: {order.timerOrderedAt || new Date(order.orderedAt).toLocaleTimeString('zh-TW', { hour12: false })}</span>
                      <span>預計收單: {order.timerDisplayTime || order.displayTime.replace('T', ' ')}</span>
                    </div>
                  </div>

                  {/* Actions / status controls */}
                  <div className="flex flex-col items-end justify-between h-full space-y-4 shrink-0">
                    {isPending ? (
                      <div className="space-y-1.5 text-right flex flex-col items-end">
                        <div className="flex items-center gap-1 font-mono font-bold text-[10px] text-amber-650 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                          <span>進行中 {order.countdownRemaining !== undefined ? (order.countdownRemaining >= 60 ? `${Math.floor(order.countdownRemaining / 60)}分${order.countdownRemaining % 60}秒` : `${order.countdownRemaining}秒`) : ''}</span>
                        </div>
                        
                        <div className="flex flex-col gap-1 items-end">
                          {!['CBC', 'DC', 'BIO', 'BLOOD_GAS'].includes(order.orderType) ? (
                            <button
                              type="button"
                              onClick={() => onFastForwardOrder(order.id)}
                              className="text-[9px] bg-amber-500 hover:bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors shadow-xs flex items-center gap-0.5"
                            >
                              <FastForward className="w-2.5 h-2.5" /> 快速出來
                            </button>
                          ) : (
                            <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-250 px-1.5 py-0.5 rounded font-sans font-bold text-center">
                              ⏳ 實驗室精密分析中 (不支援加速)
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => onCancelOrder(order.id)}
                            className="text-[9px] bg-white hover:bg-red-50 text-red-650 hover:text-red-700 px-2 py-0.5 border border-slate-300 rounded cursor-pointer transition-all self-end"
                            title="回收本醫囑，並從佇列中刪除"
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 items-end">
                        <div className="flex items-center gap-1 text-[#00824F] font-bold text-[9px] bg-emerald-50 border border-emerald-355 border-emerald-300 px-1.5 py-0.5 rounded shadow-inner">
                          <CheckCircle className="w-3 h-3 text-[#00824F]" />
                          <span>已回報至病歷</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onCancelOrder(order.id)}
                          className="text-[9px] bg-white hover:bg-red-50 text-red-655 text-red-650 hover:text-red-700 px-1.5 py-0.5 border border-slate-300 rounded cursor-pointer transition-all self-end"
                          title="自目前醫囑彙整列表中刪除此舊紀錄"
                        >
                          刪除
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>



    </div>
  );
};
