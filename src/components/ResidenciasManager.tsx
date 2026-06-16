/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Home, User, Shield, 
  Info, Check, X, ChevronDown, ChevronUp, Users, Calendar, Clock, 
  Sparkles, MessageSquare, QrCode, Download, Copy, ExternalLink, RefreshCw, Smartphone, Eye,
  Power
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { Residencia, Residente, AuthorizedUser, UserStatus, SystemUserRole } from '../types';
import { generateQRWithLogo } from '../utils/qrWithLogo';

interface ResidenciasManagerProps {
  onRefresh?: () => void;
  onVisitResidencia?: (residencia: Residencia) => void;
}

export default function ResidenciasManager({ onRefresh, onVisitResidencia }: ResidenciasManagerProps) {
  const [residencias, setResidencias] = useState<Residencia[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [visitantes, setVisitantes] = useState<AuthorizedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [rolesList, setRolesList] = useState<any[]>([]);
  
  // Residence Form state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNombre, setFormNombre] = useState<string>('');
  const [formAdministrador, setFormAdministrador] = useState<string>('');
  const [formNumResidencias, setFormNumResidencias] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // New admin credentials fields for creation mode
  const [formAdminUsername, setFormAdminUsername] = useState<string>('');
  const [formAdminPassword, setFormAdminPassword] = useState<string>('');
  const [formAdminPhone, setFormAdminPhone] = useState<string>('');

  // Sub-panel expanded state per Residence (managing admin credentials)
  const [expandedResidenciaId, setExpandedResidenciaId] = useState<string | null>(null);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editingAdminName, setEditingAdminName] = useState<string>('');
  const [editingAdminUsername, setEditingAdminUsername] = useState<string>('');
  const [editingAdminPassword, setEditingAdminPassword] = useState<string>('');
  const [editingAdminPhone, setEditingAdminPhone] = useState<string>('');
  const [editingAdminIsActive, setEditingAdminIsActive] = useState<boolean>(true);
  const [isSavingAdmin, setIsSavingAdmin] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'residentes' | 'visitantes'>('residentes');

  // Visitor Creation Modal State associated with a target residence
  const [isVisitorFormOpen, setIsVisitorFormOpen] = useState<boolean>(false);
  const [visitorResidencia, setVisitorResidencia] = useState<Residencia | null>(null);
  const [visitorNombre, setVisitorNombre] = useState<string>('');
  const [visitorDocumento, setVisitorDocumento] = useState<string>('');
  const [visitorTelefono, setVisitorTelefono] = useState<string>('');
  const [visitorValidFrom, setVisitorValidFrom] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [visitorValidUntil, setVisitorValidUntil] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Default 24 hours later
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [visitorStartTime, setVisitorStartTime] = useState<string>('00:00');
  const [visitorEndTime, setVisitorEndTime] = useState<string>('23:59');
  const [visitorOneTime, setVisitorOneTime] = useState<boolean>(true); // visitors default to single-use

  // Visitor QR code viewing modal state
  const [selectedVisitorQR, setSelectedVisitorQR] = useState<AuthorizedUser | null>(null);
  const [visitorQRUrl, setVisitorQRUrl] = useState<string>('');
  const [copiedVisitorToken, setCopiedVisitorToken] = useState<boolean>(false);

  // Automatically created roles credentials view state
  const [createdCredentials, setCreatedCredentials] = useState<{
    residenciaNombre: string;
    adminName: string;
    adminEmail: string;
    adminPass: string;
    adminPhone: string;
    casetaName: string;
    casetaEmail: string;
    casetaPass: string;
  } | null>(null);

  // Secure Password Generator Function
  const generateReallySecurePass = () => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const specials = "!@#$*-_";
    let pass = "";
    pass += uppercase[Math.floor(Math.random() * uppercase.length)];
    pass += lowercase[Math.floor(Math.random() * lowercase.length)];
    pass += numbers[Math.floor(Math.random() * numbers.length)];
    pass += specials[Math.floor(Math.random() * specials.length)];
    const all = uppercase + lowercase + numbers + specials;
    for (let i = 0; i < 8; i++) {
      pass += all[Math.floor(Math.random() * all.length)];
    }
    // shuffle
    return pass.split('').sort(() => 0.5 - Math.random()).join('');
  };

  const loadData = async () => {
    try {
      const resList = await dbService.getResidencias();
      setResidencias(resList);

      const resdList = await dbService.getResidentes();
      setResidentes(resdList);

      const authList = await dbService.getAuthorizedUsers();
      setVisitantes(authList);

      const rList = await dbService.getAllSystemRoles();
      setRolesList(rList);
    } catch (e) {
      console.error('Error loading data in ResidenciasManager:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update visitor QR code state when selected
  useEffect(() => {
    if (selectedVisitorQR) {
      const passUrl = `${window.location.origin}${window.location.pathname}?pass=${selectedVisitorQR.qrcodeToken}`;
      generateQRWithLogo(passUrl)
        .then(url => setVisitorQRUrl(url))
        .catch(err => console.error('Error generating visitor QR URL', err));
    } else {
      setVisitorQRUrl('');
    }
  }, [selectedVisitorQR]);

  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormNombre('');
    setFormAdministrador('');
    setFormNumResidencias(0);
    setFormIsActive(true);
    
    // Auto populate creation credential suggestions
    setFormAdminUsername('');
    setFormAdminPassword(generateReallySecurePass());
    setFormAdminPhone('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: Residencia) => {
    setEditingId(item.id);
    setFormNombre(item.nombre);
    setFormAdministrador(item.administrador);
    setFormNumResidencias(item.numResidencias);
    setFormIsActive(item.isActive);
    setIsFormOpen(true);
  };

  // Update or save specialized administrator role details
  const handleSaveAdminCredentials = async (residenciaItem: Residencia) => {
    if (!editingAdminName.trim() || !editingAdminUsername.trim() || !editingAdminPassword.trim()) {
      alert('Por favor complete el nombre, usuario y contraseña del administrador.');
      return;
    }
    
    setIsSavingAdmin(true);
    try {
      const targetUid = editingAdminId || ('operator_adm_' + Math.random().toString(36).substring(2, 9));
      const normalizedUser = editingAdminUsername.trim().toLowerCase();
      
      const updatedRole: any = {
        uid: targetUid,
        name: editingAdminName.trim(),
        email: normalizedUser.includes('@') ? normalizedUser : `${normalizedUser}@control.local`,
        role: SystemUserRole.ADMIN,
        phone: editingAdminPhone.trim(),
        password: editingAdminPassword.trim(),
        createdAt: new Date().toISOString(),
        isActive: editingAdminIsActive,
        residenciaId: residenciaItem.id,
        residenciaNombre: residenciaItem.nombre,
        username: normalizedUser
      };
      
      await dbService.saveSystemRole(updatedRole);
      
      // Also update the residencia's administrator name to match!
      if (residenciaItem.administrador !== editingAdminName.trim()) {
        await dbService.updateResidencia(residenciaItem.id, {
          administrador: editingAdminName.trim()
        });
      }
      
      alert('Credenciales de administrador actualizadas correctamente.');
      await loadData();
    } catch (err) {
      console.error('Error saving admin role:', err);
      alert('Ocurrió un error al guardar las credenciales.');
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const getAdminWhatsAppShareUrl = (resTarget: Residencia) => {
    const cleanPhone = editingAdminPhone ? editingAdminPhone.replace(/\D/g, '') : '';
    const loginUrl = `${window.location.origin}${window.location.pathname}`;
    const text = `¡Hola *${editingAdminName}*!\n\nTe comparto tus *Credenciales de Acceso* como Administrador de la residencia *${resTarget.nombre}*:\n\n🔗 *Enlace de acceso:* ${loginUrl}\n👤 *Usuario:* ${editingAdminUsername}\n🔑 *Contraseña:* ${editingAdminPassword}\n\n*Estado:* ${editingAdminIsActive ? 'ACTIVO ✓' : 'SUSPENDIDO ✗'}\n\n_Usa tus datos para ingresar al panel de administración y gestionar las visitas, condóminos y controles del fraccionamiento._`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formAdministrador.trim()) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    const payload = {
      nombre: formNombre.trim(),
      administrador: formAdministrador.trim(),
      numResidencias: formNumResidencias,
      isActive: formIsActive,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        await dbService.updateResidencia(editingId, payload);
      } else {
        const newRes = await dbService.createResidencia({
          ...payload,
          createdAt: new Date().toISOString()
        });

        // Generate clean normalized name for emails
        const cleanResName = formNombre.trim().toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
          .replace(/[^a-z0-9]/g, ''); // alphanumeric only
        
        const finalUsername = formAdminUsername.trim() || `admin.${cleanResName || 'resd'}`;
        const finalEmail = finalUsername.includes('@') ? finalUsername : `${finalUsername}@control.local`;
        const adminPass = formAdminPassword.trim() || `Admin_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const adminUid = 'operator_adm_' + Math.random().toString(36).substring(2, 9);
        const finalWhatsApp = formAdminPhone.trim();
        
        // 1. Create Admin Role for this Residence
        await dbService.saveSystemRole({
          uid: adminUid,
          name: formAdministrador.trim(),
          email: finalEmail,
          role: SystemUserRole.ADMIN,
          phone: finalWhatsApp || ('+52 55 ' + Math.floor(10000000 + Math.random() * 90000000)),
          password: adminPass,
          createdAt: new Date().toISOString(),
          isActive: true,
          residenciaId: newRes.id,
          residenciaNombre: newRes.nombre,
          username: finalUsername.toLowerCase()
        });

        // Only the administrator account is created for the new residence.
        // No casetas or supervisor profiles are pre-created, fulfilling the requirement of starting with "5" records or "0" stats.
        setCreatedCredentials({
          residenciaNombre: formNombre.trim(),
          adminName: formAdministrador.trim(),
          adminEmail: finalEmail,
          adminPass,
          adminPhone: finalWhatsApp,
          casetaName: '',
          casetaEmail: '',
          casetaPass: ''
        });
      }
      setIsFormOpen(false);
      loadData();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error saving residencia:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar permanentemente este registro de residencia?')) {
      try {
        await dbService.deleteResidencia(id);
        loadData();
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Error deleting residencia:', error);
      }
    }
  };

  const handleToggleActive = async (item: Residencia) => {
    try {
      await dbService.updateResidencia(item.id, { isActive: !item.isActive });
      loadData();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error toggling residencia state:', error);
    }
  };

  const handleToggleRowExpand = (item: Residencia) => {
    if (expandedResidenciaId === item.id) {
      setExpandedResidenciaId(null);
      setEditingAdminId(null);
    } else {
      setExpandedResidenciaId(item.id);
      
      // Auto resolve or find the matching admin role for editing
      const adminRole = rolesList.find(r => r.residenciaId === item.id && r.role === SystemUserRole.ADMIN);
      if (adminRole) {
        setEditingAdminId(adminRole.uid);
        setEditingAdminName(adminRole.name);
        setEditingAdminUsername(adminRole.username || adminRole.email || '');
        setEditingAdminPassword(adminRole.password || '');
        setEditingAdminPhone(adminRole.phone || '');
        setEditingAdminIsActive(adminRole.isActive !== false);
      } else {
        setEditingAdminId(null);
        setEditingAdminName(item.administrador);
        const cleanResName = item.nombre.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, '');
        setEditingAdminUsername(`admin.${cleanResName || 'resd'}`);
        setEditingAdminPassword(generateReallySecurePass());
        setEditingAdminPhone('');
        setEditingAdminIsActive(true);
      }
    }
  };

  // Open visitor registration for a specific residence
  const handleOpenVisitorForm = (res: Residencia) => {
    setVisitorResidencia(res);
    setVisitorNombre('');
    setVisitorDocumento('');
    setVisitorTelefono('');
    setVisitorOneTime(true);
    // Refresh datetime-local bounds dynamically at modal popup
    const d = new Date();
    setVisitorValidFrom(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setVisitorValidUntil(new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    
    setIsVisitorFormOpen(true);
  };

  // Submit new visitor pass tied to a residence
  const handleSaveVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorNombre.trim() || !visitorDocumento.trim() || !visitorResidencia) {
      alert('Por favor complete todos los campos obligatorios del visitante.');
      return;
    }

    const qrToken = 'qr_visita_' + Math.random().toString(36).substring(2, 11);

    const authUserPayload: Omit<AuthorizedUser, 'id'> = {
      name: visitorNombre.trim() + ' (Visita)',
      documentId: visitorDocumento.trim().toUpperCase(),
      email: 'visitante@local.casa',
      phone: visitorTelefono.trim(),
      status: UserStatus.ACTIVE,
      qrcodeToken: qrToken,
      oneTime: visitorOneTime,
      used: false,
      validFrom: new Date(visitorValidFrom).toISOString(),
      validUntil: new Date(visitorValidUntil).toISOString(),
      days: [], // all days
      startTime: visitorStartTime,
      endTime: visitorEndTime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin-auto',
      residenciaId: visitorResidencia.id,
      residenciaNombre: visitorResidencia.nombre
    };

    try {
      await dbService.createAuthorizedUser(authUserPayload);
      setIsVisitorFormOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to register visitor authorization profile:', err);
      alert('Error de base de datos al guardar visitante.');
    }
  };

  const handleDeleteVisitor = async (id: string, nameSim: string) => {
    if (window.confirm(`¿Está seguro de que desea revocar permanentemente el pase de visitante para "${nameSim}"?`)) {
      try {
        await dbService.deleteAuthorizedUser(id);
        loadData();
      } catch (err) {
        console.error('Error deleting visitor:', err);
      }
    }
  };

  const handleCopyVisitorPassLink = (token: string) => {
    const publicUrl = `${window.location.origin}${window.location.pathname}?pass=${token}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedVisitorToken(true);
    setTimeout(() => setCopiedVisitorToken(false), 2000);
  };

  const getVisitorWhatsAppShareUrl = (userItem: AuthorizedUser) => {
    const cleanPhone = userItem.phone ? userItem.phone.replace(/\D/g, '') : '';
    const passUrl = `${window.location.origin}${window.location.pathname}?pass=${userItem.qrcodeToken}`;
    const text = `¡Hola *${userItem.name}*!\n\nTe comparto tu *Pase Temporal Códigos QR de Entrada* para dirigirte al domicilio en *${userItem.residenciaNombre}*.\n\nPresiona el siguiente enlace para abrir tu credencial QR de entrada:\n${passUrl}`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const filteredItems = residencias.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.administrador.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1e1e24] p-6 rounded-2xl border border-[#2e2e38] shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Home className="w-5 h-5 text-red-500" /> Registro de Residencia
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Administre los fraccionamientos, condominios y registre visitas o consulte el padrón de residentes asociados automáticamente de manera sincronizada.
          </p>
        </div>
        <button
          onClick={handleOpenCreateForm}
          className="flex items-center justify-center gap-2 bg-red-650 hover:bg-red-500 text-white font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-red-600/10"
        >
          <Plus className="w-4 h-4" /> Registrar Residencia
        </button>
      </div>

      {/* Search and counters */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o administrador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1e1e24] border border-[#2e2e38] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium placeholder-slate-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="bg-[#1e1e24] border border-[#2e2e38] px-3 py-1.5 rounded-lg">
            Fraccionamientos: <strong className="text-white">{residencias.length}</strong>
          </span>
          <span className="bg-[#1e1e24] border border-[#2e2e38] px-3 py-1.5 rounded-lg">
            Activos: <strong className="text-emerald-500">{residencias.filter(r => r.isActive).length}</strong>
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#18181c] border border-[#2e2e38] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e1e24]/60 border-b border-[#2e2e38] text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-6">Residencia / Fraccionamiento</th>
                <th className="py-4 px-6">Administrador</th>
                <th className="py-4 px-4 text-center">Nº Residencias</th>
                <th className="py-4 px-4 text-center">Estado</th>
                <th className="py-4 px-4 text-center">Credenciales Admin</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e38] text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                   <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    {searchTerm ? 'No se encontraron resultados para la búsqueda.' : 'No hay residencias registradas en este momento.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isExpanded = expandedResidenciaId === item.id;

                  return (
                    <React.Fragment key={item.id}>
                      <tr className={`hover:bg-[#1e1e24]/30 transition-all ${isExpanded ? 'bg-[#1e1e24]/40' : ''}`}>
                        <td className="py-4 px-6 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                              <Home className="w-4 h-4" />
                            </div>
                            <div>
                              <span>{item.nombre}</span>
                              <span className="block text-[9.5px] text-slate-500 font-normal mt-0.5">ID: {item.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-300 font-medium">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            {item.administrador}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center text-slate-350 font-mono font-bold">
                          {item.numResidencias}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleToggleActive(item)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              item.isActive
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/15 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {item.isActive ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" /> Activo
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" /> Inactivo
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleToggleRowExpand(item)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              isExpanded 
                                ? 'bg-blue-600 text-white border-transparent shadow shadow-blue-500/10' 
                                : 'bg-[#1e1e24] text-blue-400 border-[#2e2e38] hover:border-blue-500/40'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                            <span>Ver Credenciales</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {onVisitResidencia && (
                              <button
                                onClick={() => onVisitResidencia(item)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#2e2e38] bg-[#1e1e24] text-red-400 hover:bg-red-650 hover:text-white hover:border-transparent transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                title="Visitar Residencia"
                              >
                                <Eye className="w-4 h-4 text-red-500 hover:text-inherit" />
                                <span>Visitar Residencia</span>
                              </button>
                            )}
                            <button
                              id={`btn-toggle-active-res-${item.id}`}
                              onClick={() => handleToggleActive(item)}
                              className={`p-2 rounded-lg transition-all ${
                                item.isActive 
                                  ? 'text-emerald-500 hover:text-red-400 hover:bg-red-500/10' 
                                  : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                              title={item.isActive ? "Desactivar Residencia" : "Activar Residencia"}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditForm(item)}
                              className="p-2 text-slate-400 hover:text-white hover:bg-[#1e1e24] rounded-lg transition-all"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-slate-400 hover:text-red-450 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable sub-panel showing administrator credentials controls */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-[#111115] p-6 border-b border-[#2e2e38] animate-fade-in">
                            <div className="border border-[#2e2e38] bg-[#15151a] p-5 rounded-2xl space-y-5 text-left">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2e2e38] pb-3">
                                <div className="flex items-center gap-3">
                                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                    <Shield className="w-4 h-4 text-blue-500" />
                                    Gestionar Credenciales de Administración
                                  </h4>
                                  <span className="text-[10px] bg-[#1e1e24] border border-[#2e2e38] text-slate-400 px-2.5 py-0.5 rounded font-bold font-mono">
                                    Coto: {item.nombre}
                                  </span>
                                </div>
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                  editingAdminIsActive 
                                    ? 'bg-emerald-555/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-red-555/10 text-red-400 border border-red-550/20'
                                }`}>
                                  {editingAdminIsActive ? 'Acceso Activo ✓' : 'Acceso Suspendido ✗'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                                      Nombre Completo del Administrador *
                                    </label>
                                    <input
                                      type="text"
                                      value={editingAdminName}
                                      onChange={(e) => setEditingAdminName(e.target.value)}
                                      className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium transition-all"
                                      placeholder="Ej. Ing. Alejandro Ruiz"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                                      Nombre de Usuario (Para Login) *
                                    </label>
                                    <input
                                      type="text"
                                      value={editingAdminUsername}
                                      onChange={(e) => setEditingAdminUsername(e.target.value)}
                                      className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono tracking-tight transition-all"
                                      placeholder="Ej. admin_coto"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                      <span>Contraseña de Acceso *</span>
                                      <button
                                        type="button"
                                        onClick={() => setEditingAdminPassword(generateReallySecurePass())}
                                        className="text-[9px] text-blue-450 hover:text-blue-300 font-bold uppercase hover:underline flex items-center gap-1 cursor-pointer"
                                      >
                                        <Sparkles className="w-3 h-3 text-blue-500" /> Generar Segura
                                      </button>
                                    </label>
                                    <input
                                      type="text"
                                      value={editingAdminPassword}
                                      onChange={(e) => setEditingAdminPassword(e.target.value)}
                                      className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold transition-all"
                                      placeholder="Contraseña residencial"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                                      Número de WhatsApp del Administrador
                                    </label>
                                    <input
                                      type="tel"
                                      value={editingAdminPhone}
                                      onChange={(e) => setEditingAdminPhone(e.target.value)}
                                      className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono transition-all"
                                      placeholder="Ej. 5213344556677"
                                    />
                                    <p className="text-[9px] text-slate-500 mt-1">Ingresa código de país sin espacios ni símbolos (+521...)</p>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-[#2e2e38]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingAdminIsActive(!editingAdminIsActive)}
                                    className={`inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide cursor-pointer transition-all border ${
                                      editingAdminIsActive
                                        ? 'bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20'
                                        : 'bg-[#1a2d24] text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25'
                                    }`}
                                  >
                                    {editingAdminIsActive ? 'Suspender Credenciales' : 'Habilitar Cuenta'}
                                  </button>
                                </div>

                                <div className="flex items-center gap-2.5">
                                  {editingAdminPhone && (
                                    <a
                                      href={getAdminWhatsAppShareUrl(item)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white rounded-xl text-xs font-extrabold uppercase tracking-wide shadow-lg shadow-emerald-500/10 transition cursor-pointer"
                                      title="Compartir credenciales de acceso vía WhatsApp"
                                    >
                                      <MessageSquare className="w-4 h-4" /> Compartir por WhatsApp
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleSaveAdminCredentials(item)}
                                    disabled={isSavingAdmin}
                                    className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-blue-500/10"
                                  >
                                    {isSavingAdmin ? 'Guardando...' : 'Guardar Cambios ✓'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Residence Form Overlay Modal (Original) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#18181c] border border-[#2e2e38] rounded-2.5xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4.5 bg-[#1e1e24] border-b border-[#2e2e38]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {editingId ? 'Editar Residencia' : 'Registrar Residencia'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-[#282830] rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nombre de la residencia / Fraccionamiento *
                </label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej. Coto de los Encinos"
                  className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium placeholder-slate-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nombre del Administrador *
                </label>
                <input
                  type="text"
                  required
                  value={formAdministrador}
                  onChange={(e) => setFormAdministrador(e.target.value)}
                  placeholder="Ej. Alejandro Ruiz"
                  className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium placeholder-slate-600 transition-all"
                />
              </div>

              {!editingId && (
                <>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Nombre de Usuario (Para el administrador)
                    </label>
                    <input
                      type="text"
                      value={formAdminUsername}
                      onChange={(e) => setFormAdminUsername(e.target.value)}
                      placeholder="Ej. admin.encinos"
                      className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono placeholder-slate-600 transition-all"
                    />
                    <p className="text-[9.5px] text-slate-500 mt-1">Si lo dejas vacío, se creará uno de acceso automático basado en el fraccionamiento.</p>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Contraseña de Acceso *</span>
                      <button
                        type="button"
                        onClick={() => setFormAdminPassword(generateReallySecurePass())}
                        className="text-[9.5px] text-red-500 hover:text-red-410 font-bold uppercase hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-red-500" /> Generar otra segura
                      </button>
                    </label>
                    <input
                      type="text"
                      required
                      value={formAdminPassword}
                      onChange={(e) => setFormAdminPassword(e.target.value)}
                      placeholder="Escribe o genera una contraseña segura"
                      className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono font-bold placeholder-slate-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Número de WhatsApp del Administrador
                    </label>
                    <input
                      type="tel"
                      value={formAdminPhone}
                      onChange={(e) => setFormAdminPhone(e.target.value)}
                      placeholder="Ej. 5213344556677"
                      className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono placeholder-slate-600 transition-all font-sans"
                    />
                    <p className="text-[9.5px] text-slate-500 mt-1">Código de país seguido del número sin espacios (+521...).</p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Número de residencias / Unidades *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formNumResidencias}
                  onChange={(e) => setFormNumResidencias(parseInt(e.target.value) || 0)}
                  placeholder="Ej. 120"
                  className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium placeholder-slate-600 font-mono transition-all"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 focus:ring-transparent bg-[#111115] border-[#2e2e38]"
                  />
                  <span className="text-xs text-slate-300 font-medium">Habilitar / Activar coto o condominio</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2e2e38]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-red-650 hover:bg-red-550 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/10 cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visitor Registration Form Modal associated specifically with a subdivision residence */}
      {isVisitorFormOpen && visitorResidencia && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#18181c] border border-[#2e2e38] rounded-2.5xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4.5 bg-[#1e1e24] border-b border-[#2e2e38]">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Registrar Visita</h3>
                <span className="text-[10px] text-slate-400">Dirigido a: 🏡 {visitorResidencia.nombre}</span>
              </div>
              <button
                onClick={() => setIsVisitorFormOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-[#282830] rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVisitor} className="p-6 space-y-4">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nombre Completo del Visitante *
                </label>
                <input
                  type="text"
                  required
                  value={visitorNombre}
                  onChange={(e) => setVisitorNombre(e.target.value)}
                  placeholder="Ej. Juan Carlos López"
                  className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium placeholder-slate-600 transition-all font-sans"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Documento de Identificación (IFE / RFC / Licencia) *
                </label>
                <input
                  type="text"
                  required
                  value={visitorDocumento}
                  onChange={(e) => setVisitorDocumento(e.target.value)}
                  placeholder="Ej. JCL-140685"
                  className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium placeholder-slate-600 uppercase transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Número de WhatsApp (Opcional - para enviar QR)
                </label>
                <input
                  type="tel"
                  value={visitorTelefono}
                  onChange={(e) => setVisitorTelefono(e.target.value)}
                  placeholder="Ej. +5215587654321"
                  className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium placeholder-slate-600 transition-all font-mono"
                />
                <p className="text-[9.5px] text-slate-500 mt-1">Código de país seguido del número sin espacios (+521...).</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-1">
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Válido Desde
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={visitorValidFrom}
                    onChange={(e) => setVisitorValidFrom(e.target.value)}
                    className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-all cursor-pointer font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Válido Hasta (Expiración)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={visitorValidUntil}
                    onChange={(e) => setVisitorValidUntil(e.target.value)}
                    className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-all cursor-pointer font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-1">
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Hora Entrada Mínima
                  </label>
                  <input
                    type="text"
                    required
                    value={visitorStartTime}
                    onChange={(e) => setVisitorStartTime(e.target.value)}
                    placeholder="00:00"
                    className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-3 py-2 text-xs text-white text-center focus:outline-none focus:border-red-500 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Hora Entrada Máxima
                  </label>
                  <input
                    type="text"
                    required
                    value={visitorEndTime}
                    onChange={(e) => setVisitorEndTime(e.target.value)}
                    placeholder="23:59"
                    className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-3 py-2 text-xs text-white text-center focus:outline-none focus:border-red-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 bg-[#111115] p-3 rounded-xl border border-[#2e2e38]/50">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={visitorOneTime}
                    onChange={(e) => setVisitorOneTime(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 focus:ring-transparent bg-[#111115] border-[#2e2e38]"
                  />
                  <span className="text-xs text-slate-350 font-bold uppercase tracking-wide">Pase de un solo uso</span>
                </label>
                <p className="text-[10px] text-zinc-500 mt-1 ml-6.5">
                  Si se activa, el código QR se invalidará y marcará como canjeado automáticamente después de que el guardia de la caseta realice el escaneo una vez. Ideal para proveedores de servicios o mudanzas.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2e2e38]">
                <button
                  type="button"
                  onClick={() => setIsVisitorFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-red-650 hover:bg-red-550 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/10 cursor-pointer"
                >
                  Emitir Pase de Visita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visitor QR Pass phone screen Modal */}
      {selectedVisitorQR && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] bg-slate-900 border-4 border-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center p-5 pt-10 pb-6 border-b-8 animate-scale-in select-none">
            {/* Bezel Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4.5 bg-slate-950 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mr-2"></div>
              <div className="w-12 h-1 bg-slate-850 rounded"></div>
            </div>

            <div className="w-full text-center border-b border-slate-800/80 pb-3 mb-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Pase Temporal 🚗</span>
              <h4 className="text-white text-xs font-bold mt-0.5">Control de Acceso Electrónico</h4>
            </div>

            <div className="w-full bg-[#0b0f19] border border-slate-805/80 rounded-2xl p-4 flex flex-col items-center relative">
              {/* Scan status */}
              <div className="w-full flex items-center justify-between mb-3 text-[9.5px]">
                <span className="flex items-center gap-1 text-emerald-400 font-extrabold uppercase font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Activo
                </span>
                <span className="text-slate-400 font-mono">Visita CNLS</span>
              </div>

              {/* QR Image Frame */}
              <div className="relative w-48 h-48 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden border-2 border-slate-700/40">
                {visitorQRUrl ? (
                  <img 
                    referrerPolicy="no-referrer"
                    src={visitorQRUrl} 
                    alt="Visitor Pass QR Code" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                    <span className="text-[9px] text-slate-400">Firmando ficha...</span>
                  </div>
                )}
                {/* Visual Scanner laser overlay */}
                <div className="absolute left-0 right-0 h-0.5 bg-red-500/55 shadow-[0_0_12px_#ef4444] animate-bounce pointer-events-none" style={{ top: '10%' }}></div>
              </div>

              {/* Card Details */}
              <div className="w-full mt-4 space-y-2 border-t border-slate-800/60 pt-3 text-left font-sans">
                <div>
                  <label className="block text-[8px] uppercase tracking-widest font-bold text-slate-500 font-mono">Nombre de Visita</label>
                  <span className="text-[12.5px] font-bold text-white tracking-tight">{selectedVisitorQR.name}</span>
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-widest font-bold text-slate-500 font-mono">Identificación oficial</label>
                  <span className="text-[10.5px] font-bold text-slate-300 font-mono">{selectedVisitorQR.documentId}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div>
                    <label className="block text-[8px] uppercase tracking-widest font-bold text-slate-500 font-mono">Destino</label>
                    <span className="text-[10.5px] font-bold text-red-400">{selectedVisitorQR.residenciaNombre}</span>
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase tracking-widest font-bold text-slate-500 font-mono font-sans">Pase tipo</label>
                    <span className="text-[10.5px] font-bold text-slate-350">{selectedVisitorQR.oneTime ? 'Un solo uso' : 'Acceso libre'}</span>
                  </div>
                </div>
                <div className="border-t border-slate-800/40 pt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] uppercase tracking-widest font-bold text-slate-500 font-mono">Vence</label>
                    <span className="text-[9px] font-semibold text-slate-400">{new Date(selectedVisitorQR.validUntil).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase tracking-widest font-bold text-slate-500 font-mono">Horario</label>
                    <span className="text-[9px] font-mono font-semibold text-red-405">{selectedVisitorQR.startTime} - {selectedVisitorQR.endTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Share button inside card */}
            <a
              href={getVisitorWhatsAppShareUrl(selectedVisitorQR)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl mt-4 transition-all shadow-lg hover:scale-[1.02] cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" /> Compartir en WhatsApp
            </a>

            {/* Wallet toolbar copy/download/close controls */}
            <div className="w-full grid grid-cols-3 gap-2 mt-4 font-sans text-slate-400 text-[9px] font-extrabold uppercase tracking-wider">
              <button
                onClick={() => handleCopyVisitorPassLink(selectedVisitorQR.qrcodeToken)}
                className="flex flex-col items-center gap-1 p-2 border border-slate-800 rounded-xl bg-slate-950/40 hover:bg-slate-955 hover:text-white transition-all cursor-pointer text-center"
              >
                {copiedVisitorToken ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-red-500" /> Copiar Link
                  </>
                )}
              </button>
              
              <a
                href={visitorQRUrl}
                download={`Pase-Visita-${selectedVisitorQR.name.trim().replace(/\s+/g, '-')}.png`}
                className="flex flex-col items-center gap-1 p-2 border border-slate-800 rounded-xl bg-slate-950/40 hover:bg-slate-955 hover:text-white transition-all cursor-pointer text-center"
              >
                <Download className="w-4 h-4 text-red-500" /> Descargar
              </a>

              <button
                onClick={() => setSelectedVisitorQR(null)}
                className="flex flex-col items-center gap-1 p-2 border border-slate-800 rounded-xl bg-slate-950/40 hover:bg-slate-955 hover:text-white transition-all cursor-pointer text-center"
              >
                <X className="w-4 h-4 text-slate-500" /> Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal: Automatically Created Credentials info */}
      {createdCredentials && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#18181c] border border-emerald-500/30 rounded-2.5xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center gap-3 px-6 py-4.5 bg-[#1a2e26] border-b border-emerald-500/20 text-emerald-400">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">¡Residencia y Roles Creados con Éxito!</h3>
                <span className="text-[10px] text-emerald-300/80">Proceso automatizado ejecutado perfectamente.</span>
              </div>
            </div>

            <div className="p-6 space-y-5 font-sans">
              <div className="bg-[#111115] border border-[#2e2e38] p-4 rounded-xl space-y-1 text-left">
                <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest font-mono">Residencia Registrada</span>
                <p className="text-base font-extrabold text-white">🏡 {createdCredentials.residenciaNombre}</p>
                <p className="text-xs text-slate-400 mt-1">Se han generado las siguientes credenciales de acceso para esta subdivisión:</p>
              </div>

              <div className={createdCredentials.casetaEmail ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                {/* 1. Admin Role Credentials */}
                <div className="bg-[#1e1e24]/40 border border-[#2e2e38] p-4 rounded-xl space-y-2 relative text-left">
                  <div className="absolute top-3.5 right-3.5 px-2 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                    Director Admin
                  </div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 pt-0.5">
                    <Shield className="w-3.5 h-3.5 text-red-500" /> {createdCredentials.adminName.split(' (Admin')[0]}
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-500 block">Usuario / Correo:</span>
                      <code className="text-red-300 font-mono text-[11px] block select-all bg-black/30 px-2 py-1 rounded mt-0.5 border border-zinc-800">{createdCredentials.adminEmail}</code>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Contraseña de acceso:</span>
                      <code className="text-emerald-400 font-mono text-[11px] font-bold block select-all bg-black/30 px-2 py-1 rounded mt-0.5 border border-zinc-800">{createdCredentials.adminPass}</code>
                    </div>
                  </div>
                </div>

                {/* 2. Guard / Caseta Credentials */}
                {createdCredentials.casetaEmail && (
                  <div className="bg-[#1e1e24]/40 border border-[#2e2e38] p-4 rounded-xl space-y-2 relative text-left">
                    <div className="absolute top-3.5 right-3.5 px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Caseta / Guardia
                    </div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5 pt-0.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-500" /> {createdCredentials.casetaName}
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-500 block">Usuario / Correo:</span>
                        <code className="text-amber-300 font-mono text-[11px] block select-all bg-black/30 px-2 py-1 rounded mt-0.5 border border-zinc-800">{createdCredentials.casetaEmail}</code>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Contraseña de acceso:</span>
                        <code className="text-emerald-400 font-mono text-[11px] font-bold block select-all bg-black/30 px-2 py-1 rounded mt-0.5 border border-zinc-800">{createdCredentials.casetaPass}</code>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-xl flex items-start gap-2.5 text-left">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Estas credenciales han sido dadas de alta en el servidor central. El Administrador ya puede acceder de forma independiente para configurar sus propias casetas de vigilancia, dar de alta vigilantes y registrar a sus respectivos residentes.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[#2e2e38]">
                {createdCredentials.adminPhone && (
                  <a
                    href={`https://wa.me/${createdCredentials.adminPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola *${createdCredentials.adminName}*!\n\nTe comparto tus *Credenciales de Acceso* como Administrador de la residencia *${createdCredentials.residenciaNombre}*:\n\n🔗 *Enlace de acceso:* ${window.location.origin}${window.location.pathname}\n👤 *Usuario:* ${createdCredentials.adminEmail}\n🔑 *Contraseña:* ${createdCredentials.adminPass}\n\n_Guarda estos datos para ingresar y comenzar a dar de alta sus vigilantes y residentes._`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-750 hover:bg-emerald-600 text-emerald-100 rounded-xl text-xs font-semibold cursor-pointer border border-emerald-500/20 shadow transition"
                  >
                    <MessageSquare className="w-4 h-4" /> Compartir WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const textToCopy = createdCredentials.casetaEmail 
                      ? `Residencia: ${createdCredentials.residenciaNombre}\n\n1. ROL DIRECTOR ADMINISTRADOR:\nUsuario: ${createdCredentials.adminEmail}\nContraseña: ${createdCredentials.adminPass}\n\n2. ROL VIGILANCIA / CASETA:\nUsuario: ${createdCredentials.casetaEmail}\nContraseña: ${createdCredentials.casetaPass}`
                      : `Residencia: ${createdCredentials.residenciaNombre}\n\nROL DIRECTOR ADMINISTRADOR:\nUsuario: ${createdCredentials.adminEmail}\nContraseña: ${createdCredentials.adminPass}`;
                    navigator.clipboard.writeText(textToCopy);
                    alert('¡Credenciales copiadas al portapapeles!');
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#1d1d23] hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer border border-[#2e2e38] transition"
                >
                  <Copy className="w-4 h-4" /> Copiar Todo
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedCredentials(null)}
                  className="bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-xs uppercase tracking-wide px-5 py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  Entendido y Guardado ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
