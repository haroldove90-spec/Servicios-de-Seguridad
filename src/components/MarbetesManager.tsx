/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, QrCode, Download, Share2, CornerDownRight,
  Printer, X, Check, Calendar, AlertCircle, RefreshCw, Car, ChevronRight, Hash, UserCheck
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { Marbete, Residente, UserStatus } from '../types';
import { generateQRWithLogo } from '../utils/qrWithLogo';
import { exportMarbeteToJPG } from '../utils/marbeteExporter';

interface MarbetesManagerProps {
  onRefresh?: () => void;
  currentUser?: any;
}

export default function MarbetesManager({ onRefresh, currentUser }: MarbetesManagerProps) {
  const [marbetes, setMarbetes] = useState<Marbete[]>([]);
  const [residents, setResidents] = useState<Residente[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form fields
  const [selectedResidentId, setSelectedResidentId] = useState<string>('');
  const [vehiculoPlacas, setVehiculoPlacas] = useState<string>('');
  const [vehiculoInfo, setVehiculoInfo] = useState<string>('');
  const [visitaNombre, setVisitaNombre] = useState<string>('');
  const [status, setStatus] = useState<UserStatus>(UserStatus.ACTIVE);
  const [validFrom, setValidFrom] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');

  // Active QR Preview Overlay
  const [selectedMarbete, setSelectedMarbete] = useState<Marbete | null>(null);
  const [marbeteQRUrl, setMarbeteQRUrl] = useState<string>('');
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [listMarbetes, listResidents, listLogs] = await Promise.all([
        dbService.getMarbetes(),
        dbService.getResidentes(),
        dbService.getAccessLogs()
      ]);
      setMarbetes(listMarbetes);
      setResidents(listResidents);
      setAccessLogs(listLogs || []);
    } catch (err) {
      console.error('Error fetching Marbete / Resident data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Keep QR generation synced when a marbete is opened matching preview
  useEffect(() => {
    if (selectedMarbete) {
      const pUrl = `${window.location.origin}${window.location.pathname}?pass=${selectedMarbete.qrcodeToken}`;
      generateQRWithLogo(pUrl)
        .then(url => setMarbeteQRUrl(url))
        .catch(err => console.error('Failed to generate high-fidelity QR for Marbete preview', err));
    } else {
      setMarbeteQRUrl('');
    }
  }, [selectedMarbete]);

  const handleOpenCreateForm = () => {
    setEditingId(null);
    let defaultResId = '';
    if (currentUser?.role === 'residente') {
      let boundRes = residents.find(r => 
        r.nombre.toLowerCase() === currentUser.name?.toLowerCase() || 
        r.accessUserId === currentUser.uid
      );
      if (!boundRes) {
        const subRes = residents.filter(r => r.residenciaId === currentUser.residenciaId);
        if (subRes.length > 0) {
          boundRes = subRes[0];
        } else if (residents.length > 0) {
          boundRes = residents[0];
        }
      }
      defaultResId = boundRes ? boundRes.id : 'resd-demo-1';
    } else {
      defaultResId = residents.length > 0 ? residents[0].id : '';
    }
    setSelectedResidentId(defaultResId);
    setVehiculoPlacas('');
    setVehiculoInfo('');
    setVisitaNombre('');
    setStatus(UserStatus.ACTIVE);

    // Default dates - from today until exactly 1 month from now, or 1 day if resident
    const nowLocal = new Date();
    setValidFrom(new Date(nowLocal.getTime() - (nowLocal.getTimezoneOffset() * 60000)).toISOString().slice(0, 16));
    
    const oneMonthLater = new Date(nowLocal);
    if (currentUser?.role === 'residente') {
      oneMonthLater.setDate(oneMonthLater.getDate() + 1);
    } else {
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    }
    setValidUntil(new Date(oneMonthLater.getTime() - (nowLocal.getTimezoneOffset() * 60000)).toISOString().slice(0, 16));

    setIsFormOpen(true);
  };

  const handleOpenEditForm = (marbete: Marbete) => {
    setEditingId(marbete.id);
    setSelectedResidentId(marbete.residenteId);
    setVehiculoPlacas(marbete.vehiculoPlacas || '');
    setVehiculoInfo(marbete.vehiculoInfo || '');
    setVisitaNombre(marbete.residenteNombre || '');
    setStatus(marbete.status);
    setValidFrom(new Date(marbete.validFrom).toISOString().slice(0, 16));
    setValidUntil(new Date(marbete.validUntil).toISOString().slice(0, 16));
    setIsFormOpen(true);
  };

  const handleSaveMarbete = async (e: React.FormEvent) => {
    e.preventDefault();

    let res: any = null;
    if (currentUser?.role === 'residente') {
      let boundRes = residents.find(r => 
        r.id === selectedResidentId ||
        r.nombre.toLowerCase() === currentUser.name?.toLowerCase() || 
        r.accessUserId === currentUser.uid
      );
      if (!boundRes) {
        const subRes = residents.filter(r => r.residenciaId === currentUser.residenciaId);
        if (subRes.length > 0) {
          boundRes = subRes[0];
        } else if (residents.length > 0) {
          boundRes = residents[0];
        }
      }
      if (boundRes) {
        res = {
          id: boundRes.id,
          nombre: boundRes.nombre,
          residenciaId: boundRes.residenciaId,
          residenciaNombre: boundRes.residenciaNombre
        };
      } else {
        res = {
          id: 'resd-demo-1',
          nombre: currentUser.name || 'Haroldo Residente',
          residenciaId: currentUser.residenciaId || 'res-demo-1',
          residenciaNombre: currentUser.residenciaNombre || 'Lomas de Chapultepec'
        };
      }
    } else {
      if (!selectedResidentId) {
        alert('Por favor selecciona un Residente de la lista.');
        return;
      }
      res = residents.find(r => r.id === selectedResidentId);
    }

    if (!res) {
      alert('El residente seleccionado no es válido.');
      return;
    }

    // Standard UUID generator fallback
    const randomHex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    const qrcodeToken = editingId 
      ? marbetes.find(m => m.id === editingId)?.qrcodeToken || `mar_token_${randomHex()}${randomHex()}`
      : `mar_token_${randomHex()}${randomHex()}`;

    // Force 1-day validity logic if resident
    let finalValidUntil = validUntil;
    if (currentUser?.role === 'residente') {
      const fromDate = new Date(validFrom);
      const toDate = new Date(fromDate.getTime() + 24 * 60 * 60 * 1000); // 1-day limit
      finalValidUntil = toDate.toISOString();
    }

    const rawPayload = {
      residenteId: res.id,
      residenteNombre: currentUser?.role === 'residente' ? (visitaNombre.trim() || res.nombre) : res.nombre,
      residenciaId: res.residenciaId,
      residenciaNombre: res.residenciaNombre || 'Residencial',
      vehiculoPlacas: vehiculoPlacas.trim().toUpperCase(),
      vehiculoInfo: vehiculoInfo.trim(),
      status,
      validFrom: new Date(validFrom).toISOString(),
      validUntil: new Date(finalValidUntil).toISOString(),
      qrcodeToken,
      createdAt: editingId ? (marbetes.find(m => m.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        // Edit Mode
        await dbService.updateMarbete(editingId, rawPayload);
      } else {
        // Create Mode
        await dbService.createMarbete(rawPayload);
      }
      setIsFormOpen(false);
      loadData();
      if (onRefresh) onRefresh();
      alert(editingId ? '¡Marbete modificado con éxito!' : '¡Marbete generado con éxito!');
    } catch (err: any) {
      console.error('Failed to save Marbete:', err);
      alert('Hubo un error al guardar el Marbete: ' + (err.message || err));
    }
  };

  const handleDeleteMarbete = async (id: string) => {
    try {
      await dbService.deleteMarbete(id);
      setDeleteConfirmId(null);
      loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to delete marbete:', err);
    }
  };

  const getWhatsAppShareLink = (marbete: Marbete): string => {
    const resident = residents.find(r => r.id === marbete.residenteId);
    const destinationPhone = resident?.whatsapp || '';
    if (!destinationPhone) return '';

    const validityStr = new Date(marbete.validUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const appPassLink = `${window.location.origin}${window.location.pathname}?pass=${marbete.qrcodeToken}`;

    const text = `Hola, *${marbete.residenteNombre}* 👋\n\nTu *Marbete Vehicular Digital* autorizado para control de acceso ha sido generado correctamente:\n\n*🔢 No Consecutivo:* #${marbete.consecutivo}\n*🚗 Vehículo:* ${marbete.vehiculoInfo || 'No especificado'} (${marbete.vehiculoPlacas ? `Placas: ${marbete.vehiculoPlacas}` : 'Sin placas registrada'})\n*📅 Vigencia hasta:* ${validityStr}\n\nPuedes abrir tu código QR oficial y descargarlo en alta resolución haciendo clic aquí:\n🔗 ${appPassLink}\n\n*⚠️ Instrucciones:* Por favor, guarda el código JPG en tu celular y proyéctalo frente a la caseta del oficial de vigilancia o lector de acceso al ingresar.\n\n¡Que tengas un excelente día! ✨`;

    // Strip characters from phone numbers
    const cleanPhone = destinationPhone.replace(/\D/g, '');
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  };

  const handleShareWhatsApp = (marbete: Marbete) => {
    const link = getWhatsAppShareLink(marbete);
    if (!link) {
      alert('El residente asociado no tiene un número de celular de WhatsApp registrado.');
      return;
    }
    window.open(link, '_blank');
  };

  const filteredMarbetes = marbetes.filter(m => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (
      m.residenteNombre.toLowerCase().includes(q) ||
      m.residenciaNombre.toLowerCase().includes(q) ||
      (m.vehiculoPlacas || '').toLowerCase().includes(q) ||
      (m.vehiculoInfo || '').toLowerCase().includes(q) ||
      m.consecutivo?.toString().includes(q)
    );
    const matchesResidence = currentUser?.residenciaId ? m.residenciaId === currentUser.residenciaId : true;
    const isResidentRole = currentUser?.role === 'residente';
    
    // Helper function to normalize names without " (Residente)" or " (Visita)"
    const normalizeName = (nameStr: string) => {
      if (!nameStr) return '';
      return nameStr.replace(/\s*\(Visita\)/g, '').replace(/\s*\(Residente\)/g, '').trim().toLowerCase();
    };

    const matchesResidentSelf = isResidentRole
      ? (
          // 1. If residence ID matches, it's safety matched!
          (currentUser.residenciaId && m.residenciaId === currentUser.residenciaId) ||
          // 2. Or direct UID matches
          m.residenteId === currentUser.uid ||
          // 3. Or normalized names are highly matching
          (currentUser.name && normalizeName(m.residenteNombre).includes(normalizeName(currentUser.name))) ||
          // 4. Or the resident records in the list match
          residents.some(r => r.id === m.residenteId && (
            r.accessUserId === currentUser.uid ||
            (currentUser.name && normalizeName(r.nombre).includes(normalizeName(currentUser.name)))
          ))
        )
      : true;
    
    if (isResidentRole) {
      return matchesSearch && matchesResidentSelf;
    }
    return matchesSearch && matchesResidence;
  });

  return (
    <div id="marbetes-manager-root" className="bg-[#141417] text-slate-100 rounded-3xl p-6 border border-[#27272a] shadow-xl font-sans relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-650/5 blur-3xl rounded-full pointer-events-none"></div>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-EVENTO pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-650/15 border border-red-500/25 rounded-xl flex items-center justify-center">
              <Car className="w-5.5 h-5.5 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {currentUser?.role === 'residente' ? 'Mis Marbetes de Visita' : 'Administración de Marbetes'}
              </h2>
              <p className="text-xs text-slate-400">
                {currentUser?.role === 'residente'
                  ? 'Genera marbetes digitales de 1 día para el acceso de tus visitas o vehículos autorizados.'
                  : 'Genera marbetes digitales e imágenes QR con vigencia mensual para acceso de residentes.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refrescar lista"
            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-slate-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            id="btn-create-marbete"
            onClick={handleOpenCreateForm}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-red-650 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Generar Marbete
          </button>
        </div>
      </div>

      {/* Info Notice */}
      <div className="mb-6 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <p className="font-bold text-slate-100 mb-0.5">
            {currentUser?.role === 'residente' ? 'Vigencia de Marbetes de Visita' : 'Vigencia y Visualización de Logo'}
          </p>
          {currentUser?.role === 'residente' ? (
            <>Los marbetes para visitas creados por residentes tienen una <strong>vigencia automática de 1 día</strong> (24 horas desde la fecha de inicio). Una vez emitido, puedes exportar el código QR con el logotipo oficial y enviarlo directamente por WhatsApp.</>
          ) : (
            <>Los marbetes se generan con vigencia configurable (recomendado: 1 mes) y muestran automáticamente el escudo oficial de la corporación. Se exportan como imagen JPEG lista para que el residente la guarde en su móvil, permitiendo compartirla directamente a través de WhatsApp.</>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por residente, manzana/interior, placas de vehículo o consecutivio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10.5 pr-4 py-2.5 bg-[#1B1B1F] border border-zinc-800 rounded-xl text-slate-250 placeholder-slate-500 text-xs focus:outline-none focus:border-red-550 focus:ring-1 focus:ring-red-550/30 transition shadow-inner font-sans"
          />
        </div>
      </div>

      {/* Grid or Table list */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-slate-400">Cargando catálogo de marbetes...</p>
        </div>
      ) : filteredMarbetes.length === 0 ? (
        <div className="py-16 text-center bg-[#1B1B1F]/30 rounded-2xl border border-dashed border-zinc-800">
          <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No se encontraron marbetes</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm ? 'No hay registros que coincidan con su búsqueda.' : 'Aún no se han generado marbetes de control de acceso.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                <th className="py-3 px-4">Consecutivo</th>
                <th className="py-3 px-4">Residente</th>
                <th className="py-3 px-4">Residencia</th>
                <th className="py-3 px-4">Vehículo</th>
                <th className="py-3 px-4">Placas</th>
                <th className="py-3 px-4">Vigencia</th>
                <th className="py-3 px-4">Estudio</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50 text-xs">
              {filteredMarbetes.map((m) => {
                const isExpired = new Date(m.validUntil) < new Date();
                return (
                  <tr key={m.id} className="hover:bg-zinc-800/10 transition group text-slate-300">
                    <td className="py-2.5 px-4 font-mono font-bold text-red-400">
                      #{m.consecutivo}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-100">
                      {m.residenteNombre}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {m.residenciaNombre}
                    </td>
                    <td className="py-2.5 px-4">
                      {m.vehiculoInfo || <span className="text-slate-600 italic">No registrado</span>}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-200">
                      {m.vehiculoPlacas || <span className="text-slate-600 italic">N/A</span>}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-[11px] text-slate-300">
                          {new Date(m.validUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          Vence en {Math.ceil((new Date(m.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} días
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      {(() => {
                        const hasEntered = accessLogs.some(log => 
                          log.documentId === 'MARBETE-' + m.consecutivo && 
                          log.type === 'check-in' &&
                          log.status === 'success'
                        );
                        
                        let colorClass = '';
                        let text = '';
                        
                        if (isExpired) {
                          colorClass = 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
                          text = 'EXPIRADO 🕰️';
                        } else if (hasEntered) {
                          colorClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                          text = 'INGRESADO ✓';
                        } else {
                          colorClass = 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
                          text = 'PENDIENTE';
                        }
                        
                        return (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${colorClass}`}>
                            {text}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition">
                        <button
                          onClick={() => {
                            setSelectedMarbete(m);
                            setIsQRModalOpen(true);
                          }}
                          className="p-10.5 text-slate-400 hover:text-white bg-zinc-800 hover:bg-zinc-700/80 rounded-lg cursor-pointer transition"
                          title="Ver Marbete QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleShareWhatsApp(m)}
                          className="p-10.5 text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg cursor-pointer transition"
                          title="Compartir por WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEditForm(m)}
                          className="p-10.5 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg cursor-pointer transition"
                          title="Editar Vehículo/Vigencia"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {deleteConfirmId === m.id ? (
                          <div className="flex items-center gap-1 bg-red-950/40 p-1 rounded-lg border border-red-500/30">
                            <button
                              onClick={() => handleDeleteMarbete(m.id)}
                              className="px-2 py-0.5 bg-red-650 hover:bg-red-600 text-white rounded text-[10px] font-bold transition"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 bg-zinc-700 hover:bg-zinc-600 text-slate-200 rounded text-[10px] font-medium transition"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(m.id)}
                            className="p-10.5 text-rose-500 hover:text-rose-450 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg cursor-pointer transition"
                            title="Eliminar Marbete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --- QR PREVIEW DIGITAL MARBETE OVERLAY MODAL --- */}
      {isQRModalOpen && selectedMarbete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-2xl relative flex flex-col items-center">
            
            <button
              onClick={() => {
                setIsQRModalOpen(false);
                setSelectedMarbete(null);
              }}
              className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* --- ACTUAL DIGITAL MARBETE visual card preview matching layout --- */}
            <div id="marbete-digital-card-preview" className="w-full bg-[#111827] rounded-[1.5rem] p-5 border border-slate-800/80 mb-5 flex flex-col items-center text-center">
              
              {/* Crest Centered above QR */}
              <div className="w-36 h-36 flex items-center justify-center mb-0.5 drop-shadow-xl">
                <img 
                  src="https://cossma.com.mx/cnls.png" 
                  alt="Escudo de Armas" 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-xs font-bold text-slate-100 tracking-[0.2em] uppercase mt-1">
                Marbete Autorizado
              </div>
              <div className="text-xs font-mono text-red-500 font-extrabold tracking-widest mb-3">
                CONSECUTIVO: #{selectedMarbete.consecutivo}
              </div>

              {/* White boxed QR design */}
              <div className="bg-white p-4.5 rounded-[1.5rem] shadow-lg inline-block border-2 border-slate-800">
                {marbeteQRUrl ? (
                  <img 
                    src={marbeteQRUrl} 
                    alt="Marbete QR" 
                    className="w-40 h-40 block"
                    referrerPolicy="referrer"
                  />
                ) : (
                  <div className="w-40 h-40 bg-slate-100 animate-pulse rounded flex items-center justify-center text-slate-400 text-xs">Generando QR...</div>
                )}
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wide">{selectedMarbete.residenteNombre}</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{selectedMarbete.residenciaNombre}</p>
                
                {/* Vehicle specifications badges */}
                {(selectedMarbete.vehiculoPlacas || selectedMarbete.vehiculoInfo) && (
                  <div className="mt-2.5 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl inline-block leading-snug">
                    {selectedMarbete.vehiculoPlacas && (
                      <p className="text-[11px] font-mono text-red-400 font-bold uppercase tracking-wider">
                        PLACAS: {selectedMarbete.vehiculoPlacas}
                      </p>
                    )}
                    {selectedMarbete.vehiculoInfo && (
                      <p className="text-[10px] text-slate-350 font-sans font-medium mt-0.5">
                        {selectedMarbete.vehiculoInfo}
                      </p>
                    )}
                  </div>
                )}

                {/* Expiration warning */}
                <div className="mt-3.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <Calendar className="w-3 h-3" />
                  <span>VENCE: {new Date(selectedMarbete.validUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="w-full flex flex-col gap-2 font-sans">
              <button
                onClick={() => marbeteQRUrl && exportMarbeteToJPG(selectedMarbete, marbeteQRUrl)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> Descargar Imagen Marbete (JPG)
              </button>
              
              <button
                onClick={() => handleShareWhatsApp(selectedMarbete)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> Enviar por WhatsApp
              </button>
              
              <div className="text-center text-[10px] text-slate-500 font-mono select-all bg-slate-950 p-2 rounded-lg border border-slate-800">
                Pase URL: <span className="text-slate-400">{window.location.origin}{window.location.pathname}?pass={selectedMarbete.qrcodeToken}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- CREATE / EDIT FORM OVERLAY MODAL --- */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-[#1B1B1F] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative font-sans">
            
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-zinc-800 hover:bg-zinc-700 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-red-500" />
              {editingId ? 'Modificar Registro de Marbete' : 'Generar Nuevo Marbete Oficial'}
            </h3>

            <form onSubmit={handleSaveMarbete} className="space-y-4 text-xs">
              
              {/* Resident Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  {currentUser?.role === 'residente' ? 'Nombre Completo de la Visita (Beneficiario) *' : 'Seleccionar Residente Asociado *'}
                </label>
                {currentUser?.role === 'residente' ? (
                  <input
                    type="text"
                    required
                    placeholder="Escribe el nombre de tu visita..."
                    value={visitaNombre}
                    onChange={(e) => setVisitaNombre(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#1B1B1F] border border-zinc-800 rounded-xl text-slate-100 font-bold placeholder-zinc-700 focus:outline-none focus:border-red-550 focus:ring-1 focus:ring-red-550/30 transition shadow-inner"
                  />
                ) : editingId ? (
                  <div className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-slate-100 font-bold">
                    {marbetes.find(m => m.id === editingId)?.residenteNombre}
                  </div>
                ) : (
                  <select
                    value={selectedResidentId}
                    onChange={(e) => setSelectedResidentId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-slate-200 focus:outline-none focus:border-red-550 transition"
                  >
                    <option value="" disabled>Selecciona un residente...</option>
                    {residents
                      .filter(r => currentUser?.residenciaId ? r.residenciaId === currentUser.residenciaId : true)
                      .map(r => (
                        <option key={r.id} value={r.id}>
                          {r.nombre} ({r.residenciaNombre || 'Sin domicilio'})
                        </option>
                      ))}
                  </select>
                )}
                <p className="text-[10px] text-slate-500 mt-1">
                  {currentUser?.role === 'residente' 
                    ? 'El marbete digital se registrará a nombre de tu visita y se vinculará a tu domicilio.' 
                    : 'El marbete digital incluirá automáticamente la residencia y contacto del residente.'}
                </p>
              </div>

              {/* Placas */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Placas del Vehículo
                </label>
                <input
                  type="text"
                  placeholder="Ej: XYZ-1234, o 'Sin Placas'"
                  value={vehiculoPlacas}
                  onChange={(e) => setVehiculoPlacas(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1B1B1F] border border-zinc-800 rounded-xl text-slate-100 font-bold font-mono uppercase tracking-wide focus:outline-none focus:border-red-550 focus:ring-1 focus:ring-red-550/30 transition shadow-inner"
                />
              </div>

              {/* VehiculoInfo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Detalles del Vehículo (Modelo/Color)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Sentra Gris 2022, Pick-Up Ford Roja"
                  value={vehiculoInfo}
                  onChange={(e) => setVehiculoInfo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1B1B1F] border border-zinc-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-550 focus:ring-1 focus:ring-red-550/30 transition shadow-inner"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Estado de Acceso
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UserStatus)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-slate-200 focus:outline-none focus:border-red-550 transition"
                >
                  <option value={UserStatus.ACTIVE}>Activo (Acceso Autorizado)</option>
                  <option value={UserStatus.SUSPENDED}>Suspendido (Temporalmente revocado)</option>
                </select>
              </div>

              {/* Validity Dates */}
              {currentUser?.role === 'residente' ? (
                <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5 text-[11px] font-bold text-red-400 uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    Vigencia Restringida (1 Día de Visita)
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal mb-3">
                    Como residente, tus pases de marbete vehicular se emiten con vigencia exacta de 24 horas a partir del momento de inicio. No requieres configurar fecha de término.
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                      Fecha y Hora de Inicio
                    </label>
                    <input
                      type="datetime-local"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-slate-200 focus:outline-none focus:border-red-550 transition font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                      Vigente Desde
                    </label>
                    <input
                      type="datetime-local"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#1B1B1F] border border-zinc-800 rounded-xl text-slate-200 focus:outline-none focus:border-red-550 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                      Vigente Hasta
                    </label>
                    <input
                      type="datetime-local"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#1B1B1F] border border-zinc-800 rounded-xl text-slate-200 focus:outline-none focus:border-red-550 transition"
                    />
                  </div>
                </div>
              )}

              {/* Final form actions */}
              <div className="flex justify-end gap-2.5 border-t border-zinc-800/80 pt-4 mt-5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-medium rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-5 py-2 bg-red-650 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingId ? 'Guardar Cambios' : 'Confirmar & Generar'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
