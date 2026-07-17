import React, { useState, useRef, useEffect } from 'react';
import { 
  Building, DollarSign, ShieldCheck, Settings, Users, FileText, 
  TrendingUp, CreditCard, Calendar, MessageSquare, Bell, Camera, 
  PhoneCall, Package, Check, Clipboard, QrCode, AlertTriangle, 
  Activity, ArrowUpRight, ArrowDownRight, Upload, Globe, RefreshCw, Send, Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Payment {
  id: string;
  condo: string;
  resident: string;
  concept: string;
  amount: number;
  dueDate: string;
  status: 'pagado' | 'pendiente' | 'vencido';
  paymentMethod?: string;
  paymentDate?: string;
}

interface AmenityReservation {
  id: string;
  amenityName: string;
  resident: string;
  condo: string;
  date: string;
  timeSlot: string;
  status: 'confirmado' | 'pendiente';
}

interface HelpDeskTicket {
  id: string;
  condo: string;
  category: string;
  description: string;
  priority: 'alta' | 'media' | 'baja';
  status: 'abierto' | 'en_progreso' | 'resuelto';
  createdAt: string;
}

interface Parcel {
  id: string;
  condo: string;
  resident: string;
  carrier: string;
  trackingNumber: string;
  receivedAt: string;
  status: 'en_recepcion' | 'entregado';
}

interface Bulletin {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'seguridad' | 'mantenimiento' | 'comunidad';
}

interface FiscalReceptor {
  id: string;
  condo: string;
  rfc: string;
  razonSocial: string;
  cp: string;
  regimen: string;
  usoCfdi: string;
  status: 'verificado' | 'pendiente' | 'error';
}

export default function CondominiosDashboard() {
  // Navigation
  const [activeSubSection, setActiveSubSection] = useState<'finanzas' | 'seguridad' | 'operaciones' | 'facturacion' | 'checklist'>('finanzas');

  // --- 1. FINANZAS STATE ---
  const [payments, setPayments] = useState<Payment[]>([
    { id: 'pay-1', condo: 'Casa 102', resident: 'Alejandro Ruiz', concept: 'Mantenimiento Julio 2026', amount: 2500, dueDate: '2026-07-10', status: 'pagado', paymentMethod: 'Tarjeta de Crédito', paymentDate: '2026-07-05' },
    { id: 'pay-2', condo: 'Casa 105', resident: 'Haroldo Residente', concept: 'Mantenimiento Julio 2026', amount: 2500, dueDate: '2026-07-10', status: 'pendiente' },
    { id: 'pay-3', condo: 'Casa 110', resident: 'Sofía Mendoza', concept: 'Mantenimiento Julio 2026', amount: 2500, dueDate: '2026-07-10', status: 'vencido' },
    { id: 'pay-4', condo: 'Casa 112', resident: 'Eduardo Garza', concept: 'Reserva Salón de Eventos', amount: 1500, dueDate: '2026-07-15', status: 'pagado', paymentMethod: 'SPEI Transferencia', paymentDate: '2026-07-12' },
    { id: 'pay-5', condo: 'Casa 115', resident: 'Lucía Fernández', concept: 'Mantenimiento Julio 2026', amount: 2500, dueDate: '2026-07-10', status: 'pendiente' },
  ]);

  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'todos' | 'pagado' | 'pendiente' | 'vencido'>('todos');
  
  // Payment gateway modal simulation
  const [selectedPaymentToPay, setSelectedPaymentToPay] = useState<Payment | null>(null);
  const [gatewayMethod, setGatewayMethod] = useState<'tarjeta' | 'spei' | 'wallet'>('tarjeta');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [payingState, setPayingState] = useState<'idle' | 'processing' | 'success'>('idle');

  // Account Statement Viewer
  const [viewingStatementPayment, setViewingStatementPayment] = useState<Payment | null>(null);

  // New payment creation state (Admin view)
  const [newPayCondo, setNewPayCondo] = useState('');
  const [newPayResident, setNewPayResident] = useState('');
  const [newPayConcept, setNewPayConcept] = useState('Mantenimiento mensual');
  const [newPayAmount, setNewPayAmount] = useState('2500');
  const [newPayDueDate, setNewPayDueDate] = useState('2026-08-10');

  // --- 2. SEGURIDAD & ACCESOS STATE ---
  // QR Invitations generator
  const [visitorName, setVisitorName] = useState('');
  const [visitorCondo, setVisitorCondo] = useState('');
  const [visitorPlate, setVisitorPlate] = useState('');
  const [generatedInviteQR, setGeneratedInviteQR] = useState<string | null>(null);

  // Biometrics
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);
  const [biometricMessage, setBiometricMessage] = useState('Coloque su rostro frente al sensor de su dispositivo');
  const [hasBiometricLock, setHasBiometricLock] = useState(false);

  // Intercom
  const [intercomCondo, setIntercomCondo] = useState('');
  const [intercomState, setIntercomState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [intercomLogs, setIntercomLogs] = useState<string[]>([]);
  const callTimerRef = useRef<any>(null);

  // Parcels
  const [parcels, setParcels] = useState<Parcel[]>([
    { id: 'pkg-1', condo: 'Casa 102', resident: 'Alejandro Ruiz', carrier: 'Amazon Prime', trackingNumber: 'AMZ-458921', receivedAt: '2026-07-16 11:30', status: 'en_recepcion' },
    { id: 'pkg-2', condo: 'Casa 105', resident: 'Haroldo Residente', carrier: 'DHL Express', trackingNumber: 'DHL-8874102', receivedAt: '2026-07-15 09:15', status: 'entregado' },
    { id: 'pkg-3', condo: 'Casa 110', resident: 'Sofía Mendoza', carrier: 'Mercado Libre', trackingNumber: 'MELI-90124823', receivedAt: '2026-07-17 08:00', status: 'en_recepcion' },
  ]);
  const [newParcelCondo, setNewParcelCondo] = useState('');
  const [newParcelResident, setNewParcelResident] = useState('');
  const [newParcelCarrier, setNewParcelCarrier] = useState('Amazon');
  const [newParcelTracking, setNewParcelTracking] = useState('');

  // --- 3. OPERACIÓN & COMUNIDAD STATE ---
  // Amenities Reservations
  const [reservations, setReservations] = useState<AmenityReservation[]>([
    { id: 'resv-1', amenityName: 'Salón de Eventos', resident: 'Alejandro Ruiz', condo: 'Casa 102', date: '2026-07-20', timeSlot: '14:00 - 22:00', status: 'confirmado' },
    { id: 'resv-2', amenityName: 'Alberca & Terraza', resident: 'Haroldo Residente', condo: 'Casa 105', date: '2026-07-18', timeSlot: '09:00 - 13:00', status: 'pendiente' },
  ]);
  const [selectedAmenity, setSelectedAmenity] = useState('Salón de Eventos');
  const [resvDate, setResvDate] = useState('2026-07-19');
  const [resvTimeSlot, setResvTimeSlot] = useState('14:00 - 20:00');
  const [resvResident, setResvResident] = useState('');
  const [resvCondo, setResvCondo] = useState('');

  // Help Desk Tickets
  const [tickets, setTickets] = useState<HelpDeskTicket[]>([
    { id: 'tkt-1', condo: 'Casa 102', category: 'Plomería', description: 'Fuga de agua en el medidor principal', priority: 'alta', status: 'en_progreso', createdAt: '2026-07-16' },
    { id: 'tkt-2', condo: 'Casa 105', category: 'Eléctrico', description: 'Falla en luminaria de la banqueta frontal', priority: 'media', status: 'abierto', createdAt: '2026-07-17' },
    { id: 'tkt-3', condo: 'Casa 110', category: 'Áreas Comunes', description: 'La puerta de la alberca no cierra con seguro', priority: 'alta', status: 'resuelto', createdAt: '2026-07-15' },
  ]);
  const [newTicketCondo, setNewTicketCondo] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Mantenimiento General');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<'alta' | 'media' | 'baja'>('media');

  // Bulletin Board
  const [bulletins, setBulletins] = useState<Bulletin[]>([
    { id: 'bul-1', title: 'Mantenimiento Anual de Alberca', content: 'Se les informa que la alberca comunal permanecerá cerrada los días 21 y 22 de Julio por labores de limpieza profunda y balance químico.', date: '2026-07-16', category: 'mantenimiento' },
    { id: 'bul-2', title: 'Reforzamiento de Seguridad en Accesos', content: 'A partir de esta semana, los oficiales de caseta solicitarán identificación física oficial obligatoria (INE o Licencia) a todas las visitas y proveedores.', date: '2026-07-15', category: 'seguridad' },
  ]);
  const [newBulletinTitle, setNewBulletinTitle] = useState('');
  const [newBulletinContent, setNewBulletinContent] = useState('');
  const [newBulletinCategory, setNewBulletinCategory] = useState<'seguridad' | 'mantenimiento' | 'comunidad'>('comunidad');

  // --- 4. FACTURACIÓN CFDI 4.0 STATE ---
  // A. Emisor Settings
  const [emisorRfc, setEmisorRfc] = useState('CNO160715AAA');
  const [emisorRegimen, setEmisorRegimen] = useState('601'); // General de Ley Personas Morales
  const [csdUploadedCer, setCsdUploadedCer] = useState<string | null>('certificado_csd_2026.cer');
  const [csdUploadedKey, setCsdUploadedKey] = useState<string | null>('llave_privada_csd.key');
  const [csdPass, setCsdPass] = useState('•••••••••••••');
  const [lcoStatus, setLcoStatus] = useState<'activo' | 'desconectado'>('activo');

  // B. Receptors Catalog
  const [receptors, setReceptors] = useState<FiscalReceptor[]>([
    { id: 'rec-1', condo: 'Casa 102', rfc: 'RUAL890520HB8', razonSocial: 'ALEJANDRO RUIZ ALVAREZ', cp: '11000', regimen: '605', usoCfdi: 'G03', status: 'verificado' },
    { id: 'rec-2', condo: 'Casa 105', rfc: 'HAR881210MZ2', razonSocial: 'HAROLDO RESIDENTE SILVA', cp: '11000', regimen: '601', usoCfdi: 'CP01', status: 'verificado' },
    { id: 'rec-3', condo: 'Casa 110', rfc: 'MESA920311K61', razonSocial: 'SOFIA MENDOZA SANCHEZ', cp: '11030', regimen: '605', usoCfdi: 'G03', status: 'pendiente' },
  ]);
  const [newRecCondo, setNewRecCondo] = useState('');
  const [newRecRfc, setNewRecRfc] = useState('');
  const [newRecRazon, setNewRecRazon] = useState('');
  const [newRecCp, setNewRecCp] = useState('');
  const [newRecRegimen, setNewRecRegimen] = useState('605');
  const [newRecUso, setNewRecUso] = useState('G03');

  // C. PAC config
  const [pacProvider, setPacProvider] = useState<'facturama' | 'fiscalapi' | 'finkok'>('fiscalapi');
  const [pacApiKey, setPacApiKey] = useState('prod_key_live_55928fka832kd901asla');
  const [sandboxMode, setSandboxMode] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // --- ACTIONS & HANDLERS ---
  
  // Create simulated new payment
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayCondo || !newPayResident) return;
    const newPay: Payment = {
      id: `pay-${Date.now()}`,
      condo: newPayCondo,
      resident: newPayResident,
      concept: newPayConcept,
      amount: parseFloat(newPayAmount) || 0,
      dueDate: newPayDueDate,
      status: 'pendiente'
    };
    setPayments([newPay, ...payments]);
    setNewPayCondo('');
    setNewPayResident('');
    setNewPayConcept('Mantenimiento mensual');
  };

  // Payment process simulation
  const handleProcessPayment = () => {
    if (!selectedPaymentToPay) return;
    setPayingState('processing');
    
    setTimeout(() => {
      setPayingState('success');
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#3b82f6', '#10b981']
      });

      // Update payment record in state
      setPayments(payments.map(p => {
        if (p.id === selectedPaymentToPay.id) {
          return {
            ...p,
            status: 'pagado',
            paymentMethod: gatewayMethod === 'tarjeta' ? 'Tarjeta de Débito/Crédito' : gatewayMethod === 'spei' ? 'SPEI Transferencia Bancaria' : 'Billetera Digital Apple Pay',
            paymentDate: new Date().toISOString().split('T')[0]
          };
        }
        return p;
      }));

      setTimeout(() => {
        setSelectedPaymentToPay(null);
        setPayingState('idle');
        setCardNumber('');
        setCardName('');
        setCardExpiry('');
        setCardCvv('');
      }, 1500);

    }, 2000);
  };

  // Generate Invite QR
  const handleGenerateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitorCondo) return;
    const qrcodePayload = `PASSPORT-CNLS-INVITE-${visitorCondo.replace(/\s+/g, '')}-${Date.now()}`;
    setGeneratedInviteQR(qrcodePayload);
  };

  // Biometrics scan simulation
  const triggerBiometricScan = () => {
    setBiometricScanning(true);
    setBiometricSuccess(false);
    setBiometricMessage('Verificando rasgos biométricos faciales contra registro oficial...');
    
    setTimeout(() => {
      setBiometricSuccess(true);
      setBiometricScanning(false);
      setBiometricMessage('¡Autenticación biométrica exitosa! Acceso desbloqueado.');
      setTimeout(() => setBiometricSuccess(false), 3000);
    }, 2500);
  };

  // Intercom Simulated Calling
  const triggerIntercomCall = () => {
    if (!intercomCondo) return;
    setIntercomState('calling');
    setIntercomLogs(prev => [`[${new Date().toLocaleTimeString()}] Llamando al interfón de la ${intercomCondo}...`, ...prev]);

    // Simulate ringing, then picking up
    callTimerRef.current = setTimeout(() => {
      setIntercomState('connected');
      setIntercomLogs(prev => [
        `[${new Date().toLocaleTimeString()}] Conectado con ${intercomCondo}.`,
        `🗣️ Residente: "¡Hola Caseta! Buenas tardes. Sí, autorizo el ingreso del chofer de Uber, dele paso."`,
        ...prev
      ]);
    }, 3000);
  };

  const endIntercomCall = () => {
    if (callTimerRef.current) clearTimeout(callTimerRef.current);
    setIntercomState('ended');
    setIntercomLogs(prev => [`[${new Date().toLocaleTimeString()}] Llamada finalizada.`, ...prev]);
    setTimeout(() => setIntercomState('idle'), 2000);
  };

  // Parcel delivery register
  const handleAddParcel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParcelCondo || !newParcelResident) return;
    const newPkg: Parcel = {
      id: `pkg-${Date.now()}`,
      condo: newParcelCondo,
      resident: newParcelResident,
      carrier: newParcelCarrier,
      trackingNumber: newParcelTracking || `REG-${Math.floor(100000 + Math.random() * 900000)}`,
      receivedAt: new Date().toLocaleDateString('es-MX') + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      status: 'en_recepcion'
    };
    setParcels([newPkg, ...parcels]);
    setNewParcelCondo('');
    setNewParcelResident('');
    setNewParcelTracking('');
  };

  const deliverParcel = (id: string) => {
    setParcels(parcels.map(p => p.id === id ? { ...p, status: 'entregado' } : p));
  };

  // Amenity Reservation
  const handleAddReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resvResident || !resvCondo) return;
    const newResv: AmenityReservation = {
      id: `resv-${Date.now()}`,
      amenityName: selectedAmenity,
      resident: resvResident,
      condo: resvCondo,
      date: resvDate,
      timeSlot: resvTimeSlot,
      status: 'pendiente'
    };
    setReservations([newResv, ...reservations]);
    setResvResident('');
    setResvCondo('');
    confetti({ particleCount: 30, spread: 40 });
  };

  // Create Help Desk ticket
  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketCondo || !newTicketDesc) return;
    const newTkt: HelpDeskTicket = {
      id: `tkt-${Date.now()}`,
      condo: newTicketCondo,
      category: newTicketCategory,
      description: newTicketDesc,
      priority: newTicketPriority,
      status: 'abierto',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTickets([newTkt, ...tickets]);
    setNewTicketCondo('');
    setNewTicketDesc('');
  };

  // Create Bulletin board announcement
  const handleAddBulletin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBulletinTitle || !newBulletinContent) return;
    const newBul: Bulletin = {
      id: `bul-${Date.now()}`,
      title: newBulletinTitle,
      content: newBulletinContent,
      category: newBulletinCategory,
      date: new Date().toISOString().split('T')[0]
    };
    setBulletins([newBul, ...bulletins]);
    setNewBulletinTitle('');
    setNewBulletinContent('');
  };

  // Add receptor SAT CFDI 4.0
  const handleAddReceptor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecCondo || !newRecRfc || !newRecRazon) return;
    
    // Strict CFDI 4.0 validation rules check
    const rfcRegex = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i;
    const isRfcValid = rfcRegex.test(newRecRfc.trim());
    const isRazonUpperCase = newRecRazon === newRecRazon.toUpperCase();
    const hasSADeCV = newRecRazon.includes('S.A.') || newRecRazon.includes('SA DE CV') || newRecRazon.includes('S. DE R.L.');
    
    let stateResult: 'verificado' | 'error' = 'verificado';
    if (!isRfcValid || !isRazonUpperCase || hasSADeCV || newRecCp.length !== 5) {
      stateResult = 'error';
    }

    const newRec: FiscalReceptor = {
      id: `rec-${Date.now()}`,
      condo: newRecCondo,
      rfc: newRecRfc.trim().toUpperCase(),
      razonSocial: newRecRazon.trim(),
      cp: newRecCp.trim(),
      regimen: newRecRegimen,
      usoCfdi: newRecUso,
      status: stateResult
    };

    setReceptors([newRec, ...receptors]);
    setNewRecCondo('');
    setNewRecRfc('');
    setNewRecRazon('');
    setNewRecCp('');
  };

  // Test connection to PAC API
  const testPacConnection = () => {
    setTestingConnection(true);
    setTestResult(null);
    setTimeout(() => {
      setTestingConnection(false);
      setTestResult(`✓ Conexión exitosa con ${pacProvider.toUpperCase()} API. Timbres disponibles: 25,000 unidades.`);
    }, 2000);
  };

  // Filtered Payments
  const filteredPayments = payments.filter(p => {
    if (filterPaymentStatus === 'todos') return true;
    return p.status === filterPaymentStatus;
  });

  // Calculate totals
  const totalInvoiced = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalPaid = payments.filter(p => p.status === 'pagado').reduce((acc, p) => acc + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pendiente').reduce((acc, p) => acc + p.amount, 0);
  const totalDelinquency = payments.filter(p => p.status === 'vencido').reduce((acc, p) => acc + p.amount, 0);
  const delinquencyRate = (totalDelinquency / totalInvoiced) * 100;

  return (
    <div className="bg-[#141417] text-slate-100 rounded-3xl border border-[#232326] overflow-hidden shadow-2xl font-sans">
      
      {/* HEADER BANNER */}
      <div className="p-6 bg-gradient-to-r from-purple-950/45 via-[#1a132c]/50 to-slate-950/60 border-b border-[#2d2d32] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-purple-400 tracking-wider font-mono">
            <Building className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>Consola Administrativa Integral</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mt-1">Administración de Condominios 🏢</h2>
          <p className="text-xs text-slate-400 mt-0.5">Control de finanzas, seguridad biométrica, operaciones, avisos comunales y facturación CFDI 4.0.</p>
          
          {/* HIGH-VISIBILITY MODULE STATUS BADGES */}
          <div className="flex flex-wrap gap-2 mt-3 font-sans">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 animate-pulse"></span>
              Módulo de Administración y Finanzas (Core): <span className="uppercase font-black text-[9px] text-white bg-emerald-600 px-1 py-0.5 rounded ml-1">ACTIVO ✓</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 animate-pulse"></span>
              Módulo de Seguridad y Accesos: <span className="uppercase font-black text-[9px] text-white bg-emerald-600 px-1 py-0.5 rounded ml-1">ACTIVO ✓</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 animate-pulse"></span>
              Módulo de Operación y Comunidad: <span className="uppercase font-black text-[9px] text-white bg-emerald-600 px-1 py-0.5 rounded ml-1">ACTIVO ✓</span>
            </span>
          </div>
        </div>

        {/* TOP METRICS GRAPHIC MINI-BAR */}
        <div className="flex items-center gap-3 bg-[#1E1E22] px-4 py-2 border border-[#2d2d32] rounded-2xl shrink-0 self-start md:self-center">
          <div className="text-left">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">Morosidad General</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-black text-rose-400">{delinquencyRate.toFixed(1)}%</span>
              <span className={`w-1.5 h-1.5 rounded-full ${delinquencyRate > 15 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></span>
            </div>
          </div>
          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-rose-500 h-full" style={{ width: `${delinquencyRate}%` }}></div>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex overflow-x-auto border-b border-[#232326] bg-[#141417] scrollbar-thin scrollbar-thumb-slate-800">
        <button
          onClick={() => setActiveSubSection('finanzas')}
          className={`flex items-center gap-2 px-6 py-4 text-xs font-extrabold tracking-wide uppercase border-b-2 transition shrink-0 ${
            activeSubSection === 'finanzas' 
              ? 'border-purple-500 text-purple-400 bg-purple-500/5' 
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4 text-purple-400" />
          <span>Módulo de Administración y Finanzas (Core)</span>
          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-md font-mono font-bold ml-1">ACTIVO</span>
        </button>

        <button
          onClick={() => setActiveSubSection('seguridad')}
          className={`flex items-center gap-2 px-6 py-4 text-xs font-extrabold tracking-wide uppercase border-b-2 transition shrink-0 ${
            activeSubSection === 'seguridad' 
              ? 'border-purple-500 text-purple-400 bg-purple-500/5' 
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Módulo de Seguridad y Accesos</span>
          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-md font-mono font-bold ml-1">ACTIVO</span>
        </button>

        <button
          onClick={() => setActiveSubSection('operaciones')}
          className={`flex items-center gap-2 px-6 py-4 text-xs font-extrabold tracking-wide uppercase border-b-2 transition shrink-0 ${
            activeSubSection === 'operaciones' 
              ? 'border-purple-500 text-purple-400 bg-purple-500/5' 
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 text-purple-400" />
          <span>Módulo de Operación y Comunidad</span>
          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-md font-mono font-bold ml-1">ACTIVO</span>
        </button>

        <button
          onClick={() => setActiveSubSection('facturacion')}
          className={`flex items-center gap-2 px-6 py-4 text-xs font-extrabold tracking-wide uppercase border-b-2 transition shrink-0 ${
            activeSubSection === 'facturacion' 
              ? 'border-purple-500 text-purple-400 bg-purple-500/5' 
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-400" />
          <span>4. Facturación CFDI 4.0</span>
        </button>

        <button
          onClick={() => setActiveSubSection('checklist')}
          className={`flex items-center gap-2 px-6 py-4 text-xs font-extrabold tracking-wide uppercase border-b-2 transition shrink-0 bg-purple-950/15 border-dashed ${
            activeSubSection === 'checklist' 
              ? 'border-purple-500 text-purple-400 bg-purple-500/30' 
              : 'border-transparent text-purple-300 hover:text-purple-100'
          }`}
        >
          <Settings className="w-4 h-4 text-purple-400" />
          <span>📋 Checklist de Activación</span>
        </button>
      </div>

      {/* CORE WRAPPER */}
      <div className="p-6 min-h-[500px]">

        {/* SECTION 1: FINANZAS Y COBROS */}
        {activeSubSection === 'finanzas' && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Financial statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">Facturación Total</p>
                  <p className="text-xl font-black text-white mt-1">${totalInvoiced.toLocaleString('es-MX')}.00</p>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><TrendingUp className="w-3 h-3 text-emerald-400" /> Cuota Global</span>
                </div>
                <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">Recaudado / Conciliado</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">${totalPaid.toLocaleString('es-MX')}.00</p>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Check className="w-3 h-3 text-emerald-400" /> Conciliación Auto</span>
                </div>
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">Saldos Pendientes</p>
                  <p className="text-xl font-black text-amber-400 mt-1">${totalPending.toLocaleString('es-MX')}.00</p>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><TrendingUp className="w-3 h-3 text-amber-400" /> Cobro Activo</span>
                </div>
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">Cartera Vencida</p>
                  <p className="text-xl font-black text-rose-400 mt-1">${totalDelinquency.toLocaleString('es-MX')}.00</p>
                  <span className="text-[10px] text-rose-400 flex items-center gap-1 mt-0.5"><AlertTriangle className="w-3 h-3" /> Reclamo Judicial</span>
                </div>
                <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* PAYMENTS LIST CONTROL PANEL */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#232326] pb-3">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Control de Pagos y Cuotas</h3>
                  
                  {/* Filter tabs */}
                  <div className="flex gap-1 bg-slate-950 p-1 border border-slate-800 rounded-xl">
                    {(['todos', 'pagado', 'pendiente', 'vencido'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setFilterPaymentStatus(tab)}
                        className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg transition ${
                          filterPaymentStatus === tab 
                            ? 'bg-purple-600 text-white' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold">
                        <th className="pb-3 font-mono">CÓDIGO/CONDO</th>
                        <th className="pb-3">RESIDENTE</th>
                        <th className="pb-3">CONCEPTO</th>
                        <th className="pb-3 text-right">MONTO</th>
                        <th className="pb-3 text-center">ESTADO</th>
                        <th className="pb-3 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {filteredPayments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-950/40 transition">
                          <td className="py-3 font-mono font-bold text-slate-200">
                            <span className="text-[10px] text-purple-400 uppercase tracking-widest">{p.condo}</span>
                          </td>
                          <td className="py-3 font-medium text-slate-300">{p.resident}</td>
                          <td className="py-3 text-slate-400">{p.concept}</td>
                          <td className="py-3 text-right font-mono font-bold text-slate-100">${p.amount}.00</td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                              p.status === 'pagado' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                : p.status === 'pendiente'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 text-right space-x-2">
                            {p.status !== 'pagado' && (
                              <button
                                onClick={() => setSelectedPaymentToPay(p)}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] rounded-lg transition"
                              >
                                Pagar 💳
                              </button>
                            )}
                            <button
                              onClick={() => setViewingStatementPayment(p)}
                              className="px-2 py-1 bg-[#1E1E22] hover:bg-[#2d2d32] text-slate-300 border border-[#2d2d32] font-bold text-[10px] rounded-lg transition"
                              title="Ver Estado de Cuenta / Factura"
                            >
                              Estado 📄
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GENERATE NEW FEE FORM (ADMIN) */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4 self-start">
                <div>
                  <h3 className="text-xs font-black uppercase text-purple-400 tracking-widest font-mono">Emitir Nueva Cuota</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Asigna cargos directos a residencias en el condominio.</p>
                </div>

                <form onSubmit={handleAddPayment} className="space-y-3 font-sans">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Residencia / Condo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Casa 105"
                      value={newPayCondo}
                      onChange={(e) => setNewPayCondo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-hidden font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Residente</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Gómez"
                      value={newPayResident}
                      onChange={(e) => setNewPayResident(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Monto de la Cuota ($)</label>
                    <input
                      type="number"
                      required
                      value={newPayAmount}
                      onChange={(e) => setNewPayAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-hidden font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Fecha Límite Pago</label>
                    <input
                      type="date"
                      required
                      value={newPayDueDate}
                      onChange={(e) => setNewPayDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-purple-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-purple-950/20"
                  >
                    Generar Cargo Comunal
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* SECTION 2: ACCESOS Y SEGURIDAD */}
        {activeSubSection === 'seguridad' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* MODULE A: QR INVITATIONS CREATOR */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Invitaciones de Visita</span>
                  <h3 className="text-base font-black text-white mt-1">Generación de Códigos QR para Invitados</h3>
                  <p className="text-xs text-slate-450 mt-0.5">Crea pases de entrada temporal que puedes compartir directamente por WhatsApp.</p>
                </div>

                <form onSubmit={handleGenerateInvite} className="space-y-3 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Nombre Visitante</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Carlos Ortiz"
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-purple-500 focus:outline-hidden font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Residencia Destino</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Casa 105"
                        value={visitorCondo}
                        onChange={(e) => setVisitorCondo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-purple-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Placas Vehículo (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. ABC-123-A"
                      value={visitorPlate}
                      onChange={(e) => setVisitorPlate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-purple-500 focus:outline-hidden font-mono uppercase font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-4 h-4" /> Generar Pase Temporal QR
                  </button>
                </form>

                {generatedInviteQR && (
                  <div className="mt-4 p-4 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col sm:flex-row items-center gap-4 animate-fade-in">
                    <div className="bg-white p-3 rounded-xl shrink-0">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(generatedInviteQR)}`} 
                        alt="Pase QR" 
                        className="w-24 h-24"
                      />
                    </div>
                    <div className="text-left space-y-2 flex-1">
                      <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full uppercase">Pase Creado ✓</span>
                      <h4 className="text-xs font-black text-slate-200">{visitorName}</h4>
                      <p className="text-[10px] text-slate-400">Dirigiéndose a: <strong className="text-slate-200 font-sans">{visitorCondo}</strong></p>
                      
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`¡Hola *${visitorName}*!\n\nTe comparto tu *Pase Temporal de Entrada QR* autorizado para dirigirte al domicilio en *${visitorCondo}*.\n\nPresiona el siguiente enlace para ver el pase:\n🔗 http://app.cnls-acceso.mx/pass/${generatedInviteQR}\n\n⚠️ *Favor de presentar su INE o Licencia al ingresar a la residencia*`)}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition"
                      >
                        <Send className="w-3.5 h-3.5" /> Compartir en WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* MODULE B: BIOMETRICS LOCK/UNLOCK SIMULATION */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono">Seguridad Sensible</span>
                  <h3 className="text-base font-black text-white mt-1">Validación Biométrica (Control Facial)</h3>
                  <p className="text-xs text-slate-450 mt-0.5">Evita fraudes obligando a residentes a verificar su identidad antes de transacciones o accesos de áreas.</p>
                </div>

                <div className="p-6 bg-slate-950 border border-slate-900 rounded-2xl text-center space-y-4 relative overflow-hidden">
                  
                  {/* Face scanning frame visual indicator */}
                  <div className="w-28 h-28 mx-auto border-2 border-dashed border-amber-500/40 rounded-full flex items-center justify-center relative overflow-hidden bg-slate-900">
                    <Camera className="w-10 h-10 text-slate-500 animate-pulse" />
                    {biometricScanning && (
                      <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                        <div className="w-full h-1 bg-emerald-400 absolute top-1/2 left-0 -translate-y-1/2 animate-bounce"></div>
                      </div>
                    )}
                    {biometricSuccess && (
                      <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center animate-fade-in">
                        <Check className="w-12 h-12 text-emerald-400" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {biometricMessage}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={triggerBiometricScan}
                      disabled={biometricScanning}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition"
                    >
                      {biometricScanning ? 'Escaneando Rostro...' : 'Iniciar Escaneo Facial 👤'}
                    </button>
                    
                    <button
                      onClick={() => setHasBiometricLock(!hasBiometricLock)}
                      className={`px-4 py-2 font-bold text-xs rounded-xl border transition ${
                        hasBiometricLock 
                          ? 'bg-rose-950/20 text-rose-400 border-rose-500/30' 
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {hasBiometricLock ? 'Bloqueo Activo ✓' : 'Habilitar para Cobros'}
                    </button>
                  </div>
                </div>
              </div>

              {/* MODULE C: INTERFÓN DIGITAL SIMULATOR */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest font-mono">Comunicación Segura</span>
                  <h3 className="text-base font-black text-white mt-1">Interfón Digital (Caseta ↔ Residente)</h3>
                  <p className="text-xs text-slate-450 mt-0.5">Establece llamadas de VoIP en tiempo real con condóminos sin exponer números personales.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-slate-500 font-mono mb-1">Ingresa Casa / Lote</label>
                      <input
                        type="text"
                        placeholder="Ej. Casa 105"
                        value={intercomCondo}
                        onChange={(e) => setIntercomCondo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white font-bold focus:border-sky-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Numeric Keyboard */}
                    <div className="grid grid-cols-3 gap-1 text-center font-mono text-[11px]">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <button
                          key={n}
                          onClick={() => setIntercomCondo(prev => prev + n)}
                          className="py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg"
                        >
                          {n}
                        </button>
                      ))}
                      <button onClick={() => setIntercomCondo('')} className="py-1 bg-rose-950/30 text-rose-400 rounded-lg font-bold">C</button>
                      <button onClick={() => setIntercomCondo(prev => prev + '0')} className="py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg">0</button>
                      <button onClick={() => setIntercomCondo(prev => prev.slice(0, -1))} className="py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg">←</button>
                    </div>

                    <div className="pt-2">
                      {intercomState === 'idle' || intercomState === 'ended' ? (
                        <button
                          onClick={triggerIntercomCall}
                          className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Llamar por Interfón
                        </button>
                      ) : (
                        <button
                          onClick={endIntercomCall}
                          className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 animate-pulse"
                        >
                          Colgar Llamada 📞
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 space-y-3 font-mono text-[10px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-500 uppercase tracking-widest font-bold">Registro de Llamadas</span>
                      {intercomState === 'calling' && <span className="text-amber-400 animate-pulse font-bold">TIMBRANDO...</span>}
                      {intercomState === 'connected' && <span className="text-emerald-400 animate-pulse font-bold">ACTIVO 📞</span>}
                    </div>

                    <div className="h-44 overflow-y-auto space-y-2 text-left scrollbar-none">
                      {intercomLogs.length === 0 ? (
                        <div className="text-slate-600 text-center py-12 italic">Ninguna llamada activa registrada.</div>
                      ) : (
                        intercomLogs.map((log, idx) => (
                          <div key={idx} className="text-slate-300 leading-relaxed break-words">{log}</div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* MODULE D: CONTROL DE PAQUETERÍA */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest font-mono">Control de Correspondencia</span>
                  <h3 className="text-base font-black text-white mt-1">Paquetería y Envíos (Lobby / Caseta)</h3>
                  <p className="text-xs text-slate-450 mt-0.5">Registra la llegada de cajas con envíos de ecommerce y avisa automáticamente por correo.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Registry form */}
                  <form onSubmit={handleAddParcel} className="space-y-2.5 font-sans">
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Casa / Condo Destino</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Casa 105"
                        value={newParcelCondo}
                        onChange={(e) => setNewParcelCondo(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Nombre Residente</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Haroldo Residente"
                        value={newParcelResident}
                        onChange={(e) => setNewParcelResident(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Mensajería</label>
                        <select
                          value={newParcelCarrier}
                          onChange={(e) => setNewParcelCarrier(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden"
                        >
                          <option value="Amazon Prime">Amazon</option>
                          <option value="Mercado Libre">Mercado Libre</option>
                          <option value="DHL Express">DHL</option>
                          <option value="FedEx">FedEx</option>
                          <option value="Estafeta">Estafeta</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Guía / Tracking</label>
                        <input
                          type="text"
                          placeholder="Ej. TRACK-9012"
                          value={newParcelTracking}
                          onChange={(e) => setNewParcelTracking(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Package className="w-3.5 h-3.5" /> Registrar Correspondencia
                    </button>
                  </form>

                  {/* Log inventory */}
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {parcels.map(p => (
                      <div key={p.id} className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl text-left text-[10px] relative">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-200 font-sans">{p.carrier} → <strong className="text-purple-400 font-mono">{p.condo}</strong></span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider ${
                            p.status === 'en_recepcion' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          }`}>
                            {p.status === 'en_recepcion' ? 'Recepción' : 'Entregado'}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">Guía: {p.trackingNumber}</p>
                        <p className="text-[8.5px] text-slate-500 font-sans mt-0.5">Recibido: {p.receivedAt}</p>
                        
                        {p.status === 'en_recepcion' && (
                          <button
                            onClick={() => deliverParcel(p.id)}
                            className="mt-1 px-2 py-0.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 font-bold text-[8.5px] rounded-sm transition"
                          >
                            Entregar a Residente ✓
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* SECTION 3: COMUNIDAD Y AMENIDADES */}
        {activeSubSection === 'operaciones' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* MODULE A: AMENITIES CALENDAR RESERVATION */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest font-mono">Espacios Comunes</span>
                  <h3 className="text-base font-black text-white mt-1">Reserva de Amenidades</h3>
                  <p className="text-xs text-slate-450 mt-0.5">Calendario inteligente para apartar canchas, terrazas y salones.</p>
                </div>

                <form onSubmit={handleAddReservation} className="space-y-3 font-sans text-xs">
                  <div>
                    <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Elige la Amenidad</label>
                    <select
                      value={selectedAmenity}
                      onChange={(e) => setSelectedAmenity(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden"
                    >
                      <option value="Salón de Eventos">Salón de Eventos (Cuota: $1,500)</option>
                      <option value="Alberca & Terraza">Alberca & Terraza (Cuota: $500)</option>
                      <option value="Cancha de Tenis">Cancha de Tenis (Cuota: Gratis)</option>
                      <option value="Asadores Jardín">Asadores Jardín (Cuota: Gratis)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Fecha</label>
                      <input
                        type="date"
                        required
                        value={resvDate}
                        onChange={(e) => setResvDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Horario</label>
                      <select
                        value={resvTimeSlot}
                        onChange={(e) => setResvTimeSlot(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden"
                      >
                        <option value="09:00 - 13:00">09:00 - 13:00</option>
                        <option value="14:00 - 18:00">14:00 - 18:00</option>
                        <option value="19:00 - 23:00">19:00 - 23:00</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Condómino</label>
                      <input
                        type="text"
                        required
                        placeholder="Casa 102"
                        value={resvCondo}
                        onChange={(e) => setResvCondo(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Responsable</label>
                      <input
                        type="text"
                        required
                        placeholder="Alejandro Ruiz"
                        value={resvResident}
                        onChange={(e) => setResvResident(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Agendar Reserva
                  </button>
                </form>

                {/* Reservation Log */}
                <div className="pt-3 border-t border-[#232326] space-y-2">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">Reservaciones Registradas</span>
                  {reservations.map(r => (
                    <div key={r.id} className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl text-left text-[10px] flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-200">{r.amenityName}</h4>
                        <p className="text-slate-400 font-sans mt-0.5">Resp: {r.resident} ({r.condo})</p>
                        <p className="text-[8.5px] text-slate-500 font-mono mt-0.5">Fecha: {r.date} [{r.timeSlot}]</p>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        r.status === 'confirmado' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* MODULE B: HELPDESK TICKETS */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest font-mono">Soporte Técnico</span>
                  <h3 className="text-base font-black text-white mt-1">Mesa de Ayuda (Reporte de Fallas)</h3>
                  <p className="text-xs text-slate-450 mt-0.5">Canal de atención ciudadana para reportar desperfectos en áreas públicas.</p>
                </div>

                <form onSubmit={handleAddTicket} className="space-y-2.5 font-sans text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Casa / Condo</label>
                      <input
                        type="text"
                        required
                        placeholder="Casa 105"
                        value={newTicketCondo}
                        onChange={(e) => setNewTicketCondo(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Categoría</label>
                      <select
                        value={newTicketCategory}
                        onChange={(e) => setNewTicketCategory(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden"
                      >
                        <option value="Plomería">Plomería</option>
                        <option value="Eléctrico">Eléctrico</option>
                        <option value="Seguridad">Seguridad</option>
                        <option value="Jardinería">Jardinería</option>
                        <option value="Áreas Comunes">Áreas Comunes</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Descripción de la Falla</label>
                    <textarea
                      required
                      placeholder="Describe a detalle el problema reportado..."
                      value={newTicketDesc}
                      onChange={(e) => setNewTicketDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-700 focus:outline-hidden min-h-[50px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Prioridad</label>
                    <div className="flex gap-2">
                      {(['baja', 'media', 'alta'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewTicketPriority(p)}
                          className={`flex-1 py-1 text-[9px] font-bold uppercase rounded-lg border transition ${
                            newTicketPriority === p 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/35' 
                              : 'bg-slate-950 text-slate-500 border-slate-900'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Crear Ticket de Soporte
                  </button>
                </form>

                {/* Ticket inventory */}
                <div className="pt-2 max-h-52 overflow-y-auto space-y-2">
                  {tickets.map(t => (
                    <div key={t.id} className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl text-left text-[10px] relative">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-300">{t.category} — {t.condo}</span>
                        <span className={`px-1 rounded-[4px] text-[7.5px] font-bold uppercase ${
                          t.priority === 'alta' ? 'bg-rose-600/15 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1">{t.description}</p>
                      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-900 text-[8px]">
                        <span className="text-slate-500 font-mono">ID: {t.id} • {t.createdAt}</span>
                        <span className="text-purple-400 font-bold uppercase">{t.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MODULE C: OFFICIAL BULLETINS */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono">Notificaciones Comunitarias</span>
                  <h3 className="text-base font-black text-white mt-1">Comunicados y Anuncios Oficiales</h3>
                  <p className="text-xs text-slate-450 mt-0.5">Difunde noticias importantes, alertas y avisos urgentes a los dispositivos de los condóminos.</p>
                </div>

                <form onSubmit={handleAddBulletin} className="space-y-2.5 font-sans text-xs">
                  <div>
                    <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Título del Aviso</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Cierre Temporal de Alberca"
                      value={newBulletinTitle}
                      onChange={(e) => setNewBulletinTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Contenido del Aviso</label>
                    <textarea
                      required
                      placeholder="Describe los detalles del aviso de forma formal..."
                      value={newBulletinContent}
                      onChange={(e) => setNewBulletinContent(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-700 focus:outline-hidden min-h-[50px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Categoría</label>
                    <select
                      value={newBulletinCategory}
                      onChange={(e) => setNewBulletinCategory(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden"
                    >
                      <option value="comunidad">Comunidad / General</option>
                      <option value="seguridad">Seguridad / Alerta</option>
                      <option value="mantenimiento">Mantenimiento / Servicio</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/20 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Publicar Aviso en Pizarrón
                  </button>
                </form>

                {/* Bulletins Feed */}
                <div className="pt-2 max-h-52 overflow-y-auto space-y-2">
                  {bulletins.map(b => (
                    <div key={b.id} className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl text-left text-[10px]">
                      <div className="flex items-center justify-between font-bold text-slate-200">
                        <span>{b.title}</span>
                        <span className={`px-1 rounded text-[7.5px] uppercase font-bold ${
                          b.category === 'seguridad' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-[#1E1E22] text-slate-400'
                        }`}>
                          {b.category}
                        </span>
                      </div>
                      <p className="text-slate-450 mt-1 font-sans leading-relaxed text-[9px]">{b.content}</p>
                      <p className="text-[8px] text-slate-600 mt-1 font-mono">Publicado el {b.date}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SECTION 4: FACTURACIÓN CFDI 4.0 */}
        {activeSubSection === 'facturacion' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-purple-400">
                <FileText className="w-5 h-5" />
                <h3 className="text-base font-black text-white">Configuración CFDI 4.0 SAT Directo</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Para timbrar facturas electrónicas válidas por cuotas de mantenimiento condominal de forma directa y automatizada, requiere configurar las credenciales del Emisor, dar de alta la constancia de situación fiscal del Receptor, y conectar con las API autorizadas por el SAT.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* COMPONENT A: EMISOR (CLIENT) SETUP */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest font-mono">A. Datos del Emisor</span>
                  <h4 className="text-xs font-black text-white uppercase mt-0.5">Certificado de Sello Digital (CSD)</h4>
                </div>

                <div className="space-y-3 text-xs font-sans">
                  <div>
                    <label className="block text-[8px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">RFC del Condominio (Emisor)</label>
                    <input
                      type="text"
                      value={emisorRfc}
                      onChange={(e) => setEmisorRfc(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono uppercase font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">Régimen Fiscal (SAT)</label>
                    <select
                      value={emisorRegimen}
                      onChange={(e) => setEmisorRegimen(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                    >
                      <option value="601">601 - General de Ley Personas Morales</option>
                      <option value="603">603 - Personas Morales con Fines no Lucrativos</option>
                      <option value="605">605 - Sueldos y Salarios e Ingresos Asimilados</option>
                      <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
                    </select>
                  </div>

                  {/* Drag-and-drop MOCK area */}
                  <div className="space-y-2">
                    <label className="block text-[8px] font-extrabold text-slate-450 uppercase tracking-widest">Cargar Llaves CSD (SAT)</label>
                    
                    <div className="border border-dashed border-slate-800 bg-slate-950/40 p-3 rounded-xl text-center cursor-pointer hover:bg-slate-950/70 transition">
                      <Upload className="w-4 h-4 mx-auto text-purple-400 mb-1" />
                      <p className="text-[9px] text-slate-300 font-bold">{csdUploadedCer || 'Cargar archivo .cer'}</p>
                      <p className="text-[7.5px] text-slate-500 font-mono mt-0.5">Certificado de Sello Digital oficial</p>
                    </div>

                    <div className="border border-dashed border-slate-800 bg-slate-950/40 p-3 rounded-xl text-center cursor-pointer hover:bg-slate-950/70 transition">
                      <Upload className="w-4 h-4 mx-auto text-purple-400 mb-1" />
                      <p className="text-[9px] text-slate-300 font-bold">{csdUploadedKey || 'Cargar archivo .key'}</p>
                      <p className="text-[7.5px] text-slate-500 font-mono mt-0.5">Llave privada del CSD</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">Contraseña del CSD</label>
                    <input
                      type="password"
                      value={csdPass}
                      onChange={(e) => setCsdPass(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                    />
                  </div>

                  {/* LCO checklist */}
                  <div className="p-3 bg-purple-950/10 border border-purple-900/15 rounded-xl space-y-1 text-[9.5px]">
                    <div className="flex items-center gap-1.5 font-bold text-purple-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Validado en la LCO</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-[8.5px]">
                      RFC y sellos activos en la Lista de Contribuyentes Obligados del SAT de forma correcta y listos para timbrado.
                    </p>
                  </div>
                </div>
              </div>

              {/* COMPONENT B: RECEPTOR (USERS) CATALOG & CFDI 4.0 MANDATORY FIELDS */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono">B. Datos Obligatorios del Receptor</span>
                  <h4 className="text-xs font-black text-white uppercase mt-0.5">Constancia de Situación Fiscal Receptores</h4>
                </div>

                <div className="space-y-4 font-sans text-xs">
                  {/* Receptor Creation Form */}
                  <form onSubmit={handleAddReceptor} className="space-y-2 bg-slate-950/30 p-3 border border-slate-900 rounded-xl">
                    <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Registrar Datos de Facturación de Residente</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Ej. Casa 105"
                        value={newRecCondo}
                        onChange={(e) => setNewRecCondo(e.target.value)}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white"
                      />
                      <input
                        type="text"
                        required
                        placeholder="RFC (XEXX010101000)"
                        value={newRecRfc}
                        onChange={(e) => setNewRecRfc(e.target.value)}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white uppercase font-mono"
                      />
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="RAZÓN SOCIAL EXACTA (SIN S.A. DE C.V.)"
                      value={newRecRazon}
                      onChange={(e) => setNewRecRazon(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white uppercase"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="C.P. Fiscal (5 dígitos)"
                        value={newRecCp}
                        onChange={(e) => setNewRecCp(e.target.value)}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white font-mono"
                      />
                      <select
                        value={newRecRegimen}
                        onChange={(e) => setNewRecRegimen(e.target.value)}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[9.5px] text-white"
                      >
                        <option value="605">605 - Sueldos</option>
                        <option value="601">601 - Gral Personas Morales</option>
                        <option value="612">612 - Persona Física Act. Emp</option>
                        <option value="626">626 - RESICO</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] rounded-lg transition cursor-pointer"
                    >
                      Añadir & Validar Constancia
                    </button>
                  </form>

                  {/* Receptor Log */}
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {receptors.map(rec => (
                      <div key={rec.id} className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl relative">
                        <div className="flex items-center justify-between font-bold text-[10px]">
                          <span className="text-slate-300 font-sans">{rec.razonSocial} ({rec.condo})</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                            rec.status === 'verificado' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {rec.status}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">RFC: {rec.rfc} | C.P. {rec.cp} | Régimen: {rec.regimen} | Uso: {rec.usoCfdi}</p>
                        {rec.status === 'error' && (
                          <p className="text-[8px] text-rose-400 leading-relaxed font-sans mt-1">
                            ❌ Error de validación: La Razón Social no coincide con el SAT (eliminar régimen de capitales) o el RFC/C.P es inválido.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* COMPONENT C: PAC PROVIDER CONNECTION */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest font-mono">C. Proveedor Autorizado de Timbrado</span>
                  <h4 className="text-xs font-black text-white uppercase mt-0.5">Integración API PAC SAT</h4>
                </div>

                <div className="space-y-3 font-sans text-xs">
                  <div>
                    <label className="block text-[8px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">Proveedor PAC Contratado</label>
                    <select
                      value={pacProvider}
                      onChange={(e) => setPacProvider(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                    >
                      <option value="fiscalapi">FiscalAPI México</option>
                      <option value="facturama">Facturama API</option>
                      <option value="finkok">Finkok SAT Connect</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">Production Private API Key / Token</label>
                    <input
                      type="text"
                      value={pacApiKey}
                      onChange={(e) => setPacApiKey(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-[10.5px]"
                    />
                  </div>

                  <div className="flex items-center justify-between py-1 px-1 bg-slate-950/40 rounded-xl border border-slate-900">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider pl-1.5">Entorno Sandbox / Prueba</span>
                    <input
                      type="checkbox"
                      checked={sandboxMode}
                      onChange={(e) => setSandboxMode(e.target.checked)}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded-sm bg-slate-900 border-slate-800 mr-2 cursor-pointer"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={testPacConnection}
                    disabled={testingConnection}
                    className="w-full py-2 bg-[#232326] hover:bg-[#2d2d32] border border-[#2d2d32] text-slate-300 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Globe className="w-3.5 h-3.5 text-sky-400 animate-spin" style={{ animationDuration: testingConnection ? '1.5s' : '0s' }} />
                    {testingConnection ? 'Probando credenciales PAC...' : 'Probar Conexión SAT'}
                  </button>

                  {testResult && (
                    <div className="p-3 bg-emerald-950/10 border border-emerald-900/15 rounded-xl text-emerald-400 text-[9px] leading-relaxed font-sans font-bold">
                      {testResult}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SECTION 5: CHECKLIST DE ACTIVACIÓN DE ROL */}
        {activeSubSection === 'checklist' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Settings className="w-5 h-5" />
                <h3 className="text-base font-black text-white">Consola de Activación de Rol & Módulos</h3>
              </div>
              <p className="text-xs text-slate-450 leading-relaxed">
                Este panel resume de forma interactiva todas las funciones y componentes que se han integrado de forma exitosa en el rol de <strong>Administración de Condominios</strong> de su fraccionamiento, garantizando el cumplimiento completo de su solicitud técnica.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* CHECKLISTS GRAPHIC BOX 1 */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black text-white uppercase border-b border-slate-850 pb-2 flex items-center justify-between">
                  <span>Módulos de Negocio & Seguridad</span>
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full">100% ACTIVO</span>
                </h4>

                <div className="space-y-3 text-xs font-sans">
                  
                  {/* ITEM 1 */}
                  <div className="flex items-start gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
                    <div>
                      <strong className="text-slate-100">Control de Pagos</strong>
                      <p className="text-[10px] text-slate-400 mt-0.5">Seguimiento, registro, visualización y conciliación automática de cuotas condominales.</p>
                    </div>
                  </div>

                  {/* ITEM 2 */}
                  <div className="flex items-start gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
                    <div>
                      <strong className="text-slate-100">Pasarela de Pagos Integrada</strong>
                      <p className="text-[10px] text-slate-400 mt-0.5">Recibo de pagos con tarjeta de crédito/débito, transferencia SPEI y billeteras inteligentes (Apple/Google Pay).</p>
                    </div>
                  </div>

                  {/* ITEM 3 */}
                  <div className="flex items-start gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
                    <div>
                      <strong className="text-slate-100">Estados de Cuenta Comunales</strong>
                      <p className="text-[10px] text-slate-400 mt-0.5">Panel personalizado de consulta histórica de pagos, cargos pendientes y descarga de comprobantes.</p>
                    </div>
                  </div>

                  {/* ITEM 4 */}
                  <div className="flex items-start gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
                    <div>
                      <strong className="text-slate-100">Reportes Financieros Interactivos</strong>
                      <p className="text-[10px] text-slate-400 mt-0.5">Indicador en tiempo real de ingresos totales, saldos vencidos y tasa de morosidad general.</p>
                    </div>
                  </div>

                  {/* ITEM 5 */}
                  <div className="flex items-start gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
                    <div>
                      <strong className="text-slate-100">Invitaciones vía Códigos QR (WhatsApp)</strong>
                      <p className="text-[10px] text-slate-400 mt-0.5">Generación de pases con alerta obligatoria de INE/Licencia adjunta de forma automatizada al compartir.</p>
                    </div>
                  </div>

                  {/* ITEM 6 */}
                  <div className="flex items-start gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
                    <div>
                      <strong className="text-slate-100">Validación Biométrica Facial</strong>
                      <p className="text-[10px] text-slate-400 mt-0.5">Seguridad contra usurpación con escaneo facial para transacciones financieras o accesos premium.</p>
                    </div>
                  </div>

                  {/* ITEM 7 */}
                  <div className="flex items-start gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
                    <div>
                      <strong className="text-slate-100">Interfón Digital Caseta ↔ Residente</strong>
                      <p className="text-[10px] text-slate-450 mt-0.5">Simulador de VoIP integrado para comunicación privada sin exponer números de teléfono personales.</p>
                    </div>
                  </div>

                  {/* ITEM 8 */}
                  <div className="flex items-start gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
                    <div>
                      <strong className="text-slate-100">Control e Inventario de Paquetería</strong>
                      <p className="text-[10px] text-slate-450 mt-0.5">Gestión de correspondencia en lobby con avisos inmediatos y entrega controlada con firmas.</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* CHECKLISTS GRAPHIC BOX 2 */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black text-white uppercase border-b border-slate-850 pb-2 flex items-center justify-between">
                  <span>Comunidad & Facturación CFDI 4.0</span>
                  <span className="text-[9px] bg-sky-500/15 text-sky-400 font-mono font-bold px-2 py-0.5 rounded-full">CONECTADO</span>
                </h4>

                <div className="space-y-3 text-xs font-sans">
                  
                  {/* ITEM 9 */}
                  <div className="flex items-start gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
                    <div>
                      <strong className="text-slate-100">Reserva de Amenidades</strong>
                      <p className="text-[10px] text-slate-450 mt-0.5">Calendarios para apartar áreas comunes (salones, canchas) administrando aforos y depósitos.</p>
                    </div>
                  </div>

                  {/* ITEM 10 */}
                  <div className="flex items-start gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
                    <div>
                      <strong className="text-slate-100">Mesa de Ayuda (Tickets de Soporte)</strong>
                      <p className="text-[10px] text-slate-450 mt-0.5">Flujo de reporte de incidencias públicas y desperfectos con control de prioridades y estatus.</p>
                    </div>
                  </div>

                  {/* ITEM 11 */}
                  <div className="flex items-start gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
                    <div>
                      <strong className="text-slate-100">Comunicados y Avisos Oficiales</strong>
                      <p className="text-[10px] text-slate-450 mt-0.5">Pizarrón oficial de boletines de la junta directiva para enterar oportunamente a los residentes.</p>
                    </div>
                  </div>

                  {/* FACTURACIÓN REQS */}
                  <div className="pt-3 border-t border-[#2d2d32] space-y-2">
                    <span className="text-[9px] font-extrabold text-purple-400 uppercase tracking-widest font-mono">Infraestructura de Facturación SAT CFDI 4.0</span>
                    
                    <div className="flex items-center gap-2 text-slate-300 pl-1">
                      <div className="w-4 h-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded flex items-center justify-center text-[10px] font-bold shrink-0">✓</div>
                      <span><strong>Emisor:</strong> Cargas de CSD (.cer, .key), validación en la LCO y Régimen Fiscal</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300 pl-1">
                      <div className="w-4 h-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded flex items-center justify-center text-[10px] font-bold shrink-0">✓</div>
                      <span><strong>Receptor:</strong> Validación RFC, C.P. Fiscal y Razón Social exacta (Constancia)</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300 pl-1">
                      <div className="w-4 h-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded flex items-center justify-center text-[10px] font-bold shrink-0">✓</div>
                      <span><strong>PAC Timbrado:</strong> API de conexión con facturadores autorizados (Sandbox & Live)</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* MODAL SIMULATION: PAYMENTS GATEWAY POPUP */}
      {selectedPaymentToPay && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left font-sans animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-[#2d2d32] pb-2">
              <h3 className="text-xs font-black uppercase text-purple-400 tracking-wider font-mono flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> Pasarela de Pagos Integrada
              </h3>
              <button 
                onClick={() => setSelectedPaymentToPay(null)} 
                className="text-slate-500 hover:text-slate-300 text-sm font-bold font-mono px-2 py-0.5 hover:bg-slate-900 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {payingState === 'idle' ? (
              <>
                {/* Details summary */}
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-2xl">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Concepto de Cobro</p>
                  <p className="text-xs font-extrabold text-white mt-0.5">{selectedPaymentToPay.concept}</p>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-900">
                    <span className="text-[10px] text-slate-400 font-medium">Residencia: {selectedPaymentToPay.condo}</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">${selectedPaymentToPay.amount}.00</span>
                  </div>
                </div>

                {/* Gateway Methods Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 border border-slate-900 rounded-xl">
                  {(['tarjeta', 'spei', 'wallet'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setGatewayMethod(m)}
                      className={`py-1 text-[9px] font-bold uppercase rounded-lg transition ${
                        gatewayMethod === m ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {m === 'tarjeta' ? 'Tarjeta' : m === 'spei' ? 'SPEI' : 'Wallet'}
                    </button>
                  ))}
                </div>

                {gatewayMethod === 'tarjeta' && (
                  <div className="space-y-3 font-sans text-xs">
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-450 uppercase tracking-widest mb-0.5">Nombre en Tarjeta</label>
                      <input
                        type="text"
                        placeholder="Ej. Juan Pérez"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-450 uppercase tracking-widest mb-0.5">Número de Tarjeta</label>
                      <input
                        type="text"
                        placeholder="4152 •••• •••• ••••"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-450 uppercase tracking-widest mb-0.5">Vencimiento</label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-450 uppercase tracking-widest mb-0.5">CVV / CVC</label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {gatewayMethod === 'spei' && (
                  <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl text-center space-y-2 text-xs">
                    <span className="text-[8px] font-mono font-bold px-2 py-0.5 bg-sky-600/15 text-sky-400 rounded-full uppercase">Transferencia Electrónica Directa</span>
                    <p className="text-slate-400">
                      Realiza la transferencia desde la app de tu banco a la siguiente CLABE Interbancaria exclusiva de tu residencia:
                    </p>
                    <div className="p-3 bg-[#1E1E22] border border-slate-800 rounded-xl font-mono text-white text-center tracking-widest select-all font-black text-xs">
                      1271 8000 5592 1248 93
                    </div>
                    <p className="text-[9px] text-slate-500 italic">
                      ✓ El pago se conciliará automáticamente en menos de 5 minutos al recibir la notificación de SPEI.
                    </p>
                  </div>
                )}

                {gatewayMethod === 'wallet' && (
                  <div className="space-y-3 text-center">
                    <p className="text-xs text-slate-400">Paga de forma rápida y segura desde tu smartphone con un solo clic:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleProcessPayment}
                        className="py-3 bg-black hover:bg-zinc-900 border border-zinc-800 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                         Pay
                      </button>
                      <button
                        onClick={handleProcessPayment}
                        className="py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-slate-200 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        G Pay
                      </button>
                    </div>
                  </div>
                )}

                {gatewayMethod !== 'wallet' && (
                  <button
                    onClick={handleProcessPayment}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Confirmar Pago de ${selectedPaymentToPay.amount}.00
                  </button>
                )}
              </>
            ) : payingState === 'processing' ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-400">Procesando pago de forma segura a través de pasarela de SPEI/Cards...</p>
                <p className="text-[9px] text-slate-600 font-mono">Conexión cifrada SSL de 256 bits</p>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-white">¡Pago Conciliado Exitosamente!</h4>
                <p className="text-xs text-slate-400">La cuota del condominio ha sido liquidada. Se ha generado la factura CFDI 4.0 automáticamente.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL SIMULATION: ACCOUNT STATEMENT (ESTADOS DE CUENTA) */}
      {viewingStatementPayment && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-3xl p-6 max-w-xl w-full shadow-2xl text-left font-sans space-y-5 relative animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-[#2d2d32] pb-2">
              <span className="text-[10px] bg-purple-500/15 text-purple-400 font-mono font-bold px-2 py-0.5 rounded-full uppercase">Estado de Cuenta / Comprobante Oficial</span>
              <button 
                onClick={() => setViewingStatementPayment(null)} 
                className="text-slate-500 hover:text-slate-300 text-sm font-bold font-mono px-2 py-0.5 hover:bg-slate-900 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Receipt Content mock */}
            <div className="bg-white text-slate-800 p-6 rounded-2xl border border-slate-300 space-y-6 text-xs shadow-inner select-text">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">CONDOMINIO LAS LOMAS AC.</h3>
                  <p className="text-[9px] text-slate-500 mt-0.5">CNO160715AAA | Av. de las Lomas #456</p>
                  <p className="text-[9px] text-slate-500">Régimen: 603 - Personas Morales no Lucrativas</p>
                </div>
                <div className="text-right font-mono">
                  <p className="font-bold text-[10px] text-slate-900 uppercase">Factura Digital</p>
                  <p className="text-slate-500 mt-0.5">Folio: CLS-{Math.floor(100000 + Math.random() * 900000)}</p>
                  <p className="text-slate-500">Fecha: {viewingStatementPayment.paymentDate || 'No liquidado'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider font-extrabold font-mono">Receptor (Condómino)</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">{viewingStatementPayment.resident}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Condominio: {viewingStatementPayment.condo}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider font-extrabold font-mono">Datos Fiscales</p>
                  <p className="font-mono text-[9.5px] text-slate-800 mt-0.5">RFC: RUAL890520HB8</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">C.P. Fiscal: 11000 | Uso: G03</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-2">CANT/CLAVE</th>
                      <th className="p-2">DESCRIPCIÓN DEL CONCEPTO</th>
                      <th className="p-2 text-right">PRECIO UNIT.</th>
                      <th className="p-2 text-right">IMPORTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="p-2 font-mono text-slate-500">1 / 80131502</td>
                      <td className="p-2 text-slate-800 font-bold">{viewingStatementPayment.concept}</td>
                      <td className="p-2 text-right">${viewingStatementPayment.amount}.00</td>
                      <td className="p-2 text-right font-bold">${viewingStatementPayment.amount}.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-end">
                <div className="space-y-0.5 font-mono text-[7px] max-w-xs text-slate-400">
                  <p className="break-all font-bold">Sello Digital SAT:</p>
                  <p className="break-all">Fka92Jdlka91KzLp01AsKl91La920Ka92Kla919Fkalk1920KalqlaoaslakaSADKa9102KAlas==</p>
                  <p className="break-all font-bold mt-1">Cadena Original del SAT:</p>
                  <p className="break-all">||1.1|9D8B4E12-F9C3-4A12-B6A3-C8D2F8F12E4A|2026-07-17T11:45:00|SAT010724NN1|fka928F...</p>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex justify-between gap-4 text-slate-500 font-mono text-[10px]">
                    <span>Subtotal:</span>
                    <span>${viewingStatementPayment.amount}.00</span>
                  </div>
                  <div className="flex justify-between gap-4 text-slate-500 font-mono text-[10px]">
                    <span>IVA (0%):</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 font-mono text-slate-900 font-black text-xs">
                    <span>Total:</span>
                    <span>${viewingStatementPayment.amount}.00</span>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2 border-t border-slate-100 text-[8px] text-slate-400 uppercase tracking-widest font-mono">
                Este documento es una representación impresa de un CFDI 4.0 autorizado
              </div>
            </div>

            {/* Print and Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 font-extrabold text-xs rounded-xl transition cursor-pointer text-center"
              >
                Imprimir Documento 🖨️
              </button>
              <button
                onClick={() => {
                  confetti({ particleCount: 30, spread: 30 });
                  alert('✓ Descargando archivo XML y PDF oficial del CFDI 4.0...');
                }}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer text-center animate-pulse"
              >
                Descargar XML / PDF 📂
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
