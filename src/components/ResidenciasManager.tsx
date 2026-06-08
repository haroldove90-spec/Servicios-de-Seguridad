/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Home, User, Shield, 
  Info, Check, X, ChevronDown, ChevronUp, Users, Calendar, Clock, 
  Sparkles, MessageSquare, QrCode, Download, Copy, ExternalLink, RefreshCw, Smartphone
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { Residencia, Residente, AuthorizedUser, UserStatus } from '../types';
import { generateQRWithLogo } from '../utils/qrWithLogo';

interface ResidenciasManagerProps {
  onRefresh?: () => void;
}

export default function ResidenciasManager({ onRefresh }: ResidenciasManagerProps) {
  const [residencias, setResidencias] = useState<Residencia[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [visitantes, setVisitantes] = useState<AuthorizedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Residence Form state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNombre, setFormNombre] = useState<string>('');
  const [formAdministrador, setFormAdministrador] = useState<string>('');
  const [formNumResidencias, setFormNumResidencias] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Sub-panel expanded state per Residence
  const [expandedResidenciaId, setExpandedResidenciaId] = useState<string | null>(null);
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

  const loadData = async () => {
    try {
      const resList = await dbService.getResidencias();
      setResidencias(resList);

      const resdList = await dbService.getResidentes();
      setResidentes(resdList);

      const authList = await dbService.getAuthorizedUsers();
      setVisitantes(authList);
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
        await dbService.createResidencia({
          ...payload,
          createdAt: new Date().toISOString()
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
    } else {
      setExpandedResidenciaId(item.id);
      setActiveSubTab('residentes');
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
                <th className="py-4 px-4 text-center">Residentes / Visitas</th>
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
                  const assignedResidentes = residentes.filter(r => r.residenciaId === item.id);
                  const assignedVisitantes = visitantes.filter(v => v.residenciaId === item.id);

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
                                ? 'bg-red-650 text-white border-transparent' 
                                : 'bg-[#1e1e24] text-slate-300 border-[#2e2e38] hover:border-slate-650'
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Padres ({assignedResidentes.length} / {assignedVisitantes.length})</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
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

                      {/* Expandable sub-panel showing resident censo list and visitor list */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-[#111115] p-6 border-b border-[#2e2e38] animate-fade-in">
                            <div className="border border-[#2e2e38] bg-[#15151a] p-5 rounded-2xl space-y-5">
                              {/* Tab Controls and header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2e2e38] pb-3">
                                <div className="flex items-center gap-3">
                                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Censo Sincronizado para {item.nombre}</h4>
                                  <span className="text-[10px] bg-[#1e1e24] border border-[#2e2e38] text-slate-400 px-2 py-0.5 rounded font-bold font-mono">ID: {item.id}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setActiveSubTab('residentes')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                                      activeSubTab === 'residentes'
                                        ? 'bg-red-500/20 text-red-450 font-bold border border-red-500/30'
                                        : 'text-slate-400 hover:text-white hover:bg-[#1e1e24]'
                                    }`}
                                  >
                                    👩‍👩‍👧 Residentes ({assignedResidentes.length})
                                  </button>
                                  <button
                                    onClick={() => setActiveSubTab('visitantes')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                                      activeSubTab === 'visitantes'
                                        ? 'bg-red-500/20 text-red-450 font-bold border border-red-500/30'
                                        : 'text-slate-400 hover:text-white hover:bg-[#1e1e24]'
                                    }`}
                                  >
                                    🚗 Visitantes ({assignedVisitantes.length})
                                  </button>
                                </div>
                              </div>

                              {/* Resident list tab content */}
                              {activeSubTab === 'residentes' && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-slate-400">
                                      Residentes activos registrados con código de barras o pase QR permanente asignados a este condominio.
                                    </p>
                                  </div>

                                  {assignedResidentes.length === 0 ? (
                                    <div className="py-8 text-center text-slate-500 bg-[#0d0d11]/50 border border-dashed border-[#24242d] rounded-xl font-medium text-xs">
                                      🏡 No hay residentes asignados a este fraccionamiento aún.<br />
                                      <span className="text-[10px] text-slate-600 block mt-1">Vaya al módulo "Registro de Residente" para darlos de alta.</span>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {assignedResidentes.map((resd) => (
                                        <div key={resd.id} className="bg-[#18181c] border border-[#2a2a32] p-4 rounded-xl flex items-center justify-between w-full shadow hover:border-[#383844] transition-all">
                                          <div className="space-y-1">
                                            <p className="font-bold text-white text-xs flex items-center gap-1">
                                              <User className="w-3.5 h-3.5 text-slate-450" /> {resd.nombre}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium">📍 Ubicación: {resd.direccion}</p>
                                            <p className="text-[10.5px] font-mono text-slate-500">{resd.whatsapp || 'Sin WhatsApp asignado'}</p>
                                          </div>
                                          {resd.whatsapp && (
                                            <a
                                              href={`https://wa.me/${resd.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${resd.nombre}, te comparto tu pase QR permanente.`)}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                                              title="Compartir Pase por WhatsApp"
                                            >
                                              <MessageSquare className="w-3.5 h-3.5" />
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Visitor list tab content */}
                              {activeSubTab === 'visitantes' && (
                                <div className="space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111115] p-3 rounded-xl border border-[#24242d]">
                                    <p className="text-[10px] text-slate-450">
                                      Pases de visitantes activos y autorizados. Los guardias escanean el código de barras/QR de estas personas y el sistema registrará los accesos automáticamente en la bitácora relacionándola con tu subdivision.
                                    </p>
                                    <button
                                      onClick={() => handleOpenVisitorForm(item)}
                                      className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer transition shrink-0"
                                    >
                                      <Plus className="w-3.5 h-3.5" /> Registrar Visitante
                                    </button>
                                  </div>

                                  {assignedVisitantes.length === 0 ? (
                                    <div className="py-10 text-center text-slate-500 bg-[#0d0d11]/50 border border-dashed border-[#24242d] rounded-xl font-medium text-xs">
                                      🚗 No hay pases de visitante activos para esta residencia.<br />
                                      <button 
                                        onClick={() => handleOpenVisitorForm(item)}
                                        className="mt-3.5 text-xs text-red-500 hover:text-red-420 font-bold uppercase tracking-wider underline cursor-pointer"
                                      >
                                        Crear primer pase ahora
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {assignedVisitantes.map((visitor) => {
                                        const isExpired = new Date(visitor.validUntil) < new Date();
                                        return (
                                          <div key={visitor.id} className="bg-[#18181c] border border-[#2a2a32] p-4 rounded-xl flex items-center justify-between w-full shadow hover:border-[#383844] transition-all relative overflow-hidden">
                                            {/* Top visual accent rule */}
                                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-800"></div>

                                            <div className="space-y-1.5">
                                              <div className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                                <p className="font-extrabold text-white text-xs">{visitor.name}</p>
                                              </div>
                                              <p className="text-[10px] text-slate-400 font-medium">📱 Tel: {visitor.phone || 'No registrado'}</p>
                                              <div className="flex items-center gap-1 text-[9.5px] text-slate-500">
                                                <Calendar className="w-3 h-3" />
                                                <span>Expira: {new Date(visitor.validUntil).toLocaleString()}</span>
                                              </div>
                                              {visitor.oneTime && (
                                                <span className={`inline-block text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${visitor.used ? 'bg-slate-800 text-slate-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                  {visitor.used ? 'Pase Usado ✓' : 'Un Solo Uso ⚡'}
                                                </span>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0 ml-4">
                                              <button
                                                onClick={() => setSelectedVisitorQR(visitor)}
                                                className="p-2 text-slate-400 hover:text-white bg-[#111115] border border-[#2e2e38] rounded-lg transition"
                                                title="Mostrar Código QR"
                                              >
                                                <QrCode className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => handleDeleteVisitor(visitor.id, visitor.name)}
                                                className="p-2 text-slate-450 hover:text-red-420 bg-[#111115] border border-[#2e2e38] rounded-lg transition"
                                                title="Eliminar / Revocar Acceso"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
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
                  placeholder="Ej. Ing. Alejandro Ruiz"
                  className="w-full bg-[#111115] border border-[#2e2e38] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium placeholder-slate-600 transition-all"
                />
              </div>

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
    </div>
  );
}
