/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Info, Check, X, Shield, RefreshCw
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { Caseta, Residencia } from '../types';

interface CasetasManagerProps {
  onRefresh?: () => void;
  currentUser?: any;
}

export default function CasetasManager({ onRefresh, currentUser }: CasetasManagerProps) {
  const [casetas, setCasetas] = useState<Caseta[]>([]);
  const [residencias, setResidencias] = useState<Residencia[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNombre, setFormNombre] = useState<string>('');
  const [formResidenciaId, setFormResidenciaId] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const casList = await dbService.getCasetas();
      setCasetas(casList);

      const resList = await dbService.getResidencias();
      setResidencias(resList);
    } catch (e) {
      console.error('Error loading data in CasetasManager:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormNombre('');
    // Require explicit selection or use active visited residence
    setFormResidenciaId(currentUser?.residenciaId || '');
    setFormIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: Caseta) => {
    setEditingId(item.id);
    setFormNombre(item.nombre);
    setFormResidenciaId(item.residenciaId);
    setFormIsActive(item.isActive);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      alert('Por favor ingrese el nombre de la caseta.');
      return;
    }
    if (!formResidenciaId) {
      alert('Por favor asigne una residencia a esta caseta.');
      return;
    }

    const assignedRes = residencias.find(r => r.id === formResidenciaId);
    const resNombre = assignedRes ? assignedRes.nombre : 'Sin Asignar';

    const payload = {
      nombre: formNombre.trim(),
      residenciaId: formResidenciaId,
      residenciaNombre: resNombre,
      isActive: formIsActive,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        await dbService.updateCaseta(editingId, payload);
      } else {
        await dbService.createCaseta({
          ...payload,
          createdAt: new Date().toISOString()
        });
      }
      setIsFormOpen(false);
      loadData();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error saving caseta:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar permanentemente esta caseta de seguridad?')) {
      try {
        await dbService.deleteCaseta(id);
        loadData();
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Error deleting caseta:', error);
      }
    }
  };

  const handleToggleActive = async (item: Caseta) => {
    try {
      await dbService.updateCaseta(item.id, { isActive: !item.isActive });
      loadData();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error toggling caseta state:', error);
    }
  };

  const filteredCasetas = casetas.filter(c => {
    const matchesSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.residenciaNombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResidence = currentUser?.residenciaId ? c.residenciaId === currentUser.residenciaId : true;
    return matchesSearch && matchesResidence;
  });

  return (
    <div id="casetas-manager-root" className="space-y-6 font-sans">
      {/* Upper Action Hub */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>
            🛡️ Módulo de Casetas de Seguridad
          </h2>
          <p className="text-xs text-slate-400">
            Registre casetas de vigilancia y asigne sus controles de acceso a residencias específicas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            title="Recargar datos"
            className="p-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleOpenCreateForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-650 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-red-600/15 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Registrar Caseta
          </button>
        </div>
      </div>

      {/* Main filter & table view */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-5 border-b border-slate-900/80 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar caseta por nombre o residencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
            />
          </div>
          
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <span>Total casetas:</span>
            <strong className="text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono">
              {filteredCasetas.length}
            </strong>
          </div>
        </div>

        {filteredCasetas.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center">
            <Shield className="w-10 h-10 text-slate-700 mb-3 animate-pulse" />
            <p className="text-sm font-semibold">No se encontraron casetas registradas</p>
            <p className="text-xs text-slate-600 mt-1">Cree una caseta usando el botón Registrar Caseta superior.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#020617] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-900">
                <tr>
                  <th className="py-3 px-4">Nombre de Caseta</th>
                  <th className="py-3 px-4">Residencia Asignada</th>
                  <th className="py-3 px-4">Estado de Operación</th>
                  <th className="py-3 px-4">Identificador</th>
                  <th className="py-3 px-4">Registrada el</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 font-sans">
                {filteredCasetas.map((cas) => (
                  <tr key={cas.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      🛡️ {cas.nombre}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-red-400">🏡 {cas.residenciaNombre}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(cas)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide transition cursor-pointer ${
                          cas.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${cas.isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`}></span>
                        {cas.isActive ? 'OPERATIVA ✓' : 'INACTIVA ✗'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                      {cas.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-450 font-mono text-[10px]">
                      {new Date(cas.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleOpenEditForm(cas)}
                          className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cas.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation / Editing Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200 border-b border-slate-900 pb-3 mb-4">
              {editingId ? '📝 Editar Configuración de Caseta' : '🛡️ Registrar Nueva Caseta'}
            </h3>

            {residencias.length === 0 ? (
              <div className="p-4 bg-amber-500/10 border border-amber-505/20 rounded-xl space-y-2">
                <p className="text-xs text-amber-300 font-semibold">⚠️ Requiere Residencias</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Para poder registrar una Caseta, primero debe dar de alta al menos una Residencia en el panel correspondiente.
                </p>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="mt-1 px-3 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-lg uppercase"
                >
                  Regresar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold uppercase text-slate-400">Nombre de la Caseta / Punto de Control</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Caseta Norte - Acceso Principal"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold uppercase text-slate-400">Residencia Responsable</label>
                  <select
                    disabled={!!currentUser?.residenciaId}
                    value={formResidenciaId}
                    onChange={(e) => setFormResidenciaId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Seleccione una residencia --</option>
                    {residencias.map(r => (
                      <option key={r.id} value={r.id}>
                        🏡 {r.nombre} (ID: {r.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 font-serif italic">
                    La caseta controlará los accesos autorizados y bitácoras asociadas a esta localidad.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="caseta-active"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 bg-slate-950 border border-slate-800 rounded text-red-500 focus:ring-transparent accent-red-650"
                  />
                  <label htmlFor="caseta-active" className="text-xs text-slate-300 font-bold select-none cursor-pointer">
                    Habilitar caseta en servicio hoy
                  </label>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-900 mt-5">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 py-2 text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs bg-red-650 hover:bg-red-600 text-white rounded-xl transition font-bold"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
