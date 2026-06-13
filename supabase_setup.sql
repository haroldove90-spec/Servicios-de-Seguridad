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
    days JSONB DEFAULT '[]'::jsonb, -- Store list of day indexes [1, 2, 3...]
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

-- 4. Table for Access Logs (Bitácora de Entrada / Salida en Caseta)
CREATE TABLE IF NOT EXISTS public.access_logs (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "guardName" TEXT NOT NULL
);

-- 5. Table for Casetas de Vigilancia (Puntos de control asignados a residencias)
CREATE TABLE IF NOT EXISTS public.casetas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    "residenciaId" TEXT NOT NULL REFERENCES public.residencias(id) ON DELETE CASCADE,
    "residenciaNombre" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Table for System Roles (RBAC Privilegios y Roles)
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
    "residenciaNombre" TEXT
);

-- 7. Table for Marbetes (Vehicular Digital residents passes)
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
-- DISABLE ROW LEVEL SECURITY (RLS) FOR ANONYMOUS DEVELOPMENT ACCESS
-- This ensures the anon key can perform SELECT, INSERT, UPDATE, DELETE 
-- flatly without requiring complex auth trigger hooks.
-- ====================================================================

ALTER TABLE public.residencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.residentes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.casetas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marbetes DISABLE ROW LEVEL SECURITY;

-- Optional dummy roles provision (admin and guard)
INSERT INTO public.system_roles (uid, email, name, role, username, password, "isActive", "createdAt")
VALUES (
    'admin-demo-uid', 
    'softwareai569@gmail.com', 
    'Software AI Admin', 
    'admin', 
    'admin',
    'Admin_123',
    TRUE,
    NOW()
) ON CONFLICT (uid) DO UPDATE 
SET username = EXCLUDED.username, password = EXCLUDED.password, "isActive" = EXCLUDED."isActive";

INSERT INTO public.system_roles (uid, email, name, role, username, password, "isActive", "createdAt")
VALUES (
    'guard-demo-uid', 
    'guardia@seguridad.local', 
    'Guardia Pérez', 
    'supervisor', 
    'guardia',
    'Caseta_123',
    TRUE,
    NOW()
) ON CONFLICT (uid) DO UPDATE 
SET username = EXCLUDED.username, password = EXCLUDED.password, "isActive" = EXCLUDED."isActive";

-- ====================================================================
-- REPAIR / MIGRATION SCRIPT FOR EXISTING DATABASES
-- Runs safely even if columns already exist.
-- ====================================================================
ALTER TABLE public.authorized_users ADD COLUMN IF NOT EXISTS "residenciaId" TEXT REFERENCES public.residencias(id) ON DELETE SET NULL;
ALTER TABLE public.authorized_users ADD COLUMN IF NOT EXISTS "residenciaNombre" TEXT;
ALTER TABLE public.authorized_users ADD COLUMN IF NOT EXISTS "isResidentCreated" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.authorized_users ADD COLUMN IF NOT EXISTS "residentName" TEXT;
ALTER TABLE public.authorized_users ADD COLUMN IF NOT EXISTS "residentPhone" TEXT;
ALTER TABLE public.residentes ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS "residenciaId" TEXT REFERENCES public.residencias(id) ON DELETE SET NULL;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS "residenciaNombre" TEXT;

-- Panic Alert System Synchronization Support
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS "panicActive" BOOLEAN NOT NULL DEFAULT FALSE;

