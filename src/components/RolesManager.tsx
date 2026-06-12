/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Shield, ShieldCheck, UserPlus, Trash2, Check, X, ShieldAlert, Key, 
  Search, Eye, EyeOff, HelpCircle, Users, Settings, Smartphone, Clipboard, FileText, AlertTriangle,
  Edit2, Phone, UserX, UserCheck
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { SystemRole, SystemUserRole } from '../types';

interface RolesManagerProps {
  onRolesUpdated: () => void;
  currentUserId?: string;
  onSimulateRole?: (role: SystemUserRole, name: string) => void;
  activeSimulatedRole?: SystemUserRole;
  currentUser?: any;
}

// Fixed mapping of capabilities based on security roles
interface ModulePermission {
  moduleName: string;
  description: string;
  icon: React.ReactNode;
  rolesWithAccess: SystemUserRole[];
}

export default function RolesManager({ 
  onRolesUpdated, 
  currentUserId,
  onSimulateRole,
  activeSimulatedRole,
  currentUser
}: RolesManagerProps) {
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Create Operador State Form
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formRole, setFormRole] = useState<SystemUserRole>(SystemUserRole.SUPERVISOR);
  const [formPhone, setFormPhone] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [formUsername, setFormUsername] = useState<string>('');
  const [formResidenciaId, setFormResidenciaId] = useState<string>('');
  const [residencias, setResidencias] = useState<any[]>([]);

  // Track newly registered operator credentials to display in "share" modal
  const [newCreatedCreds, setNewCreatedCreds] = useState<{
    nombre: string;
    usuario: string;
    correo: string;
    contrasena: string;
    rol: string;
    residencia: string;
    url: string;
    whatsappUrl?: string;
    phone?: string;
  } | null>(null);

  // Password visibility
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Confirm Overlay states
  const [deleteConfirmUid, setDeleteConfirmUid] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');

  // Info Alerts inside operational form
  const [formAlert, setFormAlert] = useState<string>('');

  // Success message feedback
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Load operators list
  const loadRoles = () => {
    dbService.getAllSystemRoles().then(async (list) => {
      // If there are only basic roles, let's inject a few realistic security team members to showcase seed data
      if (list.length <= 2) {
        const seedRoles: SystemRole[] = [
          ...list,
          {
            uid: 'supervisor-demo-uid',
            name: 'Elena Rostova (Seguridad)',
            email: 'elena@seguridad.local',
            username: 'elena',
            role: SystemUserRole.SUPERVISOR,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            phone: '+525544332211',
            password: 'ElenaSecurePass2026',
            isActive: true
          },
          {
            uid: 'auditor-demo-uid',
            name: 'Lic. Francisco Gómez',
            email: 'francisco@auditoria.local',
            username: 'francisco',
            role: SystemUserRole.AUDITOR,
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            phone: '+525599887766',
            password: 'FranciscoPass_998',
            isActive: true
          }
        ];
        
        // Save these seeds locally
        for (const r of seedRoles) {
          const exists = list.some(existing => existing.uid === r.uid);
          if (!exists) {
            await dbService.saveSystemRole(r);
          }
        }
        setRoles(seedRoles);
      } else {
        setRoles(list);
      }
    });

    // Also fetch residencias list
    dbService.getResidencias().then((list) => {
      setResidencias(list || []);
    });
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let generated = "";
    for (let i = 0; i < 14; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(generated);
  };

  const handleOpenCreateForm = () => {
    setEditingUid(null);
    setFormName('');
    setFormEmail('');
    setFormUsername('');
    setFormRole(SystemUserRole.SUPERVISOR);
    setFormPhone('');
    setFormPassword('');
    setFormResidenciaId(currentUser?.residenciaId || '');
    setFormAlert('');
    setIsFormOpen(true);
  };

  const handleEditRole = (role: SystemRole) => {
    setEditingUid(role.uid);
    setFormName(role.name);
    setFormEmail(role.email);
    setFormUsername(role.username || '');
    setFormRole(role.role);
    setFormPhone(role.phone || '');
    setFormPassword(role.password || '');
    setFormResidenciaId(role.residenciaId || '');
    setFormAlert('');
    setIsFormOpen(true);
  };

  const handleToggleActive = async (role: SystemRole) => {
    if (role.uid === 'admin-demo-uid') {
      alert('Operación Bloqueada: No se puede desactivar al Administrador Principal del Sistema.');
      return;
    }
    const currentActive = role.isActive !== false;
    const updatedRole: SystemRole = {
      ...role,
      isActive: !currentActive
    };
    await dbService.saveSystemRole(updatedRole);
    loadRoles();
    onRolesUpdated();
    setSuccessMsg(`Estado de "${role.name}" actualizado a: ${!currentActive ? 'ACTIVO' : 'INACTIVO'}.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      setFormAlert('Por favor complete los campos obligatorios: Nombre completo y Correo institucional.');
      return;
    }

    const cleanedUsername = formUsername.trim().toLowerCase();
    
    // Check for username duplication if creating or if changing username
    if (cleanedUsername) {
      const duplicate = roles.find(r => r.uid !== editingUid && r.username?.toLowerCase() === cleanedUsername);
      if (duplicate) {
        setFormAlert(`El nombre de usuario "${formUsername}" ya está registrado por otro operador. Ingrese un usuario diferente.`);
        return;
      }
    }

    // Retrieve subdivision info
    const matchedRes = residencias.find(res => res.id === formResidenciaId);

    const payload: SystemRole = {
      uid: editingUid || ('operator_' + Math.random().toString(36).substring(2, 9)),
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      username: cleanedUsername || undefined,
      role: formRole,
      createdAt: editingUid 
        ? (roles.find(r => r.uid === editingUid)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
      phone: formPhone.trim(),
      password: formPassword.trim(),
      isActive: editingUid 
        ? (roles.find(r => r.uid === editingUid)?.isActive !== false)
        : true,
      residenciaId: formResidenciaId || undefined,
      residenciaNombre: matchedRes ? matchedRes.nombre : undefined
    };

    await dbService.saveSystemRole(payload);
    loadRoles();
    onRolesUpdated();
    
    // If a new employee is registered, trigger the exclusive credentials dialog
    if (!editingUid) {
      const appUrl = window.location.origin || 'https://servicios-de-seguridad.vercel.app/';
      const cleanPhone = payload.phone ? payload.phone.replace(/[^0-9]/g, '') : '';
      const templateMsg = `🔐 *SISTEMA DE SEGURIDAD DIGITAL - CONTROL DE ACCESOS*\n\nHola *${payload.name}*,\nTe damos la bienvenida al panel oficial de control de accesos. Tus credenciales de ingreso son:\n\n👤 *Usuario*: ${payload.username || '(Utilizar Correo)'}\n✉️ *Correo*: ${payload.email}\n🔑 *Contraseña asignada*: ${payload.password || '(Sin contraseña)'}\n🏠 *Asignación*: ${payload.residenciaNombre || 'Administración / Caseta General 🏢'}\n\n🔗 *Link de acceso directo al Panel*:\n${appUrl}\n\nFavor de resguardar esta información de forma confidencial.`;
      const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(templateMsg)}` : '';

      setNewCreatedCreds({
        nombre: payload.name,
        usuario: payload.username || '(Utilizar Correo)',
        correo: payload.email,
        contrasena: payload.password || '(Sin contraseña)',
        rol: payload.role === SystemUserRole.ADMIN ? 'Director Administrador 🛡️' : 'Oficial de Seguridad / Caseta 👮',
        residencia: payload.residenciaNombre || 'Administración / Caseta General 🏢',
        url: appUrl,
        whatsappUrl: whatsappUrl,
        phone: payload.phone || ''
      });

      // Automatically open WhatsApp link
      if (whatsappUrl) {
        try {
          window.open(whatsappUrl, '_blank');
        } catch (err) {
          console.warn('Browser blocked automatic WhatsApp redirection under iframe rules:', err);
        }
      }
    }

    // Clear & Feedback
    setFormName('');
    setFormEmail('');
    setFormUsername('');
    setFormRole(SystemUserRole.SUPERVISOR);
    setFormPhone('');
    setFormPassword('');
    setFormResidenciaId('');
    setEditingUid(null);
    setIsFormOpen(false);
    
    const actionText = editingUid ? 'actualizado' : 'agregado';
    setSuccessMsg(`Operador "${payload.name}" ${actionText} con éxito.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleDeleteRole = (uid: string, name: string) => {
    if (uid === 'admin-demo-uid') {
      alert('Operación Bloqueada: No se puede eliminar al Administrador Principal del Sistema.');
      return;
    }
    setDeleteConfirmUid(uid);
    setDeleteConfirmName(name);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmUid) {
      await dbService.deleteSystemRole(deleteConfirmUid);
      loadRoles();
      onRolesUpdated();
      setSuccessMsg(`Se revocaron los permisos para "${deleteConfirmName}".`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setDeleteConfirmUid(null);
      setDeleteConfirmName('');
    }
  };

  const getRoleLabel = (r: SystemUserRole) => {
    switch (r) {
      case SystemUserRole.ADMIN: return 'Director Admin 🛡️';
      case SystemUserRole.RESIDENTE: return 'Residente 🏠';
      case SystemUserRole.GUARD: return 'Residente (Legacy) 🏠';
      case SystemUserRole.SUPERVISOR: return 'Seguridad 🛡️';
      case SystemUserRole.AUDITOR: return 'Auditor Cumplimiento 🔍';
      default: return 'Desconocido';
    }
  };

  const getRoleBadgeStyle = (r: SystemUserRole) => {
    switch (r) {
      case SystemUserRole.ADMIN: return 'bg-red-500/15 text-red-400 border-red-505/30';
      case SystemUserRole.SUPERVISOR: return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case SystemUserRole.GUARD: return 'bg-zinc-800 text-zinc-300 border-zinc-700';
      case SystemUserRole.RESIDENTE: return 'bg-blue-550/15 text-blue-400 border-blue-500/20';
      case SystemUserRole.AUDITOR: return 'bg-purple-500/10 text-purple-400 border-purple-500/15';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  // Definitions of modules and who can do what (RBAC capability list)
  const modulePermissions: ModulePermission[] = [
    {
      moduleName: 'Escanear Pase QR',
      description: 'Cámara de lectura de acceso, verificación instantánea de firmas en cripto-hashes.',
      icon: <Smartphone className="w-4 h-4" />,
      rolesWithAccess: [SystemUserRole.ADMIN, SystemUserRole.GUARD, SystemUserRole.SUPERVISOR]
    },
    {
      moduleName: 'Visualizar Logs & Auditoría',
      description: 'Acceso completo al rastro histórico de pases cargados, aprobados o con fallos.',
      icon: <FileText className="w-4 h-4" />,
      rolesWithAccess: [SystemUserRole.ADMIN, SystemUserRole.GUARD, SystemUserRole.SUPERVISOR, SystemUserRole.AUDITOR]
    },
    {
      moduleName: 'Exportación a CSV',
      description: 'Permiso para empaquetar de forma local logs de seguridad para reportes formales.',
      icon: <Clipboard className="w-4 h-4" />,
      rolesWithAccess: [SystemUserRole.ADMIN, SystemUserRole.SUPERVISOR, SystemUserRole.AUDITOR]
    },
    {
      moduleName: 'Emisión de Pases QR (CRUD)',
      description: 'Crear, editar, consultar y suspender el listado de personas externas aprobadas.',
      icon: <Users className="w-4 h-4" />,
      rolesWithAccess: [SystemUserRole.ADMIN, SystemUserRole.SUPERVISOR]
    },
    {
      moduleName: 'Configurar Alertas de Emergencia',
      description: 'Acceso para disparar botón de emergencia de seguridad para evacuación o cierres inmediatos.',
      icon: <AlertTriangle className="w-4 h-4" />,
      rolesWithAccess: [SystemUserRole.ADMIN, SystemUserRole.SUPERVISOR]
    },
    {
      moduleName: 'Administración de Operadores',
      description: 'Alta, baja y revocación de permisos de acceso del personal de seguridad.',
      icon: <Settings className="w-4 h-4" />,
      rolesWithAccess: [SystemUserRole.ADMIN]
    }
  ];

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      role.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResidence = currentUser?.residenciaId ? role.residenciaId === currentUser.residenciaId : true;
    return matchesSearch && matchesResidence;
  });

  return (
    <div id="roles-manager-cabinet-root" className="space-y-6">
      
      {/* EXCLUSIVE NEW OPERATOR CREDENTIALS DISPATCH MODAL */}
      {newCreatedCreds && createPortal(
        <div id="overlay-creds-share" className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div id="creds-share-modal-body" className="bg-[#2A2A2E] rounded-3xl border-2 border-emerald-500/35 shadow-2xl max-w-md w-full overflow-hidden text-slate-100">
            {/* Header */}
            <div className="p-6 bg-emerald-500/10 border-b border-[#3e3e42] text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <ShieldCheck className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400">
                ¡Registro Exitoso de Personal!
              </h3>
              <p className="text-[11.5px] text-slate-300">
                El operador ha sido ingresado en el padrón de accesos controlados de forma correcta.
              </p>
            </div>

            {/* Data Table */}
            <div className="p-6 space-y-4 text-xs text-left">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-center">Credenciales de Acceso Generadas</p>
              
              <div className="bg-[#1A1A1E] rounded-2xl border border-[#3e3e42] p-4.5 space-y-2.5 font-mono">
                <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                  <span className="text-zinc-500 text-[10px]">Nombre:</span>
                  <span className="text-white font-bold">{newCreatedCreds.nombre}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                  <span className="text-zinc-500 text-[10px]">Usuario Login:</span>
                  <span className="text-amber-400 font-bold">{newCreatedCreds.usuario}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/60 pb-1.5 font-sans">
                  <span className="text-zinc-500 text-[10px]">Correo:</span>
                  <span className="text-white">{newCreatedCreds.correo}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                  <span className="text-zinc-500 text-[10px]">Contraseña:</span>
                  <span className="text-red-400 font-bold bg-zinc-950 px-2 py-0.5 rounded font-mono">{newCreatedCreds.contrasena}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/60 pb-1.5 font-sans">
                  <span className="text-zinc-500 text-[10px]">Rol / Puesto:</span>
                  <span className="text-zinc-300 font-sans">{newCreatedCreds.rol}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/60 pb-1.5 font-sans">
                  <span className="text-zinc-500 text-[10px]">Residencial:</span>
                  <span className="text-zinc-300 font-sans">{newCreatedCreds.residencia}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-zinc-500 text-[10px]">Link Panel:</span>
                  <span className="text-blue-400 underline">{newCreatedCreds.url}</span>
                </div>
              </div>

              <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <HelpCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-zinc-300 leading-normal font-sans">
                    {newCreatedCreds.phone ? (
                      <p>
                        Hemos intentado abrir WhatsApp automáticamente para enviar las credenciales al número <span className="text-emerald-400 font-extrabold">{newCreatedCreds.phone}</span>. Si tu navegador bloqueó el popup, pulsa el botón verde <strong>"Enviar por WhatsApp 💬"</strong> de abajo para hacerlo de forma directa.
                      </p>
                    ) : (
                      <p>
                        Copie el mensaje de credenciales y envíelo al operador por correo electrónico o WhatsApp, para que ingrese desde el formulario del portal.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-5 border-t border-[#3e3e42] bg-[#1d1d21] flex flex-col sm:flex-row gap-2">
              {newCreatedCreds.whatsappUrl && (
                <a
                  id="btn-send-whatsapp-manual"
                  href={newCreatedCreds.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <span>Enviar por WhatsApp 💬</span>
                </a>
              )}
              <button
                id="btn-copy-creds-template"
                onClick={() => {
                  const templateMsg = `🔐 *SISTEMA DE SEGURIDAD DIGITAL - CONTROL DE ACCESOS*\n\nHola *${newCreatedCreds.nombre}*,\nTe damos la bienvenida al panel oficial de control de accesos. Tus credenciales de ingreso son:\n\n👤 *Usuario*: ${newCreatedCreds.usuario}\n✉️ *Correo*: ${newCreatedCreds.correo}\n🔑 *Contraseña asignada*: ${newCreatedCreds.contrasena}\n🏠 *Asignación*: ${newCreatedCreds.residencia}\n\n🔗 *Link de acceso directo al Panel*:\n${newCreatedCreds.url}\n\nFavor de resguardar esta información de forma confidencial.`;
                  navigator.clipboard.writeText(templateMsg);
                  alert("📄 Mensaje con credenciales copiado al Portapapeles con éxito.");
                }}
                className="flex-1 py-1.5 bg-[#2A2A2E] hover:bg-zinc-800 text-slate-300 hover:text-white border border-[#3e3e42] rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Clipboard className="w-3.5 h-3.5" /> Copiar Mensaje
              </button>
              <button
                id="btn-dismiss-creds-success"
                onClick={() => setNewCreatedCreds(null)}
                className="flex-1 py-1.5 bg-[#2A2A2E] hover:bg-zinc-850 text-white border border-[#3e3e42] rounded-xl font-bold transition cursor-pointer text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Informative panel about roles and modules activation */}
      <div id="roles-intro-alert-box" className="bg-[#2A2A2E] border border-[#3e3e42] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-sans">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Control por Roles Activado (RBAC)
          </h2>
          <p className="text-[11.5px] text-slate-400 leading-relaxed max-w-2xl">
            Cada módulo del sistema se activa selectivamente según la directriz del reglamento de condominio. Los Directores 
            tienen control total, los Residentes y Operadores se centran en el scanner operativo, los Supervisores autorizan pases, 
            y los Auditores extraen reportes de cumplimiento técnico.
          </p>
        </div>
        <button
          id="btn-register-new-role-trigger"
          onClick={handleOpenCreateForm}
          className="inline-flex items-center gap-2 justify-center px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" /> Registrar Personal
        </button>
      </div>

      {successMsg && (
        <div id="roles-success-banner" className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 animate-pulse flex items-center gap-2">
          <span>✓</span>
          <p className="font-semibold">{successMsg}</p>
        </div>
      )}

      {/* Main Grid View: Left = Roles lists & simulated trigger, Right = Module Permission Matrix Grid */}
      <div id="roles-operational-splits" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
        
        {/* Left pane: Active personnel roster */}
        <div id="roles-left-list-col" className="lg:col-span-7 bg-[#2A2A2E] border border-[#3e3e42] rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" /> Nómina de Personal Autorizado
            </h3>
            
            {/* Search */}
            <div className="relative max-w-xs w-full sm:w-60">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                id="search-role-operator-input"
                type="text"
                placeholder="Buscar por nombre, email o rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8.5 pr-2 py-1.5 text-xs bg-[#1A1A1E] border border-[#3e3e42] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-red-500"
              />
            </div>
          </div>

          <div id="operators-reactive-list" className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {filteredRoles.map(r => {
              const isSimulatingThis = activeSimulatedRole === r.role;
              const isDeactivated = r.isActive === false;
              const isMainAdmin = r.uid === 'admin-demo-uid';
              const showPass = !!showPasswordMap[r.uid];
              const toggleShowPass = () => setShowPasswordMap(prev => ({ ...prev, [r.uid]: !prev[r.uid] }));

              return (
                <div 
                  key={r.uid} 
                  id={`operator-card-${r.uid}`}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDeactivated
                      ? 'bg-[#151518] border-red-900/20 opacity-70'
                      : isSimulatingThis 
                        ? 'bg-red-950/20 border-red-500/30 shadow-inner' 
                        : 'bg-[#1A1A1E] border-[#3e3e42] hover:border-slate-650'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-100 truncate">{r.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getRoleBadgeStyle(r.role)}`}>
                        {getRoleLabel(r.role)}
                      </span>
                      {isDeactivated ? (
                        <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-red-950/40 text-red-400 border border-red-900/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span> Inactivo
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Activo
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-slate-300 font-mono truncate">{r.email}</p>
                    
                    {r.username && (
                      <p className="text-[10px] text-slate-300 font-mono">
                        <span>Usuario login: </span>
                        <span className="text-amber-400 font-bold">{r.username}</span>
                      </p>
                    )}

                    {r.residenciaNombre && (
                      <p className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                        <span>🏡 Residencial:</span>
                        <span className="uppercase text-rose-300">{r.residenciaNombre}</span>
                      </p>
                    )}
                    
                    {/* Phone field */}
                    {r.phone && (
                      <p className="text-[10px] text-slate-300 font-mono flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>Tel/WhatsApp: {r.phone}</span>
                      </p>
                    )}

                    {/* Password field */}
                    {r.password && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-300 font-mono">
                        <Key className="w-3 h-3 text-slate-500" />
                        <span>Clave:</span>
                        <span className="bg-[#111115] px-1.5 py-0.5 rounded text-red-400 tracking-wide">
                          {showPass ? r.password : '••••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={toggleShowPass}
                          className="p-1 hover:bg-[#2e2e38] rounded text-slate-400 hover:text-white transition cursor-pointer"
                          title={showPass ? "Ocultar Contraseña" : "Mostrar Contraseña"}
                        >
                          {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    )}

                    <p className="text-[9px] text-slate-500 font-mono">Alta: {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center gap-1.5 justify-end shrink-0">
                    {onSimulateRole && !isDeactivated && (
                      <button
                        id={`btn-simulate-${r.uid}`}
                        onClick={() => onSimulateRole(r.role, r.name)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all border cursor-pointer ${
                          isSimulatingThis 
                            ? 'bg-red-600 text-white border-red-500' 
                            : 'bg-slate-950 text-slate-400 border-slate-850 hover:text-white hover:bg-slate-900'
                        }`}
                        title="Probar comportamiento del sistema con este rol"
                      >
                        {isSimulatingThis ? '🛒 Simulado' : '🔌 Probar'}
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      id={`btn-edit-role-${r.uid}`}
                      onClick={() => handleEditRole(r)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition border border-transparent rounded-lg cursor-pointer"
                      title="Editar Operador"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Active/Inactive toggle button */}
                    <button
                      id={`btn-toggle-active-role-${r.uid}`}
                      onClick={() => handleToggleActive(r)}
                      disabled={isMainAdmin}
                      className={`p-1.5 transition border border-transparent rounded-lg cursor-pointer ${
                        isMainAdmin
                          ? 'text-slate-700 cursor-not-allowed'
                          : isDeactivated
                            ? 'text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-rose-500 hover:text-rose-405 hover:bg-rose-500/10'
                      }`}
                      title={isMainAdmin ? 'Administrador Maestro' : isDeactivated ? 'Activar Operador' : 'Desactivar Operador'}
                    >
                      {isDeactivated ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete button */}
                    <button
                      id={`btn-delete-role-${r.uid}`}
                      onClick={() => handleDeleteRole(r.uid, r.name)}
                      disabled={isMainAdmin}
                      className={`p-1.5 transition rounded-lg border border-transparent cursor-pointer ${
                        isMainAdmin 
                          ? 'text-slate-700 cursor-not-allowed' 
                          : 'text-slate-400 hover:text-rose-450 hover:bg-rose-500/10'
                      }`}
                      title={isMainAdmin ? 'Administrador Maestro' : 'Eliminar Operador'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

            {filteredRoles.length === 0 && (
              <div id="no-role-operators-empty" className="text-center py-8 text-slate-500">
                <HelpCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs">No se encontraron operadores registrados con el criterio especificado.</p>
              </div>
            )}
          </div>

        {/* Right pane: Module Matrix capabilities list */}
        <div id="roles-cap-matrix-col" className="lg:col-span-5 bg-[#2A2A2E] border border-[#3e3e42] rounded-2xl p-5 space-y-4 font-sans">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Matriz de Privilegios Operativos
            </h3>
            <p className="text-[10px] text-slate-500">
              Prueba los roles al presionar <span className="text-slate-300">"Probar Módulos"</span> a la izquierda para restringir paneles al instante.
            </p>
          </div>

          <div id="modules-capability-stack" className="space-y-3.5">
            {modulePermissions.map((mod, i) => {
              // Check if currently simulated role is authorized
              const isSimulatedActiveRoleAllowed = activeSimulatedRole ? mod.rolesWithAccess.includes(activeSimulatedRole) : true;
              return (
                <div 
                  key={i} 
                  id={`capability-block-${i}`}
                  className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-1.5 ${
                    isSimulatedActiveRoleAllowed 
                      ? 'bg-[#1A1A1E]/80 border-[#3e3e42]' 
                      : 'bg-rose-950/10 border-rose-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <span className={`p-1 rounded bg-[#1A1A1E] border ${isSimulatedActiveRoleAllowed ? 'text-red-500 border-[#3e3e42]' : 'text-slate-500 border-rose-950/40'}`}>
                        {mod.icon}
                      </span>
                      <span className={`font-bold ${isSimulatedActiveRoleAllowed ? 'text-slate-200' : 'text-slate-450 line-through'}`}>
                        {mod.moduleName}
                      </span>
                    </div>

                    <span className={`p-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                      isSimulatedActiveRoleAllowed 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {isSimulatedActiveRoleAllowed ? '✓ Activo' : '✗ Denegado'}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-slate-450 pl-8 leading-relaxed">
                    {mod.description}
                  </p>

                  <div className="pl-8 pt-1 flex flex-wrap gap-1 leading-none">
                    <span className="text-[9px] text-slate-500 mr-1.5">Roles autorizados:</span>
                    {mod.rolesWithAccess.map(roleCode => (
                      <span 
                        key={roleCode} 
                        className={`text-[8.5px] px-1.5 py-0.5 rounded border capitalize font-semibold ${
                          activeSimulatedRole === roleCode 
                            ? 'bg-red-600 text-white border-red-400' 
                            : 'bg-[#1A1A1E] text-slate-400 border-[#3e3e42]'
                        }`}
                      >
                        {roleCode}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* FORM REGISTRATION OVERLAY DIALOG */}
      {isFormOpen && createPortal(
        <div id="overlay-operator-crud" className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div id="operator-form-modal-body" className="bg-[#2A2A2E] rounded-2xl border border-[#3e3e42] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-[#3e3e42] flex items-center justify-between bg-[#2A2A2E]/50">
              <h3 className="text-xs font-extrabold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-500" /> {editingUid ? 'Editar Credenciales del Personal' : 'Registrar Credencial Residente / Administrativa'}
              </h3>
               <button 
                 id="btn-close-operator-form"
                 onClick={() => setIsFormOpen(false)}
                 className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
               >
                 <X className="w-4 h-4" />
               </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-5 space-y-4 text-xs">
               {formAlert && (
                 <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-[11px] text-rose-300">
                   ⚠️ {formAlert}
                 </div>
               )}

              <div>
                <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-1.5">Nombre Completo del Operador / Residente *</label>
                <input
                  id="input-operator-name"
                  type="text"
                  required
                  placeholder="Ej. Sgto. Claudio Barrientos"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1A1A1E] border border-[#3e3e42] text-white rounded-xl focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-1.5">Nombre de Usuario (Login) *</label>
                  <input
                    id="input-operator-username"
                    type="text"
                    required
                    placeholder="Ej. cbarrientos"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1E] border border-[#3e3e42] text-white rounded-xl focus:border-red-500 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-1.5">Correo Electrónico *</label>
                  <input
                    id="input-operator-email"
                    type="email"
                    required
                    placeholder="Ej. claudio@seguridad.local"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1E] border border-[#3e3e42] text-white rounded-xl focus:border-red-500 focus:outline-hidden"
                  />
                </div>
              </div>

               {/* New Phone / WhatsApp Input */}
               <div>
                 <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-1.5">Teléfono / WhatsApp *</label>
                 <input
                   id="input-operator-phone"
                   type="text"
                   placeholder="Ej. +52 55 1234 5678"
                   value={formPhone}
                   onChange={(e) => setFormPhone(e.target.value)}
                   className="w-full px-3 py-2 bg-[#1A1A1E] border border-[#3e3e42] text-white rounded-xl focus:border-red-500 focus:outline-hidden"
                 />
               </div>

               {/* New Password & Secure password generator input */}
               <div>
                 <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-1.5">Contraseña de Acceso Directo *</label>
                 <div className="flex gap-2">
                   <input
                     id="input-operator-password"
                     type="text"
                     placeholder="Clave del operador"
                     value={formPassword}
                     onChange={(e) => setFormPassword(e.target.value)}
                     className="flex-1 px-3 py-2 bg-[#1A1A1E] border border-[#3e3e42] text-white rounded-xl focus:border-red-500 focus:outline-hidden font-mono"
                   />
                   <button
                     id="btn-generate-secure-password"
                     type="button"
                     onClick={handleGeneratePassword}
                     className="px-3 py-2 bg-slate-900 border border-[#3e3e42] text-white hover:bg-slate-800 transition text-[9.5px] rounded-xl font-bold uppercase tracking-wider shrink-0 cursor-pointer"
                   >
                     Generar
                   </button>
                 </div>
               </div>

              <div>
                <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-1.5">Asignar Rol Funcional</label>
                <select
                  id="select-operator-role"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as SystemUserRole)}
                  className="w-full px-3 py-2 bg-[#1A1A1E] border border-[#3e3e42] text-white rounded-xl focus:border-red-500 focus:outline-hidden cursor-pointer"
                >
                   <option value={SystemUserRole.SUPERVISOR} className="bg-[#1A1A1E]" >👮 Seguridad / Control de Accesos (Lector QR, Bitácora)</option>
                   <option value={SystemUserRole.RESIDENTE} className="bg-[#1A1A1E]" >🏠 Residente (Panel para dar de alta Visitas con QR)</option>
                   <option value={SystemUserRole.ADMIN} className="bg-[#1A1A1E]" >🛡️ Director Administrador (Control Total Maestro)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-1.5">Residencia / Subdivisión Asignada (Auto-Detección)</label>
                <select
                  disabled={!!currentUser?.residenciaId}
                  id="select-operator-residencia"
                  value={formResidenciaId}
                  onChange={(e) => setFormResidenciaId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1A1A1E] border border-[#3e3e42] text-white rounded-xl focus:border-red-500 focus:outline-hidden cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="" className="bg-[#1A1A1E]">🏢 Administración / Caseta General (Todas)</option>
                  {residencias.map((res: any) => (
                    <option key={res.id} value={res.id} className="bg-[#1A1A1E]">
                      🏡 {res.nombre}
                    </option>
                  ))}
                </select>
                <p className="text-[9.5px] text-slate-400 mt-1">El sistema asignará el usuario exclusivamente a este fraccionamiento al iniciar sesión de forma automática.</p>
              </div>

              <div className="p-3 bg-red-500/10 border border-red-500/15 rounded-xl flex gap-2">
                <Key className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                 <p className="text-[9.5px] text-white leading-normal font-sans">
                  Los privilegios se propagan instantáneamente a los tokens de sesión. En el entorno real, el operador utilizará Google Auth vinculando este email.
                </p>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  id="btn-cancel-operator-action"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                   className="px-4 py-2 bg-[#1A1A1E] hover:bg-zinc-800 text-white border border-[#3e3e42] rounded-xl transition font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-operator-submit"
                  type="submit"
                   className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition font-semibold cursor-pointer"
                >
                   {editingUid ? 'Actualizar Datos' : 'Registrar Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

       {/* CORRESPONDENCE PORTAL DELETE OPERATOR OVERLAY */}
       {deleteConfirmUid && createPortal(
         <div id="overlay-delete-operator" className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
           <div id="delete-operator-modal-body" className="bg-[#2A2A2E] rounded-2xl border border-[#3e3e42] shadow-2xl max-w-sm w-full overflow-hidden p-6 space-y-4 text-xs">
             <div className="text-center space-y-2">
               <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-500">
                 <ShieldAlert className="w-6 h-6" />
               </div>
               <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">
                 Revocar Credenciales
               </h3>
               <p className="text-[11.5px] text-slate-300 leading-relaxed">
                 ¿Está seguro de revocar de forma inmediata todos los privilegios de acceso para: <span className="font-bold text-white">"{deleteConfirmName}"</span>?
               </p>
             </div>
             <div className="flex gap-2.5 pt-2">
               <button
                 id="btn-cancel-delete"
                 onClick={() => setDeleteConfirmUid(null)}
                 className="flex-1 py-2 bg-[#1A1A1E] hover:bg-zinc-800 text-white border border-[#3e3e42] rounded-xl transition font-semibold cursor-pointer"
               >
                 No, mantener
               </button>
               <button
                 id="btn-confirm-delete"
                 onClick={handleConfirmDelete}
                 className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition font-semibold cursor-pointer"
               >
                 Sí, revocar definitivo
               </button>
             </div>
           </div>
         </div>,
         document.body
       )}

    </div>
  );
}
