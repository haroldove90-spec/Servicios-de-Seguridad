/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, CheckCircle, XCircle, AlertTriangle, RefreshCw, Smartphone, Key, Users, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { dbService } from '../services/dbService';
import { 
  AuthorizedUser, 
  AccessLog, 
  LogType, 
  LogStatus, 
  UserStatus, 
  SystemUserRole 
} from '../types';

interface ScannerInterfaceProps {
  currentGuard: { uid: string; name: string } | null;
  onScanLogged: () => void;
}

export default function ScannerInterface({ currentGuard, onScanLogged }: ScannerInterfaceProps) {
  // States for scanner
  const [useCamera, setUseCamera] = useState<boolean>(false);
  const [manualToken, setManualToken] = useState<string>('');
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    user?: AuthorizedUser;
    status: LogStatus;
  } | null>(null);
  const [validationType, setValidationType] = useState<LogType>(LogType.CHECK_IN);
  const [quickUsers, setQuickUsers] = useState<AuthorizedUser[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Advanced Security Modules States
  const [onsitePeople, setOnsitePeople] = useState<{ userId: string; name: string; document: string; time: string }[]>([]);
  const [panicActive, setPanicActive] = useState<boolean>(false);
  const [votedFeatures, setVotedFeatures] = useState<string[]>([]);
  const [checklistFeedback, setChecklistFeedback] = useState<string>('');

  // Camera & Mobile permissions manager hook
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const checkCameraPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermission('denied');
      setPermissionError('Este navegador o entorno iframe no ofrece acceso directo de cámara. Para realizar pruebas reales con cámara, abre la aplicación usando el botón de "Abrir en nueva pestaña" en la esquina superior.');
      return;
    }
    
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' as any });
        setCameraPermission(result.state as 'prompt' | 'granted' | 'denied');
        result.onchange = () => {
          setCameraPermission(result.state as 'prompt' | 'granted' | 'denied');
        };
      } else {
        setCameraPermission('prompt');
      }
    } catch {
      // If permissions.query fails or is not supported/restricted in iframe, default to prompt
      setCameraPermission('prompt');
    }
  };

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Release tracks immediately
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      return true;
    } catch (err: any) {
      console.warn('Error requesting camera permission:', err);
      setCameraPermission('denied');
      setPermissionError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Se denegó el acceso a la cámara. Por favor presiona el candado en la barra del navegador para restablecer los permisos de cámara de este sitio.'
          : `Error de cámara: ${err.message || err}`
      );
      return false;
    }
  };

  // Pull onsite visitors
  const reloadOnsitePeople = async () => {
    try {
      const logs = await dbService.getAccessLogs();
      const latestLogsMap: { [userId: string]: AccessLog } = {};
      for (const log of logs) {
        if (log.status === LogStatus.SUCCESS && !latestLogsMap[log.userId]) {
          latestLogsMap[log.userId] = log;
        }
      }
      const onsite = Object.values(latestLogsMap)
        .filter(log => log.type === LogType.CHECK_IN)
        .map(log => ({
          userId: log.userId,
          name: log.userName,
          document: log.documentId,
          time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
      setOnsitePeople(onsite);
    } catch (err) {
      console.warn('Error reading onsite state: ', err);
    }
  };

  const handleForceCheckout = async (userId: string, userName: string, documentId: string) => {
    const guardName = currentGuard?.name || 'Guardia de Guardia';
    const guardId = currentGuard?.uid || 'anonymous-guard';
    
    // Create checkout log
    await dbService.createAccessLog({
      userId,
      userName,
      documentId,
      timestamp: new Date().toISOString(),
      type: LogType.CHECK_OUT,
      status: LogStatus.SUCCESS,
      guardId,
      guardName,
    });
    
    reloadOnsitePeople();
    onScanLogged();
  };

  // Load quick-scan options and facility occupancy list
  useEffect(() => {
    dbService.getAuthorizedUsers().then(users => {
      setQuickUsers(users);
    });
    reloadOnsitePeople();
  }, [scanResult]);

  // Handle custom simulated scan event trigger for demo flows
  useEffect(() => {
    const handleSimulatedScan = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setScanResult(null);
        handleVerifyToken(customEvent.detail);
      }
    };
    window.addEventListener('simulate-qr-scan', handleSimulatedScan);
    return () => {
      window.removeEventListener('simulate-qr-scan', handleSimulatedScan);
    };
  }, [panicActive, validationType, currentGuard]);

  // Handle actual QR scanning
  useEffect(() => {
    if (useCamera) {
      // Set up the html5-qrcode scanner
      const scanner = new Html5QrcodeScanner(
        'qr-live-scanner-box',
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          handleVerifyToken(decodedText);
          // Turn off camera on success to avoid double scanner triggering
          setUseCamera(false);
          scanner.clear().catch(err => console.warn('Scanner cleanup error', err));
        },
        (error) => {
          // Silent scan failed frames
        }
      );

      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(err => console.warn('Scanner clear error', err));
        }
      };
    }
  }, [useCamera, validationType]);

  const handleVerifyToken = async (token: string) => {
    if (!token) return;
    if (panicActive) {
      setScanResult({
        success: false,
        message: '⚠ SISTEMA EN CRISIS: Control de Acceso QR Bloqueado de forma permanente mientras la ALERTA DE PÁNICO permanezca activa.',
        status: LogStatus.REVOKED_USER
      });
      return;
    }
    
    const tokenClean = token.trim();
    const users = await dbService.getAuthorizedUsers();
    const matchedUser = users.find(u => u.qrcodeToken === tokenClean);

    const guardName = currentGuard?.name || 'Guardia de Guardia';
    const guardId = currentGuard?.uid || 'anonymous-guard';

    // 1. Check if token matches any visitor
    if (!matchedUser) {
      const failedResult = {
        success: false,
        message: 'Código QR no reconocido. Token no válido en la base de datos.',
        status: LogStatus.EXPIRED_TOKEN
      };
      setScanResult(failedResult);
      
      // Log failed attempt
      await dbService.createAccessLog({
        userId: 'unregistered-qr',
        userName: 'Código Desconocido',
        documentId: 'N/A',
        timestamp: new Date().toISOString(),
        type: validationType,
        status: LogStatus.EXPIRED_TOKEN,
        guardId,
        guardName,
      });
      onScanLogged();
      return;
    }

    // 2. Check if account is suspended / expired in status
    if (matchedUser.status === UserStatus.SUSPENDED) {
      const result = {
        success: false,
        message: `Acceso Denegado: El pase de ${matchedUser.name} se encuentra SUSPENDIDO administrativamente.`,
        user: matchedUser,
        status: LogStatus.REVOKED_USER
      };
      setScanResult(result);
      logScan(matchedUser, LogStatus.REVOKED_USER);
      return;
    }

    if (matchedUser.status === UserStatus.EXPIRED) {
      const result = {
        success: false,
        message: `Acceso Denegado: El pase de ${matchedUser.name} ha EXPIRADO permanentemente.`,
        user: matchedUser,
        status: LogStatus.EXPIRED_TOKEN
      };
      setScanResult(result);
      logScan(matchedUser, LogStatus.EXPIRED_TOKEN);
      return;
    }

    // 3. Temporal Expiration Check (Dates)
    const now = new Date();
    const validFrom = new Date(matchedUser.validFrom);
    const validUntil = new Date(matchedUser.validUntil);

    if (now < validFrom) {
      const result = {
        success: false,
        message: `Acceso Denegado: El pase de ${matchedUser.name} no está activo aún (Válido desde: ${validFrom.toLocaleDateString()}).`,
        user: matchedUser,
        status: LogStatus.OUTSIDE_SCHEDULE
      };
      setScanResult(result);
      logScan(matchedUser, LogStatus.OUTSIDE_SCHEDULE);
      return;
    }

    if (now > validUntil) {
      const result = {
        success: false,
        message: `Acceso Denegado: El pase expiró el ${validUntil.toLocaleDateString()} a las ${validUntil.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`,
        user: matchedUser,
        status: LogStatus.EXPIRED_TOKEN
      };
      setScanResult(result);
      logScan(matchedUser, LogStatus.EXPIRED_TOKEN);
      return;
    }

    // 4. Access Schedule constraints (Time & Days)
    // Weekday check: JavaScript 0 is Sunday, 1 is Monday ... 6 is Saturday
    const currentDay = now.getDay();
    if (matchedUser.days && matchedUser.days.length > 0 && !matchedUser.days.includes(currentDay)) {
      const daysTranslation: { [key: number]: string } = {
        0: 'Domingos', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábados'
      };
      const allowedDaysStr = matchedUser.days.map(d => daysTranslation[d]).join(', ');
      const result = {
        success: false,
        message: `Acceso Denegado: Día no autorizado. Días permitidos: ${allowedDaysStr}.`,
        user: matchedUser,
        status: LogStatus.OUTSIDE_SCHEDULE
      };
      setScanResult(result);
      logScan(matchedUser, LogStatus.OUTSIDE_SCHEDULE);
      return;
    }

    // Daily Hour check (startTime - endTime)
    if (matchedUser.startTime && matchedUser.endTime) {
      const currentHrsMins = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }); // e.g. "14:35"
      if (currentHrsMins < matchedUser.startTime || currentHrsMins > matchedUser.endTime) {
        const result = {
          success: false,
          message: `Acceso Denegado: Horario restringido. Permitido únicamente entre ${matchedUser.startTime} y ${matchedUser.endTime}.`,
          user: matchedUser,
          status: LogStatus.OUTSIDE_SCHEDULE
        };
        setScanResult(result);
        logScan(matchedUser, LogStatus.OUTSIDE_SCHEDULE);
        return;
      }
    }

    // 5. One-time access check
    if (matchedUser.oneTime && matchedUser.used && validationType === LogType.CHECK_IN) {
      const result = {
        success: false,
        message: `Acceso Denegado: El pase de un solo uso ya ha sido UTILIZADO anteriormente y no se permite la re-entrada.`,
        user: matchedUser,
        status: LogStatus.ALREADY_USED
      };
      setScanResult(result);
      logScan(matchedUser, LogStatus.ALREADY_USED);
      return;
    }

    // SUCCESS - VALID QR PASS!
    const successResult = {
      success: true,
      message: `¡Pase VALIDADOR Autorizado! Bienvenido, ${matchedUser.name}.`,
      user: matchedUser,
      status: LogStatus.SUCCESS
    };
    setScanResult(successResult);

    // If one-time checkin, mark the user as used!
    if (matchedUser.oneTime && validationType === LogType.CHECK_IN) {
      await dbService.updateAuthorizedUser(matchedUser.id, { used: true });
    }

    // Log the successful access audit trail
    await logScan(matchedUser, LogStatus.SUCCESS);

    // Fire confetti for a high-craft delightful verification animation!
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const logScan = async (user: AuthorizedUser, status: LogStatus) => {
    const logData: Omit<AccessLog, 'id'> = {
      userId: user.id,
      userName: user.name,
      documentId: user.documentId,
      timestamp: new Date().toISOString(),
      type: validationType,
      status: status,
      guardId: currentGuard?.uid || 'anonymous-guard',
      guardName: currentGuard?.name || 'Guardia de Seguridad',
    };
    await dbService.createAccessLog(logData);
    onScanLogged();
  };

  const getStatusIcon = (status: LogStatus, success: boolean) => {
    if (success) return <CheckCircle id="verification-icon-check" className="w-16 h-16 text-emerald-500 animate-pulse" />;
    if (status === LogStatus.EXPIRED_TOKEN || status === LogStatus.ALREADY_USED) {
      return <XCircle id="verification-icon-fail" className="w-16 h-16 text-rose-500 animate-bounce" />;
    }
    return <AlertTriangle id="verification-icon-warn" className="w-16 h-16 text-amber-500 animate-bounce" />;
  };

  const getStatusBadgeColor = (status: LogStatus) => {
    switch (status) {
      case LogStatus.SUCCESS:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case LogStatus.REVOKED_USER:
        return 'bg-red-500/10 text-red-400 border-red-50/10';
      case LogStatus.ALREADY_USED:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case LogStatus.EXPIRED_TOKEN:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case LogStatus.OUTSIDE_SCHEDULE:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-[#000000]/40 text-slate-300 border-slate-850';
    }
  };

  const getStatusLabelEsp = (status: LogStatus) => {
    switch (status) {
      case LogStatus.SUCCESS: return '✓ APROBADO';
      case LogStatus.REVOKED_USER: return '⚠ SUSPENDIDO';
      case LogStatus.ALREADY_USED: return '⚠ YA USADO';
      case LogStatus.EXPIRED_TOKEN: return '✗ CADUCADO / INVÁLIDO';
      case LogStatus.OUTSIDE_SCHEDULE: return '⚠ FUERA DE HORARIO';
      default: return 'DESCONOCIDO';
    }
  };

  return (
    <div id="scanner-view-full-wrapper" className="space-y-8">
      {/* Panic Siren Top Alert when active */}
      {panicActive && (
        <div id="global-panic-beacon" className="bg-rose-600 border border-rose-500 rounded-2xl p-4 text-white animate-pulse flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0 px-px pb-0.5 shadow-xs"></span>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5 leading-none">🚨 CÓDIGO ROJO - LOCKDOWN ACTIVADO</h4>
              <p className="text-[10px] text-rose-100 leading-normal">
                Todas las esclusas automáticas y barreras de acceso perimetral están inhabilitadas por protocolo de crisis técnica.
              </p>
            </div>
          </div>
          <button 
            id="panic-deactivate-btn"
            onClick={() => {
              setPanicActive(false);
              setScanResult(null);
            }}
            className="px-3 py-1.5 bg-white text-rose-700 font-bold text-xs rounded-lg hover:bg-rose-50 transition shrink-0 cursor-pointer"
          >
            DESACTIVAR
          </button>
        </div>
      )}

      <div id="guard-security-view-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Scanning Controls Frame */}
      <div id="scan-terminal-frame" className="lg:col-span-7 bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#1e293b] mb-6">
            <h2 className="text-lg font-semibold text-slate-100 tracking-tight flex items-center gap-2">
              <Camera className="w-5 h-5 text-slate-400" /> Interfaz de Validación (Escaneo)
            </h2>
            <div className="flex bg-[#020617] p-0.5 rounded-lg border border-[#1e293b]">
              <button
                id="toggle-checkin-mode"
                onClick={() => setValidationType(LogType.CHECK_IN)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  validationType === LogType.CHECK_IN
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                E/Entrada
              </button>
              <button
                id="toggle-checkout-mode"
                onClick={() => setValidationType(LogType.CHECK_OUT)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  validationType === LogType.CHECK_OUT
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                S/Salida
              </button>
            </div>
          </div>

          {/* Camera Scan Mode */}
          {useCamera ? (
            <div id="camera-reader-viewport" className="flex flex-col items-center bg-slate-950 rounded-xl p-4 overflow-hidden relative border border-slate-800">
              {/* Green Laser Scan line Overlay */}
              <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none z-10 overflow-hidden">
                <div className="scan-overlay"></div>
              </div>
              <div id="qr-live-scanner-box" className="w-full max-w-sm rounded-lg overflow-hidden bg-black aspect-square relative z-0"></div>
              <p className="text-xs text-slate-400 mt-4 text-center">
                Alinee el código QR de un solo uso o pase de visitante frente a la cámara.
              </p>
              <button
                id="btn-cancel-camera-esc"
                onClick={() => setUseCamera(false)}
                className="mt-4 px-4 py-1.5 bg-slate-800 text-slate-200 text-xs font-medium rounded-lg hover:bg-slate-700 transition"
              >
                Cancelar Cámara
              </button>
            </div>
          ) : (
            <div id="camera-idle-view" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl p-6 sm:p-10 bg-slate-950 text-center min-h-[300px] space-y-5">
              <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center border border-slate-850 shadow-xs text-slate-400 relative overflow-hidden mx-auto">
                <div className="scan-overlay opacity-30"></div>
                <Camera className="w-6 h-6 text-indigo-400" />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-200">Escáner Óptico de Cámara</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
                  Utiliza tu cámara frontal o trasera para leer los códigos QR en tiempo real para autorizar registros de entrada o salida.
                </p>
              </div>

              {/* Real-time Permission Checker Status Panel */}
              <div className="w-full max-w-sm bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Permiso de Dispositivo:</span>
                  {cameraPermission === 'checking' ? (
                    <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Verificando...
                    </span>
                  ) : cameraPermission === 'granted' ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      ✓ Autorizado
                    </span>
                  ) : cameraPermission === 'denied' ? (
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      ✗ Bloqueado
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      ⚡ Pendientes
                    </span>
                  )}
                </div>

                {permissionError && (
                  <p className="text-[11px] text-slate-350 leading-relaxed text-left bg-slate-950/80 p-2.5 rounded-xl border border-rose-500/10 font-mono text-amber-300">
                    {permissionError}
                  </p>
                )}

                {cameraPermission !== 'granted' && (
                  <button
                    id="btn-request-explicit-camera-perms"
                    onClick={async () => {
                      const granted = await requestCameraPermission();
                      if (granted) {
                        setScanResult(null);
                        setUseCamera(true);
                      }
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-205 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> Solicitar Permiso de Cámara
                  </button>
                )}
              </div>

              {/* Main scan Trigger Button */}
              <button
                id="btn-trigger-camera-opt"
                onClick={async () => {
                  setScanResult(null);
                  if (cameraPermission !== 'granted') {
                    const ok = await requestCameraPermission();
                    if (!ok) return; // Wait for explicit authorization
                  }
                  setUseCamera(true);
                }}
                className="inline-flex items-center gap-2 justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-sm cursor-pointer w-full max-w-sm"
              >
                <Smartphone className="w-4 h-4" /> Activar Cámara de Escaneo
              </button>
            </div>
          )}
        </div>

        {/* Sandbox Simulation Frame for instant testing */}
        <div id="simulation-sandbox-tray" className="mt-8 border-t border-[#1e293b] pt-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Pruebas Manuales y Simulación de QR</label>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Presiona cualquiera de los visitantes pre-configurados para simular el escaneo automático del pase, analizando alertas, expiraciones y pases de un solo uso sin requerir cámara activa:
          </p>
          <div id="quick-demo-test-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {quickUsers.slice(0, 4).map((user) => (
              <button
                key={user.id}
                id={`simulate-scan-${user.id}`}
                onClick={() => {
                  setScanResult(null);
                  handleVerifyToken(user.qrcodeToken);
                }}
                className="flex items-center justify-between text-left px-3 py-2 border border-slate-800 bg-[#020617]/50 rounded-xl hover:border-slate-700 hover:bg-slate-900 transition text-xs"
              >
                <div className="truncate pr-2">
                  <p className="font-semibold text-slate-200 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-450 font-mono truncate">{user.documentId}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                  user.status === UserStatus.ACTIVE 
                    ? user.oneTime 
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/25' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : 'bg-red-500/10 text-red-400 border-red-500/25'
                }`}>
                  {user.status === UserStatus.ACTIVE ? (user.oneTime ? 'Único' : 'Frecuente') : 'Inactivo'}
                </span>
              </button>
            ))}
          </div>

          <div id="simulated-token-typing" className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Key className="w-3.5 h-3.5" />
              </span>
              <input
                id="input-token-manual-type"
                type="text"
                placeholder="Introducir token del pase manualmente..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-slate-600 focus:outline-hidden"
              />
            </div>
            <button
              id="btn-trigger-manual-token"
              onClick={() => {
                setScanResult(null);
                handleVerifyToken(manualToken);
                setManualToken('');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700"
            >
              Simular Lectura
            </button>
          </div>
        </div>
      </div>

      {/* Access Verdict Results Frame */}
      <div id="verdict-outcome-panel" className="lg:col-span-5 flex flex-col justify-stretch">
        <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 shadow-2xl flex-1 flex flex-col justify-center min-h-[350px]">
          {scanResult ? (
            <div id="scan-verdict-display" className="text-center flex flex-col items-center justify-center animate-fade-in">
              <div className="mb-4">
                {getStatusIcon(scanResult.status, scanResult.success)}
              </div>
              
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border tracking-wider uppercase mb-3 ${getStatusBadgeColor(scanResult.status)}`}>
                {getStatusLabelEsp(scanResult.status)}
              </span>

              <h3 className={`text-base font-bold tracking-tight px-4 max-w-md ${scanResult.success ? 'text-emerald-400' : 'text-slate-200'}`}>
                {scanResult.message}
              </h3>

              {scanResult.user && (
                <div id="verdict-visitor-profile-card" className="w-full bg-slate-950 border border-slate-850 rounded-xl p-4 mt-6 text-left text-xs space-y-2.5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-850 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-400" /> Perfil del Visitante
                  </p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-1">
                    <div>
                      <p className="text-slate-500 font-medium">Nombre Completo</p>
                      <p className="font-semibold text-slate-200">{scanResult.user.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Documento de Identidad</p>
                      <p className="font-semibold text-indigo-300 font-mono">{scanResult.user.documentId}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Tipo de Acceso</p>
                      <p className="font-semibold text-slate-200 font-mono">
                        {scanResult.user.oneTime ? 'Pase de un solo uso' : 'Acceso Frecuente'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Contacto / Telf.</p>
                      <p className="font-semibold text-slate-200">{scanResult.user.phone || 'No registrado'}</p>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-850 pt-2.5 mt-2.5 grid grid-cols-1 gap-y-1">
                    <p className="text-slate-400 font-medium leading-relaxed">
                      Este pase es válido del: <span className="font-semibold text-slate-205">{new Date(scanResult.user.validFrom).toLocaleDateString()}</span> al <span className="font-semibold text-slate-205">{new Date(scanResult.user.validUntil).toLocaleDateString()}</span>.
                    </p>
                    {scanResult.user.startTime && (
                      <p className="text-slate-450 font-medium">
                        Horario Diario: <span className="font-semibold text-indigo-400">{scanResult.user.startTime} - {scanResult.user.endTime}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button
                id="btn-scan-verdict-clear"
                onClick={() => setScanResult(null)}
                className="mt-8 inline-flex items-center gap-2 justify-center px-4 py-2 bg-slate-800 hover:bg-slate-705 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Escanear Nuevo Código
              </button>
            </div>
          ) : (
            <div id="verdict-idle-guide" className="text-center py-10">
              <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center border border-slate-850 shadow-sm mx-auto mb-4 text-slate-400 relative overflow-hidden">
                <div className="scan-overlay opacity-20"></div>
                <Smartphone className="w-7 h-7 text-indigo-500 animate-pulse" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">Esperando Lectura de Código</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">
                Escanea un QR o introduce datos en el panel simulador de la izquierda para desplegar el dictamen automático de entrada/salida y revisar credenciales.
              </p>
              <div id="active-guard-context-card" className="mt-8 inline-block bg-[#020617] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 text-left">
                <p className="font-semibold text-indigo-400">Operador Activo:</p>
                <p className="text-slate-300 mt-0.5">{currentGuard?.name} • <span className="font-mono text-indigo-300">{currentGuard?.uid}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* BENTO GRID SECURITY ROADMAP & COMMAND CENTER */}
    <div id="security-bento-grid" className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
      
      {/* Module 1: Panic Trigger Command (col-span-4) */}
      <div id="bento-panic-card" className="md:col-span-4 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between min-h-[220px]">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-1 text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md uppercase tracking-widest">Procedimiento Crisis</span>
            <AlertTriangle className={`w-4 h-4 ${panicActive ? 'text-rose-500 animate-bounce' : 'text-slate-500'}`} />
          </div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Alarma Global de Emergencia</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            En caso de intrusión forzada, falla técnica grave o siniestro en instalaciones, presione el actuador para inhabilitar escaneos en todo el perímetro.
          </p>
        </div>
        
        <button
          id="panic-toggle-actuator-btn"
          onClick={() => {
            const prev = panicActive;
            setPanicActive(!prev);
            setUseCamera(false);
            if (!prev) {
              setScanResult({
                success: false,
                message: '⚠ BLOQUEO ACTIVO: Alarma de Emergencia emitida al centro de comando regional.',
                status: LogStatus.REVOKED_USER
              });
            } else {
              setScanResult(null);
            }
          }}
          className={`w-full py-3 text-xs font-extrabold rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer ${
            panicActive 
              ? 'bg-emerald-600 hover:bg-emerald-555 text-white shadow-md' 
              : 'bg-rose-700 hover:bg-rose-600 text-white shadow-xl shadow-rose-950/20'
          }`}
        >
          {panicActive ? '🟢 Desactivar Lockdown' : '🚨 Activar Botón de Pánico'}
        </button>
      </div>

      {/* Module 2: Occupancy Monitor (col-span-4) */}
      <div id="bento-occupancy-card" className="md:col-span-4 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between min-h-[220px]">
        <div className="space-y-3 w-full">
          <div className="flex items-center justify-between">
            <span className="px-2 py-1 text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-md uppercase tracking-widest">Control de Tránsito</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>En Sitio: {onsitePeople.length}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Instalación / Tránsito Interno</h4>
            <p className="text-[10.5px] text-slate-400 leading-normal">Pases con check-in activo que no registran salida.</p>
          </div>

          <div id="onsite-visitors-list" className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
            {onsitePeople.map(p => (
              <div key={p.userId} id={`onsite-person-${p.userId}`} className="bg-[#020617] p-2 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2 text-[10.5px]">
                <div className="truncate flex-1">
                  <p className="font-bold text-slate-300 truncate">{p.name}</p>
                  <p className="text-[9px] text-slate-500 font-mono">DNI: {p.document} • Entró: {p.time}</p>
                </div>
                <button
                  id={`onsite-checkout-${p.userId}`}
                  onClick={() => handleForceCheckout(p.userId, p.name, p.document)}
                  className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:bg-indigo-950/20 text-slate-400 hover:text-indigo-400 rounded-lg text-[9px] font-bold transition shrink-0 cursor-pointer"
                >
                  Salida
                </button>
              </div>
            ))}

            {onsitePeople.length === 0 && (
              <div id="onsite-empty-panel" className="text-center py-6 text-slate-500 text-[11px]">
                <p>Las instalaciones se encuentran vacías.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module 3: Security Checklist & Roadmap Scheduler (col-span-4) */}
      <div id="bento-roadmap-checklist" className="md:col-span-4 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between min-h-[220px]">
        <div className="space-y-3 w-full">
          <div className="flex items-center justify-between">
            <span className="px-2 py-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md uppercase tracking-widest">Roadmap Técnico</span>
            <HelpCircle className="w-4 h-4 text-slate-500" />
          </div>

          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Checklist de Cumplimiento</h4>
            <p className="text-[10px] text-slate-400 leading-normal">Solicitudes pendientes o sugerencias para planes futuros:</p>
          </div>

          {checklistFeedback && (
            <div id="checklist-sug-feedback" className="p-1 px-2.5 bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 rounded-lg animate-pulse font-semibold">
              {checklistFeedback}
            </div>
          )}

          <div id="checklist-items-stack" className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
            <div className="flex items-start gap-1.5 text-[10px]">
              <input type="checkbox" checked readOnly className="mt-0.5 pointer-events-none accent-indigo-500 shrink-0" />
              <div className="leading-tight">
                <p className="font-bold text-emerald-400">✓ Roles y Permisos RBAC Activados</p>
                <p className="text-[9px] text-slate-500">Módulos restringidos para Admin/Guardia/Supervisores</p>
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-[10px]">
              <input type="checkbox" checked readOnly className="mt-0.5 pointer-events-none accent-indigo-500 shrink-0" />
              <div className="leading-tight">
                <p className="font-bold text-emerald-400">✓ Restricciones Horario y Fechas</p>
                <p className="text-[9px] text-slate-500">Doble bloqueo horario diario e intramatutino</p>
              </div>
            </div>

            {/* Simulated Roadmap Plan */}
            {[
              { label: '📡 Sensor Biométrico Facial', desc: 'Evita transferir pases', code: 'facial' },
              { label: '📨 Alertas SMS Directas', desc: 'Despacho automático al emitir pase QRs', code: 'sms' },
              { label: '📊 Dashboard de Tránsito en Vivo', desc: 'Panel ocupacional bento integrado', code: 'tracked' },
              { label: '🌐 Integración de Listas Negras', desc: 'Alertas inmediatas en policía', code: 'blacklist' }
            ].map(feat => {
              const voted = votedFeatures.includes(feat.code);
              return (
                <button
                  key={feat.code}
                  id={`vote-${feat.code}-btn`}
                  onClick={() => {
                    if (voted) {
                      setVotedFeatures(votedFeatures.filter(x => x !== feat.code));
                      setChecklistFeedback(`Eliminado: ${feat.label}.`);
                    } else {
                      setVotedFeatures([...votedFeatures, feat.code]);
                      setChecklistFeedback(`✓ Agregado: ${feat.label} al plan de desarrollo.`);
                    }
                    setTimeout(() => setChecklistFeedback(''), 4000);
                  }}
                  className="w-full flex items-start gap-1.5 text-left text-[10px] hover:bg-slate-950 p-1 rounded transition cursor-pointer"
                >
                  <input type="checkbox" checked={voted} readOnly className="mt-0.5 accent-amber-500 pointer-events-none shrink-0" />
                  <div className="leading-tight">
                    <p className={`font-semibold ${voted ? 'text-amber-400 font-bold' : 'text-slate-450'}`}>{feat.label}</p>
                    <p className="text-[8.5px] text-slate-500">{feat.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  </div>
);
}
