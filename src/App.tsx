import React, { useState, useEffect, useRef } from 'react';
import { Patient, ClinicalOrder, LabReport, ImagingStudy, LabResultItem } from './types';
import { PRESET_PATIENTS, getTemplateLab } from './presetPatients';
import { getCatalogItemById } from './labCatalog';
import { PatientList } from './components/PatientList';
import { EMRSection } from './components/EMRSection';
import { DiagnosesSection } from './components/DiagnosesSection';
import { MedicationHistorySection } from './components/MedicationHistorySection';
import { PatientSummarySection } from './components/PatientSummarySection';
import { RadiologySection } from './components/RadiologySection';
import { LabResultsSection } from './components/LabResultsSection';
import { CPOEOrderPractice } from './components/CPOEOrderPractice';
import { EcgSection } from './components/EcgSection';
import { UltrasoundSection } from './components/UltrasoundSection';
import { AdminBackstageModal } from './components/AdminBackstageModal';
import { 
  seedDefaultPatientsIfEmpty, 
  savePatientToFirestore, 
  deletePatientFromFirestore,
  subscribeToPatients,
  saveExamStateToFirestore,
  subscribeToExamState
} from './firebase';
import { 
  Building2, Users, ShoppingBag, BellRing, Clock, ShieldAlert,
  ChevronRight, ArrowRight, Pill, Microscope, FileText, Image as ImageIcon, ShoppingCart, X, User, Monitor, Trash2, RotateCcw,
  Activity, Video, Lock, Key, LogOut, Upload
} from 'lucide-react';

interface ToastItemProps {
  key?: React.Key;
  toast: { id: string; message: string; type: 'success' | 'info' };
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div
      className={`p-3.5 rounded-lg border shadow-xl flex items-start gap-2.5 pointer-events-auto animate-bounce relative pr-8 ${
        toast.type === 'success' 
          ? 'bg-white border-emerald-500 text-emerald-900 shadow-emerald-100' 
          : 'bg-white border-blue-500 text-blue-900 shadow-blue-100'
      }`}
    >
      <BellRing className={`w-4 h-4 shrink-0 mt-0.5 ${toast.type === 'success' ? 'text-emerald-500' : 'text-blue-500'}`} />
      <p className="text-[11px] font-semibold leading-relaxed font-sans">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 rounded p-0.5 hover:bg-slate-100 transition-colors pointer-events-auto cursor-pointer"
        title="關閉"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function App() {
  // Load patients from LocalStorage or fallback to Preset Patients
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('vhis_patients_data');
    const defaultSaved = localStorage.getItem('vhis_default_patients_data');
    const dataToUse = saved || defaultSaved;
    if (dataToUse) {
      try {
        const parsed: Patient[] = JSON.parse(dataToUse);
        
        // Filter out legacy removed preset patients
        const cleaned = parsed.filter(p => !['pat-1', 'pat-2', 'pat-3'].includes(p.id));
        
        // Build merged list: start with cleaned entities
        const mergedList = [...cleaned];
        
        // Append any presets that aren't present in the user's cached data at all
        PRESET_PATIENTS.forEach(preset => {
          const exists = mergedList.some(p => p.id === preset.id);
          if (!exists) {
            mergedList.push(preset);
          }
        });

        return mergedList.map(patient => ({
          ...patient,
          imagingStudies: patient.imagingStudies || [],
          ecgReports: patient.ecgReports || [],
          ultrasoundReports: patient.ultrasoundReports || [],
          labReports: patient.labReports || [],
          clinicalOrders: patient.clinicalOrders || [],
          prescriptions: patient.prescriptions || []
        }));
      } catch (e) {
        console.error("Error loading cached patients", e);
      }
    }
    return PRESET_PATIENTS;
  });

  // Firestore local state change cache to prevent write-snapshot loops
  const lastSyncedPatientsRef = React.useRef<Record<string, string>>({});

  const [activePatientId, setActivePatientId] = useState<string | null>(() => {
    return patients.length > 0 ? patients[0].id : null;
  });

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<'emr' | 'summary' | 'radiology' | 'labs' | 'ecg' | 'ultrasound' | 'rxHistory' | 'cpoe'>('emr');

  // Login Authentication State (Account: TGH, Password: 123456)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('vhis_auth_user') === 'TGH' || localStorage.getItem('vhis_auth_user') === 'TGH';
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername.trim() === 'TGH' && loginPassword.trim() === '123456') {
      setIsAuthenticated(true);
      sessionStorage.setItem('vhis_auth_user', 'TGH');
      localStorage.setItem('vhis_auth_user', 'TGH');
      setLoginError('');
      setToasts(prev => [...prev, { id: `toast-login-${Date.now()}`, message: '🔓 歡迎登入！泰萬綜合醫院醫療資訊系統。', type: 'success' }]);
    } else {
      setLoginError('帳號或密碼錯誤，請重新輸入。');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('vhis_auth_user');
    localStorage.removeItem('vhis_auth_user');
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
  };

  // Real-time toast alerts list
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' }[]>([]);

  // Track dismissed warning ribbons for each patient ID
  const [dismissedWarnings, setDismissedWarnings] = useState<Record<string, boolean>>({});

  // System time clock
  const [currentSystemTime, setCurrentSystemTime] = useState('');

  // Customizable simulation clinical clock
  const [clinicalTime, setClinicalTime] = useState('');

  // Mobile patient list drawer state
  const [isMobilePatientListOpen, setIsMobilePatientListOpen] = useState<boolean>(false);

  // 15-minute countdown simulator state (synchronized across devices via Firestore)
  const [examTimerActive, setExamTimerActive] = useState<boolean>(false);
  const [examTimeRemaining, setExamTimeRemaining] = useState<number>(900); // 15 mins = 900 secs
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null);
  const [durationSec, setDurationSec] = useState<number>(900);
  const [examLog, setExamLog] = useState<{ id: string; timestamp: string; timerTime: string; patientName: string; action: string }[]>([]);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [showBloodDrawAlertModal, setShowBloodDrawAlertModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);

  // Synchronous ref to prevent stale React state closures from accidentally turning timer back on
  const examStateRef = useRef({
    examTimerActive: false,
    startTimeMs: null as number | null,
    durationSec: 900,
    examTimeRemaining: 900
  });

  // Keep ref synchronized with state changes
  useEffect(() => {
    examStateRef.current = {
      examTimerActive,
      startTimeMs,
      durationSec,
      examTimeRemaining
    };
  }, [examTimerActive, startTimeMs, durationSec, examTimeRemaining]);

  // Broadcast local exam state to BroadcastChannel & LocalStorage for same-origin local hotspot/tab sync
  const broadcastLocalExamState = (payload: {
    examTimerActive: boolean;
    startTimeMs: number | null;
    durationSec: number;
    examTimeRemaining: number;
    examLog: { id: string; timestamp: string; timerTime: string; patientName: string; action: string }[];
  }) => {
    try {
      localStorage.setItem('vhis_local_exam_state', JSON.stringify({ ...payload, updatedAt: Date.now() }));
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('vhis_exam_timer_channel');
        channel.postMessage(payload);
        channel.close();
      }
    } catch (e) {
      console.warn('Broadcast notice:', e);
    }
  };

  // Helper to append entries to the activity log and sync to Firestore & Local Channel
  const addExamLogEntry = (actionText: string, patName: string = '') => {
    const curActive = examStateRef.current.examTimerActive;
    const curRem = examStateRef.current.examTimeRemaining;

    const min = Math.floor(curRem / 60);
    const sec = curRem % 60;
    const timerStr = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    const newEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
      timerTime: curActive ? timerStr : (curRem === 900 ? '15:00' : timerStr),
      patientName: patName || '系統',
      action: actionText
    };
    setExamLog(prev => {
      const updated = [newEntry, ...prev];
      const payload = {
        examTimerActive: examStateRef.current.examTimerActive,
        startTimeMs: examStateRef.current.startTimeMs,
        durationSec: examStateRef.current.durationSec,
        examTimeRemaining: examStateRef.current.examTimeRemaining,
        examLog: updated
      };
      saveExamStateToFirestore(payload);
      broadcastLocalExamState(payload);
      return updated;
    });
  };

  const handleSetExamTimerActive = (active: boolean) => {
    const now = active ? Date.now() : null;
    const targetRem = active ? 900 : examStateRef.current.examTimeRemaining;

    // Immediately update ref synchronously to prevent race conditions
    examStateRef.current.examTimerActive = active;
    examStateRef.current.startTimeMs = now;
    if (active) {
      examStateRef.current.examTimeRemaining = 900;
      examStateRef.current.durationSec = 900;
    }

    setExamTimerActive(active);
    setStartTimeMs(now);
    if (active) {
      setExamTimeRemaining(900);
      setDurationSec(900);
    }

    const payload = {
      examTimerActive: active,
      startTimeMs: now,
      durationSec: active ? 900 : examStateRef.current.durationSec,
      examTimeRemaining: targetRem,
      examLog
    };
    saveExamStateToFirestore(payload);
    broadcastLocalExamState(payload);
  };

  const handleSetExamTimeRemaining = (rem: number) => {
    const now = examStateRef.current.examTimerActive ? Date.now() : null;
    examStateRef.current.examTimeRemaining = rem;
    if (rem === 900) examStateRef.current.durationSec = 900;

    setExamTimeRemaining(rem);
    if (rem === 900) setDurationSec(900);

    const payload = {
      examTimerActive: examStateRef.current.examTimerActive,
      startTimeMs: now,
      durationSec: rem === 900 ? 900 : examStateRef.current.durationSec,
      examTimeRemaining: rem,
      examLog
    };
    saveExamStateToFirestore(payload);
    broadcastLocalExamState(payload);
  };

  const handleSetExamLog: React.Dispatch<React.SetStateAction<{ id: string; timestamp: string; timerTime: string; patientName: string; action: string }[]>> = (action) => {
    setExamLog(prev => {
      const updated = typeof action === 'function' ? action(prev) : action;
      const payload = {
        examTimerActive: examStateRef.current.examTimerActive,
        startTimeMs: examStateRef.current.startTimeMs,
        durationSec: examStateRef.current.durationSec,
        examTimeRemaining: examStateRef.current.examTimeRemaining,
        examLog: updated
      };
      saveExamStateToFirestore(payload);
      broadcastLocalExamState(payload);
      return updated;
    });
  };

  // Synchronize clinical/simulation time when active patient changes
  const activePatientForClock = patients.find(p => p.id === activePatientId);
  useEffect(() => {
    if (activePatientForClock) {
      const savedOverride = localStorage.getItem(`vhis_clinical_override_${activePatientForClock.id}`);
      if (savedOverride) {
        setClinicalTime(savedOverride);
      } else {
        const defaultTime = activePatientForClock.customLabReportDate || (activePatientForClock.id === 'pat-4' ? '2026-10-03 09:20' : '2026-06-14 09:00');
        setClinicalTime(defaultTime);
      }
    }
  }, [activePatientId]);

  // Audio simulator chime (Safe Web Audio API Synth)
  const triggerAudioNotify = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainCtx = audioCtx.createGain();
      osc.type = 'sine';
      // Pleasant dual tone chime
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
      gainCtx.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainCtx.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gainCtx);
      gainCtx.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      // Audio sandbox blocker guard
    }
  };

  // Keep system clock ticking
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setCurrentSystemTime(date.toLocaleDateString('zh-TW') + ' ' + date.toLocaleTimeString('zh-TW', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to real-time Firestore updates on mount
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    async function initFirebaseSync() {
      // Seed if the DB is completely empty (first time use)
      await seedDefaultPatientsIfEmpty();
      
      // Subscribe to real-time database changes
      unsubscribe = subscribeToPatients((firestorePatients) => {
        // Filter out legacy removed preset patients ('pat-1', 'pat-2', 'pat-3')
        const cleanedFirestorePatients = firestorePatients.filter(p => !['pat-1', 'pat-2', 'pat-3'].includes(p.id));
        
        // Delete legacy patients from Firestore database
        firestorePatients.forEach((p) => {
          if (['pat-1', 'pat-2', 'pat-3'].includes(p.id)) {
            deletePatientFromFirestore(p.id);
          }
        });

        // Merge any missing preset patients (e.g. newly added test patients)
        const mergedList = [...cleanedFirestorePatients];
        PRESET_PATIENTS.forEach(preset => {
          const exists = mergedList.some(p => p.id === preset.id);
          if (!exists) {
            mergedList.push(preset);
            savePatientToFirestore(preset);
          }
        });

        // Cache current patient state so we do not trigger extra Firestore writes
        mergedList.forEach((p) => {
          lastSyncedPatientsRef.current[p.id] = JSON.stringify(p);
        });
        
        // Synchronize local React state
        setPatients(mergedList);

        // Ensure active patient selection is valid
        setActivePatientId(prev => {
          if (!prev || !mergedList.some(p => p.id === prev)) {
            return mergedList[0]?.id || null;
          }
          return prev;
        });
      });
    }
    
    initFirebaseSync();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Subscribe to real-time exam state (timer & logs) across all connected devices (Firestore + BroadcastChannel)
  useEffect(() => {
    const applyRemoteState = (remoteState: any) => {
      if (!remoteState) return;

      if (remoteState.examTimerActive !== undefined) {
        setExamTimerActive(remoteState.examTimerActive);
        examStateRef.current.examTimerActive = remoteState.examTimerActive;
      }
      if (remoteState.startTimeMs !== undefined) {
        setStartTimeMs(remoteState.startTimeMs);
        examStateRef.current.startTimeMs = remoteState.startTimeMs;
      }
      if (remoteState.durationSec !== undefined) {
        setDurationSec(remoteState.durationSec);
        examStateRef.current.durationSec = remoteState.durationSec;
      }
      if (remoteState.examLog && Array.isArray(remoteState.examLog)) {
        setExamLog(remoteState.examLog);
      }

      // Synchronize exact remaining time based on start timestamp
      if (remoteState.examTimerActive && remoteState.startTimeMs) {
        const elapsedSec = Math.floor((Date.now() - remoteState.startTimeMs) / 1000);
        const rem = Math.max(0, (remoteState.durationSec || 900) - elapsedSec);
        setExamTimeRemaining(rem);
        examStateRef.current.examTimeRemaining = rem;
      } else if (remoteState.examTimeRemaining !== undefined && !remoteState.examTimerActive) {
        setExamTimeRemaining(remoteState.examTimeRemaining);
        examStateRef.current.examTimeRemaining = remoteState.examTimeRemaining;
      }
    };

    // 1. Cloud Firestore listener (works across internet / hotspot / cellular)
    let unsubscribeExam: (() => void) | null = null;
    unsubscribeExam = subscribeToExamState((remoteState) => {
      applyRemoteState(remoteState);
    });

    // 2. BroadcastChannel listener (works instantly for local tabs/windows on same local network)
    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('vhis_exam_timer_channel');
      channel.onmessage = (event) => {
        if (event.data) {
          applyRemoteState(event.data);
        }
      };
    }

    // 3. Storage event listener (works across local tabs/windows)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'vhis_local_exam_state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          applyRemoteState(parsed);
        } catch (err) {
          console.warn('Storage event parse error:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (unsubscribeExam) unsubscribeExam();
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Sync patients changes to LocalStorage & Firestore (Bidirectional Sync)
  useEffect(() => {
    // 1. Keep standard local storage as cache / offline fallback
    try {
      localStorage.setItem('vhis_patients_data', JSON.stringify(patients));
    } catch (err) {
      console.warn('LocalStorage quota notice (app remains fully functional in memory):', err);
    }

    // 2. Synchronize individual patients that were modified locally to Firestore
    patients.forEach((patient) => {
      try {
        const patientJson = JSON.stringify(patient);
        const lastSyncedJson = lastSyncedPatientsRef.current[patient.id];
        
        if (lastSyncedJson !== undefined && patientJson !== lastSyncedJson) {
          // Local state has diverged! Push to cloud database
          lastSyncedPatientsRef.current[patient.id] = patientJson;
          savePatientToFirestore(patient);
        } else if (lastSyncedJson === undefined) {
          // Cache initial reference without sending redundant firestore updates
          lastSyncedPatientsRef.current[patient.id] = patientJson;
        }
      } catch (err) {
        console.warn(`Patient sync notice for ${patient.id}:`, err);
      }
    });
  }, [patients]);

  // 15-minute countdown clock effect (synchronized across devices)
  useEffect(() => {
    if (!examTimerActive) return;

    const timer = setInterval(() => {
      let nextVal = 0;
      if (startTimeMs) {
        const elapsedSec = Math.floor((Date.now() - startTimeMs) / 1000);
        nextVal = Math.max(0, durationSec - elapsedSec);
      } else {
        nextVal = Math.max(0, examTimeRemaining - 1);
      }

      setExamTimeRemaining(nextVal);

      if (nextVal <= 0) {
        clearInterval(timer);
        setExamTimerActive(false);
        setStartTimeMs(null);
        setShowLogModal(true);
        
        setExamLog(log => {
          const entry = {
            id: `log-end-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
            timerTime: '00:00',
            patientName: '系統',
            action: '⏰ 15分鐘臨床模擬測驗倒數結束，系統自動封存學習歷程'
          };
          const updated = [entry, ...log];
          saveExamStateToFirestore({
            examTimerActive: false,
            startTimeMs: null,
            durationSec: 900,
            examTimeRemaining: 0,
            examLog: updated
          });
          return updated;
        });

        setToasts(toasts => [...toasts, {
          id: `toast-exam-end-${Date.now()}`,
          message: '⏰ 15分鐘臨床模擬測驗已結束！請檢視並匯出您的學習歷程記錄。',
          type: 'info'
        }]);
        triggerAudioNotify();
        return;
      }

        // "所有的抽血都會在倒數剩9分鐘的時候出來" + Dynamic delay/manual release scheduled trigger check
        setPatients(currentPatients => {
          let anyPatientChanged = false;
          let countCompleted = 0;
          let revealedImaging: string[] = [];
          let revealedLabs: string[] = [];

          const updated = currentPatients.map(p => {
            let changed = false;

            // 1. Dynamic Scheduled Imaging Release Check
            const updatedImaging = p.imagingStudies.map(study => {
              const targetSeconds = (study.publishMinutesRemaining || 0) * 60;
              const isTimerTrigger = (study.publishMode === 'timer' || study.publishMode === 'scheduled') && study.publishMinutesRemaining !== undefined && nextVal === targetSeconds;
              // Legacy support: for Kao-Ling's CXR2, if it doesn't have publishMode set but is id 'img-4-2-cxr2', trigger at 540s
              const isLegacyCxr2Trigger = p.id === 'pat-4' && study.id === 'img-4-2-cxr2' && nextVal === 540;

              if ((isTimerTrigger || isLegacyCxr2Trigger) && !study.visible) {
                changed = true;
                revealedImaging.push(`${p.name}的「${study.title}」影像`);
                return { 
                  ...study, 
                  visible: true, 
                  publishMode: study.publishMode || 'timer',
                  publishMinutesRemaining: study.publishMinutesRemaining || 9,
                  dateTime: clinicalTime || new Date().toISOString().slice(0, 16).replace('T', ' ') 
                };
              }
              return study;
            });

             // 2. Dynamic Scheduled Lab Reports Release Check
            const updatedLabs = p.labReports.map(report => {
              const targetSeconds = (report.publishMinutesRemaining || 0) * 60;
              const isTimerTrigger = (report.publishMode === 'timer' || report.publishMode === 'scheduled') && report.publishMinutesRemaining !== undefined && nextVal === targetSeconds;

              if (isTimerTrigger && !report.visible) {
                changed = true;
                revealedLabs.push(`${p.name}的「${report.title}」抽血報告`);
                return { 
                  ...report, 
                  visible: true, 
                  dateTime: clinicalTime || new Date().toISOString().slice(0, 16).replace('T', ' ') 
                };
              }
              return report;
            });

            // 2.5. Dynamic Scheduled ECG Reports Release Check
            const updatedEcgs = (p.ecgReports || []).map(ecg => {
              const targetSeconds = (ecg.publishMinutesRemaining || 0) * 60;
              const isTimerTrigger = (ecg.publishMode === 'timer' || ecg.publishMode === 'scheduled') && ecg.publishMinutesRemaining !== undefined && nextVal === targetSeconds;

              if (isTimerTrigger && !ecg.visible) {
                changed = true;
                revealedImaging.push(`${p.name}的「${ecg.title}」心電圖報告`);
                return { 
                  ...ecg, 
                  visible: true, 
                  dateTime: clinicalTime || new Date().toISOString().slice(0, 16).replace('T', ' ') 
                };
              }
              return ecg;
            });

            // 2.6. Dynamic Scheduled Ultrasound Reports Release Check
            const updatedUltrasounds = (p.ultrasoundReports || []).map(ultra => {
              const targetSeconds = (ultra.publishMinutesRemaining || 0) * 60;
              const isTimerTrigger = (ultra.publishMode === 'timer' || ultra.publishMode === 'scheduled') && ultra.publishMinutesRemaining !== undefined && nextVal === targetSeconds;

              if (isTimerTrigger && !ultra.visible) {
                changed = true;
                revealedImaging.push(`${p.name}的「${ultra.title}」重點式超音波報告`);
                return { 
                  ...ultra, 
                  visible: true, 
                  dateTime: clinicalTime || new Date().toISOString().slice(0, 16).replace('T', ' ') 
                };
              }
              return ultra;
            });

            let updatedPat = p;

            if (changed) {
              anyPatientChanged = true;
              updatedPat = {
                ...p,
                imagingStudies: updatedImaging,
                labReports: updatedLabs,
                ecgReports: updatedEcgs,
                ultrasoundReports: updatedUltrasounds
              };
            }

            // 3. Auto-complete pending blood tests at 9 minutes (540s) remaining
            if (nextVal === 540) {
              const hasPendingBlood = p.clinicalOrders.some(o => o.status === 'PENDING' && ['CBC', 'DC', 'BIO', 'BLOOD_GAS'].includes(o.orderType));
              if (hasPendingBlood) {
                anyPatientChanged = true;
                const clonedOrders = p.clinicalOrders.map(o => {
                  const isBloodTest = ['CBC', 'DC', 'BIO', 'BLOOD_GAS'].includes(o.orderType);
                  if (o.status === 'PENDING' && isBloodTest) {
                    countCompleted++;
                    return { ...o, status: 'COMPLETED' as const, countdownRemaining: 0 };
                  }
                  return o;
                });

                if (updatedPat === p) {
                  updatedPat = { ...p };
                }
                updatedPat.clinicalOrders = clonedOrders;
                updatedPat.labReports = [...(updatedPat.labReports || p.labReports)];

                p.clinicalOrders.forEach(o => {
                  const isBloodTest = ['CBC', 'DC', 'BIO', 'BLOOD_GAS'].includes(o.orderType);
                  if (o.status === 'PENDING' && isBloodTest) {
                    injectSimulatedReport(updatedPat, o.orderType, o.displayTime, o.selectedItems, o.details);
                  }
                });
              }
            }

            return updatedPat;
          });

          if (!anyPatientChanged) {
            return currentPatients;
          }

          // Trigger notifications and logs for dynamically revealed items
          if (revealedImaging.length > 0 || revealedLabs.length > 0) {
            const mins = Math.floor(nextVal / 60);
            const secs = nextVal % 60;
            const timerStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            [...revealedImaging, ...revealedLabs].forEach(item => {
              setToasts(toasts => [...toasts, {
                id: `toast-reveal-${Date.now()}-${Math.random()}`,
                message: `📢 臨床模擬：倒數 ${timerStr}，${item} 已自動發布！`,
                type: 'success'
              }]);
            });

            setExamLog(log => {
              const entries = [...revealedImaging, ...revealedLabs].map((item, idx) => ({
                id: `log-reveal-${Date.now()}-${idx}-${Math.random()}`,
                timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
                timerTime: timerStr,
                patientName: '系統',
                action: `🖼️ 自動發布：${item} 已達設定倒數時間，自動發布至學生端。`
              }));
              return [...entries, ...log];
            });

            triggerAudioNotify();
          }

          if (nextVal === 540 && countCompleted > 0) {
            setToasts(toasts => [...toasts, {
              id: `toast-9min-${Date.now()}`,
              message: `📢 臨床模擬：已達倒數剩餘 9 分鐘，所有抽血項目已全數提前自動分析完成！`,
              type: 'success'
            }]);
            
            setExamLog(log => [
              {
                id: `log-9min-labs-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
                timerTime: '09:00',
                patientName: '系統',
                action: '📢 臨床計時：倒數剩餘 9 分鐘，所有 PENDING 狀態之抽血檢體已自動發布結果完成！'
              },
              ...log
            ]);

            triggerAudioNotify();
          }

          return updated;
        });
    }, 1000);

    return () => clearInterval(timer);
  }, [examTimerActive, startTimeMs, durationSec]);

  // Automatically log student viewing/tabs activities
  const activePatientForLog = patients.find(p => p.id === activePatientId);
  useEffect(() => {
    if (activePatientForLog && examTimerActive) {
      let tabName = '';
      if (activeTab === 'emr') tabName = '查看病患基本資料';
      else if (activeTab === 'summary') tabName = '查看病情摘要';
      else if (activeTab === 'labs') tabName = '查看檢驗報告欄位';
      else if (activeTab === 'radiology') tabName = '查看影像醫學報告';
      else if (activeTab === 'cpoe') tabName = '進入醫囑系統 (CPOE)';
      
      if (tabName) {
        addExamLogEntry(tabName, activePatientForLog.name);
      }
    }
  }, [activeTab, activePatientId, examTimerActive]);

  // Main global countdown reactor for CPOE pending student orders
  useEffect(() => {
    const timer = setInterval(() => {
      let stateChanged = false;
      const updatedPatients = patients.map((patient) => {
        const hasPending = patient.clinicalOrders.some(o => o.status === 'PENDING');
        if (!hasPending) return patient;

        // Process each pending order
        const updatedOrders = patient.clinicalOrders.map((order) => {
          if (order.status !== 'PENDING') return order;

          const remaining = order.countdownRemaining !== undefined ? order.countdownRemaining - 1 : 0;
          
          if (remaining <= 0) {
            stateChanged = true;
            // Order complete! Trigger report injection!
            const completedOrder: ClinicalOrder = {
              ...order,
              countdownRemaining: 0,
              status: 'COMPLETED'
            };

            // Injected mock results corresponding to this completed order
            injectSimulatedReport(patient, order.orderType, order.displayTime, order.selectedItems, order.details);

            // Trigger clinical alert toast
            const orderLabel = order.orderType === 'CT' ? '【影像科檢查】' : order.orderType === 'MED' ? '【臨床醫囑給藥】' : '【實驗室檢驗】';
            const alertMsg = order.orderType === 'MED' 
              ? `🎉 點滴與口服藥囑已成功傳輸完成！病患 ${patient.name} 開立的藥品已由電子藥局配送給藥完畢！`
              : `🎉 ${orderLabel} 病患 ${patient.name} 的 ${order.orderType} 檢體報告已快速 analysis 完畢，結果送達診台！`;
            
            setToasts(prev => [...prev, { id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, message: alertMsg, type: 'success' }]);
            triggerAudioNotify();

            return completedOrder;
          }

          return {
            ...order,
            countdownRemaining: remaining
          };
        });

        return {
          ...patient,
          clinicalOrders: updatedOrders
        };
      });

      if (stateChanged) {
        setPatients(updatedPatients);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [patients]);

  // Auto-redirect active patient if the currently selected patient is hidden
  useEffect(() => {
    const currentPat = patients.find(p => p.id === activePatientId);
    if (currentPat && currentPat.hidden) {
      const visiblePatients = patients.filter(p => !p.hidden);
      if (visiblePatients.length > 0) {
        setActivePatientId(visiblePatients[0].id);
      } else {
        setActivePatientId(null);
      }
    } else if (!activePatientId) {
      const visiblePatients = patients.filter(p => !p.hidden);
      if (visiblePatients.length > 0) {
        setActivePatientId(visiblePatients[0].id);
      }
    }
  }, [activePatientId, patients]);

  // Inject a realistic outcome report matching the patient's exact active clinical case study
  const injectSimulatedReport = (
    patient: Patient, 
    orderType: ClinicalOrder['orderType'], 
    customIsoTime: string,
    selectedItems?: string[],
    details?: string
  ) => {
    const cleanTime = customIsoTime || new Date().toISOString().substring(0, 16);

    // Determine state archetype to match preset patients
    let archetype: 'normal' | 'appendicitis' | 'pneumonia' | 'dka' = 'normal';
    if (patient.name === '林建國') archetype = 'appendicitis';
    else if (patient.name === '張秀蘭') archetype = 'pneumonia';
    else if (patient.name === '陳志維') archetype = 'dka';

    if (orderType === 'MED') {
      const rxDetails = details || '';
      if (rxDetails.startsWith('[MED_ORDER]')) {
        const parts = rxDetails.split('|');
        const medName = parts.find(p => p.startsWith('名稱:'))?.replace('名稱:', '') || 'Unknown Medicine';
        const dosage = parts.find(p => p.startsWith('劑量:'))?.replace('劑量:', '') || '1 dose';
        const freq = parts.find(p => p.startsWith('頻率:'))?.replace('頻率:', '') || 'QD';
        const route = parts.find(p => p.startsWith('途徑:'))?.replace('途徑:', '') || 'PO';
        const days = parseInt(parts.find(p => p.startsWith('天數:'))?.replace('天數:', '') || '3', 10);

        const newPrescription = {
          id: `rx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          medicineName: medName,
          dosage,
          frequency: freq,
          route,
          days,
          orderedAt: cleanTime,
          dept: '住院' as const
        };

        patient.prescriptions = [newPrescription, ...patient.prescriptions];
      }
      return;
    }

    if (orderType === 'CT') {
      // Create a gorgeous computed tomography scan report from backstage settings or fallback
      const customTitle = patient.customImagingSettings?.title || '高解析胸部輔助斷層掃描 (Chest CT)';
      let presetVisualPath = 'blank_ct';
      const diagNotes = patient.customImagingSettings?.description || 'Unremarkable thoracic structure. Normal mediastinal shadow, normal trachea segment.';

      if (archetype === 'appendicitis') {
        presetVisualPath = 'appendicitis';
      } else if (archetype === 'pneumonia') {
        presetVisualPath = 'pneumonia';
      }

      const newStudy: ImagingStudy = {
        id: `img-injected-${Date.now()}`,
        title: customTitle,
        studyType: 'CT',
        imageUrl: presetVisualPath,
        description: diagNotes,
        dateTime: cleanTime
      };

      // Append to patient
      patient.imagingStudies = [newStudy, ...patient.imagingStudies];

    } else {
      // Lab results (CBC, DC, BIO, BLOOD_GAS)
      let customTitle = '';
      switch (orderType) {
        case 'CBC':
          customTitle = 'C-CPOE 血液學細胞常規分析';
          break;
        case 'DC':
          customTitle = 'C-CPOE 血液細胞分類精細計數';
          break;
        case 'BIO':
          customTitle = 'C-CPOE 生化整合暨水份離子測定';
          break;
        case 'BLOOD_GAS':
          customTitle = 'C-CPOE 動脈氣體物理酸鹼分析 (ABG)';
          break;
      }

      // Group configuration lists for looking up flat fallbacks (co-supporting old presets and all 31 requested items)
      const LAB_CATEGORIES_FLAT: Record<string, { defaultVal: string; unit: string; ref: string }> = {
        // CBC / DC
        'WBC': { defaultVal: '6.5', unit: '10^3/μL', ref: '4.0 - 10.0' },
        'RBC': { defaultVal: '4.50', unit: '10^6/μL', ref: '4.0 - 5.5' },
        'Hb': { defaultVal: '14.0', unit: 'g/dL', ref: '12.0 - 16.0' },
        'PLT': { defaultVal: '250', unit: '10^3/μL', ref: '150 - 450' },
        'Platelet': { defaultVal: '250', unit: '10^3/μL', ref: '150 - 450' },
        'Hct': { defaultVal: '42.0', unit: '%', ref: '36.0 - 50.0' },
        'Neutrophils (Seg)': { defaultVal: '61.2', unit: '%', ref: '40 - 70' },
        'Neutrophil': { defaultVal: '61.2', unit: '%', ref: '40 - 70' },
        'Band form': { defaultVal: '1.2', unit: '%', ref: '0 - 3' },
        'Lymphocytes': { defaultVal: '28.5', unit: '%', ref: '20 - 45' },
        'Lymphocyte': { defaultVal: '28.5', unit: '%', ref: '20 - 45' },
        'Monocytes': { defaultVal: '7.8', unit: '%', ref: '2 - 10' },
        'Monocyte': { defaultVal: '7.8', unit: '%', ref: '2 - 10' },
        'Eosinophils': { defaultVal: '2.1', unit: '%', ref: '0 - 6' },
        'Eosinophil': { defaultVal: '2.1', unit: '%', ref: '0 - 6' },
        'Basophil': { defaultVal: '0.4', unit: '%', ref: '0 - 1' },
        
        // BIO
        'BUN': { defaultVal: '12.0', unit: 'mg/dL', ref: '7 - 20' },
        'Creatinine': { defaultVal: '0.82', unit: 'mg/dL', ref: '0.5 - 1.2' },
        'eGFR': { defaultVal: '98', unit: 'mL/min/1.73m²', ref: '>= 90' },
        'Na': { defaultVal: '141', unit: 'mEq/L', ref: '135 - 145' },
        'K': { defaultVal: '4.1', unit: 'mEq/L', ref: '3.5 - 5.1' },
        'Cl': { defaultVal: '102', unit: 'mEq/L', ref: '98 - 107' },
        'Glucose (sugar)': { defaultVal: '98', unit: 'mg/dL', ref: '70 - 140' },
        'Glucose': { defaultVal: '98', unit: 'mg/dL', ref: '70 - 140' },
        'AST (GOT)': { defaultVal: '22', unit: 'U/L', ref: '0 - 40' },
        'AST': { defaultVal: '22', unit: 'U/L', ref: '0 - 40' },
        'ALT (GPT)': { defaultVal: '18', unit: 'U/L', ref: '0 - 40' },
        'ALT': { defaultVal: '18', unit: 'U/L', ref: '0 - 40' },
        'Total bilirubin': { defaultVal: '0.7', unit: 'mg/dL', ref: '0.2 - 1.2' },
        'Albumin': { defaultVal: '4.2', unit: 'g/dL', ref: '3.5 - 5.5' },
        'CRP': { defaultVal: '2.3', unit: 'mg/L', ref: '0 - 5.0' },
        'Procalcitonin': { defaultVal: '0.02', unit: 'ng/mL', ref: '< 0.05' },
        'Lactate': { defaultVal: '1.2', unit: 'mmol/L', ref: '0.5 - 2.2' },
        'Troponin-I': { defaultVal: '0.01', unit: 'ng/mL', ref: '< 0.04' },

        // ABG
        'pH': { defaultVal: '7.41', unit: '', ref: '7.35 - 7.45' },
        'pCO2': { defaultVal: '41.2', unit: 'mmHg', ref: '35 - 45' },
        'PaCO₂': { defaultVal: '41.2', unit: 'mmHg', ref: '35 - 45' },
        'pO2': { defaultVal: '94.0', unit: 'mmHg', ref: '80 - 100' },
        'PaO₂': { defaultVal: '94.0', unit: 'mmHg', ref: '80 - 100' },
        'HCO3-': { defaultVal: '24.8', unit: 'mEq/L', ref: '22 - 26' },
        'HCO₃⁻': { defaultVal: '24.8', unit: 'mEq/L', ref: '22 - 26' },
        'Base excess': { defaultVal: '0.5', unit: 'mEq/L', ref: '-2.0 - 2.5' },
        'SaO₂': { defaultVal: '98.5', unit: '%', ref: '95 - 100' }
      };

      const categoryKeysMap = {
        CBC: ['WBC', 'RBC', 'Hb', 'Hct', 'Platelet'],
        DC: ['Neutrophil', 'Band form', 'Lymphocyte', 'Monocyte', 'Eosinophil', 'Basophil'],
        BIO: ['BUN', 'Creatinine', 'eGFR', 'Na', 'K', 'Cl', 'Glucose', 'AST', 'ALT', 'Total bilirubin', 'Albumin', 'CRP', 'Procalcitonin', 'Lactate', 'Troponin-I'],
        BLOOD_GAS: ['pH', 'PaCO2', 'PaO2', 'HCO3-', 'Base excess', 'SaO2']
      }[orderType];

      // Translate ordered items from catalog ID to exact keys used in customLabSettings (PDF 10/03)
      const mapOrderToSettingsKey = (id: string): string[] => {
        switch (id) {
          case 'WBC': return ['WBC'];
          case 'Hb': return ['Hb'];
          case 'Ht': case 'Hct_Ped': case 'Hct': return ['Hct'];
          case 'Platelet': return ['Platelet'];
          case 'Neutrophil_Band': return ['Band form'];
          case 'Seg': return ['Neutrophil'];
          case 'Lymphocyte_S': case 'L_Percent': return ['Lymphocyte'];
          case 'Monocyte': return ['Monocyte'];
          case 'Eosinophil': return ['Eosinophil'];
          case 'Basophil': return ['Basophil'];
          
          case 'Na': case 'Na_Ped': return ['Na'];
          case 'K': return ['K'];
          case 'Cl': return ['Cl'];
          case 'Glucose': case 'Glucose_AC': case 'Glucose_PC': return ['Glucose'];
          case 'BUN': return ['BUN'];
          case 'Creatinine': return ['Creatinine', 'eGFR']; // Creatinine always brings eGFR
          case 'GOT': return ['AST'];
          case 'GPT': return ['ALT'];
          case 'Bilirubin_Total': return ['Total bilirubin'];
          case 'CRP': return ['CRP'];
          
          case 'pH': return ['pH'];
          case 'PaCO2': return ['PaCO2'];
          case 'PaO2': return ['PaO2'];
          case 'HCO3': return ['HCO3-'];
          case 'BE': return ['Base excess'];
          case 'SaO2': return ['SaO2'];
          default: return [id];
        }
      };

      // Determine list of keys to resolve
      let targetKeys: string[] = [];
      if (selectedItems && selectedItems.length > 0) {
        selectedItems.forEach(item => {
          targetKeys.push(...mapOrderToSettingsKey(item));
        });
      } else {
        targetKeys = [...categoryKeysMap];
      }

      // De-duplicate targetKeys
      targetKeys = Array.from(new Set(targetKeys));

      // Filter: only keep items that exist in customLabSettings (PDF) if customLabSettings is available
      if (patient.customLabSettings) {
        targetKeys = targetKeys.filter(key => patient.customLabSettings && patient.customLabSettings[key] !== undefined);
      }

      const resolvedItems: LabResultItem[] = targetKeys.map((key) => {
        // 1. Try patient-specific custom back-office setting (PDF data)
        if (patient.customLabSettings && patient.customLabSettings[key]) {
          const setting = patient.customLabSettings[key];
          return {
            name: key,
            value: setting.value,
            unit: setting.unit,
            referenceRange: setting.referenceRange,
            status: setting.status
          };
        }

        // 2. Try standard preset templates
        const templateItems = getTemplateLab(orderType, archetype);
        const match = templateItems.find(t => t.name === key);
        if (match) return match;

        // 3. Try catalog lookup
        const catalogItem = getCatalogItemById(key);
        if (catalogItem) {
          return {
            name: key,
            value: catalogItem.defaultVal,
            unit: catalogItem.unit,
            referenceRange: catalogItem.referenceRange,
            status: 'normal'
          };
        }

        // 4. Fallback to flat dictionary
        const flatDef = LAB_CATEGORIES_FLAT[key] || { defaultVal: '1.0', unit: '', ref: '0 - 1' };
        return {
          name: key,
          value: flatDef.defaultVal,
          unit: flatDef.unit,
          referenceRange: flatDef.ref,
          status: 'normal'
        };
      });

      // Update title with chosen items to make it realistic
      const subItemsTitleLabel = selectedItems && selectedItems.length > 0 ? ` (${selectedItems.join(', ')})` : '';

      const newReport: LabReport = {
        id: `lab-injected-${Date.now()}`,
        category: orderType,
        title: `${customTitle}${subItemsTitleLabel}`,
        items: resolvedItems,
        dateTime: cleanTime
      };

      // Append to patient
      patient.labReports = [newReport, ...patient.labReports];
    }
  };

  // Place clinical order (CBC, DC, BIO, BLOOD_GAS, CT) from Student Panel
  const handlePlaceOrder = (
    orderType: ClinicalOrder['orderType'],
    details: string,
    delaySec: number,
    targetDisplayTime: string,
    selectedItems?: string[]
  ) => {
    if (!activePatientId) return;

    // "要在啟動倒數計時的情況下，無論是第幾分鐘抽血，都是在倒數9分鐘出現"
    // "抽血檢驗後，不能快速出現結果，一律都是倒數計時九分鐘出"
    let finalDelaySec = delaySec;
    const isBloodDraw = ['CBC', 'DC', 'BIO', 'BLOOD_GAS'].includes(orderType);
    
    if (isBloodDraw) {
      if (examTimerActive) {
        if (examTimeRemaining > 540) {
          finalDelaySec = examTimeRemaining - 540;
        } else {
          finalDelaySec = 0;
        }
      } else {
        // Under free practice mode (no exam timer active), default to 540 seconds (9 minutes)
        finalDelaySec = 540;
      }
    }

    // Calculate simulation specific timer labels if countdown is active
    let timerOrderedAt: string | undefined = undefined;
    let timerDisplayTime: string | undefined = undefined;
    if (examTimerActive) {
      const orderMin = Math.floor(examTimeRemaining / 60);
      const orderSec = examTimeRemaining % 60;
      timerOrderedAt = `倒數 ${orderMin.toString().padStart(2, '0')}:${orderSec.toString().padStart(2, '0')}`;

      if (isBloodDraw) {
        const actualFinishTime = examTimeRemaining > 540 ? 540 : examTimeRemaining;
        const finishMin = Math.floor(actualFinishTime / 60);
        const finishSec = actualFinishTime % 60;
        timerDisplayTime = `倒數 ${finishMin.toString().padStart(2, '0')}:${finishSec.toString().padStart(2, '0')}`;
      } else {
        const finishTime = Math.max(0, examTimeRemaining - finalDelaySec);
        const finishMin = Math.floor(finishTime / 60);
        const finishSec = finishTime % 60;
        timerDisplayTime = `倒數 ${finishMin.toString().padStart(2, '0')}:${finishSec.toString().padStart(2, '0')}`;
      }
    }

    const newOrder: ClinicalOrder = {
      id: `ord-${Date.now()}`,
      orderType,
      details,
      orderedAt: new Date().toISOString(),
      displayTime: targetDisplayTime,
      delaySeconds: finalDelaySec,
      countdownRemaining: finalDelaySec,
      status: 'PENDING',
      selectedItems,
      timerOrderedAt,
      timerDisplayTime
    };

    if (examTimerActive && isBloodDraw) {
      setShowBloodDrawAlertModal(true);
    }

    const pat = patients.find(p => p.id === activePatientId);

    // Logging to Simulation Activity Log
    if (examTimerActive) {
      if (orderType === 'MED') {
        let medDetails = details;
        if (details.startsWith('[MED_ORDER]')) {
          const parts = details.split('|');
          const namePart = parts.find(p => p.startsWith('名稱:'))?.replace('名稱:', '') || '';
          const dosePart = parts.find(p => p.startsWith('劑量:'))?.replace('劑量:', '') || '';
          const routePart = parts.find(p => p.startsWith('途徑:'))?.replace('途徑:', '') || '';
          const freqPart = parts.find(p => p.startsWith('頻率:'))?.replace('頻率:', '') || '';
          medDetails = `${namePart} ${dosePart} (${routePart}, ${freqPart})`;
        }
        addExamLogEntry(`開立給藥醫囑：${medDetails}`, pat?.name || '');
      } else if (orderType === 'CT') {
        addExamLogEntry(`開立影像科檢查醫囑：${details}`, pat?.name || '');
      } else {
        addExamLogEntry(`開立實驗室檢驗醫囑 [${orderType}]${selectedItems && selectedItems.length > 0 ? `：${selectedItems.join(', ')}` : ''}`, pat?.name || '');
      }
    }

    const updatedPatients = patients.map((pat) => {
      if (pat.id !== activePatientId) return pat;
      return {
        ...pat,
        clinicalOrders: [newOrder, ...pat.clinicalOrders]
      };
    });

    setPatients(updatedPatients);

    // Reset dismissed warning for this patient so the new pending progress banner is visible again
    if (activePatientId) {
      setDismissedWarnings(prev => ({ ...prev, [activePatientId]: false }));
    }

    // If delay is immediat (0s), it loops instantly in the tick or we handle it here:
    if (finalDelaySec === 0) {
      // Instantly inject
      const activePatIndex = updatedPatients.findIndex(p => p.id === activePatientId);
      if (activePatIndex !== -1) {
        const p = { ...updatedPatients[activePatIndex] };
        injectSimulatedReport(p, orderType, targetDisplayTime, selectedItems, details);
        
        // Convert that order from list to COMPLETED
        p.clinicalOrders = p.clinicalOrders.map(o => o.id === newOrder.id ? { ...o, status: 'COMPLETED', countdownRemaining: 0 } : o);
        
        const freshList = [...updatedPatients];
        freshList[activePatIndex] = p;
        setPatients(freshList);

        const successMsg = orderType === 'MED' 
          ? `⚡ 病患 ${p.name} 的藥品處方開立即時核定配送成功！`
          : `⚡ 醫囑即時派發成功！病患 ${p.name} 的 ${orderType} 數據已實時 analysis 呈報！`;

        setToasts(prev => [...prev, { id: `toast-inst-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, message: successMsg, type: 'success' }]);
        triggerAudioNotify();
      }
    } else {
      const pendingMsg = orderType === 'MED'
        ? `📥 已在 HIS 管道登錄口服與點滴處方：正在排配、傳送至臨床藥局中...`
        : `📥 已在 HIS 管道登錄醫囑：${orderType} 檢項正在排程中...`;
      setToasts(prev => [...prev, { id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, message: pendingMsg, type: 'info' }]);
    }
  };

  // Immediate Fast Forward bypass timer
  const handleFastForwardOrder = (orderId: string) => {
    const updatedPatients = patients.map((pat) => {
      const orderIdx = pat.clinicalOrders.findIndex(o => o.id === orderId);
      if (orderIdx === -1) return pat;

      const order = pat.clinicalOrders[orderIdx];
      const completedOrder: ClinicalOrder = {
        ...order,
        status: 'COMPLETED',
        countdownRemaining: 0
      };

      // Logging fast forward
      if (examTimerActive) {
        addExamLogEntry(`⚡ 學生手動加速完成醫囑項目：[${order.orderType}]`, pat.name);
      }

      // Create copies
      const newOrders = [...pat.clinicalOrders];
      newOrders[orderIdx] = completedOrder;

      const p = { ...pat, clinicalOrders: newOrders };
      injectSimulatedReport(p, order.orderType, order.displayTime, order.selectedItems, order.details);

      const successLabel = order.orderType === 'MED' ? '處方開立給藥' : `臨床檢測 ${order.orderType}`;
      setToasts(prev => [...prev, { id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, message: `⚡ (快速通關) 病患 ${pat.name} 的${successLabel}完成！`, type: 'success' }]);
      triggerAudioNotify();

      return p;
    });

    setPatients(updatedPatients);
  };

  // Cancel order in pipeline
  const handleCancelOrder = (orderId: string) => {
    const pat = patients.find(p => p.clinicalOrders.some(o => o.id === orderId));
    const order = pat?.clinicalOrders.find(o => o.id === orderId);
    if (examTimerActive && pat && order) {
      addExamLogEntry(`🗑️ 學生撤銷退回醫囑項目：[${order.orderType}]`, pat.name);
    }

    const updatedPatients = patients.map((pat) => {
      return {
        ...pat,
        clinicalOrders: pat.clinicalOrders.filter(o => o.id !== orderId)
      };
    });
    setPatients(updatedPatients);
    setToasts(prev => [...prev, { id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, message: `🗑️ 醫囑已撤銷登錄`, type: 'info' }]);
  };

  // Register New Patient callback
  const handleAddPatient = (newPat: Patient) => {
    setPatients([newPat, ...patients]);
    setToasts(prev => [...prev, { id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, message: `🏥 病患 ${newPat.name} 登記核對完成，已送達床位 ${newPat.bedNumber}！`, type: 'success' }]);
  };

  // Global Patient list deletion intercept state
  const [patientIdPendingDelete, setPatientIdPendingDelete] = useState<string | null>(null);
  const [deletePasscodeInput, setDeletePasscodeInput] = useState('');
  const [deleteConfirmError, setDeleteConfirmError] = useState('');

  // Delete virtual patient
  const handleDeletePatient = (id: string, passwordVerified?: boolean) => {
    if (passwordVerified) {
      const pat = patients.find(p => p.id === id);
      const filtered = patients.filter(p => p.id !== id);
      setPatients(filtered);
      if (activePatientId === id) {
        setActivePatientId(filtered.length > 0 ? filtered[0].id : null);
      }
      if (activeTab !== 'admin') {
        setActiveTab('emr');
      }
      if (pat) {
        setToasts(prev => [...prev, { id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, message: `🗑️ 成功將 ${pat.name} 的建檔從系統中完全登出並刪除！`, type: 'success' }]);
        triggerAudioNotify();
      }
    } else {
      setDeletePasscodeInput('');
      setDeleteConfirmError('');
      setPatientIdPendingDelete(id);
    }
  };

  // State for resetting virtual scenario
  const [patientIdPendingReset, setPatientIdPendingReset] = useState<string | null>(null);

  // Reset virtual patient scenario (clearing ordered labs, imaging, etc.)
  const handleResetScenario = (id: string, confirmed?: boolean) => {
    if (confirmed) {
      const pat = patients.find(p => p.id === id);
      if (pat) {
        const updated: Patient = {
          ...pat,
          clinicalOrders: [], // Clear all clinical orders (pending and completed)
          labReports: pat.labReports
            .filter(lr => !lr.id.startsWith('lab-injected-')) // Clear student-ordered reports
            .map(lr => {
              if (lr.publishMode === 'manual' || lr.publishMode === 'timer' || lr.publishMode === 'scheduled') {
                return { ...lr, visible: false }; // Hide but keep in backoffice
              }
              return lr;
            }),
          imagingStudies: pat.imagingStudies
            .filter(img => !img.id.startsWith('img-injected-')) // Clear student-ordered studies
            .map(img => {
              if (img.publishMode === 'manual' || img.publishMode === 'timer' || img.publishMode === 'scheduled') {
                return { ...img, visible: false }; // Hide but keep in backoffice
              }
              return img;
            }),
          ecgReports: (pat.ecgReports || [])
            .filter(ecg => !ecg.id.startsWith('ecg-injected-')) // Clear student-ordered ECGs
            .map(ecg => {
              if (ecg.publishMode === 'manual' || ecg.publishMode === 'timer' || ecg.publishMode === 'scheduled') {
                return { ...ecg, visible: false }; // Hide but keep in backoffice
              }
              return ecg;
            }),
          ultrasoundReports: (pat.ultrasoundReports || [])
            .filter(ultra => !ultra.id.startsWith('ultra-injected-')) // Clear student-ordered Ultrasounds
            .map(ultra => {
              if (ultra.publishMode === 'manual' || ultra.publishMode === 'timer' || ultra.publishMode === 'scheduled') {
                return { ...ultra, visible: false }; // Hide but keep in backoffice
              }
              return ultra;
            }),
          prescriptions: pat.prescriptions.filter(rx => rx.id.split('-').length <= 2) // Clear ordered prescriptions
        };
        const next = patients.map(p => p.id === updated.id ? updated : p);
        setPatients(next);
        setToasts(prev => [...prev, { id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, message: `🔄 已成功重設【${pat.name}】的病歷與臨床場景，清空所有在本次演練中開立的抽血檢查、影像檢查與處方給藥！已自動隱藏非「立即公開」之報告。`, type: 'success' }]);
        triggerAudioNotify();

        // Also add entry to simulation activity log if exam timer is active
        if (examTimerActive) {
          addExamLogEntry(`🔄 學生執行「一鍵重設場景」，清空該病健的所有開立醫囑與檢查結果。`, pat.name);
        }
      }
    } else {
      setPatientIdPendingReset(id);
    }
  };

  // Reset all virtual patients scenarios to initial settings
  const handleResetAllPatientsScenarios = () => {
    const next = patients.map(pat => ({
      ...pat,
      clinicalOrders: [], // Clear all clinical orders (pending and completed)
      labReports: pat.labReports
        .filter(lr => !lr.id.startsWith('lab-injected-'))
        .map(lr => {
          if (lr.publishMode === 'manual' || lr.publishMode === 'timer' || lr.publishMode === 'scheduled') {
            return { ...lr, visible: false };
          }
          return lr;
        }),
      imagingStudies: pat.imagingStudies
        .filter(img => !img.id.startsWith('img-injected-'))
        .map(img => {
          if (img.publishMode === 'manual' || img.publishMode === 'timer' || img.publishMode === 'scheduled') {
            return { ...img, visible: false };
          }
          return img;
        }),
      ecgReports: (pat.ecgReports || [])
        .filter(ecg => !ecg.id.startsWith('ecg-injected-'))
        .map(ecg => {
          if (ecg.publishMode === 'manual' || ecg.publishMode === 'timer' || ecg.publishMode === 'scheduled') {
            return { ...ecg, visible: false };
          }
          return ecg;
        }),
      ultrasoundReports: (pat.ultrasoundReports || [])
        .filter(ultra => !ultra.id.startsWith('ultra-injected-'))
        .map(ultra => {
          if (ultra.publishMode === 'manual' || ultra.publishMode === 'timer' || ultra.publishMode === 'scheduled') {
            return { ...ultra, visible: false };
          }
          return ultra;
        }),
      prescriptions: pat.prescriptions.filter(rx => rx.id.split('-').length <= 2) // Clear ordered prescriptions
    }));
    setPatients(next);
    setToasts(prev => [...prev, {
      id: `toast-reset-all-${Date.now()}`,
      message: '🔄 已成功重設【全體所有病患】的臨床演練狀態，清空全體學生開立之抽血、影像與處方，並隱藏非立即發布之項目！',
      type: 'success'
    }]);
    triggerAudioNotify();

    if (examTimerActive) {
      addExamLogEntry('🔄 教官執行「一鍵重設全體病患」，全體虛擬病案已回復至初始乾淨狀態。');
    }
  };

  // Save current patient configuration as default template
  const handleSaveCurrentAsDefault = () => {
    try {
      localStorage.setItem('vhis_default_patients_data', JSON.stringify(patients));
      localStorage.setItem('vhis_patients_data', JSON.stringify(patients));
      patients.forEach(p => savePatientToFirestore(p));
      setToasts(prev => [...prev, {
        id: `toast-save-default-${Date.now()}`,
        message: '💾 已成功將當前所有病患資料、上傳之影像與報告設定儲存為【系統預設模式】！',
        type: 'success'
      }]);
      triggerAudioNotify();
    } catch (err: any) {
      alert('儲存預設失敗：' + err.message);
    }
  };

  // Reset all patients to default mode (either user default or original presets)
  const handleResetToDefaultMode = () => {
    const savedDefault = localStorage.getItem('vhis_default_patients_data');
    if (savedDefault) {
      try {
        const parsed: Patient[] = JSON.parse(savedDefault);
        setPatients(parsed);
        localStorage.setItem('vhis_patients_data', JSON.stringify(parsed));
        parsed.forEach(p => savePatientToFirestore(p));
        setToasts(prev => [...prev, {
          id: `toast-reset-default-${Date.now()}`,
          message: '🔄 已成功將系統重置還原為使用者設定的【預設模式】！',
          type: 'success'
        }]);
        triggerAudioNotify();
        return;
      } catch (e) {
        console.error(e);
      }
    }
    // Fallback to PRESET_PATIENTS
    setPatients(PRESET_PATIENTS);
    localStorage.setItem('vhis_patients_data', JSON.stringify(PRESET_PATIENTS));
    PRESET_PATIENTS.forEach(p => savePatientToFirestore(p));
    setToasts(prev => [...prev, {
      id: `toast-reset-preset-${Date.now()}`,
      message: '🔄 已成功將全體病患資料還原至系統原廠【預設模式】！',
      type: 'success'
    }]);
    triggerAudioNotify();
  };

  // Update specific patient core profile / state
  const handleUpdatePatient = (updated: Patient) => {
    const next = patients.map(p => p.id === updated.id ? updated : p);
    setPatients(next);
  };

  // Helpers to select active patient object safely
  const activePatient = patients.find(p => p.id === activePatientId) || null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans select-none">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
          {/* Top banner */}
          <div className="bg-[#00824F] text-white p-7 text-center relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
              <Building2 className="w-40 h-40 text-white" />
            </div>
            <div className="bg-white/15 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner border border-white/20 backdrop-blur-sm">
              <Building2 className="w-9 h-9 text-white stroke-[2.2]" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">泰萬綜合醫院 醫療資訊系統</h1>
            <p className="text-emerald-100 text-xs font-mono font-medium tracking-wide mt-1">Taiwan General Hospital HIS</p>
          </div>

          {/* Form container */}
          <form onSubmit={handleLoginSubmit} className="p-7 space-y-5">
            <div className="text-center pb-1 border-b border-slate-100">
              <h2 className="text-slate-800 font-bold text-base">使用者身分驗證登入</h2>
              <p className="text-slate-500 text-xs mt-0.5">請輸入系統獲授權之帳號與密碼</p>
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-semibold">{loginError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  使用者帳號 (Username)
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => {
                    setLoginUsername(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  placeholder="請輸入帳號"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00824F] focus:border-transparent transition-all font-mono"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  使用者密碼 (Password)
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  placeholder="請輸入密碼"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00824F] focus:border-transparent transition-all font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#00824F] hover:bg-[#006e43] text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-emerald-900/20 active:scale-[0.99] transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              登入系統 (Login)
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-950 flex flex-col font-sans bg-slate-50" id="vhis-hospital-app">
      
      {/* GLOBAL TOAST ALERTS */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none" id="global-toasts">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => {
              setToasts(prev => prev.filter(t => t.id !== toast.id));
            }}
          />
        ))}
      </div>

      {/* TOP HOSPITAL CORE BAR HEADER */}
        <header className="h-14 bg-[#00824F] text-white flex items-center px-4 md:px-5 justify-between shadow-md flex-shrink-0 animate-fade-in">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-white p-1 rounded text-[#00824F] shadow-sm flex items-center justify-center">
              <Building2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-wide text-xs sm:text-sm flex items-center gap-1.5 font-sans">
                泰萬綜合醫院醫療資訊系統 <span className="hidden md:inline text-[10px] bg-[#006e43] text-emerald-100 border border-emerald-500/50 font-mono px-1.5 py-0.2 rounded font-bold">Taiwan General Hospital HIS</span>
              </h1>
            </div>
          </div>

          {/* Global Statistics Indicators */}
          <div className="flex items-center gap-2 md:gap-4 font-mono">
            <div className="hidden lg:flex items-center gap-1.5 bg-[#006e43]/40 px-3 py-1 rounded border border-[#006e43]/30">
              <Users className="w-3.5 h-3.5 text-emerald-200" />
              <span className="text-[10px] text-emerald-200 font-sans">本病房：</span>
              <span className="text-white text-xs font-bold font-mono">{patients.length} 床</span>
            </div>

            <div className="flex flex-col items-end bg-[#005a37] px-2.5 py-1 rounded border border-[#006e43]/55">
              <div className="flex items-center gap-1 leading-none">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline text-[10px] text-emerald-200 font-sans">臨床標準：</span>
                <span className="text-emerald-300 text-xs font-bold font-mono">
                  {currentSystemTime ? currentSystemTime.split(' ')[0] : '2026/07/10'}
                </span>
              </div>
              <div className="text-[10px] text-emerald-300 font-bold font-mono mt-0.5 leading-none">
                {examTimerActive ? (
                  <span className="text-amber-300 animate-pulse">
                    倒數 {Math.floor(examTimeRemaining / 60).toString().padStart(2, '0')}:{(examTimeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                ) : (
                  <span>倒數 15:00</span>
                )}
              </div>
            </div>

            {/* Authenticated User Status & Logout */}
            <div className="hidden sm:flex items-center gap-2 bg-[#006e43]/60 px-2.5 py-1 rounded-lg border border-emerald-400/30 text-xs font-sans">
              <User className="w-3.5 h-3.5 text-emerald-200" />
              <span className="font-bold text-emerald-100 font-mono">TGH</span>
              <button
                type="button"
                onClick={handleLogout}
                className="ml-1 text-[10px] bg-emerald-800 hover:bg-emerald-900 text-emerald-100 px-2 py-0.5 rounded border border-emerald-500/40 transition-colors cursor-pointer font-sans flex items-center gap-1"
                title="登出系統"
              >
                <LogOut className="w-3 h-3" />
                登出
              </button>
            </div>

            {/* Backstage Upload Admin Panel Button */}
            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer font-sans border border-amber-300 active:scale-95"
              title="開啟教研考官後台，可上傳影像、心電圖與超音波"
            >
              <Upload className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden sm:inline">後台影像與報告上傳</span>
              <span className="sm:hidden">後台</span>
            </button>
          </div>
        </header>



      {/* DASHBOARD WORKSPACE GRID (Sidebar & Main stage) */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
        
        {/* MOBILE PATIENT SELECTOR BAR (Only on small screens / mobile fit view) */}
        <div className="md:hidden bg-slate-800 text-white px-3.5 py-2.5 flex items-center justify-between border-b border-slate-700 shrink-0 text-xs font-sans">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200">
              目前病患：<span className="text-amber-300 font-mono font-bold">{activePatient ? `${activePatient.bedNumber} 床 ${activePatient.name}` : '未選擇'}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMobilePatientListOpen(prev => !prev)}
            className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
          >
            <span>{isMobilePatientListOpen ? '收合名單 ▲' : '切換病患 ▾'}</span>
          </button>
        </div>

        {/* SIDEBAR: PATIENTS REGISTRY PANEL */}
        <div className={`w-full md:w-80 shrink-0 flex flex-col border-b md:border-b-0 border-r border-slate-250 bg-white transition-all duration-200 ${
          isMobilePatientListOpen 
            ? 'max-h-[300px] overflow-y-auto shadow-md border-b-2 border-emerald-600' 
            : 'hidden md:flex md:h-full md:max-h-none'
        }`}>
          <PatientList
            patients={patients}
            activePatientId={activePatientId}
            onSelectPatient={(id) => {
              setActivePatientId(id);
              setIsMobilePatientListOpen(false); // Auto collapse patient list on mobile after selection
            }}
            onAddPatient={(newPatient) => {
              handleAddPatient(newPatient);
              setIsMobilePatientListOpen(false);
            }}
            onDeletePatient={handleDeletePatient}
          />
        </div>

        {/* MAIN STAGE CORE FRAME (9 cols) */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 min-h-0">
          {activePatient ? (
            <div className="p-4 space-y-4">
              
              {/* CURRENT SELECTED PATIENT DEMOGRAPHICS BAR */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4" id="demographics-panel">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#00824F] text-xs bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono font-bold shadow-sm tracking-wide">
                      {activePatient.bedNumber} 床
                    </span>
                    <h2 className="text-slate-900 font-bold text-lg font-sans tracking-tight">{activePatient.name}</h2>
                    <span className="text-[11px] px-2.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-650 font-mono font-bold tracking-wider">
                      病歷號碼：{activePatient.chartNumber}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-550 text-xs font-sans">
                    <div>出生日期：<span className="text-slate-800 font-bold font-mono tracking-wider">{activePatient.birthDate}</span></div>
                    <div>性別：<span className="text-slate-850 font-semibold">{activePatient.gender === 'M' ? '男性 (M)' : activePatient.gender === 'F' ? '女性 (F)' : '其他'}</span></div>
                    <div>年齡：<span className="text-slate-850 font-semibold">{activePatient.age} 歲</span></div>
                  </div>
                </div>

                {/* Sub-tabs workspace navigation */}
                <div className="flex flex-wrap bg-slate-100 border border-slate-200 p-1 rounded-lg text-xs font-semibold shadow-inner" id="stage-tabs-navigation">
                  <button
                    onClick={() => setActiveTab('emr')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer font-sans text-[11px] ${
                      activeTab === 'emr' ? 'bg-[#00824F] text-white font-bold shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    病人基本資料
                  </button>
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer font-sans text-[11px] ${
                      activeTab === 'summary' ? 'bg-[#00824F] text-white font-bold shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    病情摘要
                  </button>
                  <button
                    onClick={() => setActiveTab('cpoe')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer font-sans text-[11px] ${
                      activeTab === 'cpoe' ? 'bg-[#00824F] text-white font-bold shadow-md animate-pulse' : 'text-slate-650 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    開立醫囑（可開藥物）
                  </button>
                  <button
                    onClick={() => setActiveTab('labs')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer font-sans text-[11px] ${
                      activeTab === 'labs' ? 'bg-[#00824F] text-white font-bold shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Microscope className="w-3.5 h-3.5" />
                    檢驗檢視
                  </button>
                  <button
                    onClick={() => setActiveTab('radiology')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer font-sans text-[11px] ${
                      activeTab === 'radiology' ? 'bg-[#00824F] text-white font-bold shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    影像檢查結果
                  </button>
                  <button
                    onClick={() => setActiveTab('ecg')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer font-sans text-[11px] ${
                      activeTab === 'ecg' ? 'bg-[#00824F] text-white font-bold shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-rose-500" />
                    心電圖檢查 (ECG)
                  </button>
                  <button
                    onClick={() => setActiveTab('ultrasound')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer font-sans text-[11px] ${
                      activeTab === 'ultrasound' ? 'bg-[#00824F] text-white font-bold shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-cyan-500" />
                    重點式超音波 (POCUS)
                  </button>
                  <button
                    onClick={() => setActiveTab('rxHistory')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer font-sans text-[11px] ${
                      activeTab === 'rxHistory' ? 'bg-[#00824F] text-white font-bold shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Pill className="w-3.5 h-3.5 text-purple-650" />
                    藥物歷史查詢
                  </button>
                </div>
              </div>

              {/* DYNAMIC PIPELINE WARNING */}
              {activePatient.clinicalOrders.some(o => o.status === 'PENDING') && !dismissedWarnings[activePatient.id] && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs flex items-center justify-between text-amber-900 shadow-sm animate-fade-in relative pr-10">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>提示：學生此時有 <span className="font-bold underline text-amber-900">{activePatient.clinicalOrders.filter(o => o.status === 'PENDING').length} 項</span> 醫囑正在遠端化驗中，倒數完畢後可隨時到「LIS 抽血檢驗」和「PACS 影像調閱」分頁中查看。</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('cpoe')}
                      className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 hover:underline px-2.5 py-1 rounded border border-amber-300 transition-colors cursor-pointer font-bold animate-pulse"
                    >
                      前往開單台
                    </button>
                    <button
                      type="button"
                      onClick={() => setDismissedWarnings(prev => ({ ...prev, [activePatient.id]: true }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-900 p-1 hover:bg-amber-100/60 rounded transition-colors cursor-pointer"
                      title="關閉提示"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ACTIVE TAB STAGE */}
              <main className="min-h-[460px]" id="tab-stage-viewport">
                {activeTab === 'emr' && (
                  <DiagnosesSection
                    patient={activePatient}
                  />
                )}

                {activeTab === 'summary' && (
                  <PatientSummarySection
                    patient={activePatient}
                  />
                )}

                {activeTab === 'radiology' && (
                  <RadiologySection
                    patient={activePatient}
                    clinicalTime={clinicalTime}
                  />
                )}

                {activeTab === 'ecg' && (
                  <EcgSection
                    patient={activePatient}
                  />
                )}

                {activeTab === 'ultrasound' && (
                  <UltrasoundSection
                    patient={activePatient}
                  />
                )}

                {activeTab === 'labs' && (
                  <LabResultsSection
                    patient={activePatient}
                    clinicalTime={clinicalTime}
                  />
                )}

                {activeTab === 'cpoe' && (
                  <CPOEOrderPractice
                    patient={activePatient}
                    onPlaceOrder={handlePlaceOrder}
                    onFastForwardOrder={handleFastForwardOrder}
                    onCancelOrder={handleCancelOrder}
                  />
                )}

                {activeTab === 'rxHistory' && (
                  <MedicationHistorySection
                    patient={activePatient}
                  />
                )}
              </main>

            </div>
          ) : (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-4">
              <Building2 className="w-16 h-16 text-slate-350 stroke-1" />
              <div>
                <h3 className="text-base font-bold text-slate-800">虛擬住院病房空置中</h3>
                <p className="text-xs text-slate-550 mt-1">請利用左側名單最上方「+」按鈕登錄新病患，或點選 preset 範本即可立即初始化臨床培訓情境。</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer Status Bar matching Professional Polish design exactly */}
      <footer className="h-8 bg-slate-200 border-t border-slate-350 flex items-center px-4 justify-between text-[10px] text-slate-600 font-semibold" id="hospital-status-footer">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
            泰萬綜合醫院醫療資訊系統伺服器: 連線正常 (TGH-HMC)
          </span>
          <span>區域資料保護: SECURE_SANDBOX_V4</span>
        </div>
        <div className="flex items-center gap-2 font-mono uppercase text-slate-600">
          {!examTimerActive ? `系統本機時間: ${currentSystemTime.split(' ')[1] || '載入中...'}` : '⏱️ 模擬計時器運作中'} | 本地虛擬端點 IP: 192.168.1.104
        </div>
      </footer>

      {/* Global Sidebar Patient Deletion Dialog Modal (00000 Lock) */}
      {patientIdPendingDelete && (() => {
        const patient = patients.find(p => p.id === patientIdPendingDelete);
        if (!patient) return null;
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-[9999] animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full mx-4 overflow-hidden transform transition-all duration-200">
              <div className="bg-rose-600 p-4 text-white flex items-center gap-2.5">
                <Trash2 className="w-5 h-5 shrink-0" />
                <div>
                  <h3 className="font-bold text-xs tracking-wide">🔥 確定要完全刪除此病患資料？</h3>
                  <p className="text-[9px] text-rose-100 uppercase font-mono tracking-tight">Taiwan General Hospital HIS Security Gate</p>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="text-xs text-slate-600 leading-relaxed font-sans">
                  確定要完全將病患 <span className="font-bold text-slate-900">【{patient.name}】</span>（病歷號碼: {patient.chartNumber}）的建檔與全部虛擬病歷學籍檔案從系統中徹底刪除嗎？此動作將立即生效且無法復原。
                </div>

                <div className="flex gap-2 pt-2 text-xs font-bold font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setPatientIdPendingDelete(null);
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer border border-slate-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDeletePatient(patientIdPendingDelete, true);
                      setPatientIdPendingDelete(null);
                    }}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer transition-colors shadow-md text-center"
                  >
                    確認直接刪除
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Patient Scenario Reset Dialog Modal */}
      {patientIdPendingReset && (() => {
        const patient = patients.find(p => p.id === patientIdPendingReset);
        if (!patient) return null;
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-[9999] animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full mx-4 overflow-hidden transform transition-all duration-200">
              <div className="bg-amber-600 p-4 text-white flex items-center gap-2.5">
                <RotateCcw className="w-5 h-5 shrink-0" />
                <div>
                  <h3 className="font-bold text-xs tracking-wide">🔄 確定要重設此病患的臨床場景？</h3>
                  <p className="text-[9px] text-amber-100 uppercase font-mono tracking-tight">Taiwan General Hospital HIS Simulation Controller</p>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="text-xs text-slate-600 leading-relaxed font-sans">
                  確定要重設病患 <span className="font-bold text-slate-900">【{patient.name}】</span>的演練情境嗎？此操作將會：
                  <ul className="list-disc pl-4 mt-2 space-y-1 text-[11px] text-slate-500">
                    <li>清空所有在本次演練中開立的<span className="font-semibold text-slate-700">抽血檢驗 (CBC, DC, 生化, 血氣)</span></li>
                    <li>清空所有在本次演練中開立的<span className="font-semibold text-slate-700">影像檢查 (CT)</span></li>
                    <li>清空所有開立的藥物處方</li>
                    <li>還原至該病患的初始住院病歷狀態</li>
                  </ul>
                </div>

                <div className="flex gap-2 pt-2 text-xs font-bold font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setPatientIdPendingReset(null);
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer border border-slate-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleResetScenario(patientIdPendingReset, true);
                      setPatientIdPendingReset(null);
                    }}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition-colors shadow-md text-center"
                  >
                    確認一鍵重設
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Blood Draw Order Submitted Popup Alert Modal */}
      {showBloodDrawAlertModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-[10000] animate-fade-in" id="blood-draw-alert-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-blue-200 max-w-md w-full mx-4 overflow-hidden transform transition-all duration-200">
            {/* Modal Header */}
            <div className="bg-[#00824F] p-4 text-white flex items-center gap-2.5">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <BellRing className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-xs tracking-wide">📢 檢驗醫囑傳送通知</h3>
                <p className="text-[9px] text-emerald-100 uppercase font-mono">Taiwan General Hospital Laboratory</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-3">
              <div className="text-xs text-slate-700 leading-relaxed font-sans space-y-2">
                <p className="font-bold text-[#00824F] text-sm">🧪 抽血檢驗醫囑送出成功！</p>
                <p>
                  您已成功開立並傳送抽血檢驗項目。
                </p>
                <p className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg font-medium text-[11px] leading-relaxed">
                  💡 配合臨床急救與檢驗分析流程，此項目之檢驗結果（含常規血球 CBC、白血球分類 DC、核心生化 BIO、動脈血氣 ABG）將會需要<strong>完整倒數計時 9 分鐘</strong>進行實驗室精密分析，完成後自動呈現結果。在此期間不支援快速出來，請耐心等候！
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-150 flex justify-end">
              <button
                type="button"
                onClick={() => setShowBloodDrawAlertModal(false)}
                className="bg-[#00824F] hover:bg-[#007043] text-white text-[11px] font-bold px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Exam Activity Log Export Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-[9999] animate-fade-in" id="activity-log-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full mx-4 overflow-hidden transform transition-all duration-200 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 p-4.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm tracking-wide">📊 臨床模擬學習歷程與操作記錄 (Activity Log)</h3>
                  <p className="text-[10px] text-slate-400">系統自動記錄學生在 15 分鐘模擬期間的完整操作歷程</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 transition-colors pointer-events-auto cursor-pointer"
                title="關閉"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-xs space-y-2 text-slate-700 font-sans">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 border-b border-slate-200 pb-2">
                  <div>
                    模擬狀態：
                    <span className={`font-bold ${examTimerActive ? 'text-emerald-600 animate-pulse' : 'text-slate-500'}`}>
                      {examTimerActive ? '⏱️ 進行中' : '⏹️ 已結束'}
                    </span>
                  </div>
                  <div>
                    剩餘時間：
                    <span className="font-mono font-bold text-slate-900">
                      {Math.floor(examTimeRemaining / 60).toString().padStart(2, '0')}:{(examTimeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div>
                    總記錄筆數：
                    <span className="font-mono font-bold text-slate-900">{examLog.length} 筆</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                  💡 這份歷程記錄包含您開立的抽血檢驗、影像檢查、藥物處置，以及查看各個病歷分頁的行為。您可以複製或匯出此記錄，作為教研學習成效評估之用。
                </p>
              </div>

              {/* Log Table / List */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 text-slate-700 font-bold text-xs grid grid-cols-12 gap-2 border-b border-slate-200">
                  <div className="col-span-2 text-center font-sans">系統時間</div>
                  <div className="col-span-2 text-center font-sans">剩餘時間</div>
                  <div className="col-span-3 text-left font-sans">病患床位/名稱</div>
                  <div className="col-span-5 text-left font-sans">操作動作與細節</div>
                </div>

                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto font-mono text-xs">
                  {examLog.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 italic font-sans">
                      目前尚無任何操作記錄。請啟動計時器並進行病歷查閱或醫囑開立。
                    </div>
                  ) : (
                    examLog.map((log) => (
                      <div key={log.id} className="px-3 py-2 grid grid-cols-12 gap-2 hover:bg-slate-50 items-center">
                        <div className="col-span-2 text-slate-400 text-center text-[11px]">{log.timestamp}</div>
                        <div className="col-span-2 text-amber-600 font-bold text-center text-[11px]">{log.timerTime}</div>
                        <div className="col-span-3 text-slate-700 text-left font-sans font-medium truncate" title={log.patientName}>
                          {log.patientName ? log.patientName : '系統公用'}
                        </div>
                        <div className="col-span-5 text-slate-800 text-left font-sans text-[11.5px] leading-relaxed">{log.action}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[10px] text-slate-500 font-sans">
                模擬測驗時間：15分鐘臨床實操歷程
              </div>
              <div className="flex items-center gap-2 text-xs font-bold font-sans">
                <button
                  type="button"
                  onClick={() => {
                    // Export as TXT file download
                    const logHeader = `==================================================\n`;
                    const logTitle  = `      泰萬綜合醫院 HIS 臨床模擬學習歷程記錄\n`;
                    const logMeta   = `  模擬狀態: ${examTimerActive ? '進行中' : '已結束'} | 剩餘時間: ${Math.floor(examTimeRemaining / 60).toString().padStart(2, '0')}:${(examTimeRemaining % 60).toString().padStart(2, '0')} | 總記錄筆數: ${examLog.length} 筆\n`;
                    const logTime   = `  導出時間: ${new Date().toLocaleString('zh-TW')}\n`;
                    const logSep    = `--------------------------------------------------\n`;
                    const logTableH = `[系統時間]   [倒數時間]   [病患對象]         [操作歷程細節]\n`;
                    
                    let logBody = '';
                    [...examLog].reverse().forEach(log => {
                      const tSys = log.timestamp.padEnd(10);
                      const tRem = log.timerTime.padEnd(10);
                      const tPat = (log.patientName || '系統').padEnd(16);
                      const tAct = log.action;
                      logBody += `${tSys}   ${tRem}   ${tPat}   ${tAct}\n`;
                    });

                    const fullTxt = logHeader + logTitle + logMeta + logTime + logHeader + logTableH + logSep + logBody + logHeader;
                    
                    const blob = new Blob([fullTxt], { type: 'text/plain;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `Clinical_Simulation_Activity_Log_${new Date().toISOString().slice(0,10)}.txt`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    setToasts(prev => [...prev, {
                      id: `toast-export-${Date.now()}`,
                      message: '📥 學習歷程 .txt 檔案匯出並下載成功！',
                      type: 'success'
                    }]);
                    triggerAudioNotify();
                  }}
                  disabled={examLog.length === 0}
                  className="bg-[#00824F] hover:bg-[#007043] disabled:bg-slate-350 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
                >
                  📥 匯出 TXT 檔
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Copy to clipboard
                    let copyText = `泰萬綜合醫院 HIS 臨床模擬學習歷程記錄\n導出時間: ${new Date().toLocaleString('zh-TW')}\n\n`;
                    [...examLog].reverse().forEach((log, index) => {
                      copyText += `[${index + 1}] 系統時間:${log.timestamp} | 倒數:${log.timerTime} | 病患:${log.patientName || '系統'} -> ${log.action}\n`;
                    });
                    
                    navigator.clipboard.writeText(copyText).then(() => {
                      setToasts(prev => [...prev, {
                        id: `toast-copy-${Date.now()}`,
                        message: '📋 歷程記錄已成功複製到剪貼簿！',
                        type: 'success'
                      }]);
                      triggerAudioNotify();
                    });
                  }}
                  disabled={examLog.length === 0}
                  className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-350 disabled:cursor-not-allowed text-slate-700 px-4 py-2 rounded-lg cursor-pointer transition-colors border border-slate-250 flex items-center gap-1.5"
                >
                  📋 複製歷程
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg cursor-pointer transition-colors border border-slate-200"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Backstage Upload Modal */}
      {showAdminModal && (
        <AdminBackstageModal
          patients={patients}
          activePatientId={activePatientId}
          onClose={() => setShowAdminModal(false)}
          onUpdatePatient={handleUpdatePatient}
        />
      )}
    </div>
  );
}
