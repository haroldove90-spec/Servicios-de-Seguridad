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
  OperationType,
  Residencia,
  Residente,
  Caseta
} from '../types';
import { supabase } from '../supabase';

// Storage keys for the high-performance LocalStorage engine fallback
const LS_USERS_KEY = 'qr_authorized_users';
const LS_LOGS_KEY = 'qr_access_logs';
const LS_ROLES_KEY = 'qr_system_roles';
const LS_RESIDENCIAS_KEY = 'qr_residencias';
const LS_RESIDENTES_KEY = 'qr_residentes';
const LS_CASETAS_KEY = 'qr_casetas';

// Simple unique string generator
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Key normalization helpers to map both camelCase and snake_case properties robustly
export function normalizeUserRow(raw: any): AuthorizedUser {
  if (!raw) return raw;
  return {
    id: raw.id,
    name: raw.name,
    documentId: raw.documentId ?? raw.document_id ?? raw.documentid,
    email: raw.email,
    phone: raw.phone,
    status: raw.status,
    qrcodeToken: raw.qrcodeToken ?? raw.qrcode_token ?? raw.qrcodetoken ?? raw.qr_token,
    oneTime: raw.oneTime ?? raw.one_time ?? raw.onetime ?? false,
    used: raw.used ?? false,
    validFrom: raw.validFrom ?? raw.valid_from ?? raw.validfrom,
    validUntil: raw.validUntil ?? raw.valid_until ?? raw.validuntil,
    days: raw.days ?? [],
    startTime: raw.startTime ?? raw.start_time ?? raw.starttime,
    endTime: raw.endTime ?? raw.end_time ?? raw.endtime,
    createdAt: raw.createdAt ?? raw.created_at ?? raw.createdat,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? raw.updatedat,
    createdBy: raw.createdBy ?? raw.created_by ?? raw.createdby,
    residenciaId: raw.residenciaId ?? raw.residencia_id ?? raw.residenciaid,
    residenciaNombre: raw.residenciaNombre ?? raw.residencia_nombre ?? raw.residencianombre,
    isResidentCreated: raw.isResidentCreated ?? raw.is_resident_created ?? raw.isresidentcreated,
    residentName: raw.residentName ?? raw.resident_name ?? raw.residentname,
    residentPhone: raw.residentPhone ?? raw.resident_phone ?? raw.residentphone
  };
}

export function normalizeResidentRow(raw: any): Residente {
  if (!raw) return raw;
  return {
    id: raw.id,
    nombre: raw.nombre,
    residenciaId: raw.residenciaId ?? raw.residencia_id ?? raw.residenciaid,
    residenciaNombre: raw.residenciaNombre ?? raw.residencia_nombre ?? raw.residencianombre,
    direccion: raw.direccion,
    qrcodeToken: raw.qrcodeToken ?? raw.qrcode_token ?? raw.qrcodetoken ?? raw.qr_token,
    whatsapp: raw.whatsapp,
    accessUserId: raw.accessUserId ?? raw.access_user_id ?? raw.accessuserid,
    validUntil: raw.validUntil ?? raw.valid_until ?? raw.validuntil,
    createdAt: raw.createdAt ?? raw.created_at ?? raw.createdat,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? raw.updatedat
  };
}

export function normalizeLogRow(raw: any): AccessLog {
  if (!raw) return raw;
  return {
    id: raw.id,
    userId: raw.userId ?? raw.user_id ?? raw.userid,
    userName: raw.userName ?? raw.user_name ?? raw.username,
    documentId: raw.documentId ?? raw.document_id ?? raw.documentid,
    timestamp: raw.timestamp,
    type: raw.type,
    status: raw.status,
    guardId: raw.guardId ?? raw.guard_id ?? raw.guardid,
    guardName: raw.guardName ?? raw.guard_name ?? raw.guardname
  };
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
        },
        {
          id: 'usr-resd-demo-1',
          name: 'Mariana Sosa (Residente)',
          documentId: 'RESID-LOM-CALLE-ROBLE-#14',
          email: 'residente@local.casa',
          phone: '+525512345678',
          status: UserStatus.ACTIVE,
          qrcodeToken: 'residente_mariana_token',
          oneTime: false,
          used: false,
          validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          days: [], // all days
          startTime: '00:00',
          endTime: '23:59',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin-auto',
          residenciaId: 'res-demo-1',
          residenciaNombre: 'Lomas de Chapultepec'
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
          username: 'admin',
          role: SystemUserRole.ADMIN,
          isActive: true,
          password: 'Admin_123',
          createdAt: new Date().toISOString(),
        },
        {
          uid: 'guard-demo-uid',
          name: 'Guardia Pérez',
          email: 'guardia@seguridad.local',
          username: 'guardia',
          role: SystemUserRole.SUPERVISOR, // set as supervisor for caseta
          isActive: true,
          password: 'Caseta_123',
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
  },

  getResidencias(): Residencia[] {
    const data = localStorage.getItem(LS_RESIDENCIAS_KEY);
    if (!data) {
      const demoResidencias: Residencia[] = [
        {
          id: 'res-demo-1',
          nombre: 'Lomas de Chapultepec',
          administrador: 'Ing. Alejandro Ruiz',
          numResidencias: 120,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'res-demo-2',
          nombre: 'Residencial Cumbres',
          administrador: 'Lic. Martha Gómez',
          numResidencias: 85,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      localStorage.setItem(LS_RESIDENCIAS_KEY, JSON.stringify(demoResidencias));
      return demoResidencias;
    }
    return JSON.parse(data);
  },

  saveResidencias(residencias: Residencia[]) {
    localStorage.setItem(LS_RESIDENCIAS_KEY, JSON.stringify(residencias));
  },

  getResidentes(): Residente[] {
    const data = localStorage.getItem(LS_RESIDENTES_KEY);
    if (!data) {
      const demoResidentes: Residente[] = [
        {
          id: 'resd-demo-1',
          nombre: 'Mariana Sosa',
          residenciaId: 'res-demo-1',
          residenciaNombre: 'Lomas de Chapultepec',
          direccion: 'Calle Roble #14',
          qrcodeToken: 'residente_mariana_token',
          whatsapp: '+525512345678',
          accessUserId: 'usr-resd-demo-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      localStorage.setItem(LS_RESIDENTES_KEY, JSON.stringify(demoResidentes));
      return demoResidentes;
    }
    return JSON.parse(data);
  },

  saveResidentes(residentes: Residente[]) {
    localStorage.setItem(LS_RESIDENTES_KEY, JSON.stringify(residentes));
  },

  getCasetas(): Caseta[] {
    const data = localStorage.getItem(LS_CASETAS_KEY);
    if (!data) {
      const demoCasetas: Caseta[] = [
        {
          id: 'cas-demo-1',
          nombre: 'Caseta Principal Norte',
          residenciaId: 'res-demo-1',
          residenciaNombre: 'Lomas de Chapultepec',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cas-demo-2',
          nombre: 'Caseta Sur - Acceso 2',
          residenciaId: 'res-demo-1',
          residenciaNombre: 'Lomas de Chapultepec',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      localStorage.setItem(LS_CASETAS_KEY, JSON.stringify(demoCasetas));
      return demoCasetas;
    }
    return JSON.parse(data);
  },

  saveCasetas(casetas: Caseta[]) {
    localStorage.setItem(LS_CASETAS_KEY, JSON.stringify(casetas));
  }
};

// ----------------------------------------------------
// UNIFIED DB SERVICE (SUPABASE-FIRST WITH LOCAL FALLBACK)
// ----------------------------------------------------
export const dbService = {

  // --------------------------------------------------
  // System Roles Management (RBAC)
  // --------------------------------------------------
  async getSystemRole(uid: string): Promise<SystemRole | null> {
    try {
      const { data, error } = await supabase
        .from('system_roles')
        .select('*')
        .eq('uid', uid)
        .maybeSingle();

      if (!error && data) {
        return data as SystemRole;
      }
      if (error) {
        console.warn('Supabase getSystemRole returned query error. Code:', error.code, 'Msg:', error.message);
      }
    } catch (err) {
      console.warn('Supabase getSystemRole critical exception, using fallback:', err);
    }

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
    try {
      const { error } = await supabase
        .from('system_roles')
        .upsert(role);

      if (!error) {
        return;
      }
      console.warn('Supabase saveSystemRole returned query error. Code:', error.code, 'Msg:', error.message);
    } catch (err) {
      console.warn('Supabase saveSystemRole critical exception, using fallback:', err);
    }

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
    try {
      const { data, error } = await supabase
        .from('system_roles')
        .select('*')
        .order('createdAt', { ascending: false });

      if (!error && data) {
        return data as SystemRole[];
      }
      if (error) {
        console.warn('Supabase getAllSystemRoles returned query error. Code:', error.code, 'Msg:', error.message);
      }
    } catch (err) {
      console.warn('Supabase getAllSystemRoles critical exception, using fallback:', err);
    }

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
    try {
      const { error } = await supabase
        .from('system_roles')
        .delete()
        .eq('uid', uid);

      if (!error) {
        return;
      }
      console.warn('Supabase deleteSystemRole returned query error. Code:', error.code, 'Msg:', error.message);
    } catch (err) {
      console.warn('Supabase deleteSystemRole critical exception, using fallback:', err);
    }

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
    let remoteUsers: AuthorizedUser[] = [];
    let success = false;

    try {
      const { data, error } = await supabase
        .from('authorized_users')
        .select('*')
        .order('createdAt', { ascending: false });

      if (!error && data) {
        remoteUsers = (data as any[]).map(normalizeUserRow);
        success = true;
      } else if (error) {
        console.warn('Supabase getAuthorizedUsers query warning. Code:', error.code, 'Msg:', error.message);
      }
    } catch (err) {
      console.warn('Supabase getAuthorizedUsers critical exception, using local fallbacks:', err);
    }

    if (!success && !IS_FIREBASE_DUMMY) {
      try {
        const colRef = collection(db, 'authorized_users');
        const q = query(colRef, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const results: AuthorizedUser[] = [];
        snap.forEach(d => {
          results.push(d.data() as AuthorizedUser);
        });
        remoteUsers = results;
        success = true;
      } catch (err) {
        console.warn('Firestore getAuthorizedUsers failed, using local fallbacks:', err);
      }
    }

    const localUsers = LocalDB.getUsers();
    if (!success && remoteUsers.length === 0) {
      return localUsers;
    }

    // Unify both sets of records without duplicate keys, prioritizing latest updates
    const unifiedMap = new Map<string, AuthorizedUser>();
    localUsers.forEach(u => unifiedMap.set(u.id, u));
    remoteUsers.forEach(u => unifiedMap.set(u.id, u));

    return Array.from(unifiedMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAuthorizedUserByToken(token: string): Promise<AuthorizedUser | null> {
    if (!token) return null;
    const tokenClean = token.trim();
    
    // 1. Direct query from Supabase using possible column names or lowercases
    try {
      const { data, error } = await supabase
        .from('authorized_users')
        .select('*');

      if (!error && data) {
        const mapped = (data as any[]).map(normalizeUserRow);
        const found = mapped.find(u => 
          u.qrcodeToken?.trim() === tokenClean || 
          u.qrcodeToken?.trim().toLowerCase() === tokenClean.toLowerCase()
        );
        if (found) {
          console.log('Found authorized user by token directly in Supabase using scan find:', found.name);
          return found;
        }
      }
    } catch (err) {
      console.warn('getAuthorizedUserByToken direct Supabase exception:', err);
    }

    // 2. Direct lookup from local storage
    const localUsers = LocalDB.getUsers();
    const foundLocal = localUsers.find(u => 
      u.qrcodeToken?.trim() === tokenClean || 
      u.qrcodeToken?.trim().toLowerCase() === tokenClean.toLowerCase()
    );
    if (foundLocal) {
      return foundLocal;
    }

    // 3. Fallback to Firebase
    if (!IS_FIREBASE_DUMMY) {
      try {
        const colRef = collection(db, 'authorized_users');
        const q = query(colRef, where('qrcodeToken', '==', tokenClean));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs[0].data() as AuthorizedUser;
        }
      } catch (err) {
        console.warn('getAuthorizedUserByToken direct Firestore exception:', err);
      }
    }

    return null;
  },

  async createAuthorizedUser(user: Omit<AuthorizedUser, 'id'>): Promise<AuthorizedUser> {
    const id = 'usr_' + generateId();
    const newUser: AuthorizedUser = { ...user, id };

    // 1. Always assure local persistence first for robust real-time feedback
    const users = LocalDB.getUsers();
    users.unshift(newUser);
    LocalDB.saveUsers(users);

    // 2. Propagate to Supabase as primary cloud store
    try {
      const { error } = await supabase
        .from('authorized_users')
        .insert(newUser);

      if (!error) {
        return newUser;
      }
      console.warn('Supabase createAuthorizedUser returned query error. Code:', error.code, 'Msg:', error.message);

      // If error is code 42703 (undefined_column), retry by filtering out newer columns
      if (error.code === '42703' || (error.message && error.message.includes('column'))) {
        console.log('Detected undefined_column error on Supabase, retrying with core columns...');
        const coreUser = {
          id: newUser.id,
          name: newUser.name,
          documentId: newUser.documentId,
          email: newUser.email,
          phone: newUser.phone,
          status: newUser.status,
          qrcodeToken: newUser.qrcodeToken,
          oneTime: newUser.oneTime,
          used: newUser.used,
          validFrom: newUser.validFrom,
          validUntil: newUser.validUntil,
          days: newUser.days,
          startTime: newUser.startTime,
          endTime: newUser.endTime,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
          createdBy: newUser.createdBy
        };
        const { error: retryError } = await supabase
          .from('authorized_users')
          .insert(coreUser);

        if (!retryError) {
          console.log('Supabase retry succeeded with core columns!');
          return newUser;
        }
        console.warn('Supabase core columns insertion also failed:', retryError.message);
      }
    } catch (err) {
      console.warn('Supabase createAuthorizedUser exception, relying on local sync:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      return newUser;
    }

    // 3. Propagate to Firebase as auxiliary cloud store
    try {
      const docRef = doc(db, 'authorized_users', id);
      await setDoc(docRef, newUser);
      return newUser;
    } catch (err) {
      console.warn('Firestore setDoc failed, proceeding with local synchronized status:', err);
      return newUser;
    }
  },

  async updateAuthorizedUser(id: string, updates: Partial<AuthorizedUser>): Promise<void> {
    // 1. Always apply to local state instantly
    const users = LocalDB.getUsers();
    const updated = users.map(u => {
      if (u.id === id) {
        return { ...u, ...updates, updatedAt: new Date().toISOString() };
      }
      return u;
    });
    LocalDB.saveUsers(updated);

    // 2. Propagate to Supabase
    try {
      const { error } = await supabase
        .from('authorized_users')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.warn('Supabase updateAuthorizedUser returned query error. Code:', error.code, 'Msg:', error.message);
        if (error.code === '42703' || (error.message && error.message.includes('column'))) {
          console.log('Detected undefined_column error on Supabase update, filtering and retrying...');
          const { isResidentCreated, residentName, residentPhone, residenciaId, residenciaNombre, ...coreUpdates } = updates as any;
          const { error: retryError } = await supabase
            .from('authorized_users')
            .update({ ...coreUpdates, updatedAt: new Date().toISOString() })
            .eq('id', id);

          if (retryError) {
            console.warn('Supabase core updates update also failed:', retryError.message);
          } else {
            console.log('Supabase update retry succeeded with core columns!');
          }
        }
      }
    } catch (err) {
      console.warn('Supabase updateAuthorizedUser exception, using fallback sync:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      return;
    }

    // 3. Propagate to Firestore
    try {
      const docRef = doc(db, 'authorized_users', id);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn('Firestore updateDoc failed, relying on local synchronized state:', err);
    }
  },

  async deleteAuthorizedUser(id: string): Promise<void> {
    // 1. Delete locally
    const users = LocalDB.getUsers();
    const filtered = users.filter(u => u.id !== id);
    LocalDB.saveUsers(filtered);

    // 2. Delete from Supabase
    try {
      await supabase
        .from('authorized_users')
        .delete()
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteAuthorizedUser exception:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      return;
    }

    // 3. Delete from Firestore
    try {
      const docRef = doc(db, 'authorized_users', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteDoc exception:', err);
    }
  },

  // --------------------------------------------------
  // Access Logs Management (Check-in / Check-out Audits)
  // --------------------------------------------------
  async getAccessLogs(): Promise<AccessLog[]> {
    try {
      const { data, error } = await supabase
        .from('access_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (!error && data) {
        return (data as any[]).map(normalizeLogRow);
      }
      if (error) {
        console.warn('Supabase getAccessLogs returned query error. Code:', error.code, 'Msg:', error.message);
      }
    } catch (err) {
      console.warn('Supabase getAccessLogs exception, using fallback:', err);
    }

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

    try {
      const { error } = await supabase
        .from('access_logs')
        .insert(newLog);

      if (!error) {
        return newLog;
      }
      console.warn('Supabase createAccessLog returned query error. Code:', error.code, 'Msg:', error.message);
    } catch (err) {
      console.warn('Supabase createAccessLog exception, using fallback:', err);
    }

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
  },

  async deleteAccessLog(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('access_logs')
        .delete()
        .eq('id', id);

      if (!error) {
        return;
      }
      console.warn('Supabase deleteAccessLog returned query error. Code:', error.code, 'Msg:', error.message);
    } catch (err) {
      console.warn('Supabase deleteAccessLog exception, using fallback:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      const logs = LocalDB.getLogs();
      const filtered = logs.filter(l => l.id !== id);
      LocalDB.saveLogs(filtered);
      return;
    }

    try {
      const docRef = doc(db, 'access_logs', id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `access_logs/${id}`);
    }
  },

  // --------------------------------------------------
  // Residencias Management CRUD
  // --------------------------------------------------
  async getResidencias(): Promise<Residencia[]> {
    try {
      const { data, error } = await supabase
        .from('residencias')
        .select('*')
        .order('createdAt', { ascending: false });

      if (!error && data) {
        return data as Residencia[];
      }
      if (error) {
        console.warn('Supabase getResidencias returned query error. Code:', error.code, 'Msg:', error.message);
      }
    } catch (err) {
      console.warn('Supabase getResidencias exception, using fallback:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      return LocalDB.getResidencias();
    }

    try {
      const colRef = collection(db, 'residencias');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const results: Residencia[] = [];
      snap.forEach(d => {
        results.push(d.data() as Residencia);
      });
      return results;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'residencias');
      return [];
    }
  },

  async createResidencia(residencia: Omit<Residencia, 'id'>): Promise<Residencia> {
    const id = 'res_' + generateId();
    const newResidencia: Residencia = { ...residencia, id };

    try {
      const { error } = await supabase
        .from('residencias')
        .insert(newResidencia);

      if (!error) {
        return newResidencia;
      }
      console.warn('Supabase createResidencia returned query error. Code:', error.code, 'Msg:', error.message);
    } catch (err) {
      console.warn('Supabase createResidencia exception, using fallback:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      const list = LocalDB.getResidencias();
      list.unshift(newResidencia);
      LocalDB.saveResidencias(list);
      return newResidencia;
    }

    try {
      const docRef = doc(db, 'residencias', id);
      await setDoc(docRef, newResidencia);
      return newResidencia;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `residencias/${id}`);
      throw err;
    }
  },

  async updateResidencia(id: string, updates: Partial<Residencia>): Promise<void> {
    try {
      const { error } = await supabase
        .from('residencias')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id);

      if (!error) {
        return;
      }
      console.warn('Supabase updateResidencia returned query error. Code:', error.code, 'Msg:', error.message);
    } catch (err) {
      console.warn('Supabase updateResidencia exception, using fallback:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      const list = LocalDB.getResidencias();
      const updated = list.map(item => {
        if (item.id === id) {
          return { ...item, ...updates, updatedAt: new Date().toISOString() };
        }
        return item;
      });
      LocalDB.saveResidencias(updated);
      return;
    }

    try {
      const docRef = doc(db, 'residencias', id);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `residencias/${id}`);
    }
  },

  async deleteResidencia(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('residencias')
        .delete()
        .eq('id', id);

      if (!error) {
        return;
      }
      console.warn('Supabase deleteResidencia returned query error. Code:', error.code, 'Msg:', error.message);
    } catch (err) {
      console.warn('Supabase deleteResidencia exception, using fallback:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      const list = LocalDB.getResidencias();
      const filtered = list.filter(item => item.id !== id);
      LocalDB.saveResidencias(filtered);
      return;
    }

    try {
      const docRef = doc(db, 'residencias', id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `residencias/${id}`);
    }
  },

  // --------------------------------------------------
  // Residentes Management CRUD
  // --------------------------------------------------
  async getResidentes(): Promise<Residente[]> {
    try {
      const { data, error } = await supabase
        .from('residentes')
        .select('*')
        .order('createdAt', { ascending: false });

      if (!error && data) {
        return (data as any[]).map(normalizeResidentRow);
      }
      if (error) {
        console.warn('Supabase getResidentes returned query error. Code:', error.code, 'Msg:', error.message);
      }
    } catch (err) {
      console.warn('Supabase getResidentes exception, using fallback:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      return LocalDB.getResidentes();
    }

    try {
      const colRef = collection(db, 'residentes');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const results: Residente[] = [];
      snap.forEach(d => {
        results.push(d.data() as Residente);
      });
      return results;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'residentes');
      return [];
    }
  },

  async getResidenteByToken(token: string): Promise<Residente | null> {
    if (!token) return null;
    const tokenClean = token.trim();

    // 1. Direct query from Supabase with possible uppercase/lowercase normalization
    try {
      const { data, error } = await supabase
        .from('residentes')
        .select('*');

      if (!error && data) {
        const mapped = (data as any[]).map(normalizeResidentRow);
        const found = mapped.find(r => 
          r.qrcodeToken?.trim() === tokenClean || 
          r.qrcodeToken?.trim().toLowerCase() === tokenClean.toLowerCase()
        );
        if (found) {
          console.log('Found resident by token directly in Supabase using scan find:', found.nombre);
          return found;
        }
      }
    } catch (err) {
      console.warn('getResidenteByToken direct Supabase exception:', err);
    }

    // 2. Direct lookup from local storage
    const localResidents = LocalDB.getResidentes();
    const foundLocal = localResidents.find(r => 
      r.qrcodeToken?.trim() === tokenClean || 
      r.qrcodeToken?.trim().toLowerCase() === tokenClean.toLowerCase()
    );
    if (foundLocal) {
      return foundLocal;
    }

    // 3. Fallback to Firebase
    if (!IS_FIREBASE_DUMMY) {
      try {
        const colRef = collection(db, 'residentes');
        const q = query(colRef, where('qrcodeToken', '==', tokenClean));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs[0].data() as Residente;
        }
      } catch (err) {
        console.warn('getResidenteByToken direct Firestore exception:', err);
      }
    }

    return null;
  },

  async createResidente(residente: Omit<Residente, 'id'>): Promise<Residente> {
    const id = 'resd_' + generateId();
    const newResidente: Residente = { ...residente, id };

    try {
      const { error } = await supabase
        .from('residentes')
        .insert(newResidente);

      if (!error) {
        return newResidente;
      }
      console.warn('Supabase createResidente returned query error. Code:', error.code, 'Msg:', error.message);

      // If undefined_column error, retry without newer validUntil column
      if (error.code === '42703' || (error.message && error.message.includes('column'))) {
        console.log('Detected undefined_column error on Supabase residentes, retrying without validUntil...');
        const coreResidente = {
          id: newResidente.id,
          nombre: newResidente.nombre,
          residenciaId: newResidente.residenciaId,
          residenciaNombre: newResidente.residenciaNombre,
          direccion: newResidente.direccion,
          qrcodeToken: newResidente.qrcodeToken,
          whatsapp: newResidente.whatsapp,
          accessUserId: newResidente.accessUserId,
          createdAt: newResidente.createdAt,
          updatedAt: newResidente.updatedAt
        };
        const { error: retryError } = await supabase
          .from('residentes')
          .insert(coreResidente);

        if (!retryError) {
          console.log('Supabase residentes insertion retry succeeded!');
          return newResidente;
        }
        console.warn('Supabase core residentes insert failure:', retryError.message);
      }
    } catch (err) {
      console.warn('Supabase createResidente exception, using fallback:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      const list = LocalDB.getResidentes();
      list.unshift(newResidente);
      LocalDB.saveResidentes(list);
      return newResidente;
    }

    try {
      const docRef = doc(db, 'residentes', id);
      await setDoc(docRef, newResidente);
      return newResidente;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `residentes/${id}`);
      throw err;
    }
  },

  async updateResidente(id: string, updates: Partial<Residente>): Promise<void> {
    try {
      const { error } = await supabase
        .from('residentes')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.warn('Supabase updateResidente returned query error. Code:', error.code, 'Msg:', error.message);
        if (error.code === '42703' || (error.message && error.message.includes('column'))) {
          console.log('Detected undefined_column error on Supabase updateResidente, retrying without validUntil...');
          const { validUntil, ...coreUpdates } = updates;
          const { error: retryError } = await supabase
            .from('residentes')
            .update({ ...coreUpdates, updatedAt: new Date().toISOString() })
            .eq('id', id);

          if (retryError) {
            console.warn('Supabase core residentes update failed:', retryError.message);
          } else {
            console.log('Supabase updateResidente retry succeeded!');
          }
        }
      }
    } catch (err) {
      console.warn('Supabase updateResidente exception, using fallback:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      const list = LocalDB.getResidentes();
      const updated = list.map(item => {
        if (item.id === id) {
          return { ...item, ...updates, updatedAt: new Date().toISOString() };
        }
        return item;
      });
      LocalDB.saveResidentes(updated);
      return;
    }

    try {
      const docRef = doc(db, 'residentes', id);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `residentes/${id}`);
    }
  },

  async deleteResidente(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('residentes')
        .delete()
        .eq('id', id);

      if (!error) {
        return;
      }
      console.warn('Supabase deleteResidente returned query error. Code:', error.code, 'Msg:', error.message);
    } catch (err) {
      console.warn('Supabase deleteResidente exception, using fallback:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      const list = LocalDB.getResidentes();
      const filtered = list.filter(item => item.id !== id);
      LocalDB.saveResidentes(filtered);
      return;
    }

    try {
      const docRef = doc(db, 'residentes', id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `residentes/${id}`);
    }
  },

  // --------------------------------------------------
  // Casetas Management CRUD
  // --------------------------------------------------
  async getCasetas(): Promise<Caseta[]> {
    try {
      const { data, error } = await supabase
        .from('casetas')
        .select('*')
        .order('createdAt', { ascending: false });

      if (!error && data) {
        return data as Caseta[];
      }
      if (error) {
        console.warn('Supabase getCasetas returned query error. Code:', error.code, 'Msg:', error.message);
      }
    } catch (err) {
      console.warn('Supabase getCasetas exception, using fallback:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      return LocalDB.getCasetas();
    }

    try {
      const colRef = collection(db, 'casetas');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const results: Caseta[] = [];
      snap.forEach(d => {
        results.push(d.data() as Caseta);
      });
      return results;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'casetas');
      return [];
    }
  },

  async createCaseta(caseta: Omit<Caseta, 'id'>): Promise<Caseta> {
    const id = 'cas_' + generateId();
    const newCaseta: Caseta = { ...caseta, id };

    try {
      const { error } = await supabase
        .from('casetas')
        .insert(newCaseta);

      if (!error) {
        return newCaseta;
      }
      console.warn('Supabase createCaseta returned query error. Code:', error.code, 'Msg:', error.message);
    } catch (err) {
      console.warn('Supabase createCaseta exception, using fallback:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      const list = LocalDB.getCasetas();
      list.unshift(newCaseta);
      LocalDB.saveCasetas(list);
      return newCaseta;
    }

    try {
      const docRef = doc(db, 'casetas', id);
      await setDoc(docRef, newCaseta);
      return newCaseta;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `casetas/${id}`);
      throw err;
    }
  },

  async updateCaseta(id: string, updates: Partial<Caseta>): Promise<void> {
    try {
      const { error } = await supabase
        .from('casetas')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id);

      if (!error) {
        return;
      }
      console.warn('Supabase updateCaseta returned query error. Code:', error.code, 'Msg:', error.message);
    } catch (err) {
      console.warn('Supabase updateCaseta exception, using fallback:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      const list = LocalDB.getCasetas();
      const updated = list.map(item => {
        if (item.id === id) {
          return { ...item, ...updates, updatedAt: new Date().toISOString() };
        }
        return item;
      });
      LocalDB.saveCasetas(updated);
      return;
    }

    try {
      const docRef = doc(db, 'casetas', id);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `casetas/${id}`);
    }
  },

  async deleteCaseta(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('casetas')
        .delete()
        .eq('id', id);

      if (!error) {
        return;
      }
      console.warn('Supabase deleteCaseta returned query error. Code:', error.code, 'Msg:', error.message);
    } catch (err) {
      console.warn('Supabase deleteCaseta exception, using fallback:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      const list = LocalDB.getCasetas();
      const filtered = list.filter(item => item.id !== id);
      LocalDB.saveCasetas(filtered);
      return;
    }

    try {
      const docRef = doc(db, 'casetas', id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `casetas/${id}`);
    }
  }

};
