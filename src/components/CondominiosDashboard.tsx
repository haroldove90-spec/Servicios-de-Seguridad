import React, { useState, useRef, useEffect } from 'react';
import { 
  Building, DollarSign, ShieldCheck, Settings, Users, FileText, 
  TrendingUp, CreditCard, Calendar, MessageSquare, Bell, Camera, 
  PhoneCall, Package, Check, Clipboard, QrCode, AlertTriangle, 
  Activity, ArrowUpRight, ArrowDownRight, Upload, Globe, RefreshCw, Send, Trash2,
  LogOut, Plus, Search, Filter, Lock, Unlock, Home, Crown, Building2, UserCheck, Smartphone, BadgeCheck,
  CheckCircle2, PackageCheck, Terminal, HelpCircle, LifeBuoy, PieChart, ShieldAlert, FileSpreadsheet, RefreshCcw, Layers,
  Server, UserX, Menu, X, FileCheck, Wrench, Vote, CheckSquare
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

export interface ClienteCondominio {
  id: string;
  nombre: string;
  administrador: string;
  correo: string;
  telefono: string;
  plan: 'Básico' | 'Premium' | 'Enterprise';
  limiteDepartamentos: number;
  limiteUsuarios: number;
  limiteAlmacenamiento: number; // GB
  usoDepartamentos: number;
  usoUsuarios: number;
  usoAlmacenamiento: number; // GB
  status: 'activo' | 'suspendido';
  fechaRegistro: string;
}

export interface CobroLicenciaSaaS {
  id: string;
  condoNombre: string;
  adminNombre: string;
  plan: 'Básico' | 'Premium' | 'Enterprise';
  monto: number;
  fechaCobro: string;
  metodoPago: string;
  status: 'cobrado' | 'pendiente' | 'fallido';
  intentos: number;
}

export interface InternalSupportTicket {
  id: string;
  condoNombre: string;
  adminNombre: string;
  asunto: string;
  categoria: string;
  prioridad: 'alta' | 'media' | 'baja';
  status: 'abierto' | 'en_progreso' | 'resuelto';
  fecha: string;
  mensajes: { autor: string; texto: string; hora: string }[];
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  nivel: 'info' | 'warning' | 'error' | 'critico';
  usuario: string;
  condominio: string;
  accion: string;
  ip: string;
}

export interface EstructuraInmobiliaria {
  id: string;
  tipo: 'Torre' | 'Manzana' | 'Lote' | 'Cluster';
  nombre: string;
  unidadesCount: number;
  unidadesDetalle: string;
  status: 'activo' | 'inactivo';
}

export interface ResidentProfile {
  id: string;
  nombre: string;
  unidad: string;
  tipoResidente: 'propietario' | 'inquilino';
  correo: string;
  telefono: string;
  status: 'activo' | 'moroso' | 'inactivo';
}

export interface PersonalInterno {
  id: string;
  nombre: string;
  rol: 'Guardia' | 'Mantenimiento' | 'Limpieza' | 'Conserje';
  turno: 'Matutino' | 'Vespertino' | 'Nocturno' | '24x24';
  telefono: string;
  status: 'activo' | 'inactivo';
}

export interface RuleCuota {
  id: string;
  nombre: string;
  tipo: 'Ordinaria' | 'Extraordinaria' | 'Recargo Morosidad';
  monto: number;
  periodicidad: 'Mensual' | 'Anual' | 'Única';
  recargoPorcentaje: number;
  status: 'activa' | 'inactiva';
}

export interface ConciliacionBancaria {
  id: string;
  fecha: string;
  conceptoBanco: string;
  monto: number;
  referencia: string;
  estatus: 'conciliado' | 'pendiente';
  unidadMatcheada?: string;
}

export interface EgresoCondominio {
  id: string;
  proveedor: string;
  concepto: string;
  monto: number;
  categoria: 'Proveedor' | 'Nómina Interna' | 'Servicios Básicos' | 'Mantenimiento Mayor';
  fecha: string;
  facturaXmlPdf: boolean;
  estatus: 'pagado' | 'pendiente';
}

export interface EncuestaVotacion {
  id: string;
  titulo: string;
  descripcion: string;
  opciones: { texto: string; votos: number }[];
  fechaCierre: string;
  estatus: 'activa' | 'cerrada';
  totalVotos: number;
}

export interface PresupuestoExtraordinario {
  id: string;
  titulo: string;
  montoTotal: number;
  solicitadoPor: string;
  justificacion: string;
  estatus: 'pendiente' | 'aprobado' | 'rechazado';
  fecha: string;
  votosFavor: number;
  votosContra: number;
}

export interface ActaAsamblea {
  id: string;
  titulo: string;
  fechaAsamblea: string;
  firmasDigitalesCount: number;
  requiereFirmas: number;
  estatus: 'firmado' | 'pendiente_firma';
  pdfUrl: string;
}

export interface InvitadoFrecuente {
  id: string;
  nombre: string;
  relacion: 'Familiar' | 'Servicio Doméstico' | 'Contratista' | 'Amigo';
  diasPermitidos: string;
  placas?: string;
  estatus: 'activo' | 'inactivo';
}

export interface BitacoraGuardia {
  id: string;
  guardiaNombre: string;
  tipo: 'Novedad' | 'Rondín de Seguridad' | 'Cambio de Turno' | 'Incidencia';
  descripcion: string;
  fechaHora: string;
}

export interface VisitaPendiente {
  id: string;
  visitanteNombre: string;
  condoDestino: string;
  tipoVisita: 'Invitado' | 'Proveedor' | 'Servicio / Delivery';
  placas?: string;
  estatus: 'en_espera' | 'ingresado' | 'salio';
  tieneRestriccionMoroso: boolean;
}

interface CondominiosDashboardProps {
  currentUser?: any;
  onSignOut?: () => void;
  initialSubSection?: 'inicio' | 'superadmin' | 'admininmobiliaria' | 'comite' | 'residente' | 'guardia';
}

export default function CondominiosDashboard({ currentUser, onSignOut, initialSubSection }: CondominiosDashboardProps) {
  // Navigation
  const [activeSubSection, setActiveSubSection] = useState<'inicio' | 'superadmin' | 'admininmobiliaria' | 'comite' | 'residente' | 'guardia'>(initialSubSection || 'inicio');
  const [adminCondoTab, setAdminCondoTab] = useState<'comunidad' | 'finanzas' | 'facturacion' | 'operacion' | 'comunicacion'>('comunidad');
  const [comiteTab, setComiteTab] = useState<'auditoria' | 'aprobaciones' | 'actas'>('auditoria');
  const [residenteTab, setResidenteTab] = useState<'finanzas' | 'accesos' | 'amenidades' | 'comunicacion'>('finanzas');
  const [guardiaTab, setGuardiaTab] = useState<'accesos' | 'paqueteria' | 'bitacora'>('accesos');
  const [superAdminTab, setSuperAdminTab] = useState<'clientes' | 'finanzas' | 'soporte'>('clientes');
  const [isNavOpen, setIsNavOpen] = useState<boolean>(false);

  useEffect(() => {
    if (initialSubSection) {
      setActiveSubSection(initialSubSection);
    }
  }, [initialSubSection]);

  // --- SUPER ADMIN EXTRA STATES ---
  // Pasarela de Cobro Automático de Licencias SaaS
  const [cobrosSaaS, setCobrosSaaS] = useState<CobroLicenciaSaaS[]>([
    {
      id: 'cobro-1',
      condoNombre: 'Lomas de Chapultepec AC',
      adminNombre: 'Ing. Alejandro Ruiz',
      plan: 'Premium',
      monto: 3500,
      fechaCobro: '2026-07-01',
      metodoPago: 'Tarjeta VISA ****4821 (Cobro Automático)',
      status: 'cobrado',
      intentos: 1
    },
    {
      id: 'cobro-2',
      condoNombre: 'Residencial Bosques del Portal',
      adminNombre: 'Lic. Sofía Mendoza',
      plan: 'Básico',
      monto: 1500,
      fechaCobro: '2026-07-01',
      metodoPago: 'SPEI Domiciliado (Automático)',
      status: 'cobrado',
      intentos: 1
    },
    {
      id: 'cobro-3',
      condoNombre: 'Torres Alameda Ejecutivo',
      adminNombre: 'C.P. Eduardo Garza',
      plan: 'Enterprise',
      monto: 8000,
      fechaCobro: '2026-07-01',
      metodoPago: 'Domiciliación Bancaria CABA',
      status: 'cobrado',
      intentos: 1
    },
    {
      id: 'cobro-4',
      condoNombre: 'Condominio Puerta del Sol',
      adminNombre: 'Patricia Beltrán',
      plan: 'Premium',
      monto: 3500,
      fechaCobro: '2026-07-01',
      metodoPago: 'Tarjeta MasterCard ****9012 (Rechazada)',
      status: 'fallido',
      intentos: 3
    }
  ]);

  // Tickets de Soporte Interno
  const [internalTickets, setInternalTickets] = useState<InternalSupportTicket[]>([
    {
      id: 'stkt-1',
      condoNombre: 'Condominio Puerta del Sol',
      adminNombre: 'Patricia Beltrán',
      asunto: 'Fallo en cobro de tarjeta y reactivación de servicio',
      categoria: 'Facturación Licencia',
      prioridad: 'alta',
      status: 'en_progreso',
      fecha: '2026-07-25',
      mensajes: [
        { autor: 'Patricia Beltrán', texto: 'Hola, intentamos actualizar la tarjeta de crédito para la licencia de Julio. ¿Nos pueden apoyar para reactivar el servicio?', hora: '10:30' },
        { autor: 'SaaS Support SuperAdmin', texto: 'Iniciando proceso de verificación con pasarela bancaria Stripe/MercadoPago.', hora: '10:45' }
      ]
    },
    {
      id: 'stkt-2',
      condoNombre: 'Lomas de Chapultepec AC',
      adminNombre: 'Ing. Alejandro Ruiz',
      asunto: 'Solicitud de ampliación de límite de departamentos a 250',
      categoria: 'Aumento de Límites',
      prioridad: 'media',
      status: 'abierto',
      fecha: '2026-07-26',
      mensajes: [
        { autor: 'Ing. Alejandro Ruiz', texto: 'Buen día, estamos integrando la Fase 2 del desarrollo con 50 departamentos adicionales. Requerimos ajustar el límite a 250.', hora: '09:15' }
      ]
    },
    {
      id: 'stkt-3',
      condoNombre: 'Torres Alameda Ejecutivo',
      adminNombre: 'C.P. Eduardo Garza',
      asunto: 'Configuración de videoportero SIP en caseta',
      categoria: 'Configuración Caseta',
      prioridad: 'baja',
      status: 'resuelto',
      fecha: '2026-07-24',
      mensajes: [
        { autor: 'C.P. Eduardo Garza', texto: '¿Cómo configuramos las cámaras IP Hikvision para la bitácora de guardia?', hora: '14:20' },
        { autor: 'SaaS Support SuperAdmin', texto: 'Se envió la guía en PDF y se habilitó el webhook RTSP en caseta.', hora: '15:10' }
      ]
    }
  ]);

  const [selectedTicketForReply, setSelectedTicketForReply] = useState<InternalSupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Logs de Auditoría del Sistema
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([
    { id: 'log-1', timestamp: '2026-07-26 13:30:12', nivel: 'info', usuario: 'harold.anguiano', condominio: 'SaaS Global', accion: 'Acceso exitoso al panel de Super Administrador (SaaS Owner)', ip: '187.190.22.10' },
    { id: 'log-2', timestamp: '2026-07-26 12:45:00', nivel: 'warning', usuario: 'aruiz@lomaschapultepec.mx', condominio: 'Lomas de Chapultepec AC', accion: 'Uso de departamentos alcanzó el 71% del límite (142/200)', ip: '189.210.44.12' },
    { id: 'log-3', timestamp: '2026-07-26 11:15:33', nivel: 'critico', usuario: 'Sistema Automático SaaS', condominio: 'Condominio Puerta del Sol', accion: 'Suscripción suspendida automáticamente por fallo en cobro de tarjeta', ip: '10.0.4.12' },
    { id: 'log-4', timestamp: '2026-07-26 10:02:18', nivel: 'error', usuario: 'smendoza@bosquesportal.com', condominio: 'Residencial Bosques del Portal', accion: 'Error en timbrado CFDI 4.0: CSD no coincide con RFC emisor CNO160715AAA', ip: '201.110.15.88' },
    { id: 'log-5', timestamp: '2026-07-25 18:22:45', nivel: 'info', usuario: 'egarza@torresalameda.com', condominio: 'Torres Alameda Ejecutivo', accion: 'Actualización de límite de almacenamiento cloud a 500 GB', ip: '187.190.22.10' }
  ]);
  const [auditFilterLevel, setAuditFilterLevel] = useState<'todos' | 'info' | 'warning' | 'error' | 'critico'>('todos');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  // --- 6. GESTIÓN DE CLIENTES STATE & HANDLERS ---
  const [clientes, setClientes] = useState<ClienteCondominio[]>([
    {
      id: 'cli-1',
      nombre: 'Lomas de Chapultepec AC',
      administrador: 'Ing. Alejandro Ruiz',
      correo: 'aruiz@lomaschapultepec.mx',
      telefono: '+52 5512345678',
      plan: 'Premium',
      limiteDepartamentos: 200,
      limiteUsuarios: 25,
      limiteAlmacenamiento: 50,
      usoDepartamentos: 142,
      usoUsuarios: 18,
      usoAlmacenamiento: 28.4,
      status: 'activo',
      fechaRegistro: '2025-01-15'
    },
    {
      id: 'cli-2',
      nombre: 'Residencial Bosques del Portal',
      administrador: 'Lic. Sofía Mendoza',
      correo: 'smendoza@bosquesportal.com',
      telefono: '+52 5598765432',
      plan: 'Básico',
      limiteDepartamentos: 50,
      limiteUsuarios: 5,
      limiteAlmacenamiento: 10,
      usoDepartamentos: 38,
      usoUsuarios: 3,
      usoAlmacenamiento: 4.1,
      status: 'activo',
      fechaRegistro: '2025-06-01'
    },
    {
      id: 'cli-3',
      nombre: 'Torres Alameda Ejecutivo',
      administrador: 'C.P. Eduardo Garza',
      correo: 'egarza@torresalameda.com',
      telefono: '+52 5588776655',
      plan: 'Enterprise',
      limiteDepartamentos: 1000,
      limiteUsuarios: 100,
      limiteAlmacenamiento: 500,
      usoDepartamentos: 450,
      usoUsuarios: 42,
      usoAlmacenamiento: 182.5,
      status: 'activo',
      fechaRegistro: '2024-11-10'
    },
    {
      id: 'cli-4',
      nombre: 'Condominio Puerta del Sol',
      administrador: 'Patricia Beltrán',
      correo: 'pbeltran@puertasol.org',
      telefono: '+52 5544332211',
      plan: 'Premium',
      limiteDepartamentos: 150,
      limiteUsuarios: 20,
      limiteAlmacenamiento: 30,
      usoDepartamentos: 120,
      usoUsuarios: 12,
      usoAlmacenamiento: 15.6,
      status: 'suspendido',
      fechaRegistro: '2025-03-22'
    }
  ]);

  const [searchClientQuery, setSearchClientQuery] = useState('');
  const [filterClientPlan, setFilterClientPlan] = useState<'todos' | 'Básico' | 'Premium' | 'Enterprise'>('todos');
  const [filterClientStatus, setFilterClientStatus] = useState<'todos' | 'activo' | 'suspendido'>('todos');

  // New/Edit Client form state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClienteCondominio | null>(null);
  
  const [formClientNombre, setFormClientNombre] = useState('');
  const [formClientAdmin, setFormClientAdmin] = useState('');
  const [formClientCorreo, setFormClientCorreo] = useState('');
  const [formClientTelefono, setFormClientTelefono] = useState('');
  const [formClientPlan, setFormClientPlan] = useState<'Básico' | 'Premium' | 'Enterprise'>('Premium');
  const [formClientLimDep, setFormClientLimDep] = useState('100');
  const [formClientLimUsr, setFormClientLimUsr] = useState('15');
  const [formClientLimAlm, setFormClientLimAlm] = useState('20');

  // Temporary toast feedback
  const [successBannerMsg, setSuccessBannerMsg] = useState<string | null>(null);
  const showSuccessBanner = (msg: string) => {
    setSuccessBannerMsg(msg);
    setTimeout(() => {
      setSuccessBannerMsg(null);
    }, 4500);
  };

  // Open modal for creating new client
  const handleOpenCreateClient = () => {
    setEditingClient(null);
    setFormClientNombre('');
    setFormClientAdmin('');
    setFormClientCorreo('');
    setFormClientTelefono('');
    setFormClientPlan('Premium');
    setFormClientLimDep('150');
    setFormClientLimUsr('20');
    setFormClientLimAlm('30');
    setIsClientModalOpen(true);
  };

  // Open modal for editing existing client
  const handleOpenEditClient = (cli: ClienteCondominio) => {
    setEditingClient(cli);
    setFormClientNombre(cli.nombre);
    setFormClientAdmin(cli.administrador);
    setFormClientCorreo(cli.correo);
    setFormClientTelefono(cli.telefono);
    setFormClientPlan(cli.plan);
    setFormClientLimDep(cli.limiteDepartamentos.toString());
    setFormClientLimUsr(cli.limiteUsuarios.toString());
    setFormClientLimAlm(cli.limiteAlmacenamiento.toString());
    setIsClientModalOpen(true);
  };

  // Save/Submit client form
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientNombre || !formClientAdmin || !formClientCorreo) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    const parsedLimDep = parseInt(formClientLimDep) || 50;
    const parsedLimUsr = parseInt(formClientLimUsr) || 5;
    const parsedLimAlm = parseInt(formClientLimAlm) || 10;

    if (editingClient) {
      // Edit mode
      setClientes(prev => prev.map(cli => {
        if (cli.id === editingClient.id) {
          return {
            ...cli,
            nombre: formClientNombre,
            administrador: formClientAdmin,
            correo: formClientCorreo,
            telefono: formClientTelefono,
            plan: formClientPlan,
            limiteDepartamentos: parsedLimDep,
            limiteUsuarios: parsedLimUsr,
            limiteAlmacenamiento: parsedLimAlm
          };
        }
        return cli;
      }));
      showSuccessBanner('✓ Datos del cliente actualizados exitosamente.');
    } else {
      // Create mode
      const newClient: ClienteCondominio = {
        id: 'cli-' + Date.now(),
        nombre: formClientNombre,
        administrador: formClientAdmin,
        correo: formClientCorreo,
        telefono: formClientTelefono || '+52 5500000000',
        plan: formClientPlan,
        limiteDepartamentos: parsedLimDep,
        limiteUsuarios: parsedLimUsr,
        limiteAlmacenamiento: parsedLimAlm,
        usoDepartamentos: 0,
        usoUsuarios: 1, // current creator admin
        usoAlmacenamiento: 0.1,
        status: 'activo',
        fechaRegistro: new Date().toISOString().split('T')[0]
      };
      setClientes(prev => [newClient, ...prev]);
      showSuccessBanner('✓ Cliente registrado exitosamente.');
      confetti({ particleCount: 80, spread: 60 });
    }

    setIsClientModalOpen(false);
  };

  // Toggle suspension status
  const handleToggleSuspendClient = (id: string) => {
    setClientes(prev => prev.map(cli => {
      if (cli.id === id) {
        const newStatus = cli.status === 'activo' ? 'suspendido' : 'activo';
        showSuccessBanner(`✓ Cliente ${cli.nombre} ha sido ${newStatus === 'suspendido' ? 'SUSPENDIDO' : 'REACTIVADO'}.`);
        return {
          ...cli,
          status: newStatus
        };
      }
      return cli;
    }));
  };

  // Delete (baja) client
  const handleBajaClient = (id: string, nombre: string) => {
    if (window.confirm(`¿Está seguro que desea dar de BAJA (eliminar) permanentemente al condominio "${nombre}"? Esta acción no se puede deshacer.`)) {
      setClientes(prev => prev.filter(cli => cli.id !== id));
      // Add audit log
      setAuditLogs(prev => [
        {
          id: 'log-' + Date.now(),
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          nivel: 'critico',
          usuario: currentUser?.email || 'SuperAdmin Owner',
          condominio: nombre,
          accion: `Cliente "${nombre}" dado de baja permanentemente`,
          ip: '187.190.22.10'
        },
        ...prev
      ]);
      showSuccessBanner(`✓ El cliente "${nombre}" ha sido dado de baja permanentemente del sistema.`);
    }
  };

  // Reintentar o Procesar Cobro Automático SaaS
  const handleRetryCobroSaaS = (cobroId: string) => {
    setCobrosSaaS(prev => prev.map(c => {
      if (c.id === cobroId) {
        return {
          ...c,
          status: 'cobrado',
          intentos: c.intentos + 1,
          metodoPago: 'Reintento Exitoso con Pasarela Stripe/CABA'
        };
      }
      return c;
    }));

    // Reactivar el condominio si estaba suspendido
    const cobroObj = cobrosSaaS.find(c => c.id === cobroId);
    if (cobroObj) {
      setClientes(prev => prev.map(cli => {
        if (cli.nombre.toLowerCase().includes(cobroObj.condoNombre.toLowerCase())) {
          return { ...cli, status: 'activo' };
        }
        return cli;
      }));
    }

    setAuditLogs(prev => [
      {
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        nivel: 'info',
        usuario: currentUser?.email || 'SuperAdmin Owner',
        condominio: cobroObj?.condoNombre || 'SaaS',
        accion: `Cobro de licencia software $${cobroObj?.monto}.00 procesado exitosamente`,
        ip: '187.190.22.10'
      },
      ...prev
    ]);

    showSuccessBanner('✓ Cobro de licencia procesado con éxito. Suscripción reactivada.');
    confetti({ particleCount: 60, spread: 50 });
  };

  // Correr barrido masivo de cobro automático de licencias
  const handleRunAllCobrosSaaS = () => {
    setCobrosSaaS(prev => prev.map(c => ({
      ...c,
      status: 'cobrado',
      metodoPago: c.metodoPago.replace('(Rechazada)', '(Reactivada)')
    })));

    setClientes(prev => prev.map(cli => ({ ...cli, status: 'activo' })));

    setAuditLogs(prev => [
      {
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        nivel: 'info',
        usuario: 'Pasarela SaaS Cron Job',
        condominio: 'SaaS Global',
        accion: 'Ejecutado barrido automático de cobros de licencias mensuales a administradores',
        ip: '127.0.0.1'
      },
      ...prev
    ]);

    showSuccessBanner('✓ Barrido masivo de cobro automático de licencias completado al 100%.');
    confetti({ particleCount: 100, spread: 80 });
  };

  // Responder ticket de soporte interno
  const handleReplySupportTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForReply || !ticketReplyText.trim()) return;

    const newMsg = {
      autor: 'SaaS Support SuperAdmin',
      texto: ticketReplyText.trim(),
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    };

    setInternalTickets(prev => prev.map(tkt => {
      if (tkt.id === selectedTicketForReply.id) {
        return {
          ...tkt,
          status: 'en_progreso',
          mensajes: [...tkt.mensajes, newMsg]
        };
      }
      return tkt;
    }));

    setSelectedTicketForReply(prev => prev ? {
      ...prev,
      status: 'en_progreso',
      mensajes: [...prev.mensajes, newMsg]
    } : null);

    setTicketReplyText('');
    showSuccessBanner('✓ Respuesta enviada al Administrador del Condominio.');
  };

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

  // Guardia helper states
  const [scannerInput, setScannerInput] = useState('');
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [intercomTarget, setIntercomTarget] = useState('');
  const [parcelResident, setParcelResident] = useState('');
  const [parcelCarrier, setParcelCarrier] = useState('');
  const [parcelTracking, setParcelTracking] = useState('');

  const simulateQrScan = () => {
    if (!scannerInput) return;
    setScanResult({
      type: 'success',
      msg: `✓ PASE VÁLIDO: Acceso autorizado para ${scannerInput}. Código escaneado a las ${new Date().toLocaleTimeString('es-MX')}.`
    });
  };

  const handleRegisterParcel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcelResident && !newParcelCondo) return;
    const newP: Parcel = {
      id: 'pkg-' + Date.now(),
      condo: newParcelCondo || 'Casa 101',
      resident: parcelResident || newParcelResident || 'Residente',
      carrier: parcelCarrier || newParcelCarrier || 'Amazon',
      trackingNumber: parcelTracking || newParcelTracking || 'TRACK-' + Math.floor(Math.random() * 8999 + 1000),
      receivedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'en_recepcion'
    };
    setParcels(prev => [newP, ...prev]);
    setParcelResident('');
    setParcelCarrier('');
    setParcelTracking('');
    setNewParcelCondo('');
    showSuccessBanner('✓ Paquete registrado y notificación enviada al residente.');
  };

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

  // --- NEW MODULE STATES FOR ALL ROLES ---
  // 1. Estructura Inmobiliaria
  const [estructuras, setEstructuras] = useState<EstructuraInmobiliaria[]>([
    { id: 'est-1', tipo: 'Torre', nombre: 'Torre A - Paseo de las Palmas', unidadesCount: 24, unidadesDetalle: 'Deptos 101 a 604', status: 'activo' },
    { id: 'est-2', tipo: 'Torre', nombre: 'Torre B - Valle Oriente', unidadesCount: 24, unidadesDetalle: 'Deptos 101 a 604', status: 'activo' },
    { id: 'est-3', tipo: 'Cluster', nombre: 'Cluster Lomas Lote 1-50', unidadesCount: 50, unidadesDetalle: 'Residencias individuales', status: 'activo' },
  ]);
  const [newEstTipo, setNewEstTipo] = useState<'Torre' | 'Manzana' | 'Lote' | 'Cluster'>('Torre');
  const [newEstNombre, setNewEstNombre] = useState('');
  const [newEstCount, setNewEstCount] = useState('12');
  const [newEstDetalle, setNewEstDetalle] = useState('');

  // 2. Catálogo de Residentes
  const [residentesCat, setResidentesCat] = useState<ResidentProfile[]>([
    { id: 'res-1', nombre: 'Ing. Alejandro Ruiz', unidad: 'Torre A - Depto 102', tipoResidente: 'propietario', correo: 'aruiz@lomas.mx', telefono: '+52 5512345678', status: 'activo' },
    { id: 'res-2', nombre: 'Haroldo Residente', unidad: 'Torre A - Depto 105', tipoResidente: 'propietario', correo: 'haroldo@residente.org', telefono: '+52 5588990011', status: 'activo' },
    { id: 'res-3', nombre: 'Lic. Sofía Mendoza', unidad: 'Torre B - Depto 201', tipoResidente: 'inquilino', correo: 'smendoza@bosques.com', telefono: '+52 5598765432', status: 'moroso' },
    { id: 'res-4', nombre: 'C.P. Eduardo Garza', unidad: 'Cluster Lote 12', tipoResidente: 'propietario', correo: 'egarza@torres.com', telefono: '+52 5544332211', status: 'activo' },
  ]);
  const [newResNombre, setNewResNombre] = useState('');
  const [newResUnidad, setNewResUnidad] = useState('');
  const [newResTipo, setNewResTipo] = useState<'propietario' | 'inquilino'>('propietario');
  const [newResCorreo, setNewResCorreo] = useState('');
  const [newResTel, setNewResTel] = useState('');

  // 3. Personal Interno
  const [personalInterno, setPersonalInterno] = useState<PersonalInterno[]>([
    { id: 'per-1', nombre: 'Oficial Roberto Sánchez', rol: 'Guardia', turno: '24x24', telefono: '+52 5511223344', status: 'activo' },
    { id: 'per-2', nombre: 'Oficial Miguel Ángel Torres', rol: 'Guardia', turno: 'Nocturno', telefono: '+52 5522334455', status: 'activo' },
    { id: 'per-3', nombre: 'Técnico Gonzalo Morales', rol: 'Mantenimiento', turno: 'Matutino', telefono: '+52 5533445566', status: 'activo' },
    { id: 'per-4', nombre: 'Sra. María Elena Cruz', rol: 'Limpieza', turno: 'Matutino', telefono: '+52 5544556677', status: 'activo' },
  ]);
  const [newPerNombre, setNewPerNombre] = useState('');
  const [newPerRol, setNewPerRol] = useState<'Guardia' | 'Mantenimiento' | 'Limpieza' | 'Conserje'>('Guardia');
  const [newPerTurno, setNewPerTurno] = useState<'Matutino' | 'Vespertino' | 'Nocturno' | '24x24'>('24x24');
  const [newPerTel, setNewPerTel] = useState('');

  // 4. Configuración de Cuotas y Alertas
  const [reglasCuotas, setReglasCuotas] = useState<RuleCuota[]>([
    { id: 'cuo-1', nombre: 'Cuota Ordinaria Mensual 2026', tipo: 'Ordinaria', monto: 2500, periodicidad: 'Mensual', recargoPorcentaje: 10, status: 'activa' },
    { id: 'cuo-2', nombre: 'Fondo de Reserva Impermeabilización', tipo: 'Extraordinaria', monto: 1200, periodicidad: 'Única', recargoPorcentaje: 5, status: 'activa' },
  ]);
  const [newCuotaNombre, setNewCuotaNombre] = useState('');
  const [newCuotaMonto, setNewCuotaMonto] = useState('2500');
  const [newCuotaTipo, setNewCuotaTipo] = useState<'Ordinaria' | 'Extraordinaria' | 'Recargo Morosidad'>('Ordinaria');

  // 5. Conciliación Bancaria
  const [bancoMovimientos, setBancoMovimientos] = useState<ConciliacionBancaria[]>([
    { id: 'bnc-1', fecha: '2026-07-25', conceptoBanco: 'SPEI RECIBIDO - ALEJANDRO RUIZ', monto: 2500, referencia: 'REFF-90214', estatus: 'conciliado', unidadMatcheada: 'Torre A - Depto 102' },
    { id: 'bnc-2', fecha: '2026-07-24', conceptoBanco: 'DEPOSITO SUCURSAL BBVA CLABE 0121800', monto: 2500, referencia: 'DEPO-8812', estatus: 'conciliado', unidadMatcheada: 'Cluster Lote 12' },
    { id: 'bnc-3', fecha: '2026-07-23', conceptoBanco: 'SPEI DESCONOCIDO - PAGO S/REF', monto: 1500, referencia: 'SPEI-99201', estatus: 'pendiente' },
  ]);

  // 6. Egresos & Nóminas
  const [egresos, setEgresos] = useState<EgresoCondominio[]>([
    { id: 'egr-1', proveedor: 'CFE Suministrador Básico', concepto: 'Consumo Eléctrico Áreas Comunes / Bombas', monto: 18450, categoria: 'Servicios Básicos', fecha: '2026-07-20', facturaXmlPdf: true, estatus: 'pagado' },
    { id: 'egr-2', proveedor: 'Seguridad Privada Protec SA de CV', concepto: 'Nómina Quincenal Guardias de Caseta', monto: 32000, categoria: 'Nómina Interna', fecha: '2026-07-15', facturaXmlPdf: true, estatus: 'pagado' },
    { id: 'egr-3', proveedor: 'Mantenimiento de Elevadores Otis', concepto: 'Servicio Preventivo Mensual Elevadores', monto: 12500, categoria: 'Mantenimiento Mayor', fecha: '2026-07-10', facturaXmlPdf: true, estatus: 'pagado' },
  ]);
  const [newEgrProveedor, setNewEgrProveedor] = useState('');
  const [newEgrConcepto, setNewEgrConcepto] = useState('');
  const [newEgrMonto, setNewEgrMonto] = useState('5000');
  const [newEgrCat, setNewEgrCat] = useState<'Proveedor' | 'Nómina Interna' | 'Servicios Básicos' | 'Mantenimiento Mayor'>('Proveedor');

  // 7. Alertas de Cobranza
  const [alertaDiasPrevios, setAlertaDiasPrevios] = useState('3');
  const [alertaDiasMoroso, setAlertaDiasMoroso] = useState('5');
  const [canalAlertaMail, setCanalAlertaMail] = useState(true);
  const [canalAlertaWhatsapp, setCanalAlertaWhatsapp] = useState(true);

  // 8. Encuestas y Votaciones
  const [encuestas, setEncuestas] = useState<EncuestaVotacion[]>([
    {
      id: 'enc-1',
      titulo: 'Aprobación de Instalación de Celdas Solares en Casa Club',
      descripcion: '¿Está de acuerdo en financiar la instalación de paneles solares con el fondo de reserva para ahorrar 60% en luz comunal?',
      opciones: [
        { texto: 'Sí, Aprobado', votos: 34 },
        { texto: 'No, Rechazado', votos: 6 },
        { texto: 'Abstención', votos: 2 }
      ],
      fechaCierre: '2026-08-01',
      estatus: 'activa',
      totalVotos: 42
    }
  ]);
  const [newEncTitulo, setNewEncTitulo] = useState('');
  const [newEncDesc, setNewEncDesc] = useState('');
  const [newEncFechaCierre, setNewEncFechaCierre] = useState('2026-08-15');

  // 9. Comité Presupuestos Extraordinarios y Actas
  const [presupuestosExtra, setPresupuestosExtra] = useState<PresupuestoExtraordinario[]>([
    {
      id: 'pre-1',
      titulo: 'Remodelación de Portones Vehiculares Automatizados',
      montoTotal: 85000,
      solicitadoPor: 'Ing. Alejandro Ruiz (Admin)',
      justificacion: 'Reemplazo de motores hidráulicos desgastados por motores de alta velocidad con brazos de uso rudo.',
      estatus: 'pendiente',
      fecha: '2026-07-22',
      votosFavor: 2,
      votosContra: 0
    },
    {
      id: 'pre-2',
      titulo: 'Sistema de Pintura Térmica en Fachadas Exteriores Torre A',
      montoTotal: 140000,
      solicitadoPor: 'Ing. Alejandro Ruiz (Admin)',
      justificacion: 'Sellado e impermeabilización de grietas estructurales exteriores.',
      estatus: 'aprobado',
      fecha: '2026-07-05',
      votosFavor: 4,
      votosContra: 0
    }
  ]);

  const [actasAsamblea, setActasAsamblea] = useState<ActaAsamblea[]>([
    {
      id: 'act-1',
      titulo: 'Acta de Asamblea Ordinaria - Junio 2026',
      fechaAsamblea: '2026-06-28',
      firmasDigitalesCount: 3,
      requiereFirmas: 3,
      estatus: 'firmado',
      pdfUrl: '#'
    },
    {
      id: 'act-2',
      titulo: 'Acta de Asamblea Extraordinaria - Presupuestos 2026',
      fechaAsamblea: '2026-07-15',
      firmasDigitalesCount: 1,
      requiereFirmas: 3,
      estatus: 'pendiente_firma',
      pdfUrl: '#'
    }
  ]);

  // 10. Residente Invitados Frecuentes & Confirmación Lectura
  const [invitadosFrecuentes, setInvitadosFrecuentes] = useState<InvitadoFrecuente[]>([
    { id: 'inv-1', nombre: 'María Esther Ruiz (Mamá)', relacion: 'Familiar', diasPermitidos: 'Lunes a Domingo (Permanente)', placas: 'XYZ-901-A', estatus: 'activo' },
    { id: 'inv-2', nombre: 'Carlos López (Servicio Limpieza)', relacion: 'Servicio Doméstico', diasPermitidos: 'Martes y Jueves (8am - 3pm)', estatus: 'activo' },
  ]);
  const [newInvNombre, setNewInvNombre] = useState('');
  const [newInvRel, setNewInvRel] = useState<'Familiar' | 'Servicio Doméstico' | 'Contratista' | 'Amigo'>('Familiar');
  const [newInvDias, setNewInvDias] = useState('Lunes a Viernes');
  const [newInvPlacas, setNewInvPlacas] = useState('');
  const [readBulletins, setReadBulletins] = useState<Record<string, boolean>>({});

  // 11. Guardia Bitácora & Visitas Pendientes del Día
  const [bitacoraGuardia, setBitacoraGuardia] = useState<BitacoraGuardia[]>([
    { id: 'bit-1', guardiaNombre: 'Oficial Roberto Sánchez', tipo: 'Cambio de Turno', descripcion: 'Recibe turno sin novedades en caseta. Equipos de cómputo e interfón operando 100%.', fechaHora: '2026-07-26 08:00' },
    { id: 'bit-2', guardiaNombre: 'Oficial Roberto Sánchez', tipo: 'Rondín de Seguridad', descripcion: 'Rondín en perímetro norte y alberca. Puertas cerradas, bombas operando.', fechaHora: '2026-07-26 10:30' },
    { id: 'bit-3', guardiaNombre: 'Oficial Roberto Sánchez', tipo: 'Novedad', descripcion: 'Ingresa proveedor de internet en camioneta placas ABC-123. Se verifica INE.', fechaHora: '2026-07-26 11:45' },
  ]);
  const [newBitTipo, setNewBitTipo] = useState<'Novedad' | 'Rondín de Seguridad' | 'Cambio de Turno' | 'Incidencia'>('Novedad');
  const [newBitDesc, setNewBitDesc] = useState('');

  const [visitasPendientes, setVisitasPendientes] = useState<VisitaPendiente[]>([
    { id: 'vis-1', visitanteNombre: 'Carlos Ortiz', condoDestino: 'Torre A - Depto 102', tipoVisita: 'Invitado', placas: 'GTO-901-B', estatus: 'en_espera', tieneRestriccionMoroso: false },
    { id: 'vis-2', visitanteNombre: 'Técnico de Izzi Telecom', condoDestino: 'Torre B - Depto 201', tipoVisita: 'Proveedor', placas: 'MEX-112-C', estatus: 'en_espera', tieneRestriccionMoroso: true },
    { id: 'vis-3', visitanteNombre: 'Lucía Fernández', condoDestino: 'Cluster Lote 12', tipoVisita: 'Invitado', placas: 'JAL-445-A', estatus: 'ingresado', tieneRestriccionMoroso: false },
  ]);
  const [searchVisitaQuery, setSearchVisitaQuery] = useState('');
  const [newVisNombre, setNewVisNombre] = useState('');
  const [newVisDestino, setNewVisDestino] = useState('');
  const [newVisPlacas, setNewVisPlacas] = useState('');

  // Handlers for new modules
  const handleAddEstructura = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEstNombre) return;
    const newEst: EstructuraInmobiliaria = {
      id: 'est-' + Date.now(),
      tipo: newEstTipo,
      nombre: newEstNombre,
      unidadesCount: parseInt(newEstCount) || 1,
      unidadesDetalle: newEstDetalle || `Estructura ${newEstNombre}`,
      status: 'activo'
    };
    setEstructuras(prev => [newEst, ...prev]);
    setNewEstNombre('');
    setNewEstDetalle('');
    showSuccessBanner('✓ Estructura inmobiliaria registrada.');
  };

  const handleAddResidentCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResNombre || !newResUnidad) return;
    const newR: ResidentProfile = {
      id: 'res-' + Date.now(),
      nombre: newResNombre,
      unidad: newResUnidad,
      tipoResidente: newResTipo,
      correo: newResCorreo || 'residente@condo.mx',
      telefono: newResTel || '+52 5500000000',
      status: 'activo'
    };
    setResidentesCat(prev => [newR, ...prev]);
    setNewResNombre('');
    setNewResUnidad('');
    setNewResCorreo('');
    setNewResTel('');
    showSuccessBanner('✓ Residente vinculado a unidad exitosamente.');
  };

  const handleAddPersonal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPerNombre) return;
    const newP: PersonalInterno = {
      id: 'per-' + Date.now(),
      nombre: newPerNombre,
      rol: newPerRol,
      turno: newPerTurno,
      telefono: newPerTel || '+52 5500000000',
      status: 'activo'
    };
    setPersonalInterno(prev => [newP, ...prev]);
    setNewPerNombre('');
    setNewPerTel('');
    showSuccessBanner('✓ Perfil de personal interno dado de alta.');
  };

  const handleAddRuleCuota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCuotaNombre) return;
    const newCuo: RuleCuota = {
      id: 'cuo-' + Date.now(),
      nombre: newCuotaNombre,
      tipo: newCuotaTipo,
      monto: parseFloat(newCuotaMonto) || 0,
      periodicidad: 'Mensual',
      recargoPorcentaje: 10,
      status: 'activa'
    };
    setReglasCuotas(prev => [newCuo, ...prev]);
    setNewCuotaNombre('');
    showSuccessBanner('✓ Regla de cuota y recargos configurada.');
  };

  const handleAddEgreso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEgrProveedor || !newEgrConcepto) return;
    const newE: EgresoCondominio = {
      id: 'egr-' + Date.now(),
      proveedor: newEgrProveedor,
      concepto: newEgrConcepto,
      monto: parseFloat(newEgrMonto) || 0,
      categoria: newEgrCat,
      fecha: new Date().toISOString().split('T')[0],
      facturaXmlPdf: true,
      estatus: 'pagado'
    };
    setEgresos(prev => [newE, ...prev]);
    setNewEgrProveedor('');
    setNewEgrConcepto('');
    showSuccessBanner('✓ Egreso y comprobante registrado.');
  };

  const handleAddEncuesta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEncTitulo || !newEncDesc) return;
    const newEnc: EncuestaVotacion = {
      id: 'enc-' + Date.now(),
      titulo: newEncTitulo,
      descripcion: newEncDesc,
      opciones: [
        { texto: 'Sí, Aprobado', votos: 0 },
        { texto: 'No, Rechazado', votos: 0 },
        { texto: 'Abstención', votos: 0 }
      ],
      fechaCierre: newEncFechaCierre,
      estatus: 'activa',
      totalVotos: 0
    };
    setEncuestas(prev => [newEnc, ...prev]);
    setNewEncTitulo('');
    setNewEncDesc('');
    showSuccessBanner('✓ Votación publicada en Muro Digital.');
  };

  const handleVoteEncuesta = (encId: string, opIndex: number) => {
    setEncuestas(prev => prev.map(enc => {
      if (enc.id === encId) {
        const newOps = [...enc.opciones];
        newOps[opIndex] = { ...newOps[opIndex], votos: newOps[opIndex].votos + 1 };
        return {
          ...enc,
          opciones: newOps,
          totalVotos: enc.totalVotos + 1
        };
      }
      return enc;
    }));
    showSuccessBanner('✓ Su voto ha sido registrado de forma anónima.');
    confetti({ particleCount: 40, spread: 40 });
  };

  const handleApprovePresupuesto = (id: string, decision: 'aprobado' | 'rechazado') => {
    setPresupuestosExtra(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, estatus: decision, votosFavor: decision === 'aprobado' ? p.votosFavor + 1 : p.votosFavor };
      }
      return p;
    }));
    showSuccessBanner(`✓ Presupuesto ${decision === 'aprobado' ? 'APROBADO' : 'RECHAZADO'} por el Comité.`);
  };

  const handleSignActa = (id: string) => {
    setActasAsamblea(prev => prev.map(a => {
      if (a.id === id) {
        const newCount = Math.min(a.requiereFirmas, a.firmasDigitalesCount + 1);
        return {
          ...a,
          firmasDigitalesCount: newCount,
          estatus: newCount >= a.requiereFirmas ? 'firmado' : 'pendiente_firma'
        };
      }
      return a;
    }));
    showSuccessBanner('✓ Firma digital estampada en el Acta de Asamblea.');
  };

  const handleAddInvitadoFrecuente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvNombre) return;
    const newInv: InvitadoFrecuente = {
      id: 'inv-' + Date.now(),
      nombre: newInvNombre,
      relacion: newInvRel,
      diasPermitidos: newInvDias,
      placas: newInvPlacas,
      estatus: 'activo'
    };
    setInvitadosFrecuentes(prev => [newInv, ...prev]);
    setNewInvNombre('');
    setNewInvPlacas('');
    showSuccessBanner('✓ Invitado frecuente registrado para acceso automático.');
  };

  const handleAddBitacoraEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBitDesc) return;
    const newEntry: BitacoraGuardia = {
      id: 'bit-' + Date.now(),
      guardiaNombre: 'Oficial en Caseta',
      tipo: newBitTipo,
      descripcion: newBitDesc,
      fechaHora: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setBitacoraGuardia(prev => [newEntry, ...prev]);
    setNewBitDesc('');
    showSuccessBanner('✓ Novedad asentada en la bitácora de caseta.');
  };

  const handleCheckInVisita = (id: string) => {
    setVisitasPendientes(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, estatus: 'ingresado' };
      }
      return v;
    }));
    showSuccessBanner('✓ Ingreso de visitante confirmado en caseta.');
  };

  const handleAddVisitaManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisNombre || !newVisDestino) return;
    const newVis: VisitaPendiente = {
      id: 'vis-' + Date.now(),
      visitanteNombre: newVisNombre,
      condoDestino: newVisDestino,
      tipoVisita: 'Invitado',
      placas: newVisPlacas || 'S/P',
      estatus: 'ingresado',
      tieneRestriccionMoroso: newVisDestino.toLowerCase().includes('201') || newVisDestino.toLowerCase().includes('110')
    };
    setVisitasPendientes(prev => [newVis, ...prev]);
    setNewVisNombre('');
    setNewVisDestino('');
    setNewVisPlacas('');
    showSuccessBanner('✓ Visita imprevista capturada e ingresada.');
  };

  const handleTriggerPanicButton = () => {
    const panicLog: BitacoraGuardia = {
      id: 'panic-' + Date.now(),
      guardiaNombre: 'Oficial en Caseta',
      tipo: 'Incidencia',
      descripcion: '🚨 BOTÓN DE PÁNICO ACTIVADO EN CASETA: Alerta enviada a central de emergencias, administración y comité.',
      fechaHora: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setBitacoraGuardia(prev => [panicLog, ...prev]);
    showSuccessBanner('🚨 ¡ALERTA DE PÁNICO TRANSMITIDA A URGENCIAS Y COMITÉ!');
  };

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
    const target = intercomTarget || intercomCondo || 'Casa 101';
    setIntercomState('calling');
    setIntercomLogs(prev => [`[${new Date().toLocaleTimeString()}] Llamando al interfón de ${target}...`, ...prev]);

    // Simulate ringing, then picking up
    callTimerRef.current = setTimeout(() => {
      setIntercomState('connected');
      setIntercomLogs(prev => [
        `[${new Date().toLocaleTimeString()}] Conectado con ${target}.`,
        `🗣️ Residente: "¡Hola Caseta! Buenas tardes. Sí, autorizo el ingreso del visitante, dele paso."`,
        ...prev
      ]);
    }, 2000);
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
  const totalEgresos = egresos.reduce((acc, e) => acc + e.monto, 0);
  const totalPending = payments.filter(p => p.status === 'pendiente').reduce((acc, p) => acc + p.amount, 0);
  const totalDelinquency = payments.filter(p => p.status === 'vencido').reduce((acc, p) => acc + p.amount, 0);
  const delinquencyRate = (totalDelinquency / totalInvoiced) * 100;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col w-full font-sans pb-16 md:pb-0">
      
      {/* TOP HEADER BAR WITH HAMBURGER MENU BUTTON */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#141417] border-b border-[#232326] select-none shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* HAMBURGER MENU ICON BUTTON */}
          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="p-2 bg-[#1E1E22] hover:bg-purple-600/20 text-slate-300 hover:text-white border border-[#2d2d32] hover:border-purple-500/40 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            title="Abrir / Cerrar Menú de Navegación"
            aria-label="Abrir Menú de Navegación"
          >
            {isNavOpen ? <X className="w-5 h-5 text-purple-400" /> : <Menu className="w-5 h-5 text-purple-400" />}
            <span className="text-xs font-bold hidden sm:inline text-slate-200">Menú</span>
          </button>

          <div className="flex items-center gap-2.5">
            <img 
              src="https://cossma.com.mx/cnls.png" 
              alt="CNLS Logo" 
              className="h-8 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="text-left hidden xs:block">
              <h1 className="text-xs font-black text-white tracking-widest font-sans">CNLS</h1>
              <p className="text-[8px] text-purple-400 font-extrabold uppercase tracking-widest">Condominios</p>
            </div>
          </div>
        </div>

        {/* ACTIVE ROLE BADGE & ACTIONS */}
        <div className="flex items-center gap-2">
          {activeSubSection === 'superadmin' && (
            <span className="text-xs font-black text-red-400 bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/30 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">1. Super Admin</span>
            </span>
          )}
          {activeSubSection === 'admininmobiliaria' && (
            <span className="text-xs font-black text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/30 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">2. Admin Condominio</span>
            </span>
          )}
          {activeSubSection === 'comite' && (
            <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3. Comité</span>
            </span>
          )}
          {activeSubSection === 'residente' && (
            <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/30 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">4. Residente</span>
            </span>
          )}
          {activeSubSection === 'guardia' && (
            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">5. Guardia</span>
            </span>
          )}
          {activeSubSection === 'inicio' && (
            <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20">
              Selección de Roles
            </span>
          )}

          {activeSubSection !== 'inicio' && (
            <button
              onClick={() => { setActiveSubSection('inicio'); setIsNavOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E1E22] hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Cambiar de Rol"
            >
              <Home className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">Cambiar Rol</span>
            </button>
          )}

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold transition cursor-pointer ml-1"
              title="Cerrar Sesión"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Salir</span>
            </button>
          )}
        </div>
      </header>

      {/* LATERAL DRAWER NAVIGATION OVERLAY */}
      {isNavOpen && (
        <div className="fixed inset-0 z-[9999] flex">
          {/* Backdrop */}
          <div 
            onClick={() => setIsNavOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Body */}
          <div className="relative w-80 max-w-[85vw] bg-[#141417] border-r border-[#2d2d32] h-full flex flex-col justify-between p-5 z-10 overflow-y-auto shadow-2xl animate-fade-in">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#2d2d32] pb-4">
                <div className="flex items-center gap-2.5">
                  <img 
                    src="https://cossma.com.mx/cnls.png" 
                    alt="CNLS Logo" 
                    className="h-7 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-xs font-black text-white tracking-widest font-sans">CNLS</h3>
                    <p className="text-[8px] text-purple-400 font-extrabold uppercase tracking-widest">Navegación de Sistema</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNavOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white bg-[#1E1E22] border border-[#2d2d32] rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. SECCIÓN DE ROLES */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 font-mono px-1">
                  Menú de Roles
                </span>

                <div className="space-y-1.5">
                  <button
                    onClick={() => { setActiveSubSection('superadmin'); setIsNavOpen(false); }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-between border ${
                      activeSubSection === 'superadmin'
                        ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-lg'
                        : 'bg-[#1E1E22] text-slate-300 hover:bg-[#25252B] border-[#2d2d32]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Crown className="w-4 h-4 text-red-400 shrink-0" />
                      <span>1. Super Admin (SaaS Owner)</span>
                    </div>
                    {activeSubSection === 'superadmin' && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />}
                  </button>

                  <button
                    onClick={() => { setActiveSubSection('admininmobiliaria'); setIsNavOpen(false); }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-between border ${
                      activeSubSection === 'admininmobiliaria'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-lg'
                        : 'bg-[#1E1E22] text-slate-300 hover:bg-[#25252B] border-[#2d2d32]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>2. Admin Condominio</span>
                    </div>
                    {activeSubSection === 'admininmobiliaria' && <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />}
                  </button>

                  <button
                    onClick={() => { setActiveSubSection('comite'); setIsNavOpen(false); }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-between border ${
                      activeSubSection === 'comite'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg'
                        : 'bg-[#1E1E22] text-slate-300 hover:bg-[#25252B] border-[#2d2d32]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>3. Comité Vigilancia</span>
                    </div>
                    {activeSubSection === 'comite' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                  </button>

                  <button
                    onClick={() => { setActiveSubSection('residente'); setIsNavOpen(false); }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-between border ${
                      activeSubSection === 'residente'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-lg'
                        : 'bg-[#1E1E22] text-slate-300 hover:bg-[#25252B] border-[#2d2d32]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>4. Residente (PWA)</span>
                    </div>
                    {activeSubSection === 'residente' && <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />}
                  </button>

                  <button
                    onClick={() => { setActiveSubSection('guardia'); setIsNavOpen(false); }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-between border ${
                      activeSubSection === 'guardia'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg'
                        : 'bg-[#1E1E22] text-slate-300 hover:bg-[#25252B] border-[#2d2d32]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>5. Guardia / Conserje</span>
                    </div>
                    {activeSubSection === 'guardia' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                  </button>

                  <button
                    onClick={() => { setActiveSubSection('inicio'); setIsNavOpen(false); }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2.5 border ${
                      activeSubSection === 'inicio'
                        ? 'bg-slate-700/50 text-white border-slate-600'
                        : 'bg-[#1E1E22] text-slate-400 hover:bg-[#25252B] border-[#2d2d32]'
                    }`}
                  >
                    <Home className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Panel de Inicio (General)</span>
                  </button>
                </div>
              </div>

              {/* 2. SUB-MÓDULOS DEL ROL ACTIVO */}
              {activeSubSection === 'superadmin' && (
                <div className="space-y-2 pt-3 border-t border-[#2d2d32]">
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-400 font-mono px-1">
                    Módulos SuperAdmin
                  </span>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => { setSuperAdminTab('clientes'); setIsNavOpen(false); }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2.5 border ${
                        superAdminTab === 'clientes'
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                          : 'bg-[#1E1E22] text-slate-300 hover:bg-[#25252B] border-[#2d2d32]'
                      }`}
                    >
                      <Building className="w-4 h-4 text-purple-300 shrink-0" />
                      <span>1. Gestión de Clientes</span>
                    </button>

                    <button
                      onClick={() => { setSuperAdminTab('finanzas'); setIsNavOpen(false); }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2.5 border ${
                        superAdminTab === 'finanzas'
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                          : 'bg-[#1E1E22] text-slate-300 hover:bg-[#25252B] border-[#2d2d32]'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>2. Finanzas Globales</span>
                    </button>

                    <button
                      onClick={() => { setSuperAdminTab('soporte'); setIsNavOpen(false); }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2.5 border ${
                        superAdminTab === 'soporte'
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                          : 'bg-[#1E1E22] text-slate-300 hover:bg-[#25252B] border-[#2d2d32]'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>3. Soporte & Auditoría</span>
                    </button>
                  </div>
                </div>
              )}

              {activeSubSection === 'admininmobiliaria' && (
                <div className="space-y-2 pt-3 border-t border-[#2d2d32]">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 font-mono px-1">
                    Módulos Admin Condominio
                  </span>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => { setAdminCondoTab('finanzas'); setIsNavOpen(false); }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2.5 border ${
                        adminCondoTab === 'finanzas'
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                          : 'bg-[#1E1E22] text-slate-300 hover:bg-[#25252B] border-[#2d2d32]'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>1. Finanzas & Cobros</span>
                    </button>

                    <button
                      onClick={() => { setAdminCondoTab('facturacion'); setIsNavOpen(false); }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2.5 border ${
                        adminCondoTab === 'facturacion'
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                          : 'bg-[#1E1E22] text-slate-300 hover:bg-[#25252B] border-[#2d2d32]'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>2. Facturación CFDI 4.0</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-[#2d2d32] space-y-3">
              <div className="p-3 bg-[#111114] border border-[#232326] rounded-xl text-[10px] space-y-1 text-slate-400 font-mono">
                <div className="flex justify-between">
                  <span>Estado SaaS:</span>
                  <span className="text-emerald-400 font-bold">100% Online</span>
                </div>
                <div className="flex justify-between">
                  <span>Versión:</span>
                  <span className="text-white font-bold">v2.4.0 SaaS</span>
                </div>
              </div>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Cerrar Sesión</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content View Container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden bg-[#0A0A0A]">
        
        {/* Workspace core wrapper */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto pb-24 md:pb-8 flex-1">
          
          {/* Success toast notification */}
          {successBannerMsg && (
            <div className="fixed bottom-20 md:bottom-6 right-6 z-[99999] bg-purple-600 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-purple-500 animate-bounce">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span>{successBannerMsg}</span>
            </div>
          )}

          {/* SECTION INICIO: 5 LARGE MINIMALIST ROLE CARDS */}
          {activeSubSection === 'inicio' && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div className="text-center pb-2">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                  <ShieldCheck className="w-7 h-7 text-purple-400" />
                  Roles de Acceso
                </h2>
              </div>

              {/* 5 LARGE ICON CARDS WITHOUT DESCRIPTIONS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">

                {/* 1. Super Administrador */}
                <div
                  onClick={() => setActiveSubSection('superadmin')}
                  className="group bg-[#141417] hover:bg-[#1A1A1F] border border-[#232326] hover:border-red-500/60 rounded-3xl p-6 transition-all duration-300 cursor-pointer shadow-xl hover:scale-[1.03] flex flex-col items-center justify-center text-center py-10"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/15 text-red-400 border border-red-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition shrink-0 shadow-lg shadow-red-500/10">
                    <Crown className="w-9 h-9 sm:w-10 sm:h-10 text-red-400" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white group-hover:text-red-400 transition">
                    1. Super Admin
                  </h3>
                </div>

                {/* 2. Admin Condominio */}
                <div
                  onClick={() => setActiveSubSection('admininmobiliaria')}
                  className="group bg-[#141417] hover:bg-[#1A1A1F] border border-[#232326] hover:border-purple-500/60 rounded-3xl p-6 transition-all duration-300 cursor-pointer shadow-xl hover:scale-[1.03] flex flex-col items-center justify-center text-center py-10"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition shrink-0 shadow-lg shadow-purple-500/10">
                    <Building2 className="w-9 h-9 sm:w-10 sm:h-10 text-purple-400" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white group-hover:text-purple-400 transition">
                    2. Admin Condominio
                  </h3>
                </div>

                {/* 3. Comité Vigilancia */}
                <div
                  onClick={() => setActiveSubSection('comite')}
                  className="group bg-[#141417] hover:bg-[#1A1A1F] border border-[#232326] hover:border-amber-500/60 rounded-3xl p-6 transition-all duration-300 cursor-pointer shadow-xl hover:scale-[1.03] flex flex-col items-center justify-center text-center py-10"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition shrink-0 shadow-lg shadow-amber-500/10">
                    <UserCheck className="w-9 h-9 sm:w-10 sm:h-10 text-amber-400" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white group-hover:text-amber-400 transition">
                    3. Comité Vigilancia
                  </h3>
                </div>

                {/* 4. Residente (App/PWA) */}
                <div
                  onClick={() => setActiveSubSection('residente')}
                  className="group bg-[#141417] hover:bg-[#1A1A1F] border border-[#232326] hover:border-blue-500/60 rounded-3xl p-6 transition-all duration-300 cursor-pointer shadow-xl hover:scale-[1.03] flex flex-col items-center justify-center text-center py-10"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition shrink-0 shadow-lg shadow-blue-500/10">
                    <Smartphone className="w-9 h-9 sm:w-10 sm:h-10 text-blue-400" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white group-hover:text-blue-400 transition">
                    4. Residente (PWA)
                  </h3>
                </div>

                {/* 5. Guardia / Conserje */}
                <div
                  onClick={() => setActiveSubSection('guardia')}
                  className="group bg-[#141417] hover:bg-[#1A1A1F] border border-[#232326] hover:border-emerald-500/60 rounded-3xl p-6 transition-all duration-300 cursor-pointer shadow-xl hover:scale-[1.03] flex flex-col items-center justify-center text-center py-10 col-span-2 sm:col-span-1"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition shrink-0 shadow-lg shadow-emerald-500/10">
                    <BadgeCheck className="w-9 h-9 sm:w-10 sm:h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white group-hover:text-emerald-400 transition">
                    5. Guardia / Conserje
                  </h3>
                </div>

              </div>
            </div>
          )}

          {/* 1. ROL: SUPER ADMINISTRADOR (SaaS Owner) */}
          {activeSubSection === 'superadmin' && (
            <div className="space-y-6 animate-fade-in font-sans">
              
              {/* Top Active Role Banner */}
              <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between text-left gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0 shadow-md shadow-red-500/10">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">1. Rol: Super Administrador (SaaS Owner)</h3>
                    <p className="text-xs text-red-300 font-mono">Gestión global del negocio: Monetización, soporte y analítica global.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveSubSection('inicio')} 
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold rounded-xl border border-red-500/30 transition cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  Cambiar Rol ←
                </button>
              </div>

              {/* Main Cabinet Workspace (Full Width) */}
              <div className="space-y-6">

                {/* MÓDULO 1: GESTIÓN DE CLIENTES (CONDOMINIOS / INMOBILIARIAS) */}
                  {superAdminTab === 'clientes' && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Section Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2d2d32] pb-4">
                        <div>
                          <h3 className="text-base font-black text-white flex items-center gap-2">
                            <Building className="w-5 h-5 text-purple-400" />
                            Módulo de Gestión de Clientes (Condominios/Inmobiliarias)
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Alta, baja y suspensión de administraciones contratantes, asignación de planes y límites de uso.
                          </p>
                        </div>
                        <button
                          onClick={handleOpenCreateClient}
                          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20 shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Alta de Condominio</span>
                        </button>
                      </div>

                      {/* Header metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">Clientes Totales</p>
                            <p className="text-xl font-black text-white mt-1">{clientes.length}</p>
                            <span className="text-[10px] text-slate-400">Condominios registrados</span>
                          </div>
                          <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
                            <Building className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest font-mono">Clientes Activos</p>
                            <p className="text-xl font-black text-emerald-400 mt-1">
                              {clientes.filter(c => c.status === 'activo').length}
                            </p>
                            <span className="text-[10px] text-slate-400">Suscripciones vigentes</span>
                          </div>
                          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                            <Check className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-extrabold text-amber-500 uppercase tracking-widest font-mono">Suspendidos</p>
                            <p className="text-xl font-black text-amber-400 mt-1">
                              {clientes.filter(c => c.status === 'suspendido').length}
                            </p>
                            <span className="text-[10px] text-slate-400">Servicio pausado</span>
                          </div>
                          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-extrabold text-purple-400 uppercase tracking-widest font-mono">Recaudación Mensual</p>
                            <p className="text-xl font-black text-white mt-1">
                              ${clientes.reduce((acc, c) => {
                                if (c.status === 'suspendido') return acc;
                                const val = c.plan === 'Básico' ? 1500 : c.plan === 'Premium' ? 3500 : 8000;
                                return acc + val;
                              }, 0).toLocaleString('es-MX')}.00
                            </p>
                            <span className="text-[10px] text-purple-400">Pesos MXN / Mes</span>
                          </div>
                          <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Actions & Filters Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141417] border border-[#232326] p-4 rounded-2xl">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Buscar condominio o administrador..."
                            value={searchClientQuery}
                            onChange={(e) => setSearchClientQuery(e.target.value)}
                            className="w-full bg-[#1E1E22] border border-[#2d2d32] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-500"
                          />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5 text-slate-500" />
                            <select
                              value={filterClientPlan}
                              onChange={(e) => setFilterClientPlan(e.target.value as any)}
                              className="bg-[#1E1E22] border border-[#2d2d32] rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-purple-500"
                            >
                              <option value="todos">Todos los Planes</option>
                              <option value="Básico">Plan Básico</option>
                              <option value="Premium">Plan Premium</option>
                              <option value="Enterprise">Plan Enterprise</option>
                            </select>

                            <select
                              value={filterClientStatus}
                              onChange={(e) => setFilterClientStatus(e.target.value as any)}
                              className="bg-[#1E1E22] border border-[#2d2d32] rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-purple-500"
                            >
                              <option value="todos">Todos los Status</option>
                              <option value="activo">Activos</option>
                              <option value="suspendido">Suspendidos</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Clients Cards Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {clientes
                          .filter(c => {
                            const matchQuery = c.nombre.toLowerCase().includes(searchClientQuery.toLowerCase()) || 
                                               c.administrador.toLowerCase().includes(searchClientQuery.toLowerCase());
                            const matchPlan = filterClientPlan === 'todos' || c.plan === filterClientPlan;
                            const matchStatus = filterClientStatus === 'todos' || c.status === filterClientStatus;
                            return matchQuery && matchPlan && matchStatus;
                          })
                          .map(c => {
                            const pctDep = Math.round((c.usoDepartamentos / c.limiteDepartamentos) * 100);
                            const pctUsr = Math.round((c.usoUsuarios / c.limiteUsuarios) * 100);
                            const pctAlm = Math.round((c.usoAlmacenamiento / c.limiteAlmacenamiento) * 100);

                            return (
                              <div 
                                key={c.id} 
                                className={`bg-[#1E1E22] border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                                  c.status === 'suspendido' 
                                    ? 'border-amber-500/30 opacity-80' 
                                    : 'border-[#2d2d32] hover:border-purple-500/30'
                                }`}
                              >
                                {/* Card Header */}
                                <div className="p-5 border-b border-[#2d2d32] bg-gradient-to-r from-[#1F1F23] to-[#1E1E22] flex items-start justify-between gap-3">
                                  <div className="text-left">
                                    <h3 className="text-sm font-black text-white">{c.nombre}</h3>
                                    <span className="text-[10px] text-slate-500 font-mono">ID: {c.id} • Registrado: {c.fechaRegistro}</span>
                                  </div>
                                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                      c.plan === 'Básico' 
                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                        : c.plan === 'Premium' 
                                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    }`}>
                                      Plan {c.plan}
                                    </span>

                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide ${
                                      c.status === 'activo' 
                                        ? 'bg-emerald-500/10 text-emerald-400' 
                                        : 'bg-amber-500/10 text-amber-400 animate-pulse'
                                    }`}>
                                      {c.status === 'activo' ? '● Activo' : '⚠ Suspendido'}
                                    </span>
                                  </div>
                                </div>

                                {/* Card Details */}
                                <div className="p-5 space-y-4 flex-1">
                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="text-left">
                                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Administrador Contratante</span>
                                      <p className="font-semibold text-slate-200 mt-0.5">{c.administrador}</p>
                                    </div>
                                    <div className="text-left">
                                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Contacto</span>
                                      <p className="font-semibold text-slate-300 mt-0.5 truncate" title={c.correo}>{c.correo}</p>
                                      <p className="text-[10px] text-slate-400 mt-0.5">{c.telefono}</p>
                                    </div>
                                  </div>

                                  {/* Limits & Usage */}
                                  <div className="space-y-3 pt-3 border-t border-[#2d2d32]/50 font-sans text-xs">
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-400 font-bold flex items-center gap-1">🏢 Departamentos</span>
                                        <span className="text-slate-300 font-mono font-semibold">
                                          {c.usoDepartamentos} / <strong className="text-white">{c.limiteDepartamentos}</strong> ({pctDep}%)
                                        </span>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-500 ${
                                            pctDep > 90 ? 'bg-rose-500' : pctDep > 75 ? 'bg-amber-500' : 'bg-purple-500'
                                          }`}
                                          style={{ width: `${Math.min(pctDep, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-400 font-bold flex items-center gap-1">👥 Usuarios del Sistema</span>
                                        <span className="text-slate-300 font-mono font-semibold">
                                          {c.usoUsuarios} / <strong className="text-white">{c.limiteUsuarios}</strong> ({pctUsr}%)
                                        </span>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-500 ${
                                            pctUsr > 90 ? 'bg-rose-500' : pctUsr > 75 ? 'bg-amber-500' : 'bg-purple-500'
                                          }`}
                                          style={{ width: `${Math.min(pctUsr, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-400 font-bold flex items-center gap-1">💾 Almacenamiento Cloud</span>
                                        <span className="text-slate-300 font-mono font-semibold">
                                          {c.usoAlmacenamiento.toFixed(1)} GB / <strong className="text-white">{c.limiteAlmacenamiento} GB</strong> ({pctAlm}%)
                                        </span>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-500 ${
                                            pctAlm > 90 ? 'bg-rose-500' : pctAlm > 75 ? 'bg-amber-500' : 'bg-purple-500'
                                          }`}
                                          style={{ width: `${Math.min(pctAlm, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="p-4 bg-[#17171A] border-t border-[#2d2d32] flex gap-2">
                                  <button
                                    onClick={() => handleOpenEditClient(c)}
                                    className="flex-1 py-2 bg-[#25252B] hover:bg-[#2C2C34] text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700/35 transition cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Editar Plan & Límites</span>
                                  </button>

                                  <button
                                    onClick={() => handleToggleSuspendClient(c.id)}
                                    className={`px-3 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center border ${
                                      c.status === 'activo'
                                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'
                                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                    }`}
                                    title={c.status === 'activo' ? 'Suspender suscripción' : 'Reactivar suscripción'}
                                  >
                                    {c.status === 'activo' ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
                                    <span className="ml-1 md:inline hidden">{c.status === 'activo' ? 'Suspender' : 'Activar'}</span>
                                  </button>

                                  <button
                                    onClick={() => handleBajaClient(c.id, c.nombre)}
                                    className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-500 hover:text-rose-400 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center"
                                    title="Dar de baja permanente (Eliminar)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                        {clientes.length === 0 && (
                          <div className="col-span-2 py-12 text-center bg-[#1E1E22] rounded-2xl border border-dashed border-[#2d2d32] text-slate-500 font-sans text-xs">
                            No se encontraron condominios o administraciones contratantes.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MÓDULO 2: FINANZAS GLOBALES & MÉTRICAS (MRR, CHURN RATE, PASARELA LICENCIAS) */}
                  {superAdminTab === 'finanzas' && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2d2d32] pb-4">
                        <div>
                          <h3 className="text-base font-black text-white flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                            Módulo de Finanzas Globales & Métricas SaaS
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Dashboard de Ingresos Recurrentes (MRR), Churn Rate y Pasarela para cobro automático de licencias software.
                          </p>
                        </div>
                        <button
                          onClick={handleRunAllCobrosSaaS}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 shrink-0"
                        >
                          <RefreshCcw className="w-4 h-4 animate-spin-slow" />
                          <span>Ejecutar Cobro Automático Global</span>
                        </button>
                      </div>

                      {/* SaaS Financial KPIs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* MRR */}
                        <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">Ingresos Mensuales MRR</p>
                            <p className="text-xl font-black text-emerald-400 mt-1">
                              ${clientes.reduce((acc, c) => {
                                if (c.status === 'suspendido') return acc;
                                return acc + (c.plan === 'Básico' ? 1500 : c.plan === 'Premium' ? 3500 : 8000);
                              }, 0).toLocaleString('es-MX')}.00
                            </p>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <TrendingUp className="w-3 h-3 text-emerald-400" /> +12% respecto al mes anterior
                            </span>
                          </div>
                          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                          </div>
                        </div>

                        {/* ARR */}
                        <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">Proyección Anual ARR</p>
                            <p className="text-xl font-black text-white mt-1">
                              ${(clientes.reduce((acc, c) => {
                                if (c.status === 'suspendido') return acc;
                                return acc + (c.plan === 'Básico' ? 1500 : c.plan === 'Premium' ? 3500 : 8000);
                              }, 0) * 12).toLocaleString('es-MX')}.00
                            </p>
                            <span className="text-[10px] text-purple-300">Run-rate anualizado</span>
                          </div>
                          <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                        </div>

                        {/* Churn Rate */}
                        <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">Churn Rate (Bajas)</p>
                            <p className="text-xl font-black text-amber-400 mt-1">
                              {((clientes.filter(c => c.status === 'suspendido').length / Math.max(clientes.length, 1)) * 100).toFixed(1)}%
                            </p>
                            <span className="text-[10px] text-amber-400/80">
                              {clientes.filter(c => c.status === 'suspendido').length} cliente(s) suspendido(s)
                            </span>
                          </div>
                          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                        </div>

                        {/* ARPU */}
                        <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">ARPU (Prom. por Cliente)</p>
                            <p className="text-xl font-black text-white mt-1">
                              ${Math.round(clientes.reduce((acc, c) => {
                                if (c.status === 'suspendido') return acc;
                                return acc + (c.plan === 'Básico' ? 1500 : c.plan === 'Premium' ? 3500 : 8000);
                              }, 0) / Math.max(clientes.filter(c => c.status === 'activo').length, 1)).toLocaleString('es-MX')}.00
                            </p>
                            <span className="text-[10px] text-slate-400">Promedio Ticket Mensual</span>
                          </div>
                          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Revenue breakdown by plan */}
                      <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">Distribución de Facturación por Plan de Suscripción</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-4 bg-[#141417] border border-[#232326] rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Plan Básico ($1,500/mes)</span>
                              <p className="text-lg font-black text-white mt-1">
                                {clientes.filter(c => c.plan === 'Básico').length} Condominios
                              </p>
                              <span className="text-[10px] text-slate-400">
                                Total: ${(clientes.filter(c => c.plan === 'Básico' && c.status === 'activo').length * 1500).toLocaleString('es-MX')}.00 MXN
                              </span>
                            </div>
                            <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                              Básico
                            </span>
                          </div>

                          <div className="p-4 bg-[#141417] border border-[#232326] rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Plan Premium ($3,500/mes)</span>
                              <p className="text-lg font-black text-white mt-1">
                                {clientes.filter(c => c.plan === 'Premium').length} Condominios
                              </p>
                              <span className="text-[10px] text-slate-400">
                                Total: ${(clientes.filter(c => c.plan === 'Premium' && c.status === 'activo').length * 3500).toLocaleString('es-MX')}.00 MXN
                              </span>
                            </div>
                            <span className="text-xs font-black text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                              Premium
                            </span>
                          </div>

                          <div className="p-4 bg-[#141417] border border-[#232326] rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Plan Enterprise ($8,000/mes)</span>
                              <p className="text-lg font-black text-white mt-1">
                                {clientes.filter(c => c.plan === 'Enterprise').length} Condominios
                              </p>
                              <span className="text-[10px] text-slate-400">
                                Total: ${(clientes.filter(c => c.plan === 'Enterprise' && c.status === 'activo').length * 8000).toLocaleString('es-MX')}.00 MXN
                              </span>
                            </div>
                            <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                              Enterprise
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pasarela para Cobro Automático de la Licencia del Software */}
                      <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2d2d32] pb-3">
                          <div>
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-emerald-400" />
                              Pasarela de Cobro Automático de Licencias a Administradores
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Gestión de domiciliaciones bancarias y cobro automático mensual recurrente por el uso de la plataforma.
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
                            Pasarela Activa • Stripe / CABA API
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-[#141417] text-slate-400 uppercase text-[9px] font-mono tracking-wider border-b border-[#2d2d32]">
                              <tr>
                                <th className="p-3">Condominio Cliente</th>
                                <th className="p-3">Administrador</th>
                                <th className="p-3">Plan</th>
                                <th className="p-3">Monto Licencia</th>
                                <th className="p-3">Fecha Cobro</th>
                                <th className="p-3">Método Domiciliado</th>
                                <th className="p-3">Status Cobro</th>
                                <th className="p-3 text-center">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2d2d32]/50 font-sans">
                              {cobrosSaaS.map(cobro => (
                                <tr key={cobro.id} className="hover:bg-[#25252B] transition">
                                  <td className="p-3 font-bold text-white">{cobro.condoNombre}</td>
                                  <td className="p-3 text-slate-300">{cobro.adminNombre}</td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                      {cobro.plan}
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono font-bold text-emerald-400">${cobro.monto.toLocaleString('es-MX')}.00 MXN</td>
                                  <td className="p-3 font-mono text-slate-400">{cobro.fechaCobro}</td>
                                  <td className="p-3 text-slate-300 text-[11px]">{cobro.metodoPago}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                      cobro.status === 'cobrado'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : cobro.status === 'pendiente'
                                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                                    }`}>
                                      {cobro.status === 'cobrado' ? '✓ Cobrado Auto' : cobro.status === 'pendiente' ? 'Pendiente' : '⚠ Fallido (Rechazado)'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    {cobro.status === 'fallido' ? (
                                      <button
                                        onClick={() => handleRetryCobroSaaS(cobro.id)}
                                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1 mx-auto"
                                        title="Reintentar cobro automático y reactivar servicio"
                                      >
                                        <RefreshCw className="w-3 h-3" />
                                        <span>Reintentar Cobro</span>
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-500 font-mono">Al corriente</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MÓDULO 3: SOPORTE Y LOGS DE AUDITORÍA */}
                  {superAdminTab === 'soporte' && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Section Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2d2d32] pb-4">
                        <div>
                          <h3 className="text-base font-black text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-400" />
                            Módulo de Soporte y Logs de Auditoría
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Atención a Administradores de Condominios y monitoreo de errores, accesos y acciones críticas del sistema.
                          </p>
                        </div>
                      </div>

                      {/* 1. Sistema de Tickets Interno */}
                      <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2d2d32] pb-3">
                          <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                            <LifeBuoy className="w-4 h-4 text-blue-400" />
                            1. Sistema de Tickets Interno (Atención a Administradores de Condominios)
                          </h4>
                          <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-3 py-0.5 rounded-full border border-blue-500/20">
                            {internalTickets.filter(t => t.status !== 'resuelto').length} Ticket(s) Activos
                          </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Tickets list */}
                          <div className="space-y-3">
                            {internalTickets.map(tkt => (
                              <div
                                key={tkt.id}
                                onClick={() => setSelectedTicketForReply(tkt)}
                                className={`p-4 rounded-xl border transition cursor-pointer text-left ${
                                  selectedTicketForReply?.id === tkt.id
                                    ? 'bg-[#25252D] border-blue-500'
                                    : 'bg-[#141417] border-[#232326] hover:border-slate-600'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 font-mono">{tkt.condoNombre} • {tkt.adminNombre}</span>
                                    <h5 className="text-xs font-black text-white mt-0.5">{tkt.asunto}</h5>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                    tkt.status === 'abierto'
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                      : tkt.status === 'en_progreso'
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                    {tkt.status.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400 font-mono">
                                  <span>Categoría: <strong>{tkt.categoria}</strong></span>
                                  <span>Fecha: {tkt.fecha}</span>
                                  <span>Mensajes: {tkt.mensajes.length}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Ticket Detail / Reply Panel */}
                          <div className="bg-[#141417] border border-[#232326] rounded-xl p-4 flex flex-col justify-between min-h-[300px]">
                            {selectedTicketForReply ? (
                              <div className="flex flex-col h-full justify-between space-y-4">
                                <div className="space-y-3">
                                  <div className="border-b border-[#232326] pb-2">
                                    <span className="text-[10px] font-bold text-blue-400 uppercase font-mono">{selectedTicketForReply.categoria}</span>
                                    <h5 className="text-xs font-black text-white mt-0.5">{selectedTicketForReply.asunto}</h5>
                                    <span className="text-[10px] text-slate-400 font-mono">Solicitante: {selectedTicketForReply.adminNombre} ({selectedTicketForReply.condoNombre})</span>
                                  </div>

                                  {/* Message thread */}
                                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                                    {selectedTicketForReply.mensajes.map((m, idx) => (
                                      <div 
                                        key={idx}
                                        className={`p-2.5 rounded-xl text-xs ${
                                          m.autor.includes('SuperAdmin')
                                            ? 'bg-purple-900/30 border border-purple-500/30 text-purple-100 ml-4'
                                            : 'bg-[#1E1E22] border border-[#2d2d32] text-slate-200 mr-4'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-400 mb-1">
                                          <span>{m.autor}</span>
                                          <span className="font-mono">{m.hora}</span>
                                        </div>
                                        <p className="text-xs leading-relaxed">{m.texto}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Reply form */}
                                <form onSubmit={handleReplySupportTicket} className="flex gap-2 pt-2 border-t border-[#232326]">
                                  <input
                                    type="text"
                                    placeholder="Escribir respuesta de soporte técnico..."
                                    value={ticketReplyText}
                                    onChange={(e) => setTicketReplyText(e.target.value)}
                                    className="flex-1 bg-[#1E1E22] border border-[#2d2d32] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                                  />
                                  <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Responder</span>
                                  </button>
                                </form>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500 font-sans text-xs">
                                <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
                                <p>Seleccione un ticket de la lista para ver el historial y responder al Administrador.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. Historial de Logs del Sistema (Monitoreo de Errores y Acciones Críticas) */}
                      <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2d2d32] pb-3">
                          <div>
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                              <Terminal className="w-4 h-4 text-emerald-400" />
                              2. Historial de Logs del Sistema (Monitoreo de Errores, Accesos y Acciones Críticas)
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Bitácora en tiempo real de auditoría de eventos de seguridad y diagnósticos técnicos SaaS.
                            </p>
                          </div>

                          {/* Filter & Search */}
                          <div className="flex items-center gap-2">
                            <select
                              value={auditFilterLevel}
                              onChange={(e) => setAuditFilterLevel(e.target.value as any)}
                              className="bg-[#141417] border border-[#2d2d32] rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                            >
                              <option value="todos">Todos los Niveles</option>
                              <option value="info">Info</option>
                              <option value="warning">Warning</option>
                              <option value="error">Error</option>
                              <option value="critico">Crítico</option>
                            </select>

                            <input
                              type="text"
                              placeholder="Filtrar por evento o IP..."
                              value={auditSearchQuery}
                              onChange={(e) => setAuditSearchQuery(e.target.value)}
                              className="bg-[#141417] border border-[#2d2d32] rounded-xl px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>

                        {/* Audit Logs Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs font-mono">
                            <thead className="bg-[#141417] text-slate-400 uppercase text-[9px] tracking-wider border-b border-[#2d2d32]">
                              <tr>
                                <th className="p-3">Timestamp</th>
                                <th className="p-3">Nivel</th>
                                <th className="p-3">Usuario</th>
                                <th className="p-3">Condominio / Contexto</th>
                                <th className="p-3">Acción / Descripción de Evento</th>
                                <th className="p-3">Dirección IP</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2d2d32]/50 text-slate-300">
                              {auditLogs
                                .filter(log => {
                                  const matchLevel = auditFilterLevel === 'todos' || log.nivel === auditFilterLevel;
                                  const matchSearch = log.accion.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                                                      log.usuario.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                                                      log.ip.includes(auditSearchQuery);
                                  return matchLevel && matchSearch;
                                })
                                .map(log => (
                                  <tr key={log.id} className="hover:bg-[#25252B] transition">
                                    <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                                    <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                        log.nivel === 'info'
                                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                          : log.nivel === 'warning'
                                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            : log.nivel === 'error'
                                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                              : 'bg-red-600/20 text-red-400 border border-red-500/40 animate-pulse'
                                      }`}>
                                        {log.nivel}
                                      </span>
                                    </td>
                                    <td className="p-3 text-slate-200 font-semibold">{log.usuario}</td>
                                    <td className="p-3 text-purple-300">{log.condominio}</td>
                                    <td className="p-3 text-slate-300 font-sans">{log.accion}</td>
                                    <td className="p-3 text-slate-500">{log.ip}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
            </div>
          )}

        {/* 2. ROL: ADMINISTRADOR DEL CONDOMINIO / INMOBILIARIA */}
        {activeSubSection === 'admininmobiliaria' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-purple-500/10 border border-purple-500/25 rounded-2xl flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Rol Activo: 2. Administrador del Condominio / Inmobiliaria</h3>
                  <p className="text-xs text-purple-300 font-mono">Finanzas, Cobro de Cuotas de Mantenimiento & Control de Morosidad (Módulo Facturación CFDI 4.0 Desactivado Temporalmente)</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveSubSection('inicio')} 
                className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold rounded-xl border border-purple-500/30 transition cursor-pointer shrink-0"
              >
                Cambiar Rol ←
              </button>
            </div>

            {/* Sub-tabs inside Admin Condominio */}
            <div className="flex flex-wrap gap-2 border-b border-[#2d2d32] pb-3">
              <button
                onClick={() => setAdminCondoTab('comunidad')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  adminCondoTab === 'comunidad'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-[#1E1E22] text-slate-400 hover:text-white border border-[#2d2d32]'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>1. Comunidad & Propiedades</span>
              </button>
              <button
                onClick={() => setAdminCondoTab('finanzas')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  adminCondoTab === 'finanzas'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-[#1E1E22] text-slate-400 hover:text-white border border-[#2d2d32]'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>2. Finanzas & Cobranza</span>
              </button>
              <button
                onClick={() => setAdminCondoTab('facturacion')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  adminCondoTab === 'facturacion'
                    ? 'bg-purple-900/60 text-purple-200 border border-purple-500/50 shadow-lg'
                    : 'bg-[#1E1E22] text-slate-500 hover:text-slate-300 border border-[#2d2d32]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Facturación CFDI 4.0</span>
                <span className="px-1.5 py-0.5 text-[8px] bg-amber-500/20 text-amber-300 font-extrabold uppercase rounded border border-amber-500/30">Desactivado</span>
              </button>
              <button
                onClick={() => setAdminCondoTab('operacion')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  adminCondoTab === 'operacion'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-[#1E1E22] text-slate-400 hover:text-white border border-[#2d2d32]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>4. Operación & Amenidades</span>
              </button>
              <button
                onClick={() => setAdminCondoTab('comunicacion')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  adminCondoTab === 'comunicacion'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-[#1E1E22] text-slate-400 hover:text-white border border-[#2d2d32]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>5. Comunicación & Votaciones</span>
              </button>
            </div>

            {/* TAB 1: COMUNIDAD Y PROPIEDADES INSIDE ADMIN CONDOMINIO */}
            {adminCondoTab === 'comunidad' && (
              <div className="space-y-6 animate-fade-in text-left">
                {/* 1. Estructura Inmobiliaria */}
                <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2d2d32] pb-3">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-400" />
                        1. Estructura Inmobiliaria (Torres, Manzanas, Lotes, Departamentos)
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Define y gestiona la distribución física del condominio o fraccionamiento.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <form onSubmit={handleAddEstructura} className="bg-[#141417] border border-[#232326] p-4 rounded-xl space-y-3 font-sans text-xs">
                      <h5 className="font-bold text-white text-xs border-b border-[#232326] pb-2">+ Alta de Estructura</h5>
                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Tipo de Estructura</label>
                        <select
                          value={newEstTipo}
                          onChange={(e) => setNewEstTipo(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 bg-[#1E1E22] border border-[#2d2d32] rounded-xl text-white"
                        >
                          <option value="Torre">Torre de Departamentos</option>
                          <option value="Manzana">Manzana</option>
                          <option value="Lote">Lote / Privada</option>
                          <option value="Cluster">Cluster Residencial</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Nombre / Identificador</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Torre C - Lomas"
                          value={newEstNombre}
                          onChange={(e) => setNewEstNombre(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#1E1E22] border border-[#2d2d32] rounded-xl text-white placeholder:text-slate-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Cant. Unidades</label>
                          <input
                            type="number"
                            required
                            value={newEstCount}
                            onChange={(e) => setNewEstCount(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-[#1E1E22] border border-[#2d2d32] rounded-xl text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Rango / Detalle</label>
                          <input
                            type="text"
                            placeholder="Deptos 101-404"
                            value={newEstDetalle}
                            onChange={(e) => setNewEstDetalle(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-[#1E1E22] border border-[#2d2d32] rounded-xl text-white"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Registrar Estructura
                      </button>
                    </form>

                    <div className="lg:col-span-2 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {estructuras.map(e => (
                          <div key={e.id} className="p-3.5 bg-[#141417] border border-[#232326] rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-bold bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-md uppercase">{e.tipo}</span>
                              <span className="text-[9px] text-emerald-400 font-mono font-bold">✓ Activo</span>
                            </div>
                            <h5 className="text-xs font-black text-white">{e.nombre}</h5>
                            <p className="text-[10px] text-slate-400 font-mono">Capacidad: <strong>{e.unidadesCount} Unidades</strong> ({e.unidadesDetalle})</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Catálogo de Residentes */}
                <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2d2d32] pb-3">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        2. Catálogo de Residentes (Propietarios e Inquilinos)
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Vincule condóminos a sus unidades asignadas y controle su estado de acceso.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <form onSubmit={handleAddResidentCat} className="bg-[#141417] border border-[#232326] p-4 rounded-xl space-y-3 font-sans text-xs">
                      <h5 className="font-bold text-white text-xs border-b border-[#232326] pb-2">+ Vincular Residente</h5>
                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Dra. Patricia Alarcón"
                          value={newResNombre}
                          onChange={(e) => setNewResNombre(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#1E1E22] border border-[#2d2d32] rounded-xl text-white placeholder:text-slate-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Unidad / Depto</label>
                          <input
                            type="text"
                            required
                            placeholder="Torre B - 302"
                            value={newResUnidad}
                            onChange={(e) => setNewResUnidad(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-[#1E1E22] border border-[#2d2d32] rounded-xl text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Tipo Residente</label>
                          <select
                            value={newResTipo}
                            onChange={(e) => setNewResTipo(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 bg-[#1E1E22] border border-[#2d2d32] rounded-xl text-white"
                          >
                            <option value="propietario">Propietario</option>
                            <option value="inquilino">Inquilino</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Correo Electrónico</label>
                        <input
                          type="email"
                          placeholder="residente@mail.com"
                          value={newResCorreo}
                          onChange={(e) => setNewResCorreo(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#1E1E22] border border-[#2d2d32] rounded-xl text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Teléfono Móvil</label>
                        <input
                          type="text"
                          placeholder="+52 5500000000"
                          value={newResTel}
                          onChange={(e) => setNewResTel(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#1E1E22] border border-[#2d2d32] rounded-xl text-white font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Vincular Residente
                      </button>
                    </form>

                    <div className="lg:col-span-2 overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-[#141417] text-slate-400 uppercase text-[9px] tracking-wider border-b border-[#2d2d32]">
                          <tr>
                            <th className="p-3">Residente</th>
                            <th className="p-3">Unidad Asignada</th>
                            <th className="p-3">Tipo</th>
                            <th className="p-3">Contacto</th>
                            <th className="p-3">Estatus Mantenimiento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2d2d32]/50 text-slate-300">
                          {residentesCat.map(r => (
                            <tr key={r.id} className="hover:bg-[#141417]/50">
                              <td className="p-3 font-bold text-white">{r.nombre}</td>
                              <td className="p-3 font-mono text-purple-300">{r.unidad}</td>
                              <td className="p-3 uppercase text-[10px] font-semibold text-slate-400">{r.tipoResidente}</td>
                              <td className="p-3 font-mono text-[10px] text-slate-400">{r.telefono}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase ${
                                  r.status === 'activo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {r.status === 'activo' ? '✓ Al día' : '⚠ Moroso'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 3. Gestión de Personal Interno */}
                <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2d2d32] pb-3">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        3. Personal Interno (Guardias, Mantenimiento, Limpieza, Conserje)
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Control de perfiles operativos, turnos de caseta y servicios comunitarios.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <form onSubmit={handleAddPersonal} className="bg-[#141417] border border-[#232326] p-4 rounded-xl space-y-3 font-sans text-xs">
                      <h5 className="font-bold text-white text-xs border-b border-[#232326] pb-2">+ Alta de Perfil Operativo</h5>
                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Carlos Martínez"
                          value={newPerNombre}
                          onChange={(e) => setNewPerNombre(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#1E1E22] border border-[#2d2d32] rounded-xl text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Rol Operativo</label>
                          <select
                            value={newPerRol}
                            onChange={(e) => setNewPerRol(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 bg-[#1E1E22] border border-[#2d2d32] rounded-xl text-white"
                          >
                            <option value="Guardia">Guardia de Caseta</option>
                            <option value="Mantenimiento">Técnico Mantenimiento</option>
                            <option value="Limpieza">Personal de Limpieza</option>
                            <option value="Conserje">Conserje / Jardinero</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Turno Asignado</label>
                          <select
                            value={newPerTurno}
                            onChange={(e) => setNewPerTurno(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 bg-[#1E1E22] border border-[#2d2d32] rounded-xl text-white"
                          >
                            <option value="Matutino">Matutino (7am - 3pm)</option>
                            <option value="Vespertino">Vespertino (3pm - 11pm)</option>
                            <option value="Nocturno">Nocturno (11pm - 7am)</option>
                            <option value="24x24">24x24 Horas</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Teléfono Móvil</label>
                        <input
                          type="text"
                          placeholder="+52 5500000000"
                          value={newPerTel}
                          onChange={(e) => setNewPerTel(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#1E1E22] border border-[#2d2d32] rounded-xl text-white font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Registrar Personal
                      </button>
                    </form>

                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {personalInterno.map(p => (
                        <div key={p.id} className="p-3.5 bg-[#141417] border border-[#232326] rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-md uppercase">{p.rol}</span>
                            <span className="text-[9px] text-emerald-400 font-mono font-bold">✓ Activo</span>
                          </div>
                          <h5 className="text-xs font-black text-white">{p.nombre}</h5>
                          <p className="text-[10px] text-slate-400 font-mono">Turno: <strong>{p.turno}</strong> | Tel: {p.telefono}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {adminCondoTab === 'finanzas' && (
              <div className="space-y-6">
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

        {/* SECTION 2: ACCESOS Y SEGURIDAD (Desactivado/Independizado de CNLS) */}
        {false && (
          <div className="hidden">
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

          {/* TAB 2: FACTURACIÓN CFDI 4.0 INSIDE ADMIN CONDOMINIO */}
          {adminCondoTab === 'facturacion' && (
            <div className="space-y-6 animate-fade-in text-left relative">
              {/* Deactivation Banner */}
              <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 flex items-start gap-4 text-amber-300">
                <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black uppercase text-amber-200">Módulo Facturación CFDI 4.0 Desactivado Temporalmente</h4>
                    <span className="px-2 py-0.5 text-[9px] bg-amber-500/30 text-amber-200 font-extrabold uppercase rounded-full border border-amber-400/40 font-mono">Inactivo</span>
                  </div>
                  <p className="text-xs text-amber-300/90 leading-relaxed font-sans">
                    El servicio de timbrado fiscal directo ante el SAT y emisión automatizada de comprobantes CFDI 4.0 se encuentra desactivado temporalmente para todos los roles vinculados a la administración de condominios. Las cobranzas, recibos internos de pago y control de finanzas continúan operando normalmente.
                  </p>
                </div>
              </div>

              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-3 opacity-60 pointer-events-none">
                <div className="flex items-center gap-2 text-purple-400">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-base font-black text-white">Configuración CFDI 4.0 SAT Directo (Pausado)</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Para timbrar facturas electrónicas válidas por cuotas de mantenimiento condominal de forma directa y automatizada, requiere configurar las credenciales del Emisor, dar de alta la constancia de situación fiscal del Receptor, y conectar con las API autorizadas por el SAT.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-60 pointer-events-none">
                
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

          {/* TAB 4: OPERACIÓN Y AMENIDADES INSIDE ADMIN CONDOMINIO */}
          {adminCondoTab === 'operacion' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2d2d32] pb-3">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      Gestión de Amenidades, Salones y Áreas Comunes
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Control de reglamentos, cuotas de apartado y disponibilidad de espacios.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#141417] border border-[#232326] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Salón de Eventos</span>
                      <span className="text-[9px] font-mono bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Cuota: $1,500</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Capacidad max: 80 personas. Horario: 09:00 - 23:00</p>
                    <div className="text-[9.5px] text-purple-300 font-mono">2 reservas agendadas este mes</div>
                  </div>

                  <div className="p-4 bg-[#141417] border border-[#232326] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Alberca & Terraza</span>
                      <span className="text-[9px] font-mono bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Cuota: $500</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Capacidad max: 30 personas. Mantto: Lunes matutino</p>
                    <div className="text-[9.5px] text-purple-300 font-mono">Disponible para condóminos al día</div>
                  </div>

                  <div className="p-4 bg-[#141417] border border-[#232326] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Cancha de Tenis</span>
                      <span className="text-[9px] font-mono bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full font-bold">Gratuito</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Reserva en bloques de 2 hrs. Iluminación nocturna.</p>
                    <div className="text-[9.5px] text-purple-300 font-mono">Sin cuota de limpieza</div>
                  </div>

                  <div className="p-4 bg-[#141417] border border-[#232326] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Asadores Jardín</span>
                      <span className="text-[9px] font-mono bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full font-bold">Gratuito</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Parrillas de carbón y pérgolas con sombra.</p>
                    <div className="text-[9.5px] text-purple-300 font-mono">4 módulos independientes</div>
                  </div>
                </div>
              </div>

              {/* Solicitudes de Mantenimiento / Órdenes de Trabajo */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#2d2d32] pb-3">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-purple-400" />
                      Órdenes de Trabajo & Mantenimiento Correctivo
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Atención e historial de tickets reportados por los residentes.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-[#141417] border border-[#232326] rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-md">#OT-402</span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-bold">En Proceso</span>
                    </div>
                    <h5 className="text-xs font-bold text-white">Falla en luminaria de estacionamiento subterráneo B2</h5>
                    <p className="text-[10px] text-slate-400">Reportado por: Residente Casa 102 | Asignado a: Mantenimiento Interno</p>
                  </div>

                  <div className="p-3.5 bg-[#141417] border border-[#232326] rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-md">#OT-401</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold">Completado ✓</span>
                    </div>
                    <h5 className="text-xs font-bold text-white">Ajuste de sensor en portón vehicular de acceso principal</h5>
                    <p className="text-[10px] text-slate-400">Reportado por: Caseta Guardia | Atendido por: Proveedor Automatismos</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COMUNICACIÓN Y VOTACIONES INSIDE ADMIN CONDOMINIO */}
          {adminCondoTab === 'comunicacion' && (
            <div className="space-y-6 animate-fade-in text-left">
              {/* Comunicados Oficiales */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div className="border-b border-[#2d2d32] pb-3">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    Publicación de Avisos & Comunicados Comunitarios
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Difunde notificaciones directas al pizarrón digital de los residentes.</p>
                </div>

                <form onSubmit={handleAddBulletin} className="space-y-3 font-sans text-xs">
                  <div>
                    <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Título del Aviso</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Cierre Temporal de Alberca por Mantenimiento Muestral"
                      value={newBulletinTitle}
                      onChange={(e) => setNewBulletinTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#141417] border border-[#232326] rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Contenido del Comunicado</label>
                    <textarea
                      required
                      placeholder="Escriba los detalles formales del aviso para la comunidad..."
                      value={newBulletinContent}
                      onChange={(e) => setNewBulletinContent(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#141417] border border-[#232326] rounded-xl text-white min-h-[60px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Publicar Comunicado
                  </button>
                </form>

                <div className="space-y-2 pt-2">
                  {bulletins.map(b => (
                    <div key={b.id} className="p-3 bg-[#141417] border border-[#232326] rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{b.title}</span>
                        <span className="text-[9px] font-mono text-purple-400">{b.date}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{b.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Encuestas y Votaciones de la Asamblea */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div className="border-b border-[#2d2d32] pb-3">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Vote className="w-4 h-4 text-purple-400" />
                    Encuestas & Votaciones de Asamblea Virtual
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Somete a votación formal proyectos y acuerdos de mantenimiento con los propietarios.</p>
                </div>

                <div className="space-y-3">
                  {encuestas.map(enc => (
                    <div key={enc.id} className="p-4 bg-[#141417] border border-[#232326] rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-white text-xs">{enc.titulo}</h5>
                        <span className="text-[9px] font-mono bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-md font-bold">Activa hasta {enc.fechaCierre}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{enc.descripcion}</p>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          onClick={() => handleVoteEncuesta(enc.id, 0)}
                          className="py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {enc.opciones[0]?.texto || 'A Favor'} ({enc.opciones[0]?.votos || 0})
                        </button>
                        <button
                          onClick={() => handleVoteEncuesta(enc.id, 1)}
                          className="py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {enc.opciones[1]?.texto || 'En Contra'} ({enc.opciones[1]?.votos || 0})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

          {/* 4. ROL: RESIDENTE / PROPIETARIO / INQUILINO (APP / PWA) */}
          {activeSubSection === 'residente' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="p-4 bg-blue-500/10 border border-blue-500/25 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Rol Activo: 4. Residente / Propietario / Inquilino (App / PWA)</h3>
                    <p className="text-xs text-blue-300 font-mono">Generación de Pases QR para Visitas, Reserva de Amenidades & Comunicados de la Comunidad</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveSubSection('inicio')} 
                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-bold rounded-xl border border-blue-500/30 transition cursor-pointer shrink-0"
                >
                  Cambiar Rol ←
                </button>
              </div>
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

          {/* 5. ROL: GUARDIA DE SEGURIDAD / CONSERJE */}
          {activeSubSection === 'guardia' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Rol Activo: 5. Guardia de Seguridad / Conserje</h3>
                    <p className="text-xs text-emerald-300 font-mono">Caseta de Acceso: Escáner QR de Visitas, Control de Paquetería & Bitácora de Novedades</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveSubSection('inicio')} 
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30 transition cursor-pointer shrink-0"
                >
                  Cambiar Rol ←
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* MODULE 1: ESCÁNER QR EN CASETA */}
                <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Control de Caseta</span>
                    <h3 className="text-base font-black text-white mt-1">Escáner Lector QR Visitas</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Valida el pase dinámico generado por el residente.</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 text-center space-y-3">
                    <div className="relative w-full h-36 bg-slate-900 rounded-xl border-2 border-dashed border-emerald-500/40 flex flex-col items-center justify-center overflow-hidden">
                      <QrCode className="w-12 h-12 text-emerald-400 animate-pulse" />
                      <p className="text-[10px] text-slate-400 font-mono mt-2">Coloque el pase QR frente al escáner</p>
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-400 animate-bounce" style={{ animationDuration: '2s' }} />
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={scannerInput}
                        onChange={(e) => setScannerInput(e.target.value)}
                        placeholder="O ingresa token (ej: QR-89421)"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono text-center uppercase"
                      />
                      <button
                        onClick={simulateQrScan}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Validar Acceso Instantáneo
                      </button>
                    </div>

                    {scanResult && (
                      <div className={`p-3 rounded-xl border text-[10px] leading-relaxed font-mono ${
                        scanResult.type === 'success'
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                      }`}>
                        {scanResult.msg}
                      </div>
                    )}
                  </div>
                </div>

                {/* MODULE 2: INTERFÓN DIGITAL */}
                <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest font-mono">Comunicación Directa</span>
                    <h3 className="text-base font-black text-white mt-1">Interfón Digital de Caseta</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Llamada de voz a departamento sin cables.</p>
                  </div>

                  <div className="space-y-3 font-sans text-xs">
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Buscar Departamento / Torre</label>
                      <input
                        type="text"
                        value={intercomTarget}
                        onChange={(e) => setIntercomTarget(e.target.value)}
                        placeholder="Ej. Torre A - Depto 402"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={triggerIntercomCall}
                        disabled={intercomState === 'calling' || intercomState === 'connected'}
                        className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <PhoneCall className="w-4 h-4" /> Timbrar
                      </button>
                      {intercomState !== 'idle' && (
                        <button
                          onClick={endIntercomCall}
                          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Colgar 📞
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-[9.5px] max-h-36 overflow-y-auto space-y-1">
                      <span className="text-slate-500 font-bold block border-b border-slate-850 pb-1">Bitácora de Interfón</span>
                      {intercomLogs.map((log, i) => (
                        <div key={i} className="text-slate-300">{log}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* MODULE 3: CONTROL DE PAQUETERÍA */}
                <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest font-mono">Recepcion de Envíos</span>
                    <h3 className="text-base font-black text-white mt-1">Control de Paquetería</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Registra la recepción de paquetes de Amazon, Mercado Libre, etc.</p>
                  </div>

                  <form onSubmit={handleRegisterParcel} className="space-y-3 font-sans text-xs">
                    <div>
                      <input
                        type="text"
                        required
                        value={parcelResident}
                        onChange={(e) => setParcelResident(e.target.value)}
                        placeholder="Residente / Depto (ej: Clicerio / A-402)"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={parcelCarrier}
                        onChange={(e) => setParcelCarrier(e.target.value)}
                        placeholder="Paquetera (Amazon/DHL)"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                      />
                      <input
                        type="text"
                        required
                        value={parcelTracking}
                        onChange={(e) => setParcelTracking(e.target.value)}
                        placeholder="# Guía o Tracking"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Package className="w-4 h-4" /> Registrar e Notificar
                    </button>
                  </form>

                  <div className="max-h-40 overflow-y-auto space-y-2 pt-1">
                    {parcels.map(p => (
                      <div key={p.id} className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between text-[10px]">
                        <div>
                          <p className="font-bold text-white">{p.carrier} - {p.residentName}</p>
                          <p className="text-slate-500 font-mono text-[9px]">Guía: {p.trackingNumber}</p>
                        </div>
                        {p.status === 'en_recepcion' ? (
                          <button
                            onClick={() => deliverParcel(p.id)}
                            className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 font-bold text-[9px] rounded-lg transition cursor-pointer"
                          >
                            Entregar ✓
                          </button>
                        ) : (
                          <span className="text-slate-500 font-bold text-[9px]">Entregado</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

      {/* 3. ROL: COMITÉ DE VIGILANCIA (MESA DIRECTIVA) */}
      {activeSubSection === 'comite' && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Rol Activo: 3. Comité de Vigilancia (Mesa Directiva)</h3>
                <p className="text-xs text-amber-300 font-mono">Supervisión, Auditoría Financiera de Solo Lectura, Aprobaciones & Actas de Asamblea</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveSubSection('inicio')} 
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition cursor-pointer shrink-0"
            >
              Cambiar Rol ←
            </button>
          </div>

          {/* Sub-tabs inside Comité */}
          <div className="flex flex-wrap gap-2 border-b border-[#2d2d32] pb-3">
            <button
              onClick={() => setComiteTab('auditoria')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                comiteTab === 'auditoria'
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'bg-[#1E1E22] text-slate-400 hover:text-white border border-[#2d2d32]'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>1. Auditoría Financiera (Solo Lectura)</span>
            </button>
            <button
              onClick={() => setComiteTab('aprobaciones')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                comiteTab === 'aprobaciones'
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'bg-[#1E1E22] text-slate-400 hover:text-white border border-[#2d2d32]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>2. Aprobación de Presupuestos Extraordinarios</span>
            </button>
            <button
              onClick={() => setComiteTab('actas')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                comiteTab === 'actas'
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'bg-[#1E1E22] text-slate-400 hover:text-white border border-[#2d2d32]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. Actas de Asamblea & Minutas</span>
            </button>
          </div>

          {/* TAB 1: AUDITORÍA FINANCIERA */}
          {comiteTab === 'auditoria' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[#1E1E22] border border-[#2d2d32] rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Ingresos Recaudados</p>
                    <p className="text-xl font-black text-emerald-400 mt-1">${totalPaid.toLocaleString('es-MX')}.00</p>
                    <span className="text-[9px] text-slate-400">Verificado vs Banco</span>
                  </div>
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                    $
                  </div>
                </div>

                <div className="p-4 bg-[#1E1E22] border border-[#2d2d32] rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Egresos / Gastos Ejercidos</p>
                    <p className="text-xl font-black text-amber-400 mt-1">${totalEgresos.toLocaleString('es-MX')}.00</p>
                    <span className="text-[9px] text-slate-400">Con Comprobantes CFDI</span>
                  </div>
                  <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center font-bold">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 bg-[#1E1E22] border border-[#2d2d32] rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Balance en Caja Chica / Banco</p>
                    <p className="text-xl font-black text-purple-400 mt-1">${(totalPaid - totalEgresos).toLocaleString('es-MX')}.00</p>
                    <span className="text-[9px] text-slate-400">Superávit Comunal</span>
                  </div>
                  <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Registro de Egresos para Auditar */}
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#2d2d32] pb-3">
                  <div>
                    <h4 className="text-sm font-black text-white">Egresos & Comprobantes Fiscales Subidos por Administración</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Vista de solo lectura exclusiva para fiscalización del comité.</p>
                  </div>
                  <span className="text-[9px] bg-amber-500/15 text-amber-300 font-mono font-bold px-2.5 py-1 rounded-full">SOLO LECTURA</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#141417] text-slate-400 uppercase text-[9px] tracking-wider border-b border-[#2d2d32]">
                      <tr>
                        <th className="p-3">Concepto Gasto</th>
                        <th className="p-3">Categoría</th>
                        <th className="p-3">Monto</th>
                        <th className="p-3">Proveedor</th>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Comprobante XML/PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2d2d32]/50 text-slate-300">
                      {egresos.map(eg => (
                        <tr key={eg.id} className="hover:bg-[#141417]/50">
                          <td className="p-3 font-bold text-white">{eg.concepto}</td>
                          <td className="p-3 uppercase text-[10px] text-slate-400 font-mono">{eg.categoria}</td>
                          <td className="p-3 font-mono font-bold text-amber-400">${eg.monto.toLocaleString('es-MX')}.00</td>
                          <td className="p-3">{eg.proveedor}</td>
                          <td className="p-3 font-mono text-[10px] text-slate-400">{eg.fecha}</td>
                          <td className="p-3">
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono font-bold">✓ Verificado</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APROBACIÓN DE PRESUPUESTOS */}
          {comiteTab === 'aprobaciones' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div className="border-b border-[#2d2d32] pb-3">
                  <h4 className="text-sm font-black text-white">Solicitudes de Presupuestos Extraordinarios</h4>
                  <p className="text-xs text-slate-400 mt-0.5">El comité de vigilancia debe aprobar o rechazar los proyectos propuestos antes de su ejecución.</p>
                </div>

                <div className="space-y-3">
                  {presupuestosExtra.map(p => (
                    <div key={p.id} className="p-4 bg-[#141417] border border-[#232326] rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-white text-xs">{p.titulo}</h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">{p.justificacion}</p>
                          <span className="text-[9px] text-slate-400 font-mono">Solicitado por: {p.solicitadoPor} | Fecha: {p.fecha}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-amber-400 font-mono">${p.montoTotal.toLocaleString('es-MX')}.00</span>
                          <span className={`block text-[9px] font-mono font-bold uppercase mt-0.5 ${
                            p.estatus === 'aprobado' ? 'text-emerald-400' : p.estatus === 'rechazado' ? 'text-rose-400' : 'text-amber-300'
                          }`}>
                            {p.estatus}
                          </span>
                        </div>
                      </div>

                      {p.estatus === 'pendiente' && (
                        <div className="flex gap-2 pt-2 border-t border-[#232326]">
                          <button
                            onClick={() => handleApprovePresupuesto(p.id, 'aprobado')}
                            className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" /> Aprobar Presupuesto
                          </button>
                          <button
                            onClick={() => handleApprovePresupuesto(p.id, 'rechazado')}
                            className="flex-1 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" /> Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACTAS Y MINUTAS */}
          {comiteTab === 'actas' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-2xl p-5 space-y-4">
                <div className="border-b border-[#2d2d32] pb-3">
                  <h4 className="text-sm font-black text-white">Repositorio de Actas de Asamblea & Firma Digital</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Consulte las minutas formales y firme electrónicamente como miembro del comité.</p>
                </div>

                <div className="space-y-3">
                  {actasAsamblea.map(a => (
                    <div key={a.id} className="p-4 bg-[#141417] border border-[#232326] rounded-xl flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{a.titulo}</span>
                          <span className="text-[9px] font-mono bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-md uppercase font-bold">{a.estatus}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">Fecha: {a.fechaAsamblea} | Firmas: {a.firmasDigitalesCount}/{a.requiereFirmas}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {a.firmasDigitalesCount >= a.requiereFirmas ? (
                          <span className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold font-mono">✓ Firmado Digitalmente</span>
                        ) : (
                          <button
                            onClick={() => handleSignActa(a.id)}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckSquare className="w-3.5 h-3.5" /> Firmar Acta ({a.firmasDigitalesCount}/{a.requiereFirmas})
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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

      </div> {/* Close 2. MAIN CONTENT VIEW CONTAINER */}

      {/* 3. BOTTOM NAVIGATION BAR (Mobile/Tablet) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#141417] border-t border-[#232326] flex items-center justify-around z-50 px-1 select-none shadow-xl">
        <button
          onClick={() => setActiveSubSection('inicio')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[8.5px] font-extrabold h-full flex-1 transition cursor-pointer ${
            activeSubSection === 'inicio' ? 'text-purple-400 font-black' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Inicio</span>
        </button>

        <button
          onClick={() => setActiveSubSection('superadmin')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[8.5px] font-extrabold h-full flex-1 transition cursor-pointer ${
            activeSubSection === 'superadmin' ? 'text-red-400 font-black' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>SuperAdmin</span>
        </button>

        <button
          onClick={() => setActiveSubSection('admininmobiliaria')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[8.5px] font-extrabold h-full flex-1 transition cursor-pointer ${
            activeSubSection === 'admininmobiliaria' ? 'text-purple-400 font-black' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Admin</span>
        </button>

        <button
          onClick={() => setActiveSubSection('comite')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[8.5px] font-extrabold h-full flex-1 transition cursor-pointer ${
            activeSubSection === 'comite' ? 'text-amber-400 font-black' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Comité</span>
        </button>

        <button
          onClick={() => setActiveSubSection('residente')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[8.5px] font-extrabold h-full flex-1 transition cursor-pointer ${
            activeSubSection === 'residente' ? 'text-blue-400 font-black' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Residente</span>
        </button>

        <button
          onClick={() => setActiveSubSection('guardia')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[8.5px] font-extrabold h-full flex-1 transition cursor-pointer ${
            activeSubSection === 'guardia' ? 'text-emerald-400 font-black' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          <span>Guardia</span>
        </button>
      </nav>

      {/* 4. MODAL REGISTRO / EDICIÓN DE CLIENTES */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-sans">
          <div className="bg-[#1E1E22] border border-[#2d2d32] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            <div className="p-6 bg-gradient-to-r from-purple-950/40 to-slate-900 border-b border-[#2d2d32] flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-md font-black text-white">
                  {editingClient ? 'Configurar Límites y Suscripción' : 'Registrar Nuevo Condominio / Cliente'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Define los accesos y capacidades operativas asignadas.</p>
              </div>
              <button 
                onClick={() => setIsClientModalOpen(false)}
                className="text-slate-400 hover:text-white transition text-sm font-bold bg-slate-800 hover:bg-slate-700 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Nombre del Condominio / Inmobiliaria *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Residencial Bosques del Sol"
                  value={formClientNombre}
                  onChange={(e) => setFormClientNombre(e.target.value)}
                  className="w-full bg-[#141417] border border-[#2d2d32] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Administrador de Cuenta *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Lic. Harold Anguiano"
                    value={formClientAdmin}
                    onChange={(e) => setFormClientAdmin(e.target.value)}
                    className="w-full bg-[#141417] border border-[#2d2d32] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej. +52 5500000000"
                    value={formClientTelefono}
                    onChange={(e) => setFormClientTelefono(e.target.value)}
                    className="w-full bg-[#141417] border border-[#2d2d32] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Correo Electrónico Principal *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@condominiosol.com"
                  value={formClientCorreo}
                  onChange={(e) => setFormClientCorreo(e.target.value)}
                  className="w-full bg-[#141417] border border-[#2d2d32] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="border-t border-[#2d2d32] pt-4 text-left">
                <span className="text-[10px] uppercase font-black text-purple-400 tracking-wider font-mono">Plan de Suscripción y Límites Operativos</span>
                
                {/* Plan selections */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(['Básico', 'Premium', 'Enterprise'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setFormClientPlan(p);
                        if (p === 'Básico') {
                          setFormClientLimDep('50');
                          setFormClientLimUsr('5');
                          setFormClientLimAlm('10');
                        } else if (p === 'Premium') {
                          setFormClientLimDep('200');
                          setFormClientLimUsr('25');
                          setFormClientLimAlm('50');
                        } else {
                          setFormClientLimDep('1000');
                          setFormClientLimUsr('100');
                          setFormClientLimAlm('500');
                        }
                      }}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition flex flex-col items-center gap-0.5 cursor-pointer ${
                        formClientPlan === p
                          ? 'bg-purple-600/15 border-purple-500 text-purple-400'
                          : 'bg-[#141417] border-[#2d2d32] text-slate-455 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-[10px] font-black">{p}</span>
                      <span className="text-[8px] opacity-75">
                        {p === 'Básico' ? '$1,500/mes' : p === 'Premium' ? '$3,500/mes' : '$8,000/mes'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editable limits */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 text-left">
                  <label className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider">Máx Depas</label>
                  <input
                    type="number"
                    required
                    value={formClientLimDep}
                    onChange={(e) => setFormClientLimDep(e.target.value)}
                    className="w-full bg-[#141417] border border-[#2d2d32] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-all text-center"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider">Máx Usuarios</label>
                  <input
                    type="number"
                    required
                    value={formClientLimUsr}
                    onChange={(e) => setFormClientLimUsr(e.target.value)}
                    className="w-full bg-[#141417] border border-[#2d2d32] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-all text-center"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider">Almacén (GB)</label>
                  <input
                    type="number"
                    required
                    value={formClientLimAlm}
                    onChange={(e) => setFormClientLimAlm(e.target.value)}
                    className="w-full bg-[#141417] border border-[#2d2d32] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-all text-center"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-950/10 border border-purple-500/10 rounded-xl text-[10px] text-purple-400 font-medium text-left">
                💡 Los límites se aplican en tiempo real bloqueando el alta de nuevos condóminos, residentes u archivos si se excede la cuota contratada.
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#141417] hover:bg-[#1C1C20] border border-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-purple-600/10"
                >
                  {editingClient ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
