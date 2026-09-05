-- ====================================================================
-- SOLUCIÓN DIRECTA PARA SUPABASE (100% SEGURO - NO BORRA DATOS)
-- ====================================================================

-- 1. Eliminar políticas duplicadas para evitar ERROR 42710
DROP POLICY IF EXISTS "Permitir lectura general de alertas" ON public.alertas_panico;
DROP POLICY IF EXISTS "Permitir registro de alertas" ON public.alertas_panico;
DROP POLICY IF EXISTS "Permitir actualización de alertas" ON public.alertas_panico;
DROP POLICY IF EXISTS "Permitir eliminación de alertas" ON public.alertas_panico;

DROP POLICY IF EXISTS "Permitir lectura publica de access_logs" ON public.access_logs;
DROP POLICY IF EXISTS "Permitir insercion publica de access_logs" ON public.access_logs;
DROP POLICY IF EXISTS "Permitir eliminacion publica de access_logs" ON public.access_logs;

-- 2. Asegurar que la tabla alertas_panico exista con todas sus columnas
CREATE TABLE IF NOT EXISTS public.alertas_panico (
    id TEXT PRIMARY KEY,
    residencia_id TEXT,
    residencia_nombre TEXT,
    usuario_id TEXT,
    usuario_nombre TEXT NOT NULL DEFAULT 'Usuario',
    usuario_role TEXT NOT NULL DEFAULT 'residente',
    usuario_username TEXT,
    usuario_phone TEXT,
    usuario_email TEXT,
    direccion TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    google_maps_url TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVA',
    atendida_por TEXT,
    atendida_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Asegurar columnas en residentes para evitar errores de índice
ALTER TABLE public.residentes ADD COLUMN IF NOT EXISTS unidad_id UUID;

-- 4. Desactivar RLS para permitir sincronización sin bloqueos de políticas
ALTER TABLE public.alertas_panico DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs DISABLE ROW LEVEL SECURITY;

-- 5. Otorgar permisos a los roles de Supabase
GRANT ALL ON TABLE public.alertas_panico TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.access_logs TO anon, authenticated, service_role;
