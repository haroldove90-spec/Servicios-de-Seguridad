/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { OperationType, FirestoreErrorInfo } from './types';

// Detect whether we are running with the placeholder dummy key
export const IS_FIREBASE_DUMMY = firebaseConfig.apiKey === 'dummy-api-key' || firebaseConfig.apiKey === '';

let app;
let db: any = null;
let auth: any = null;

if (!IS_FIREBASE_DUMMY) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // CRITICAL: Access the exact database ID
    auth = getAuth(app);
  } catch (error) {
    console.warn('Firebase initialization failed, failing back to local storage engine.', error);
  }
}

export { db, auth };

/**
 * Handle Firestore errors exactly as guided, formatting failure vectors into strict JSON reports.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = auth;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid || null,
      email: currentAuth?.currentUser?.email || null,
      emailVerified: currentAuth?.currentUser?.emailVerified || null,
      isAnonymous: currentAuth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
