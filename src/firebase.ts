import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { Patient } from './types';
import { PRESET_PATIENTS } from './presetPatients';

import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID and robust offline/long-polling configuration
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    experimentalAutoDetectLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch {
  // Fallback if initializeFirestore was already called or in environments without indexedDb
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = dbInstance;

// Collection Reference
const patientsCol = collection(db, 'patients');

// Track if Firestore quota is exceeded or database is offline
let isFirestoreQuotaExceeded = false;

/**
 * Seed default patients if the collection is empty.
 * This ensures the application starts with default clinic profiles.
 */
export async function seedDefaultPatientsIfEmpty() {
  if (isFirestoreQuotaExceeded) return;
  try {
    const snapshot = await getDocs(patientsCol);
    if (snapshot.empty) {
      console.log('Firestore patients collection is empty. Seeding with preset patients...');
      const batch = writeBatch(db);
      PRESET_PATIENTS.forEach((patient) => {
        const docRef = doc(db, 'patients', patient.id);
        batch.set(docRef, patient);
      });
      await batch.commit();
      console.log('Firestore patients database successfully seeded!');
    } else {
      const existingIds = new Set(snapshot.docs.map(doc => doc.id));
      const missingPresets = PRESET_PATIENTS.filter(p => !existingIds.has(p.id));
      if (missingPresets.length > 0) {
        console.log('Seeding missing preset patients to Firestore:', missingPresets.map(p => p.name));
        const batch = writeBatch(db);
        missingPresets.forEach((patient) => {
          const docRef = doc(db, 'patients', patient.id);
          batch.set(docRef, patient, { merge: true });
        });
        await batch.commit();
        console.log('Firestore patients database updated with missing preset patients!');
      }
    }
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      isFirestoreQuotaExceeded = true;
      console.warn('Firestore write quota exceeded. Operating seamlessly in LocalStorage fallback mode.');
    } else if (error?.code === 'unavailable' || error?.message?.includes('could not be completed')) {
      console.info('Firestore is in offline mode or connecting; local storage active.');
    } else {
      console.warn('Firestore seed check notice (using local storage):', error?.message || error);
    }
  }
}

/**
 * Delete a patient document from Firestore
 */
export async function deletePatientFromFirestore(patientId: string) {
  if (isFirestoreQuotaExceeded) return;
  try {
    const docRef = doc(db, 'patients', patientId);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.warn(`Firestore delete notice for patient ${patientId}:`, error?.message || error);
  }
}

/**
 * Save or update a patient document in real-time
 */
export async function savePatientToFirestore(patient: Patient) {
  if (isFirestoreQuotaExceeded) return;
  try {
    const docRef = doc(db, 'patients', patient.id);
    await setDoc(docRef, patient, { merge: true });
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      isFirestoreQuotaExceeded = true;
      console.warn('Firestore write quota limit reached. Falling back gracefully to LocalStorage mode.');
    } else if (error?.code === 'unavailable') {
      console.info('Firestore offline write queued locally.');
    } else {
      console.warn(`Firestore save notice for patient ${patient.id}:`, error?.message || error);
    }
  }
}

/**
 * Subscribe to the patients collection in real-time.
 * Invokes callback whenever any database change occurs on any computer.
 */
export function subscribeToPatients(callback: (patients: Patient[]) => void) {
  try {
    return onSnapshot(patientsCol, (snapshot) => {
      const patientsList: Patient[] = [];
      snapshot.forEach((doc) => {
        patientsList.push(doc.data() as Patient);
      });
      
      // Sort patients so they remain in a stable order (e.g. by ID)
      patientsList.sort((a, b) => a.id.localeCompare(b.id));
      
      if (patientsList.length > 0) {
        callback(patientsList);
      }
    }, (error: any) => {
      if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
        isFirestoreQuotaExceeded = true;
        console.warn('Firestore real-time subscription quota exceeded. Using LocalStorage fallback.');
      } else if (error?.code === 'unavailable') {
        console.info('Firestore operates in offline/cached mode until network connects.');
      } else {
        console.warn('Firestore real-time subscription notice (using local storage fallback):', error?.message || error);
      }
    });
  } catch (e: any) {
    console.warn('Firestore listener initialization notice:', e?.message || e);
    return () => {};
  }
}

export interface ExamStateData {
  examTimerActive: boolean;
  startTimeMs: number | null;
  durationSec: number;
  examTimeRemaining: number;
  examLog: { id: string; timestamp: string; timerTime: string; patientName: string; action: string }[];
  updatedAt?: number;
}

const examStateDocRef = doc(db, 'system', 'examState');

/**
 * Save or update exam state document in real-time in Firestore
 */
export async function saveExamStateToFirestore(examState: Partial<ExamStateData>) {
  if (isFirestoreQuotaExceeded) return;
  try {
    await setDoc(examStateDocRef, { ...examState, updatedAt: Date.now() }, { merge: true });
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      isFirestoreQuotaExceeded = true;
    } else {
      console.warn('Firestore save notice for exam state:', error?.message || error);
    }
  }
}

/**
 * Subscribe to real-time updates for the system examState across all connected devices
 */
export function subscribeToExamState(callback: (examState: ExamStateData | null) => void) {
  try {
    return onSnapshot(examStateDocRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as ExamStateData);
      } else {
        callback(null);
      }
    }, (error: any) => {
      if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
        isFirestoreQuotaExceeded = true;
      } else {
        console.warn('Firestore real-time examState subscription notice:', error?.message || error);
      }
    });
  } catch (e: any) {
    console.warn('Firestore examState listener notice:', e?.message || e);
    return () => {};
  }
}

