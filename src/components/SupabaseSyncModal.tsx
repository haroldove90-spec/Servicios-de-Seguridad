import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Terminal,
  X,
  Activity,
  CloudUpload,
  Layers,
  AlertCircle
} from 'lucide-react';
import { dbService } from '../services/dbService';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted?: () => void;
  defaultTab?: 'sync' | 'sql';
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncCompleted,
  defaultTab = 'sync'
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'sql'>(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Status state
  const [healthStatus, setHealthStatus] = useState<{
    isConnected: boolean;
    latencyMs: number;
    totalInSupabase: number;
    totalLocal: number;
    error?: string;
    lastChecked?: string;
  }>({
    isConnected: false,
    latencyMs: 0,
    totalInSupabase: 0,
    totalLocal: 0
  });

  const [syncResult, setSyncResult] = useState<{
    status: 'idle' | 'success' | 'warning' | 'error';
    message: string;
    details?: string;
    syncedCount?: number;
  }>({
    status: 'idle',
    message: ''
  });

  useEffect(() => {
    if (isOpen) {
      runHealthCheck();
    }
  }, [isOpen]);

  const runHealthCheck = async () => {
    setIsTesting(true);
    try {
      const res = await dbService.testSupabaseConnection();
      const localLogs = (dbService as any).getLocalLogsCount ? (dbService as any).getLocalLogsCount() : 0;
      
      setHealthStatus({
        isConnected: res.isConnected,
        latencyMs: res.latencyMs,
        totalInSupabase: res.totalAccessLogsInSupabase,
        totalLocal: localLogs,
        error: res.error,
        lastChecked: new Date().toLocaleTimeString()
      });
    } catch (e: any) {
      setHealthStatus(prev => ({
        ...prev,
        isConnected: false,
        error: e?.message || 'Error al conectar con Supabase',
        lastChecked: new Date().toLocaleTimeString()
      }));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    setSyncResult({ status: 'idle', message: '' });

    try {
      const result = await dbService.syncAccessLogsToSupabase();
      
      if (result.success) {
        setSyncResult({
          status: 'success',
          message: `¡Sincronización Exitosa con Supabase!`,
          details: `Se han sincronizado ${result.syncedCount} nuevos registros hacia Supabase Cloud. Total actual en base de datos: ${result.totalInSupabase} registros. Latencia: ${result.latencyMs}ms.`,
          syncedCount: result.syncedCount
        });
      } else if (result.syncedCount > 0) {
        setSyncResult({
          status: 'warning',
          message: `Sincronización Parcial (${result.syncedCount} subidos, ${result.errorCount} advertencias)`,
          details: result.errorMsg || result.details,
          syncedCount: result.syncedCount
        });
      } else {
        setSyncResult({
          status: 'error',
          message: `Fallo al sincronizar con Supabase Cloud`,
          details: result.errorMsg || 'No se pudo conectar a la tabla de accesos. Asegúrate de haber ejecutado el script SQL en Supabase.'
        });
      }

      await runHealthCheck();
      if (onSyncCompleted) {
        onSyncCompleted();
      }
    } catch (err: any) {
      setSyncResult({
        status: 'error',
        message: 'Error de red o conexión al contactar Supabase',
        details: err?.message || String(err)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sqlSchema = `-- ==============================================================================
-- SCRIPT SQL OFICIAL PARA SUPABASE: BITÁCORAS DE ACCESO Y CONTROL RESIDENCIAL
-- Ejecuta este script en el 'SQL Editor' de tu consola de Supabase
-- ==============================================================================

-- 1. TABLA PRINCIPAL DE BITÁCORA DE ACCESOS (access_logs)
CREATE TABLE IF NOT EXISTS public.access_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    document_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    type TEXT,
    status TEXT,
    guard_id TEXT,
    guard_name TEXT,
    residencia_id TEXT,
    residencia_nombre TEXT,
    caseta_id TEXT,
    caseta_nombre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS document_id TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS guard_id TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS guard_name TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS residencia_id TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS residencia_nombre TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS caseta_id TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS caseta_nombre TEXT;

-- 2. HABILITAR SEGURIDAD POR FILAS (RLS) Y PERMITIR ACCESO TOTAL (EVITA RECURSIÓN 42P17)
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso total a access_logs" ON public.access_logs;
CREATE POLICY "Acceso total a access_logs"
ON public.access_logs
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 3. ÍNDICES DE ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_access_logs_residencia ON public.access_logs (residencia_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON public.access_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON public.access_logs (user_id);

-- 4. TABLA DE VISITANTES Y PASES AUTORIZADOS (authorized_users)
CREATE TABLE IF NOT EXISTS public.authorized_users (
    id TEXT PRIMARY KEY,
    name TEXT,
    document_id TEXT,
    email TEXT,
    phone TEXT,
    status TEXT,
    qrcode_token TEXT,
    one_time BOOLEAN DEFAULT false,
    used BOOLEAN DEFAULT false,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    days JSONB,
    start_time TEXT,
    end_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    residencia_id TEXT,
    residencia_nombre TEXT,
    is_resident_created BOOLEAN DEFAULT false,
    resident_name TEXT,
    resident_phone TEXT
);

ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total authorized_users" ON public.authorized_users;
CREATE POLICY "Acceso total authorized_users" ON public.authorized_users FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. TABLA DE MARBETES VEHICULARES (marbetes)
CREATE TABLE IF NOT EXISTS public.marbetes (
    id TEXT PRIMARY KEY,
    consecutivo INT,
    residente_id TEXT,
    residente_nombre TEXT,
    residencia_id TEXT,
    residencia_nombre TEXT,
    vehiculo_placas TEXT,
    vehiculo_info TEXT,
    qrcode_token TEXT,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marbetes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total marbetes" ON public.marbetes FOR ALL TO public USING (true) WITH CHECK (true);
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div
      id="supabase-sync-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="supabase-sync-modal-dialog"
        className="bg-[#1E1E24] border border-[#3e3e46] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#3e3e46] flex items-center justify-between bg-[#18181C]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-sans">
                  Sincronización con Supabase Cloud
                </h3>
                {healthStatus.isConnected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En Línea ({healthStatus.latencyMs}ms)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Sin Conexión
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Garantiza que todas las visitas y accesos se guarden de forma permanente en la base de datos Supabase.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-[#3e3e46] bg-[#141418] px-5 gap-2">
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'sync'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Estado y Sincronización Inteligente
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'sql'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Código SQL de Tablas (Supabase)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'sync' ? (
            <>
              {/* Status Diagnostic Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#141418] border border-[#2d2d35] rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Estado Supabase</span>
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-base font-bold text-white mt-1">
                    {healthStatus.isConnected ? 'Conectado ✓' : 'Desconectado ✗'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    {healthStatus.lastChecked ? `Última verificación: ${healthStatus.lastChecked}` : 'Comprobando...'}
                  </p>
                </div>

                <div className="bg-[#141418] border border-[#2d2d35] rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Registros en Supabase</span>
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <p className="text-xl font-bold text-white mt-1 font-mono">
                    {healthStatus.totalInSupabase}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Tabla: access_logs</p>
                </div>

                <div className="bg-[#141418] border border-[#2d2d35] rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Latencia de Red</span>
                    <CloudUpload className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <p className="text-xl font-bold text-white mt-1 font-mono">
                    {healthStatus.latencyMs} ms
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Tiempo de respuesta</p>
                </div>
              </div>

              {/* Warnings / Error Banner */}
              {healthStatus.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-red-300">
                      Advertencia de Conexión o Permisos en Supabase
                    </h4>
                    <p className="text-xs text-red-200/80 leading-relaxed font-mono">
                      {healthStatus.error}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      💡 Consejo: Si la tabla <code className="text-emerald-300">access_logs</code> no existe o no tiene permisos, ve a la pestaña <strong>"Código SQL"</strong>, copia el script y ejecútalo en tu consola de Supabase.
                    </p>
                  </div>
                </div>
              )}

              {/* Sync Result Banner */}
              {syncResult.status !== 'idle' && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    syncResult.status === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                      : syncResult.status === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                      : 'bg-red-500/10 border-red-500/20 text-red-200'
                  }`}
                >
                  {syncResult.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                  {syncResult.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                  {syncResult.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                  <div className="space-y-1 text-xs">
                    <p className="font-bold">{syncResult.message}</p>
                    {syncResult.details && <p className="opacity-90 leading-relaxed">{syncResult.details}</p>}
                  </div>
                </div>
              )}

              {/* Explanation & Action Box */}
              <div className="bg-[#18181E] border border-[#2e2e38] rounded-xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      ¿Por qué es importante sincronizar con Supabase?
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Al presionar este botón, el sistema verifica todos los registros de visitas y accesos leídos en caseta o creados por residentes, enviándolos directamente a Supabase Cloud para que queden grabados permanentemente en la base de datos remota sin depender del navegador.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    id="btn-trigger-supabase-sync"
                    onClick={handleSync}
                    disabled={isLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-3 px-5 rounded-xl transition shadow-lg shadow-emerald-950/40 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Sincronizando con Supabase Cloud...' : '⚡ Actualizar y Sincronizar Registros en Supabase'}
                  </button>

                  <button
                    onClick={runHealthCheck}
                    disabled={isTesting || isLoading}
                    className="inline-flex items-center justify-center gap-2 bg-[#26262E] hover:bg-[#32323C] text-slate-300 font-semibold text-xs py-3 px-4 rounded-xl border border-[#3e3e4a] transition cursor-pointer"
                  >
                    <Activity className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                    Verificar Conexión
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Script SQL para Crear y Configurar Tablas en Supabase
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Si alguna visita no se registra debido a que falta la tabla <code className="text-emerald-300">access_logs</code> o las políticas RLS están bloqueadas en Supabase, copia este script y pégalo en tu <strong>SQL Editor</strong> de Supabase.
                  </p>
                </div>

                <button
                  id="btn-copy-supabase-sql"
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shrink-0 cursor-pointer shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-white" /> ¡Copiado al Portapapeles!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copiar SQL
                    </>
                  )}
                </button>
              </div>

              {/* Instructions steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 bg-[#141418] p-3.5 rounded-xl border border-[#2d2d35]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Abre tu consola de Supabase</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Entra en <strong>SQL Editor</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Pega el código y dale <strong>Run (▶)</strong></span>
                </div>
              </div>

              {/* Code block */}
              <div className="relative bg-[#0D0D11] border border-[#2d2d36] rounded-xl overflow-hidden">
                <pre className="p-4 text-[11.5px] font-mono text-emerald-300 overflow-x-auto max-h-[320px] leading-relaxed selection:bg-emerald-900">
                  {sqlSchema}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#3e3e46] bg-[#141418] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Supabase PostgreSQL Engine activo
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2A2A32] hover:bg-[#383842] text-white font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
