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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                className="bg-[#1E1E22] rounded-3xl border border-[#2D2D30] p-4 flex flex-col justify-between hover:border-slate-700/80 hover:shadow-xl transition relative group overflow-hidden"
              >
                <div>
                  {/* Photo Section */}
                  <div className="aspect-video bg-[#0C0C0E] rounded-2xl overflow-hidden relative border border-[#2D2D30] mb-4">
                    <img 
                      src={ev.photoUrl} 
                      referrerPolicy="no-referrer" 
                      alt="Captura placa" 
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-500" 
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition gap-2">
                      <button
                        onClick={() => setSelectedImage(ev.photoUrl)}
                        className="px-3 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-100 transition shadow-lg cursor-pointer"
                      >
                        Ampliar Foto
                      </button>
                    </div>
                  </div>

                  {/* Plates Graphic Representation & Timestamp */}
                  <div className="flex items-center justify-between mb-3 border-b border-[#2A2A2E] pb-2">
                    <div className="px-2.5 py-1 bg-white border-2 border-slate-950 border-b-4 font-mono font-black text-slate-900 rounded-md text-xs shadow-xs uppercase tracking-wider select-none">
                      {ev.placas || 'S/PLACA'}
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold font-mono">
                      <Calendar className="w-3 h-3 text-red-500" />
                      {formattedDate}
                    </span>
                  </div>

                  {/* Notes / Observaciones */}
                  <div className="space-y-2 mb-4 bg-[#121214] p-3 rounded-xl border border-[#202022]">
                    <div className="flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Observaciones:</span>
                        <p className="text-xs text-slate-350 italic mt-0.5">
                          {ev.notas ? `"${ev.notas}"` : 'Sin comentarios adicionales.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="border-t border-[#2A2A2E] pt-3.5 text-[10px] text-slate-400 space-y-2 mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-450" />
                      Vigilante: <strong className="text-slate-200">{ev.guardName}</strong>
                    </span>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar evidencia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-between gap-1 mt-1 bg-[#121214]/50 p-2 rounded-lg text-slate-450">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Residencia: <strong className="text-slate-300">{ev.residenciaNombre}</strong>
                    </span>
                    {ev.casetaNombre && (
                      <span className="block">
                        Caseta: <strong className="text-slate-300">{ev.casetaNombre}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enlarged Image Modal */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl w-full h-full max-h-[85vh] flex items-center justify-center">
            <img 
              src={selectedImage} 
              referrerPolicy="no-referrer" 
              alt="Placa ampliada" 
              className="max-w-full max-h-full rounded-2xl border border-slate-800 shadow-2xl object-contain select-none" 
            />
          </div>
          <div className="absolute top-4 right-4 bg-slate-900 border border-slate-800 rounded-full p-2 text-white font-bold text-xs select-none shadow-xl">
            Toca en cualquier parte para cerrar
          </div>
        </div>
      )}
    </div>
  );
}
