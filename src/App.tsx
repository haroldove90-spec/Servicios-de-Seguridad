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
  Copy, Download, Clock as ClockIcon, AlertTriangle, Menu, X, Home, BookOpen, Calendar, Car
} from 'lucide-react';
import { auth, IS_FIREBASE_DUMMY } from './firebase';
import { dbService } from './services/dbService';
import { SystemUserRole, SystemRole, AccessLog } from './types';
import ScannerInterface from './components/ScannerInterface';
import AdminDashboard from './components/AdminDashboard';
import AuditLogs from './components/AuditLogs';
import RolesManager from './components/RolesManager';
import ResidenciasManager from './components/ResidenciasManager';
import ResidentesManager from './components/ResidentesManager';
import CasetasManager from './components/CasetasManager';
import MarbetesManager from './components/MarbetesManager';
import { ProfileManager } from './components/ProfileManager';
import { ManualUsuario } from './components/ManualUsuario';
import ResidentDashboard from './components/ResidentDashboard';
import VisitasDeResidentes from './components/VisitasDeResidentes';
import MetricasDashboard from './components/MetricasDashboard';
import { generateQRWithLogo } from './utils/qrWithLogo';
import { exportMarbeteToJPG } from './utils/marbeteExporter';

// Global panic audio state managers
let activeAudio: HTMLAudioElement | null = null;
let sirenInterval: any = null;
let audioCtx: AudioContext | null = null;
let oscillator1: OscillatorNode | null = null;
let oscillator2: OscillatorNode | null = null;
let gainNode: GainNode | null = null;

function playPanicSound() {
  // 1. Play real Mp3 audio (Loud warning siren)
  try {
    if (activeAudio) {
      activeAudio.pause();
    }
    const alarmUrl = "https://www.soundjay.com/misc/sounds/siren-1.mp3";
    activeAudio = new Audio(alarmUrl);
    activeAudio.loop = true;
    activeAudio.volume = 1.0;
    activeAudio.play().catch(err => {
      console.warn("Audio element playback blocked by browser gesture, fallback to Web Audio API", err);
    });
  } catch (err) {
    console.warn("HTML5 Audio execution error", err);
  }

  // 2. Play programmatic Piercing Emergency Siren as standard backup / layered sound
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // Create dual oscillators for piercing beat dissonance (feels like a genuine alarm)
    oscillator1 = audioCtx.createOscillator();
    oscillator2 = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator1.type = 'sawtooth';
    oscillator2.type = 'sawtooth';
    
    oscillator1.frequency.setValueAtTime(500, audioCtx.currentTime);
    oscillator2.frequency.setValueAtTime(508, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
    
    oscillator1.start();
    oscillator2.start();
    
    let goingUp = true;
    sirenInterval = setInterval(() => {
      if (!audioCtx || !oscillator1 || !oscillator2) return;
      const t = audioCtx.currentTime;
      if (goingUp) {
        oscillator1.frequency.linearRampToValueAtTime(900, t + 0.2);
        oscillator2.frequency.linearRampToValueAtTime(910, t + 0.2);
        goingUp = false;
      } else {
        oscillator1.frequency.linearRampToValueAtTime(450, t + 0.2);
        oscillator2.frequency.linearRampToValueAtTime(458, t + 0.2);
        goingUp = true;
      }
    }, 220);
    
  } catch(e) {
    console.warn("Web Audio API generation issue", e);
  }
}

function stopPanicSound() {
  try {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio = null;
    }
  } catch(e) {}
  
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  
  try {
    if (oscillator1) {
      oscillator1.stop();
      oscillator1.disconnect();
      oscillator1 = null;
    }
    if (oscillator2) {
      oscillator2.stop();
      oscillator2.disconnect();
      oscillator2 = null;
    }
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
  } catch(e) {}
}

export default function App() {
  // Authentication states
  const [user, setUser] = useState<any | null>(() => {
    const saved = localStorage.getItem('cnls_auth_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [userRole, setUserRole] = useState<SystemRole | null>(() => {
    const saved = localStorage.getItem('cnls_user_role');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Preview Mode Sandbox simulation controls
  const [demoRole, setDemoRole] = useState<SystemUserRole>(() => {
    return (localStorage.getItem('cnls_demo_role') as any) || SystemUserRole.ADMIN;
  });
  const [demoName, setDemoName] = useState<string>(() => {
    return localStorage.getItem('cnls_demo_name') || 'Software AI Admin';
  });

  // Drawer lateral navigation state
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Splash screen state (shown only once per browser session)
  const [splashVisible, setSplashVisible] = useState<boolean>(() => {
    return !sessionStorage.getItem('cnls_splash_screen_shown');
  });

  // PWA installation state
  const [installPrompt, setInstallPrompt] = useState<any | null>(null);

  useEffect(() => {
    // Splash screen timer: closes splash transition automatically
    let splashTimer: any = null;
    if (splashVisible) {
      splashTimer = setTimeout(() => {
        setSplashVisible(false);
        sessionStorage.setItem('cnls_splash_screen_shown', 'true');
      }, 1500);
    }

    // Capture standard install prompts
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('CNLS beforeinstallprompt fired');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    window.addEventListener('appinstalled', () => {
      setInstallPrompt(null);
      console.log('CNLS system installed as a PWA!');
    });

    return () => {
      if (splashTimer) clearTimeout(splashTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [splashVisible]);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`PWA install outcome: ${outcome}`);
      setInstallPrompt(null);
    } else {
      alert('Para instalar CNLS de inmediato:\n\n• En Android/Chrome: Presiona los 3 puntos verticales en la esquina superior y selecciona "Agregar a la pantalla principal" o "Instalar aplicación".\n• En iPhone/iPad/Safari: Pulsa el ícono de "Compartir" de la barra de navegación (cuadrado con flecha hacia arriba) y selecciona "Agregar a Inicio" (Add to Home Screen).\n• En Computadoras/PCs: Haz clic en el ícono de instalación PWA en la extrema derecha de la barra de direcciones.');
    }
  };

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
  const [visitorPassMarbete, setVisitorPassMarbete] = useState<any | null>(null);
  const [visitorPassQRUrl, setVisitorPassQRUrl] = useState<string>('');
  const [visitorPassLoading, setVisitorPassLoading] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  // Master Access logs (cached/shared states)
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [globalPanicActive, setGlobalPanicActive] = useState<boolean>(false);

  useEffect(() => {
    (window as any).globalPanicActive = globalPanicActive;
    if (globalPanicActive) {
      playPanicSound();
    } else {
      stopPanicSound();
    }
    
    (window as any).onGlobalPanicChange = (state: boolean) => {
      setGlobalPanicActive(state);
    };

    return () => {
      stopPanicSound();
    };
  }, [globalPanicActive]);
  
  // Navigation tabs - activated with profile view as well
  const [activeTab, setActiveTab] = useState<'scan' | 'crud' | 'reports' | 'roles' | 'residencias' | 'residentes' | 'casetas' | 'perfil' | 'manual' | 'visitas' | 'visitas_admin' | 'marbetes' | 'metricas'>(() => {
    return (localStorage.getItem('cnls_active_tab') as any) || 'scan';
  });
  const [hasSelectedRole, setHasSelectedRole] = useState<boolean>(() => {
    return localStorage.getItem('cnls_has_selected_role') === 'true';
  });

  const [residenciasList, setResidenciasList] = useState<any[]>([]);

  const loadResidenciasForHome = async () => {
    try {
      const list = await dbService.getResidencias();
      setResidenciasList(list || []);
    } catch (e) {
      console.warn("Failed fetching residencias for home screen selector:", e);
    }
  };

  // Guarded credential login system states
  const [selectedLoginTarget, setSelectedLoginTarget] = useState<{
    role: SystemUserRole;
    label: string;
    defaultTab: 'scan' | 'crud' | 'reports' | 'roles' | 'residencias' | 'residentes' | 'casetas' | 'perfil' | 'manual' | 'visitas' | 'visitas_admin' | 'marbetes' | 'metricas';
    residenciaId?: string;
    residenciaNombre?: string;
  } | null>(null);

  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  const handleCredentialLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Por favor ingrese tanto el usuario como su contraseña.');
      return;
    }

    try {
      // Fetch all system roles/employees
      const registeredRoles = await dbService.getAllSystemRoles();
      
      // Match on username OR email, checking password exactly
      const matched = registeredRoles.find(r => {
        const inputStr = loginUsername.trim().toLowerCase();
        const rEmail = r.email?.toLowerCase();
        const rUsername = r.username?.toLowerCase();
        
        let isUsernameOrEmailMatch = (rUsername === inputStr || rEmail === inputStr);
        
        // Handle physical email typo gracefully mapping haroldo90/haroldo90@hotmail.com to haroldo980@hotmail.com
        if (inputStr === 'haroldo90@hotmail.com' || inputStr === 'haroldo90') {
          if (rEmail === 'haroldo980@hotmail.com' || rUsername === 'haroldo980') {
            isUsernameOrEmailMatch = true;
          }
        }
        
        return isUsernameOrEmailMatch && r.password === loginPassword.trim();
      });

      if (!matched) {
        setLoginError('Usuario o contraseña incorrectos. Verifica tus credenciales o solicita acceso al administrador.');
        return;
      }

      // Automatically determine user role and assign active values
      setDemoRole(matched.role);
      setDemoName(matched.name);

      setUserRole({
        ...matched,
        uid: matched.uid,
        name: matched.name,
        email: matched.email,
        role: matched.role,
        residenciaId: matched.residenciaId,
        residenciaNombre: matched.residenciaNombre
      });

      // Reset login form fields
      setLoginUsername('');
      setLoginPassword('');
      setLoginError('');
      setSelectedLoginTarget(null);

      // Instantly route based on matched role
      if (matched.role === SystemUserRole.ADMIN) {
        setActiveTab('metricas');
      } else if (matched.role === SystemUserRole.RESIDENTE) {
        setActiveTab('visitas');
      } else {
        setActiveTab('scan');
      }
      setHasSelectedRole(true);

    } catch (err) {
      console.error('Error on dynamic login handler:', err);
      setLoginError('Error crítico con la base de datos de seguridad residencial.');
    }
  };

  const handleBypassLogin = () => {
    if (!selectedLoginTarget) return;
    
    // Fallback sandbox direct connection for simulation walkthroughs
    handleRoleSelection(
      selectedLoginTarget.role,
      selectedLoginTarget.label,
      selectedLoginTarget.defaultTab as any,
      selectedLoginTarget.residenciaId,
      selectedLoginTarget.residenciaNombre
    );
    
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
    setSelectedLoginTarget(null);
  };

  useEffect(() => {
    if (!hasSelectedRole) {
      loadResidenciasForHome();
    }
  }, [hasSelectedRole]);

  useEffect(() => {
    localStorage.setItem('cnls_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('cnls_has_selected_role', String(hasSelectedRole));
  }, [hasSelectedRole]);

  useEffect(() => {
    localStorage.setItem('cnls_demo_role', demoRole);
  }, [demoRole]);

  useEffect(() => {
    localStorage.setItem('cnls_demo_name', demoName);
  }, [demoName]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('cnls_auth_user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }));
    } else {
      localStorage.removeItem('cnls_auth_user');
    }
  }, [user]);

  useEffect(() => {
    if (userRole) {
      localStorage.setItem('cnls_user_role', JSON.stringify(userRole));
    } else {
      localStorage.removeItem('cnls_user_role');
    }
  }, [userRole]);

  // Helper to choose active dashboard role and set appropriate tab
  const handleRoleSelection = (
    role: SystemUserRole, 
    nameSimulated: string, 
    defaultTab: 'scan' | 'crud' | 'reports' | 'roles' | 'residencias' | 'residentes' | 'casetas' | 'perfil' | 'manual' | 'visitas' | 'visitas_admin' | 'metricas',
    residenciaId?: string,
    residenciaNombre?: string
  ) => {
    setDemoRole(role);
    setDemoName(nameSimulated);
    
    if (IS_FIREBASE_DUMMY) {
      setUserRole({
        uid: 'admin-demo-uid',
        name: nameSimulated,
        email: 'softwareai569@gmail.com',
        role: role,
        createdAt: new Date().toISOString(),
        residenciaId,
        residenciaNombre
      });
    } else if (user) {
      setUserRole({
        uid: user.uid,
        name: user.displayName || nameSimulated,
        email: user.email || 'user@example.com',
        role: role,
        createdAt: new Date().toISOString(),
        residenciaId,
        residenciaNombre
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
          const passUrl = `${window.location.origin}${window.location.pathname}?pass=${token}`;
          generateQRWithLogo(passUrl).then(url => {
            setVisitorPassQRUrl(url);
            setVisitorPassLoading(false);
          }).catch(err => {
            console.error('Pase QR failed', err);
            setVisitorPassLoading(false);
          });
        } else {
          // Check in marbetes!
          dbService.getMarbetes().then((marbetes) => {
            const foundMarbete = marbetes.find(m => m.qrcodeToken === token);
            if (foundMarbete) {
              setVisitorPassMarbete(foundMarbete);
              const passUrl = `${window.location.origin}${window.location.pathname}?pass=${token}`;
              generateQRWithLogo(passUrl).then(url => {
                setVisitorPassQRUrl(url);
                setVisitorPassLoading(false);
              }).catch(err => {
                console.error('Marbete QR failed', err);
                setVisitorPassLoading(false);
              });
            } else {
              setVisitorPassLoading(false);
            }
          }).catch(() => {
            setVisitorPassLoading(false);
          });
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
      const passUrl = `${window.location.origin}${window.location.pathname}?pass=${virtualPhoneUser.qrcodeToken}`;
      generateQRWithLogo(passUrl).then(url => {
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
    try {
      if (!IS_FIREBASE_DUMMY) {
        await signOut(auth);
      }
    } catch (err) {
      console.error('Signout Error: ', err);
    } finally {
      // Clean up cached selections and redirect to the landing selector
      setHasSelectedRole(false);
      setUserRole(null);
      setSelectedLoginTarget(null);
      setLoginUsername('');
      setLoginPassword('');
      setLoginError('');
      localStorage.removeItem('cnls_user_role');
      localStorage.setItem('cnls_has_selected_role', 'false');
    }
  };

  // Compute authorized status
  const isAdmin = userRole?.role === SystemUserRole.ADMIN;
  const isSupervisor = userRole?.role === SystemUserRole.SUPERVISOR;
  const isAuditor = userRole?.role === SystemUserRole.AUDITOR;
  const isGuard = userRole?.role === SystemUserRole.GUARD;
  const isResidente = userRole?.role === SystemUserRole.RESIDENTE;

  // Strict role separation for custom dashboards
  const canScan = isGuard || isSupervisor || isAdmin;
  const canCrud = isAdmin || isSupervisor;
  const canReports = isAdmin || isSupervisor || isAuditor;
  const canManageRoles = isAdmin;
  const canManageResidences = isAdmin;
  const canManageResidents = isAdmin;
  const canManageCasetas = isAdmin;

  // Resident role permissions for creating individual 1-day visits with QR
  const canManageYourVisits = isResidente || isGuard; // Guard is legacy resident or guard. We give both resident privileges.
  const canManageAllResidentVisits = isAdmin;

  // Gracefully redirect the user if they simulation-switch roles and lose tab privilege
  useEffect(() => {
    if (!userRole) return;
    const current = activeTab;
    if (current === 'scan' && !canScan) {
      if (canManageYourVisits) setActiveTab('visitas');
      else if (canCrud) setActiveTab('crud');
      else if (canReports) setActiveTab('reports');
    } else if (current === 'crud' && !canCrud) {
      if (canManageYourVisits) setActiveTab('visitas');
      else if (canScan) setActiveTab('scan');
      else if (canReports) setActiveTab('reports');
    } else if (current === 'reports' && !canReports) {
      if (canManageYourVisits) setActiveTab('visitas');
      else if (canScan) setActiveTab('scan');
      else if (canCrud) setActiveTab('crud');
    } else if (current === 'roles' && !canManageRoles) {
      if (canManageYourVisits) setActiveTab('visitas');
      else if (canScan) setActiveTab('scan');
      else if (canCrud) setActiveTab('crud');
      else setActiveTab('reports');
    } else if (
      (current === 'residencias' && !canManageResidences) || 
      (current === 'residentes' && !canManageResidents) ||
      (current === 'casetas' && !canManageCasetas)
    ) {
      if (canManageYourVisits) setActiveTab('visitas');
      else if (canScan) setActiveTab('scan');
      else if (canCrud) setActiveTab('crud');
      else setActiveTab('reports');
    } else if (current === 'manual' && !isAdmin) {
      if (canManageYourVisits) setActiveTab('visitas');
      else if (canScan) setActiveTab('scan');
      else if (canCrud) setActiveTab('crud');
      else setActiveTab('reports');
    } else if (current === 'visitas' && !canManageYourVisits) {
      if (canScan) setActiveTab('scan');
      else if (canCrud) setActiveTab('crud');
      else setActiveTab('reports');
    } else if (current === 'visitas_admin' && !canManageAllResidentVisits) {
      if (canManageYourVisits) setActiveTab('visitas');
      else if (canScan) setActiveTab('scan');
      else if (canCrud) setActiveTab('crud');
      else setActiveTab('reports');
    }
  }, [userRole, activeTab, canScan, canCrud, canReports, canManageRoles, canManageResidences, canManageResidents, canManageCasetas, isAdmin, isResidente, isGuard, canManageYourVisits, canManageAllResidentVisits]);

  // Render standalone high-fidelity mobile visitor passport card if opened with public URL
  if (visitorPassToken) {
    return (
      <div id="visitor-passport-viewport" className="min-h-screen bg-[#0A0A0A] text-slate-200 font-sans flex items-center justify-center p-4 selection:bg-red-500/30">
        <div className="w-full max-w-sm bg-[#2A2A2E] border border-[#3e3e42] rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
          
          {/* Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/10 blur-3xl rounded-full pointer-events-none"></div>
          
          {/* Card Top Title Banner */}
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-red-500 tracking-widest mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pase Electrónico de Entrada</span>
          </div>

          {visitorPassLoading ? (
            <div className="py-20 flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-xs text-slate-400">Verificando pase público...</p>
            </div>
          ) : visitorPassMarbete ? (
            <>
              {/* --- PREMIUM MARBETE DIGITAL CARD INTERFACE --- */}
              <div className="w-full bg-[#111827] rounded-[1.5rem] p-5 border border-slate-800/80 mb-5 relative flex flex-col items-center">
                
                {/* Crest Top Image */}
                <div className="w-40 h-40 flex items-center justify-center mb-1 drop-shadow-lg">
                  <img 
                    src="https://cossma.com.mx/cnls.png" 
                    alt="CNLS Crest" 
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="text-sm font-bold text-slate-100 tracking-[0.2em] uppercase mb-1">
                  Marbete Autorizado
                </div>
                <div className="text-xs font-mono text-red-500 font-extrabold tracking-widest mb-3">
                  CONSECUTIVO: #{visitorPassMarbete.consecutivo}
                </div>

                {/* Floating status badge */}
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  new Date(visitorPassMarbete.validUntil) >= new Date() && visitorPassMarbete.status === 'active'
                    ? 'bg-emerald-500/15 text-emerald-450 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-450 border border-rose-500/30'
                }`}>
                  {new Date(visitorPassMarbete.validUntil) >= new Date() && visitorPassMarbete.status === 'active' ? 'VIGENTE ✅' : 'VENCIDO/REVOCADO 🚫'}
                </span>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4.5 rounded-[1.5rem] shadow-xl shadow-black/80 inline-block border-2 border-slate-800">
                {visitorPassQRUrl ? (
                  <img 
                    src={visitorPassQRUrl} 
                    alt="Marbete QR Code" 
                    className="w-44 h-44 block"
                    referrerPolicy="referrer"
                  />
                ) : (
                  <div className="w-44 h-44 bg-slate-100 animate-pulse rounded flex items-center justify-center text-slate-400 text-xs">Cargando código...</div>
                )}
              </div>

              {/* Resident, Residence, and Vehicle description */}
              <div className="mt-4 w-full text-center">
                <h3 className="text-base font-extrabold text-white uppercase leading-tight tracking-wide">{visitorPassMarbete.residenteNombre}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{visitorPassMarbete.residenciaNombre}</p>
                
                {/* Vehicle plates and description */}
                {(visitorPassMarbete.vehiculoPlacas || visitorPassMarbete.vehiculoInfo) && (
                  <div className="mt-2.5 mx-auto max-w-xs bg-slate-900 border border-slate-800 p-2 rounded-xl text-center leading-snug">
                    {visitorPassMarbete.vehiculoPlacas && (
                      <p className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider">
                        PLACAS: {visitorPassMarbete.vehiculoPlacas}
                      </p>
                    )}
                    {visitorPassMarbete.vehiculoInfo && (
                      <p className="text-[11px] text-slate-300 font-sans mt-0.5 font-medium">
                        {visitorPassMarbete.vehiculoInfo}
                      </p>
                    )}
                  </div>
                )}

                {/* Expiration date */}
                <div className="mt-3.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-450 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>VENCE: {new Date(visitorPassMarbete.validUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</span>
                </div>
              </div>

              {/* Interactive buttons */}
              <div className="w-full border-t border-slate-800 pt-5 mt-6 flex flex-col gap-2 font-sans">
                {/* Download Marbete JPG button */}
                <button
                  id="download-marbete-jpg-btn"
                  onClick={() => visitorPassQRUrl && exportMarbeteToJPG(visitorPassMarbete, visitorPassQRUrl)}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-650 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg transition cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Guardar en Mi Teléfono (JPG)
                </button>
                
                <button
                  id="simulate-scan-marbete"
                  onClick={() => {
                    handleSimulateScanDirect(visitorPassMarbete.qrcodeToken);
                    alert('¡Simulando escaneo de Marbete! El sistema del oficial de seguridad registrará y validará su acceso vehicular.');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-red-650 hover:bg-red-600 text-white font-semibold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  <ScanLine className="w-4 h-4" /> Simular Paso en Caseta
                </button>

                <button
                  id="nav-to-dashboard-from-pass"
                  onClick={() => {
                    const nextUrl = window.location.origin + window.location.pathname;
                    window.history.pushState({}, '', nextUrl);
                    setVisitorPassToken(null);
                    setVisitorPassMarbete(null);
                  }}
                  className="w-full text-slate-400 hover:text-white font-medium text-xs py-2 transition cursor-pointer"
                >
                  Volver al Panel de Seguridad 🛡️
                </button>
              </div>
            </>
          ) : visitorPassUser ? (
            <>
              {/* Visitor Wallet View */}
              <div className="w-full bg-[#1A1A1E] rounded-2xl p-4 border border-[#3e3e42]/80 mb-5 relative">
                {/* Floating status badge */}
                <span className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  visitorPassUser.status === 'active' && (!visitorPassUser.oneTime || !visitorPassUser.used)
                    ? 'bg-emerald-500/15 text-emerald-450 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-450 border border-rose-500/30'
                }`}>
                  {visitorPassUser.status === 'active' && (!visitorPassUser.oneTime || !visitorPassUser.used) ? 'VÁLIDO ✅' : 'INVÁLIDO 🚫'}
                </span>

                <div className="w-12 h-12 bg-red-650/15 border border-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <UserCircle className="w-6 h-6 text-red-500" />
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
                Presenta este código QR frente al lector o cámara frontal para verificar tu autorización de acceso en portería.
              </p>

              {/* Demo Simulate buttons */}
              <div className="w-full border-t border-slate-800 pt-5 mt-6 flex flex-col gap-2 font-sans">
                <button
                  id="simulate-scan-from-pass-view"
                  onClick={() => {
                    handleSimulateScanDirect(visitorPassUser.qrcodeToken);
                    alert('¡Simulando escaneo! Revisa la pestaña del sistema de control para ver que el pase ya fue validado.');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-650 hover:bg-red-600 text-white font-semibold text-xs rounded-xl shadow-lg transition cursor-pointer"
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
      <div id="full-viewport-spinner" className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-4">Cargando Sistema CNLS...</p>
      </div>
    );
  }

  return (
    <div id="integrated-app-root" className="min-h-screen bg-[#0A0A0A] text-slate-200 font-sans flex flex-col justify-between selection:bg-red-650/30">
      <div>
        {/* Splash screen component displaying unencapsulated logo centered */}
        {splashVisible && (
          <div id="cnls-splash-screen" className="fixed inset-0 bg-[#0A0A0A] z-[100] flex flex-col items-center justify-center animate-fade-in transition-all duration-300">
            <img 
              src="https://cossma.com.mx/cnls.png" 
              alt="CNLS Splash Logo" 
              className="w-32 h-auto object-contain max-w-[80vw] animate-pulse"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-xl font-black text-white tracking-[0.3em] font-sans uppercase mt-6">CNLS</h1>
            <p className="text-[10px] text-red-500 font-mono tracking-widest uppercase mt-1">Valor • Lealtad • Excelencia</p>
          </div>
        )}

        {/* Drawer / Flyout Sidebar Navigation aligned to the LHS of the viewport */}
        <div 
          id="cnls-lateral-drawer-overlay"
          className={`fixed inset-0 bg-black/80 backdrop-blur-xs z-[50] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsDrawerOpen(false)}
        />
        <div 
          id="cnls-lateral-drawer"
          className={`fixed top-0 left-0 bottom-0 w-80 bg-[#2A2A2E] border-r border-[#3e3e42] z-[60] p-6 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-out transform ${
            isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#3e3e42] pb-4">
              <div className="flex items-center gap-3">
                <img 
                  src="https://cossma.com.mx/cnls.png" 
                  alt="CNLS Menu Logo" 
                  className="h-10 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-sm font-black text-white tracking-widest font-sans">CNLS</h3>
                  <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider">Lealtad y Excelencia</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 bg-[#1A1A1E] text-slate-400 hover:text-white border border-[#3e3e42] rounded-xl transition cursor-pointer"
                title="Cerrar menú"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="space-y-2 pt-2">
              {!hasSelectedRole ? (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-bold text-slate-500 px-3 tracking-wider font-mono">Demos / Perfiles de Acceso</p>
                  <div className="grid grid-cols-1 gap-1.5 font-sans">
                    <button 
                      onClick={() => {
                        handleRoleSelection(SystemUserRole.ADMIN, 'Administrador CNLS', 'metricas');
                        setIsDrawerOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 bg-[#1A1A1E] hover:bg-[#343438] text-white rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer border border-[#3e3e42] hover:border-red-500/20 animate-fade-in"
                    >
                      <Shield className="w-4 h-4 text-red-500" /> Administración General
                    </button>
                    <button 
                      onClick={() => {
                        handleRoleSelection(SystemUserRole.SUPERVISOR, 'Oficial de Seguridad', 'scan');
                        setIsDrawerOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 bg-[#1A1A1E] hover:bg-[#343438] text-white rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer border border-[#3e3e42] hover:border-red-500/20"
                    >
                      <Users className="w-4 h-4 text-red-500" /> Caseta General
                    </button>
                    <button 
                      onClick={() => {
                        handleRoleSelection(SystemUserRole.RESIDENTE, 'Haroldo Residente 🏡', 'visitas', 'res-demo-1', 'Lomas de Chapultepec');
                        setIsDrawerOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 bg-[#1A1A1E] hover:bg-[#343438] text-white rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer border border-[#3e3e42] hover:border-blue-500/20"
                    >
                      <Home className="w-4 h-4 text-blue-500" /> Residente Autogestión 🏡
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 font-sans">
                  <div className="px-3 py-2 bg-[#1A1A1E] border border-[#3e3e42] rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Perfil Activo</p>
                      <p className="text-xs font-extrabold text-white truncate max-w-[140px] mt-0.5 uppercase">
                        {userRole?.role === SystemUserRole.ADMIN 
                          ? (userRole?.residenciaNombre ? `Admin - ${userRole.residenciaNombre} 🛡️` : 'Admin Gral. 🛡️')
                          : userRole?.role === SystemUserRole.SUPERVISOR 
                          ? (userRole?.residenciaNombre ? `Caseta - ${userRole.residenciaNombre} ⚡` : 'Caseta Gral. ⚡') 
                          : 'Residente: 🏡'}
                      </p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] uppercase font-bold text-slate-500 px-3 tracking-wider font-mono mb-2">Vistas y Herramientas</p>
                    {isAdmin && (
                      <button
                        onClick={() => { setActiveTab('metricas'); setIsDrawerOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
                          activeTab === 'metricas' ? 'bg-red-650 text-white shadow-lg shadow-red-650/15' : 'text-slate-300 hover:bg-[#1A1A1E] hover:text-white'
                        }`}
                      >
                        <FileBarChart2 className="w-4 h-4 text-red-400 shrink-0" /> Métricas del Condominio
                      </button>
                    )}
                    {canScan && (
                      <button
                        onClick={() => { setActiveTab('scan'); setIsDrawerOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
                          activeTab === 'scan' ? 'bg-red-650 text-white shadow-lg shadow-red-650/15' : 'text-slate-300 hover:bg-[#1A1A1E] hover:text-white'
                        }`}
                      >
                        <ScanLine className="w-4 h-4" /> Acceso de Residente
                      </button>
                    )}
                    {canCrud && (
                      <button
                        onClick={() => { setActiveTab('crud'); setIsDrawerOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
                          activeTab === 'crud' ? 'bg-red-655 text-white shadow-lg shadow-red-650/15' : 'text-slate-300 hover:bg-[#1A1A1E] hover:text-white'
                        }`}
                      >
                        <Users className="w-4 h-4" /> Control Autorizados
                      </button>
                    )}
                    {canReports && (
                      <button
                        onClick={() => { setActiveTab('reports'); setIsDrawerOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
                          activeTab === 'reports' ? 'bg-red-650 text-white shadow-lg shadow-red-650/15' : 'text-slate-300 hover:bg-[#1A1A1E] hover:text-white'
                        }`}
                      >
                        <FileBarChart2 className="w-4 h-4" /> Bitácora &amp; Reportes
                      </button>
                    )}
                    {canManageResidences && (
                      <button
                        onClick={() => { setActiveTab('residencias'); setIsDrawerOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
                          activeTab === 'residencias' ? 'bg-red-650 text-white shadow-lg shadow-red-650/15' : 'text-slate-300 hover:bg-[#1A1A1E] hover:text-white'
                        }`}
                      >
                        <Home className="w-4 h-4" /> Registro de Residencia
                      </button>
                    )}
                    {canManageResidents && (
                      <button
                        onClick={() => { setActiveTab('residentes'); setIsDrawerOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
                          activeTab === 'residentes' ? 'bg-red-650 text-white shadow-lg shadow-red-650/15' : 'text-slate-300 hover:bg-[#1A1A1E] hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" /> Registro de Residente
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => { setActiveTab('marbetes'); setIsDrawerOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
                          activeTab === 'marbetes' ? 'bg-red-650 text-white shadow-lg shadow-red-650/15' : 'text-slate-300 hover:bg-[#1A1A1E] hover:text-white'
                        }`}
                      >
                        <Car className="w-4 h-4 text-red-400 shrink-0" /> Control de Marbetes
                      </button>
                    )}
                    {canManageCasetas && (
                      <button
                        onClick={() => { setActiveTab('casetas'); setIsDrawerOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
                          activeTab === 'casetas' ? 'bg-red-650 text-white shadow-lg shadow-red-650/15' : 'text-slate-300 hover:bg-[#1A1A1E] hover:text-white'
                        }`}
                      >
                        <Shield className="w-4 h-4" /> Registro de Casetas
                      </button>
                    )}
                    {canManageRoles && (
                      <button
                        onClick={() => { setActiveTab('roles'); setIsDrawerOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
                          activeTab === 'roles' ? 'bg-red-650 text-white shadow-lg shadow-red-650/15' : 'text-slate-300 hover:bg-[#1A1A1E] hover:text-white'
                        }`}
                      >
                        <Shield className="w-4 h-4" /> Privilegios y Roles
                      </button>
                    )}
                    {canManageYourVisits && (
                      <button
                        onClick={() => { setActiveTab('visitas'); setIsDrawerOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
                          activeTab === 'visitas' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' : 'text-slate-300 hover:bg-[#1A1A1E] hover:text-white'
                        }`}
                      >
                        <QrCode className="w-4 h-4 text-blue-400 shrink-0" /> Autorizar Visitas (Mi QR)
                      </button>
                    )}
                    {canManageAllResidentVisits && (
                      <button
                        onClick={() => { setActiveTab('visitas_admin'); setIsDrawerOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
                          activeTab === 'visitas_admin' ? 'bg-red-650 text-white shadow-lg shadow-red-650/15' : 'text-slate-300 hover:bg-[#1A1A1E] hover:text-white'
                        }`}
                      >
                        <Users className="w-4 h-4 text-emerald-400 shrink-0" /> Visitas de Residentes
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        id="nav-to-user-manual"
                        onClick={() => { setActiveTab('manual'); setIsDrawerOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
                          activeTab === 'manual' ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/15' : 'text-amber-450 hover:bg-[#1A1A1E] hover:text-white'
                        }`}
                      >
                        <BookOpen className="w-4 h-4 shrink-0" /> Manual del usuario
                      </button>
                    )}
                    <button
                      onClick={() => { setActiveTab('perfil'); setIsDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition cursor-pointer ${
                        activeTab === 'perfil' ? 'bg-red-650 text-white shadow-lg shadow-red-650/15' : 'text-slate-300 hover:bg-[#1A1A1E] hover:text-white'
                      }`}
                    >
                      <UserCircle className="w-4 h-4 text-emerald-400" /> Mi Perfil de Acceso
                    </button>
                  </div>
                </div>
              )}
            </nav>
          </div>

          <div className="space-y-3.5 border-t border-[#3e3e42] pt-4 font-sans">
            <button
              onClick={() => { handleInstallClick(); setIsDrawerOpen(false); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-600/20 transition cursor-pointer font-sans"
            >
              <Download className="w-4.5 h-4.5 shrink-0" /> Instalar Aplicación CNLS 📲
            </button>

            {hasSelectedRole && (
              <button
                onClick={() => { setHasSelectedRole(false); setIsDrawerOpen(false); }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-slate-450 hover:text-white transition rounded-xl text-xs font-extrabold cursor-pointer hover:bg-[#1A1A1E]"
              >
                <LogOut className="w-4 h-4 text-red-500" /> Regresar a Selector de Roles
              </button>
            )}

            <div className="text-[9px] text-slate-500 text-center font-mono uppercase tracking-widest pt-1">
              CNLS Acceso Residencial v1.5 • 2026
            </div>
          </div>
        </div>

        {/* Global top application header with Menu and Logo */}
        <header id="cnls-main-top-navbar" className="bg-[#1A1A1E] border-b border-[#3e3e42] sticky top-0 z-40 px-4 py-3 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <button 
                id="cnls-sidebar-hamburger"
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 hover:bg-[#2A2A2E] text-slate-300 hover:text-white rounded-xl border border-[#3e3e42] hover:border-slate-500 transition cursor-pointer"
                aria-label="Toggle navigation lateral drawer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setHasSelectedRole(false)}>
                <img 
                  src="https://cossma.com.mx/cnls.png" 
                  alt="CNLS Header Logo" 
                  className="h-8 max-h-8 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="text-sm font-black text-white tracking-[0.2em] font-sans uppercase">CNLS</span>
              </div>
            </div>

            <div className="flex items-center gap-3 font-sans">
              {/* Red-colored button for installing the app */}
              <button
                id="pwa-header-install-btn"
                onClick={handleInstallClick}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-500 border border-transparent hover:border-white/10 text-white rounded-xl text-xs font-extrabold transition shadow-lg cursor-pointer font-sans"
                title="Instalar CNLS"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Instalar Aplicación</span>
              </button>

              <button
                id="pwa-header-install-btn-mobile"
                onClick={handleInstallClick}
                className="sm:hidden flex items-center justify-center p-2.5 bg-red-600 hover:bg-red-550 text-white rounded-xl transition cursor-pointer"
                title="Instalar CNLS"
              >
                <Download className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </header>

        {/* Real Authenticated Mode Role Alert (Missing access role) */}
        {!IS_FIREBASE_DUMMY && !user && (
          <div id="db-active-auth-barrier" className="max-w-md mx-auto my-16 bg-[#0f172a] border border-[#1e293b] rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <Lock className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Acceso Restringido Control QR</h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-2.5 px-4 mb-8">
              Inicia sesión con tu cuenta de correo autorizada como Administrador o Residente de Control de Seguridad para registrar pases públicos y realizar escaneos.
            </p>
            <button
              id="google-authenticate-trigger"
              onClick={handleGoogleSignIn}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-2xl transition shadow-lg shadow-red-600/30"
            >
              Sign In with Google Account
            </button>
            
            <div className="border-t border-[#1e293b] pt-6 mt-8 flex items-center justify-center gap-2 text-[10.5px] text-slate-500">
              <Laptop className="w-4 h-4 text-slate-600" />
              <span>Acceso Administrador Autorizado</span>
            </div>
          </div>
        )}

        {/* Main Welcome Gateway Role Selector (Home screen) */}
        {(IS_FIREBASE_DUMMY || user) && !hasSelectedRole && (
          <div id="premises-role-selector-home" className="max-w-5xl mx-auto px-4 mt-8 sm:mt-12 mb-24 animate-fade-in text-center font-sans">
            
            {/* Logo display requested by user */}
            <div className="flex justify-center mb-6">
              <img 
                src="https://cossma.com.mx/cnls.png" 
                alt="CNLS Logo" 
                className="h-28 w-auto object-contain max-w-full drop-shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-fade-in"
                referrerPolicy="no-referrer"
              />
            </div>

            {selectedLoginTarget ? (
              /* High fidelity credentials login validation dialog requested by user */
              <div className="max-w-md mx-auto bg-[#2A2A2E] border border-[#3e3e42] hover:border-red-500/40 rounded-[2.5rem] p-6 sm:p-8 text-left shadow-2xl relative overflow-hidden animate-fade-in-up">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-650/5 blur-3xl rounded-full pointer-events-none"></div>
                
                <div className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/15 rounded-lg px-2.5 py-1 text-red-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  Iniciar Sesión de Seguridad
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                  Acceso al Panel Residencial
                </h3>
                <p className="text-xs text-slate-400 mt-2">
                  Destino: <span className="text-amber-500 uppercase font-black tracking-wide bg-[#1e1e24] px-2.5 py-1 rounded-lg ml-1 inline-block text-[11px] font-mono border border-amber-500/15">{selectedLoginTarget.label}</span>
                </p>

                {loginError && (
                  <div className="mt-4 p-3 bg-red-550/10 border border-red-500/25 text-red-400 text-xs font-semibold rounded-2xl flex items-center gap-2.5 animate-pulse">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleCredentialLoginSubmit} className="space-y-4 py-2 mt-4">
                  <div>
                    <label htmlFor="login-username-input" className="block text-[10px] font-black uppercase tracking-wider text-slate-350 mb-1.5 leading-none">
                      Nombre de Usuario o Email (Login)
                    </label>
                    <div className="relative">
                      <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="login-username-input"
                        type="text"
                        required
                        placeholder="Ej. guardia o cbarrientos"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1E] border border-[#3e3e42] text-white text-sm rounded-xl focus:border-red-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="login-password-input" className="block text-[10px] font-black uppercase tracking-wider text-slate-350 mb-1.5 leading-none">
                      Contraseña de Acceso
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="login-password-input"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1E] border border-[#3e3e42] text-white text-sm rounded-xl focus:border-red-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2.5 flex flex-col gap-2.5">
                    <button
                      id="submit-login-real-btn"
                      type="submit"
                      className="w-full py-3 bg-red-650 hover:bg-red-600 text-white font-bold rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/20 uppercase"
                    >
                      <Shield className="w-4 h-4" /> Ingresar con Credenciales
                    </button>

                    <button
                      id="bypass-login-sandbox-btn"
                      type="button"
                      onClick={handleBypassLogin}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-bold rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-1.5 uppercase"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> Omitir Clave (Acceder Modo Sandbox)
                    </button>

                    <button
                      id="cancel-login-btn"
                      type="button"
                      onClick={() => {
                        setSelectedLoginTarget(null);
                        setLoginUsername('');
                        setLoginPassword('');
                        setLoginError('');
                      }}
                      className="w-full text-center text-slate-500 hover:text-slate-300 transition text-[10px] font-bold py-2 mt-1 cursor-pointer"
                    >
                      ← VOLVER AL SELECTOR DE ROLES
                    </button>
                  </div>
                </form>

                <div className="mt-6 pt-5 border-t border-[#3e3e42] text-[9.5px] text-slate-500 leading-normal bg-black/15 p-3.5 rounded-2xl">
                  <p className="font-extrabold text-slate-400 mb-1 text-[10px] uppercase tracking-wider">Credenciales de Pruebas Rápidas:</p>
                  <p className="font-mono mt-0.5">• Para Director General: user <b className="text-zinc-300 text-[10px]">admin</b> / pass <b className="text-red-400 text-[10px]">Admin_123</b></p>
                  <p className="font-mono mt-0.5">• Para Guardia Caseta: user <b className="text-zinc-300 text-[10px]">guardia</b> / pass <b className="text-red-400 text-[10px]">Caseta_123</b></p>
                  <p className="font-sans text-[8.5px] text-zinc-500 inline-block mt-2 font-medium">Nota: Puedes dar de alta más empleados en el módulo de Administración General para que ingresen auto-detectados.</p>
                </div>

              </div>
            ) : (
              /* Existing roles and subdivisions selectors */
              <>
                {/* Header / Subdued upper banner */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-650/10 border border-red-500/20 rounded-full text-red-400 text-[11px] font-mono font-bold uppercase tracking-widest mb-6">
                  <ShieldCheck className="w-4 h-4 text-red-500 shrink-0" />
                  <span>SISTEMA DE CONTROL DE ACCESO RESIDENCIAL — CNLS</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-none mb-4 animate-fade-in">
                  Acceso Residencial CNLS
                </h1>
                <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12 animate-fade-in">
                  Gestión inteligente de condominios, pases de visitantes y control ágil en caseta. Selecciona el módulo de tu perfil para ingresar.
                </p>

                {/* Roles Grid Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
                  
                  {/* CARD 1: ADMIN */}
                  <div 
                    id="role-gateway-card-admin"
                    onClick={() => setSelectedLoginTarget({ role: SystemUserRole.ADMIN, label: 'Panel Administración General', defaultTab: 'metricas' })}
                    className="group relative bg-[#2A2A2E] hover:bg-[#343438] border border-[#3e3e42] hover:border-red-500 rounded-3xl p-6 shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full group-hover:bg-red-500/10 transition"></div>
                    
                    <div className="flex flex-col items-center justify-center text-center py-6">
                      <div className="w-14 h-14 bg-red-550/15 text-red-500 border border-red-500/25 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition shrink-0">
                        <Shield className="w-7 h-7 animate-pulse" />
                      </div>
                      <h3 className="text-xl font-extrabold text-white group-hover:text-red-404 transition" id="lbl-admin-general-role">
                        Administración
                      </h3>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#3e3e42] flex items-center justify-between font-sans">
                      <span className="text-[10px] font-bold text-red-405 tracking-wider uppercase group-hover:translate-x-1 transition-all">Acceder al Panel Admin →</span>
                      <span className="text-[10px] bg-red-650/20 text-red-404 font-mono px-2.5 py-0.5 rounded-full uppercase font-bold">Total</span>
                    </div>
                  </div>

                  {/* CARD 2: SEGURIDAD / CASETA */}
                  <div 
                    id="role-gateway-card-supervisor"
                    onClick={() => setSelectedLoginTarget({ role: SystemUserRole.SUPERVISOR, label: 'Panel Caseta de Guardias', defaultTab: 'scan' })}
                    className="group relative bg-[#2A2A2E] hover:bg-[#343438] border border-[#3e3e42] hover:border-amber-500 rounded-3xl p-6 shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full group-hover:bg-amber-500/10 transition"></div>
                    
                    <div className="flex flex-col items-center justify-center text-center py-6">
                      <div className="w-14 h-14 bg-amber-500/15 text-amber-500 border border-amber-500/25 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition shrink-0">
                        <Users className="w-7 h-7 text-amber-500" />
                      </div>
                      <h3 className="text-xl font-extrabold text-white group-hover:text-amber-400 transition" id="lbl-caseta-general-role">
                        Caseta / Seguridad
                      </h3>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#3e3e42] flex items-center justify-between font-sans">
                      <span className="text-[10px] font-bold text-amber-405 tracking-wider uppercase group-hover:translate-x-1 transition-all">Módulo Seguridad →</span>
                      <span className="text-[10px] bg-amber-600/20 text-amber-400 font-mono px-2.5 py-0.5 rounded-full uppercase font-bold">Activo</span>
                    </div>
                  </div>

                  {/* CARD 3: RESIDENTE AUTOGESTIÓN */}
                  <div 
                    id="role-gateway-card-residente"
                    onClick={() => setSelectedLoginTarget({ 
                      role: SystemUserRole.RESIDENTE, 
                      label: 'Panel Haroldo Residente 🏡', 
                      defaultTab: 'visitas',
                      residenciaId: 'res-demo-1',
                      residenciaNombre: 'Lomas de Chapultepec' 
                    })}
                    className="group relative bg-[#2A2A2E] hover:bg-[#343438] border border-[#3e3e42] hover:border-blue-500 rounded-3xl p-6 shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full group-hover:bg-blue-500/10 transition"></div>
                    
                    <div className="flex flex-col items-center justify-center text-center py-6">
                      <div className="w-14 h-14 bg-blue-500/15 text-blue-400 border border-blue-550/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition shrink-0">
                        <Home className="w-7 h-7 text-blue-400 animate-pulse" />
                      </div>
                      <h3 className="text-xl font-extrabold text-white group-hover:text-blue-400 transition" id="lbl-residente-general-role">
                        Residente Autogestión
                      </h3>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#3e3e42] flex items-center justify-between font-sans">
                      <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase group-hover:translate-x-1 transition-all">Pases QR / Mis Visitas →</span>
                      <span className="text-[10px] bg-blue-600/20 text-blue-400 font-mono px-2.5 py-0.5 rounded-full uppercase font-bold">Vecino</span>
                    </div>
                  </div>

                </div>

                {/* Dynamic Subdivision Residences Bento Grid */}
                {residenciasList && residenciasList.length > 0 && (
                  <div id="subdivisions-bento-section" className="mt-12 pt-8 border-t border-[#1e1e24] text-left max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 mb-6 justify-center sm:justify-start">
                      <div className="w-1.5 h-6 bg-red-650 rounded-full"></div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-[#94a3b8] font-mono">
                        🏡 Accesos Directos por Subdivisiones ({residenciasList.length})
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {residenciasList.map((res: any) => (
                        <div 
                          key={res.id} 
                          className="bg-[#18181c] border border-[#2e2e38] rounded-2.5xl p-5 hover:border-red-500/40 transition-all duration-300 relative group overflow-hidden shadow-lg shadow-black/40"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-2xl rounded-full"></div>
                          
                          <div className="flex items-start justify-between gap-2.5 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-center text-red-300 font-extrabold text-sm shadow-inner group-hover:scale-105 transition-transform">
                                🏡
                              </div>
                              <div>
                                <h4 className="text-sm font-extrabold text-white leading-snug tracking-tight group-hover:text-red-400 transition-colors uppercase">
                                  {res.nombre}
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-1 font-sans">
                                  Admin: <span className="text-slate-350 font-semibold">{res.administrador || 'Por asignar'}</span>
                                </p>
                              </div>
                            </div>

                            <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md ${
                              res.isActive 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-zinc-550/10 text-zinc-400 border border-[#2e2e38]'
                            }`}>
                              {res.isActive ? 'Activo ✓' : 'Inactivo ✗'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 mt-4 pt-4 border-t border-zinc-800">
                            <button
                              onClick={() => setSelectedLoginTarget({
                                role: SystemUserRole.ADMIN, 
                                label: `Admin - ${res.nombre}`, 
                                defaultTab: 'metricas', 
                                residenciaId: res.id, 
                                residenciaNombre: res.nombre
                              })}
                              disabled={!res.isActive}
                              className="flex items-center justify-center gap-1.5 py-2 px-1 bg-[#242429] hover:bg-red-950/25 text-[9.5px] font-bold text-slate-300 hover:text-white rounded-xl border border-[#2e2e38] hover:border-red-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                              title={`Ingresar como Administrador de ${res.nombre}`}
                            >
                              <Shield className="w-3.5 h-3.5 text-red-500 shrink-0" /> Admin
                            </button>
                            <button
                              onClick={() => setSelectedLoginTarget({
                                role: SystemUserRole.SUPERVISOR, 
                                label: `Caseta - ${res.nombre}`, 
                                defaultTab: 'scan', 
                                residenciaId: res.id, 
                                residenciaNombre: res.nombre
                              })}
                              disabled={!res.isActive}
                              className="flex items-center justify-center gap-1.5 py-2 px-1 bg-[#242429] hover:bg-amber-950/25 text-[9.5px] font-bold text-slate-300 hover:text-white rounded-xl border border-[#2e2e38] hover:border-amber-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                              title={`Ingresar como Caseta de Seguridad de ${res.nombre}`}
                            >
                              <Smartphone className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Caseta
                            </button>
                            <button
                              onClick={() => setSelectedLoginTarget({
                                role: SystemUserRole.RESIDENTE, 
                                label: `Vecino - ${res.nombre}`, 
                                defaultTab: 'visitas', 
                                residenciaId: res.id, 
                                residenciaNombre: res.nombre
                              })}
                              disabled={!res.isActive}
                              className="flex items-center justify-center gap-1.5 py-2 px-1 bg-[#242429] hover:bg-blue-950/25 text-[9.5px] font-bold text-slate-300 hover:text-white rounded-xl border border-[#2e2e38] hover:border-blue-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                              title={`Ingresar como Residente de ${res.nombre}`}
                            >
                              <Home className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Vecino
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
              </>
            )}

          </div>
        )}

        {/* Primary Operational workspace */}
        {(IS_FIREBASE_DUMMY || user) && hasSelectedRole && (
          <div id="dashboard-workspace-cabinet" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
            {/* Header section */}
            <div id="premises-dashboard-header" className="flex flex-col md:flex-row md:items-center md:justify-between bg-[#2A2A2E] p-5 rounded-2xl border border-[#3e3e42] gap-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-red-500 uppercase tracking-widest font-sans">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-red-500" />
                  <span>CNLS — ACCESO RESIDENCIAL {userRole?.role === SystemUserRole.ADMIN 
                    ? 'ADMINISTRACIÓN' 
                    : userRole?.role === SystemUserRole.SUPERVISOR 
                    ? 'CASETA' 
                    : 'RESIDENTE'}</span>
                </div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">Control de Acceso Residencial</h1>
              </div>

              {/* Connected Account status card & Exit/Switch Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div id="authentication-status-badge" className="flex items-center gap-3 bg-[#1A1A1E] border border-[#3e3e42] p-2.5 rounded-2xl shadow-md self-start">
                  <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs">
                    {userRole?.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-200 leading-none">{userRole?.name}</p>
                    <p className="text-[10px] text-slate-400 leading-none mt-1.5 uppercase font-semibold font-sans">
                      Rol: {userRole?.role === SystemUserRole.ADMIN 
                        ? (userRole?.residenciaNombre ? `Admin - ${userRole.residenciaNombre} 🛡️` : 'Administración General 🛡️')
                        : userRole?.role === SystemUserRole.SUPERVISOR 
                        ? (userRole?.residenciaNombre ? `Caseta - ${userRole.residenciaNombre} ⚡` : 'Caseta General ⚡') 
                        : 'Residente'}
                    </p>
                  </div>
                  
                  {/* Signout button */}
                  {!IS_FIREBASE_DUMMY && user && (
                    <button
                      id="auth-signout-trigger-btn"
                      onClick={handleSignOut}
                      className="ml-2 p-1.5 bg-[#2A2A2E] hover:bg-[#343438] text-slate-400 hover:text-white border border-[#3e3e42] rounded-lg transition cursor-pointer text-xs"
                      title="Cerrar de Sesión"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Switch / Change Role dashboard exit trigger requested by user */}
                <button
                  id="btn-logout-role-to-home"
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 bg-rose-950/45 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-500/25 px-4 py-2.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer shadow-lg shadow-black/30 font-sans"
                  title="Cerrar la sesión actual de la plataforma de seguridad"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>

            </div>


            {/* Dynamic Feedback Banner */}
            {demoFeedback && (
              <div className="bg-[#ef4444]/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5 animate-pulse font-sans mb-6">
                <Sparkles className="w-4 h-4 text-red-500 shrink-0" />
                <span className="font-semibold">{demoFeedback}</span>
              </div>
            )}

            {/* Grid wrapper for Virtual smartphone option */}
            <div className={`grid grid-cols-1 ${showVirtualPhone ? 'lg:grid-cols-12' : ''} gap-8 items-start`}>
              
                {/* Left major work panel */}
                <div id="workspace-layout-column" className={showVirtualPhone ? 'lg:col-span-8 space-y-8' : 'w-full space-y-8'}>
                  
                  {/* Tab Views routers */}
                <div id="workspace-routed-frame" className="animate-fade-in-up">
                  {activeTab === 'metricas' && isAdmin && userRole && (
                    <MetricasDashboard 
                      currentAdminUser={userRole} 
                      onRefresh={reloadAccessLogs} 
                    />
                  )}

                  {activeTab === 'scan' && canScan && (
                    <ScannerInterface 
                      currentGuard={userRole ? { uid: userRole.uid, name: userRole.name, role: userRole.role } : null} 
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

                  {activeTab === 'residencias' && canManageResidences && (
                    <ResidenciasManager 
                      onRefresh={loadVisitorsForPhoneList}
                    />
                  )}

                  {activeTab === 'residentes' && canManageResidents && (
                    <ResidentesManager 
                      onRefresh={loadVisitorsForPhoneList}
                    />
                  )}

                  {activeTab === 'marbetes' && isAdmin && (
                    <MarbetesManager 
                      onRefresh={handleLogsUpdated}
                    />
                  )}

                  {activeTab === 'casetas' && canManageCasetas && (
                    <CasetasManager 
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

                  {activeTab === 'perfil' && (
                    <ProfileManager 
                      currentUser={userRole}
                      onProfileUpdated={(updated) => {
                        setUserRole(updated);
                        setDemoName(updated.name);
                        setDemoFeedback('✓ Perfil de usuario actualizado exitosamente.');
                        setTimeout(() => setDemoFeedback(''), 4500);
                      }}
                    />
                  )}

                  {activeTab === 'manual' && isAdmin && (
                    <ManualUsuario />
                  )}

                  {activeTab === 'visitas' && canManageYourVisits && userRole && (
                    <ResidentDashboard 
                      currentResidentUser={userRole} 
                      onRefresh={reloadAccessLogs} 
                    />
                  )}

                  {activeTab === 'visitas_admin' && canManageAllResidentVisits && userRole && (
                    <VisitasDeResidentes 
                      currentAdminUser={userRole} 
                      onRefresh={reloadAccessLogs} 
                    />
                  )}
                </div>

              </div>

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

      {/* Circular Floating Panic Button (Accessible on home and all roles) */}
      <button
        id="global-floating-panic-actuator"
        onClick={() => {
          const nextState = !globalPanicActive;
          setGlobalPanicActive(nextState);
          (window as any).globalPanicActive = nextState;
          if ((window as any).onGlobalPanicChange) {
            (window as any).onGlobalPanicChange(nextState);
          }
        }}
        className={`fixed bottom-6 right-6 z-55 p-4 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-300 ${
          globalPanicActive 
            ? 'bg-red-600 border-2 border-white text-white animate-bounce ring-4 ring-red-500/50 scale-110' 
            : 'bg-red-800 border border-red-500/30 text-white hover:bg-red-700 hover:scale-105 shadow-red-500/25 shadow-lg'
        }`}
        style={{ width: '58px', height: '58px' }}
        title={globalPanicActive ? "Desactivar Botón de Pánico" : "🚨 Activar Botón de Pánico"}
      >
        <AlertTriangle className={`w-6 h-6 ${globalPanicActive ? 'animate-pulse text-white' : 'text-red-100'}`} />
        {globalPanicActive && (
          <span className="absolute inset-0 rounded-full bg-red-600/30 animate-ping z-[-1]" />
        )}
      </button>
    </div>
  );
}
