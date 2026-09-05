import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  ShieldAlert,
  Clock,
  Home,
  Check,
  Filter,
  Trash2
} from 'lucide-react';
import { AlertaPanico, SystemRole, SystemUserRole } from '../types';
import { dbService } from '../services/dbService';

interface AlertasPanicoManagerProps {
  currentUser: SystemRole;
  isCasetaView?: boolean;
}

export const AlertasPanicoManager: React.FC<AlertasPanicoManagerProps> = ({ currentUser, isCasetaView = false }) => {
  const [alertas, setAlertas] = useState<AlertaPanico[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<'TODAS' | 'ACTIVA' | 'ATENDIDA' | 'CANCELADA'>('TODAS');
  const [residencias, setResidencias] = useState<any[]>([]);
  const [selectedFraccionamiento, setSelectedFraccionamiento] = useState<string>(currentUser?.residenciaId || 'all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.residenciaId) {
      setSelectedFraccionamiento(currentUser.residenciaId);
    }
  }, [currentUser?.residenciaId]);

  const fetchAlertas = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [data, resList] = await Promise.all([
        dbService.getAlertasPanico(),
        dbService.getResidencias().catch(() => [])
      ]);
      // Sort newest first
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAlertas(data);
      setResidencias(resList || []);
    } catch (err) {
      console.error('Error al cargar registro de alertas de pánico:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
    // Poll every 4 seconds for real-time panic alerts sync
    const interval = setInterval(() => {
      fetchAlertas(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleResolverAlerta = async (alerta: AlertaPanico, nuevoEstado: 'ATENDIDA' | 'CANCELADA') => {
    setProcessingId(alerta.id);
    try {
      await dbService.updateAlertaPanico(alerta.id, {
        estado: nuevoEstado,
        atendidaPor: `${currentUser.name} (${currentUser.role})`,
        atendidaAt: new Date().toISOString()
      });

      // Clear residence level active panic if matching
      if (alerta.residenciaId) {
        try {
          await dbService.updateResidencia(alerta.residenciaId, {
            panicActive: false,
            panicLatitude: null,
            panicLongitude: null,
            panicTriggeredBy: null,
            panicTriggeredByRole: null,
            panicTriggeredAt: null
          });
        } catch (e) {
          console.warn('Warning clearing residence panic active flag:', e);
        }
      }

      await fetchAlertas(true);
    } catch (err) {
      console.error('Error al resolver alerta de pánico:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteAlerta = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este registro de alerta de pánico?')) return;
    setProcessingId(id);
    try {
      await dbService.deleteAlertaPanico(id);
      await fetchAlertas(true);
    } catch (err) {
      console.error('Error al eliminar alerta de pánico:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const isAdminOrSuper = !currentUser || 
    currentUser.role === 'admin' || 
    currentUser.role === SystemUserRole.ADMIN || 
    currentUser.role === 'superadmin';

  // The active target fraccionamiento is selectedFraccionamiento (for admins) or currentUser.residenciaId (for locked users)
  const targetFraccionamientoId = (!isAdminOrSuper && currentUser?.residenciaId) 
    ? currentUser.residenciaId 
    : selectedFraccionamiento;

  const filteredAlertas = alertas.filter(a => {
    // 1. Multitenant isolation filter
    if (targetFraccionamientoId !== 'all') {
      const targetRes = residencias.find(r => r.id === targetFraccionamientoId);
      const targetName = (targetRes?.nombre || (currentUser?.residenciaId === targetFraccionamientoId ? currentUser?.residenciaNombre : '') || '').toLowerCase().trim();

      const matchId = a.residenciaId && a.residenciaId === targetFraccionamientoId;
      const matchName = targetName && a.residenciaNombre && (
        a.residenciaNombre.toLowerCase().trim() === targetName ||
        (a.direccion && a.direccion.toLowerCase().includes(targetName))
      );

      // Must match either ID or Name of the target fraccionamiento
      if (!matchId && !matchName) {
        return false;
      }

      // Strict Anti-Leak: If viewing a development that is not Lomas, never allow alerts that belong to Lomas
      if (targetName && !targetName.includes('lomas')) {
        const aRes = (a.residenciaNombre || '').toLowerCase();
        const aDir = (a.direccion || '').toLowerCase();
        if (aRes.includes('lomas') || aDir.includes('lomas')) {
          return false;
        }
      }
    } else if (!isAdminOrSuper && currentUser?.residenciaId) {
      // Non-admin without global permission should never see foreign alerts
      const userResName = (currentUser.residenciaNombre || '').toLowerCase().trim();
      const matchId = a.residenciaId === currentUser.residenciaId;
      const matchName = userResName && a.residenciaNombre && a.residenciaNombre.toLowerCase().trim() === userResName;
      if (!matchId && !matchName) return false;
    }

    // 2. Status filter
    if (filterEstado !== 'TODAS' && a.estado !== filterEstado) return false;

    // 3. Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = (a.usuarioNombre || '').toLowerCase().includes(term);
      const matchUser = (a.usuarioUsername || '').toLowerCase().includes(term);
      const matchRes = (a.residenciaNombre || '').toLowerCase().includes(term);
      const matchPhone = (a.usuarioPhone || '').toLowerCase().includes(term);
      const matchDir = (a.direccion || '').toLowerCase().includes(term);
      return matchName || matchUser || matchRes || matchPhone || matchDir;
    }
    return true;
  });

  const activeCount = filteredAlertas.filter(a => a.estado === 'ACTIVA').length;
  const atendidaCount = filteredAlertas.filter(a => a.estado === 'ATENDIDA').length;
  const canceladaCount = filteredAlertas.filter(a => a.estado === 'CANCELADA').length;

  return (
    <div id="alertas-panico-module-root" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-950 border border-red-800/40 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-red-600/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-red-600/20 border border-red-500/40 rounded-xl text-red-400">
              <ShieldAlert className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wide">Registro de Alertas de Pánico y Emergencias</h2>
                {activeCount > 0 && (
                  <span className="px-2.5 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-full animate-bounce">
                    {activeCount} ACTIVA{activeCount > 1 ? 'S' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Historial y monitoreo en tiempo real de botones de auxilio emitidos por residentes y personal.
              </p>
            </div>
          </div>

          <button
            id="btn-refresh-alertas-panico"
            onClick={() => fetchAlertas(true)}
            disabled={refreshing}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-red-400' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-black uppercase text-slate-400">Total Alertas</span>
            <p className="text-xl font-black text-white mt-0.5">{alertas.length}</p>
          </div>
          <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-3">
            <span className="text-[10px] font-black uppercase text-red-300">🚨 Activas</span>
            <p className="text-xl font-black text-red-400 mt-0.5">{activeCount}</p>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3">
            <span className="text-[10px] font-black uppercase text-emerald-300">🟢 Atendidas</span>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{atendidaCount}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-black uppercase text-slate-400">❌ Canceladas</span>
            <p className="text-xl font-black text-slate-300 mt-0.5">{canceladaCount}</p>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-input-alertas-panico"
            type="text"
            placeholder="Buscar por usuario, residente, residencia, teléfono o domicilio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1A1A1E] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Subdivision Filter for Administrators */}
        {(isAdminOrSuper || residencias.length > 1) && residencias.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">Fraccionamiento:</span>
            <select
              id="select-alertas-fraccionamiento"
              value={selectedFraccionamiento}
              onChange={(e) => setSelectedFraccionamiento(e.target.value)}
              className="bg-[#1A1A1E] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="all">🏢 Todos los Desarrollos</option>
              {residencias.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#1A1A1E] border border-slate-800 p-1 rounded-xl">
          {(['TODAS', 'ACTIVA', 'ATENDIDA', 'CANCELADA'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterEstado(tab)}
              className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg transition cursor-pointer ${
                filterEstado === tab
                  ? tab === 'ACTIVA' 
                    ? 'bg-red-600 text-white shadow-md'
                    : tab === 'ATENDIDA'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'TODAS' ? 'Todas' : tab === 'ACTIVA' ? '🚨 Activas' : tab === 'ATENDIDA' ? '🟢 Atendidas' : '❌ Canceladas'}
            </button>
          ))}
        </div>
      </div>

      {/* Alertas Grid / List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 bg-[#0f172a] border border-[#1e293b] rounded-2xl">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-red-500 mb-2" />
          <p className="text-xs font-semibold">Cargando registros de alertas de pánico...</p>
        </div>
      ) : filteredAlertas.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-[#0f172a] border border-[#1e293b] rounded-2xl">
          <ShieldAlert className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-bold text-slate-300">No se encontraron alertas de pánico registrados.</p>
          <p className="text-xs text-slate-500 mt-1">
            {searchTerm || filterEstado !== 'TODAS' 
              ? 'Pruebe cambiando los filtros de búsqueda.' 
              : 'Cuando un residente o usuario active el botón de pánico, los datos aparecerán aquí automáticamente.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAlertas.map((alerta) => {
            const isActiva = alerta.estado === 'ACTIVA';
            const isAtendida = alerta.estado === 'ATENDIDA';

            const formattedDate = alerta.createdAt 
              ? new Date(alerta.createdAt).toLocaleString('es-MX', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                  hour12: true
                })
              : 'Fecha no disponible';

            const mapUrl = alerta.googleMapsUrl || (
              alerta.latitude && alerta.longitude 
                ? `https://www.google.com/maps?q=${alerta.latitude},${alerta.longitude}`
                : null
            );

            return (
              <div
                key={alerta.id}
                className={`bg-[#0f172a] border rounded-2xl p-5 transition-all relative overflow-hidden ${
                  isActiva 
                    ? 'border-red-500 shadow-xl shadow-red-950/30 bg-gradient-to-r from-red-950/40 via-[#0f172a] to-[#0f172a]' 
                    : isAtendida
                    ? 'border-emerald-800/40'
                    : 'border-slate-800 opacity-80'
                }`}
              >
                {/* Status indicator bar */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                  isActiva ? 'bg-red-500 animate-pulse' : isAtendida ? 'bg-emerald-500' : 'bg-slate-600'
                }`} />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pl-2">
                  {/* Left block: User & Residence details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1 ${
                        isActiva
                          ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-500/50'
                          : isAtendida
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {isActiva ? <AlertTriangle className="w-3 h-3" /> : isAtendida ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {isActiva ? '🚨 ALERTA ACTIVA' : isAtendida ? '🟢 ATENDIDA' : '❌ CANCELADA'}
                      </span>

                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {formattedDate}
                      </span>

                      {alerta.residenciaNombre && (
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <Home className="w-3 h-3 text-red-400" />
                          {alerta.residenciaNombre}
                        </span>
                      )}
                    </div>

                    {/* Resident / User Profile Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-[#1A1A1E]/80 border border-slate-800/80 rounded-xl p-3.5">
                      {/* Person Details */}
                      <div className="space-y-1">
                        <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Usuario / Residente</span>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-black text-white">{alerta.usuarioNombre}</p>
                            <p className="text-[10px] text-slate-400">
                              Rol: <span className="text-slate-200 font-semibold capitalize">{alerta.usuarioRole}</span> 
                              {alerta.usuarioUsername && ` (@${alerta.usuarioUsername})`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Residence & Address */}
                      <div className="space-y-1">
                        <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Domicilio / Ubicación Casa</span>
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-200">{alerta.direccion || 'Domicilio no especificado'}</p>
                            <p className="text-[10px] text-slate-400">{alerta.residenciaNombre || 'Residencia CNLS'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1">
                        <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Datos de Contacto Directo</span>
                        <div className="flex flex-col gap-1">
                          {alerta.usuarioPhone ? (
                            <a 
                              href={`tel:${alerta.usuarioPhone}`} 
                              className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1.5"
                            >
                              <Phone className="w-3 h-3" />
                              {alerta.usuarioPhone}
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-500">Teléfono no registrado</span>
                          )}

                          {alerta.usuarioEmail && (
                            <span className="text-[10.5px] text-slate-400 flex items-center gap-1.5 truncate">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {alerta.usuarioEmail}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Location Coordinates & Map link */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                      <div className="flex items-center gap-2 text-xs">
                        <MapPin className="w-4 h-4 text-red-400 flex-shrink-0 animate-bounce" />
                        <div>
                          <span className="text-slate-300 font-bold block">Ubicación GPS del Dispositivo Móvil:</span>
                          {alerta.latitude && alerta.longitude ? (
                            <span className="text-slate-400 font-mono text-[11px]">
                              Lat: <strong className="text-white">{alerta.latitude.toFixed(6)}</strong> | Lng: <strong className="text-white">{alerta.longitude.toFixed(6)}</strong>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Ubicación GPS no emitida por el dispositivo</span>
                          )}
                        </div>
                      </div>

                      {mapUrl && (
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 rounded-xl text-xs font-extrabold transition cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Ver en Google Maps
                        </a>
                      )}
                    </div>

                    {/* Resolution Metadata */}
                    {isAtendida && alerta.atendidaPor && (
                      <div className="text-[10.5px] text-emerald-400/90 bg-emerald-950/20 border border-emerald-800/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Atendida por: <strong>{alerta.atendidaPor}</strong>
                        {alerta.atendidaAt && ` el ${new Date(alerta.atendidaAt).toLocaleString('es-MX')}`}
                      </div>
                    )}
                  </div>

                  {/* Right block: Action buttons */}
                  <div className="flex flex-row lg:flex-col items-center gap-2 border-t lg:border-t-0 lg:border-l border-slate-800 pt-3 lg:pt-0 lg:pl-4">
                    {isActiva && (
                      <>
                        <button
                          id={`btn-resolver-alerta-${alerta.id}`}
                          onClick={() => handleResolverAlerta(alerta, 'ATENDIDA')}
                          disabled={processingId === alerta.id}
                          className="flex-1 lg:flex-none w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Marcar Atendida
                        </button>

                        <button
                          id={`btn-cancelar-alerta-${alerta.id}`}
                          onClick={() => handleResolverAlerta(alerta, 'CANCELADA')}
                          disabled={processingId === alerta.id}
                          className="flex-1 lg:flex-none w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancelar
                        </button>
                      </>
                    )}

                    {currentUser.role === SystemUserRole.ADMIN && (
                      <button
                        id={`btn-delete-alerta-${alerta.id}`}
                        onClick={() => handleDeleteAlerta(alerta.id)}
                        disabled={processingId === alerta.id}
                        className="px-3 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Eliminar Registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="lg:hidden text-[10px]">Eliminar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlertasPanicoManager;
