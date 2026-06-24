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
    "guardName" TEXT NOT NULL,
    "residenciaId" TEXT,
    "residenciaNombre" TEXT,
    "casetaId" TEXT,
    "casetaNombre" TEXT
);

-- 4b. Table for Evidencias (Registro fotográfico de matrículas/placas)
CREATE TABLE IF NOT EXISTS public.evidencias (
    id TEXT PRIMARY KEY,
    "residenciaId" TEXT NOT NULL REFERENCES public.residencias(id) ON DELETE CASCADE,
    "residenciaNombre" TEXT NOT NULL,
    "casetaId" TEXT REFERENCES public.casetas(id) ON DELETE SET NULL,
    "casetaNombre" TEXT,
    "guardId" TEXT NOT NULL,
    "guardName" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    placas TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    notas TEXT
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
    "residenciaNombre" TEXT,
    avatar TEXT
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
-- SEED DEFAULT DEMO DATA FOR FOREIGN KEY INTEGRITY
-- ====================================================================
INSERT INTO public.residencias (id, nombre, administrador, "numResidencias", "isActive", "createdAt", "updatedAt")
VALUES (
    'res-demo-1',
    'Lomas de Chapultepec',
    'Software AI Admin',
    120,
    TRUE,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.residentes (id, nombre, "residenciaId", "residenciaNombre", direccion, "qrcodeToken", whatsapp, "accessUserId", "createdAt", "updatedAt")
VALUES (
    'resd-demo-1',
    'Mariana Sosa',
    'res-demo-1',
    'Lomas de Chapultepec',
    'Calle Roble #14',
    'residente_mariana_token',
    '+525512345678',
    'usr-resd-demo-1',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

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
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Repair columns for access_logs table
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS "residenciaId" TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS "residenciaNombre" TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS "casetaId" TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS "casetaNombre" TEXT;

-- Disable RLS for evidencias
ALTER TABLE public.evidencias DISABLE ROW LEVEL SECURITY;

-- Panic Alert System Synchronization Support
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS "panicActive" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS "panicLatitude" DOUBLE PRECISION;
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS "panicLongitude" DOUBLE PRECISION;
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS "panicTriggeredBy" TEXT;
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS "panicTriggeredByRole" TEXT;
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS "panicTriggeredAt" TEXT;

-- Lowercase and Snake_case duplicates for complete robust alignment with self-healing updates
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS paniclatitude DOUBLE PRECISION;
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS paniclongitude DOUBLE PRECISION;
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS panictriggeredby TEXT;
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS panictriggeredbyrole TEXT;
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS panictriggeredat TEXT;

ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS panic_latitude DOUBLE PRECISION;
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS panic_longitude DOUBLE PRECISION;
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS panic_triggered_by TEXT;
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS panic_triggered_by_role TEXT;
ALTER TABLE public.residencias ADD COLUMN IF NOT EXISTS panic_triggered_at TEXT;

-- ====================================================================
-- CASE-SENSITIVITY & SNAKE_CASE COMPATIBILITY REPAIR (FOR SYSTEM_ROLES)
-- Ensures SELECT id, is_active, created_at, residencia_id works cleanly for queries and SQL UI
-- ====================================================================
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS residencia_id TEXT;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS residencia_nombre TEXT;

-- Initial data migration and alignment
UPDATE public.system_roles 
SET 
  id = COALESCE(id, uid),
  is_active = COALESCE(is_active, "isActive", TRUE),
  created_at = COALESCE(created_at, "createdAt", NOW()),
  residencia_id = COALESCE(residencia_id, "residenciaId"),
  residencia_nombre = COALESCE(residencia_nombre, "residenciaNombre");

UPDATE public.system_roles 
SET 
  uid = COALESCE(uid, id),
  "isActive" = COALESCE("isActive", is_active, TRUE),
  "createdAt" = COALESCE("createdAt", created_at, NOW()),
  "residenciaId" = COALESCE("residenciaId", residencia_id),
  "residenciaNombre" = COALESCE("residenciaNombre", residencia_nombre);

-- Trigger to dynamically sync all columns during insertions or edits
CREATE OR REPLACE FUNCTION public.sync_system_roles_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync uid and id
  IF NEW.id IS NULL AND NEW.uid IS NOT NULL THEN
    NEW.id := NEW.uid;
  ELSIF NEW.uid IS NULL AND NEW.id IS NOT NULL THEN
    NEW.uid := NEW.id;
  END IF;

  -- Sync isActive and is_active
  IF NEW.is_active IS NULL AND NEW."isActive" IS NOT NULL THEN
    NEW.is_active := NEW."isActive";
  ELSIF NEW."isActive" IS NULL AND NEW.is_active IS NOT NULL THEN
    NEW."isActive" := NEW.is_active;
  END IF;

  -- Sync createdAt and created_at
  IF NEW.created_at IS NULL AND NEW."createdAt" IS NOT NULL THEN
    NEW.created_at := NEW."createdAt";
  ELSIF NEW."createdAt" IS NULL AND NEW.created_at IS NOT NULL THEN
    NEW."createdAt" := NEW.created_at;
  END IF;

  -- Sync residenciaId and residencia_id
  IF NEW.residencia_id IS NULL AND NEW."residenciaId" IS NOT NULL THEN
    NEW.residencia_id := NEW."residenciaId";
  ELSIF NEW."residenciaId" IS NULL AND NEW.residencia_id IS NOT NULL THEN
    NEW."residenciaId" := NEW.residencia_id;
  END IF;

  -- Sync residenciaNombre and residencia_nombre
  IF NEW.residencia_nombre IS NULL AND NEW."residenciaNombre" IS NOT NULL THEN
    NEW.residencia_nombre := NEW."residenciaNombre";
  ELSIF NEW."residenciaNombre" IS NULL AND NEW.residencia_nombre IS NOT NULL THEN
    NEW."residenciaNombre" := NEW.residencia_nombre;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_system_roles ON public.system_roles;
CREATE TRIGGER trg_sync_system_roles
BEFORE INSERT OR UPDATE ON public.system_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_system_roles_columns();


