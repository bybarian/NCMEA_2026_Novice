import { Patient, LabResultItem, LabReport, ImagingStudy, EcgReport } from './types';

// Helper to calculate status based on reference values
export function checkLabStatus(name: string, value: number, category: string): 'normal' | 'high' | 'low' {
  const num = value;
  switch (name) {
    // CBC
    case 'WBC':
      if (num < 4.0) return 'low';
      if (num > 10.0) return 'high';
      return 'normal';
    case 'RBC':
      if (num < 4.0) return 'low';
      if (num > 5.5) return 'high';
      return 'normal';
    case 'Hb':
      if (num < 12.0) return 'low';
      if (num > 16.0) return 'high';
      return 'normal';
    case 'PLT':
      if (num < 150) return 'low';
      if (num > 450) return 'high';
      return 'normal';
      
    // DC
    case 'Neutrophils (Seg)':
      if (num < 40) return 'low';
      if (num > 70) return 'high';
      return 'normal';
    case 'Lymphocytes':
      if (num < 20) return 'low';
      if (num > 45) return 'high';
      return 'normal';
    case 'Monocytes':
      if (num < 2) return 'low';
      if (num > 10) return 'high';
      return 'normal';
    case 'Eosinophils':
      if (num > 6) return 'high';
      return 'normal';

    // Biochemistry
    case 'BUN':
      if (num < 7) return 'low';
      if (num > 20) return 'high';
      return 'normal';
    case 'Creatinine':
      if (num < 0.5) return 'low';
      if (num > 1.2) return 'high';
      return 'normal';
    case 'AST (GOT)':
      if (num > 40) return 'high';
      return 'normal';
    case 'ALT (GPT)':
      if (num > 40) return 'high';
      return 'normal';
    case 'Na':
      if (num < 135) return 'low';
      if (num > 145) return 'high';
      return 'normal';
    case 'K':
      if (num < 3.5) return 'low';
      if (num > 5.1) return 'high';
      return 'normal';
    case 'Glucose (sugar)':
      if (num < 70) return 'low';
      if (num > 140) return 'high';
      return 'normal';
    case 'Lactate':
    case 'Lactic acid (Lactate, 乳酸)':
      if (num < 0.5) return 'low';
      if (num > 2.2) return 'high';
      return 'normal';
    case 'Troponin_I':
    case 'Troponin I (心肌特異性鈣蛋白I)':
      if (num > 0.03) return 'high';
      return 'normal';
    case 'Procalcitonin':
    case 'Procalcitonin (PCT, 降鈣素原)':
      if (num > 0.05) return 'high';
      return 'normal';

    // Blood Gas
    case 'pH':
      if (num < 7.35) return 'low';
      if (num > 7.45) return 'high';
      return 'normal';
    case 'pCO2':
      if (num < 35) return 'low';
      if (num > 45) return 'high';
      return 'normal';
    case 'pO2':
      if (num < 80) return 'low';
      return 'normal';
    case 'HCO3-':
      if (num < 22) return 'low';
      if (num > 26) return 'high';
      return 'normal';
    default:
      return 'normal';
  }
}

// Generate standard template labs
export function getTemplateLab(category: 'CBC' | 'DC' | 'BIO' | 'BLOOD_GAS', state: 'normal' | 'appendicitis' | 'pneumonia' | 'dka'): LabResultItem[] {
  switch (category) {
    case 'CBC':
      if (state === 'appendicitis' || state === 'pneumonia') {
        return [
          { name: 'WBC', value: state === 'appendicitis' ? '14.8' : '16.2', unit: '10^3/μL', referenceRange: '4.0 - 10.0', status: 'high' },
          { name: 'RBC', value: '4.62', unit: '10^6/μL', referenceRange: '4.0 - 5.5', status: 'normal' },
          { name: 'Hb', value: '13.5', unit: 'g/dL', referenceRange: '12.0 - 16.0', status: 'normal' },
          { name: 'PLT', value: '284', unit: '10^3/μL', referenceRange: '150 - 450', status: 'normal' },
        ];
      }
      return [
        { name: 'WBC', value: '6.5', unit: '10^3/μL', referenceRange: '4.0 - 10.0', status: 'normal' },
        { name: 'RBC', value: '4.50', unit: '10^6/μL', referenceRange: '4.0 - 5.5', status: 'normal' },
        { name: 'Hb', value: '14.0', unit: 'g/dL', referenceRange: '12.0 - 16.0', status: 'normal' },
        { name: 'PLT', value: '250', unit: '10^3/μL', referenceRange: '150 - 450', status: 'normal' },
      ];
    case 'DC':
      if (state === 'appendicitis' || state === 'pneumonia') {
        return [
          { name: 'Neutrophils (Seg)', value: '82.5', unit: '%', referenceRange: '40 - 70', status: 'high' },
          { name: 'Lymphocytes', value: '12.0', unit: '%', referenceRange: '20 - 45', status: 'low' },
          { name: 'Monocytes', value: '4.5', unit: '%', referenceRange: '2 - 10', status: 'normal' },
          { name: 'Eosinophils', value: '0.8', unit: '%', referenceRange: '0 - 6', status: 'normal' },
        ];
      }
      return [
        { name: 'Neutrophils (Seg)', value: '61.2', unit: '%', referenceRange: '40 - 70', status: 'normal' },
        { name: 'Lymphocytes', value: '28.5', unit: '%', referenceRange: '20 - 45', status: 'normal' },
        { name: 'Monocytes', value: '7.8', unit: '%', referenceRange: '2 - 10', status: 'normal' },
        { name: 'Eosinophils', value: '2.1', unit: '%', referenceRange: '0 - 6', status: 'normal' },
      ];
    case 'BIO':
      if (state === 'dka') {
        return [
          { name: 'Glucose (sugar)', value: '438', unit: 'mg/dL', referenceRange: '70 - 140', status: 'high' },
          { name: 'BUN', value: '24.5', unit: 'mg/dL', referenceRange: '7 - 20', status: 'high' },
          { name: 'Creatinine', value: '1.42', unit: 'mg/dL', referenceRange: '0.5 - 1.2', status: 'high' },
          { name: 'Na', value: '131', unit: 'mEq/L', referenceRange: '135 - 145', status: 'low' },
          { name: 'K', value: '5.4', unit: 'mEq/L', referenceRange: '3.5 - 5.1', status: 'high' },
          { name: 'AST (GOT)', value: '28', unit: 'U/L', referenceRange: '0 - 40', status: 'normal' },
          { name: 'ALT (GPT)', value: '31', unit: 'U/L', referenceRange: '0 - 40', status: 'normal' },
        ];
      }
      return [
        { name: 'Glucose (sugar)', value: '98', unit: 'mg/dL', referenceRange: '70 - 140', status: 'normal' },
        { name: 'BUN', value: '12.0', unit: 'mg/dL', referenceRange: '7 - 20', status: 'normal' },
        { name: 'Creatinine', value: '0.82', unit: 'mg/dL', referenceRange: '0.5 - 1.2', status: 'normal' },
        { name: 'Na', value: '141', unit: 'mEq/L', referenceRange: '135 - 145', status: 'normal' },
        { name: 'K', value: '4.1', unit: 'mEq/L', referenceRange: '3.5 - 5.1', status: 'normal' },
        { name: 'AST (GOT)', value: '22', unit: 'U/L', referenceRange: '0 - 40', status: 'normal' },
        { name: 'ALT (GPT)', value: '18', unit: 'U/L', referenceRange: '0 - 40', status: 'normal' },
      ];
    case 'BLOOD_GAS':
      if (state === 'dka') {
        return [
          { name: 'pH', value: '7.15', unit: '', referenceRange: '7.35 - 7.45', status: 'low' },
          { name: 'pCO2', value: '22.0', unit: 'mmHg', referenceRange: '35 - 45', status: 'low' },
          { name: 'pO2', value: '98.5', unit: 'mmHg', referenceRange: '80 - 100', status: 'normal' },
          { name: 'HCO3-', value: '8.4', unit: 'mEq/L', referenceRange: '22 - 26', status: 'low' },
        ];
      }
      return [
        { name: 'pH', value: '7.41', unit: '', referenceRange: '7.35 - 7.45', status: 'normal' },
        { name: 'pCO2', value: '41.2', unit: 'mmHg', referenceRange: '35 - 45', status: 'normal' },
        { name: 'pO2', value: '94.0', unit: 'mmHg', referenceRange: '80 - 100', status: 'normal' },
        { name: 'HCO3-', value: '24.8', unit: 'mEq/L', referenceRange: '22 - 26', status: 'normal' },
      ];
  }
}

export const PRESET_PATIENTS: Patient[] = [
  {
    id: 'pat-4',
    chartNumber: '27082121',
    name: '高伶',
    gender: 'F',
    age: 82,
    bedNumber: '外科病房 S-3',
    birthDate: '1944-04-18',
    admissionDiag: '橫膈疝氣手術修補',
    summary: '82歲女性病人高伶，因橫膈疝氣接受手術修補，今日為術後第七天。患者目前收治於外科病房 S-3 床。術後合併泌尿道感染（UTI）與急性腎損傷（AKI），WBC與CRP持續升高。因食慾不佳，三日前放置NG tube並開始灌食。近兩天尿量明顯下降（10/03 eGFR為13），精神狀態不佳，夜間失眠谵妄、早上大吵大鬧。需極力關注感染控制、液體平衡與急性腎衰竭校正。',
    diagnoses: [
      {
        id: 'diag-4-1',
        description: '橫膈疝氣手術修補後狀態 (Diaphragmatic hernia s/p repair)',
        icdCode: 'K44.9',
        recordedAt: '2026-09-26T10:00:00',
        notes: 'Surgical repair completed 7 days ago. Wound is healing but patient remains critical.'
      },
      {
        id: 'diag-4-2',
        description: '泌尿道感染 (Urinary tract infection, UTI)',
        icdCode: 'N39.0',
        recordedAt: '2026-10-01T14:30:00',
        notes: 'Postoperative Foley catheter-associated UTI. Persistent pyuria and leukocytosis.'
      },
      {
        id: 'diag-4-3',
        description: '急性腎損傷 (Acute kidney injury, AKI on CKD stage 3)',
        icdCode: 'N17.9',
        recordedAt: '2026-10-02T08:00:00',
        notes: 'Serum Cre elevated from baseline of 1.4 to 3.4. Oliguria observed.'
      }
    ],
    prescriptions: [
      {
        id: 'rx-10',
        medicineName: 'Ceftriaxone Injection',
        dosage: '2 g',
        frequency: 'QD (每日一次)',
        route: 'IV (靜脈注射)',
        days: 5,
        orderedAt: '2026-10-01T15:00:00',
        dept: '住院'
      },
      {
        id: 'rx-11',
        medicineName: 'Normal Saline 0.9%',
        dosage: '500 mL',
        frequency: 'Continuous (緩慢滴注 40 mL/Hr 配合限水)',
        route: 'IV (靜脈注射)',
        days: 1,
        orderedAt: '2026-10-02T12:00:00',
        dept: '住院'
      },
      {
        id: 'rx-12',
        medicineName: 'Metformin',
        dosage: '500 mg',
        frequency: 'BID (每日兩次)',
        route: 'PO (口服)',
        days: 28,
        orderedAt: '2026-09-20T09:00:00',
        dept: '門診'
      },
      {
        id: 'rx-13',
        medicineName: 'Entresto (Sacubitril/Valsartan)',
        dosage: '50 mg',
        frequency: 'BID (每日兩次)',
        route: 'PO (口服)',
        days: 28,
        orderedAt: '2026-09-20T09:00:00',
        dept: '門診'
      },
      {
        id: 'rx-14',
        medicineName: 'Dapagliflozin (Forxiga)',
        dosage: '10 mg',
        frequency: 'QD (每日一次)',
        route: 'PO (口服)',
        days: 28,
        orderedAt: '2026-09-20T09:00:00',
        dept: '門診'
      },
      {
        id: 'rx-15',
        medicineName: 'Furosemide (Lasix)',
        dosage: '40 mg',
        frequency: 'QD (每日一次)',
        route: 'PO (口服)',
        days: 28,
        orderedAt: '2026-09-20T09:00:00',
        dept: '門診'
      },
      {
        id: 'rx-16',
        medicineName: 'Aldactone (Spironolactone)',
        dosage: '25 mg',
        frequency: 'QD (每日一次)',
        route: 'PO (口服)',
        days: 28,
        orderedAt: '2026-09-20T09:00:00',
        dept: '門診'
      }
    ],
    imagingStudies: [
      {
        id: 'img-4-1',
        title: '胸部X光正面照 (CXR PA view) - 2026/10/03 (CXR1 - L35標記)',
        studyType: 'XRAY',
        imageUrl: '/images/cxr1_l35.svg',
        description: '胸部 X 光正面照（CXR1）顯示：右上角有 L35 標記。可見置入良好之氣管切開套管（Tracheostomy tube）與鼻胃管（NG tube）導管端影通過胃食道接合部置於胃腔。雙側肺野呈輕微/中度斑片狀浸潤，符合術後併發吸入性肺炎/肺部感染初階。',
        dateTime: '2026-10-03T09:20:00',
        visible: true,
        publishMode: 'immediate'
      },
      {
        id: 'img-4-2-cxr2',
        title: '胸部X光正面照 (CXR PA view) - 2026/10/03 (CXR2 - L35標記/浸潤惡化)',
        studyType: 'XRAY',
        imageUrl: '/images/cxr2_l35.svg',
        description: '胸部 X 光正面照（CXR2）顯示：右上角標記 L35。雙側中下肺野的斑片狀浸潤與實變（consolidation/infiltration）急劇惡化擴大，左下肺尤為嚴重。符合吸入性肺炎合併急性呼吸窘迫症（ARDS）進展期之影像特徵。',
        dateTime: '2026-10-03T09:21:00',
        visible: false,
        publishMode: 'timer',
        publishMinutesRemaining: 9
      },
      {
        id: 'img-4-3-cxr3',
        title: '胸部X光正面照 (CXR PA view) - 2026/10/03 (CXR3 - L36標記/胸管/ECG貼片)',
        studyType: 'XRAY',
        imageUrl: '/images/cxr3_l36.svg',
        description: '胸部 X 光正面照（CXR3）顯示：右上角標記 L36。左肺大片緻密實變與大量胸膜積水（pleural effusion white-out）。右側胸壁新放置胸管（chest tube）引流，前胸壁可見 ECG 心電圖圓形貼片與導線，腰椎可見骨科固定金屬支架與螺絲。',
        dateTime: '2026-10-03T09:22:00',
        visible: false,
        publishMode: 'manual'
      },
      {
        id: 'img-4-2',
        title: '腹部與胸部電腦斷層掃描 (Chest & Abdominal CT s/p repair) - 2026/10/01',
        studyType: 'CT',
        imageUrl: 'ct_diaphragmatic_hernia',
        description: '橫膈膜裂孔疝氣修補處固定良好，網膜（mesh）無脫位 or 再疝氣跡象。然而雙側下肺野有輕微術後浸潤與發炎，伴隨微量胸膜積水。雙側腎臟體積正常、皮質變薄，符合慢性腎病，排除尿路結構性阻塞。',
        dateTime: '2026-10-01T11:00:00',
        visible: false,
        publishMode: 'manual'
      }
    ],
    ecgReports: [
      {
        id: 'ecg-4-1',
        title: '標準 12 導程心電圖 (12-Lead ECG) - 2026/10/03 (ECG 1)',
        imageUrl: '/images/ecg1_bradycardia.svg',
        description: '',
        dateTime: '2026-10-03T08:35:00',
        visible: false,
        publishMode: 'manual'
      },
      {
        id: 'ecg-4-2',
        title: '標準 12 導程心電圖 (12-Lead ECG) - 2026/10/03 (ECG 2)',
        imageUrl: '/images/ecg2_tachycardia.svg',
        description: '',
        dateTime: '2026-10-03T10:00:00',
        visible: false,
        publishMode: 'manual'
      }
    ],
    labReports: [
      {
        id: 'lab-4-1',
        category: 'CBC',
        title: '血液常規檢查 (CBC) - 2026/10/01',
        dateTime: '2026-10-01T08:30:00',
        visible: true,
        publishMode: 'immediate',
        items: [
          { name: 'WBC', value: '14,800', unit: '/μL', referenceRange: '4,000 - 10,000', status: 'high' },
          { name: 'Neutrophil', value: '86.0', unit: '%', referenceRange: '40 - 75', status: 'high' },
          { name: 'Lymphocyte', value: '8.0', unit: '%', referenceRange: '20 - 45', status: 'low' },
          { name: 'Monocyte', value: '5.0', unit: '%', referenceRange: '2 - 10', status: 'normal' },
          { name: 'Eosinophil', value: '0.5', unit: '%', referenceRange: '0 - 6', status: 'normal' },
          { name: 'Basophil', value: '0.5', unit: '%', referenceRange: '0 - 2', status: 'normal' },
          { name: 'Hb', value: '10.2', unit: 'g/dL', referenceRange: 'Female 12.0 - 16.0', status: 'low' },
          { name: 'Hct', value: '31.0', unit: '%', referenceRange: 'Female 36 - 46', status: 'low' },
          { name: 'Platelet', value: '215,000', unit: '/μL', referenceRange: '150,000 - 400,000', status: 'normal' }
        ]
      },
      {
        id: 'lab-4-2',
        category: 'BIO',
        title: '臨床生化檢驗 (BIO) - 2026/10/01',
        dateTime: '2026-10-01T08:30:00',
        visible: true,
        publishMode: 'immediate',
        items: [
          { name: 'BUN', value: '46', unit: 'mg/dL', referenceRange: '7 - 20', status: 'high' },
          { name: 'Creatinine', value: '2.0', unit: 'mg/dL', referenceRange: 'Female 0.5 - 1.1', status: 'high' },
          { name: 'eGFR', value: '24', unit: 'mL/min/1.73m²', referenceRange: '>= 90', status: 'low' },
          { name: 'Na', value: '134', unit: 'mEq/L', referenceRange: '135 - 145', status: 'low' },
          { name: 'K', value: '4.6', unit: 'mEq/L', referenceRange: '3.5 - 5.1', status: 'normal' },
          { name: 'Cl', value: '101', unit: 'mEq/L', referenceRange: '98 - 107', status: 'normal' },
          { name: 'Glucose', value: '168', unit: 'mg/dL', referenceRange: '70 - 140', status: 'high' },
          { name: 'AST', value: '38', unit: 'U/L', referenceRange: '10 - 40', status: 'normal' },
          { name: 'ALT', value: '32', unit: 'U/L', referenceRange: '7 - 40', status: 'normal' },
          { name: 'Total bilirubin', value: '1.0', unit: 'mg/dL', referenceRange: '0.2 - 1.2', status: 'normal' },
          { name: 'Albumin', value: '3.0', unit: 'g/dL', referenceRange: '3.5 - 5.0', status: 'low' },
          { name: 'CRP', value: '9.8', unit: 'mg/dL', referenceRange: '< 0.5', status: 'high' },
          { name: 'Lactate', value: '1.8', unit: 'mmol/L', referenceRange: '0.5 - 2.2', status: 'normal' }
        ]
      },
      {
        id: 'lab-4-3',
        category: 'CBC',
        title: '血液常規檢查 (CBC) - 2026/10/03',
        dateTime: '2026-10-03T09:20:00',
        visible: false,
        publishMode: 'timer',
        publishMinutesRemaining: 9,
        items: [
          { name: 'WBC', value: '23,600', unit: '/μL', referenceRange: '4,000 - 10,000', status: 'high' },
          { name: 'Neutrophil', value: '92.0', unit: '%', referenceRange: '40 - 75', status: 'high' },
          { name: 'Band form', value: '6.0', unit: '%', referenceRange: '0 - 5', status: 'high' },
          { name: 'Lymphocyte', value: '3.0', unit: '%', referenceRange: '20 - 45', status: 'low' },
          { name: 'Monocyte', value: '4.0', unit: '%', referenceRange: '2 - 10', status: 'normal' },
          { name: 'Eosinophil', value: '0.0', unit: '%', referenceRange: '0 - 6', status: 'normal' },
          { name: 'Basophil', value: '0.0', unit: '%', referenceRange: '0 - 2', status: 'normal' },
          { name: 'Hb', value: '9.8', unit: 'g/dL', referenceRange: 'Female 12.0 - 16.0', status: 'low' },
          { name: 'Hct', value: '29.5', unit: '%', referenceRange: 'Female 36 - 46', status: 'low' },
          { name: 'Platelet', value: '138,000', unit: '/μL', referenceRange: '150,000 - 400,000', status: 'low' }
        ]
      },
      {
        id: 'lab-4-4',
        category: 'BIO',
        title: '臨床生化檢驗 (BIO) - 2026/10/03',
        dateTime: '2026-10-03T09:20:00',
        visible: false,
        publishMode: 'timer',
        publishMinutesRemaining: 9,
        items: [
          { name: 'BUN', value: '78', unit: 'mg/dL', referenceRange: '7 - 20', status: 'high' },
          { name: 'Creatinine', value: '3.4', unit: 'mg/dL', referenceRange: 'Female 0.5 - 1.1', status: 'high' },
          { name: 'eGFR', value: '13', unit: 'mL/min/1.73m²', referenceRange: '>= 90', status: 'low' },
          { name: 'Na', value: '130', unit: 'mEq/L', referenceRange: '135 - 145', status: 'low' },
          { name: 'K', value: '7.1', unit: 'mEq/L', referenceRange: '3.5 - 5.1', status: 'high' },
          { name: 'Cl', value: '98', unit: 'mEq/L', referenceRange: '98 - 107', status: 'normal' },
          { name: 'Glucose', value: '212', unit: 'mg/dL', referenceRange: '70 - 140', status: 'high' },
          { name: 'AST', value: '62', unit: 'U/L', referenceRange: '10 - 40', status: 'high' },
          { name: 'ALT', value: '45', unit: 'U/L', referenceRange: '7 - 40', status: 'high' },
          { name: 'Total bilirubin', value: '1.4', unit: 'mg/dL', referenceRange: '0.2 - 1.2', status: 'high' },
          { name: 'Albumin', value: '2.6', unit: 'g/dL', referenceRange: '3.5 - 5.0', status: 'low' },
          { name: 'CRP', value: '24.6', unit: 'mg/dL', referenceRange: '< 0.5', status: 'high' },
          { name: 'Procalcitonin', value: '18.5', unit: 'ng/mL', referenceRange: '< 0.5', status: 'high' },
          { name: 'Lactate', value: '5.2', unit: 'mmol/L', referenceRange: '0.5 - 2.2', status: 'high' },
          { name: 'Troponin-I', value: '0.08', unit: 'ng/mL', referenceRange: '< 0.04', status: 'high' }
        ]
      },
      {
        id: 'lab-4-5',
        category: 'BLOOD_GAS',
        title: '動脈血液氣體分析 (ABG) - 2026/10/03',
        dateTime: '2026-10-03T09:20:00',
        visible: false,
        publishMode: 'timer',
        publishMinutesRemaining: 9,
        items: [
          { name: 'pH', value: '7.12', unit: '', referenceRange: '7.35 - 7.45', status: 'low' },
          { name: 'PaCO2', value: '28', unit: 'mmHg', referenceRange: '35 - 45', status: 'low' },
          { name: 'PaO2', value: '62', unit: 'mmHg', referenceRange: '80 - 100', status: 'low' },
          { name: 'HCO3-', value: '9.0', unit: 'mEq/L', referenceRange: '22 - 26', status: 'low' },
          { name: 'Base excess', value: '-18', unit: 'mEq/L', referenceRange: '-2 to +2', status: 'low' },
          { name: 'SaO2', value: '88', unit: '%', referenceRange: '95 - 100', status: 'low' },
          { name: 'Lactate', value: '5.2', unit: 'mmol/L', referenceRange: '0.5 - 2.2', status: 'high' }
        ]
      }
    ],
    customLabReportDate: '2026-10-03 09:20',
    customLabSettings: {
      'WBC': { value: '23,600', unit: '/μL', referenceRange: '4,000 - 10,000', status: 'high' },
      'Neutrophil': { value: '92.0', unit: '%', referenceRange: '40 - 75', status: 'high' },
      'Band form': { value: '6.0', unit: '%', referenceRange: '0 - 5', status: 'high' },
      'Lymphocyte': { value: '3.0', unit: '%', referenceRange: '20 - 45', status: 'low' },
      'Monocyte': { value: '4.0', unit: '%', referenceRange: '2 - 10', status: 'normal' },
      'Eosinophil': { value: '0.0', unit: '%', referenceRange: '0 - 6', status: 'normal' },
      'Basophil': { value: '0.0', unit: '%', referenceRange: '0 - 2', status: 'normal' },
      'Hb': { value: '9.8', unit: 'g/dL', referenceRange: 'Female 12.0 - 16.0', status: 'low' },
      'Hct': { value: '29.5', unit: '%', referenceRange: 'Female 36 - 46', status: 'low' },
      'Platelet': { value: '138,000', unit: '/μL', referenceRange: '150,000 - 400,000', status: 'low' },
      'BUN': { value: '78', unit: 'mg/dL', referenceRange: '7 - 20', status: 'high' },
      'Creatinine': { value: '3.4', unit: 'mg/dL', referenceRange: 'Female 0.5 - 1.1', status: 'high' },
      'eGFR': { value: '13', unit: 'mL/min/1.73m²', referenceRange: '>= 90', status: 'low' },
      'Na': { value: '130', unit: 'mEq/L', referenceRange: '135 - 145', status: 'low' },
      'K': { value: '7.1', unit: 'mEq/L', referenceRange: '3.5 - 5.1', status: 'high' },
      'Cl': { value: '98', unit: 'mEq/L', referenceRange: '98 - 107', status: 'normal' },
      'Glucose': { value: '212', unit: 'mg/dL', referenceRange: '70 - 140', status: 'high' },
      'AST': { value: '62', unit: 'U/L', referenceRange: '10 - 40', status: 'high' },
      'ALT': { value: '45', unit: 'U/L', referenceRange: '7 - 40', status: 'high' },
      'Total bilirubin': { value: '1.4', unit: 'mg/dL', referenceRange: '0.2 - 1.2', status: 'high' },
      'Albumin': { value: '2.6', unit: 'g/dL', referenceRange: '3.5 - 5.0', status: 'low' },
      'CRP': { value: '24.6', unit: 'mg/dL', referenceRange: '< 0.5', status: 'high' },
      'Procalcitonin': { value: '18.5', unit: 'ng/mL', referenceRange: '< 0.5', status: 'high' },
      'Lactate': { value: '5.2', unit: 'mmol/L', referenceRange: '0.5 - 2.2', status: 'high' },
      'Troponin-I': { value: '0.08', unit: 'ng/mL', referenceRange: '< 0.04', status: 'high' },
      'pH': { value: '7.12', unit: '', referenceRange: '7.35 - 7.45', status: 'low' },
      'PaCO2': { value: '28', unit: 'mmHg', referenceRange: '35 - 45', status: 'low' },
      'PaO2': { value: '62', unit: 'mmHg', referenceRange: '80 - 100', status: 'low' },
      'HCO3-': { value: '9.0', unit: 'mEq/L', referenceRange: '22 - 26', status: 'low' },
      'Base excess': { value: '-18', unit: 'mEq/L', referenceRange: '-2 to +2', status: 'low' },
      'SaO2': { value: '88', unit: '%', referenceRange: '95 - 100', status: 'low' }
    },
    clinicalOrders: [],
    // Demographics matching the uploaded screenshot exactly
    education: '國小畢業',
    religion: '民間信仰',
    weight: 60,
    height: 155,
    preOpADL: '原本可自行走路與基本生活自理',
    occupation: '退休',
    habits: '每天去公園散步',
    socialEconomic: '中上',
    familyStatus: '與家人同住，平日由外傭協助生活照顧',
    familySupport: '主要照顧者為病人女兒，任職於院內其他單位 (健檢中心) 護理師；另一女兒為任職他院的專科護理師。',
    chiefComplaint: '灌食完beep後呼吸喘、腹痛以及發燒',
    presentIllness: '因橫膈疝氣接受手術修補，術後第七天目前住在外科加護病房。術後合併 UTI，WBC 與 CRP 持續偏高。因食慾不佳，三天前放置 NG tube ，開始以 NG 灌食。近兩天尿量下降，且精神不佳，晚上時常不睡覺，早上則大吵大鬧。',
    pastMedicalHistory: 'Chronic kidney disease, CKD; Congestive heart failure, CHF; Hypertension, HTN; Diabetes mellitus, DM;\n[慢性常用藥物] Metformin、Entresto、Dapagliflozin、Furosemide、Aldactone',
    familyHistory: 'DM',
    physicalStatus: '呼吸喘、腹痛、發燒'
  },
  {
    id: 'pat-haoren-appendicitis',
    chartNumber: '28102005',
    name: '郝仁',
    gender: 'M',
    age: 20,
    bedNumber: '急診觀察區 E-02',
    birthDate: '2006-03-15',
    admissionDiag: '急性闌尾炎 (Acute Appendicitis)',
    summary: '20歲男性病人郝仁，因轉移性右下腹劇烈疼痛（臍周轉至RLQ）伴隨噁心、嘔吐與發燒（38.2°C）於今日急診就醫。理學檢查 McBurney點 有顯著壓痛（tenderness）、反跳痛（rebound tenderness）及肌肉緊張（rigidity）。血液檢查顯示 WBC 顯著升高（15,200/μL）伴 Segmented Neutrophils 比例升高（84.5%）及 CRP 升高（4.2 mg/dL），臨床表現與抽血報告高度符合急性闌尾炎（盲腸炎）。已擬定急診禁食（NPO）、靜脈輸液與預防性抗生素，會診一般外科準備安排闌尾切除手術（Appendectomy）。',
    diagnoses: [
      {
        id: 'diag-hr-1',
        description: '急性闌尾炎 (Acute appendicitis with localized peritonitis)',
        icdCode: 'K35.80',
        recordedAt: '2026-10-03T10:15:00',
        notes: 'Classic RLQ pain with positive McBurney sign and rebound tenderness.'
      },
      {
        id: 'diag-hr-2',
        description: '白血球增多症 (Leukocytosis with neutrophilia)',
        icdCode: 'D72.829',
        recordedAt: '2026-10-03T10:30:00',
        notes: 'WBC elevated at 15.2k with 84.5% neutrophils, indicating acute bacterial inflammation.'
      }
    ],
    prescriptions: [
      {
        id: 'rx-hr-1',
        medicineName: 'Normal Saline 0.9%',
        dosage: '1000 mL',
        frequency: 'Continuous (滴注 100 mL/Hr)',
        route: 'IV (靜脈滴注)',
        days: 1,
        orderedAt: '2026-10-03T10:30:00',
        dept: '急診'
      },
      {
        id: 'rx-hr-2',
        medicineName: 'Cefazolin Injection',
        dosage: '1 g',
        frequency: 'Q8H (每8小時一次)',
        route: 'IV (靜脈注射)',
        days: 3,
        orderedAt: '2026-10-03T10:40:00',
        dept: '急診'
      },
      {
        id: 'rx-hr-3',
        medicineName: 'Acetaminophen (Scanol)',
        dosage: '500 mg',
        frequency: 'Q6H PRN (發燒>38.5°C或疼痛時使用)',
        route: 'PO/NG (口服)',
        days: 3,
        orderedAt: '2026-10-03T10:45:00',
        dept: '急診'
      }
    ],
    imagingStudies: [
      {
        id: 'img-hr-cxr',
        title: '胸部 X 光檢查 (Chest PA/AP View)',
        studyType: 'XRAY',
        imageUrl: '/cxr/CXR.png',
        description: 'Chest PA view (2024-05-12 10:30:15): Bilateral lung fields are clear without active lung lesions, consolidations, or pneumothorax. Costophrenic angles are sharp. Cardiothoracic ratio (CTR) is within normal limits. Subdiaphragmatic gas shadow is normal without free air.',
        dateTime: '2024-05-12 10:30:15',
        visible: true,
        publishMode: 'immediate'
      },
      {
        id: 'img-hr-1',
        title: '腹部電腦斷層 (Abdominal CT) - 急性闌尾炎',
        studyType: 'CT',
        imageUrl: '/ct/CT.png',
        description: '右下腹闌尾管徑腫大（直徑達 9.2 mm，正常<6mm），闌尾壁增厚並有周圍脂肪層混濁（fat stranding）及少量局限性液體積聚，無明顯穿孔或形成膿瘍。符合急性闌尾炎影像特徵。',
        dateTime: '2024-05-12 11:00:00',
        visible: true,
        publishMode: 'immediate'
      }
    ],
    ecgReports: [
      {
        id: 'ecg-hr-1',
        title: '標準 12 導程心電圖 (12-Lead ECG) - 正常竇性心律',
        imageUrl: '/ecg/ECG.png',
        description: 'Vent. rate: 72 BPM, PR interval: 160 ms, QRS duration: 88 ms, QT/QTcB: 392/429 ms, P-R-T axes: 54 35 41°. Interpretation: Normal sinus rhythm. Normal ECG. No ST-T segment elevation or acute myocardial ischemia.',
        dateTime: '2024-05-12 10:30:15',
        visible: true,
        publishMode: 'immediate'
      }
    ],
    ultrasoundReports: [
      {
        id: 'ultra-hr-1',
        title: '右下腹重點式超音波 (POCUS RLQ Appendix Target Sign)',
        imageUrl: '/pocus/Ultrasound.png',
        description: 'RLQ targeted ultrasound (12-May-2024 10:30:15): High-frequency linear probe examination of RLQ shows a non-compressible, blind-ended, aperistaltic tubular structure with characteristic "target sign" (bull\'s-eye appearance) in transverse view. Prominent submucosal thickening with surrounding hyperechoic inflamed mesenteric fat. Compatible with Acute Appendicitis.',
        dateTime: '2024-05-12 10:30:15',
        visible: true,
        publishMode: 'immediate'
      }
    ],
    labReports: [
      {
        id: 'lab-hr-cbc',
        category: 'CBC',
        title: '血液常規檢查 (CBC) - 2026/10/03',
        dateTime: '2026-10-03T10:20:00',
        visible: true,
        publishMode: 'immediate',
        items: [
          { name: 'WBC', value: '15,200', unit: '/μL', referenceRange: '4,000 - 10,000', status: 'high' },
          { name: 'RBC', value: '4.85', unit: '10^6/μL', referenceRange: '4.5 - 5.9', status: 'normal' },
          { name: 'Hb', value: '14.8', unit: 'g/dL', referenceRange: 'Male 13.5 - 17.5', status: 'normal' },
          { name: 'Hct', value: '43.5', unit: '%', referenceRange: 'Male 41.0 - 53.0', status: 'normal' },
          { name: 'Platelet', value: '265,000', unit: '/μL', referenceRange: '150,000 - 400,000', status: 'normal' }
        ]
      },
      {
        id: 'lab-hr-dc',
        category: 'DC',
        title: '白血球分類計數 (Differential Count) - 2026/10/03',
        dateTime: '2026-10-03T10:20:00',
        visible: true,
        publishMode: 'immediate',
        items: [
          { name: 'Neutrophil (Seg)', value: '84.5', unit: '%', referenceRange: '40 - 70', status: 'high' },
          { name: 'Band form', value: '3.0', unit: '%', referenceRange: '0 - 5', status: 'normal' },
          { name: 'Lymphocyte', value: '10.2', unit: '%', referenceRange: '20 - 45', status: 'low' },
          { name: 'Monocyte', value: '4.8', unit: '%', referenceRange: '2 - 10', status: 'normal' },
          { name: 'Eosinophil', value: '0.5', unit: '%', referenceRange: '0 - 6', status: 'normal' },
          { name: 'Basophil', value: '0.0', unit: '%', referenceRange: '0 - 2', status: 'normal' }
        ]
      },
      {
        id: 'lab-hr-bio',
        category: 'BIO',
        title: '臨床生化檢驗 (BIO) - 2026/10/03',
        dateTime: '2026-10-03T10:20:00',
        visible: true,
        publishMode: 'immediate',
        items: [
          { name: 'BUN', value: '14.2', unit: 'mg/dL', referenceRange: '7 - 20', status: 'normal' },
          { name: 'Creatinine', value: '0.88', unit: 'mg/dL', referenceRange: 'Male 0.7 - 1.3', status: 'normal' },
          { name: 'Na', value: '139', unit: 'mEq/L', referenceRange: '135 - 145', status: 'normal' },
          { name: 'K', value: '4.2', unit: 'mEq/L', referenceRange: '3.5 - 5.1', status: 'normal' },
          { name: 'Cl', value: '102', unit: 'mEq/L', referenceRange: '98 - 107', status: 'normal' },
          { name: 'Glucose', value: '105', unit: 'mg/dL', referenceRange: '70 - 140', status: 'normal' },
          { name: 'AST', value: '22', unit: 'U/L', referenceRange: '10 - 40', status: 'normal' },
          { name: 'ALT', value: '19', unit: 'U/L', referenceRange: '7 - 40', status: 'normal' },
          { name: 'CRP', value: '4.2', unit: 'mg/dL', referenceRange: '< 0.5', status: 'high' }
        ]
      }
    ],
    customLabReportDate: '2026-10-03 10:20',
    customLabSettings: {
      'WBC': { value: '15,200', unit: '/μL', referenceRange: '4,000 - 10,000', status: 'high' },
      'Neutrophil (Seg)': { value: '84.5', unit: '%', referenceRange: '40 - 70', status: 'high' },
      'Lymphocyte': { value: '10.2', unit: '%', referenceRange: '20 - 45', status: 'low' },
      'CRP': { value: '4.2', unit: 'mg/dL', referenceRange: '< 0.5', status: 'high' }
    },
    clinicalOrders: [],
    education: '大學在學 (大二)',
    religion: '無特別宗教信仰',
    weight: 68,
    height: 176,
    preOpADL: '生活完全自理，平時規律運動（籃球校隊）',
    occupation: '學生',
    habits: '不抽煙、偶爾社交飲酒',
    socialEconomic: '中等',
    familyStatus: '與父母及妹妹同住，家庭關係和睦',
    familySupport: '父母已趕至急診陪同，支持度極佳',
    chiefComplaint: '右下腹痛腹脹、噁心發燒12小時',
    presentIllness: '患者於昨日深夜開始感到肚臍周圍不適與隱隱作痛，伴隨食慾不振與噁心感。至今日清晨，疼痛逐漸轉移並固定至右下腹（RLQ），呈陣發性劇痛，體溫量測達 38.2°C。因疼痛加劇且伴隨嘔吐一次，遂由家屬送至本院急診。',
    pastMedicalHistory: '無特殊慢性病史或手術史。過敏史：無已知藥物或食物過敏 (NKDA)。',
    familyHistory: '無顯著遺傳病史',
    physicalStatus: '腹部平坦，右下腹 McBurney 點明顯壓痛（tenderness）及反跳痛（rebound tenderness），腸蠕動音（bowel sounds）減弱。'
  }
];
