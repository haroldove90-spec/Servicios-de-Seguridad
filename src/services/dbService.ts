/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Firestore 
} from 'firebase/firestore';
import { db, auth, IS_FIREBASE_DUMMY, handleFirestoreError } from '../firebase';
import { 
  AuthorizedUser, 
  AccessLog, 
  SystemRole, 
  UserStatus, 
  SystemUserRole, 
  LogType, 
  LogStatus, 
  OperationType 
} from '../types';

// Storage keys for the high-performance LocalStorage engine fallback
const LS_USERS_KEY = 'qr_authorized_users';
const LS_LOGS_KEY = 'qr_access_logs';
const LS_ROLES_KEY = 'qr_system_roles';

// Simple unique string generator
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// ----------------------------------------------------
// LOCAL STORAGE ENGINE
// ----------------------------------------------------
const LocalDB = {
  getUsers(): AuthorizedUser[] {
    const data = localStorage.getItem(LS_USERS_KEY);
    if (!data) {
      // Seed some initial demo data to make the app look instantly alive
      const demoUsers: AuthorizedUser[] = [
        {
          id: 'user-demo-1',
          name: 'Carlos Mendoza',
          documentId: '12345678-A',
          email: 'carlos@ejemplo.com',
          phone: '+34 600 111 222',
          status: UserStatus.ACTIVE,
          qrcodeToken: 'token_carlos_mendoza_demo',
          oneTime: false,
          used: false,
          validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // started yesterday
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // expires in 30 days
          days: [1, 2, 3, 4, 5], // Monday to Friday
          startTime: '08:00',
          endTime: '20:00',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin-demo-uid',
        },
        {
          id: 'user-demo-2',
          name: 'Ana Silva (Pase Temprano)',
          documentId: '87654321-B',
          email: 'ana@ejemplo.com',
          phone: '+34 600 333 444',
          status: UserStatus.ACTIVE,
          qrcodeToken: 'token_ana_silva_demo',
          oneTime: true,
          used: false,
          validFrom: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // started 10m ago
          validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // expires in 2 hours
          days: [], // all days
          startTime: '07:00',
          endTime: '11:00',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin-demo-uid',
        },
        {
          id: 'user-demo-3',
          name: 'Ricardo Pérez (Expirado)',
          documentId: '45678912-C',
          email: 'ricardo@ejemplo.com',
          phone: '+34 611 222 333',
          status: UserStatus.EXPIRED,
          qrcodeToken: 'token_ricardo_expired_demo',
          oneTime: false,
          used: false,
          validFrom: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // expired yesterday
          days: [1, 2, 3, 4, 5],
          startTime: '08:00',
          endTime: '18:00',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin-demo-uid',
        }
      ];
      localStorage.setItem(LS_USERS_KEY, JSON.stringify(demoUsers));
      return demoUsers;
    }
    return JSON.parse(data);
  },

  saveUsers(users: AuthorizedUser[]) {
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
  },

  getLogs(): AccessLog[] {
    const data = localStorage.getItem(LS_LOGS_KEY);
    if (!data) {
      const demoLogs: AccessLog[] = [
        {
          id: 'log-demo-1',
          userId: 'user-demo-1',
          userName: 'Carlos Mendoza',
          documentId: '12345678-A',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          type: LogType.CHECK_IN,
          status: LogStatus.SUCCESS,
          guardId: 'guard-demo-uid',
          guardName: 'Guardia Pérez',
        },
        {
          id: 'log-demo-2',
          userId: 'user-demo-3',
          userName: 'Ricardo Pérez (Expirado)',
          documentId: '45678912-C',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          type: LogType.CHECK_IN,
          status: LogStatus.EXPIRED_TOKEN,
          guardId: 'guard-demo-uid',
          guardName: 'Guardia Pérez',
        },
        {
          id: 'log-demo-3',
          userId: 'user-demo-1',
          userName: 'Carlos Mendoza',
          documentId: '12345678-A',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          type: LogType.CHECK_OUT,
          status: LogStatus.SUCCESS,
          guardId: 'guard-demo-uid',
          guardName: 'Guardia Pérez',
        },
        {
          id: 'log-demo-4',
          userId: 'user-demo-2',
          userName: 'Ana Silva (Pase Temprano)',
          documentId: '87654321-B',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          type: LogType.CHECK_IN,
          status: LogStatus.SUCCESS,
          guardId: 'guard-demo-uid',
          guardName: 'Guardia Pérez',
        },
        {
          id: 'log-demo-5',
          userId: 'user-demo-2',
          userName: 'Ana Silva (Pase Temprano)',
          documentId: '87654321-B',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          type: LogType.CHECK_IN,
          status: LogStatus.ALREADY_USED,
          guardId: 'supervisor-demo-uid',
          guardName: 'Elena Rostova',
        },
        {
          id: 'log-demo-6',
          userId: 'unknown-uid-frap',
          userName: 'Intrusión Fuera de Horario-Test',
          documentId: '99887766-K',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          type: LogType.CHECK_IN,
          status: LogStatus.OUTSIDE_SCHEDULE,
          guardId: 'guard-demo-uid',
          guardName: 'Guardia Pérez',
        }
      ];
      localStorage.setItem(LS_LOGS_KEY, JSON.stringify(demoLogs));
      return demoLogs;
    }
    return JSON.parse(data);
  },

  saveLogs(logs: AccessLog[]) {
    localStorage.setItem(LS_LOGS_KEY, JSON.stringify(logs));
  },

  getRoles(): SystemRole[] {
    const data = localStorage.getItem(LS_ROLES_KEY);
    if (!data) {
      const demoRoles: SystemRole[] = [
        {
          uid: 'admin-demo-uid',
          name: 'Software AI Admin',
          email: 'softwareai569@gmail.com',
          role: SystemUserRole.ADMIN,
          createdAt: new Date().toISOString(),
        },
        {
          uid: 'guard-demo-uid',
          name: 'Guardia Pérez',
          email: 'guardia@seguridad.local',
          role: SystemUserRole.GUARD,
          createdAt: new Date().toISOString(),
        }
      ];
      localStorage.setItem(LS_ROLES_KEY, JSON.stringify(demoRoles));
      return demoRoles;
    }
    return JSON.parse(data);
  },

  saveRoles(roles: SystemRole[]) {
    localStorage.setItem(LS_ROLES_KEY, JSON.stringify(roles));
  }
};

// ----------------------------------------------------
// UNIFIED DB SERVICE
// ----------------------------------------------------
export const dbService = {

  // --------------------------------------------------
  // System Roles Management (RBAC)
  // --------------------------------------------------
  async getSystemRole(uid: string): Promise<SystemRole | null> {
    if (IS_FIREBASE_DUMMY) {
      const roles = LocalDB.getRoles();
      return roles.find(r => r.uid === uid) || null;
    }

    try {
      const docRef = doc(db, 'system_roles', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as SystemRole;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `system_roles/${uid}`);
      return null;
    }
  },

  async saveSystemRole(role: SystemRole): Promise<void> {
    if (IS_FIREBASE_DUMMY) {
      const roles = LocalDB.getRoles();
      const filtered = roles.filter(r => r.uid !== role.uid);
      filtered.push(role);
      LocalDB.saveRoles(filtered);
      return;
    }

    try {
      const docRef = doc(db, 'system_roles', role.uid);
      await setDoc(docRef, role);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `system_roles/${role.uid}`);
    }
  },

  async getAllSystemRoles(): Promise<SystemRole[]> {
    if (IS_FIREBASE_DUMMY) {
      return LocalDB.getRoles();
    }

    try {
      const colRef = collection(db, 'system_roles');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const results: SystemRole[] = [];
      snap.forEach(d => {
        results.push(d.data() as SystemRole);
      });
      return results;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'system_roles');
      return [];
    }
  },

  async deleteSystemRole(uid: string): Promise<void> {
    if (IS_FIREBASE_DUMMY) {
      const roles = LocalDB.getRoles();
      const filtered = roles.filter(r => r.uid !== uid);
      LocalDB.saveRoles(filtered);
      return;
    }

    try {
      const docRef = doc(db, 'system_roles', uid);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `system_roles/${uid}`);
    }
  },

  // --------------------------------------------------
  // Authorized Users CRUD (Visitors List)
  // --------------------------------------------------
  async getAuthorizedUsers(): Promise<AuthorizedUser[]> {
    if (IS_FIREBASE_DUMMY) {
      return LocalDB.getUsers();
    }

    try {
      const colRef = collection(db, 'authorized_users');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const results: AuthorizedUser[] = [];
      snap.forEach(d => {
        results.push(d.data() as AuthorizedUser);
      });
      return results;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'authorized_users');
      return [];
    }
  },

  async createAuthorizedUser(user: Omit<AuthorizedUser, 'id'>): Promise<AuthorizedUser> {
    const id = 'usr_' + generateId();
    const newUser: AuthorizedUser = { ...user, id };

    if (IS_FIREBASE_DUMMY) {
      const users = LocalDB.getUsers();
      users.unshift(newUser);
      LocalDB.saveUsers(users);
      return newUser;
    }

    try {
      const docRef = doc(db, 'authorized_users', id);
      await setDoc(docRef, newUser);
      return newUser;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `authorized_users/${id}`);
      throw err;
    }
  },

  async updateAuthorizedUser(id: string, updates: Partial<AuthorizedUser>): Promise<void> {
    if (IS_FIREBASE_DUMMY) {
      const users = LocalDB.getUsers();
      const updated = users.map(u => {
        if (u.id === id) {
          return { ...u, ...updates, updatedAt: new Date().toISOString() };
        }
        return u;
      });
      LocalDB.saveUsers(updated);
      return;
    }

    try {
      const docRef = doc(db, 'authorized_users', id);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `authorized_users/${id}`);
    }
  },

  async deleteAuthorizedUser(id: string): Promise<void> {
    if (IS_FIREBASE_DUMMY) {
      const users = LocalDB.getUsers();
      const filtered = users.filter(u => u.id !== id);
      LocalDB.saveUsers(filtered);
      return;
    }

    try {
      const docRef = doc(db, 'authorized_users', id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `authorized_users/${id}`);
    }
  },

  // --------------------------------------------------
  // Access Logs Management (Check-in / Check-out Audits)
  // --------------------------------------------------
  async getAccessLogs(): Promise<AccessLog[]> {
    if (IS_FIREBASE_DUMMY) {
      return LocalDB.getLogs().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    try {
      const colRef = collection(db, 'access_logs');
      const q = query(colRef, orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const results: AccessLog[] = [];
      snap.forEach(d => {
        results.push(d.data() as AccessLog);
      });
      return results;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'access_logs');
      return [];
    }
  },

  async createAccessLog(log: Omit<AccessLog, 'id'>): Promise<AccessLog> {
    const id = 'log_' + generateId();
    const newLog: AccessLog = { ...log, id };

    if (IS_FIREBASE_DUMMY) {
      const logs = LocalDB.getLogs();
      logs.unshift(newLog);
      LocalDB.saveLogs(logs);
      return newLog;
    }

    try {
      const docRef = doc(db, 'access_logs', id);
      await setDoc(docRef, newLog);
      return newLog;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `access_logs/${id}`);
      throw err;
    }
  }

};
