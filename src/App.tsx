/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  ShieldAlert, ScanLine, Users, FileBarChart2, Shield, LogOut, Check, Sparkles, 
  Database, AlertCircle, Key, Lock, Laptop, CheckCircle2, UserCircle, ShieldCheck 
} from 'lucide-react';
import { auth, IS_FIREBASE_DUMMY } from './firebase';
import { dbService } from './services/dbService';
import { SystemUserRole, SystemRole, AccessLog } from './types';
import ScannerInterface from './components/ScannerInterface';
import AdminDashboard from './components/AdminDashboard';
import AuditLogs from './components/AuditLogs';
import RolesManager from './components/RolesManager';

export default function App() {
  // Authentication states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<SystemRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Preview Mode Sandbox simulation controls
  const [demoRole, setDemoRole] = useState<SystemUserRole>(SystemUserRole.ADMIN);
  const [demoName, setDemoName] = useState<string>('Software AI Admin');

  // Master Access logs (cached/shared states)
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'scan' | 'crud' | 'reports' | 'roles'>('scan');

  // Load audit trail logs
  const reloadAccessLogs = () => {
    dbService.getAccessLogs().then((logs) => {
      setAccessLogs(logs);
    });
  };

  // Listen to Auth State
  useEffect(() => {
    if (IS_FIREBASE_DUMMY) {
      // Seed sandbox role simulated details
      const mockRoleRecord: SystemRole = {
        uid: 'admin-demo-uid',
        name: demoName,
        email: 'softwareai569@gmail.com',
        role: demoRole,
        createdAt: new Date().toISOString()
      };
      setUserRole(mockRoleRecord);
      setLoading(false);
      reloadAccessLogs();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Fetch current system authorization level (RBAC)
        let roleSnap = await dbService.getSystemRole(firebaseUser.uid);
        
        // BOOTSTRAP MASTER INVARIANT: If this database has no users configured yet,
        // we automatically register the first logger as an Active Admin to prevent developer lockout!
        if (!roleSnap) {
          const allRoles = await dbService.getAllSystemRoles();
          const targetRole = allRoles.length === 0 ? SystemUserRole.ADMIN : SystemUserRole.GUARD;
          
          const newRole: SystemRole = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Personal de Turno',
            role: targetRole,
            createdAt: new Date().toISOString()
          };
          await dbService.saveSystemRole(newRole);
          roleSnap = newRole;
        }

        setUserRole(roleSnap);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
      reloadAccessLogs();
    });

    return () => unsubscribe();
  }, [demoRole, demoName]);

  // Sync logs whenever a scanning occurs
  const handleLogsUpdated = () => {
    reloadAccessLogs();
  };

  // Google Sign-In Popup handler
  const handleGoogleSignIn = async () => {
    if (IS_FIREBASE_DUMMY) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Login Error: ', err);
      alert('Error al autenticar: Por favor use la ventana popup de Google.');
    }
  };

  // User Signs Out
  const handleSignOut = async () => {
    if (IS_FIREBASE_DUMMY) return;
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Signout Error: ', err);
    }
  };

  // Compute authorized status
  const isAdmin = userRole?.role === SystemUserRole.ADMIN;
  const isSupervisor = userRole?.role === SystemUserRole.SUPERVISOR;
  const isAuditor = userRole?.role === SystemUserRole.AUDITOR;
  const isGuard = userRole?.role === SystemUserRole.GUARD;

  const canScan = isAdmin || isSupervisor || isGuard;
  const canCrud = isAdmin || isSupervisor;
  const canReports = isAdmin || isSupervisor || isGuard || isAuditor;
  const canManageRoles = isAdmin;

  // Gracefully redirect the user if they simulation-switch roles and lose tab privilege
  useEffect(() => {
    if (!userRole) return;
    const current = activeTab;
    if (current === 'scan' && !canScan) {
      if (canCrud) setActiveTab('crud');
      else if (canReports) setActiveTab('reports');
    } else if (current === 'crud' && !canCrud) {
      if (canScan) setActiveTab('scan');
      else if (canReports) setActiveTab('reports');
    } else if (current === 'reports' && !canReports) {
      if (canScan) setActiveTab('scan');
      else if (canCrud) setActiveTab('crud');
    } else if (current === 'roles' && !canManageRoles) {
      if (canScan) setActiveTab('scan');
      else if (canCrud) setActiveTab('crud');
      else setActiveTab('reports');
    }
  }, [userRole, activeTab, canScan, canCrud, canReports, canManageRoles]);

  if (loading) {
    return (
      <div id="full-viewport-spinner" className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-4">Restaurando Credenciales de Acceso...</p>
      </div>
    );
  }

  return (
    <div id="integrated-app-root" className="min-h-screen bg-[#020617] text-slate-200 font-sans flex flex-col justify-between">
      <div>
        {/* Dynamic Warning Notification Banner for Placeholder preview configurations */}
        {IS_FIREBASE_DUMMY && (
          <div id="development-alert-ribbon" className="bg-indigo-600/90 text-white text-xs px-4 py-3 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-indigo-500/20 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-200 animate-pulse" />
              <p className="leading-relaxed">
                <span className="font-bold">⚡ MODO PREVIEW LOCAL:</span> Base de datos simulada en navegador activa. Haz clic en <span className="bg-white/15 px-1 py-0.5 rounded font-mono">Accept Terms</span> en el panel del editor para sincronizar Cloud Firestore con seguridad ABAC.
              </p>
            </div>
            
            {/* Quick switcher during sandboxed testing */}
            <div id="live-role-sim-sandbox" className="flex items-center gap-1.5 self-start sm:self-center bg-indigo-950/60 p-0.5 rounded-lg border border-indigo-500/30 shadow-inner">
              <span className="text-[10px] uppercase font-bold text-indigo-200 px-2">Simular Rol:</span>
              <button
                id="select-sim-role-admin"
                onClick={() => {
                  setDemoRole(SystemUserRole.ADMIN);
                  setDemoName('Software AI Admin');
                }}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${
                  demoRole === SystemUserRole.ADMIN 
                    ? 'bg-white text-gray-950' 
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                Director Admin
              </button>
              <button
                id="select-sim-role-guard"
                onClick={() => {
                  setDemoRole(SystemUserRole.GUARD);
                  setDemoName('Guardia Pérez');
                }}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${
                  demoRole === SystemUserRole.GUARD 
                    ? 'bg-white text-gray-950' 
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                Guardia de Control
              </button>
            </div>
          </div>
        )}

        {/* Real Authenticated Mode Role Alert (Missing access role) */}
        {!IS_FIREBASE_DUMMY && !user && (
          <div id="db-active-auth-barrier" className="max-w-md mx-auto my-16 bg-[#0f172a] border border-[#1e293b] rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
              <Lock className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Acceso Restringido Control QR</h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-2.5 px-4 mb-8">
              Inicia sesión con tu cuenta de correo autorizada como Administrador o Guardia de Control de Seguridad para registrar pases públicos y realizar escaneos.
            </p>
            <button
              id="google-authenticate-trigger"
              onClick={handleGoogleSignIn}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-2xl transition shadow-lg shadow-indigo-600/30"
            >
              Sign In with Google Account
            </button>
            
            <div className="border-t border-[#1e293b] pt-6 mt-8 flex items-center justify-center gap-2 text-[10.5px] text-slate-500">
              <Laptop className="w-4 h-4 text-slate-600" />
              <span>Sincronizado vía Cloud Run y Google Firebase</span>
            </div>
          </div>
        )}

        {/* Primary Operational workspace */}
        {(IS_FIREBASE_DUMMY || user) && (
          <div id="dashboard-workspace-cabinet" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* Header section */}
            <div id="premises-dashboard-header" className="flex flex-col md:flex-row md:items-center md:justify-between bg-slate-900/50 p-5 rounded-2xl border border-slate-800 gap-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Seguridad &amp; Premises Access Control</span>
                </div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">Control de Acceso QR</h1>
              </div>

              {/* Connected Account status card */}
              <div id="authentication-status-badge" className="flex items-center gap-3 bg-[#0f172a] border border-[#1e293b] p-2.5 rounded-2xl shadow-md self-start">
                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs">
                  {userRole?.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-200 leading-none">{userRole?.name}</p>
                  <p className="text-[10px] text-slate-400 leading-none mt-1.5 uppercase font-semibold">
                    Rol: {userRole?.role === SystemUserRole.ADMIN 
                      ? 'Director Admin 🛡️' 
                      : userRole?.role === SystemUserRole.SUPERVISOR 
                      ? 'Supervisor Turno ⚡' 
                      : userRole?.role === SystemUserRole.AUDITOR 
                      ? 'Auditor Cumplimiento 🔍' 
                      : 'Guardia de Acceso 👮'}
                  </p>
                </div>
                
                {/* Signout button */}
                {!IS_FIREBASE_DUMMY && user && (
                  <button
                    id="auth-signout-trigger-btn"
                    onClick={handleSignOut}
                    className="ml-2 p-1.5 bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-lg transition"
                    title="Cerrar Sesión"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Tabs bar */}
            <div id="workspace-tabs-menu" className="flex border-b border-slate-800 pb-px flex-wrap gap-y-2">
              {canScan && (
                <button
                  id="nav-tab-scan"
                  onClick={() => setActiveTab('scan')}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === 'scan'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ScanLine className="w-4 h-4" /> Escaneo de Guardia
                </button>
              )}

              {canCrud && (
                <button
                  id="nav-tab-crud"
                  onClick={() => setActiveTab('crud')}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === 'crud'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" /> Gestión Autorizados (CRUD)
                </button>
              )}

              {canReports && (
                <button
                  id="nav-tab-reports"
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === 'reports'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileBarChart2 className="w-4 h-4" /> Historial y Reportes
                </button>
              )}

              {canManageRoles && (
                <button
                  id="nav-tab-roles"
                  onClick={() => setActiveTab('roles')}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === 'roles'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Shield className="w-4 h-4" /> Roles de Sistema
                </button>
              )}
            </div>

            {/* Tab Views routers */}
            <div id="workspace-routed-frame" className="animate-fade-in-up">
              {activeTab === 'scan' && canScan && (
                <ScannerInterface 
                  currentGuard={userRole ? { uid: userRole.uid, name: userRole.name } : null} 
                  onScanLogged={handleLogsUpdated} 
                />
              )}

              {activeTab === 'crud' && canCrud && (
                <AdminDashboard 
                  onUsersUpdated={handleLogsUpdated} 
                />
              )}

              {activeTab === 'reports' && canReports && (
                <AuditLogs 
                  logs={accessLogs} 
                  onRefresh={reloadAccessLogs} 
                />
              )}

              {activeTab === 'roles' && canManageRoles && (
                <RolesManager 
                  onRolesUpdated={reloadAccessLogs} 
                  currentUserId={userRole?.uid}
                  onSimulateRole={(role, name) => {
                    setDemoRole(role);
                    setDemoName(name);
                  }}
                  activeSimulatedRole={demoRole}
                />
              )}
            </div>

          </div>
        )}
      </div>

      {/* Styled Footer */}
      <footer id="app-footer-bar" className="bg-[#0f172a]/40 border-t border-slate-900 py-6 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-semibold text-slate-400 tracking-tight">Sistemas Inteligentes de Control QR © 2026</p>
          <div className="flex items-center gap-4 text-slate-500 font-mono text-[10.5px]">
            <span>Cloud Sync: OK</span>
            <span>ID: FCE82F95</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
