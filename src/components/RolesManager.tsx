/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Shield, ShieldCheck, UserPlus, Trash2, Check, X, ShieldAlert, Key, 
  Search, Eye, HelpCircle, Users, Settings, Smartphone, Clipboard, FileText, AlertTriangle 
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { SystemRole, SystemUserRole } from '../types';

interface RolesManagerProps {
  onRolesUpdated: () => void;
  currentUserId?: string;
  onSimulateRole?: (role: SystemUserRole, name: string) => void;
  activeSimulatedRole?: SystemUserRole;
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
  activeSimulatedRole 
}: RolesManagerProps) {
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Create Operador State Form
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formRole, setFormRole] = useState<SystemUserRole>(SystemUserRole.ADMIN);

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
            role: SystemUserRole.SUPERVISOR,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            uid: 'auditor-demo-uid',
            name: 'Lic. Francisco Gómez',
            email: 'francisco@auditoria.local',
            role: SystemUserRole.AUDITOR,
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
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
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      alert('Por favor complete los campos obligatorios: Nombre completo y Correo institucional.');
      return;
    }

    const newUid = 'operator_' + Math.random().toString(36).substring(2, 9);
    const payload: SystemRole = {
      uid: newUid,
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      role: formRole,
      createdAt: new Date().toISOString()
    };

    await dbService.saveSystemRole(payload);
    loadRoles();
    onRolesUpdated();
    
    // Clear & Feedback
    setFormName('');
    setFormEmail('');
    setFormRole(SystemUserRole.ADMIN);
    setIsFormOpen(false);
    
    setSuccessMsg(`Operador "${payload.name}" agregado con éxito como ${getRoleLabel(payload.role)}.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleDeleteRole = async (uid: string, name: string) => {
    if (uid === 'admin-demo-uid') {
      alert('Operación Bloqueada: No se puede eliminar al Administrador Principal del Sistema.');
      return;
    }
    if (window.confirm(`¿Está seguro de revocar y eliminar de forma inmediata todas las credenciales del sistema para: "${name}"?`)) {
      await dbService.deleteSystemRole(uid);
      loadRoles();
      onRolesUpdated();
      setSuccessMsg(`Se revocaron los permisos para "${name}".`);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const getRoleLabel = (r: SystemUserRole) => {
    switch (r) {
      case SystemUserRole.ADMIN: return 'Director Admin 🛡️';
      case SystemUserRole.GUARD: return 'Residente 🏠';
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

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    role.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="roles-manager-cabinet-root" className="space-y-6">
      
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
          onClick={() => setIsFormOpen(true)}
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
              return (
                <div 
                  key={r.uid} 
                  id={`operator-card-${r.uid}`}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isSimulatingThis 
                      ? 'bg-red-950/20 border-red-500/30 shadow-inner' 
                      : 'bg-[#1A1A1E] border-[#3e3e42] hover:border-slate-650'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-200">{r.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getRoleBadgeStyle(r.role)}`}>
                        {getRoleLabel(r.role)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{r.email}</p>
                    <p className="text-[9px] text-slate-500 font-mono">Alta: {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onSimulateRole && (
                      <button
                        id={`btn-simulate-${r.uid}`}
                        onClick={() => onSimulateRole(r.role, r.name)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all border ${
                          isSimulatingThis 
                            ? 'bg-red-600 text-white border-red-500' 
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
                        }`}
                        title="Probar comportamiento del sistema con este rol"
                      >
                        {isSimulatingThis ? '🛒 Simulado' : '🔌 Probar Módulos'}
                      </button>
                    )}

                    <button
                      id={`btn-delete-role-${r.uid}`}
                      onClick={() => handleDeleteRole(r.uid, r.name)}
                      disabled={r.uid === 'admin-demo-uid'}
                      className={`p-1.5 transition rounded-lg border border-transparent ${
                        r.uid === 'admin-demo-uid' 
                          ? 'text-slate-700 cursor-not-allowed' 
                          : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                      }`}
                      title={r.uid === 'admin-demo-uid' ? 'Administrador Maestro' : 'Eliminar Operador'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredRoles.length === 0 && (
              <div id="no-role-operators-empty" className="text-center py-8 text-slate-500">
                <HelpCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs">No se encontraron operadores registrados con el criterio especificado.</p>
              </div>
            )}
          </div>
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
        <div id="overlay-operator-crud" className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div id="operator-form-modal-body" className="bg-[#2A2A2E] rounded-2xl border border-[#3e3e42] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-[#3e3e42] flex items-center justify-between bg-[#2A2A2E]/50">
              <h3 className="text-xs font-extrabold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-500" /> Registrar Credencial Residente / Administrativa
              </h3>
              <button 
                id="btn-close-operator-form"
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-5 space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nombre Completo del Operador / Residente *</label>
                <input
                  id="input-operator-name"
                  type="text"
                  required
                  placeholder="Ej. Sgto. Claudio Barrientos"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1A1A1E] border border-[#3e3e42] text-slate-100 rounded-xl focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Correo Electrónico Institucional / Condominal *</label>
                <input
                  id="input-operator-email"
                  type="email"
                  required
                  placeholder="Ej. claudio@seguridad.local"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111115] border border-[#3e3e42] text-slate-100 rounded-xl focus:border-red-500 focus:outline-hidden"
                />
                <p className="text-[9px] text-slate-550 mt-1 font-sans">Se requiere para el enlace de sesión único por Google SSO o Portal.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Asignar Rol Funcional</label>
                <select
                  id="select-operator-role"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as SystemUserRole)}
                  className="w-full px-3 py-2 bg-[#1A1A1E] border border-[#3e3e42] text-slate-200 rounded-xl focus:border-red-500 focus:outline-hidden cursor-pointer"
                >
                  <option value={SystemUserRole.GUARD} className="bg-[#1A1A1E]" disabled>✓ Residente En Condominio (Desactivado temporalmente)</option>
                  <option value={SystemUserRole.SUPERVISOR} className="bg-[#1A1A1E]" >👮 Seguridad / Control de Accesos (Lector QR, Bitácora)</option>
                  <option value={SystemUserRole.AUDITOR} className="bg-[#1A1A1E]" disabled>🔍 Auditor de Cumplimiento (Desactivado temporalmente)</option>
                  <option value={SystemUserRole.ADMIN} className="bg-[#1A1A1E]" >🛡️ Director Administrador (Control Total Maestro)</option>
                </select>
              </div>

              <div className="p-3 bg-red-500/10 border border-red-500/15 rounded-xl flex gap-2">
                <Key className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[9.5px] text-red-350 leading-normal">
                  Los privilegios se propagan instantáneamente a los tokens de sesión. En el entorno real, el operador utilizará Google Auth vinculando este email.
                </p>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  id="btn-cancel-operator-action"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-[#1A1A1E] hover:bg-zinc-800 text-slate-350 border border-[#3e3e42] rounded-xl transition font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-operator-submit"
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition font-semibold cursor-pointer"
                >
                  Registrar Rol
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
