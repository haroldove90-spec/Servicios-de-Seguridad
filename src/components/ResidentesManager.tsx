/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, QrCode, Download, Copy, Check, X, 
  MapPin, User, Home, Shield, Smartphone, ExternalLink, Sparkles, RefreshCw,
  MessageSquare, Share2, Eye, EyeOff, Lock, UserCheck, Key
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { Residente, Residencia, AuthorizedUser, UserStatus, SystemRole, SystemUserRole } from '../types';
import { generateQRWithLogo } from '../utils/qrWithLogo';

interface ResidentesManagerProps {
  onRefresh?: () => void;
  currentUser?: any;
}

export default function ResidentesManager({ onRefresh, currentUser }: ResidentesManagerProps) {
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [residencias, setResidencias] = useState<Residencia[]>([]);
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNombre, setFormNombre] = useState<string>('');
  const [formResidenciaId, setFormResidenciaId] = useState<string>('');
  const [formDireccion, setFormDireccion] = useState<string>('');
  const [formWhatsapp, setFormWhatsapp] = useState<string>('');
  const [formUsername, setFormUsername] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [showFormPassword, setShowFormPassword] = useState<boolean>(false);
  const [formCreateQR, setFormCreateQR] = useState<boolean>(true); // Generar QR automáticamente
  const [formValidUntil, setFormValidUntil] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 365); // Default: 1 year validity
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  // QR Modal Overlay
  const [selectedResidentQR, setSelectedResidentQR] = useState<Residente | null>(null);
  const [generatedQRUrl, setGeneratedQRUrl] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [formIsVisitor, setFormIsVisitor] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmNombre, setDeleteConfirmNombre] = useState<string>('');

  const loadData = async () => {
    try {
      const resList = await dbService.getResidencias();
      // Only show active complexes in select menus
      setResidencias(resList);

      const resdList = await dbService.getResidentes();
      setResidentes(resdList);

      const authList = await dbService.getAuthorizedUsers();
      setAuthorizedUsers(authList);

      const rolesList = await dbService.getAllSystemRoles();
      setSystemRoles(rolesList);
    } catch (error) {
      console.error('Error loading data in ResidentesManager:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update QR code when resident is clicked
  useEffect(() => {
    if (selectedResidentQR) {
      const passUrl = `${window.location.origin}${window.location.pathname}?pass=${selectedResidentQR.qrcodeToken}`;
      generateQRWithLogo(passUrl)
        .then(url => setGeneratedQRUrl(url))
        .catch(err => console.error('Error generating QR', err));
    } else {
      setGeneratedQRUrl('');
    }
  }, [selectedResidentQR]);

  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormNombre('');
    // Default to first active complex if available, or active visited residence
    const activeRes = currentUser?.residenciaId 
      ? residencias.find(r => r.id === currentUser.residenciaId)
      : residencias.find(r => r.isActive);
    setFormResidenciaId(activeRes?.id || currentUser?.residenciaId || '');
    setFormDireccion('');
    setFormWhatsapp('');
    setFormUsername('residente_' + Math.floor(1000 + Math.random() * 9000));
    setFormPassword('Residente_123');
    setShowFormPassword(false);
    setFormCreateQR(true);
    setFormIsVisitor(false);
    
    // Set default validity to 1 year
    const d = new Date();
    d.setDate(d.getDate() + 365);
    setFormValidUntil(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: Residente) => {
    setEditingId(item.id);
    const cleanName = item.nombre.replace(/\s*\(Visita\)/g, '').replace(/\s*\(Residente\)/g, '').trim();
    setFormNombre(cleanName);
    setFormResidenciaId(item.residenciaId);
    setFormDireccion(item.direccion);
    setFormWhatsapp(item.whatsapp || '');
    setFormCreateQR(!!item.qrcodeToken);

    // Look up linked SystemRole or credential
    const linkedRole = systemRoles.find(r => 
      r.uid === item.accessUserId || 
      r.username?.toLowerCase() === item.username?.toLowerCase() ||
      (r.role === SystemUserRole.RESIDENTE && r.name.toLowerCase() === cleanName.toLowerCase())
    );

    setFormUsername(linkedRole?.username || item.username || ('residente_' + Math.floor(1000 + Math.random() * 9000)));
    setFormPassword(linkedRole?.password || item.password || 'Residente_123');
    setShowFormPassword(false);

    // Try to load linked AuthorizedUser validUntil or fallback to 1 year from now
    const linkedUser = authorizedUsers.find(u => u.id === item.accessUserId || (item.qrcodeToken && u.qrcodeToken === item.qrcodeToken));
    const isVis = linkedUser?.name.includes('(Visita)') || item.nombre.includes('(Visita)') || false;
    setFormIsVisitor(isVis);

    if (linkedUser && linkedUser.validUntil) {
      const d = new Date(linkedUser.validUntil);
      setFormValidUntil(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 365);
      setFormValidUntil(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    }

    setIsFormOpen(true);
  };

  const handleSaveResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formResidenciaId || !formDireccion.trim()) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    const matchedComplex = residencias.find(r => r.id === formResidenciaId);
    if (!matchedComplex) {
      alert('La residencia o condominio de destino no es válida.');
      return;
    }

    const cleanName = formNombre.replace(/\s*\(Visita\)/g, '').replace(/\s*\(Residente\)/g, '').trim();
    const cleanUsername = formUsername.trim().toLowerCase() || ('residente_' + Math.floor(1000 + Math.random() * 9000));
    const cleanPassword = formPassword.trim() || 'Residente_123';

    // Generate or use existing QR token
    let qrToken = '';
    let accessUserId = '';

    if (formCreateQR) {
      if (editingId) {
        const found = residentes.find(r => r.id === editingId);
        qrToken = found?.qrcodeToken || 'resd_qr_' + Math.random().toString(36).substring(2, 11);
        accessUserId = found?.accessUserId || 'usr_resd_' + Math.random().toString(36).substring(2, 11);
      } else {
        qrToken = 'resd_qr_' + Math.random().toString(36).substring(2, 11);
        accessUserId = 'usr_resd_' + Math.random().toString(36).substring(2, 11);
      }

      // Synchronously record/update in authorized_users (so Guard scans are valid instantly!)
      const startOfYear = new Date();
      const endOfYear = new Date(formValidUntil);

      const authUserPayload: Omit<AuthorizedUser, 'id'> = {
        name: cleanName + (formIsVisitor ? ' (Visita)' : ' (Residente)'),
        documentId: 'RESID-' + matchedComplex.nombre.substring(0, 3).toUpperCase() + '-' + formDireccion.trim().replace(/\s+/g, '-').toUpperCase(),
        email: formIsVisitor ? 'visita@local.casa' : `${cleanUsername}@residente.local`,
        phone: formWhatsapp.trim(),
        status: UserStatus.ACTIVE,
        qrcodeToken: qrToken,
        oneTime: false,
        used: false,
        validFrom: startOfYear.toISOString(),
        validUntil: endOfYear.toISOString(),
        days: [], // all days
        startTime: '00:00',
        endTime: '23:59',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin-auto',
        residenciaId: matchedComplex.id,
        residenciaNombre: matchedComplex.nombre
      };

      try {
        const existingAuthUser = authorizedUsers.find(u => u.id === accessUserId || (qrToken && u.qrcodeToken === qrToken));
        if (existingAuthUser) {
          accessUserId = existingAuthUser.id;
          await dbService.updateAuthorizedUser(accessUserId, authUserPayload);
        } else {
          // Create new record
          const createdUser = await dbService.createAuthorizedUser(authUserPayload);
          accessUserId = createdUser.id;
        }
      } catch (err) {
        console.error('Failed to register access profile:', err);
      }
    }

    // Save/Update SystemRole credential for resident app login
    const systemRolePayload: SystemRole = {
      uid: accessUserId || ('usr_resd_' + Math.random().toString(36).substring(2, 11)),
      name: cleanName,
      email: formWhatsapp.trim() ? `${cleanUsername}@residente.local` : 'residente@local.casa',
      username: cleanUsername,
      password: cleanPassword,
      role: SystemUserRole.RESIDENTE,
      isActive: true,
      phone: formWhatsapp.trim(),
      residenciaId: matchedComplex.id,
      residenciaNombre: matchedComplex.nombre,
      createdAt: new Date().toISOString()
    };

    try {
      await dbService.saveSystemRole(systemRolePayload);
    } catch (roleErr) {
      console.warn('Error saving resident system role credentials:', roleErr);
    }

    const payload = {
      nombre: cleanName + (formIsVisitor ? ' (Visita)' : ''),
      residenciaId: formResidenciaId,
      residenciaNombre: matchedComplex.nombre,
      direccion: formDireccion.trim(),
      qrcodeToken: qrToken,
      whatsapp: formWhatsapp.trim(),
      accessUserId: accessUserId,
      validUntil: new Date(formValidUntil).toISOString(),
      username: cleanUsername,
      password: cleanPassword,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        await dbService.updateResidente(editingId, payload);
      } else {
        await dbService.createResidente({
          ...payload,
          createdAt: new Date().toISOString()
        });
      }
      setIsFormOpen(false);
      loadData();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error saving resident:', error);
    }
  };

  const handleDelete = (item: Residente) => {
    setDeleteConfirmId(item.id);
    setDeleteConfirmNombre(item.nombre);
  };

  const handleConfirmDeleteResidente = async () => {
    if (deleteConfirmId) {
      const item = residentes.find(r => r.id === deleteConfirmId);
      if (item) {
        try {
          if (item.accessUserId) {
            await dbService.deleteAuthorizedUser(item.accessUserId);
            await dbService.deleteSystemRole(item.accessUserId);
          }
          await dbService.deleteResidente(item.id);
          loadData();
          if (onRefresh) onRefresh();
        } catch (error) {
          console.error('Error deleting resident:', error);
        }
      }
      setDeleteConfirmId(null);
      setDeleteConfirmNombre('');
    }
  };

  const handleCopyQRLink = (token: string) => {
    // Generates a fully compliant mobile pass URL
    const publicUrl = `${window.location.origin}${window.location.pathname}?pass=${token}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const getWhatsAppShareUrl = (item: Residente) => {
    const cleanPhone = item.whatsapp ? item.whatsapp.replace(/\D/g, '') : '';
    const passUrl = `${window.location.origin}${window.location.pathname}?pass=${item.qrcodeToken}`;
    const portalUrl = 'https://servicios-de-seguridad.vercel.app/residente';

    const linkedRole = systemRoles.find(r => 
      r.uid === item.accessUserId || 
      r.username?.toLowerCase() === item.username?.toLowerCase() ||
      (r.role === SystemUserRole.RESIDENTE && r.name.toLowerCase().includes(item.nombre.toLowerCase().replace(/\s*\(visita\)/g, '')))
    );

    const usr = linkedRole?.username || item.username || 'condominio';
    const pwd = linkedRole?.password || item.password || 'Condominio_123';

    const text = `¡Hola *${item.nombre}*!\n\nTe comparto tus datos de acceso al portal de *${item.residenciaNombre}* (Domicilio: *${item.direccion}*):\n\n🌐 *LINK DE ACCESO A TU ROL RESIDENTE AUTOGESTIÓN:*\n${portalUrl}\n\n🔑 *TUS CREDENCIALES DE ACCESO EN LA APP:*\n• *Nombre de Usuario:* ${usr}\n• *Contraseña Segura:* ${pwd}\n\n🪪 *ENLACE DIRECTO Y PASE QR PERMANENTE:*\n${passUrl}`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const filteredItems = residentes.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.residenciaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.direccion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResidence = currentUser?.residenciaId ? item.residenciaId === currentUser.residenciaId : true;
    return matchesSearch && matchesResidence;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1e1e24] p-6 rounded-2xl border border-[#2e2e38] shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-red-500" /> Registro de Residente
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestione el censo de residentes, asigne sus domicilios y genere sus pases QR fijos automáticos para permitir el paso en caseta.
          </p>
        </div>
        <button
          onClick={handleOpenCreateForm}
          className="flex items-center justify-center gap-2 bg-red-650 hover:bg-red-500 text-white font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-red-600/10"
        >
          <Plus className="w-4 h-4" /> Registrar Residente
        </button>
      </div>

      {/* Search and counters */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por residente, fraccionamiento o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1e1e24] border border-[#2e2e38] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium placeholder-slate-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="bg-[#1e1e24] border border-[#2e2e38] px-3 py-1.5 rounded-lg">
            Residentes: <strong className="text-white">{residentes.length}</strong>
          </span>
          <span className="bg-[#1e1e24] border border-[#2e2e38] px-3 py-1.5 rounded-lg">
            Pases Activos: <strong className="text-emerald-500">{residentes.filter(r => !!r.qrcodeToken).length}</strong>
          </span>
        </div>
      </div>

      {/* Grid rendering for Residents */}
      <div className="bg-[#18181c] border border-[#2e2e38] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e1e24]/60 border-b border-[#2e2e38] text-[10.5px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                <th className="py-4 px-6">Residente</th>
                <th className="py-4 px-6">Ubicación / Fraccionamiento</th>
                <th className="py-4 px-6">Dirección / Casa</th>
                <th className="py-4 px-6 text-center">WhatsApp / Enviar</th>
                <th className="py-4 px-6 text-center">Acceso QR</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e38] text-xs font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    {searchTerm ? 'No se encontraron resultados para la búsqueda.' : 'No hay residentes registrados en este momento.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1e1e24]/30 transition-all">
                    <td className="py-4 px-6 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span>{item.nombre}</span>
                          <span className="block text-[9.5px] text-slate-500 font-normal mt-0.5">ID: {item.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Home className="w-3.5 h-3.5 text-slate-500" />
                        {item.residenciaNombre}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {item.direccion}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {item.whatsapp ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-slate-300 font-semibold font-mono text-[10px] break-all">{item.whatsapp}</span>
                          <a
                            href={getWhatsAppShareUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-450 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border border-emerald-500/25"
                            title="Compartir Pase por WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-400" /> Compartir
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-600 block text-[10px] italic">Sin WhatsApp</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {item.qrcodeToken ? (
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => setSelectedResidentQR(item)}
                            className="inline-flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" /> Ver Código QR
                          </button>
                          {(() => {
                            const user = authorizedUsers.find(u => u.id === item.accessUserId || u.qrcodeToken === item.qrcodeToken);
                            if (user && user.validUntil) {
                              const isExpired = new Date(user.validUntil) < new Date();
                              return (
                                <span className={`text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded ${
                                  isExpired ? 'bg-red-500/15 text-red-400 font-extrabold border border-red-500/20' : 'text-slate-500'
                                }`}>
                                  Expira: {new Date(user.validUntil).toLocaleDateString()}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono text-[10px]">Sin Pase Emitido</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditForm(item)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-[#1e1e24] rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-slate-400 hover:text-red-450 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#18181c] border border-[#2e2e38] rounded-2.5xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4.5 bg-[#1e1e24] border-b border-[#2e2e38]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {editingId ? 'Editar Residente' : 'Registrar Residente'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-[#282830] rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResident} className="p-6 space-y-4">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nombre del Residente *
                </label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej. Mariana Sosa"
                  className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium placeholder-slate-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Fraccionamiento / Residencia donde vive *
                </label>
                <select
                  required
                  disabled={!!currentUser?.residenciaId}
                  value={formResidenciaId}
                  onChange={(e) => setFormResidenciaId(e.target.value)}
                  className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium placeholder-slate-600 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Seleccione una residencia...</option>
                  {residencias.filter(r => r.isActive).map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                  {residencias.filter(r => r.isActive).length === 0 && (
                    <option disabled>No hay residencias activas registradas. Regístrelas primero.</option>
                  )}
                </select>
                {residencias.length === 0 && (
                  <p className="text-[10px] text-red-400 mt-1">
                    ⚠ Debe registrar un fraccionamiento activo en el módulo de "Registro de Residencia" antes de agregar residentes.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Dirección o número de residencia *
                </label>
                <input
                  type="text"
                  required
                  value={formDireccion}
                  onChange={(e) => setFormDireccion(e.target.value)}
                  placeholder="Ej. Calle Roble #14"
                  className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium placeholder-slate-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Número de WhatsApp (Opcional)
                </label>
                <input
                  type="tel"
                  value={formWhatsapp}
                  onChange={(e) => setFormWhatsapp(e.target.value)}
                  placeholder="Ej. +525512345678"
                  className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium placeholder-slate-600 transition-all font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Incluya el código de país sin espacios (ej. +521... o +5255...).
                </p>
              </div>

              {/* App Login Credential Creation for Resident Autogestión */}
              <div className="bg-[#181820] border border-red-500/20 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                  <Key className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Credenciales de Acceso a la Aplicación (Rol Residente)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nombre de Usuario (Login) *
                    </label>
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        placeholder="Ej. residente123"
                        className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Contraseña de Acceso *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type={showFormPassword ? "text" : "password"}
                        required
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl pl-9 pr-9 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                      >
                        {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[9.5px] text-slate-400 leading-snug">
                  Al guardar, estas credenciales permitirán al residente iniciar sesión directamente en su rol <strong>Residente Autogestión</strong> para administrar sus pases.
                </p>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formCreateQR}
                    onChange={(e) => setFormCreateQR(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 focus:ring-transparent bg-[#111115] border-[#2e2e38]"
                  />
                  <span className="text-xs text-slate-300 font-medium">Habilitar y emitir Pase QR de Acceso automático</span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1 ml-6">
                  Crea automáticamente una autorización de ingreso permanente con horario ilimitado de entrada en vigencia personalizada.
                </p>
              </div>

              <div className="pt-2 border-t border-[#2e2e38]/40">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsVisitor}
                    onChange={(e) => setFormIsVisitor(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 focus:ring-transparent bg-[#111115] border-[#2e2e38]"
                  />
                  <span className="text-xs text-slate-300 font-medium">Registrar como visitas</span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1 ml-6">
                  Si se activa el perfil de acceso del residente, se le identificará como visitante ("Pase de Visita") en la caseta de control en lugar de residente regular.
                </p>
              </div>

              {formCreateQR && (
                <div className="bg-[#111115] border border-[#2e2e38] p-4 rounded-xl space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Vigencia del Pase QR (Expiración) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                    className="w-full bg-[#18181c] border border-[#2e2e38] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-all cursor-pointer font-sans"
                  />
                  <p className="text-[9.5px] text-slate-500">
                    Defina el límite administrativo de ingreso. Una vez alcanzada esta fecha, la credencial QR del residente denegará el paso automáticamente.
                  </p>
                </div>
              )}

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
                  disabled={residencias.length === 0}
                  className={`font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/10 cursor-pointer ${
                    residencias.length === 0
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-red-650 hover:bg-red-550 text-white'
                  }`}
                >
                  Guardar Residente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Passport View Modal */}
      {selectedResidentQR && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] bg-slate-900 border-4 border-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center p-5 pt-10 pb-6 border-b-8 animate-scale-in">
            {/* Bezel Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4.5 bg-slate-950 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mr-2"></div>
              <div className="w-12 h-1 bg-slate-850 rounded"></div>
            </div>

            <div className="w-full text-center border-b border-slate-800/80 pb-3 mb-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Credencial Residente 👤</span>
              <h4 className="text-white text-xs font-bold mt-0.5">Control de Acceso Electrónico</h4>
            </div>

            <div className="w-full bg-[#0b0f19] border border-slate-805/80 rounded-2xl p-4 flex flex-col items-center relative select-none">
              {/* Scan indicator */}
              <div className="w-full flex items-center justify-between mb-3 text-[9.5px]">
                <span className="flex items-center gap-1 text-emerald-400 font-extrabold uppercase font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Activo
                </span>
                <span className="text-slate-400 font-mono">CNLS Wallet</span>
              </div>

              {/* QR Image Frame */}
              <div className="relative w-48 h-48 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden border-2 border-slate-700/40">
                {generatedQRUrl ? (
                  <img 
                    referrerPolicy="no-referrer"
                    src={generatedQRUrl} 
                    alt="Digital Pass QR Code" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                    <span className="text-[9px] text-slate-400">Firmando ficha...</span>
                  </div>
                )}
                {/* Visual Scanner Hologram laser overlay */}
                <div className="absolute left-0 right-0 h-0.5 bg-red-500/55 shadow-[0_0_12px_#ef4444] animate-bounce pointer-events-none" style={{ top: '10%' }}></div>
              </div>

              {/* Card body labels with details */}
              <div className="w-full mt-4 space-y-2 border-t border-slate-800/60 pt-3 text-left">
                <div>
                  <label className="block text-[8px] uppercase tracking-widest font-bold text-slate-500 font-mono">Propietario / Residente</label>
                  <span className="text-[12.5px] font-bold text-white tracking-tight">{selectedResidentQR.nombre}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div>
                    <label className="block text-[8px] uppercase tracking-widest font-bold text-slate-500 font-mono font-sans">Fraccionamiento</label>
                    <span className="text-[10.5px] font-bold text-slate-350">{selectedResidentQR.residenciaNombre}</span>
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase tracking-widest font-bold text-slate-500 font-mono">Dirección</label>
                    <span className="text-[10.5px] font-bold text-slate-350">{selectedResidentQR.direccion}</span>
                  </div>
                </div>

                {/* App Login Credentials info */}
                <div className="border-t border-slate-800/60 pt-2 bg-[#090d16] p-2.5 rounded-xl border border-red-500/20">
                  <label className="block text-[8px] uppercase tracking-widest font-bold text-red-400 font-mono flex items-center gap-1 mb-1">
                    <Key className="w-3 h-3 text-red-500 shrink-0" /> Acceso App "Residente Autogestión"
                  </label>
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[8px]">USUARIO:</span>
                      <span className="font-bold text-amber-400">{
                        systemRoles.find(r => r.uid === selectedResidentQR.accessUserId || r.username?.toLowerCase() === selectedResidentQR.username?.toLowerCase())?.username || selectedResidentQR.username || 'condominio'
                      }</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8px]">CONTRASEÑA:</span>
                      <span className="font-bold text-slate-200">{
                        systemRoles.find(r => r.uid === selectedResidentQR.accessUserId || r.username?.toLowerCase() === selectedResidentQR.username?.toLowerCase())?.password || selectedResidentQR.password || 'Condominio_123'
                      }</span>
                    </div>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 text-[8.5px] text-slate-400 font-sans">
                    🌐 Link Portal: <span className="text-blue-400 font-mono">servicios-de-seguridad.vercel.app/residente</span>
                  </div>
                </div>

                {selectedResidentQR.whatsapp && (
                  <div className="border-t border-slate-800/40 pt-2">
                    <label className="block text-[8px] uppercase tracking-widest font-bold text-slate-500 font-mono">WhatsApp Registrado</label>
                    <span className="text-[10.5px] font-bold text-emerald-400 font-mono">{selectedResidentQR.whatsapp}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Direct WhatsApp Share button inside card */}
            <a
              href={getWhatsAppShareUrl(selectedResidentQR)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl mt-4 transition-all shadow-lg hover:scale-[1.02] cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" /> Compartir en WhatsApp
            </a>

            {/* Wallet toolbar copy/download/close controls */}
            <div className="w-full grid grid-cols-3 gap-2 mt-4 font-sans">
              <button
                onClick={() => handleCopyQRLink(selectedResidentQR.qrcodeToken)}
                className="flex flex-col items-center gap-1 p-2 border border-slate-800 rounded-xl bg-slate-950/40 hover:bg-slate-950 hover:text-white text-slate-400 transition-all cursor-pointer text-[9px] font-extrabold uppercase tracking-wider"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-red-400" /> Copiar Link
                  </>
                )}
              </button>
              
              <a
                href={generatedQRUrl}
                download={`Pase-Residente-${selectedResidentQR.nombre.trim().replace(/\s+/g, '-')}.png`}
                className="flex flex-col items-center gap-1 p-2 border border-slate-800 rounded-xl bg-slate-950/40 hover:bg-slate-950 hover:text-white text-slate-400 transition-all cursor-pointer text-[9px] font-extrabold uppercase tracking-wider text-center"
              >
                <Download className="w-4 h-4 text-red-400" /> Descargar
              </a>

              <button
                onClick={() => setSelectedResidentQR(null)}
                className="flex flex-col items-center gap-1 p-2 border border-slate-800 rounded-xl bg-slate-950/40 hover:bg-slate-95 hover:text-white text-slate-400 transition-all cursor-pointer text-[9px] font-extrabold uppercase tracking-wider"
              >
                <X className="w-4 h-4 text-slate-500 hover:text-white" /> Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM ACTION */}
      {deleteConfirmId && (
        <div id="delete-resident-confirm-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#18181c] rounded-2xl border border-[#2e2e38] shadow-2xl max-w-sm w-full p-6 text-center text-xs text-slate-200">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto transition">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm mb-3 uppercase tracking-wider">Confirmar Eliminación</h3>
            <p className="text-slate-300 leading-relaxed mb-6">
              ¿Está seguro de que desea eliminar permanentemente al residente <strong className="text-red-400">"{deleteConfirmNombre}"</strong>? Esto también revocará sus credenciales QR de acceso.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmNombre('');
                }}
                className="px-4 py-2.5 bg-[#1A1A1E] hover:bg-[#2A2A2E] text-slate-200 border border-[#2e2e38] font-semibold rounded-xl transition cursor-pointer"
              >
                No, cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteResidente}
                className="px-4 py-2.5 bg-red-650 hover:bg-red-550 text-white font-semibold rounded-xl transition cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
