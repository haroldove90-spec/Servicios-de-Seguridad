/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import jsQR from 'jsqr';
import { Camera, CheckCircle, XCircle, AlertTriangle, RefreshCw, Smartphone, Key, Users, HelpCircle, Search, Activity, ShieldAlert, FileText, Download, Trash2 } from 'lucide-react';
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
  currentGuard: { 
    uid: string; 
    name: string; 
    role?: SystemUserRole; 
    residenciaId?: string; 
    residenciaNombre?: string; 
    casetaId?: string | null;
    casetaNombre?: string | null;
  } | null;
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
  const [panicActive, setPanicActive] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileScannerRef = useRef<Html5Qrcode | null>(null);

  // Throttling refs to prevent double-scanning within 3 seconds
  const lastScannedTokenRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  // Refs to prevent closure stale states
  const validationTypeRef = useRef<LogType>(LogType.CHECK_IN);
  const panicActiveRef = useRef<boolean>(false);
  const currentGuardRef = useRef<typeof currentGuard>(null);

  useEffect(() => {
    validationTypeRef.current = validationType;
  }, [validationType]);

  useEffect(() => {
    panicActiveRef.current = panicActive;
  }, [panicActive]);

  useEffect(() => {
    currentGuardRef.current = currentGuard;
  }, [currentGuard]);

  useEffect(() => {
    const syncPanic = () => {
      const globalState = !!(window as any).globalPanicActive;
      if (globalState !== panicActive) {
        setPanicActive(globalState);
        if (globalState) {
          setUseCamera(false);
          setScanResult(prev => prev || {
            success: false,
            message: '⚠ BLOQUEO ACTIVO: Alarma de Emergencia emitida al centro de comando regional.',
            status: LogStatus.REVOKED_USER
          });
        } else {
          setScanResult(null);
        }
      }
    };
    syncPanic();
    const interval = setInterval(syncPanic, 150);
    return () => clearInterval(interval);
  }, [panicActive]);

  // States for live bitácora logs and testing filters
  const [recentLogs, setRecentLogs] = useState<AccessLog[]>([]);
  const [recentSearch, setRecentSearch] = useState<string>('');
  const [demoSearch, setDemoSearch] = useState<string>('');
  const [demoCategory, setDemoCategory] = useState<'all' | 'resident' | 'visitor'>('all');

  // Advanced Security Modules States
  const [onsitePeople, setOnsitePeople] = useState<{ userId: string; name: string; document: string; time: string }[]>([]);
  const [votedFeatures, setVotedFeatures] = useState<string[]>([]);
  const [checklistFeedback, setChecklistFeedback] = useState<string>('');
  const [deleteConfirmLogId, setDeleteConfirmLogId] = useState<string | null>(null);

  // Camera & Mobile permissions manager hook
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isScanningFile, setIsScanningFile] = useState<boolean>(false);

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
    
    let userResId: string | undefined = undefined;
    let userResNombre: string | undefined = undefined;
    try {
      const allUsers = await dbService.getAuthorizedUsers();
      const userObj = allUsers.find(u => u.id === userId);
      if (userObj) {
        userResId = userObj.residenciaId;
        userResNombre = userObj.residenciaNombre;
      }
    } catch (e) {}

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
      residenciaId: userResId,
      residenciaNombre: userResNombre,
      casetaId: currentGuard?.casetaId || undefined,
      casetaNombre: currentGuard?.casetaNombre || undefined
    });
    
    reloadOnsitePeople();
    onScanLogged();
  };

  const reloadRecentLogs = async () => {
    try {
      const logs = await dbService.getAccessLogs();
      const sorted = logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentLogs(sorted);
    } catch (err) {
      console.warn('Error loading recent logs:', err);
    }
  };

  const handleDeleteAccessLog = (id: string) => {
    setDeleteConfirmLogId(id);
  };

  const handleConfirmDeleteAccessLog = async () => {
    if (deleteConfirmLogId) {
      try {
        await dbService.deleteAccessLog(deleteConfirmLogId);
        reloadRecentLogs();
        reloadOnsitePeople();
        onScanLogged();
      } catch (err) {
        console.error('Error al eliminar el registro de acceso:', err);
      }
      setDeleteConfirmLogId(null);
    }
  };

  // Load quick-scan options, occupancy list and live bitácora logs
  useEffect(() => {
    dbService.getAuthorizedUsers().then(users => {
      setQuickUsers(users);
    });
    reloadOnsitePeople();
    reloadRecentLogs();
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
  }, []); // No dependencies - uses refs inside handleVerifyToken

  // Handle actual QR scanning with auto-starting camera stream
  useEffect(() => {
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;

    if (useCamera) {
      try {
        // Initialize HTML5 QR Code directly on the target element
        html5QrCode = new Html5Qrcode('qr-live-scanner-box');
        scannerRef.current = html5QrCode;

        // Try to start immediately on the rear-facing camera ('environment')
        html5QrCode.start(
          { facingMode: 'environment' },
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            if (isMounted) {
              const now = Date.now();
              if (decodedText === lastScannedTokenRef.current && now - lastScanTimeRef.current < 3000) {
                // Throttled: do not scan/verify the same code within 3 seconds
                return;
              }
              lastScannedTokenRef.current = decodedText;
              lastScanTimeRef.current = now;

              const isValid = await handleVerifyToken(decodedText);
              if (isValid) {
                setUseCamera(false);
                if (html5QrCode && html5QrCode.isScanning) {
                  html5QrCode.stop().catch(err => console.warn('Error stopping scanner:', err));
                }
              } else {
                console.log('Keep scanning since token was invalid');
              }
            }
          },
          () => {
            // Frame analysis failure, keep checking silently
          }
        ).catch(err => {
          console.warn('Unable to launch rear camera (environment). Attempting front camera...', err);
          
          if (isMounted && html5QrCode) {
            // Fallback directly to the front-facing camera ('user')
            html5QrCode.start(
              { facingMode: 'user' },
              { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
              },
              async (decodedText) => {
                if (isMounted) {
                  const now = Date.now();
                  if (decodedText === lastScannedTokenRef.current && now - lastScanTimeRef.current < 3000) {
                    // Throttled: do not scan/verify the same code within 3 seconds
                    return;
                  }
                  lastScannedTokenRef.current = decodedText;
                  lastScanTimeRef.current = now;

                  const isValid = await handleVerifyToken(decodedText);
                  if (isValid) {
                    setUseCamera(false);
                    if (html5QrCode && html5QrCode.isScanning) {
                      html5QrCode.stop().catch(e => console.warn('Error stopping fallback scanner:', e));
                    }
                  } else {
                    console.log('Keep scanning since token was invalid');
                  }
                }
              },
              () => {
                // Frame analysis failure, keep checking silently
              }
            ).catch(innerErr => {
              console.error('All camera initialization options failed:', innerErr);
              if (isMounted) {
                setPermissionError(
                  'No se pudo conectar con ninguna de las cámaras. Puedes estar viendo este error por restricciones de iframe o si denegaste el acceso. Intenta abrir en "Nueva pestaña" o habilitar permisos de tu navegador.'
                );
                setUseCamera(false);
              }
            });
          }
        });
      } catch (setupError) {
        console.error('Failed to configure direct Html5Qrcode:', setupError);
        if (isMounted) {
          setPermissionError('No se pudo inicializar el recurso del escáner.');
          setUseCamera(false);
        }
      }
    }

    return () => {
      isMounted = false;
      if (html5QrCode) {
        try {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().catch(err => console.warn('Scanner unmount stop error:', err));
          }
        } catch (cleanupError) {
          console.warn('Error during scanner cleanup:', cleanupError);
        }
      }
    };
  }, [useCamera]);

  useEffect(() => {
    if (useCamera) {
      // Ensure the scanner container is fully initialized and rendered, then scroll to center it
      const timer = setTimeout(() => {
        const viewport = document.getElementById('camera-reader-viewport');
        if (viewport) {
          viewport.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [useCamera]);

  const handleQrFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetInput = e.target;
    if (!file) return;

    // Reset target input value instantly so that it can immediately trigger onChange 
    // even if scanning of this same file gets interrupted, fails or retries
    try {
      if (targetInput) {
        targetInput.value = '';
      }
    } catch (resetErr) {
      console.warn('Non-blocking input reset error:', resetErr);
    }
    
    setScanResult(null);
    setPermissionError(null);
    setIsScanningFile(true);
    
    // Create a FileReader to read the file into an image
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (!event.target?.result) {
        setIsScanningFile(false);
        return;
      }
      
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('No se pudo inicializar el contexto 2D de Canvas');
          }
          
          // Downsizw extremely high-resolution camera photos safely to max 1200px 
          // to dramatically increase processing speed, lower RAM spikes, and boost jsQR decoding reliability
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Use jsQR to scan the image pixel data
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });
          
          if (code && code.data) {
            console.log('Decoded successfully via jsQR:', code.data);
            await handleVerifyToken(code.data);
          } else {
            // Fallback: If jsQR fails, try Html5Qrcode.scanFile
            console.warn('jsQR direct decoding failed, attempting html5-qrcode fallback...');
            if (!fileScannerRef.current) {
              fileScannerRef.current = new Html5Qrcode('qr-file-scroller-temp-id');
            }
            const decodedText = await fileScannerRef.current.scanFile(file, true);
            await handleVerifyToken(decodedText);
          }
        } catch (err: any) {
          console.warn('QR file scanning failed on both decoders:', err);
          setPermissionError('No se pudo decodificar el Código QR de la imagen. Asegúrate de que el archivo sea un código QR válido, nítido y bien enfocado o usa el panel de simulación rápida.');
        } finally {
          setIsScanningFile(false);
        }
      };
      
      img.onerror = () => {
        setPermissionError('No se pudo cargar la imagen seleccionada como archivo de imagen válido.');
        setIsScanningFile(false);
      };
      
      img.src = event.target.result as string;
    };
    
    reader.onerror = () => {
      setPermissionError('No se pudo leer el archivo seleccionado.');
      setIsScanningFile(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleVerifyToken = async (token: string): Promise<boolean> => {
    if (!token) return false;
    setPermissionError(null);
    setScanResult(null);
    try {
      if (panicActiveRef.current) {
        setScanResult({
          success: false,
          message: '⚠ SISTEMA EN CRISIS: Control de Acceso QR Bloqueado de forma permanente mientras la ALERTA DE PÁNICO permanezca activa.',
          status: LogStatus.REVOKED_USER
        });
        return false;
      }
      
      const tokenClean = token.trim();
      let tokenToQuery = tokenClean;
      
      // Decrypt/Decode URL encoding if fully encoded
      try {
        if (tokenClean.includes('%')) {
          tokenToQuery = decodeURIComponent(tokenToQuery);
        }
      } catch (err) {
        console.warn('decodeUriComponent error on raw token input:', err);
      }

      // Support extremely robust extraction of 'pass=' or 'token=' from URL or search string/hash
      if (tokenToQuery.includes('?') || tokenToQuery.includes('#') || tokenToQuery.startsWith('http://') || tokenToQuery.startsWith('https://')) {
        try {
          let urlString = tokenToQuery;
          if (!tokenToQuery.startsWith('http://') && !tokenToQuery.startsWith('https://')) {
            urlString = 'https://dummy.com' + (tokenToQuery.startsWith('/') ? '' : '/') + tokenToQuery;
          }
          const url = new URL(urlString);
          
          let extraction = url.searchParams.get('pass') || url.searchParams.get('token');
          
          if (!extraction && url.hash) {
            const hashStr = url.hash;
            if (hashStr.includes('pass=')) {
              extraction = hashStr.split('pass=')[1]?.split('&')[0];
            } else if (hashStr.includes('token=')) {
              extraction = hashStr.split('token=')[1]?.split('&')[0];
            }
          }
          
          if (extraction) {
            tokenToQuery = extraction.trim();
          }
        } catch (urlErr) {
          console.warn('URL parameters extraction failed, parsing using string split fallback:', urlErr);
          if (tokenToQuery.includes('pass=')) {
            const index = tokenToQuery.indexOf('pass=');
            const afterPass = tokenToQuery.substring(index + 5);
            const ampIndex = afterPass.indexOf('&');
            tokenToQuery = ampIndex !== -1 ? afterPass.substring(0, ampIndex) : afterPass;
          } else if (tokenToQuery.includes('token=')) {
            const index = tokenToQuery.indexOf('token=');
            const afterTok = tokenToQuery.substring(index + 6);
            const ampIndex = afterTok.indexOf('&');
            tokenToQuery = ampIndex !== -1 ? afterTok.substring(0, ampIndex) : afterTok;
          }
        }
      }

      tokenToQuery = tokenToQuery.trim();
      
      // 1. Direct real-time lookup from Supabase with key-normalization
      let matchedUser = await dbService.getAuthorizedUserByToken(tokenToQuery);
      
      // 2. Cache-fallback if direct lookup yielded nothing
      if (!matchedUser) {
        const users = await dbService.getAuthorizedUsers();
        matchedUser = users.find(u => 
          u.qrcodeToken?.trim() === tokenToQuery || 
          u.qrcodeToken?.trim().toLowerCase() === tokenToQuery.toLowerCase()
        );
      }

      // Dynamic self-healing recovery for registered residents (like Sandra Santiago)
      if (!matchedUser) {
        let matchedRes = await dbService.getResidenteByToken(tokenToQuery);
        
        if (!matchedRes) {
          const allResidents = await dbService.getResidentes();
          matchedRes = allResidents.find(r => 
            r.qrcodeToken?.trim() === tokenToQuery || 
            r.qrcodeToken?.trim().toLowerCase() === tokenToQuery.toLowerCase()
          );
        }
        
        if (matchedRes) {
          // Automatically provision missing authorized_users link
          const autoPayload: Omit<AuthorizedUser, 'id'> = {
            name: matchedRes.nombre + ' (Residente)',
            documentId: 'RESID-AUTO-' + matchedRes.id.substring(0, 5).toUpperCase(),
            email: 'residente@local.casa',
            phone: matchedRes.whatsapp || '',
            status: UserStatus.ACTIVE,
            qrcodeToken: tokenToQuery,
            oneTime: false,
            used: false,
            validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            days: [],
            startTime: '00:00',
            endTime: '23:59',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system-auto-recovery',
            residenciaId: matchedRes.residenciaId,
            residenciaNombre: matchedRes.residenciaNombre
          };
          
          try {
            const createdAuth = await dbService.createAuthorizedUser(autoPayload);
            // Update resident to point to authorized_users entry
            await dbService.updateResidente(matchedRes.id, {
              ...matchedRes,
              accessUserId: createdAuth.id
            });
            matchedUser = createdAuth;
          } catch (err) {
            console.error('Dynamic authorized_users recovery failed:', err);
          }
        }
      }

      // 3. Check if token matches any registered car Marbete
      if (!matchedUser) {
        let matchedMarbete = await dbService.getMarbeteByToken(tokenToQuery);
        if (!matchedMarbete) {
          const allMarbetes = await dbService.getMarbetes();
          matchedMarbete = allMarbetes.find(m => 
            m.qrcodeToken?.trim() === tokenToQuery || 
            m.qrcodeToken?.trim().toLowerCase() === tokenToQuery.toLowerCase()
          );
        }

        if (matchedMarbete) {
          const isMarbeteExpired = new Date(matchedMarbete.validUntil) < new Date();
          const marbeteStatus = isMarbeteExpired ? UserStatus.EXPIRED : matchedMarbete.status;

          const marbeteAuthPayload: Omit<AuthorizedUser, 'id'> = {
            name: `${matchedMarbete.residenteNombre} (Marbete #${matchedMarbete.consecutivo})`,
            documentId: 'MARBETE-' + matchedMarbete.consecutivo,
            email: 'marbete@local.casa',
            phone: '',
            status: marbeteStatus,
            qrcodeToken: tokenToQuery,
            oneTime: false,
            used: false,
            validFrom: matchedMarbete.validFrom,
            validUntil: matchedMarbete.validUntil,
            days: [],
            startTime: '00:00',
            endTime: '23:59',
            createdAt: matchedMarbete.createdAt,
            updatedAt: matchedMarbete.updatedAt,
            createdBy: 'marbete-system-auto',
            residenciaId: matchedMarbete.residenciaId,
            residenciaNombre: matchedMarbete.residenciaNombre
          };

          try {
            const createdAuth = await dbService.createAuthorizedUser(marbeteAuthPayload);
            matchedUser = createdAuth;
          } catch (err) {
            console.error('Dynamic marbete authorized_user creation failed:', err);
            matchedUser = {
              id: 'mar_fallback_' + matchedMarbete.id,
              ...marbeteAuthPayload
            };
          }
        }
      }

      const guardName = currentGuardRef.current?.name || 'Oficial de Seguridad';
      const guardId = currentGuardRef.current?.uid || 'anonymous-guard';

      // 1. Check if token matches any visitor or registered resident
      if (!matchedUser) {
        const failedResult = {
          success: false,
          message: 'Código QR no reconocido: El pase no se encuentra en el listado de residentes ni visitantes autorizados.',
          status: LogStatus.EXPIRED_TOKEN
        };
        setScanResult(failedResult);
        
        // Log failed attempt
        await dbService.createAccessLog({
          userId: 'unregistered-qr',
          userName: 'Código Desconocido',
          documentId: 'N/A',
          timestamp: new Date().toISOString(),
          type: validationTypeRef.current,
          status: LogStatus.EXPIRED_TOKEN,
          guardId,
          guardName,
          residenciaId: currentGuardRef.current?.residenciaId,
          residenciaNombre: currentGuardRef.current?.residenciaNombre,
          casetaId: currentGuardRef.current?.casetaId,
          casetaNombre: currentGuardRef.current?.casetaNombre
        });
        onScanLogged();
        return false;
      }

      // Check if guard/active operator is bound to a specific residence range:
      if (currentGuardRef.current?.residenciaId && matchedUser.residenciaId && matchedUser.residenciaId !== currentGuardRef.current.residenciaId) {
        const mismatchResult = {
          success: false,
          message: `✗ ACCESO DENEGADO: El pase pertenece a otra residencia (${matchedUser.residenciaNombre || 'ID: ' + matchedUser.residenciaId}). Este detector solo está autorizado para ${currentGuardRef.current.residenciaNombre}.`,
          status: LogStatus.REVOKED_USER
        };
        setScanResult(mismatchResult);
        
        // Log unauthorized attempt for this residence guard
        await dbService.createAccessLog({
          userId: matchedUser.id,
          userName: matchedUser.name,
          documentId: matchedUser.documentId,
          timestamp: new Date().toISOString(),
          type: validationTypeRef.current,
          status: LogStatus.REVOKED_USER,
          guardId,
          guardName,
          residenciaId: currentGuardRef.current?.residenciaId,
          residenciaNombre: currentGuardRef.current?.residenciaNombre,
          casetaId: currentGuardRef.current?.casetaId,
          casetaNombre: currentGuardRef.current?.casetaNombre
        });
        onScanLogged();
        return false;
      }

      // Determine resident and automatic transition rule
      const isResident = matchedUser.name.includes('(Residente)') || matchedUser.id.startsWith('usr_resd_');
      let detectedType = validationTypeRef.current;

      if (isResident) {
        const logsList = await dbService.getAccessLogs();
        const successLogs = logsList
          .filter(l => l.userId === matchedUser.id && l.status === LogStatus.SUCCESS);

        if (successLogs.length > 0) {
          // Sort oldest to newest to identify the very first scan choice selected by the guard
          const sortedOldestFirst = [...successLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          const firstType = sortedOldestFirst[0].type;
          const totalUserReads = successLogs.length;

          // Determine next state using parity: if even, same as first; if odd, opposite direction
          if (totalUserReads % 2 === 0) {
            detectedType = firstType;
          } else {
            detectedType = firstType === LogType.CHECK_IN ? LogType.CHECK_OUT : LogType.CHECK_IN;
          }
        } else {
          // Use vigilante's selection on first scan
          detectedType = validationTypeRef.current;
        }
        
        // Sync the toggle state visually on screen
        setValidationType(detectedType);
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
        logScan(matchedUser, LogStatus.REVOKED_USER, detectedType);
        return false;
      }

      if (matchedUser.status === UserStatus.EXPIRED) {
        const result = {
          success: false,
          message: `Acceso Denegado: El pase de ${matchedUser.name} ha EXPIRADO permanentemente.`,
          user: matchedUser,
          status: LogStatus.EXPIRED_TOKEN
        };
        setScanResult(result);
        logScan(matchedUser, LogStatus.EXPIRED_TOKEN, detectedType);
        return false;
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
        logScan(matchedUser, LogStatus.OUTSIDE_SCHEDULE, detectedType);
        return false;
      }

      if (now > validUntil) {
        const result = {
          success: false,
          message: `Acceso Denegado: El pase expiró el ${validUntil.toLocaleDateString()} a las ${validUntil.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`,
          user: matchedUser,
          status: LogStatus.EXPIRED_TOKEN
        };
        setScanResult(result);
        logScan(matchedUser, LogStatus.EXPIRED_TOKEN, detectedType);
        return false;
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
        logScan(matchedUser, LogStatus.OUTSIDE_SCHEDULE, detectedType);
        return false;
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
          logScan(matchedUser, LogStatus.OUTSIDE_SCHEDULE, detectedType);
          return false;
        }
      }

      // 5. One-time access check
      if (matchedUser.oneTime && matchedUser.used && detectedType === LogType.CHECK_IN) {
        const result = {
          success: false,
          message: `Acceso Denegado: El pase de un solo uso ya ha sido UTILIZADO anteriormente y no se permite la re-entrada.`,
          user: matchedUser,
          status: LogStatus.ALREADY_USED
        };
        setScanResult(result);
        logScan(matchedUser, LogStatus.ALREADY_USED, detectedType);
        return false;
      }

      // SUCCESS - VALID QR PASS!
      const displayResName = matchedUser.name.replace(' (Residente)', '');
      let successMessage = `¡Pase VALIDADOR Autorizado! Bienvenido, ${matchedUser.name}.`;
      
      if (isResident) {
        if (detectedType === LogType.CHECK_IN) {
          successMessage = `🟢 ¡ENTRADA REGISTRADA Y AUTORIZADA! Bienvenido de vuelta, residente: ${displayResName}.`;
        } else {
          successMessage = `🔵 ¡SALIDA REGISTRADA Y AUTORIZADA! Buen viaje, residente: ${displayResName}.`;
        }
      } else {
        if (detectedType === LogType.CHECK_IN) {
          successMessage = `🟢 ¡ENTRADA AUTORIZADA! Bienvenido, visitante: ${matchedUser.name}.`;
        } else {
          successMessage = `🔵 ¡SALIDA AUTORIZADA! Buen viaje, visitante: ${matchedUser.name}.`;
        }
      }

      const successResult = {
        success: true,
        message: successMessage,
        user: matchedUser,
        status: LogStatus.SUCCESS
      };
      setScanResult(successResult);

      // If one-time checkin, mark the user as used!
      if (matchedUser.oneTime && detectedType === LogType.CHECK_IN) {
        await dbService.updateAuthorizedUser(matchedUser.id, { used: true });
      }

      // Log the successful access audit trail
      await logScan(matchedUser, LogStatus.SUCCESS, detectedType);

      // Fire confetti for a high-craft delightful verification animation!
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });

      return true;
    } catch (err: any) {
      console.error('Critical verification runtime error:', err);
      setScanResult({
        success: false,
        message: `Error al procesar la verificación: ${err?.message || String(err)}`,
        status: LogStatus.EXPIRED_TOKEN
      });
      return false;
    }
  };

  const logScan = async (user: AuthorizedUser, status: LogStatus, customType?: LogType) => {
    const logData: Omit<AccessLog, 'id'> = {
      userId: user.id,
      userName: user.name,
      documentId: user.documentId,
      timestamp: new Date().toISOString(),
      type: customType || validationType,
      status: status,
      guardId: currentGuard?.uid || 'anonymous-guard',
      guardName: currentGuard?.name || 'Guardia de Seguridad',
      residenciaId: user.residenciaId,
      residenciaNombre: user.residenciaNombre,
      casetaId: currentGuard?.casetaId || undefined,
      casetaNombre: currentGuard?.casetaNombre || undefined
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
      {/* Floating QR scanning modal indicator */}
      <AnimatePresence>
        {isScanningFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] w-full h-full flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6 mx-auto my-auto relative"
            >
              <div className="relative flex items-center justify-center py-4">
                {/* Visual loading ripples */}
                <div className="absolute w-24 h-24 bg-red-550/10 rounded-full animate-ping" />
                <div className="absolute w-16 h-16 bg-red-550/20 rounded-full animate-pulse" />
                
                <div className="relative w-14 h-14 bg-red-650/20 rounded-full flex items-center justify-center border border-red-500/40">
                  <RefreshCw className="w-6 h-6 text-red-500 animate-spin" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-100 tracking-tight">
                  Leyendo código QR
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Por favor, espere un momento mientras procesamos la imagen y validamos el acceso...
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-950/60 rounded-xl border border-slate-800 w-fit mx-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 font-mono">
                  Procesando foto
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            onClick={async () => {
              setPanicActive(false);
              setScanResult(null);
              // Sync with global custom handlers
              (window as any).globalPanicActive = false;
              if ((window as any).onGlobalPanicChange) {
                (window as any).onGlobalPanicChange(false);
              }
              if (currentGuard?.residenciaId) {
                try {
                  await dbService.updateResidencia(currentGuard.residenciaId, { panicActive: false });
                } catch (e) {
                  console.warn("Failed to sync panic active deactivation to database:", e);
                }
              }
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
              <button
                id="btn-click-icon-camera"
                onClick={async () => {
                  setScanResult(null);
                  if (cameraPermission !== 'granted') {
                    const ok = await requestCameraPermission();
                    if (!ok) return;
                  }
                  setUseCamera(true);
                }}
                className="hover:scale-110 active:scale-95 transition-all p-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-900 shadow-sm cursor-pointer mr-0.5 inline-flex items-center justify-center"
                title="Haga clic aquí para iniciar el escáner de QR por cámara"
              >
                <Camera className="w-5 h-5" />
              </button>
              Interfaz de Validación (Escaneo)
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
            <div id="camera-idle-view" className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl p-6 sm:p-10 bg-slate-950 text-center min-h-[300px] space-y-5">
              <div className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-850 shadow-xs text-slate-400 relative overflow-hidden mx-auto">
                <div className="scan-overlay opacity-30"></div>
                <Camera className="w-6 h-6 text-red-500" />
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
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-red-500" /> Solicitar Permiso de Cámara
                  </button>
                )}

                {/* Robust Camera Capture Snapshot & File Scanner tool */}
                <div className="border border-red-500/10 p-4 rounded-2xl bg-slate-950/40 text-left mt-5 mb-4">
                  <div className="flex items-center gap-2 mb-2 bg-slate-950 p-2 rounded-xl">
                    <span className="p-1.5 bg-red-600/10 rounded-lg text-red-100"><Camera className="w-4 h-4" /></span>
                    <span className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wider font-sans">Opción B: Tomar Foto / Cargar QR</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    Captura instantáneamente una foto del código QR físico con tu celular, o carga un archivo existente para validarlo de inmediato:
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <label className="flex flex-col items-center justify-center p-4 border border-dashed border-red-500/20 hover:border-red-500/40 rounded-xl hover:bg-red-600/5 transition cursor-pointer text-center group">
                      <Camera className="w-6 h-6 text-red-500 group-hover:scale-110 transition mb-1.5" />
                      <span className="text-xs font-bold text-slate-200">Arranque de Cámara Especial (Foto QR)</span>
                      <span className="text-[10px] text-slate-500 mt-1 font-sans">Abre el obturador de cámara de fotos de tu smartphone</span>
                      <input
                        id="qr-camera-direct-snapshot"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onClick={(e) => {
                          setPermissionError(null);
                          setScanResult(null);
                          (e.target as HTMLInputElement).value = '';
                        }}
                        onChange={handleQrFileSelected}
                        className="hidden"
                      />
                    </label>

                    {/* Standard File Upload */}
                    <label className="block bg-[#020617] p-2.5 rounded-xl border border-slate-900">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Buscar y cargar archivo QR de galería:</span>
                      <input
                        id="qr-image-file-decoder"
                        type="file"
                        accept="image/*"
                        onClick={(e) => {
                          setPermissionError(null);
                          setScanResult(null);
                          (e.target as HTMLInputElement).value = '';
                        }}
                        onChange={handleQrFileSelected}
                        className="block w-full text-[11px] text-slate-400 file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-zinc-800 file:text-slate-300 hover:file:bg-zinc-700 cursor-pointer"
                      />
                    </label>
                  </div>
                  <div id="qr-file-scroller-temp-id" className="hidden"></div>
                </div>
              </div>

              {/* Main scan Trigger Button */}
              <button
                id="btn-trigger-camera-opt"
                onClick={async () => {
                  setScanResult(null);
                  setPermissionError(null);
                  if (cameraPermission !== 'granted') {
                    const ok = await requestCameraPermission();
                    if (!ok) return; // Wait for explicit authorization
                  }
                  setUseCamera(true);
                }}
                className="inline-flex items-center gap-2 justify-center px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition shadow-sm cursor-pointer w-full max-w-sm"
              >
                <Smartphone className="w-4 h-4" /> Activar Cámara de Escaneo
              </button>
            </div>
          )}
        </div>

        {/* Sandbox Simulation Frame for instant testing */}
        {false && (
          <div id="simulation-sandbox-tray" className="mt-8 border-t border-zinc-900 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Pruebas Manuales y Simulación de QR</label>
            </div>
            
            {/* Quick configuration category switcher */}
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setDemoCategory('all')}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${demoCategory === 'all' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setDemoCategory('resident')}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${demoCategory === 'resident' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Residentes 🏡
              </button>
              <button
                type="button"
                onClick={() => setDemoCategory('visitor')}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${demoCategory === 'visitor' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Visitantes 🎫
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Busca y presiona el botón de escaneo de cualquier residente o visitante para simular la lectura de su código QR y evaluar las autorizaciones, vigilando el tránsito con total agilidad:
          </p>

          {/* Real-time search query for the simulator */}
          <div className="relative mb-3">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre, documento o residencia id..."
              value={demoSearch}
              onChange={(e) => setDemoSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-slate-700/80 focus:outline-hidden"
            />
          </div>

          {/* Interactive Simulation Grid */}
          <div id="quick-demo-test-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 max-h-[160px] overflow-y-auto pr-1">
            {quickUsers.filter(user => {
              const isRes = user.name.includes('(Residente)') || user.id.startsWith('usr_resd_');
              const matchesCategory = 
                demoCategory === 'all' || 
                (demoCategory === 'resident' && isRes) || 
                (demoCategory === 'visitor' && !isRes);
                
              const matchesSearch = 
                user.name.toLowerCase().includes(demoSearch.toLowerCase()) || 
                user.documentId.toLowerCase().includes(demoSearch.toLowerCase());
                
              return matchesCategory && matchesSearch;
            }).map((user) => {
              const isRes = user.name.includes('(Residente)') || user.id.startsWith('usr_resd_');
              return (
                <button
                  key={user.id}
                  type="button"
                  id={`simulate-scan-${user.id}`}
                  onClick={() => {
                    setScanResult(null);
                    handleVerifyToken(user.qrcodeToken);
                  }}
                  className="flex items-center justify-between text-left px-3 py-2 border border-slate-850 bg-[#020617]/40 rounded-xl hover:border-slate-750 hover:bg-slate-900 transition text-xs cursor-pointer group"
                >
                  <div className="truncate pr-2">
                    <p className="font-semibold text-slate-200 group-hover:text-red-400 transition truncate flex items-center gap-1">
                      {isRes ? '🏡' : '🎫'} {user.name}
                    </p>
                    <p className="text-[10px] text-slate-450 font-mono truncate">{user.documentId}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                    user.status === UserStatus.ACTIVE 
                      ? user.oneTime 
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/25' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      : 'bg-red-500/10 text-red-400 border-red-500/25'
                  }`}>
                    {user.status === UserStatus.ACTIVE ? (user.oneTime ? 'Único' : 'Frecuente') : 'Expirado'}
                  </span>
                </button>
              );
            })}
            {quickUsers.filter(user => {
              const isRes = user.name.includes('(Residente)') || user.id.startsWith('usr_resd_');
              const matchesCategory = 
                demoCategory === 'all' || 
                (demoCategory === 'resident' && isRes) || 
                (demoCategory === 'visitor' && !isRes);
                
              const matchesSearch = 
                user.name.toLowerCase().includes(demoSearch.toLowerCase()) || 
                user.documentId.toLowerCase().includes(demoSearch.toLowerCase());
                
              return matchesCategory && matchesSearch;
            }).length === 0 && (
              <p className="text-slate-500 text-xs text-center col-span-2 py-4">No se encontraron residentes o visitantes cargados con ese filtro.</p>
            )}
          </div>

          <div id="simulated-token-typing" className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Key className="w-3.5 h-3.5" />
              </span>
              <input
                id="input-token-manual-type"
                type="text"
                placeholder="O escribe/pega el token del pase manualmente..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-850 rounded-xl text-slate-205 focus:border-slate-700 focus:outline-hidden"
              />
            </div>
            <button
              id="btn-trigger-manual-token"
              type="button"
              onClick={() => {
                setScanResult(null);
                handleVerifyToken(manualToken);
                setManualToken('');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700 cursor-pointer"
            >
              Simular Lectura
            </button>
          </div>
        </div>
        )}
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
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-zinc-850 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-red-500" /> Perfil del Visitante
                  </p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-1">
                    <div>
                      <p className="text-slate-500 font-medium">Nombre Completo</p>
                      <p className="font-semibold text-slate-200">{scanResult.user.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Documento de Identidad</p>
                      <p className="font-semibold text-red-400 font-mono">{scanResult.user.documentId}</p>
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
                    {scanResult.user.residenciaNombre && (
                      <div className="col-span-2 mt-2 bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">🏡 Residencia de Destino (Se dirige a)</p>
                        <p className="font-extrabold text-white text-xs mt-0.5">{scanResult.user.residenciaNombre}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-dashed border-zinc-850 pt-2.5 mt-2.5 grid grid-cols-1 gap-y-1">
                    <p className="text-slate-400 font-medium leading-relaxed">
                      Este pase es válido del: <span className="font-semibold text-slate-205">{new Date(scanResult.user.validFrom).toLocaleDateString()}</span> al <span className="font-semibold text-slate-205">{new Date(scanResult.user.validUntil).toLocaleDateString()}</span>.
                    </p>
                    {scanResult.user.startTime && (
                      <p className="text-slate-450 font-medium">
                        Horario Diario: <span className="font-semibold text-red-500">{scanResult.user.startTime} - {scanResult.user.endTime}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button
                id="btn-scan-verdict-clear"
                onClick={() => setScanResult(null)}
                className="mt-8 inline-flex items-center gap-2 justify-center px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-slate-200 text-xs font-semibold rounded-xl transition border border-zinc-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Escanear Nuevo Código
              </button>
            </div>
          ) : (
            <div id="verdict-idle-guide" className="text-center py-10">
              <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center border border-zinc-850 shadow-sm mx-auto mb-4 text-slate-400 relative overflow-hidden">
                <div className="scan-overlay opacity-20"></div>
                <Smartphone className="w-7 h-7 text-red-500 animate-pulse" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">
                {currentGuard?.role === SystemUserRole.SUPERVISOR ? 'Lector QR de Caseta Activo' : 'Esperando Lectura de Código'}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">
                {currentGuard?.role === SystemUserRole.SUPERVISOR 
                  ? 'Posicione el código QR del pase del residente o visitante frente al lector o cámara para validar su ingreso/salida.'
                  : 'Escanea un QR o introduce datos en el panel de la izquierda para desplegar el dictamen automático de entrada/salida y revisar credenciales.'
                }
              </p>
              <div id="active-guard-context-card" className="mt-8 inline-block bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 text-left">
                <p className="font-semibold text-red-500">
                  {currentGuard?.role === SystemUserRole.SUPERVISOR ? 'Oficial de Seguridad:' : 'Residente Autenticado:'}
                </p>
                <p className="text-slate-300 mt-0.5">{currentGuard?.name} • <span className="font-mono text-red-400">{currentGuard?.uid}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Live Access Log Terminal (Bitácora del Día en Tiempo Real) */}
    <div id="live-reception-logbook" className="mt-8 bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 shadow-2xl">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-slate-900 mb-6">
        <div>
          <h3 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className="flex h-2 w-2 relative font-sans">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            📖 Bitácora en Vivo de Accesos ({currentGuard?.casetaNombre || 'Caseta General'})
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Muestra el registro cronológico en tiempo real de residentes y visitantes autorizados que cruzan el punto de acceso.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Real-time search filter */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Filtrar bitácora por nombre..."
              value={recentSearch}
              onChange={(e) => setRecentSearch(e.target.value)}
              className="w-full sm:w-[240px] pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-slate-700/80 focus:outline-hidden"
            />
          </div>

          <button
            type="button"
            onClick={reloadRecentLogs}
            className="inline-flex items-center gap-1.5 justify-center px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition border border-slate-800 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sincronizar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#020617] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-900">
            <tr>
              <th className="py-3 px-4">Hora</th>
              <th className="py-3 px-4">Residente / Visitante</th>
              <th className="py-3 px-4">DNI / Identificación</th>
              <th className="py-3 px-4">Tipo Movimiento</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Vigilante Responsable</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/60 font-sans">
            {recentLogs
              .filter(log => {
                if (!recentSearch) return true;
                return log.userName.toLowerCase().includes(recentSearch.toLowerCase()) || 
                       log.documentId.toLowerCase().includes(recentSearch.toLowerCase());
              })
              .map((log) => {
                const isRes = log.userName.includes('(Residente)') || log.userId.startsWith('usr_resd_');
                return (
                  <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 font-bold">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-200 flex items-center gap-1.5">
                        {isRes ? '🏡' : '🎫'} {log.userName}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-red-400/90 font-semibold">{log.documentId}</td>
                    <td className="py-3 px-4">
                      {log.type === LogType.CHECK_IN ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Entrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span> Salida
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {log.status === LogStatus.SUCCESS ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-400/10 text-emerald-400">
                          ✓ Autorizado
                        </span>
                      ) : log.status === LogStatus.EXPIRED_TOKEN ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#ef4444]/10 text-[#f87171]">
                          ✗ Expirado/No Válido
                        </span>
                      ) : log.status === LogStatus.REVOKED_USER ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-450">
                          ⚠ Bloqueado/Pánico
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-500/10 text-zinc-400">
                          {log.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-medium">
                      {(log.guardName || 'Sistema').replace(/\s*\(Simulado\)/gi, '')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteAccessLog(log.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-400 rounded-xl text-[10px] font-bold transition border border-red-500/20 cursor-pointer"
                        title="Borrar de la bitácora"
                      >
                        <Trash2 className="w-3 h-3" /> Borrar
                      </button>
                    </td>
                  </tr>
                );
              })}
            {recentLogs.filter(log => {
              if (!recentSearch) return true;
              return log.userName.toLowerCase().includes(recentSearch.toLowerCase()) || 
                     log.documentId.toLowerCase().includes(recentSearch.toLowerCase());
            }).length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-500 font-medium">
                  {recentSearch ? 'No se encontraron registros de accesos con esa descripción.' : 'No se registran accesos en la bitácora el día de hoy.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* BENTO GRID SECURITY ROADMAP & COMMAND CENTER */}
    <div id="security-bento-grid" className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
      
      {/* Module 1: Panic Trigger Command (col-span-12 or col-span-4 depending on role) */}
      <div id="bento-panic-card" className={`${currentGuard?.role === SystemUserRole.SUPERVISOR ? 'md:col-span-12' : 'md:col-span-4'} bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between min-h-[200px]`}>
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
          onClick={async () => {
            const nextState = !panicActive;
            setPanicActive(nextState);
            setUseCamera(false);
            
            // Sync with global custom handlers
            (window as any).globalPanicActive = nextState;
            if ((window as any).onGlobalPanicChange) {
              (window as any).onGlobalPanicChange(nextState);
            }

            if (currentGuard?.residenciaId) {
              try {
                await dbService.updateResidencia(currentGuard.residenciaId, { panicActive: nextState });
              } catch (e) {
                console.warn("Failed to sync panic active to database:", e);
              }
            }

            if (nextState) {
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
      {currentGuard?.role !== SystemUserRole.SUPERVISOR && (
        <div id="bento-occupancy-card" className="md:col-span-4 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between min-h-[220px]">
          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between">
              <span className="px-2 py-1 text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-md uppercase tracking-widest">Control de Tránsito</span>
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
                    className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-red-500 hover:bg-red-950/20 text-slate-400 hover:text-red-400 rounded-lg text-[9px] font-bold transition shrink-0 cursor-pointer"
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
      )}

      {/* Module 3: Security Checklist & Roadmap Scheduler (col-span-4) */}
      {currentGuard?.role !== SystemUserRole.SUPERVISOR && (
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
                <input type="checkbox" checked readOnly className="mt-0.5 pointer-events-none accent-red-500 shrink-0" />
                <div className="leading-tight">
                  <p className="font-bold text-emerald-400">✓ Roles y Permisos RBAC Activados</p>
                  <p className="text-[9px] text-slate-500">Módulos restringidos para Admin/Guardia/Supervisores</p>
                </div>
              </div>

              <div className="flex items-start gap-1.5 text-[10px]">
                <input type="checkbox" checked readOnly className="mt-0.5 pointer-events-none accent-red-500 shrink-0" />
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
      )}

      {/* CUSTOM LOG DELETION CONFIRMATION */}
      {deleteConfirmLogId && (
        <div id="delete-log-confirm-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#18181c] rounded-2xl border border-[#2e2e38] shadow-2xl max-w-sm w-full p-6 text-center text-xs text-slate-200">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto transition">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm mb-3 uppercase tracking-wider">Confirmar Eliminación</h3>
            <p className="text-slate-300 leading-relaxed mb-6">
              ¿Está seguro de que desea eliminar permanentemente este registro de acceso de la bitácora? Esta acción no se puede deshacer.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmLogId(null)}
                className="px-4 py-2.5 bg-[#1A1A1E] hover:bg-[#2A2A2E] text-slate-200 border border-[#2e2e38] font-semibold rounded-xl transition cursor-pointer"
              >
                No, cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccessLog}
                className="px-4 py-2.5 bg-red-650 hover:bg-red-550 text-white font-semibold rounded-xl transition cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
);
}
