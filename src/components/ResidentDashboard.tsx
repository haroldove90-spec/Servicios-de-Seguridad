/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, QrCode, Download, Copy, Check, X, 
  MapPin, User, Calendar, Clock, RefreshCw, Send, Trash2, ShieldCheck, Smartphone, Car
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { AuthorizedUser, SystemRole, UserStatus } from '../types';
import { generateQRWithLogo } from '../utils/qrWithLogo';

interface ResidentDashboardProps {
  currentResidentUser: SystemRole;
  onRefresh?: () => void;
}

export default function ResidentDashboard({ currentResidentUser, onRefresh }: ResidentDashboardProps) {
  const [visits, setVisits] = useState<AuthorizedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formNombre, setFormNombre] = useState<string>('');
  const [formWhatsapp, setFormWhatsapp] = useState<string>('');
  
  // QR Modal Overlay
  const [selectedVisitQR, setSelectedVisitQR] = useState<AuthorizedUser | null>(null);
  const [generatedQRUrl, setGeneratedQRUrl] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const [allUsers, allMarbetes, listResidents, allLogs] = await Promise.all([
        dbService.getAuthorizedUsers(),
        dbService.getMarbetes(),
        dbService.getResidentes(),
        dbService.getAccessLogs()
      ]);

      // Filter list so resident only sees visits they created (or those associated with their residence)
      const residentVisits = allUsers.filter(u => 
        u.isResidentCreated && 
        (u.createdBy === currentResidentUser.uid || u.createdBy === currentResidentUser.email)
      );

      const normalizeName = (nameStr: string) => {
        if (!nameStr) return '';
        return nameStr.replace(/\s*\(Visita\)/g, '').replace(/\s*\(Residente\)/g, '').trim().toLowerCase();
      };

      const residentMarbetes = allMarbetes.filter(m => {
        const matchesResidence = (currentResidentUser.residenciaId && m.residenciaId === currentResidentUser.residenciaId);
        const matchesResidentUID = m.residenteId === currentResidentUser.uid;
        const matchesResidentName = (currentResidentUser.name && normalizeName(m.residenteNombre).includes(normalizeName(currentResidentUser.name)));
        const matchesResidentInCollection = listResidents.some(r => r.id === m.residenteId && (
          r.accessUserId === currentResidentUser.uid ||
          (currentResidentUser.name && normalizeName(r.nombre).includes(normalizeName(currentResidentUser.name)))
        ));
        
        return matchesResidence || matchesResidentUID || matchesResidentName || matchesResidentInCollection;
      });

      const convertedMarbetes: AuthorizedUser[] = residentMarbetes.map(m => {
        const isExpired = new Date(m.validUntil) < new Date();
        const hasEntered = allLogs.some(log => 
          log.documentId === 'MARBETE-' + m.consecutivo && 
          log.type === 'check-in' &&
          log.status === 'success'
        );

        return {
          id: 'mar_dash_' + m.id,
          name: `${m.residenteNombre} (Marbete #${m.consecutivo})`,
          documentId: 'MARBETE-' + m.consecutivo,
          phone: m.vehiculoInfo ? `${m.vehiculoInfo} ${m.vehiculoPlacas ? `[Placas: ${m.vehiculoPlacas}]` : ''}` : '(Vehículo - Sin placas)',
          status: isExpired ? UserStatus.EXPIRED : (hasEntered ? UserStatus.ACTIVE : UserStatus.ACTIVE),
          qrcodeToken: m.qrcodeToken,
          oneTime: false,
          used: hasEntered,
          validFrom: m.validFrom,
          validUntil: m.validUntil,
          days: [],
          startTime: '00:00',
          endTime: '23:59',
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          residenciaId: m.residenciaId,
          residenciaNombre: m.residenciaNombre,
          isResidentCreated: true,
          createdBy: currentResidentUser.uid,
          residentName: currentResidentUser.name,
          residentPhone: currentResidentUser.phone || '',
          isMarbeteItem: true
        } as any;
      });

      // Deduplicate: if an authorized user with MARBETE-consecutivo already exists in residentVisits, skip converting
      const filteredConvertedMarbetes = convertedMarbetes.filter(cm => 
        !residentVisits.some(rv => rv.documentId === cm.documentId)
      );

      const combined = [...residentVisits, ...filteredConvertedMarbetes];
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setVisits(combined);
    } catch (error) {
      console.error('Error loading resident visits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, [currentResidentUser]);

  // QR Code generator when a visit is selected
  useEffect(() => {
    if (selectedVisitQR) {
      const passUrl = `${window.location.origin}${window.location.pathname}?pass=${selectedVisitQR.qrcodeToken}`;
      generateQRWithLogo(passUrl)
        .then(url => setGeneratedQRUrl(url))
        .catch(err => console.error('Error generating QR', err));
    } else {
      setGeneratedQRUrl('');
    }
  }, [selectedVisitQR]);

  const handleOpenForm = () => {
    setFormNombre('');
    setFormWhatsapp('');
    setIsFormOpen(true);
  };

  const handleRegisterVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formWhatsapp.trim()) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const qrToken = 'visit_qr_' + Math.random().toString(36).substring(2, 11);
      
      // Auto 1 day validity duration parameters
      const validFrom = new Date();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 1); // 1-day expiration automatically

      const formattedPhone = formWhatsapp.trim().startsWith('+') ? formWhatsapp.trim() : `+52${formWhatsapp.trim().replace(/\D/g, '')}`;

      const newVisitPayload: Omit<AuthorizedUser, 'id'> = {
        name: `${formNombre.trim()} (Visita de ${currentResidentUser.name})`,
        documentId: 'VISIT-' + currentResidentUser.residenciaNombre?.substring(0, 3).toUpperCase() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        email: 'visita-resident@local.casa',
        phone: formattedPhone,
        status: UserStatus.ACTIVE,
        qrcodeToken: qrToken,
        oneTime: true,
        used: false,
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString(),
        days: [], // all days
        startTime: '00:00',
        endTime: '23:59',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentResidentUser.uid,
        residenciaId: currentResidentUser.residenciaId || '',
        residenciaNombre: currentResidentUser.residenciaNombre || '',
        isResidentCreated: true,
        residentName: currentResidentUser.name,
        residentPhone: currentResidentUser.phone || '',
      };

      const createdUser = await dbService.createAuthorizedUser(newVisitPayload);
      
      setIsFormOpen(false);
      setFeedback('✓ Visita autorizada exitosamente con código QR generado en tiempo real.');
      setTimeout(() => setFeedback(''), 5000);
      
      // Load and open the QR dialog immediately for easy sharing
      loadVisits();
      setSelectedVisitQR(createdUser);

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error creating resident visit:', err);
      alert('Error registrando la visita.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (!window.confirm('¿Está seguro de querer cancelar esta autorización de visita o marbete? El código QR quedará invalidado de inmediato.')) {
      return;
    }
    try {
      if (visitId.startsWith('mar_dash_')) {
        const marbeteId = visitId.replace('mar_dash_', '');
        await dbService.deleteMarbete(marbeteId);
      } else {
        await dbService.deleteAuthorizedUser(visitId);
      }
      setFeedback('✓ Autorización revocada exitosamente.');
      setTimeout(() => setFeedback(''), 4000);
      loadVisits();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting resident visit:', error);
    }
  };

  // WhatsApp share helper
  const handleShareWhatsApp = (visit: AuthorizedUser) => {
    const isMarbete = (visit as any).isMarbeteItem;
    const passUrl = `${window.location.origin}${window.location.pathname}?pass=${visit.qrcodeToken}`;
    const cleanPhone = visit.phone.replace(/\+/g, '').replace(/\s+/g, '');
    
    let message = '';
    if (isMarbete) {
      message = `Hola ${visit.name.split(' (')[0]}, te comparto tu Pase Digital de Acceso Vehicular (Marbete) para la villa/residencia:\n🏠 *${visit.residenciaNombre}*\n🚗 *Vehículo:* ${visit.phone}\n⏰ Válido hasta el ${new Date(visit.validUntil).toLocaleDateString()} a las ${new Date(visit.validUntil).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n\nPresenta este QR en caseta para tu ingreso vehicular:\n👉 ${passUrl}`;
    } else {
      message = `Hola ${visit.name.split(' (')[0]}, te comparto tu Pase Digital de Acceso QR para ingresar a la villa/residencia:\n🏠 *${visit.residenciaNombre}*\n⏰ Válido por 1 día (Vence el ${new Date(visit.validUntil).toLocaleDateString()} a las ${new Date(visit.validUntil).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})\n\nPresenta este QR en caseta para tu ingreso:\n👉 ${passUrl}`;
    }
    
    const isPhoneValid = visit.phone && !visit.phone.includes('Vehículo') && /^\+?\d+$/.test(cleanPhone);
    const waUrl = isPhoneValid 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      
    window.open(waUrl, '_blank');
  };

  // Filtered lists
  const filteredVisits = visits.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      
      {/* Dynamic Notification Bar */}
      {feedback && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-pulse">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header and Quick Stats */}
      <div className="bg-[#151518]/90 border border-[#2a2a30] rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5 font-mono">
              <MapPin className="w-3.5 h-3.5" />
              <span>Subdivisión: {currentResidentUser.residenciaNombre || 'General'}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Bienvenido, {currentResidentUser.name}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Autogestione las firmas y autorizaciones de acceso temporal de sus visitas. Todo registro sincroniza en tiempo real con el control de vigilancia de las casetas de acceso de la subdivisión.
            </p>
          </div>
          
          <button
            id="btn-register-new-resident-visit"
            onClick={handleOpenForm}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs transition shadow-lg shadow-blue-600/10 active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Registrar Nueva Visita
          </button>
        </div>

        {/* Quick metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-[#2a2a30] mt-6 pt-6 font-sans">
          <div className="bg-[#1c1c22] p-4 rounded-2xl border border-[#2a2a30]">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Mis Visitas Registradas</p>
            <p className="text-xl font-bold text-white mt-1">{visits.length}</p>
          </div>
          <div className="bg-[#1c1c22] p-4 rounded-2xl border border-[#2a2a30]">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Activas Hoy</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">
              {visits.filter(v => new Date(v.validUntil) > new Date()).length}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-[#1c1c22] p-4 rounded-2xl border border-[#2a2a30]">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Vigencia Predeterminada</p>
            <p className="text-xl font-bold text-slate-350 mt-1 flex items-center gap-1.5 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>1 Día Completo (24 hrs)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main filterable list of visits */}
      <div className="bg-[#151518]/90 border border-[#2a2a30] rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Bitácora de Mis Visitas
          </h2>

          <div className="flex gap-2 items-center w-full sm:w-auto max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="search-resident-visits"
                type="text"
                placeholder="Buscar visita por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1A1A1E] border border-[#2a2a30] text-slate-200 text-xs rounded-xl focus:border-blue-500 focus:outline-hidden font-sans"
              />
            </div>
            <button
              id="btn-refresh-resident-visits"
              onClick={loadVisits}
              disabled={loading}
              className="p-2.5 bg-[#1c1c22] hover:bg-slate-850 text-slate-300 rounded-xl transition border border-[#2a2a30] cursor-pointer shrink-0 disabled:opacity-40"
              title="Sincronizar listados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Visits Grid / Table */}
        {loading && visits.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/10 border border-dashed border-[#2a2a30] rounded-2xl">
            <Smartphone className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-xs text-slate-400">No se encontraron visitas registradas creadas por usted.</p>
            <button
              onClick={handleOpenForm}
              className="text-[11px] font-bold text-blue-400 mt-2 hover:underline"
            >
              Registrar su primera visita ahora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVisits.map((visit) => {
              const isExpired = new Date(visit.validUntil) < new Date();
              const isMarbete = (visit as any).isMarbeteItem;
              const displayName = isMarbete ? visit.name : visit.name.split(' (Visita de ')[0];
              
              return (
                <div 
                  key={visit.id}
                  className="bg-[#1c1c22] border border-[#2a2a30] hover:border-blue-500/35 transition rounded-2xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 tracking-tight leading-snug">
                        {displayName}
                      </h3>
                      <div className="flex flex-col gap-1 mt-2 text-[10.5px] text-slate-400 font-sans">
                        <div className="flex items-center gap-1.5">
                          {isMarbete ? (
                            <>
                              <Car className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span>Vehículo: {visit.phone}</span>
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>WhatsApp: {visit.phone}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Vence: {new Date(visit.validUntil).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9.5px] font-mono text-zinc-500">{visit.documentId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider rounded-md border ${
                        isExpired 
                          ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                          : visit.used 
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/22' 
                            : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/22'
                      }`}>
                        {isExpired ? 'Expirado' : visit.used ? 'Ingresado ✓' : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 pt-3 border-t border-[#25252b] justify-between">
                    <button
                      id={`btn-cancel-visit-${visit.id}`}
                      onClick={() => handleDeleteVisit(visit.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition rounded-xl cursor-pointer"
                      title={isMarbete ? 'Cancelar marbete de visita' : 'Invalidar pase de visita'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex gap-2">
                      <button
                        id={`btn-view-qr-visit-${visit.id}`}
                        onClick={() => setSelectedVisitQR(visit)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#25252e] hover:bg-[#2f2f3a] text-slate-200 border border-[#2a2a30] transition rounded-xl text-[10.5px] font-bold cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-blue-400" /> Ver QR
                      </button>

                      <button
                        id={`btn-wa-share-visit-${visit.id}`}
                        onClick={() => handleShareWhatsApp(visit)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white transition rounded-xl text-[10.5px] font-bold cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Compartir Whatsapp
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-over Registration Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-[#161619] border border-[#2a2a30] rounded-[2rem] p-6 shadow-2xl relative overflow-hidden animate-fade-in-up">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                Registrar Pase de Visita
              </h3>
              <button
                _id="close-visit-form"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-850 text-slate-400 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterVisit} className="space-y-4 font-sans text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nombre Completo del Visitante *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="input-visit-guest-name"
                    type="text"
                    required
                    placeholder="Ej. Juan de Dios Pérez"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#1A1A1E] border border-[#3e3e42] text-white rounded-xl focus:border-blue-500 focus:outline-hidden text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Teléfono de WhatsApp de la Visita *</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="input-visit-guest-phone"
                    type="tel"
                    required
                    placeholder="Ej. +52 55 1234 5678"
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#1A1A1E] border border-[#3e3e42] text-white rounded-xl focus:border-blue-500 focus:outline-hidden text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Se enviará el enlace de acceso QR directamente a este número.</p>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/15 rounded-xl flex gap-2">
                <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-200 leading-normal font-sans">
                  <strong className="text-white block mb-0.5">Vigencia automática de 1 día:</strong>
                  El pase de entrada se registrará de forma inmediata y expirará exactamente transcurridos 24 horas a partir del momento de registro.
                </p>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 bg-[#1A1A1E] hover:bg-zinc-800 text-white border border-[#3e3e42] rounded-xl transition text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-505 text-white rounded-xl transition text-xs font-bold shadow-lg shadow-blue-600/10 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-55"
                >
                  {loading ? 'Procesando...' : 'Autorizar & Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Details Slideover Modal */}
      {selectedVisitQR && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-[#1A1A1D] border border-[#303036] rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden text-center relative flex flex-col items-center">
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>

            <button
              onClick={() => setSelectedVisitQR(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-[#25252a] text-slate-400 transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Banner info */}
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-blue-400 tracking-widest mb-4 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Autorización Temporal</span>
            </div>

            <h3 className="text-md font-bold text-slate-100 tracking-tight leading-snug px-4">
              {selectedVisitQR.name.split(' (')[0]}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-1 mb-6">
              ID: {selectedVisitQR.documentId}
            </p>

            {/* QR Render wrapper */}
            <div className="bg-white p-5 rounded-3xl border-4 border-slate-800 flex items-center justify-center shadow-xl mb-6 relative">
              {generatedQRUrl ? (
                <img src={generatedQRUrl} alt="Visit Passport QR Code" className="w-44 h-44 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>

            {/* Expire and Location details */}
            <div className="bg-[#212128] border border-[#2d2d3a] rounded-2xl p-4 w-full text-left space-y-2.5 mb-6 text-xs font-sans">
              <div className="flex items-center justify-between text-slate-400">
                <span>Residencia destino:</span>
                <strong className="text-white">{selectedVisitQR.residenciaNombre || 'N/A'}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Válido hasta:</span>
                <strong className="text-white">
                  {new Date(selectedVisitQR.validUntil).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Estatus de Acceso:</span>
                <span className={`px-2 py-0.5 rounded-sm font-semibold text-[10px] uppercase ${
                  new Date(selectedVisitQR.validUntil) < new Date() 
                    ? 'bg-red-500/15 text-red-400' 
                    : selectedVisitQR.used 
                      ? 'bg-yellow-500/15 text-yellow-400' 
                      : 'bg-emerald-500/15 text-emerald-400'
                }`}>
                  {new Date(selectedVisitQR.validUntil) < new Date() ? 'Expirado' : selectedVisitQR.used ? 'Usado' : 'Pendiente'}
                </span>
              </div>
            </div>

            {/* Share action bar */}
            <div className="grid grid-cols-2 gap-3 w-full font-sans">
              <button
                id="btn-copy-visit-token"
                onClick={() => {
                  const passUrl = `${window.location.origin}${window.location.pathname}?pass=${selectedVisitQR.qrcodeToken}`;
                  navigator.clipboard.writeText(passUrl);
                  setCopiedToken(true);
                  setTimeout(() => setCopiedToken(false), 2500);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-[#23232c] hover:bg-slate-800 text-slate-200 border border-[#32323c] rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copiar Enlace
                  </>
                )}
              </button>

              <button
                id="btn-whatsapp-share-modal"
                onClick={() => handleShareWhatsApp(selectedVisitQR)}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Compartir Whats
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
