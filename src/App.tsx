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
  Database, AlertCircle, Key, Lock, Laptop, CheckCircle2, UserCircle, ShieldCheck,
  QrCode, Smartphone, ExternalLink, HelpCircle, RefreshCw, ChevronDown, ChevronUp,
  Copy, Download, Clock as ClockIcon, AlertTriangle
} from 'lucide-react';
import { auth, IS_FIREBASE_DUMMY } from './firebase';
import { dbService } from './services/dbService';
import { SystemUserRole, SystemRole, AccessLog } from './types';
import ScannerInterface from './components/ScannerInterface';
import AdminDashboard from './components/AdminDashboard';
import AuditLogs from './components/AuditLogs';
import RolesManager from './components/RolesManager';
import QRCode from 'qrcode';

export default function App() {
  // Authentication states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<SystemRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Preview Mode Sandbox simulation controls
  const [demoRole, setDemoRole] = useState<SystemUserRole>(SystemUserRole.ADMIN);
  const [demoName, setDemoName] = useState<string>('Software AI Admin');

  // Interactive Demo & Virtual Mobile Pass Wallet states
  const [showDemoGuide, setShowDemoGuide] = useState<boolean>(true);
  const [showVirtualPhone, setShowVirtualPhone] = useState<boolean>(false);
  const [virtualPhoneUser, setVirtualPhoneUser] = useState<any | null>(null);
  const [virtualPhoneQR, setVirtualPhoneQR] = useState<string>('');
  const [demoFeedback, setDemoFeedback] = useState<string>('');
  const [visitorsList, setVisitorsList] = useState<any[]>([]);

  // Public visitor pass page variables (if opened with ?pass=TOKEN URL parameter)
  const [visitorPassToken, setVisitorPassToken] = useState<string | null>(null);
  const [visitorPassUser, setVisitorPassUser] = useState<any | null>(null);
  const [visitorPassQRUrl, setVisitorPassQRUrl] = useState<string>('');
  const [visitorPassLoading, setVisitorPassLoading] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  // Master Access logs (cached/shared states)
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'scan' | 'crud' | 'reports' | 'roles'>('scan');
  const [hasSelectedRole, setHasSelectedRole] = useState<boolean>(false);

  // Helper to choose active dashboard role and set appropriate tab
  const handleRoleSelection = (role: SystemUserRole, nameSimulated: string, defaultTab: 'scan' | 'crud' | 'reports' | 'roles') => {
    setDemoRole(role);
    setDemoName(nameSimulated);
    
    if (IS_FIREBASE_DUMMY) {
      setUserRole({
        uid: 'admin-demo-uid',
        name: nameSimulated,
        email: 'softwareai569@gmail.com',
        role: role,
        createdAt: new Date().toISOString()
      });
    } else if (user) {
      setUserRole({
        uid: user.uid,
        name: user.displayName || nameSimulated,
        email: user.email || 'user@example.com',
        role: role,
        createdAt: new Date().toISOString()
      });
    }
    setActiveTab(defaultTab);
    setHasSelectedRole(true);
  };

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

  // 1. Detect if a visitor pass was opened in the URL (e.g. ?pass=qrpass_abc or #pass=qrpass_abc)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    let token = params.get('pass') || params.get('token');
    if (!token && hash.startsWith('#pass=')) {
      token = hash.replace('#pass=', '');
    } else if (!token && hash.startsWith('#token=')) {
      token = hash.replace('#token=', '');
    }

    if (token) {
      setVisitorPassToken(token);
      setVisitorPassLoading(true);
      dbService.getAuthorizedUsers().then((users) => {
        const found = users.find(u => u.qrcodeToken === token);
        if (found) {
          setVisitorPassUser(found);
          // Generate high quality QR code for public phone rendering
          QRCode.toDataURL(token, {
            width: 310,
            margin: 2,
            color: {
              dark: '#0f172a',  // slate-900
              light: '#ffffff'  // white
            }
          }).then(url => {
            setVisitorPassQRUrl(url);
            setVisitorPassLoading(false);
          }).catch(err => {
            console.error('Pase QR failed', err);
            setVisitorPassLoading(false);
          });
        } else {
          setVisitorPassLoading(false);
        }
      });
    }
  }, []);

  // 2. Load the list of registered visitors for simulated virtual mobile phone selecting
  const loadVisitorsForPhoneList = () => {
    dbService.getAuthorizedUsers().then(users => {
      setVisitorsList(users);
      if (users.length > 0 && !virtualPhoneUser) {
        setVirtualPhoneUser(users[0]);
      }
    });
  };

  useEffect(() => {
    loadVisitorsForPhoneList();
  }, [accessLogs]);

  // 3. Keep virtual phone QR updated
  useEffect(() => {
    if (virtualPhoneUser) {
      QRCode.toDataURL(virtualPhoneUser.qrcodeToken, {
        width: 250,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).then(url => {
        setVirtualPhoneQR(url);
      }).catch(err => console.error(err));
    } else {
      setVirtualPhoneQR('');
    }
  }, [virtualPhoneUser]);

  // 4. Instantly create designated mock visitor statuses for demo walk-throughs
  const handleCreateDemoPass = async (type: 'active' | 'expired' | 'suspended' | 'onetime_used') => {
    setDemoFeedback('Inyectando pase de prueba...');
    try {
      let payload: any = {
        name: '',
        documentId: '',
        email: '',
        phone: '',
        status: 'active',
        oneTime: false,
        used: false,
        startTime: '08:00',
        endTime: '18:00',
        days: []
      };

      if (type === 'active') {
        payload.name = 'Andrés Domínguez (Pase Activo)';
        payload.documentId = '44555666-X';
        payload.email = 'andres@ejemplo.com';
        payload.phone = '+56 9 9900 1122';
        // Active dates range
        payload.validFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        payload.validUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
        payload.status = 'active';
      } else if (type === 'expired') {
        payload.name = 'Sonia Riquelme (Pase Caducado)';
        payload.documentId = '55666777-Y';
        payload.email = 'sonia@ejemplo.com';
        payload.phone = '+56 9 8812 3456';
        // Past dates range
        payload.validFrom = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
        payload.validUntil = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        payload.status = 'expired';
      } else if (type === 'suspended') {
        payload.name = 'Mariano Costa (Pase Suspendido)';
        payload.documentId = '66777888-Z';
        payload.email = 'mariano@ejemplo.com';
        payload.phone = '+56 9 7711 2233';
        payload.validFrom = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
        payload.validUntil = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
        payload.status = 'suspended';
      } else if (type === 'onetime_used') {
        payload.name = 'Inés Valenzuela (Pase Único - Usado)';
        payload.documentId = '77888999-W';
        payload.email = 'ines@ejemplo.com';
        payload.phone = '+56 9 6633 4455';
        payload.validFrom = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
        payload.validUntil = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
        payload.status = 'active';
        payload.oneTime = true;
        payload.used = true;
      }

      const secureToken = 'qrpass_' + type + '_' + Math.random().toString(36).substring(2, 8);
      const created = await dbService.createAuthorizedUser({
        ...payload,
        qrcodeToken: secureToken,
        createdAt: new Date().toISOString(),
        createdBy: 'admin-demo-uid'
      });

      setVirtualPhoneUser(created);
      setShowVirtualPhone(true);
      setDemoFeedback(`✓ Registrado "${created.name}" exitosamente.`);
      reloadAccessLogs();
      setTimeout(() => setDemoFeedback(''), 4500);
    } catch (e) {
      console.error(e);
      setDemoFeedback('Error al inyectar pase de prueba.');
    }
  };

  // 5. Instantly route to guard scanner and execute high fidelity mock verification
  const handleSimulateScanDirect = (token: string) => {
    setDemoFeedback('Transmitiendo pase al escáner de la caseta...');
    setActiveTab('scan');
    setTimeout(() => {
      const event = new CustomEvent('simulate-qr-scan', { detail: token });
      window.dispatchEvent(event);
      setDemoFeedback('✓ Pase escaneado directamente por el guardia.');
      setTimeout(() => setDemoFeedback(''), 3000);
    }, 150);
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

  // Render standalone high-fidelity mobile visitor passport card if opened with public URL
  if (visitorPassToken) {
    return (
      <div id="visitor-passport-viewport" className="min-h-screen bg-[#020617] text-slate-200 font-sans flex items-center justify-center p-4 selection:bg-indigo-500/30">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
          
          {/* Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
          
          {/* Card Top Title Banner */}
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-indigo-400 tracking-widest mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pase Electrónico de Entrada</span>
          </div>

          {visitorPassLoading ? (
            <div className="py-20 flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-xs text-slate-400">Verificando pase público...</p>
            </div>
          ) : visitorPassUser ? (
            <>
              {/* Visitor Wallet View */}
              <div className="w-full bg-[#0b0f19] rounded-2xl p-4 border border-slate-800/80 mb-5 relative">
                {/* Floating status badge */}
                <span className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  visitorPassUser.status === 'active' && (!visitorPassUser.oneTime || !visitorPassUser.used)
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}>
                  {visitorPassUser.status === 'active' && (!visitorPassUser.oneTime || !visitorPassUser.used) ? 'VÁLIDO ✅' : 'INVÁLIDO 🚫'}
                </span>

                <div className="w-12 h-12 bg-indigo-600/15 border border-indigo-500/20 rounded-full flex items-center justify-center mb-4">
                  <UserCircle className="w-6 h-6 text-indigo-400" />
                </div>

                <h3 className="text-lg font-extrabold text-white leading-tight">{visitorPassUser.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">ID: {visitorPassUser.documentId}</p>

                {/* Verification alerts */}
                {visitorPassUser.oneTime && (
                  <div className="mt-3 text-[10px] bg-amber-500/10 text-amber-300 px-2.5 py-1.5 rounded-lg border border-amber-500/20 font-medium inline-block">
                    {visitorPassUser.used ? '⚠️ Pase Único: Ya Canjeado' : '⚡ Pase Único (Un solo uso)'}
                  </div>
                )}
              </div>

              {/* QR Image rendering box */}
              <div className="bg-white p-4.5 rounded-2xl shadow-xl shadow-black/80 inline-block border-2 border-slate-800 mt-2">
                {visitorPassQRUrl ? (
                  <img 
                    src={visitorPassQRUrl} 
                    alt="Pase de Acceso QR" 
                    className="w-48 h-48 block"
                    referrerPolicy="referrer"
                  />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 animate-pulse rounded flex items-center justify-center text-slate-400 text-xs">Cargando código...</div>
                )}
              </div>

              <div className="mt-5 text-slate-500 font-mono text-[10px] select-all bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800/80">
                Pase Token: {visitorPassUser.qrcodeToken}
              </div>

              {/* Instructions */}
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mt-6">
                Presenta este código QR frente al lector del guardia o cámara frontal para verificar tu autorización de acceso en portería.
              </p>

              {/* Demo Simulate buttons */}
              <div className="w-full border-t border-slate-800 pt-5 mt-6 flex flex-col gap-2 font-sans">
                <button
                  id="simulate-scan-from-pass-view"
                  onClick={() => {
                    handleSimulateScanDirect(visitorPassUser.qrcodeToken);
                    alert('¡Simulando escaneo! Revisa la pestaña del Guardia para ver que el pase ya fue validado e ingresado.');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-lg transition cursor-pointer"
                >
                  <ScanLine className="w-4 h-4" /> Simular Escaneo en Caseta
                </button>
                <button
                  id="nav-to-dashboard-from-pass"
                  onClick={() => {
                    // Wipe token parameter from URL & reset view
                    const nextUrl = window.location.origin + window.location.pathname;
                    window.history.pushState({}, '', nextUrl);
                    setVisitorPassToken(null);
                    setVisitorPassUser(null);
                  }}
                  className="w-full text-slate-400 hover:text-white font-medium text-xs py-2 transition cursor-pointer"
                >
                  Volver al Panel de Control de Seguridad 🛡️
                </button>
              </div>
            </>
          ) : (
            <div className="py-8">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
              <h3 className="text-md font-bold text-white">Token de Pase Desconocido</h3>
              <p className="text-xs text-slate-400 mt-2 px-4 leading-relaxed">
                Este token no corresponde a ningún visitante autorizado en nuestra base de datos. Pide al administrador registrar tu acceso.
              </p>
              <button
                id="reset-url-pass-expired"
                onClick={() => {
                  const nextUrl = window.location.origin + window.location.pathname;
                  window.history.pushState({}, '', nextUrl);
                  setVisitorPassToken(null);
                }}
                className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Volver al Panel Principal
              </button>
            </div>
          )}
          
          <div className="text-[9px] text-slate-500 font-mono mt-8">
            © 2026 QR Premises Security
          </div>
        </div>
      </div>
    );
  }

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
            <div id="live-role-sim-sandbox" className="flex items-center gap-1.5 self-start sm:self-center bg-[#070b13]/90 p-1 rounded-lg border border-slate-800 shadow-inner flex-wrap">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 px-2">Demo:</span>
              <button
                id="select-sim-role-admin"
                onClick={() => {
                  setDemoRole(SystemUserRole.ADMIN);
                  setDemoName('Director Admin (Simulado)');
                  setHasSelectedRole(true);
                  setActiveTab('crud');
                }}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                  hasSelectedRole && demoRole === SystemUserRole.ADMIN 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                🛠️ Admin
              </button>
              <button
                id="select-sim-role-supervisor"
                onClick={() => {
                  setDemoRole(SystemUserRole.SUPERVISOR);
                  setDemoName('Supervisor de Turno (Simulado)');
                  setHasSelectedRole(true);
                  setActiveTab('crud');
                }}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                  hasSelectedRole && demoRole === SystemUserRole.SUPERVISOR 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                ⚡ Supervisor
              </button>
              <button
                id="select-sim-role-guard"
                onClick={() => {
                  setDemoRole(SystemUserRole.GUARD);
                  setDemoName('Guardia Pérez (Simulado)');
                  setHasSelectedRole(true);
                  setActiveTab('scan');
                }}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                  hasSelectedRole && demoRole === SystemUserRole.GUARD 
                    ? 'bg-sky-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                👮 Guardia
              </button>
              <button
                id="select-sim-role-auditor"
                onClick={() => {
                  setDemoRole(SystemUserRole.AUDITOR);
                  setDemoName('Auditor de Calidad (Simulado)');
                  setHasSelectedRole(true);
                  setActiveTab('reports');
                }}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                  hasSelectedRole && demoRole === SystemUserRole.AUDITOR 
                    ? 'bg-amber-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                🔍 Auditor
              </button>
              <div className="h-4 w-px bg-slate-800 mx-1"></div>
              <button
                id="select-sim-back-home"
                onClick={() => setHasSelectedRole(false)}
                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md transition cursor-pointer ${
                  !hasSelectedRole 
                    ? 'bg-white text-slate-900 border border-transparent' 
                    : 'text-indigo-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                🏠 Selector Home
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

        {/* Main Welcome Gateway Role Selector (Home screen) */}
        {(IS_FIREBASE_DUMMY || user) && !hasSelectedRole && (
          <div id="premises-role-selector-home" className="max-w-5xl mx-auto px-4 mt-8 sm:mt-16 mb-24 animate-fade-in text-center font-sans">
            
            {/* Header / Subdued upper banner */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-[11px] font-bold uppercase tracking-widest mb-6">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>TERMINAL DE SEGURIDAD PREMISE CONTROL</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-none mb-4 animate-fade-in">
              Portal de Control de Acceso QR
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12 animate-fade-in">
              Bienvenido al sistema inteligente de gestión de pases y verificación de ingresos. Selecciona el módulo especializado de un rol para acceder a su panel de control independiente.
            </p>

            {/* Roles Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              
              {/* CARD 1: ADMIN */}
              <div 
                id="role-gateway-card-admin"
                onClick={() => handleRoleSelection(SystemUserRole.ADMIN, 'Director Admin (Simulado)', 'crud')}
                className="group relative bg-[#0f172a]/95 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full group-hover:bg-indigo-500/10 transition"></div>
                
                <div>
                  <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition shrink-0">
                    <Shield className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white group-hover:text-indigo-400 transition">
                    Director Administrador
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                    Módulo de administración principal. Permite dar de alta, de baja o actualizar visitantes autorizados (CRUD), gestionar y revocar credenciales, crear pases temporales de un solo uso, administrar roles de sistema y auditar la bitácora de eventos.
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between font-sans">
                  <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase group-hover:translate-x-1 transition-all">Acceder al Panel Admin →</span>
                  <span className="text-[9px] bg-indigo-500/15 text-indigo-300 font-mono px-2 py-0.5 rounded-full uppercase">Control Total</span>
                </div>
              </div>

              {/* CARD 2: SUPERVISOR */}
              <div 
                id="role-gateway-card-supervisor"
                onClick={() => handleRoleSelection(SystemUserRole.SUPERVISOR, 'Supervisor de Turno (Simulado)', 'crud')}
                className="group relative bg-[#0f172a]/95 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full group-hover:bg-emerald-500/10 transition"></div>
                
                <div>
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white group-hover:text-emerald-400 transition">
                    Supervisor de Turno
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                    Módulo de asistencia y monitoreo de credenciales de portería. Permite registrar o inspeccionar pases de visitantes activos, actualizar registros, monitorear el flujo de accesos reales y gestionar incidencias técnicas.
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between font-sans">
                  <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase group-hover:translate-x-1 transition-all">Acceder como Supervisor →</span>
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-300 font-mono px-2 py-0.5 rounded-full uppercase">Gestión &amp; Monitoreo</span>
                </div>
              </div>

              {/* CARD 3: GUARD */}
              <div 
                id="role-gateway-card-guard"
                onClick={() => handleRoleSelection(SystemUserRole.GUARD, 'Guardia Pérez (Simulado)', 'scan')}
                className="group relative bg-[#0f172a]/95 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-3xl p-6 shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl rounded-full group-hover:bg-sky-500/10 transition"></div>
                
                <div>
                  <div className="w-12 h-12 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition shrink-0">
                    <ScanLine className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white group-hover:text-sky-400 transition">
                    Guardia de Caseta (Portería)
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                    Terminal directo del lector QR. Activa la cámara para realizar el escaneo instantáneo y validación horaria de pases. Emite alertas audibles/visuales ante pases vencidos o suspendidos para autorizar el ingreso seguro de vehículos y personas.
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between font-sans">
                  <span className="text-[10px] font-bold text-sky-400 tracking-wider uppercase group-hover:translate-x-1 transition-all">Ingresar a Caseta →</span>
                  <span className="text-[9px] bg-sky-500/15 text-sky-300 font-mono px-2 py-0.5 rounded-full uppercase">Terminal Escáner</span>
                </div>
              </div>

              {/* CARD 4: AUDITOR */}
              <div 
                id="role-gateway-card-auditor"
                onClick={() => handleRoleSelection(SystemUserRole.AUDITOR, 'Auditor de Calidad (Simulado)', 'reports')}
                className="group relative bg-[#0f172a]/95 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full group-hover:bg-amber-500/10 transition"></div>
                
                <div>
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition shrink-0">
                    <FileBarChart2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white group-hover:text-amber-400 transition">
                    Auditor de Cumplimiento
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                    Módulo de reportería histórica y cumplimiento operacional. Proporciona visualización y filtros del historial completo de accesos registrados por todos los guardias, exportación de registros a CSV y PDF, y métricas.
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between font-sans">
                  <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase group-hover:translate-x-1 transition-all">Ingresar a Auditoría →</span>
                  <span className="text-[9px] bg-amber-500/15 text-amber-300 font-mono px-2 py-0.5 rounded-full uppercase">Visor Histórico</span>
                </div>
              </div>

            </div>

            {/* Quick Helper Info */}
            <div className="mt-16 p-6 bg-[#0f172a]/60 rounded-2xl border border-slate-800 max-w-2xl mx-auto text-left flex items-start gap-4 font-sans">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">¿Cómo funciona la simulación?</h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  Esta pantalla representa la separación de dashboards según el perfil de seguridad del usuario. Al presionar una opción, la plataforma adoptará temporalmente dicho perfil de privilegios y adaptará los menús correspondientes. Puedes presionar <strong>"Cambiar de Rol"</strong> dentro de la plataforma para volver a esta pantalla principal en cualquier momento.
                </p>
              </div>
            </div>

            {/* Signout of platform option (for real Firebase accounts) */}
            {!IS_FIREBASE_DUMMY && user && (
              <button
                id="home-selector-signout-google"
                onClick={handleSignOut}
                className="mt-8 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white transition duration-200 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Desconectarte de la cuenta Google ({user.email})
              </button>
            )}

          </div>
        )}

        {/* Primary Operational workspace */}
        {(IS_FIREBASE_DUMMY || user) && hasSelectedRole && (
          <div id="dashboard-workspace-cabinet" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
            
            {/* Header section */}
            <div id="premises-dashboard-header" className="flex flex-col md:flex-row md:items-center md:justify-between bg-slate-900/50 p-5 rounded-2xl border border-slate-800 gap-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>PREMISES ACCESS CONTROL  —  DASHBOARD {userRole?.role === SystemUserRole.ADMIN 
                    ? 'ADMINISTRATOR' 
                    : userRole?.role === SystemUserRole.SUPERVISOR 
                    ? 'SUPERVISOR' 
                    : userRole?.role === SystemUserRole.AUDITOR 
                    ? 'AUDITOR CUMPLIMIENTO' 
                    : 'GUARDIA DE SEGURIDAD'}</span>
                </div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">Control de Acceso QR</h1>
              </div>

              {/* Connected Account status card & Exit/Switch Controls */}
              <div className="flex flex-wrap items-center gap-3">
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
                      className="ml-2 p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-705 rounded-lg transition cursor-pointer text-xs"
                      title="Cerrar de Sesión"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Switch / Change Role dashboard exit trigger requested by user */}
                <button
                  id="btn-logout-role-to-home"
                  onClick={() => setHasSelectedRole(false)}
                  className="flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-500/25 px-4 py-2.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer shadow-lg shadow-black/30"
                  title="Salir de esta vista y volver al portal de roles"
                >
                  <LogOut className="w-4 h-4 text-rose-450" />
                  <span>Cerrar Módulo / Salir</span>
                </button>
              </div>

            </div>

            {/* COLLAPSIBLE DEMO PLAYGROUND & CLIENT WALKTHROUGH BOX */}
            <div id="demo-playground-panel" className="bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <button 
                onClick={() => setShowDemoGuide(!showDemoGuide)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-900/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                      Consola de Pruebas &amp; Guía de Demostración
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-mono tracking-wider px-2 py-0.5 rounded-full uppercase">PILOTO DEMO ACTIVO</span>
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">Utiliza este módulo de control para simular lecturas y validar accesos ante tu cliente en 1 clic.</p>
                  </div>
                </div>
                <div className="text-slate-400 p-1.5 hover:text-white transition">
                  {showDemoGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showDemoGuide && (
                <div className="p-6 border-t border-slate-800/60 bg-[#070b13]/80 space-y-6">
                  {/* Grid of instructions and quick-triggers */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                    
                    {/* Column 1: Core Quick Info / Requisitos */}
                    <div className="space-y-3 bg-slate-900/30 p-4 border border-slate-800/40 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
                          <HelpCircle className="w-4 h-4 text-indigo-400" />
                          <span>Requisitos de Cámara</span>
                        </div>
                        <p className="text-[11px] text-slate-450 leading-relaxed">
                          Si tu cliente desea probar el escaneo usando su <strong>cámara web</strong> o <strong>cámara del celular</strong>, debe conceder accesos de cámara en el navegador. Las directivas ya están activas en <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300 font-mono">metadata.json</code>.
                        </p>
                      </div>
                      <div className="space-y-1.5 border-t border-slate-805 pt-3">
                        <span className="flex items-center gap-2 text-[10.5px] text-slate-400">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Permisos Frame: camera (Activo)
                        </span>
                        <span className="flex items-center gap-2 text-[10.5px] text-slate-400">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Enlace móvil autogenerado
                        </span>
                      </div>
                    </div>

                    {/* Column 2: Seeder Triggers */}
                    <div className="space-y-3 bg-slate-900/30 p-4 border border-slate-800/40 rounded-2xl font-sans">
                      <div className="flex items-center gap-2 text-xs font-bold text-teal-300 uppercase tracking-wider mb-2">
                        <UserCircle className="w-4 h-4 text-teal-400" />
                        <span>Paso 1: Generar Pases Rápidos</span>
                      </div>
                      <p className="text-[11px] text-slate-450 leading-relaxed mb-1.5">
                        Inyecta visitantes autorizados instantáneos con diferentes perfiles de seguridad para verificar las reglas en la caseta:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleCreateDemoPass('active')}
                          className="px-2.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-bold text-center transition cursor-pointer"
                        >
                          🟢 Pase Activo (Andrés)
                        </button>
                        <button
                          onClick={() => handleCreateDemoPass('expired')}
                          className="px-2.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-[10px] font-bold text-center transition cursor-pointer"
                        >
                          🔴 Pase Vencido (Sonia)
                        </button>
                        <button
                          onClick={() => handleCreateDemoPass('suspended')}
                          className="px-2.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-[10px] font-bold text-center transition cursor-pointer"
                        >
                          🟡 Suspendido (Mariano)
                        </button>
                        <button
                          onClick={() => handleCreateDemoPass('onetime_used')}
                          className="px-2.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-[10px] font-bold text-center transition cursor-pointer"
                        >
                          ⚫ Pase Único Usado
                        </button>
                      </div>
                    </div>

                    {/* Column 3: Simulated Scan Options */}
                    <div className="space-y-3 bg-slate-900/30 p-4 border border-slate-800/40 rounded-2xl font-sans">
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">
                        <Smartphone className="w-4 h-4 text-sky-400" />
                        <span>Paso 2: Simulación de Celular</span>
                      </div>
                      <p className="text-[11px] text-slate-450 leading-relaxed mb-2">
                        Renderiza un teléfono inteligente directamente a un costado para reflejar la perspectiva del visitante y el guardia al unísono:
                      </p>
                      <button
                        onClick={() => setShowVirtualPhone(!showVirtualPhone)}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-lg ${
                          showVirtualPhone 
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/10' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" /> 
                        {showVirtualPhone ? 'Cerrar Celular de Prueba' : 'Abrir Celular de Prueba 📱'}
                      </button>
                    </div>

                  </div>

                  {/* Dynamic Feedback Banner */}
                  {demoFeedback && (
                    <div className="bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5 animate-pulse">
                      <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-semibold">{demoFeedback}</span>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Grid wrapper for Virtual smartphone option */}
            <div className={`grid grid-cols-1 ${showVirtualPhone ? 'lg:grid-cols-12' : ''} gap-8 items-start`}>
              
              {/* Left major work panel */}
              <div id="workspace-layout-column" className={showVirtualPhone ? 'lg:col-span-8 space-y-8' : 'w-full space-y-8'}>
                
                {/* Navigation Tabs bar */}
                <div id="workspace-tabs-menu" className="flex border-b border-slate-800 pb-px flex-wrap gap-y-2">
                  {canScan && (
                    <button
                      id="nav-tab-scan"
                      onClick={() => setActiveTab('scan')}
                      className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
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
                      className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
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
                      className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
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
                      className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
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

              {/* Right column: Visitor Simulated Smartphone Pass */}
              {showVirtualPhone && (
                <div id="phone-simulation-column" className="lg:col-span-4 animate-fade-in-right sticky top-6">
                  <div className="w-full max-w-[325px] mx-auto bg-slate-900 border-4 border-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center p-5 pt-10 pb-6 border-b-8">
                    
                    {/* Speaker notch / bezel top element */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4.5 bg-slate-950 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mr-2"></div>
                      <div className="w-12 h-1 bg-slate-850 rounded"></div>
                    </div>

                    {/* App Bar title */}
                    <div className="w-full text-center border-b border-slate-800/80 pb-3 mb-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Simulador Visitante 📱</span>
                      <h4 className="text-white text-xs font-bold mt-0.5">Wallet de Acceso Virtual</h4>
                    </div>

                    {/* Visitor selector within Virtual Phone */}
                    <div className="w-full mb-4 font-sans">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pasaporte Digital de:</label>
                      <select
                        id="demo-visitor-wallet-select"
                        value={virtualPhoneUser?.id || ''}
                        onChange={(e) => {
                          const found = visitorsList.find(v => v.id === e.target.value);
                          if (found) setVirtualPhoneUser(found);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                      >
                        {visitorsList.length === 0 ? (
                          <option>Aun no hay códigos registrados</option>
                        ) : (
                          visitorsList.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.status})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Digital Smartphone screen contents */}
                    {virtualPhoneUser ? (
                      <div className="w-full bg-[#0b0f19] border border-slate-805/80 rounded-2xl p-4 flex flex-col items-center relative select-none">
                        
                        {/* Validation state header inside simulator */}
                        <div className="w-full flex items-center justify-between mb-3 text-[9.5px]">
                          <span className="text-slate-500 font-mono">Pase QR</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            virtualPhoneUser.status === 'active' && (!virtualPhoneUser.oneTime || !virtualPhoneUser.used)
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          }`}>
                            {virtualPhoneUser.status === 'active' && (!virtualPhoneUser.oneTime || !virtualPhoneUser.used) ? 'VÁLIDO ✅' : 'INVÁLIDO 🚫'}
                          </span>
                        </div>

                        <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/20 rounded-full flex items-center justify-center mb-2.5">
                          <UserCircle className="w-5 h-5 text-indigo-400" />
                        </div>

                        <h5 className="text-sm font-bold text-slate-200 mt-1 truncate max-w-full text-center leading-none">{virtualPhoneUser.name}</h5>
                        <p className="text-[10px] text-slate-505 font-mono mt-1">ID: {virtualPhoneUser.documentId}</p>

                        {/* Rendering QR card inside Phone screen overlay */}
                        <div className="bg-white p-3 rounded-xl border border-slate-800 shadow-xl my-4">
                          {virtualPhoneQR ? (
                            <img 
                              src={virtualPhoneQR} 
                              alt="Smartphone Screen Pass" 
                              className="w-36 h-36 block object-contain"
                              referrerPolicy="referrer"
                            />
                          ) : (
                            <div className="w-36 h-36 bg-slate-100 flex items-center justify-center animate-pulse text-slate-400 text-xs">Cargando...</div>
                          )}
                        </div>

                        <div className="text-[9.5px] text-slate-500 font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-900/80 truncate w-full text-center">
                          Token: {virtualPhoneUser.qrcodeToken}
                        </div>

                        {virtualPhoneUser.oneTime && (
                          <div className={`mt-2 text-[8px] px-2 py-1 rounded w-full text-center font-bold uppercase ${
                            virtualPhoneUser.used ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                          }`}>
                            {virtualPhoneUser.used ? '⚠️ Ya Canjeado' : '🔥 Pase de un solo uso'}
                          </div>
                        )}
                        
                        {/* Live time indicator */}
                        <div className="mt-3.5 flex items-center gap-1 text-[9px] text-slate-500 font-mono">
                          <ClockIcon className="w-3 h-3 text-slate-600 animate-pulse" />
                          <span>Actualizado en tiempo real</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-10 bg-slate-950 rounded-2xl w-full border border-slate-800">
                        <QrCode className="w-8 h-8 text-slate-705 animate-pulse mb-3" />
                        <p className="text-[11px] text-slate-500 leading-relaxed">No hay visitantes de prueba inyectados aún.</p>
                        <button
                          onClick={() => handleCreateDemoPass('active')}
                          className="mt-3 px-3 py-1.5 bg-indigo-600/20 text-indigo-400 text-[10px] uppercase tracking-wide font-bold rounded-lg hover:bg-indigo-600/30 transition cursor-pointer"
                        >
                          Crear Pase Activo
                        </button>
                      </div>
                    )}

                    {/* Simulation Triggers inside phone screen bezel */}
                    <div className="w-full mt-5 space-y-2 font-sans">
                      <button
                        id="btn-trigger-virtual-scan-feed"
                        onClick={() => virtualPhoneUser && handleSimulateScanDirect(virtualPhoneUser.qrcodeToken)}
                        disabled={!virtualPhoneUser}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                      >
                        <ScanLine className="w-4 h-4 animate-ping" /> Simular Escaneo Guardia
                      </button>
                      
                      <button
                        onClick={() => {
                          if (virtualPhoneUser) {
                            navigator.clipboard.writeText(`${window.location.origin}/?pass=${virtualPhoneUser.qrcodeToken}`);
                            alert('¡Enlace móvil copiado! Ábrelo en otra pestaña de tu laptop para simularlo, o escanéalo con tu smartphone real apuntando a la pantalla.');
                          }
                        }}
                        disabled={!virtualPhoneUser}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-1.5 text-slate-400 hover:text-white transition rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" /> Copiar Link de Celular
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                      <span className="text-[9px] text-slate-550 font-bold uppercase tracking-widest font-mono">Dispositivo Online</span>
                    </div>

                    {/* Bottom home sensor line */}
                    <div className="w-16 h-1 bg-slate-800 rounded-full mt-4"></div>
                  </div>
                </div>
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
