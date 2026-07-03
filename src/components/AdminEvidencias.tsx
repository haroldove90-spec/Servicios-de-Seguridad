/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Camera, Search, RefreshCw, Trash2, Calendar, MapPin, User, ShieldAlert, CheckCircle, FileText } from 'lucide-react';
import { dbService } from '../services/dbService';
import { Evidencia } from '../types';

interface AdminEvidenciasProps {
  currentUser: {
    uid: string;
    name: string;
    role: string;
    residenciaId?: string | null;
    residenciaNombre?: string | null;
  };
}

export default function AdminEvidencias({ currentUser }: AdminEvidenciasProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [evidenciasList, setEvidenciasList] = useState<Evidencia[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadEvidencias = async () => {
    setLoading(true);
    try {
      const allEv = await dbService.getEvidencias();
      setEvidenciasList(allEv);
    } catch (err) {
      console.error('Error fetching evidences for admin view:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidencias();
  }, [currentUser]);

  // Handle Residency Security Boundaries
  const userResId = currentUser.residenciaId;
  const filteredEvidencias = evidenciasList
    .filter(ev => {
      // If admin is assigned to a specific residence, only show their residence
      if (userResId) {
        return ev.residenciaId === userResId;
      }
      return true; // Global admin sees all
    })
    .filter(ev => {
      // Soft search filtering
      const query = searchTerm.toLowerCase();
      const matchPlacas = ev.placas?.toLowerCase().includes(query) || false;
      const matchGuard = ev.guardName?.toLowerCase().includes(query) || false;
      const matchNotes = ev.notas?.toLowerCase().includes(query) || false;
      const matchCaseta = ev.casetaNombre?.toLowerCase().includes(query) || false;
      const matchRes = ev.residenciaNombre?.toLowerCase().includes(query) || false;
      return matchPlacas || matchGuard || matchNotes || matchCaseta || matchRes;
    });

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar permanentemente esta evidencia de placa?')) {
      try {
        await dbService.deleteEvidencia(id);
        setEvidenciasList(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error('Error deleting evidence record:', err);
        alert('Ocurrió un error al intentar eliminar la evidencia.');
      }
    }
  };

  return (
    <div id="admin-evidencias-wrapper" className="space-y-6">
      <div className="bg-[#1E1E22] rounded-3xl p-6 border border-[#2D2D30] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2D2D30] pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Camera className="w-5 h-5 text-red-500 animate-pulse" />
              Evidencias de Placas de Vehículos
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {userResId 
                ? `Mostrando registros fotográficos exclusivos para la residencia asignada: ${currentUser.residenciaNombre || 'Residencia'}` 
                : 'Mostrando registros fotográficos corporativos de todas las casetas en el condominio general.'}
            </p>
          </div>

          <div className="flex bg-[#121214] border border-[#2D2D30] rounded-xl p-0.5">
            <button
              onClick={loadEvidencias}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sincronizar
            </button>
          </div>
        </div>

        {/* Searching controls & summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-6">
          <div className="md:col-span-8 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por placa, vigilante, caseta, notas u observaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#121214] border border-[#2D2D30] rounded-xl text-slate-200 placeholder-slate-550 focus:border-red-500 focus:outline-hidden text-xs font-medium"
            />
          </div>
          <div className="md:col-span-4 flex items-center justify-end">
            <p className="text-xs text-slate-450 font-sans">
              Filtrados: <strong className="text-slate-200">{filteredEvidencias.length}</strong> de <strong className="text-slate-400">{evidenciasList.length}</strong> totales
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Captured Evidences */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#1E1E22]/50 rounded-3xl border border-[#2D2D30] text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
          <p className="text-xs font-bold font-mono uppercase tracking-wider">Cargando base de evidencias fotográficas...</p>
        </div>
      ) : filteredEvidencias.length === 0 ? (
        <div className="text-center py-20 bg-[#1E1E22]/50 rounded-3xl border border-[#2D2D30] text-slate-505">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-slate-600 animate-bounce" />
          <h3 className="text-sm font-bold text-slate-300">No se encontraron evidencias registradas</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Ningún vigilante ha tomado fotos que coincidan con la búsqueda o pertenezcan a esta residencia bajo los niveles de aislamiento vigentes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {filteredEvidencias.map((ev) => {
            const formattedDate = new Date(ev.timestamp).toLocaleString([], {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div 
                key={ev.id} 
                className="bg-[#1E1E22] rounded-3xl border border-[#2D2D30] p-3 md:p-4 flex flex-col justify-between hover:border-slate-700/80 hover:shadow-xl transition relative group overflow-hidden"
              >
                <div>
                  {/* Photo Section - Made fully clickable with touch support */}
                  <div 
                    onClick={() => setSelectedImage(ev.photoUrl)}
                    className="aspect-video bg-[#0C0C0E] rounded-2xl overflow-hidden relative border border-[#2D2D30] mb-3 cursor-pointer group/photo"
                    title="Toca para ampliar foto 🔍"
                  >
                    <img 
                      src={ev.photoUrl} 
                      referrerPolicy="no-referrer" 
                      alt="Captura placa" 
                      className="w-full h-full object-cover group-hover/photo:scale-105 transition duration-500" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition">
                      <span className="px-2.5 py-1.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg tracking-wide border border-white/10">
                        🔍 Tocar para Ampliar
                      </span>
                    </div>
                  </div>

                  {/* Plates Graphic Representation & Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3 border-b border-[#2A2A2E] pb-2">
                    <div className="inline-block px-2 py-0.5 bg-white border-2 border-slate-950 border-b-[3px] font-mono font-black text-slate-900 rounded text-[10.5px] uppercase tracking-wider select-none w-max">
                      {ev.placas || 'S/PLACA'}
                    </div>
                    <span className="text-[9px] text-slate-550 flex items-center gap-1 font-semibold font-mono">
                      <Calendar className="w-2.5 h-2.5 text-red-500 shrink-0" />
                      {formattedDate}
                    </span>
                  </div>

                  {/* Notes / Observaciones */}
                  <div className="space-y-1.5 mb-3 bg-[#121214] p-2.5 rounded-xl border border-[#202022]">
                    <div className="flex items-start gap-1">
                      <FileText className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide block leading-none mb-0.5">Observaciones:</span>
                        <p className="text-[11px] leading-relaxed text-slate-350 italic">
                          {ev.notas ? `"${ev.notas}"` : 'Sin comentarios adicionales.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="border-t border-[#2A2A2E] pt-3 text-[9px] text-slate-500 space-y-1.5 mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 shrink-0 overflow-hidden">
                      <User className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                      <span className="truncate max-w-[80px]" title={ev.guardName}>Val: <strong className="text-slate-350">{ev.guardName}</strong></span>
                    </span>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Eliminar evidencia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-0.5 mt-1 bg-[#121214]/40 p-1.5 rounded-lg text-slate-500 font-mono text-[8.5px]">
                    <span className="truncate" title={ev.residenciaNombre}>
                      🏡 {ev.residenciaNombre}
                    </span>
                    {ev.casetaNombre && (
                      <span className="truncate" title={ev.casetaNombre}>
                        🛡️ {ev.casetaNombre}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enlarged Image Modal with Double-Zoom Tap Toggle support */}
      {selectedImage && (
        <ZoomableModal src={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  );
}

// Subcomponent to handle double-tap or tap magnification inside the modal
function ZoomableModal({ src, onClose }: { src: string; onClose: () => void }) {
  const [zoomedIn, setZoomedIn] = useState<boolean>(false);

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl w-full h-full max-h-[85vh] flex items-center justify-center overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={src} 
          referrerPolicy="no-referrer" 
          alt="Placa ampliada" 
          onClick={() => setZoomedIn(!zoomedIn)}
          className={`rounded-2xl border border-slate-800 shadow-2xl object-contain select-none max-w-full max-h-full transition-transform duration-300 cursor-zoom-in ${
            zoomedIn ? 'scale-[1.6] cursor-zoom-out' : 'scale-100 hover:scale-[1.02]'
          }`} 
        />
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-800 rounded-full px-4 py-2 text-white font-bold text-xs select-none shadow-xl pointer-events-none text-center">
        {zoomedIn ? "🔍 Toca la foto para quitar zoom" : "🔍 Toca la foto para 1.5x zoom • Toca fuera para cerrar"}
      </div>
    </div>
  );
}
