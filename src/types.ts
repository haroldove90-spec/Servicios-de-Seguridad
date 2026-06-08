/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
}

export enum SystemUserRole {
  ADMIN = 'admin',
  GUARD = 'guard',
  SUPERVISOR = 'supervisor',
  AUDITOR = 'auditor',
}

export enum LogType {
  CHECK_IN = 'check-in',
  CHECK_OUT = 'check-out',
}

export enum LogStatus {
  SUCCESS = 'success',
  REVOKED_USER = 'revoked_user',
  OUTSIDE_SCHEDULE = 'outside_schedule',
  ALREADY_USED = 'already_used',
  EXPIRED_TOKEN = 'expired_token',
}

export interface AuthorizedUser {
  id: string;
  name: string;
  documentId: string;
  email: string;
  phone: string;
  status: UserStatus;
  qrcodeToken: string;
  oneTime: boolean;
  used: boolean;
  validFrom: string; // ISO DateTime
  validUntil: string; // ISO DateTime
  days: number[]; // e.g [1, 2, 3, 4, 5] (1=Mon, ..., 7=Sun or 0=Sun depending on date implementation, we will use standard: 0=Sunday, 1=Monday... 6=Saturday)
  startTime: string; // "08:00"
  endTime: string; // "18:00"
  createdAt: string; // ISO DateTime
  updatedAt: string; // ISO DateTime
  createdBy: string; // Admin UID
  residenciaId?: string; // Target residence ID
  residenciaNombre?: string; // Target residence name
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  documentId: string;
  timestamp: string; // ISO DateTime
  type: LogType;
  status: LogStatus;
  guardId: string;
  guardName: string;
}

export interface SystemRole {
  uid: string;
  email: string;
  name: string;
  role: SystemUserRole;
  createdAt: string; // ISO DateTime
  phone?: string;
  password?: string;
  isActive?: boolean;
}

export interface Residencia {
  id: string;
  nombre: string;
  administrador: string;
  numResidencias: number;
  isActive: boolean;
  createdAt: string; // ISO DateTime
  updatedAt: string; // ISO DateTime
}

export interface Residente {
  id: string;
  nombre: string;
  residenciaId: string;
  residenciaNombre: string;
  direccion: string;
  qrcodeToken: string;
  whatsapp?: string; // Optional WhatsApp phone number
  accessUserId?: string; // Optional linked AuthorizedUser id
  validUntil?: string; // Optional validity duration datetime
  createdAt: string; // ISO DateTime
  updatedAt: string; // ISO DateTime
}

export interface Caseta {
  id: string;
  nombre: string;
  residenciaId: string;
  residenciaNombre: string;
  isActive: boolean;
  createdAt: string; // ISO DateTime
  updatedAt: string; // ISO DateTime
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}
