-- ====================================================================
-- SUPABASE / POSTGRES TABLE SCHEMA DEFINITIONS FOR CONTROL DE ACCESO QR
-- Execute this script in your Supabase SQL Editor (https://supabase.com)
-- ====================================================================

-- 1. Table for Residencias / Condominios
CREATE TABLE IF NOT EXISTS public.residencias (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    administrador TEXT NOT NULL,
    "numResidencias" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Table for Residentes (Censo de Residentes)
CREATE TABLE IF NOT EXISTS public.residentes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    "residenciaId" TEXT NOT NULL REFERENCES public.residencias(id) ON DELETE CASCADE,
    "residenciaNombre" TEXT NOT NULL,
    direccion TEXT NOT NULL,
    "qrcodeToken" TEXT NOT NULL,
    whatsapp TEXT,
    "accessUserId" TEXT,
    "validUntil" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Table for Authorized Users (Pases de visitantes y perfiles de acceso permanente)
CREATE TABLE IF NOT EXISTS public.authorized_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL,
    "qrcodeToken" TEXT NOT NULL,
    "oneTime" BOOLEAN NOT NULL DEFAULT FALSE,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    "validFrom" TIMESTAMP WITH TIME ZONE NOT NULL,
    "validUntil" TIMESTAMP WITH TIME ZONE NOT NULL,
    days JSONB DEFAULT '[]'::jsonb,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "createdBy" TEXT NOT NULL,
    "residenciaId" TEXT REFERENCES public.residencias(id) ON DELETE SET NULL,
    "residenciaNombre" TEXT,
    "isResidentCreated" BOOLEAN DEFAULT FALSE,
    "residentName" TEXT,
    "residentPhone" TEXT
);

-- 4. Table for Casetas de Vigilancia
CREATE TABLE IF NOT EXISTS public.casetas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    "residenciaId" TEXT NOT NULL REFERENCES public.residencias(id) ON DELETE CASCADE,
    "residenciaNombre" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Table for Access Logs (Bitácora de Entrada / Salida en Caseta)
CREATE TABLE IF NOT EXISTS public.access_logs (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "guardName" TEXT NOT NULL,
    "residenciaId" TEXT,
    "residenciaNombre" TEXT,
    "casetaId" TEXT,
    "casetaNombre" TEXT
);

-- 6. Table for Evidencias (Registro fotográfico de matrículas/placas e identificaciones)
CREATE TABLE IF NOT EXISTS public.evidencias (
    id TEXT PRIMARY KEY,
    "residenciaId" TEXT,
    "residenciaNombre" TEXT,
    "casetaId" TEXT,
    "casetaNombre" TEXT,
    "guardId" TEXT NOT NULL,
    "guardName" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    placas TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    notas TEXT,
    tipo TEXT DEFAULT 'placa'
);

-- 7. Table for System Roles (RBAC Privilegios y Roles)
CREATE TABLE IF NOT EXISTS public.system_roles (
    uid TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    username TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    phone TEXT,
    password TEXT,
    "isActive" BOOLEAN DEFAULT TRUE,
    "residenciaId" TEXT REFERENCES public.residencias(id) ON DELETE SET NULL,
    "residenciaNombre" TEXT,
    avatar TEXT
);

-- 8. Table for Marbetes (Vehicular Digital residents passes)
CREATE TABLE IF NOT EXISTS public.marbetes (
    id TEXT PRIMARY KEY,
    consecutivo INTEGER NOT NULL DEFAULT 1000,
    "residenteId" TEXT REFERENCES public.residentes(id) ON DELETE CASCADE,
    "residenteNombre" TEXT NOT NULL,
    "residenciaId" TEXT REFERENCES public.residencias(id) ON DELETE SET NULL,
    "residenciaNombre" TEXT NOT NULL,
    "vehiculoPlacas" TEXT,
    "vehiculoInfo" TEXT,
    "qrcodeToken" TEXT NOT NULL,
    "validFrom" TIMESTAMP WITH TIME ZONE NOT NULL,
    "validUntil" TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- DISABLE ROW LEVEL SECURITY (RLS) FOR ANONYMOUS ACCESS
-- Avoids RLS policy conflicts (Error 42710)
-- ====================================================================

ALTER TABLE public.residencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.residentes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.casetas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marbetes DISABLE ROW LEVEL SECURITY;

-- Drop existing policies safely if present
DROP POLICY IF EXISTS "Permitir todo en evidencias" ON public.evidencias;
DROP POLICY IF EXISTS "Permitir lectura publica de evidencias" ON public.evidencias;
DROP POLICY IF EXISTS "Permitir insercion publica de evidencias" ON public.evidencias;
DROP POLICY IF EXISTS "Permitir todo en access_logs" ON public.access_logs;
DROP POLICY IF EXISTS "Permitir lectura publica de access_logs" ON public.access_logs;
DROP POLICY IF EXISTS "Permitir insercion publica de access_logs" ON public.access_logs;

-- ====================================================================
-- COLUMNS REPAIR (Ensure both camelCase and snake_case exist)
-- ====================================================================

-- access_logs repair
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS document_id TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS guard_id TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS guard_name TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS residencia_id TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS residencia_nombre TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS caseta_id TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS caseta_nombre TEXT;

-- evidencias repair
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS residencia_id TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS residencia_nombre TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS caseta_id TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS caseta_nombre TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS guard_id TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS guard_name TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'placa';

-- ====================================================================
-- SEED DEFAULT DEMO DATA
-- ====================================================================
INSERT INTO public.system_roles (uid, email, name, role, username, password, "isActive", "createdAt")
VALUES ('admin-demo-uid', 'softwareai569@gmail.com', 'Software AI Admin', 'admin', 'admin', 'Admin_123', TRUE, NOW())
ON CONFLICT (uid) DO NOTHING;

INSERT INTO public.system_roles (uid, email, name, role, username, password, "isActive", "createdAt")
VALUES ('admin-harold-uid', 'harold.anguiano@admin.local', 'Harold Anguiano', 'admin', 'harold.anguiano', 'Chevropar#1970', TRUE, NOW())
ON CONFLICT (uid) DO NOTHING;

INSERT INTO public.system_roles (uid, email, name, role, username, password, "isActive", "createdAt")
VALUES ('guard-demo-uid', 'guardia@seguridad.local', 'Guardia Pérez', 'supervisor', 'guardia', 'Caseta_123', TRUE, NOW())
ON CONFLICT (uid) DO NOTHING;



