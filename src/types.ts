export interface Prescription {
  id: string;
  medicineName: string;
  dosage: string;         // e.g. "500 mg"
  frequency: string;      // e.g. "QID (每日四次)", "TID (每日三次)", "BID (每日兩次)", "QD (每日一次)", "PRN (需要時)"
  route: string;          // e.g. "PO (口服)", "IV (靜脈注射)", "SC (皮下注射)"
  days: number;           // Use standard number for days
  orderedAt: string;      // ISO string
  dept?: '門診' | '住院' | '急診' | '診所'; // Prescribing unit, options: 門診, 住院, 急診, 診所
}

export interface DiagnosisRecord {
  id: string;
  icdCode?: string;       // e.g. "K35.8"
  description: string;    // e.g. "急性闌尾炎"
  notes: string;
  recordedAt: string;     // ISO string
}

export interface ImagingStudy {
  id: string;
  title: string;          // e.g. "Chest X-ray", "Abdominal CT"
  studyType: 'CT' | 'XRAY' | 'MRI' | 'ULTRASOUND' | 'OTHER';
  imageUrl: string;       // Can be an uploaded image or preset illustration
  description: string;    // Medical report notes
  dateTime: string;       // User-specified date/time (YYYY-MM-DDTHH:mm)
  visible?: boolean;      // Toggle whether students can see this study
  publishMode?: 'immediate' | 'manual' | 'timer'; // Release configuration mode
  publishMinutesRemaining?: number; // Countdown remaining minutes threshold (e.g., 9)
}

export interface EcgReport {
  id: string;
  title: string;          // e.g. "12-Lead ECG", "Dynamic ECG"
  imageUrl: string;       // Can be an uploaded image or preset template
  description: string;    // Medical interpretation notes (e.g. "ST-elevation in II, III, aVF")
  dateTime: string;       // User-specified date/time (YYYY-MM-DDTHH:mm)
  visible?: boolean;      // Toggle whether students can see this
  publishMode?: 'immediate' | 'manual' | 'timer'; // Release configuration mode
  publishMinutesRemaining?: number; // Countdown remaining minutes threshold
}

export interface UltrasoundReport {
  id: string;
  title: string;          // e.g. "床邊超音波 POCUS", "心臟超音波"
  imageUrl: string;       // Can be an uploaded image/gif, short video base64, or preset template
  description: string;    // Medical interpretation notes
  dateTime: string;       // User-specified date/time (YYYY-MM-DDTHH:mm)
  visible?: boolean;      // Toggle whether students can see this
  publishMode?: 'immediate' | 'manual' | 'timer'; // Release configuration mode
  publishMinutesRemaining?: number; // Countdown remaining minutes threshold
}

export interface LabResultItem {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'high' | 'low';
}

export interface LabReport {
  id: string;
  category: 'CBC' | 'DC' | 'BIO' | 'BLOOD_GAS';
  title: string;          // e.g. "CBC 血液常規檢查"
  items: LabResultItem[];
  dateTime: string;       // User-specified date/time (YYYY-MM-DDTHH:mm)
  visible?: boolean;      // Toggle whether students can see this report
  publishMode?: 'immediate' | 'manual' | 'timer'; // Release configuration mode
  publishMinutesRemaining?: number; // Countdown remaining minutes threshold (e.g., 9)
}

export interface ClinicalOrder {
  id: string;
  orderType: 'CBC' | 'DC' | 'BIO' | 'BLOOD_GAS' | 'CT' | 'MED';
  details: string;        // details of what's being ordered (e.g. "Abdominal CT with contrast")
  orderedAt: string;      // Current clinical time (ISO)
  displayTime: string;    // The configured YYYY-MM-DDTHH:mm or a calculated time in future
  delaySeconds: number;   // Number of seconds to delay (interactive simulator)
  countdownRemaining?: number; // Countdown seconds remaining
  status: 'PENDING' | 'COMPLETED';
  selectedItems?: string[]; // Sub-items selected for blood tests (e.g. ["WBC", "Hb"])
  timerOrderedAt?: string;  // e.g. "倒數 14:12"
  timerDisplayTime?: string; // e.g. "倒數 09:00"
}

export interface Patient {
  id: string;
  chartNumber: string;    // e.g. "HN-12948"
  name: string;
  gender: 'M' | 'F' | 'Other';
  age: number;
  bedNumber: string;      // e.g. "12C-08", "ER-03"
  birthDate: string;      // YYYY-MM-DD
  summary: string;        // 病摘 (Simple Patient Discharge/Clinical Summary)
  diagnoses: DiagnosisRecord[];
  prescriptions: Prescription[];
  imagingStudies: ImagingStudy[];
  labReports: LabReport[];
  ecgReports?: EcgReport[];
  ultrasoundReports?: UltrasoundReport[];
  clinicalOrders: ClinicalOrder[];
  customLabSettings?: Record<string, { value: string; unit: string; referenceRange: string; status: 'normal' | 'high' | 'low' }>;
  customLabReportDate?: string;
  labDelays?: Record<string, number>; // Delays configured in minutes
  customImagingSettings?: { title: string; description: string };
  // Extra fields for rich demographic and clinical profiles
  education?: string;
  religion?: string;
  weight?: number;
  height?: number;
  preOpADL?: string;
  occupation?: string;
  habits?: string;
  socialEconomic?: string;
  familyStatus?: string;
  familySupport?: string;
  chiefComplaint?: string;
  presentIllness?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  physicalStatus?: string;
  department?: string;
  admissionDiag?: string;
  hidden?: boolean; // When true, patient is hidden from student views and list
}
