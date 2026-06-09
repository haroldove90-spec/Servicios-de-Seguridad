/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building, Users, QrCode, ClipboardList, Shield, ShieldCheck, 
  Clock, TrendingUp, ChevronRight, RefreshCcw, Landmark, 
  MapPin, CheckCircle2, AlertCircle, CalendarRange
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { AuthorizedUser, Residencia, Residente, Caseta, AccessLog, SystemRole, LogStatus } from '../types';

interface MetricasDashboardProps {
  currentAdminUser: any;
  onRefresh?: () => void;
}

export default function MetricasDashboard({ currentAdminUser, onRefresh }: MetricasDashboardProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [residencias, setResidencias] = useState<Residencia[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [casetas, setCasetas] = useState<Caseta[]>([]);
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>([]);
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resList, resdList, casList, rolesList, usersList, logsList] = await Promise.all([
        dbService.getResidencias(),
        dbService.getResidentes(),
        dbService.getCasetas(),
        dbService.getAllSystemRoles(),
        dbService.getAuthorizedUsers(),
        dbService.getAccessLogs()
      ]);

      setResidencias(resList);
      setResidentes(resdList);
      setCasetas(casList);
      setSystemRoles(rolesList);
      setAuthorizedUsers(usersList);
      setAccessLogs(logsList);
    } catch (err) {
      console.error('Error loading metric data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleManualSync = () => {
    loadAllData();
    if (onRefresh) onRefresh();
  };

  // Filter lists based on Admin's specific residencia bound (if applicable)
  const isBoundToResidence = !!currentAdminUser.residenciaId;
  const filteredResidencias = isBoundToResidence 
    ? residencias.filter(r => r.id === currentAdminUser.residenciaId)
    : residencias;

  const filteredResidentes = isBoundToResidence
    ? residentes.filter(r => r.residenciaId === currentAdminUser.residenciaId)
    : residentes;

  const filteredCasetas = isBoundToResidence
    ? casetas.filter(c => c.residenciaId === currentAdminUser.residenciaId)
    : casetas;

  // Filter resident created visits
  const residentVisits = authorizedUsers.filter(u => u.isResidentCreated);
  const filteredResidentVisits = isBoundToResidence
    ? residentVisits.filter(v => v.residenciaId === currentAdminUser.residenciaId)
    : residentVisits;

  // Count employees / guards
  const employees = systemRoles.filter(role => role.role !== 'residente');
  const filteredEmployeesCount = isBoundToResidence
    ? employees.filter(e => e.residenciaId === currentAdminUser.residenciaId).length
    : employees.length;

  // Visit states
  const now = new Date();
  const pendingVisits = filteredResidentVisits.filter(v => !v.used && new Date(v.validUntil) > now);
  const completedVisits = filteredResidentVisits.filter(v => v.used);
  const expiredVisits = filteredResidentVisits.filter(v => !v.used && new Date(v.validUntil) <= now);

  // Parse access statistics
  const totalScans = accessLogs.length;
  const successfulScans = accessLogs.filter(l => l.status === LogStatus.SUCCESS).length;
  const failedScans = totalScans - successfulScans;

  // Generate 7 Days flow chart data (Raw SVG helper metrics)
  // Let's count scans per each of the past 7 days
  const getPast7DaysData = () => {
    const dataList = [];
    const daysName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toDateString();
      const count = accessLogs.filter(log => new Date(log.timestamp).toDateString() === dateString).length;
      dataList.push({
        label: daysName[d.getDay()],
        count: count,
        date: d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
      });
    }
    return dataList;
  };

  const chartData = getPast7DaysData();
  const maxChartCount = Math.max(...chartData.map(d => d.count), 5); // Avoid divide by 0/low height

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Metrics Banner Header */}
      <div className="bg-[#18181c] border border-[#2d2d34] p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4 text-center sm:text-left self-start sm:self-center">
          <div className="w-12 h-12 bg-red-650/15 border border-red-500/20 rounded-2.5xl flex items-center justify-center text-red-550 shrink-0">
            <TrendingUp className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight uppercase">Métricas Generales del Condominio</h2>
            <p className="text-xs text-slate-400 mt-1">
              {isBoundToResidence 
                ? `Vista consolidada para: ${currentAdminUser.residenciaNombre || 'Tu Administración'}`
                : 'Consola analítica unificada de acceso, residencias y personal.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleManualSync}
          className="flex items-center gap-1.5 px-4   py-2.5 bg-[#2A2A2E] hover:bg-[#343438] text-slate-300 hover:text-white border border-[#3e3e42] rounded-xl text-xs font-bold transition cursor-pointer self-end sm:self-center"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-500' : 'text-slate-450'}`} />
          <span>Sincronizar Panel</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xs text-slate-400 uppercase font-mono tracking-widest">Calculando Métricas...</p>
        </div>
      ) : (
        <>
          {/* Main 4 Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Stat 1: Residence Core */}
            <div className="bg-[#18181c] border border-[#2d2d34] rounded-2.5xl p-5 shadow-lg relative overflow-hidden group hover:border-[#3d3d44] transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-2xl rounded-full"></div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Residencias</p>
                <div className="p-2 bg-emerald-500/10 text-emerald-450 rounded-xl border border-emerald-500/15">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-white tracking-tight">{filteredResidencias.length}</p>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Registradas</span>
                  <span className="font-semibold text-emerald-400">
                    {filteredResidencias.filter(r => r.isActive).length} Activas
                  </span>
                </div>
              </div>
            </div>

            {/* Stat 2: Residents */}
            <div className="bg-[#18181c] border border-[#2d2d34] rounded-2.5xl p-5 shadow-lg relative overflow-hidden group hover:border-[#3d3d44] transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-2xl rounded-full"></div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Residentes</p>
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/15">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-white tracking-tight">{filteredResidentes.length}</p>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Padrones de Vecinos</span>
                  <span className="font-semibold text-blue-400">Activos</span>
                </div>
              </div>
            </div>

            {/* Stat 3: Employees & Booths */}
            <div className="bg-[#18181c] border border-[#2d2d34] rounded-2.5xl p-5 shadow-lg relative overflow-hidden group hover:border-[#3d3d44] transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/5 blur-2xl rounded-full"></div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Casetas y Cuentas de Personal</p>
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/15">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-white tracking-tight">
                  {filteredEmployeesCount + filteredCasetas.length}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{filteredCasetas.length} Casetas</span>
                  <span className="font-semibold text-amber-400">{filteredEmployeesCount} Empleados</span>
                </div>
              </div>
            </div>

            {/* Stat 4: Resident Visit QR passes */}
            <div className="bg-[#18181c] border border-[#2d2d34] rounded-2.5xl p-5 shadow-lg relative overflow-hidden group hover:border-[#3d3d44] transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 blur-2xl rounded-full"></div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Pases de Visitantes Residenciales</p>
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/15">
                  <QrCode className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-white tracking-tight">{filteredResidentVisits.length}</p>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Generados por vecinos</span>
                  <span className="font-semibold text-purple-400">
                    {completedVisits.length} Concretadas
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Graphical Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left box: 7 days scan flow chart */}
            <div className="lg:col-span-2 bg-[#18181c] border border-[#2d2d34] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CalendarRange className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Flujo de Accesos Diario (Últimos 7 días)</h3>
                </div>
                <p className="text-[11px] text-slate-450">Sincronización de registros validados por caseta por fecha.</p>
              </div>

              {/* Pure SVG Bar Chart */}
              <div className="mt-8 h-48 w-full flex items-end justify-between px-4 pb-2 border-b border-[#2d2d34]">
                {chartData.map((dayItem, index) => {
                  const percentHeight = Math.max((dayItem.count / maxChartCount) * 100, 4); // Min 4% height so bar is visible
                  return (
                    <div key={index} className="flex flex-col items-center flex-1 group relative">
                      {/* Interactive Tooltip bubble */}
                      <div className="absolute -top-12 z-10 scale-0 group-hover:scale-100 transition-transform duration-150 origin-bottom bg-slate-950 text-white border border-[#3e3e42] px-2.5 py-1 rounded-lg text-[10px] font-mono leading-none whitespace-nowrap shadow-xl">
                        <span className="text-red-400 font-extrabold">{dayItem.count}</span> accesos • {dayItem.date}
                      </div>

                      {/* Bar Fill */}
                      <div 
                        style={{ height: `${percentHeight}%` }}
                        className="w-8 xs:w-10 sm:w-12 rounded-t-lg bg-linear-to-t from-red-800 to-red-500 group-hover:from-red-650 group-hover:to-red-400 shadow-lg shadow-red-500/10 cursor-pointer transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                      </div>

                      {/* Bar Count indicator above bar if not hovered */}
                      <span className="text-[10px] text-red-400 font-black font-mono mt-1 mb-0.5 group-hover:opacity-0 transition-opacity">
                        {dayItem.count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart labels bottom line */}
              <div className="flex justify-between px-4 pt-2 font-mono text-[10.5px] text-slate-450 uppercase font-semibold">
                {chartData.map((dayItem, index) => (
                  <span key={index} className="text-center flex-1">{dayItem.label}</span>
                ))}
              </div>
            </div>

            {/* Right box: Visit States status donut distribution */}
            <div className="bg-[#18181c] border border-[#2d2d34] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-450" />
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Estatus de pases de residentes</h3>
                </div>
                <p className="text-[11px] text-slate-450">Distribución porcentual de visitas solicitadas.</p>
              </div>

              {/* Visualized Stacked Progress Bars */}
              <div className="space-y-4 my-6">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      Pendientes (Por Usar)
                    </span>
                    <span className="font-mono text-emerald-400 font-extrabold">
                      {pendingVisits.length} ({filteredResidentVisits.length ? Math.round((pendingVisits.length / filteredResidentVisits.length) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#2A2A2E] rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full" 
                      style={{ width: `${filteredResidentVisits.length ? (pendingVisits.length / filteredResidentVisits.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                      Concretadas (Estatus de Uso)
                    </span>
                    <span className="font-mono text-blue-400 font-extrabold">
                      {completedVisits.length} ({filteredResidentVisits.length ? Math.round((completedVisits.length / filteredResidentVisits.length) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#2A2A2E] rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full" 
                      style={{ width: `${filteredResidentVisits.length ? (completedVisits.length / filteredResidentVisits.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                      Expiradas sin Utilizar
                    </span>
                    <span className="font-mono text-red-400 font-extrabold">
                      {expiredVisits.length} ({filteredResidentVisits.length ? Math.round((expiredVisits.length / filteredResidentVisits.length) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#2A2A2E] rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-red-500 h-full rounded-full" 
                      style={{ width: `${filteredResidentVisits.length ? (expiredVisits.length / filteredResidentVisits.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status footer counts */}
              <div className="pt-3 border-t border-[#2d2d34] flex items-center justify-between text-[11px] text-slate-500 font-semibold font-mono">
                <span>Total Pases:</span>
                <span className="text-white font-black">{filteredResidentVisits.length}</span>
              </div>
            </div>

          </div>

          {/* Bottom section: Recent Access Logs syncing Audit list */}
          <div className="bg-[#18181c] border border-[#2d2d34] rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList className="w-4 h-4 text-emerald-450" />
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Bitácora de Accesos Recientes</h3>
                </div>
                <p className="text-[11px] text-slate-450">Pases validados en los portales de seguridad en tiempo real.</p>
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                ● Transmisiones Sincronizadas
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2d2d34] text-slate-500 font-bold uppercase tracking-wider text-[10px] font-mono">
                    <th className="pb-3 px-3">Visitante / Residente</th>
                    <th className="pb-3 px-3">Cédula / ID Doc</th>
                    <th className="pb-3 px-3">Estatus</th>
                    <th className="pb-3 px-3">Operación</th>
                    <th className="pb-3 px-3 text-right">Portero / Auditor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212128]">
                  {accessLogs.slice(0, 5).map((log) => {
                    const parsedTime = new Date(log.timestamp).toLocaleString('es-ES', {
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                      day: '2-digit', month: '2-digit'
                    });
                    const isSuccess = log.status === LogStatus.SUCCESS;
                    return (
                      <tr key={log.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-white leading-tight">{log.userName}</div>
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">{parsedTime}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400 font-semibold">{log.documentId}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 text-[9.5px] font-bold rounded-md font-sans border tracking-wider uppercase ${
                            isSuccess 
                              ? 'bg-emerald-500/10 text-emerald-450 border-emerald-550/20' 
                              : 'bg-rose-500/10 text-rose-450 border-rose-550/20'
                          }`}>
                            {isSuccess ? 'AUTORIZADO ✓' : 'RECHAZADO ✗'}
                          </span>
                        </td>
                        <td className="py-3 px-3 uppercase font-mono font-bold text-[10px] text-slate-350">
                          {log.type === 'check_in' ? '🟢 ENTRADA' : '🔵 SALIDA'}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400 text-[10.5px]">
                          <div>{log.guardName}</div>
                          <div className="text-[8.5px] text-slate-500 mt-0.5 font-mono">ID: {log.guardId?.substring(0, 8)}</div>
                        </td>
                      </tr>
                    );
                  })}

                  {accessLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-650" />
                        No se registran escaneos en la caseta de control de accesos aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </>
      )}

    </div>
  );
}
