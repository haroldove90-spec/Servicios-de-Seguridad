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
  Caseta,
  Marbete,
  Evidencia,
  AlertaPanico
} from '../types';
import { supabase } from '../supabase';

// Storage keys for the high-performance LocalStorage engine fallback
const LS_USERS_KEY = 'qr_authorized_users';
const LS_LOGS_KEY = 'qr_access_logs';
const LS_ROLES_KEY = 'qr_system_roles';
const LS_RESIDENCIAS_KEY = 'qr_residencias';
const LS_RESIDENTES_KEY = 'qr_residentes';
const LS_CASETAS_KEY = 'qr_casetas';
const LS_MARBETES_KEY = 'qr_marbetes';
const LS_EVIDENCIAS_KEY = 'qr_evidencias';
const LS_ALERTAS_PANICO_KEY = 'qr_alertas_panico';

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
    username: raw.username ?? raw.user_name ?? raw.username,
    password: raw.password ?? raw.pass_word ?? raw.clave ?? raw.password,
    isActive: raw.isActive ?? raw.is_active ?? raw.isactive ?? raw.activo ?? true,
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
    guardName: raw.guardName ?? raw.guard_name ?? raw.guardname,
    residenciaId: raw.residenciaId ?? raw.residencia_id ?? raw.residenciaid,
    residenciaNombre: raw.residenciaNombre ?? raw.residencia_nombre ?? raw.residencianombre,
    casetaId: raw.casetaId ?? raw.caseta_id ?? raw.casetaid,
    casetaNombre: raw.casetaNombre ?? raw.caseta_nombre ?? raw.casetanombre
  };
}

export function normalizeMarbeteRow(raw: any): Marbete {
  if (!raw) return raw;
  return {
    id: raw.id,
    consecutivo: Number(raw.consecutivo ?? 0),
    residenteId: raw.residenteId ?? raw.residente_id ?? raw.residenteid,
    residenteNombre: raw.residenteNombre ?? raw.residente_nombre ?? raw.residentenombre,
    residenciaId: raw.residenciaId ?? raw.residencia_id ?? raw.residenciaid,
    residenciaNombre: raw.residenciaNombre ?? raw.residencia_nombre ?? raw.residencianombre,
    vehiculoPlacas: raw.vehiculoPlacas ?? raw.vehiculo_placas ?? raw.vehiculoplacas,
    vehiculoInfo: raw.vehiculoInfo ?? raw.vehiculo_info ?? raw.vehiculoinfo,
    qrcodeToken: raw.qrcodeToken ?? raw.qrcode_token ?? raw.qrcodetoken ?? raw.qr_token,
    validFrom: raw.validFrom ?? raw.valid_from ?? raw.validfrom,
    validUntil: raw.validUntil ?? raw.valid_until ?? raw.validuntil,
    status: raw.status ?? UserStatus.ACTIVE,
    createdAt: raw.createdAt ?? raw.created_at ?? raw.createdat,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? raw.updatedat
  };
}

export function normalizeEvidenciaRow(raw: any): Evidencia {
  if (!raw) return raw;
  return {
    id: raw.id,
    residenciaId: raw.residenciaId ?? raw.residencia_id ?? raw.residenciaid,
    residenciaNombre: raw.residenciaNombre ?? raw.residencia_nombre ?? raw.residencianombre,
    casetaId: raw.casetaId ?? raw.caseta_id ?? raw.casetaid,
    casetaNombre: raw.casetaNombre ?? raw.caseta_nombre ?? raw.casetanombre,
    guardId: raw.guardId ?? raw.guard_id ?? raw.guardid,
    guardName: raw.guardName ?? raw.guard_name ?? raw.guardname,
    photoUrl: raw.photoUrl ?? raw.photo_url ?? raw.photourl ?? raw.photo,
    placas: raw.placas,
    timestamp: raw.timestamp,
    notas: raw.notas,
    tipo: raw.tipo
  };
}

export function normalizeRoleRow(raw: any): SystemRole {
  if (!raw) return raw;
  let rawRole = raw.role ?? raw.rol ?? raw.user_role ?? raw.role_name ?? raw.tipo ?? SystemUserRole.RESIDENTE;
  if (typeof rawRole === 'string') {
    const cleanRole = rawRole.toLowerCase().trim();
    if (cleanRole === 'guardia' || cleanRole === 'vigilante' || cleanRole === 'caseta' || cleanRole === 'guard') {
      rawRole = SystemUserRole.SUPERVISOR;
    } else if (cleanRole === 'administrador' || cleanRole === 'director' || cleanRole === 'admin') {
      rawRole = SystemUserRole.ADMIN;
    } else if (cleanRole === 'condominio' || cleanRole === 'condominios') {
      rawRole = SystemUserRole.CONDOMINIOS;
    } else if (cleanRole === 'residente' || cleanRole === 'resident') {
      rawRole = SystemUserRole.RESIDENTE;
    } else if (cleanRole === 'auditor') {
      rawRole = SystemUserRole.AUDITOR;
    } else if (cleanRole === 'supervisor') {
      rawRole = SystemUserRole.SUPERVISOR;
    } else {
      rawRole = cleanRole;
    }
  }
  return {
    uid: raw.uid || raw.id,
    email: raw.email || '',
    name: raw.name || raw.nombre || '',
    role: rawRole as SystemUserRole,
    createdAt: raw.createdAt ?? raw.created_at ?? raw.createdat ?? new Date().toISOString(),
    phone: raw.phone ?? raw.telefono,
    password: raw.password,
    isActive: raw.isActive ?? raw.is_active ?? raw.isactive ?? true,
    residenciaId: raw.residenciaId ?? raw.residencia_id ?? raw.residenciaid,
    residenciaNombre: raw.residenciaNombre ?? raw.residencia_nombre ?? raw.residencianombre,
    casetaId: raw.casetaId ?? raw.caseta_id ?? raw.casetaid,
    casetaNombre: raw.casetaNombre ?? raw.caseta_nombre ?? raw.casetanombre,
    username: raw.username ?? raw.usuario,
    avatar: raw.avatar
  };
}

export function normalizeResidenciaRow(raw: any): Residencia {
  if (!raw) return raw;
  return {
    id: raw.id,
    nombre: raw.nombre,
    administrador: raw.administrador,
    numResidencias: Number(raw.numResidencias ?? raw.num_residencias ?? raw.numresidencias ?? 0),
    isActive: raw.isActive ?? raw.is_active ?? raw.isactive ?? true,
    createdAt: raw.createdAt ?? raw.created_at ?? raw.createdat,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? raw.updatedat,
    panicActive: raw.panicActive ?? raw.panic_active ?? raw.panicactive ?? false,
    panicLatitude: raw.panicLatitude !== undefined ? raw.panicLatitude : (raw.panic_latitude !== undefined ? raw.panic_latitude : (raw.paniclatitude !== undefined ? raw.paniclatitude : null)),
    panicLongitude: raw.panicLongitude !== undefined ? raw.panicLongitude : (raw.panic_longitude !== undefined ? raw.panic_longitude : (raw.paniclongitude !== undefined ? raw.paniclongitude : null)),
    panicTriggeredBy: raw.panicTriggeredBy ?? raw.panic_triggered_by ?? raw.panictriggeredby ?? null,
    panicTriggeredByRole: raw.panicTriggeredByRole ?? raw.panic_triggered_by_role ?? raw.panictriggeredbyrole ?? null,
    panicTriggeredAt: raw.panicTriggeredAt ?? raw.panic_triggered_at ?? raw.panictriggeredat ?? null
  };
}

export function normalizeAlertaPanicoRow(raw: any): AlertaPanico {
  if (!raw) return raw;
  return {
    id: raw.id,
    residenciaId: raw.residenciaId ?? raw.residencia_id ?? raw.residenciaid,
    residenciaNombre: raw.residenciaNombre ?? raw.residencia_nombre ?? raw.residencianombre,
    usuarioId: raw.usuarioId ?? raw.usuario_id ?? raw.usuarioid,
    usuarioNombre: raw.usuarioNombre ?? raw.usuario_nombre ?? raw.usuarionombre ?? 'Usuario',
    usuarioRole: raw.usuarioRole ?? raw.usuario_role ?? raw.usuariorole ?? 'residente',
    usuarioUsername: raw.usuarioUsername ?? raw.usuario_username ?? raw.usuariousername,
    usuarioPhone: raw.usuarioPhone ?? raw.usuario_phone ?? raw.usuariophone,
    usuarioEmail: raw.usuarioEmail ?? raw.usuario_email ?? raw.usuarioemail,
    direccion: raw.direccion,
    latitude: raw.latitude !== undefined && raw.latitude !== null ? Number(raw.latitude) : (raw.lat !== undefined && raw.lat !== null ? Number(raw.lat) : null),
    longitude: raw.longitude !== undefined && raw.longitude !== null ? Number(raw.longitude) : (raw.lng !== undefined && raw.lng !== null ? Number(raw.lng) : null),
    googleMapsUrl: raw.googleMapsUrl ?? raw.google_maps_url ?? raw.googlemapsurl,
    estado: raw.estado ?? 'ACTIVA',
    atendidaPor: raw.atendidaPor ?? raw.atendida_por ?? raw.atendidapor,
    atendidaAt: raw.atendidaAt ?? raw.atendida_at ?? raw.atendidaat,
    createdAt: raw.createdAt ?? raw.created_at ?? raw.createdat ?? new Date().toISOString()
  };
}

// ----------------------------------------------------
// MULTI-CASING DATABASE INTELLIGENCE HELPERS
// ----------------------------------------------------

// Helper to transform any JS object keys from CamelCase to Lowercase
export function toLowercaseKeys(obj: any): any {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const newObj: any = {};
  for (const key of Object.keys(obj)) {
    newObj[key.toLowerCase()] = obj[key];
  }
  return newObj;
}

// Helper to transform camelCase to snake_case
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function toSnakeCaseKeys(obj: any): any {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const newObj: any = {};
  for (const key of Object.keys(obj)) {
    newObj[toSnakeCase(key)] = obj[key];
  }
  return newObj;
}

export function extractMissingColumn(code: string, message: string): string | null {
  if (!message) return null;
  
  // PostgREST "Could not find the 'avatar' column..." pattern
  const postgrestMatch = message.match(/find the '([^']+)' column/i);
  if (postgrestMatch && postgrestMatch[1]) {
    return postgrestMatch[1];
  }

  // PostgreSQL column "avatar" of relation...
  const pgMatch = message.match(/column "([^"]+)"/i);
  if (pgMatch && pgMatch[1]) {
    return pgMatch[1];
  }

  // Generic fallback patterns
  const altMatch = message.match(/column '([^']+)'/i) || message.match(/column ([a-zA-Z0-9_]+)/i);
  if (altMatch && altMatch[1]) {
    const candidate = altMatch[1];
    if (candidate.toLowerCase() !== 'of' && candidate.toLowerCase() !== 'in' && candidate.toLowerCase() !== 'relation') {
      return candidate;
    }
  }

  return null;
}

export function isInfiniteRecursionError(error: any): boolean {
  if (!error) return false;
  const code = error.code || error.status;
  const msg = typeof error === 'string' ? error : (error.message || '');
  return code === '42P17' || msg.toLowerCase().includes('infinite recursion');
}

let supabaseRecursionBlocked = false;
let lastRecursionLogTime = 0;

export function checkAndMarkRecursion(error: any): boolean {
  if (!error) return false;
  if (isInfiniteRecursionError(error)) {
    const now = Date.now();
    if (!supabaseRecursionBlocked || now - lastRecursionLogTime > 300000) {
      supabaseRecursionBlocked = true;
      lastRecursionLogTime = now;
      console.warn('⚠️ Supabase policy infinite recursion (42P17) detected on remote database. Gracefully activating high-performance LocalDB and Firestore fallback engine.');
    }
    return true;
  }
  return false;
}

export async function robustSupabaseInsert(tableName: string, camelPayload: any) {
  if (supabaseRecursionBlocked) {
    return { data: null, error: { message: 'Supabase policy recursion blocked' } };
  }

  let payload: any = { ...camelPayload };

  // Clean up undefined/empty ID properties to avoid PostgREST foreign key issues
  for (const k of Object.keys(payload)) {
    if (payload[k] === undefined) {
      delete payload[k];
    } else if (payload[k] === '') {
      const lowerK = k.toLowerCase();
      if (lowerK.endsWith('id') || lowerK.endsWith('_id') || lowerK.includes('residenciaid')) {
        payload[k] = null;
      }
    }
  }

  const maxAttempts = 10;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 1. Try writing directly
      const { data, error } = await supabase
        .from(tableName)
        .insert(payload)
        .select();
        
      if (!error) {
        return { data, error: null };
      }
      
      if (checkAndMarkRecursion(error)) {
        return { data: null, error };
      }

      console.warn(`[Supabase Insert Attempt ${attempt}] failed on ${tableName}. Code: ${error.code}, Message: ${error.message}`);
      
      // Foreign Key Constraint Error (e.g. 23503 or foreign key constraint violation)
      if (error.code === '23503' || (error.message && error.message.toLowerCase().includes('foreign key constraint'))) {
        const fkMatch = error.message.match(/Key \(([^)]+)\)=\(([^)]+)\)/i) || error.message.match(/constraint "([^"]+)"/i);
        let fkCol: string | null = null;
        if (fkMatch && fkMatch[1]) {
          fkCol = fkMatch[1];
        }
        
        if (fkCol && fkCol in payload) {
          console.log(`Self-healing insert: Nullifying invalid foreign key "${fkCol}" from ${tableName} payload.`);
          payload[fkCol] = null;
          continue;
        } else {
          // Nullify common foreign key fields if specific field was not extracted
          let nullifiedAny = false;
          ['residenciaId', 'residencia_id', 'residenteId', 'residente_id', 'accessUserId', 'access_user_id'].forEach(fkKey => {
            if (payload[fkKey] !== null && payload[fkKey] !== undefined) {
              payload[fkKey] = null;
              nullifiedAny = true;
            }
          });
          if (nullifiedAny) continue;
        }
      }

      // If code is 42703 (undefined_column) or code is PGRST204 (column missing from cache) or message specifies a missing column
      if (error.code === '42703' || error.code === 'PGRST204' || (error.message && error.message.toLowerCase().includes('column'))) {
        const badCol = extractMissingColumn(error.code, error.message);
        if (badCol) {
          console.log(`Self-healing insert: Pruning missing column "${badCol}" from ${tableName} payload.`);
          delete payload[badCol];
          continue;
        } else {
          // Fallback to lowercased keys or snake_cased keys as retry options if first failed
          if (attempt === 1) {
            console.log(`Retrying insertion using snake_case keys conversion...`);
            payload = toSnakeCaseKeys(camelPayload);
            continue;
          } else if (attempt === 2) {
            console.log(`Retrying insertion using lowercase keys conversion...`);
            payload = toLowercaseKeys(camelPayload);
            continue;
          }
        }
      }
      
      return { data: null, error };
    } catch (err: any) {
      if (checkAndMarkRecursion(err)) {
        return { data: null, error: err };
      }
      console.error(`robustSupabaseInsert exception on ${tableName} attempt ${attempt}:`, err);
      return { data: null, error: err };
    }
  }
  return { data: null, error: { message: 'Max self-healing database insert attempts reached' } };
}

export async function robustSupabaseUpdate(tableName: string, camelUpdates: any, idKey: string, idVal: string) {
  if (supabaseRecursionBlocked) {
    return { error: { message: 'Supabase policy recursion blocked' } };
  }

  let updates: any = { ...camelUpdates };

  // Expand updates with snake_case and lowercase variants
  for (const k of Object.keys(camelUpdates)) {
    const val = camelUpdates[k];
    if (val !== undefined && val !== null) {
      const snakeK = toSnakeCase(k);
      const lowerK = k.toLowerCase();
      if (!(snakeK in updates)) updates[snakeK] = val;
      if (!(lowerK in updates)) updates[lowerK] = val;
    }
  }

  // Clean up undefined/empty ID properties
  for (const k of Object.keys(updates)) {
    if (updates[k] === undefined) {
      delete updates[k];
    } else if (updates[k] === '') {
      const lowerK = k.toLowerCase();
      if (lowerK.endsWith('id') || lowerK.endsWith('_id') || lowerK.includes('residenciaid')) {
        updates[k] = null;
      }
    }
  }

  const maxAttempts = 12;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq(idKey, idVal);
        
      if (!error) return { error: null };

      if (checkAndMarkRecursion(error)) {
        return { error };
      }
      
      console.warn(`[Supabase Update Attempt ${attempt}] failed on ${tableName}. Code: ${error.code}, Message: ${error.message}`);
      
      if (error.code === '42703' || error.code === 'PGRST204' || (error.message && error.message.toLowerCase().includes('column'))) {
        const badCol = extractMissingColumn(error.code, error.message);
        if (badCol) {
          console.log(`Self-healing update: Pruning missing column "${badCol}" from ${tableName} updates.`);
          delete updates[badCol];
          continue;
        } else {
          if (attempt === 1) {
            console.log(`Retrying updates using lowercase keys conversion...`);
            updates = toLowercaseKeys(updates);
            continue;
          } else if (attempt === 2) {
            console.log(`Retrying updates using snake_case keys conversion...`);
            updates = toSnakeCaseKeys(camelUpdates);
            continue;
          }
        }
      }
      
      return { error };
    } catch (err: any) {
      if (checkAndMarkRecursion(err)) {
        return { error: err };
      }
      console.error(`robustSupabaseUpdate exception on ${tableName} attempt ${attempt}:`, err);
      return { error: err };
    }
  }
  return { error: { message: 'Max self-healing database update attempts reached' } };
}

export async function robustSupabaseUpsert(tableName: string, camelPayload: any) {
  if (supabaseRecursionBlocked) {
    return { data: null, error: { message: 'Supabase policy recursion blocked' } };
  }

  let payload: any = { ...camelPayload };

  // Expand payload with snake_case and lowercase variants
  for (const k of Object.keys(camelPayload)) {
    const val = camelPayload[k];
    if (val !== undefined && val !== null) {
      const snakeK = toSnakeCase(k);
      const lowerK = k.toLowerCase();
      if (!(snakeK in payload)) payload[snakeK] = val;
      if (!(lowerK in payload)) payload[lowerK] = val;
    }
  }

  // Clean up undefined/empty ID properties
  for (const k of Object.keys(payload)) {
    if (payload[k] === undefined) {
      delete payload[k];
    } else if (payload[k] === '') {
      const lowerK = k.toLowerCase();
      if (lowerK.endsWith('id') || lowerK.endsWith('_id') || lowerK.includes('residenciaid')) {
        payload[k] = null;
      }
    }
  }

  const maxAttempts = 12;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .upsert(payload)
        .select();
        
      if (!error) {
        return { data, error: null };
      }

      if (checkAndMarkRecursion(error)) {
        return { data: null, error };
      }
      
      console.warn(`[Supabase Upsert Attempt ${attempt}] failed on ${tableName}. Code: ${error.code}, Message: ${error.message}`);
      
      if (error.code === '42703' || error.code === 'PGRST204' || (error.message && error.message.toLowerCase().includes('column'))) {
        const badCol = extractMissingColumn(error.code, error.message);
        if (badCol) {
          console.log(`Self-healing upsert: Pruning missing column "${badCol}" from ${tableName} payload.`);
          delete payload[badCol];
          continue;
        } else {
          if (attempt === 1) {
            console.log(`Retrying upsert using lowercase keys conversion...`);
            payload = toLowercaseKeys(payload);
            continue;
          } else if (attempt === 2) {
            console.log(`Retrying upsert using snake_case keys conversion...`);
            payload = toSnakeCaseKeys(camelPayload);
            continue;
          }
        }
      }
      
      return { data: null, error };
    } catch (err: any) {
      if (checkAndMarkRecursion(err)) {
        return { data: null, error: err };
      }
      console.error(`robustSupabaseUpsert exception on ${tableName} attempt ${attempt}:`, err);
      return { data: null, error: err };
    }
  }
  return { data: null, error: { message: 'Max self-healing database upsert attempts reached' } };
}

export async function robustSupabaseSelectAll(tableName: string, preferredOrderField?: string): Promise<any[]> {
  if (supabaseRecursionBlocked) {
    return [];
  }

  try {
    if (preferredOrderField) {
      // Try 1: With preferred order field as camelCase
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(preferredOrderField, { ascending: false });
      if (!error && data) return data;
      if (checkAndMarkRecursion(error)) return [];

      // Try 2: With preferred order field all lowercase
      const { data: data2, error: error2 } = await supabase
        .from(tableName)
        .select('*')
        .order(preferredOrderField.toLowerCase(), { ascending: false });
      if (!error2 && data2) return data2;
      if (checkAndMarkRecursion(error2)) return [];

      // Try 3: With preferred order field snake case
      const { data: data3, error: error3 } = await supabase
        .from(tableName)
        .select('*')
        .order(toSnakeCase(preferredOrderField), { ascending: false });
      if (!error3 && data3) return data3;
      if (checkAndMarkRecursion(error3)) return [];
    }

    // Try 4: Flat fetch without ordering, we will sort on client
    const { data: data4, error: error4 } = await supabase
      .from(tableName)
      .select('*');
    if (!error4 && data4) return data4;
    if (checkAndMarkRecursion(error4)) return [];

    console.warn(`All Supabase fetch attempts failed on ${tableName}:`, error4?.message);
    throw new Error(error4?.message || 'Fetch failed');
  } catch (err: any) {
    if (checkAndMarkRecursion(err)) return [];
    console.warn(`robustSupabaseSelectAll exception on ${tableName}:`, err);
    return [];
  }
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
    const defaultRoles: SystemRole[] = [
      {
        uid: 'admin-demo-uid',
        name: 'Jonathan Canales Ortiz',
        email: 'canalesjonathan7777@gmail.com',
        username: 'canalesjonathan7777',
        role: SystemUserRole.ADMIN,
        isActive: true,
        password: '@s5Qk4eSkPCxm0',
        createdAt: new Date().toISOString(),
      },
      {
        uid: 'admin-harold-uid',
        name: 'Harold Anguiano',
        email: 'harold.anguiano@admin.local',
        username: 'harold.anguiano',
        role: SystemUserRole.ADMIN,
        isActive: true,
        password: 'Chevropar#1970',
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
      },
      {
        uid: 'residente-demo-uid',
        name: 'Mariana Sosa',
        email: 'residente@local.casa',
        username: 'residente',
        role: SystemUserRole.RESIDENTE,
        isActive: true,
        password: 'Residente_123',
        createdAt: new Date().toISOString(),
        residenciaId: 'res-demo-1',
        residenciaNombre: 'Lomas de Chapultepec'
      },
      {
        uid: 'residente-jonathan-uid',
        name: 'Jonathan Canales',
        email: 'canalesjonathan7777@gmail.com',
        username: 'canalesjonathan7777',
        role: SystemUserRole.RESIDENTE,
        isActive: true,
        password: '@s5Qk4eSkPCxm0',
        createdAt: new Date().toISOString(),
        residenciaId: 'res-demo-1',
        residenciaNombre: 'Lomas de Chapultepec'
      },
      {
        uid: 'admin-main-uid',
        name: 'Admin Principal',
        email: 'admin@sistema.local',
        username: 'admin',
        role: SystemUserRole.ADMIN,
        isActive: true,
        password: 'Admin_123',
        createdAt: new Date().toISOString()
      }
    ];

    if (!data) {
      localStorage.setItem(LS_ROLES_KEY, JSON.stringify(defaultRoles));
      return defaultRoles;
    }
    try {
      const currentRoles: SystemRole[] = JSON.parse(data);
      let updated = false;
      for (const r of defaultRoles) {
        const existingIdx = currentRoles.findIndex(cr => cr.uid === r.uid || (cr.username === r.username && cr.role === r.role));
        if (existingIdx < 0) {
          currentRoles.push(r);
          updated = true;
        }
      }
      if (updated) {
        localStorage.setItem(LS_ROLES_KEY, JSON.stringify(currentRoles));
      }
      return currentRoles;
    } catch (e) {
      localStorage.setItem(LS_ROLES_KEY, JSON.stringify(defaultRoles));
      return defaultRoles;
    }
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
  },

  getMarbetes(): Marbete[] {
    const data = localStorage.getItem(LS_MARBETES_KEY);
    const defaultMarbetes: Marbete[] = [
      {
        id: 'mar-demo-1',
        consecutivo: 1001,
        residenteId: 'resd-demo-1',
        residenteNombre: 'Mariana Sosa (Residente)',
        residenciaId: 'res-demo-1',
        residenciaNombre: 'Lomas de Chapultepec',
        vehiculoPlacas: 'MS-888-A',
        vehiculoInfo: 'Audi A3 Blanco',
        status: UserStatus.ACTIVE,
        validFrom: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        validUntil: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        qrcodeToken: 'mar_token_demo_1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    if (!data) {
      localStorage.setItem(LS_MARBETES_KEY, JSON.stringify(defaultMarbetes));
      return defaultMarbetes;
    }
    try {
      const parsed = JSON.parse(data);
      if (parsed.length === 0) {
        localStorage.setItem(LS_MARBETES_KEY, JSON.stringify(defaultMarbetes));
        return defaultMarbetes;
      }
      return parsed;
    } catch {
      localStorage.setItem(LS_MARBETES_KEY, JSON.stringify(defaultMarbetes));
      return defaultMarbetes;
    }
  },

  saveMarbetes(marbetes: Marbete[]) {
    localStorage.setItem(LS_MARBETES_KEY, JSON.stringify(marbetes));
  },

  getEvidencias(): Evidencia[] {
    const data = localStorage.getItem(LS_EVIDENCIAS_KEY);
    if (!data) {
      return [];
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveEvidencias(evidencias: Evidencia[]) {
    localStorage.setItem(LS_EVIDENCIAS_KEY, JSON.stringify(evidencias));
  },

  getAlertasPanico(): AlertaPanico[] {
    const data = localStorage.getItem(LS_ALERTAS_PANICO_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveAlertasPanico(alertas: AlertaPanico[]) {
    localStorage.setItem(LS_ALERTAS_PANICO_KEY, JSON.stringify(alertas));
  }
};


// ----------------------------------------------------
// UNIFIED DB SERVICE (SUPABASE-FIRST WITH LOCAL FALLBACK)
// ----------------------------------------------------
export const dbService = {

  // --------------------------------------------------
  // System Roles Management (RBAC)
  // --------------------------------------------------
  async getSystemRole(uidOrIdentifier: string): Promise<SystemRole | null> {
    if (!uidOrIdentifier) return null;
    const cleanIdentifier = uidOrIdentifier.toLowerCase().trim();

    if (!supabaseRecursionBlocked) {
      try {
        const { data, error } = await supabase
          .from('system_roles')
          .select('*')
          .or(`uid.eq.${uidOrIdentifier},email.eq.${cleanIdentifier},username.eq.${cleanIdentifier}`)
          .maybeSingle();

        if (!error && data) {
          return normalizeRoleRow(data);
        }
        if (error) {
          if (!checkAndMarkRecursion(error)) {
            console.warn('Supabase getSystemRole returned query error. Code:', error.code, 'Msg:', error.message);
          }
        }
      } catch (err) {
        if (!checkAndMarkRecursion(err)) {
          console.warn('Supabase getSystemRole critical exception, using fallback:', err);
        }
      }
    }

    if (!IS_FIREBASE_DUMMY) {
      try {
        const docRef = doc(db, 'system_roles', uidOrIdentifier);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return normalizeRoleRow(docSnap.data());
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `system_roles/${uidOrIdentifier}`);
      }
    }

    const roles = LocalDB.getRoles();
    return roles.find(r => 
      r.uid === uidOrIdentifier || 
      r.email?.toLowerCase() === cleanIdentifier || 
      r.username?.toLowerCase() === cleanIdentifier
    ) || null;
  },

  async saveSystemRole(role: SystemRole): Promise<void> {
    try {
      const { error } = await robustSupabaseUpsert('system_roles', role);
      if (error) {
        if (!checkAndMarkRecursion(error)) {
          console.warn('Supabase saveSystemRole returned query error:', error);
        }
      } else {
        console.log('Successfully saved system role in Supabase!');
      }
    } catch (err) {
      if (!checkAndMarkRecursion(err)) {
        console.warn('Supabase saveSystemRole critical exception, using fallback:', err);
      }
    }

    if (!IS_FIREBASE_DUMMY) {
      try {
        const docRef = doc(db, 'system_roles', role.uid);
        await setDoc(docRef, role);
      } catch (err) {
        console.warn('Firestore write failed, relying on Supabase/Local state:', err);
      }
    }

    const roles = LocalDB.getRoles();
    const filtered = roles.filter(r => r.uid !== role.uid);
    filtered.push(role);
    LocalDB.saveRoles(filtered);
  },

  async updateSystemRole(uid: string, updates: Partial<SystemRole>): Promise<void> {
    try {
      const { error } = await robustSupabaseUpdate('system_roles', updates, 'uid', uid);
      if (error) {
        if (!checkAndMarkRecursion(error)) {
          console.warn('Supabase updateSystemRole query error:', error);
        }
      }
    } catch (err) {
      if (!checkAndMarkRecursion(err)) {
        console.warn('Supabase updateSystemRole exception:', err);
      }
    }

    if (!IS_FIREBASE_DUMMY) {
      try {
        const docRef = doc(db, 'system_roles', uid);
        await updateDoc(docRef, updates);
      } catch (err) {
        console.warn('Firestore updateSystemRole exception:', err);
      }
    }

    const roles = LocalDB.getRoles();
    const updated = roles.map(r => r.uid === uid ? { ...r, ...updates } : r);
    LocalDB.saveRoles(updated);
  },

  async getAllSystemRoles(): Promise<SystemRole[]> {
    let roles: SystemRole[] = [];
    let fetchedFromCloud = false;

    if (!supabaseRecursionBlocked) {
      try {
        const { data, error } = await supabase
          .from('system_roles')
          .select('*')
          .order('createdAt', { ascending: false });

        if (!error && data) {
          roles = (data as any[]).map(normalizeRoleRow);
          fetchedFromCloud = true;
        } else if (error) {
          if (!checkAndMarkRecursion(error)) {
            console.warn('Supabase getAllSystemRoles returned query error. Code:', error.code, 'Msg:', error.message);
          }
        }
      } catch (err) {
        if (!checkAndMarkRecursion(err)) {
          console.warn('Supabase getAllSystemRoles critical exception, using fallback:', err);
        }
      }
    }

    if (!fetchedFromCloud && !IS_FIREBASE_DUMMY) {
      try {
        const colRef = collection(db, 'system_roles');
        const q = query(colRef, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const results: SystemRole[] = [];
        snap.forEach(d => {
          results.push(normalizeRoleRow(d.data()));
        });
        roles = results;
        fetchedFromCloud = true;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'system_roles');
      }
    }

    if (!fetchedFromCloud) {
      roles = LocalDB.getRoles();
    }

    // Self-healing / On-Demand Sync: 
    // Check if any default demo roles are missing from the retrieved active roles list
    const demoRoles = LocalDB.getRoles();
    const missingDemoRoles = demoRoles.filter(demo => !roles.some(r => r.uid === demo.uid || (r.username?.toLowerCase() === demo.username?.toLowerCase() && r.role === demo.role)));

    if (missingDemoRoles.length > 0) {
      console.log('Seeding missing demo roles to databases:', missingDemoRoles.map(m => m.username));
      for (const demo of missingDemoRoles) {
        // 1. Try to sync to Supabase if not blocked
        if (!supabaseRecursionBlocked) {
          try {
            if (demo.residenciaId) {
              try {
                const { data: resExists } = await supabase
                  .from('residencias')
                  .select('id')
                  .eq('id', demo.residenciaId)
                  .maybeSingle();
                
                if (!resExists) {
                  const defaultRes = {
                    id: demo.residenciaId,
                    nombre: demo.residenciaNombre || 'Fraccionamiento Residencial',
                    administrador: 'Software AI Admin',
                    numResidencias: 120,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };
                  await supabase.from('residencias').insert(defaultRes);
                }
              } catch (resErr) {
                if (!checkAndMarkRecursion(resErr)) {
                  console.warn('Silent warning ensuring residencia during role seed:', resErr);
                }
              }
            }

            const { error: seedErr } = await supabase.from('system_roles').upsert({
              uid: demo.uid,
              email: demo.email,
              name: demo.name,
              role: demo.role,
              username: demo.username,
              password: demo.password,
              isActive: demo.isActive,
              createdAt: demo.createdAt,
              residenciaId: demo.residenciaId,
              residenciaNombre: demo.residenciaNombre
            });
            if (seedErr) {
              checkAndMarkRecursion(seedErr);
            }
          } catch (ex) {
            if (!checkAndMarkRecursion(ex)) {
              console.warn('Sync of missing role to Supabase failed:', ex);
            }
          }
        }

        // 2. Try to sync to Firestore
        if (!IS_FIREBASE_DUMMY) {
          try {
            const docRef = doc(db, 'system_roles', demo.uid);
            await setDoc(docRef, demo);
          } catch (ex) {
            console.warn('Sync of missing role to Firestore failed:', ex);
          }
        }

        // 3. Keep local state updated
        const localList = LocalDB.getRoles();
        if (!localList.some(lr => lr.uid === demo.uid)) {
          localList.push(demo);
          LocalDB.saveRoles(localList);
        }

        // Add to active returned list so it can be logged in immediately
        roles.push(demo);
      }
    }

    // Sanitize roles: ensure harold.anguiano and CONDOMINIOS roles map strictly to ADMIN
    roles = roles.map(r => {
      const u = (r.username || '').toLowerCase();
      const e = (r.email || '').toLowerCase();
      if (u === 'harold.anguiano' || e.includes('harold.anguiano') || r.role === SystemUserRole.CONDOMINIOS) {
        return {
          ...r,
          role: SystemUserRole.ADMIN,
          password: r.password || 'Chevropar#1970'
        };
      }
      return r;
    });

    // Remove duplicates by username and role
    const uniqueMap = new Map<string, SystemRole>();
    for (const r of roles) {
      const key = `${(r.username || '').toLowerCase()}_${r.role}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, r);
      }
    }

    return Array.from(uniqueMap.values());
  },

  async deleteSystemRole(uid: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_roles')
        .delete()
        .eq('uid', uid);

      if (error) {
        console.warn('Supabase deleteSystemRole returned query error. Code:', error.code, 'Msg:', error.message);
      }
    } catch (err) {
      console.warn('Supabase deleteSystemRole critical exception, using fallback:', err);
    }

    if (!IS_FIREBASE_DUMMY) {
      try {
        const docRef = doc(db, 'system_roles', uid);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('Firestore delete failed, relying on Supabase/Local state:', err);
      }
    }

    const roles = LocalDB.getRoles();
    const filtered = roles.filter(r => r.uid !== uid);
    LocalDB.saveRoles(filtered);
  },

  // --------------------------------------------------
  // Authorized Users CRUD (Visitors List)
  // --------------------------------------------------
  async getAuthorizedUsers(): Promise<AuthorizedUser[]> {
    let remoteUsers: AuthorizedUser[] = [];
    let success = false;

    try {
      const data = await robustSupabaseSelectAll('authorized_users', 'createdAt');
      if (data && data.length > 0) {
        remoteUsers = data.map(normalizeUserRow);
        success = true;
      } else {
        // Flat fetch succeeded but empty or handled gracefully
        success = true;
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
    
    // Fetch mirror marbetes from Supabase as a primary cloud fallback
    try {
      const { data: syncMarbetes } = await supabase
        .from('marbetes')
        .select('*')
        .like('vehiculoInfo', 'VISIT_SYNC|%');
      
      if (syncMarbetes && syncMarbetes.length > 0) {
        syncMarbetes.forEach(mar => {
          const parts = (mar.vehiculoInfo || '').split('|');
          const syncUser: AuthorizedUser = {
            id: mar.id.replace('mar_sync_', ''),
            name: parts[1] || mar.residenteNombre || 'Visita Autorizada',
            documentId: mar.vehiculoPlacas || 'VISITA',
            email: parts[5] || 'visita-resident@local.casa',
            phone: parts[4] || '',
            status: ((mar.status as string) === 'activo' || mar.status === UserStatus.ACTIVE) ? UserStatus.ACTIVE : UserStatus.EXPIRED,
            qrcodeToken: mar.qrcodeToken || '',
            oneTime: parts[2] === '1',
            used: parts[3] === '1',
            validFrom: mar.validFrom || new Date().toISOString(),
            validUntil: mar.validUntil || new Date(Date.now() + 86400000).toISOString(),
            days: [],
            startTime: '00:00',
            endTime: '23:59',
            createdAt: mar.createdAt || new Date().toISOString(),
            updatedAt: mar.updatedAt || new Date().toISOString(),
            createdBy: 'resident-sync',
            residenciaNombre: mar.residenciaNombre || '',
            isResidentCreated: true,
            residentName: mar.residenteNombre || ''
          };
          remoteUsers.push(syncUser);
        });
      }
    } catch (syncErr) {
      console.warn('Fetch mirror marbetes failed:', syncErr);
    }

    if (!success && remoteUsers.length === 0) {
      return localUsers;
    }

    // Unify both sets of records without duplicate keys, prioritizing latest updates
    const unifiedMap = new Map<string, AuthorizedUser>();
    localUsers.forEach(u => unifiedMap.set(u.id, u));
    remoteUsers.forEach(u => unifiedMap.set(u.id, u));

    return Array.from(unifiedMap.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  },

  async getAuthorizedUserByToken(token: string): Promise<AuthorizedUser | null> {
    if (!token) return null;
    let tokenClean = token.trim().replace(/^["']|["']$/g, '');

    // Extract token if a full URL or query string is provided
    if (tokenClean.includes('pass=')) {
      tokenClean = tokenClean.split('pass=')[1].split('&')[0].split(' ')[0].trim();
    } else if (tokenClean.includes('token=')) {
      tokenClean = tokenClean.split('token=')[1].split('&')[0].split(' ')[0].trim();
    }
    
    // 1. Direct query from Supabase using possible column names or lowercases
    try {
      const data = await robustSupabaseSelectAll('authorized_users');
      if (data && data.length > 0) {
        const mapped = data.map(normalizeUserRow);
        const found = mapped.find(u => 
          u.qrcodeToken?.trim() === tokenClean || 
          u.qrcodeToken?.trim().toLowerCase() === tokenClean.toLowerCase() ||
          u.documentId?.trim().toLowerCase() === tokenClean.toLowerCase() ||
          u.id?.trim().toLowerCase() === tokenClean.toLowerCase()
        );
        if (found) {
          console.log('Found authorized user by token directly in Supabase using scan find:', found.name);
          return found;
        }
      }
    } catch (err) {
      console.warn('getAuthorizedUserByToken direct Supabase exception:', err);
    }

    // 2. Query mirror marbetes from Supabase
    try {
      const { data: mData } = await supabase
        .from('marbetes')
        .select('*')
        .or(`qrcodeToken.eq.${tokenClean},qrcodeToken.ilike.${tokenClean}`);
      
      if (mData && mData.length > 0) {
        const mar = mData[0];
        let vName = mar.residenteNombre || 'Visita Autorizada';
        let vOneTime = true;
        let vUsed = false;
        let vPhone = '';
        let vEmail = '';
        let vResidentName = mar.residenteNombre || '';

        if (mar.vehiculoInfo && mar.vehiculoInfo.startsWith('VISIT_SYNC|')) {
          const parts = mar.vehiculoInfo.split('|');
          vName = parts[1] || vName;
          vOneTime = parts[2] === '1';
          vUsed = parts[3] === '1';
          vPhone = parts[4] || '';
          vEmail = parts[5] || '';
          const resMatch = mar.vehiculoInfo.match(/\[RESIDENT:([^\]]+)\]/);
          if (resMatch) vResidentName = resMatch[1];
        }

        const mappedUser: AuthorizedUser = {
          id: mar.id.replace('mar_sync_', ''),
          name: vName,
          documentId: mar.vehiculoPlacas || 'VISITA',
          email: vEmail || 'visita-resident@local.casa',
          phone: vPhone || '',
          status: ((mar.status as string) === 'activo' || mar.status === UserStatus.ACTIVE) ? UserStatus.ACTIVE : UserStatus.EXPIRED,
          qrcodeToken: mar.qrcodeToken || tokenClean,
          oneTime: vOneTime,
          used: vUsed,
          validFrom: mar.validFrom || new Date().toISOString(),
          validUntil: mar.validUntil || new Date(Date.now() + 86400000).toISOString(),
          days: [],
          startTime: '00:00',
          endTime: '23:59',
          createdAt: mar.createdAt || new Date().toISOString(),
          updatedAt: mar.updatedAt || new Date().toISOString(),
          createdBy: 'resident-sync',
          residenciaNombre: mar.residenciaNombre || '',
          isResidentCreated: true,
          residentName: vResidentName || ''
        };
        console.log('Found authorized user via mirror marbete in Supabase:', mappedUser.name);
        return mappedUser;
      }
    } catch (mErr) {
      console.warn('Mirror marbete search by token failed:', mErr);
    }

    // 3. Direct lookup from local storage
    const localUsers = LocalDB.getUsers();
    const foundLocal = localUsers.find(u => 
      u.qrcodeToken?.trim() === tokenClean || 
      u.qrcodeToken?.trim().toLowerCase() === tokenClean.toLowerCase() ||
      u.documentId?.trim().toLowerCase() === tokenClean.toLowerCase() ||
      u.id?.trim().toLowerCase() === tokenClean.toLowerCase()
    );
    if (foundLocal) {
      return foundLocal;
    }

    // 4. Fallback to Firebase
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
      const { error } = await robustSupabaseInsert('authorized_users', newUser);
      if (error) {
        console.warn('Supabase createAuthorizedUser returned query error:', error);
      } else {
        console.log('Successfully inserted authorized user to Supabase!');
      }
    } catch (err) {
      console.warn('Supabase createAuthorizedUser exception, relying on local sync:', err);
    }

    // 3. Create mirror marbete record in Supabase to guarantee cloud persistence across devices
    try {
      const visitorNameOnly = newUser.name;
      const residentAuthorizer = newUser.residentName || '';

      const mirrorMarbete = {
        id: 'mar_sync_' + id,
        consecutivo: Math.floor(100000 + Math.random() * 899999),
        residenteId: null,
        residenteNombre: visitorNameOnly,
        residenciaId: null,
        residenciaNombre: newUser.residenciaNombre || 'Residencia',
        vehiculoPlacas: newUser.documentId || 'VISITA',
        vehiculoInfo: `VISIT_SYNC|${visitorNameOnly}|${newUser.oneTime ? '1' : '0'}|${newUser.used ? '1' : '0'}|${newUser.phone || ''}|${newUser.email || ''}|[RESIDENT:${residentAuthorizer}]`,
        qrcodeToken: newUser.qrcodeToken,
        validFrom: newUser.validFrom || new Date().toISOString(),
        validUntil: newUser.validUntil || new Date(Date.now() + 86400000).toISOString(),
        status: ((newUser.status as unknown as string) === 'activo' || newUser.status === UserStatus.ACTIVE) ? 'activo' : 'inactivo',
        createdAt: newUser.createdAt || new Date().toISOString(),
        updatedAt: newUser.updatedAt || new Date().toISOString()
      };
      await robustSupabaseInsert('marbetes', mirrorMarbete);
      console.log('Successfully created mirror marbete in Supabase for cross-device visitor pass lookup!');
    } catch (mErr) {
      console.warn('Mirror marbete creation exception:', mErr);
    }

    if (IS_FIREBASE_DUMMY) {
      return newUser;
    }

    // 4. Propagate to Firebase as auxiliary cloud store
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
      const updatesWithTimestamp = { ...updates, updatedAt: new Date().toISOString() };
      const { error } = await robustSupabaseUpdate('authorized_users', updatesWithTimestamp, 'id', id);
      if (error) {
        console.warn('Supabase updateAuthorizedUser returned query error:', error);
      } else {
        console.log('Successfully updated authorized user in Supabase!');
      }
    } catch (err) {
      console.warn('Supabase updateAuthorizedUser exception, using fallback sync:', err);
    }

    // Update mirror marbete in Supabase
    try {
      const mirrorId = id.startsWith('mar_sync_') ? id : 'mar_sync_' + id;
      const { data: existingMar } = await supabase
        .from('marbetes')
        .select('*')
        .or(`id.eq.${mirrorId},qrcodeToken.eq.${updates.qrcodeToken || ''}`);
      
      if (existingMar && existingMar.length > 0) {
        const current = existingMar[0];
        const parts = (current.vehiculoInfo || '').split('|');
        const newUsed = updates.used !== undefined ? (updates.used ? '1' : '0') : (parts[3] || '0');
        const newStatus = updates.status ? (((updates.status as unknown as string) === 'activo' || updates.status === UserStatus.ACTIVE) ? 'activo' : 'inactivo') : current.status;
        const updatedVeh = `VISIT_SYNC|${updates.name || parts[1] || current.residenteNombre}|${updates.oneTime !== undefined ? (updates.oneTime ? '1' : '0') : (parts[2] || '1')}|${newUsed}|${updates.phone || parts[4] || ''}|${updates.email || parts[5] || ''}`;
        
        await supabase.from('marbetes').update({
          status: newStatus,
          vehiculoInfo: updatedVeh,
          updatedAt: new Date().toISOString()
        }).eq('id', current.id);
      }
    } catch (mErr) {
      console.warn('Mirror marbete update exception:', mErr);
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

    // Delete mirror marbete from Supabase
    try {
      const mirrorId = id.startsWith('mar_sync_') ? id : 'mar_sync_' + id;
      await supabase.from('marbetes').delete().or(`id.eq.${id},id.eq.${mirrorId}`);
    } catch (mErr) {
      console.warn('Mirror marbete delete exception:', mErr);
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
    let remoteLogs: AccessLog[] = [];
    if (!supabaseRecursionBlocked) {
      try {
        const { data, error } = await supabase
          .from('access_logs')
          .select('*')
          .order('timestamp', { ascending: false });

        if (!error && data) {
          remoteLogs = (data as any[]).map(normalizeLogRow);
        } else if (error) {
          if (!checkAndMarkRecursion(error)) {
            console.warn('Supabase getAccessLogs returned query error. Code:', error.code, 'Msg:', error.message);
          }
        }
      } catch (err) {
        if (!checkAndMarkRecursion(err)) {
          console.warn('Supabase getAccessLogs exception, using fallback:', err);
        }
      }
    }

    if (!IS_FIREBASE_DUMMY && remoteLogs.length === 0) {
      try {
        const colRef = collection(db, 'access_logs');
        const q = query(colRef, orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const results: AccessLog[] = [];
        snap.forEach(d => {
          results.push(normalizeLogRow(d.data()));
        });
        remoteLogs = results;
      } catch (err) {
        console.warn('Firestore getAccessLogs exception:', err);
      }
    }

    // Merge remote and local access logs seamlessly
    const local = LocalDB.getLogs().map(normalizeLogRow);
    const unifiedMap = new Map<string, AccessLog>();
    local.forEach(l => unifiedMap.set(l.id, l));
    remoteLogs.forEach(r => unifiedMap.set(r.id, r));

    return Array.from(unifiedMap.values()).sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  },

  async createAccessLog(log: Omit<AccessLog, 'id'>): Promise<AccessLog> {
    const id = 'log_' + generateId();
    const newLog: AccessLog = { ...log, id };

    // 1. Save to LocalDB immediately for instant responsiveness
    try {
      const logs = LocalDB.getLogs();
      logs.unshift(newLog);
      LocalDB.saveLogs(logs);
    } catch (locErr) {
      console.warn('LocalDB saveLogs cache error:', locErr);
    }

    // 2. Perform background remote sync with multi-casing payload for Supabase
    const remoteSync = async () => {
      const supabasePayload = {
        id: newLog.id,
        userId: newLog.userId,
        user_id: newLog.userId,
        userid: newLog.userId,
        userName: newLog.userName,
        user_name: newLog.userName,
        username: newLog.userName,
        documentId: newLog.documentId || 'N/A',
        document_id: newLog.documentId || 'N/A',
        documentid: newLog.documentId || 'N/A',
        timestamp: newLog.timestamp,
        type: newLog.type,
        status: newLog.status,
        guardId: newLog.guardId,
        guard_id: newLog.guardId,
        guardid: newLog.guardId,
        guardName: newLog.guardName,
        guard_name: newLog.guardName,
        guardname: newLog.guardName,
        residenciaId: newLog.residenciaId || null,
        residencia_id: newLog.residenciaId || null,
        residenciaid: newLog.residenciaId || null,
        residenciaNombre: newLog.residenciaNombre || null,
        residencia_nombre: newLog.residenciaNombre || null,
        residencianombre: newLog.residenciaNombre || null,
        casetaId: newLog.casetaId || null,
        caseta_id: newLog.casetaId || null,
        casetaid: newLog.casetaId || null,
        casetaNombre: newLog.casetaNombre || null,
        caseta_nombre: newLog.casetaNombre || null,
        casetanombre: newLog.casetaNombre || null
      };

      try {
        await robustSupabaseInsert('access_logs', supabasePayload);
      } catch (err) {
        console.warn('Supabase createAccessLog exception:', err);
      }

      if (!IS_FIREBASE_DUMMY) {
        try {
          const docRef = doc(db, 'access_logs', id);
          await setDoc(docRef, newLog);
        } catch (err) {
          console.warn('Firestore setDoc access_log warning:', err);
        }
      }
    };

    // Race remote sync with 1200ms timeout
    await Promise.race([
      remoteSync(),
      new Promise((res) => setTimeout(res, 1200))
    ]);

    return newLog;
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
    if (!supabaseRecursionBlocked) {
      try {
        const { data, error } = await supabase
          .from('residencias')
          .select('*')
          .order('createdAt', { ascending: false });

        if (!error && data) {
          if (data.length === 0) {
            const defaultRes = {
              id: 'res-demo-1',
              nombre: 'Lomas de Chapultepec',
              administrador: 'Software AI Admin',
              numResidencias: 120,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await supabase.from('residencias').insert(defaultRes);
            return [defaultRes];
          }
          return (data as any[]).map(normalizeResidenciaRow);
        }
        if (error) {
          if (!checkAndMarkRecursion(error)) {
            console.warn('Supabase getResidencias returned query error. Code:', error.code, 'Msg:', error.message);
          }
        }
      } catch (err) {
        if (!checkAndMarkRecursion(err)) {
          console.warn('Supabase getResidencias exception, using fallback:', err);
        }
      }
    }

    if (IS_FIREBASE_DUMMY) {
      return LocalDB.getResidencias().map(normalizeResidenciaRow);
    }

    try {
      const colRef = collection(db, 'residencias');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const results: Residencia[] = [];
      snap.forEach(d => {
        results.push(normalizeResidenciaRow(d.data()));
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
      const { error } = await robustSupabaseInsert('residencias', newResidencia);
      if (error) {
        console.warn('Supabase createResidencia returned query error:', error);
      } else {
        console.log('Successfully inserted Residence to Supabase!');
      }
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
      const updatesWithTimestamp = { ...updates, updatedAt: new Date().toISOString() };
      const { error } = await robustSupabaseUpdate('residencias', updatesWithTimestamp, 'id', id);
      if (error) {
        console.warn('Supabase updateResidencia returned query error:', error);
      } else {
        console.log('Successfully updated Residence in Supabase!');
      }
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
    if (!supabaseRecursionBlocked) {
      try {
        const { data, error } = await supabase
          .from('residentes')
          .select('*')
          .order('createdAt', { ascending: false });

        if (!error && data) {
          if (data.length === 0) {
            const defaultResidente = {
              id: 'resd-demo-1',
              nombre: 'Mariana Sosa',
              residenciaId: 'res-demo-1',
              residenciaNombre: 'Lomas de Chapultepec',
              direccion: 'Calle Roble #14',
              qrcodeToken: 'residente_mariana_token',
              whatsapp: '+525512345678',
              accessUserId: 'usr-resd-demo-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await supabase.from('residentes').insert(defaultResidente);
            return [defaultResidente];
          }
          return (data as any[]).map(normalizeResidentRow);
        }
        if (error) {
          if (!checkAndMarkRecursion(error)) {
            console.warn('Supabase getResidentes returned query error. Code:', error.code, 'Msg:', error.message);
          }
        }
      } catch (err) {
        if (!checkAndMarkRecursion(err)) {
          console.warn('Supabase getResidentes exception, using fallback:', err);
        }
      }
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
      const { error } = await robustSupabaseInsert('residentes', newResidente);
      if (error) {
        console.warn('Supabase createResidente returned query error:', error);
      } else {
        console.log('Successfully inserted resident to Supabase!');
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
      const updatesWithTimestamp = { ...updates, updatedAt: new Date().toISOString() };
      const { error } = await robustSupabaseUpdate('residentes', updatesWithTimestamp, 'id', id);
      if (error) {
        console.warn('Supabase updateResidente returned query error:', error);
      } else {
        console.log('Successfully updated resident in Supabase!');
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
    if (!supabaseRecursionBlocked) {
      try {
        const { data, error } = await supabase
          .from('casetas')
          .select('*')
          .order('createdAt', { ascending: false });

        if (!error && data) {
          return data as Caseta[];
        }
        if (error) {
          if (!checkAndMarkRecursion(error)) {
            console.warn('Supabase getCasetas returned query error. Code:', error.code, 'Msg:', error.message);
          }
        }
      } catch (err) {
        if (!checkAndMarkRecursion(err)) {
          console.warn('Supabase getCasetas exception, using fallback:', err);
        }
      }
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
  },

  // --------------------------------------------------
  // Marbetes Management CRUD
  // --------------------------------------------------
  async getMarbetes(): Promise<Marbete[]> {
    if (!supabaseRecursionBlocked) {
      try {
        const data = await robustSupabaseSelectAll('marbetes', 'createdAt');
        if (data) {
          if (data.length === 0) {
            const defaultMarbete = {
              id: 'mar-demo-1',
              consecutivo: 1001,
              residenteId: 'resd-demo-1',
              residenteNombre: 'Mariana Sosa (Residente)',
              residenciaId: 'res-demo-1',
              residenciaNombre: 'Lomas de Chapultepec',
              vehiculoPlacas: 'MS-888-A',
              vehiculoInfo: 'Audi A3 Blanco',
              status: UserStatus.ACTIVE,
              validFrom: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              validUntil: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
              qrcodeToken: 'mar_token_demo_1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            // Insert into Supabase
            try {
              await supabase.from('marbetes').insert(defaultMarbete);
            } catch (insErr) {
              if (!checkAndMarkRecursion(insErr)) {
                console.warn('Failed to insert default marbete in Supabase:', insErr);
              }
            }
            return [defaultMarbete as Marbete];
          }
          return data.map(normalizeMarbeteRow);
        }
      } catch (err) {
        if (!checkAndMarkRecursion(err)) {
          console.warn('Supabase getMarbetes exception, using fallback:', err);
        }
      }
    }

    if (IS_FIREBASE_DUMMY) {
      return LocalDB.getMarbetes().map(normalizeMarbeteRow);
    }

    try {
      const colRef = collection(db, 'marbetes');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const results: Marbete[] = [];
      snap.forEach(d => {
        results.push(normalizeMarbeteRow(d.data()));
      });
      return results;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'marbetes');
      return [];
    }
  },

  async createMarbete(marbete: Omit<Marbete, 'id' | 'consecutivo'>): Promise<Marbete> {
    const id = 'mar_' + generateId();
    
    // Get next consecutive number
    let nextConsecutivo = 1001; // Start consecutive from 1001 if empty
    try {
      const existing = await this.getMarbetes();
      if (existing.length > 0) {
        const consecs = existing.map(m => m.consecutivo || 0);
        const max = consecs.length > 0 ? Math.max(...consecs, 1000) : 1000;
        nextConsecutivo = max + 1;
      }
    } catch (err) {
      console.warn('Error calculating consecutive number, using default:', err);
    }

    const newMarbete: Marbete = {
      ...marbete,
      id,
      consecutivo: nextConsecutivo
    };

    // 1. Save to local storage first to guarantee UI responsiveness
    try {
      const currentLocals = LocalDB.getMarbetes();
      currentLocals.unshift(newMarbete);
      LocalDB.saveMarbetes(currentLocals);
    } catch (locErr) {
      console.warn('Failed saving marbete to LocalDB cache:', locErr);
    }

    // 2. Propagate to Supabase as primary cloud store
    try {
      const { error } = await robustSupabaseInsert('marbetes', newMarbete);
      if (error) {
        console.warn('Supabase createMarbete returned query error, relying on local sync:', error);
      } else {
        console.log('Successfully saved Marbete in Supabase');
      }
    } catch (err: any) {
      console.warn('Supabase createMarbete exception occurred, relying on local sync:', err);
    }

    return newMarbete;
  },

  async updateMarbete(id: string, updates: Partial<Marbete>): Promise<void> {
    try {
      const list = LocalDB.getMarbetes();
      const updatedList = list.map(m => m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m);
      LocalDB.saveMarbetes(updatedList);
    } catch (locErr) {
      console.warn('LocalDB updateMarbete error:', locErr);
    }

    try {
      const updatesWithTimestamp = { ...updates, updatedAt: new Date().toISOString() };
      const { error } = await robustSupabaseUpdate('marbetes', updatesWithTimestamp, 'id', id);
      if (error) {
        console.warn('Supabase updateMarbete returned error:', error);
      }
    } catch (err: any) {
      console.warn('Supabase updateMarbete exception occurred:', err);
    }
  },

  async deleteMarbete(id: string): Promise<void> {
    try {
      const list = LocalDB.getMarbetes();
      const filtered = list.filter(m => m.id !== id);
      LocalDB.saveMarbetes(filtered);
    } catch (locErr) {
      console.warn('LocalDB deleteMarbete error:', locErr);
    }

    try {
      const { error } = await supabase
        .from('marbetes')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase deleteMarbete error:', error);
      }
    } catch (err: any) {
      console.warn('Supabase deleteMarbete exception occurred:', err);
    }
  },

  async getMarbeteByToken(token: string): Promise<Marbete | null> {
    if (!token) return null;
    const tokenClean = token.trim();

    try {
      const data = await robustSupabaseSelectAll('marbetes');
      if (data && data.length > 0) {
        const mapped = data.map(normalizeMarbeteRow);
        const found = mapped.find(m => m.qrcodeToken?.trim() === tokenClean || m.qrcodeToken?.trim().toLowerCase() === tokenClean.toLowerCase());
        if (found) {
          return found;
        }
      }
    } catch (err) {
      console.warn('getMarbeteByToken direct Supabase exception:', err);
    }

    if (IS_FIREBASE_DUMMY) {
      const list = LocalDB.getMarbetes();
      const found = list.find(m => m.qrcodeToken?.trim() === tokenClean || m.qrcodeToken?.trim().toLowerCase() === tokenClean.toLowerCase());
      return found ? normalizeMarbeteRow(found) : null;
    }

    try {
      const colRef = collection(db, 'marbetes');
      const q = query(colRef, where('qrcodeToken', '==', tokenClean));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return normalizeMarbeteRow(snap.docs[0].data());
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `marbetes_token/${tokenClean}`);
      return null;
    }
  },

  async getEvidencias(): Promise<Evidencia[]> {
    let remoteUsers: Evidencia[] = [];

    if (!supabaseRecursionBlocked) {
      try {
        const { data, error } = await supabase
          .from('evidencias')
          .select('*')
          .order('timestamp', { ascending: false });

        if (!error && data) {
          remoteUsers = (data as any[]).map(normalizeEvidenciaRow);
        } else if (error) {
          if (!checkAndMarkRecursion(error)) {
            console.warn('Supabase getEvidencias returned query error:', error);
          }
        }
      } catch (err) {
        if (!checkAndMarkRecursion(err)) {
          console.warn('Supabase getEvidencias exception, using fallback:', err);
        }
      }
    }

    if (!IS_FIREBASE_DUMMY && remoteUsers.length === 0) {
      try {
        const colRef = collection(db, 'evidencias');
        const q = query(colRef, orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const results: Evidencia[] = [];
        snap.forEach(d => {
          results.push(normalizeEvidenciaRow(d.data()));
        });
        remoteUsers = results;
      } catch (err) {
        console.warn('Firestore getEvidencias exception:', err);
      }
    }

    // Merge remote and local evidencias seamlessly with strict deduplication
    const local = LocalDB.getEvidencias().map(normalizeEvidenciaRow);
    const allRecords = [...local, ...remoteUsers];

    const deduplicatedMap = new Map<string, Evidencia>();
    const seenPhotoFingerprints = new Set<string>();

    for (const item of allRecords) {
      if (!item || !item.id) continue;

      // 1. Skip if exact ID is already in map
      if (deduplicatedMap.has(item.id)) continue;

      // 2. Compute fingerprint to detect duplicate/triplicate photo captures
      let fingerprint = '';
      if (item.photoUrl && item.photoUrl.length > 50) {
        const len = item.photoUrl.length;
        const sample = item.photoUrl.slice(0, 80) + '_' + item.photoUrl.slice(Math.floor(len / 2), Math.floor(len / 2) + 80) + '_' + item.photoUrl.slice(-80);
        fingerprint = `${item.tipo || 'placa'}_${sample}`;
      } else {
        fingerprint = `${item.residenciaId}_${item.guardId}_${item.timestamp?.slice(0, 16)}_${item.placas}_${item.tipo}`;
      }

      if (seenPhotoFingerprints.has(fingerprint)) {
        continue;
      }

      seenPhotoFingerprints.add(fingerprint);
      deduplicatedMap.set(item.id, item);
    }

    const resultList = Array.from(deduplicatedMap.values()).sort(
      (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );

    // Save cleaned list back to LocalDB so stored duplicates are purged
    try {
      LocalDB.saveEvidencias(resultList);
    } catch {
      // Ignore cache errors
    }

    return resultList;
  },

  async createEvidencia(evidencia: Omit<Evidencia, 'id'>): Promise<Evidencia> {
    // 0. Deduplication check: verify if an identical photo or evidence was created within the last 15 seconds
    const existingList = LocalDB.getEvidencias();
    const nowTime = evidencia.timestamp ? new Date(evidencia.timestamp).getTime() : Date.now();

    const existingDuplicate = existingList.find(item => {
      if (!item) return false;

      // Exact photo match
      if (item.photoUrl && evidencia.photoUrl && item.photoUrl === evidencia.photoUrl) {
        return true;
      }

      // Near-identical photo fingerprint created within 15 seconds
      if (
        item.photoUrl && evidencia.photoUrl &&
        item.photoUrl.length > 50 && evidencia.photoUrl.length > 50 &&
        item.photoUrl.slice(0, 100) === evidencia.photoUrl.slice(0, 100) &&
        item.photoUrl.slice(-100) === evidencia.photoUrl.slice(-100) &&
        Math.abs(new Date(item.timestamp || 0).getTime() - nowTime) < 15000
      ) {
        return true;
      }

      return false;
    });

    if (existingDuplicate) {
      console.log('Duplicate evidencia capture ignored:', existingDuplicate.id);
      return existingDuplicate;
    }

    const id = 'evid_' + generateId();
    const newEvidencia: Evidencia = { ...evidencia, id };

    // 1. Save to LocalDB immediately to ensure zero UI delay or lost data
    try {
      const list = LocalDB.getEvidencias();
      list.unshift(newEvidencia);
      LocalDB.saveEvidencias(list);
    } catch (locErr) {
      console.warn('LocalDB saveEvidencias cache error:', locErr);
    }

    // 2. Perform background remote sync with a safety timeout so UI never freezes
    const remoteSync = async () => {
      const supabasePayload = {
        id: newEvidencia.id,
        residenciaId: newEvidencia.residenciaId || null,
        residenciaNombre: newEvidencia.residenciaNombre || null,
        casetaId: newEvidencia.casetaId || null,
        casetaNombre: newEvidencia.casetaNombre || null,
        guardId: newEvidencia.guardId || null,
        guardName: newEvidencia.guardName || null,
        photoUrl: newEvidencia.photoUrl,
        placas: newEvidencia.placas || '',
        timestamp: newEvidencia.timestamp,
        notas: newEvidencia.notas || '',
        tipo: newEvidencia.tipo || 'placa'
      };

      try {
        await robustSupabaseInsert('evidencias', supabasePayload);
      } catch (err) {
        console.warn('Supabase createEvidencia exception:', err);
      }

      if (!IS_FIREBASE_DUMMY) {
        try {
          const docRef = doc(db, 'evidencias', id);
          await setDoc(docRef, newEvidencia);
        } catch (err) {
          console.warn('Firestore setDoc evidencia warning:', err);
        }
      }
    };

    // Race remote sync with 1200ms timeout so UI response is crisp and never gets stuck
    await Promise.race([
      remoteSync(),
      new Promise((res) => setTimeout(res, 1200))
    ]);

    return newEvidencia;
  },

  async deleteEvidencia(id: string): Promise<void> {
    // 1. Remove from LocalDB
    try {
      const list = LocalDB.getEvidencias();
      const filtered = list.filter(e => e.id !== id);
      LocalDB.saveEvidencias(filtered);
    } catch (locErr) {
      console.warn('LocalDB deleteEvidencia error:', locErr);
    }

    // 2. Remove from Supabase
    try {
      const { error } = await supabase
        .from('evidencias')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase deleteEvidencia returned query error:', error);
      }
    } catch (err) {
      console.warn('Supabase deleteEvidencia exception:', err);
    }

    // 3. Remove from Firestore if configured
    if (!IS_FIREBASE_DUMMY) {
      try {
        const docRef = doc(db, 'evidencias', id);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('Firestore deleteDoc evidencia warning:', err);
      }
    }
  },

  // --------------------------------------------------
  // Alertas de Pánico Management (SOS / Panic Alerts)
  // --------------------------------------------------
  async getAlertasPanico(): Promise<AlertaPanico[]> {
    let resultList: AlertaPanico[] = [];

    // 1. Fetch directly from Supabase
    if (!supabaseRecursionBlocked) {
      try {
        const rawData = await robustSupabaseSelectAll('alertas_panico', 'createdAt');
        if (rawData && rawData.length > 0) {
          resultList = rawData.map(r => normalizeAlertaPanicoRow(r));
        }
      } catch (err) {
        console.warn('Supabase getAlertasPanico exception, using fallback:', err);
      }
    }

    // 2. LocalDB fallback / merge
    if (resultList.length === 0) {
      resultList = LocalDB.getAlertasPanico();
    } else {
      // Sync to LocalDB for instant offline availability
      try {
        LocalDB.saveAlertasPanico(resultList);
      } catch {
        // Ignore cache errors
      }
    }

    return resultList;
  },

  async createAlertaPanico(alerta: Omit<AlertaPanico, 'id'> & { id?: string }): Promise<AlertaPanico> {
    const id = alerta.id || ('panico_' + generateId());
    const newAlerta: AlertaPanico = {
      ...alerta,
      id,
      estado: alerta.estado || 'ACTIVA',
      createdAt: alerta.createdAt || new Date().toISOString()
    };

    // 1. Save to LocalDB immediately
    try {
      const list = LocalDB.getAlertasPanico();
      list.unshift(newAlerta);
      LocalDB.saveAlertasPanico(list);
    } catch (locErr) {
      console.warn('LocalDB saveAlertasPanico error:', locErr);
    }

    // 2. Background sync to Supabase
    const remoteSync = async () => {
      const supabasePayload = {
        id: newAlerta.id,
        residencia_id: newAlerta.residenciaId || null,
        residencia_nombre: newAlerta.residenciaNombre || null,
        usuario_id: newAlerta.usuarioId || null,
        usuario_nombre: newAlerta.usuarioNombre || 'Usuario',
        usuario_role: newAlerta.usuarioRole || 'residente',
        usuario_username: newAlerta.usuarioUsername || null,
        usuario_phone: newAlerta.usuarioPhone || null,
        usuario_email: newAlerta.usuarioEmail || null,
        direccion: newAlerta.direccion || null,
        latitude: newAlerta.latitude ?? null,
        longitude: newAlerta.longitude ?? null,
        google_maps_url: newAlerta.googleMapsUrl || null,
        estado: newAlerta.estado || 'ACTIVA',
        atendida_por: newAlerta.atendidaPor || null,
        atendida_at: newAlerta.atendidaAt || null,
        created_at: newAlerta.createdAt
      };

      try {
        await robustSupabaseInsert('alertas_panico', supabasePayload);
      } catch (err) {
        console.warn('Supabase createAlertaPanico exception:', err);
      }

      // Sync with Firestore if configured
      if (!IS_FIREBASE_DUMMY) {
        try {
          const docRef = doc(db, 'alertas_panico', newAlerta.id);
          await setDoc(docRef, newAlerta, { merge: true });
        } catch (fsErr) {
          console.warn('Firestore setDoc alerta_panico error:', fsErr);
        }
      }
    };

    remoteSync().catch(err => console.warn('Background alerta panico sync exception:', err));

    return newAlerta;
  },

  async updateAlertaPanico(id: string, updates: Partial<AlertaPanico>): Promise<void> {
    // 1. Update in LocalDB
    try {
      const list = LocalDB.getAlertasPanico();
      const updatedList = list.map(item => item.id === id ? { ...item, ...updates } : item);
      LocalDB.saveAlertasPanico(updatedList);
    } catch (locErr) {
      console.warn('LocalDB updateAlertaPanico error:', locErr);
    }

    // 2. Update in Supabase
    try {
      const snakeUpdates: any = {};
      if (updates.estado !== undefined) snakeUpdates.estado = updates.estado;
      if (updates.atendidaPor !== undefined) snakeUpdates.atendida_por = updates.atendidaPor;
      if (updates.atendidaAt !== undefined) snakeUpdates.atendida_at = updates.atendidaAt;

      await robustSupabaseUpdate('alertas_panico', snakeUpdates, 'id', id);
    } catch (err) {
      console.warn('Supabase updateAlertaPanico exception:', err);
    }

    // 3. Update in Firestore if configured
    if (!IS_FIREBASE_DUMMY) {
      try {
        const docRef = doc(db, 'alertas_panico', id);
        await setDoc(docRef, updates, { merge: true });
      } catch (err) {
        console.warn('Firestore updateAlertaPanico error:', err);
      }
    }
  },

  async deleteAlertaPanico(id: string): Promise<void> {
    // 1. Remove from LocalDB
    try {
      const list = LocalDB.getAlertasPanico();
      const filtered = list.filter(e => e.id !== id);
      LocalDB.saveAlertasPanico(filtered);
    } catch (locErr) {
      console.warn('LocalDB deleteAlertaPanico error:', locErr);
    }

    // 2. Remove from Supabase
    try {
      await supabase.from('alertas_panico').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteAlertaPanico exception:', err);
    }

    // 3. Remove from Firestore
    if (!IS_FIREBASE_DUMMY) {
      try {
        const docRef = doc(db, 'alertas_panico', id);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('Firestore deleteAlertaPanico error:', err);
      }
    }
  },

  clearSystemCache(): void {

    try {
      localStorage.clear();
      sessionStorage.clear();
      if (typeof window !== 'undefined' && 'caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      console.log('Caché local del navegador borrado exitosamente.');
    } catch (err) {
      console.error('Error al borrar el caché del sistema:', err);
    }
  }

};
