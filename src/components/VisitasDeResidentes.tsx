/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, QrCode, Trash2, ShieldAlert, Sparkles, RefreshCw, 
  MapPin, Check, X, Calendar, Clock, User, Smartphone, Eye
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { AuthorizedUser, SystemRole, UserStatus } from '../types';
import { generateQRWithLogo } from '../utils/qrWithLogo';

interface VisitasDeResidentesProps {
  currentAdminUser: SystemRole;
  onRefresh?: () => void;
}

export default function VisitasDeResidentes({ currentAdminUser, onRefresh }: VisitasDeResidentesProps) {
  const [allVisits, setAllVisits] = useState<AuthorizedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [residentFilter, setResidentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'used' | 'expired'>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');

  // Selected visit for QR modal display
  const [selectedVisitQR, setSelectedVisitQR] = useState<AuthorizedUser | null>(null);
  const [generatedQRUrl, setGeneratedQRUrl] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const usersList = await dbService.getAuthorizedUsers();
      // Filter list: only resident-created visits
      let filtered = usersList.filter(u => u.isResidentCreated);
      
      // If the administrator is bound to a specific residence range:
      if (currentAdminUser.residenciaId) {
        filtered = filtered.filter(u => u.residenciaId === currentAdminUser.residenciaId);
      }
      
      setAllVisits(filtered);
    } catch (error) {
      console.error('Error loading resident-created visits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentAdminUser]);

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

  const handleRevokeVisit = async (visitId: string) => {
    if (!window.confirm('¿Está seguro de querer anular este pase de visita autorizado por el residente? El visitante ya no podrá ingresar con este código QR.')) {
      return;
    }

    try {
      await dbService.deleteAuthorizedUser(visitId);
      setFeedback('✓ El pase de acceso de la visita ha sido revocado y eliminado exitosamente.');
      setTimeout(() => setFeedback(''), 5000);
      loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error revoking resident visit:', err);
    }
  };

  // Perform client filters
  const filtered = allVisits.filter(visit => {
    const nameMatches = visit.name.toLowerCase().includes(searchTerm.toLowerCase());
    const residentMatches = residentFilter ? (visit.residentName?.toLowerCase().includes(residentFilter.toLowerCase())) : true;
    
    const isExpired = new Date(visit.validUntil) < new Date();
    
    if (statusFilter === 'active') {
      return nameMatches && residentMatches && !isExpired && !visit.used;
    }
    if (statusFilter === 'used') {
      return nameMatches && residentMatches && visit.used;
    }
    if (statusFilter === 'expired') {
      return nameMatches && residentMatches && isExpired;
    }
    return nameMatches && residentMatches;
  });

  return (
    <div className="space-y-6">
      
      {/* Dynamic feedback banner */}
      {feedback && (
        <div className="bg-[#ef4444]/10 border border-red-500/15 text-red-400 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-pulse">
          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Module Cover Card */}
      <div className="bg-[#151518]/90 border border-[#2a2a30] rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-3xl rounded-full pointer-events-none"></div>
        
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>Módulo Administrativo</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Visitas de Residentes
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Consulte y audite de manera unificada todas las autorizaciones temporales generadas directamente por sus residentes. Los códigos de ingreso están sincronizados automáticamente con el lector QR de caseta.
          </p>
        </div>

        {/* Quick analytics metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[#2a2a30] mt-6 pt-6 font-sans">
          <div className="bg-[#1c1c22] p-4 rounded-xl border border-[#2a2a30]">
            <p className="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider font-mono">Pases Registrados</p>
            <p className="text-lg font-bold text-white mt-0.5">{allVisits.length}</p>
          </div>
          <div className="bg-[#1c1c22] p-4 rounded-xl border border-[#2a2a30]">
            <p className="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider font-mono">Activos hoy</p>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">
              {allVisits.filter(v => new Date(v.validUntil) > new Date() && !v.used).length}
            </p>
          </div>
          <div className="bg-[#1c1c22] p-4 rounded-xl border border-[#2a2a30]">
            <p className="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider font-mono">Pases Usados</p>
            <p className="text-lg font-bold text-blue-400 mt-0.5">
              {allVisits.filter(v => v.used).length}
            </p>
          </div>
          <div className="bg-[#1c1c22] p-4 rounded-xl border border-[#2a2a30]">
            <p className="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider font-mono">Pases Expirados</p>
            <p className="text-lg font-bold text-red-400 mt-0.5">
              {allVisits.filter(v => new Date(v.validUntil) < new Date()).length}
            </p>
          </div>
        </div>
      </div>

      {/* Main filter dashboard panel */}
      <div className="bg-[#151518]/90 border border-[#2a2a30] rounded-3xl p-6 shadow-xl">
        
        {/* Filters bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          
          {/* Guest search */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Buscar Invitado</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="search-admin-guest"
                type="text"
                placeholder="Nombre visitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#1A1A1E] border border-[#2a2a30] text-slate-200 text-xs rounded-xl focus:border-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Resident search */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Buscar Residente</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="search-admin-resident"
                type="text"
                placeholder="Residente que invitó..."
                value={residentFilter}
                onChange={(e) => setResidentFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#1A1A1E] border border-[#2a2a30] text-slate-200 text-xs rounded-xl focus:border-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Estado del Pase</label>
            <select
              id="select-admin-visit-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#1A1A1E] border border-[#2a2a30] text-slate-200 text-xs rounded-xl focus:border-red-500 focus:outline-hidden cursor-pointer"
            >
              <option value="all" className="bg-[#1D1D22]">📂 Mostrar Todos</option>
              <option value="active" className="bg-[#1D1D22]">🟢 Activos (Sin Usar)</option>
              <option value="used" className="bg-[#1D1D22]">🔵 Usados (Accedidos)</option>
              <option value="expired" className="bg-[#1D1D22]">🔴 Expirados</option>
            </select>
          </div>

          {/* Sincronización */}
          <div className="flex items-end justify-end">
            <button
              id="btn-sync-admin-visits"
              onClick={loadData}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1c1c22] hover:bg-slate-850 text-slate-300 rounded-xl transition border border-[#2a2a30] cursor-pointer text-xs font-bold font-sans disabled:opacity-45"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sincronizar Panel
            </button>
          </div>

        </div>

        {/* Data list */}
        {loading && allVisits.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/10 border border-dashed border-[#2a2a30] rounded-2xl font-sans">
            <User className="w-8 h-8 text-slate-650 mx-auto mb-3 animate-pulse" />
            <p className="text-xs text-slate-400">No se encontraron visitas registradas que coincidan con los criterios.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2a2a30] text-slate-400 uppercase text-[9.5px] font-bold tracking-wider">
                  <th className="py-3 px-4">Invitado (Pase)</th>
                  <th className="py-3 px-4">Residente Organizador</th>
                  <th className="py-3 px-4">Fecha Alta / Vigencia</th>
                  <th className="py-3 px-4">Subdivisión</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F24] text-slate-300">
                {filtered.map((visit) => {
                  const isExpired = new Date(visit.validUntil) < new Date();
                  const displayName = visit.name.split(' (Visita de ')[0];
                  
                  return (
                    <tr key={visit.id} className="hover:bg-[#1a1a20]/45 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{displayName}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                          <span>Whats: {visit.phone}</span>
                          <span className="text-[9px] text-slate-500">({visit.documentId})</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{visit.residentName || 'N/A'}</div>
                        {visit.residentPhone && (
                          <div className="text-[10px] text-slate-400 mt-0.5">Tfn: {visit.residentPhone}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div>Alta: {new Date(visit.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-red-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>Vence: {new Date(visit.validUntil).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        <div className="flex items-center gap-1 font-semibold text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{visit.residenciaNombre || 'General'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm border ${
                          isExpired 
                            ? 'bg-red-500/10 text-red-400 border-red-505/20' 
                            : visit.used 
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/22' 
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/22'
                        }`}>
                          {isExpired ? 'Expirado' : visit.used ? 'Usado' : 'Activo'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-admin-view-qr-${visit.id}`}
                            onClick={() => setSelectedVisitQR(visit)}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition rounded-lg cursor-pointer"
                            title="Ver Código QR del Pase"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            id={`btn-admin-revoke-visit-${visit.id}`}
                            onClick={() => handleRevokeVisit(visit.id)}
                            className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition rounded-lg cursor-pointer"
                            title="Invalidar y Revocar Acceso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Admin QR view dialog overlay */}
      {selectedVisitQR && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-[#1A1A1D] border border-[#303036] rounded-[2.5rem] p-6 shadow-2xl text-center relative flex flex-col items-center">
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-650/5 blur-3xl rounded-full pointer-events-none"></div>

            <button
              onClick={() => setSelectedVisitQR(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-[#25252a] text-slate-400 transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-red-500 tracking-widest mb-4 font-mono">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Vista de pase QR</span>
            </div>

            <h3 className="text-md font-bold text-slate-100 tracking-tight leading-snug px-4">
              {selectedVisitQR.name.split(' (')[0]}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-1 mb-6">
              ID: {selectedVisitQR.documentId}
            </p>

            <div className="bg-white p-5 rounded-3xl border-4 border-slate-800 flex items-center justify-center shadow-xl mb-6">
              {generatedQRUrl ? (
                <img src={generatedQRUrl} alt="Guest QR Code" className="w-44 h-44 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-505"></div>
                </div>
              )}
            </div>

            <div className="bg-[#212128] border border-[#2d2d3a] rounded-2xl p-4 w-full text-left space-y-2.5 text-xs font-sans">
              <div className="flex items-center justify-between text-slate-400">
                <span>Residente que Invitó:</span>
                <strong className="text-white">{selectedVisitQR.residentName || 'N/A'}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Vencimiento:</span>
                <strong className="text-white">
                  {new Date(selectedVisitQR.validUntil).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Celular de la visita:</span>
                <strong className="text-white">{selectedVisitQR.phone}</strong>
              </div>
            </div>

            <button
              onClick={() => setSelectedVisitQR(null)}
              className="mt-6 w-full py-3 bg-[#23232c] hover:bg-slate-800 text-slate-200 border border-[#32323c] rounded-2xl text-xs font-bold transition cursor-pointer"
            >
              Cerrar Vista de pase
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
