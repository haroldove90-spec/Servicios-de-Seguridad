/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Search, RefreshCw, Filter, ShieldCheck, Check, X, Clock, HelpCircle, Activity } from 'lucide-react';
import { AccessLog, LogType, LogStatus } from '../types';

interface AuditLogsProps {
  logs: AccessLog[];
  onRefresh: () => void;
  currentUser?: any;
}

export default function AuditLogs({ logs: rawLogs, onRefresh, currentUser }: AuditLogsProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter rawLogs based on residence boundary if applicable
  const logs = currentUser?.residenciaId 
    ? rawLogs.filter(l => l.residenciaId === currentUser.residenciaId)
    : rawLogs;

  // Multi-criteria filtering logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.documentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.guardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate analytical metrics
  const totalScans = logs.length;
  const successfulScans = logs.filter(l => l.status === LogStatus.SUCCESS).length;
  const failedScans = totalScans - successfulScans;
  const checkinsCount = logs.filter(l => l.type === LogType.CHECK_IN && l.status === LogStatus.SUCCESS).length;
  const checkoutsCount = logs.filter(l => l.type === LogType.CHECK_OUT && l.status === LogStatus.SUCCESS).length;
  
  // Format access ratios
  const successRate = totalScans > 0 ? Math.round((successfulScans / totalScans) * 100) : 100;

  // Export to CSV Function
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No hay registros en la lista actual para exportar.');
      return;
    }

    // CSV Headers
    const headers = ['ID Registro', 'ID Usuario', 'Nombre Visitante', 'Cédula/Documento', 'Fecha/Hora ISO', 'Tipo Acción', 'Resultado Escaneo', 'ID Guardia', 'Nombre Guardia'];
    
    // Process rows escaping quotes for RFC safety
    const rows = filteredLogs.map(log => [
      log.id,
      log.userId,
      `"${log.userName.replace(/"/g, '""')}"`,
      `"${log.documentId.replace(/"/g, '""')}"`,
      log.timestamp,
      log.type,
      log.status,
      log.guardId,
      `"${log.guardName.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    // Add UTF-8 BOM representation to make it immediately readable in MS Excel without character issues
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Temporary anchor execution for download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `auditoria_accesos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusLabel = (status: LogStatus) => {
    switch (status) {
      case LogStatus.SUCCESS: return '✓ Aprobado';
      case LogStatus.REVOKED_USER: return '⚠ Suspendido';
      case LogStatus.ALREADY_USED: return '⚠ Ya Usado';
      case LogStatus.EXPIRED_TOKEN: return '✗ Pase Expirado';
      case LogStatus.OUTSIDE_SCHEDULE: return '⚠ Horario Inválido';
      default: return 'Desconocido';
    }
  };

  const getStatusBadgeStyles = (status: LogStatus) => {
    switch (status) {
      case LogStatus.SUCCESS:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case LogStatus.REVOKED_USER:
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case LogStatus.ALREADY_USED:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case LogStatus.EXPIRED_TOKEN:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case LogStatus.OUTSIDE_SCHEDULE:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-[#020617] text-slate-350 border-slate-800';
    }
  };

  return (
    <div id="analytics-and-logs-container" className="space-y-6">
      {/* Visual Analytics Mini Tiles */}
      <div id="metrics-grid-board" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div id="metric-tile-total" className="bg-[#2A2A2E] border border-[#3e3e42] p-5 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lecturas Hechas</span>
            <span className="p-1.5 bg-[#1A1A1E] rounded-lg text-slate-400 border border-[#3e3e42]"><Activity className="w-3.5 h-3.5" /></span>
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-mono">{totalScans}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Historial acumulado</p>
        </div>

        <div id="metric-tile-success" className="bg-[#2A2A2E] border border-[#3e3e42] p-5 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aprobaciones</span>
            <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20"><ShieldCheck className="w-3.5 h-3.5" /></span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2 font-mono">{successfulScans}</p>
          <p className="text-[10px] text-emerald-500/80 mt-0.5 font-semibold">{successRate}% de pases aprobados</p>
        </div>

        <div id="metric-tile-failed" className="bg-[#2A2A2E] border border-[#3e3e42] p-5 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bajo Sospecha</span>
            <span className="p-1.5 bg-rose-500/10 rounded-lg text-rose-450 border border-rose-500/20"><X className="w-3.5 h-3.5" /></span>
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2 font-mono">{failedScans}</p>
          <p className="text-[10px] text-rose-500/80 mt-0.5 font-semibold">Rechazos o credenciales vencidas</p>
        </div>

        <div id="metric-tile-presence" className="bg-[#2A2A2E] border border-[#3e3e42] p-5 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tránsito Interno</span>
            <span className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20"><Clock className="w-3.5 h-3.5" /></span>
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-mono">{Math.max(0, checkinsCount - checkoutsCount)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Entradas netas en sitio</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div id="logs-list-cabinet" className="bg-[#2A2A2E] rounded-2xl border border-[#3e3e42] shadow-2xl overflow-hidden font-sans">
        
        {/* Table Filters Top Bar */}
        <div id="logs-filters-hub" className="p-5 border-b border-[#3e3e42] space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="search-audit-input"
              type="text"
              placeholder="Buscar por visitante, lote o residente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-xs bg-[#1A1A1E] border border-[#3e3e42] rounded-xl text-slate-100 placeholder-slate-500 focus:border-red-500 focus:outline-hidden"
            />
          </div>

          <div id="logs-filtering-controls" className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-[#1A1A1E] px-2.5 py-1.5 rounded-lg border border-[#3e3e42]">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                id="select-filter-type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-[11px] bg-transparent font-semibold text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="all" className="bg-[#1A1A1E]">Filtro: Todo Movimiento</option>
                <option value={LogType.CHECK_IN} className="bg-[#1A1A1E]">Check-in (Entradas)</option>
                <option value={LogType.CHECK_OUT} className="bg-[#1A1A1E]">Check-out (Salidas)</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-[#1A1A1E] px-2.5 py-1.5 rounded-lg border border-[#3e3e42]">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="select-filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-[11px] bg-transparent font-semibold text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="all" className="bg-[#1A1A1E]">Filtro: Todo Resultado</option>
                <option value={LogStatus.SUCCESS} className="bg-[#1A1A1E]">Aprobados (✓)</option>
                <option value={LogStatus.ALREADY_USED} className="bg-[#1A1A1E]">Intentos de Re-uso</option>
                <option value={LogStatus.EXPIRED_TOKEN} className="bg-[#1A1A1E]">Pases Caducados</option>
                <option value={LogStatus.REVOKED_USER} className="bg-[#1A1A1E]">Cuentas Suspendidas</option>
                <option value={LogStatus.OUTSIDE_SCHEDULE} className="bg-[#1A1A1E]">Fuera de Horario</option>
              </select>
            </div>

            <button
              id="btn-refresh-audit-trail"
              onClick={onRefresh}
              className="p-2 text-slate-400 bg-[#1A1A1E] hover:bg-zinc-800 border border-[#3e3e42] rounded-lg transition cursor-pointer"
              title="Sincronizar base de datos"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-export-csv-reports"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </button>
          </div>
        </div>

        {/* Access Logs Interactive Grid */}
        <div id="reactive-logs-table-view" className="overflow-x-auto">
          {filteredLogs.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1A1A1E] border-b border-[#3e3e42] text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                  <th className="py-3.5 px-5">Fecha / Hora</th>
                  <th className="py-3.5 px-4">Visitante</th>
                  <th className="py-3.5 px-4 font-mono">Documento</th>
                  <th className="py-3.5 px-4 text-center">Tipo</th>
                  <th className="py-3.5 px-4">Resultado de Acceso</th>
                  <th className="py-3.5 px-5 font-medium text-right">Validado Por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3e3e42]/40 text-xs text-slate-200 font-sans">
                {filteredLogs.map((log) => (
                  <tr key={log.id} id={`log-row-${log.id}`} className="hover:bg-zinc-800/20 transition">
                    <td className="py-3.5 px-5 whitespace-nowrap text-slate-400 font-mono text-[10.5px]">
                      {new Date(log.timestamp).toLocaleDateString()} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-3.5 px-4 text-red-400 font-mono whitespace-nowrap">
                      {log.documentId}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-lg border ${
                        log.type === LogType.CHECK_IN
                          ? 'bg-red-500/10 text-red-405 border-red-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {log.type === LogType.CHECK_IN ? 'Entrada' : 'Salida'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeStyles(log.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${log.status === LogStatus.SUCCESS ? 'bg-emerald-455 animate-pulse' : 'bg-rose-455'}`} />
                        {getStatusLabel(log.status)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap text-right text-slate-400">
                      <span className="font-semibold text-slate-200">{(log.guardName || '').replace(/\s*\(Simulado\)/gi, '')}</span>
                      <span className="block text-[9.5px] text-slate-400 font-mono">{log.guardId}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div id="no-filtered-logs-alert" className="text-center py-16 px-4 bg-[#1A1A1E] rounded-2xl border border-dashed border-[#3e3e42] m-4">
              <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3 animate-pulse" />
              <h3 className="text-sm font-semibold text-slate-200">No se encontraron registros</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                Ajusta las keywords de búsqueda, los selectores de tipo o de resultado de aprobación para encontrar logs en el sistema.
              </p>
            </div>
          )}
        </div>

        {/* List Pagination / Row Counts Summary */}
        <div id="logs-footer-summary" className="p-4 bg-[#1A1A1E] border-t border-[#3e3e42] flex items-center justify-between text-[11px] text-slate-400 font-sans">
          <p>Mostrando <span className="font-semibold font-mono text-red-500">{filteredLogs.length}</span> registros de auditoría filtrados</p>
          <p className="font-mono">FCE82F95-B126-4211-BF43-3CEA902348FA</p>
        </div>
      </div>
    </div>
  );
}
