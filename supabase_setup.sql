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
    "residenciaNombre" TEXT
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

-- 5. Table for System Roles (RBAC Privilegios y Roles)
CREATE TABLE IF NOT EXISTS public.system_roles (
    uid TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
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

-- Optional dummy admin provision (using softwareai569@gmail.com)
INSERT INTO public.system_roles (uid, email, name, role, "createdAt")
VALUES (
    'admin-demo-uid', 
    'softwareai569@gmail.com', 
    'Software AI Admin', 
    'admin', 
    NOW()
) ON CONFLICT (uid) DO NOTHING;

-- ====================================================================
-- REPAIR / MIGRATION SCRIPT FOR EXISTING DATABASES
-- Runs safely even if columns already exist.
-- ====================================================================
ALTER TABLE public.authorized_users ADD COLUMN IF NOT EXISTS "residenciaId" TEXT REFERENCES public.residencias(id) ON DELETE SET NULL;
ALTER TABLE public.authorized_users ADD COLUMN IF NOT EXISTS "residenciaNombre" TEXT;
ALTER TABLE public.residentes ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP WITH TIME ZONE;

