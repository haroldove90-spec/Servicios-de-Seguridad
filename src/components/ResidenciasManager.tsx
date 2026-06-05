/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Home, User, Shield, Info, Check, X } from 'lucide-react';
import { dbService } from '../services/dbService';
import { Residencia } from '../types';

interface ResidenciasManagerProps {
  onRefresh?: () => void;
}

export default function ResidenciasManager({ onRefresh }: ResidenciasManagerProps) {
  const [residencias, setResidencias] = useState<Residencia[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNombre, setFormNombre] = useState<string>('');
  const [formAdministrador, setFormAdministrador] = useState<string>('');
  const [formNumResidencias, setFormNumResidencias] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  const loadData = () => {
    dbService.getResidencias().then((data) => {
      setResidencias(data);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const filteredItems = residencias.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.administrador.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1e1e24] p-6 rounded-2xl border border-[#2e2e38] shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Home className="w-5 h-5 text-red-500" /> Registro de Residencia (Fraccionamientos)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Administre los fraccionamientos, condominios, sub-privadas y el número total de unidades residenciales.
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
            Total: <strong className="text-white">{residencias.length}</strong>
          </span>
          <span className="bg-[#1e1e24] border border-[#2e2e38] px-3 py-1.5 rounded-lg">
            Activos: <strong className="text-emerald-500">{residencias.filter(r => r.isActive).length}</strong>
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#18181c] border border-[#2e2e38] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e1e24]/60 border-b border-[#2e2e38] text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-6">Residencia / Fraccionamiento</th>
                <th className="py-4 px-6">Administrador</th>
                <th className="py-4 px-6 text-center">Nº Residencias</th>
                <th className="py-4 px-6 text-center">Estado</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e38] text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    {searchTerm ? 'No se encontraron resultados para la búsqueda.' : 'No hay residencias registradas en este momento.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1e1e24]/30 transition-all">
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
                    <td className="py-4 px-6 text-center text-slate-350 font-mono font-bold">
                      {item.numResidencias}
                    </td>
                    <td className="py-4 px-6 text-center">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Overlay Modal */}
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
    </div>
  );
}
