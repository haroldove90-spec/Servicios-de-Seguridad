-- ====================================================================
-- SCRIPT COMPLETO DE ACTUALIZACIÓN SEGURA Y COMPATIBILIDAD SUPABASE / POSTGRESQL
-- (100% SEGURO: NO BORRA NINGÚN REGISTRO NI TABLA EXISTENTE)
-- ====================================================================

-- 1. TIPOS Y ENUMS
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_user_role') THEN
    CREATE TYPE system_user_role AS ENUM (
      'admin', 'supervisor', 'guard', 'residente', 'auditor', 'condominios'
    );
  END IF;
END $$;

-- 2. TABLA SYSTEM_ROLES
CREATE TABLE IF NOT EXISTS public.system_roles (
    uid TEXT PRIMARY KEY,
    email TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'residente',
    username TEXT,
    password TEXT,
    "isActive" BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    "residenciaId" TEXT,
    residencia_id TEXT,
    "residenciaNombre" TEXT,
    residencia_nombre TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    phone TEXT,
    avatar TEXT
);

-- Asegurar columnas en system_roles
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS residencia_id TEXT;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS "residenciaId" TEXT;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS residencia_nombre TEXT;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS "residenciaNombre" TEXT;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Restricción UNIQUE en uid (por si no existiera)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'system_roles_uid_key') THEN
        ALTER TABLE public.system_roles ADD CONSTRAINT system_roles_uid_key UNIQUE (uid);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. TABLA BITÁCORA DE ACCESOS (ACCESS_LOGS)
CREATE TABLE IF NOT EXISTS public.access_logs (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    user_id TEXT,
    "userName" TEXT,
    user_name TEXT,
    "documentId" TEXT,
    document_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    "guardId" TEXT,
    guard_id TEXT,
    "guardName" TEXT,
    guard_name TEXT,
    "residenciaId" TEXT,
    residencia_id TEXT,
    "residenciaNombre" TEXT,
    residencia_nombre TEXT,
    "casetaId" TEXT,
    caseta_id TEXT,
    "casetaNombre" TEXT,
    caseta_nombre TEXT
);

ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS "userName" TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS "documentId" TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS document_id TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS "guardId" TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS guard_id TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS "guardName" TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS guard_name TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS "residenciaId" TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS residencia_id TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS "residenciaNombre" TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS residencia_nombre TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS "casetaId" TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS caseta_id TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS "casetaNombre" TEXT;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS caseta_nombre TEXT;

-- 4. TABLA EVIDENCIAS (FOTOGRAFÍAS DE PLACAS E IDENTIFICACIONES INE)
CREATE TABLE IF NOT EXISTS public.evidencias (
    id TEXT PRIMARY KEY,
    "residenciaId" TEXT,
    residencia_id TEXT,
    residenciaid TEXT,
    "residenciaNombre" TEXT,
    residencia_nombre TEXT,
    residencianombre TEXT,
    "casetaId" TEXT,
    caseta_id TEXT,
    casetaid TEXT,
    "casetaNombre" TEXT,
    caseta_nombre TEXT,
    casetanombre TEXT,
    "guardId" TEXT,
    guard_id TEXT,
    guardid TEXT,
    "guardName" TEXT,
    guard_name TEXT,
    guardname TEXT,
    "photoUrl" TEXT,
    photo_url TEXT,
    photourl TEXT,
    placas TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    notas TEXT,
    tipo TEXT DEFAULT 'placa'
);

ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS "residenciaId" TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS residencia_id TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS residenciaid TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS "residenciaNombre" TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS residencia_nombre TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS residencianombre TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS "casetaId" TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS caseta_id TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS casetaid TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS "casetaNombre" TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS caseta_nombre TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS casetanombre TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS "guardId" TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS guard_id TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS guardid TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS "guardName" TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS guard_name TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS guardname TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS photourl TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS placas TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE public.evidencias ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'placa';

-- 5. TABLA AUTHORIZED_USERS (Pases y Accesos)
CREATE TABLE IF NOT EXISTS public.authorized_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    document_id TEXT,
    "documentId" TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active',
    "qrcodeToken" TEXT,
    qrcode_token TEXT,
    one_time BOOLEAN DEFAULT true,
    used BOOLEAN DEFAULT false,
    "validFrom" TIMESTAMP WITH TIME ZONE,
    valid_from TIMESTAMP WITH TIME ZONE,
    "validUntil" TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    days JSONB DEFAULT '[]'::jsonb,
    "startTime" TEXT,
    start_time TEXT,
    "endTime" TEXT,
    end_time TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "residenciaId" TEXT,
    residencia_id TEXT,
    "residenciaNombre" TEXT,
    residencia_nombre TEXT,
    is_resident_created BOOLEAN DEFAULT false,
    resident_name TEXT,
    resident_phone TEXT
);

-- 6. TABLA RESIDENTES
CREATE TABLE IF NOT EXISTS public.residentes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    "residenciaId" TEXT,
    residencia_id TEXT,
    "residenciaNombre" TEXT,
    residencia_nombre TEXT,
    direccion TEXT,
    "qrcodeToken" TEXT,
    qrcode_token TEXT,
    whatsapp TEXT,
    is_active BOOLEAN DEFAULT true,
    "isActive" BOOLEAN DEFAULT true,
    username TEXT,
    password TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA MARBETES
CREATE TABLE IF NOT EXISTS public.marbetes (
    id TEXT PRIMARY KEY,
    consecutivo INTEGER DEFAULT 1000,
    "residenteNombre" TEXT,
    residente_nombre TEXT,
    "residenciaNombre" TEXT,
    residencia_nombre TEXT,
    "residenciaId" TEXT,
    residencia_id TEXT,
    "residenteId" TEXT,
    residente_id TEXT,
    "vehiculoPlacas" TEXT,
    vehiculo_placas TEXT,
    "vehiculoInfo" TEXT,
    vehiculo_info TEXT,
    status TEXT DEFAULT 'activo',
    "qrcodeToken" TEXT,
    qrcode_token TEXT,
    "validFrom" TIMESTAMP WITH TIME ZONE,
    valid_from TIMESTAMP WITH TIME ZONE,
    "validUntil" TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLA CASETAS
CREATE TABLE IF NOT EXISTS public.casetas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    "residenciaId" TEXT,
    residencia_id TEXT,
    "residenciaNombre" TEXT,
    residencia_nombre TEXT,
    "isActive" BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABLA RESIDENCIAS
CREATE TABLE IF NOT EXISTS public.residencias (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    administrador TEXT,
    "numResidencias" INTEGER DEFAULT 1,
    "isActive" BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. MÓDULO CONDOMINIOS (Estructuras, Unidades, Pagos, Egresos, Amenidades, Facturas, Personal)
CREATE TABLE IF NOT EXISTS estructuras_inmobiliarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    unidades_count INT DEFAULT 0,
    unidades_detalle TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estructura_id UUID REFERENCES estructuras_inmobiliarias(id) ON DELETE SET NULL,
    identificador VARCHAR(50) NOT NULL,
    propietario_nombre VARCHAR(150),
    mantenimiento_cuota NUMERIC(12,2) DEFAULT 0.00,
    estatus_morosidad VARCHAR(30) DEFAULT 'al_dia',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_interno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    turno VARCHAR(50) DEFAULT 'Matutino',
    telefono VARCHAR(30),
    status VARCHAR(30) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagos_cuotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidad_id UUID REFERENCES unidades(id) ON DELETE SET NULL,
    unidad VARCHAR(100),
    concepto VARCHAR(200) NOT NULL,
    monto NUMERIC(12,2) NOT NULL,
    fecha_pago DATE DEFAULT CURRENT_DATE,
    estatus VARCHAR(30) DEFAULT 'pagado',
    metodo_pago VARCHAR(50),
    comprobante_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egresos_condominio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concepto VARCHAR(200) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    monto NUMERIC(12,2) NOT NULL,
    proveedor VARCHAR(150),
    fecha DATE DEFAULT CURRENT_DATE,
    comprobante_xml_pdf TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS facturas_cfdi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pago_id UUID REFERENCES pagos_cuotas(id) ON DELETE SET NULL,
    rfc_receptor VARCHAR(15) NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL,
    regimen_fiscal VARCHAR(10) NOT NULL,
    uso_cfdi VARCHAR(10) DEFAULT 'S01',
    monto_total NUMERIC(12,2) NOT NULL,
    folio_fiscal_uuid VARCHAR(100),
    estatus_sat VARCHAR(30) DEFAULT 'timbrado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS amenidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    cuota NUMERIC(12,2) DEFAULT 0.00,
    capacidad_max INT DEFAULT 0,
    horario VARCHAR(100),
    estatus VARCHAR(30) DEFAULT 'disponible'
);

CREATE TABLE IF NOT EXISTS ordenes_trabajo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio VARCHAR(30) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    reportado_por VARCHAR(150),
    asignado_a VARCHAR(150),
    estatus VARCHAR(30) DEFAULT 'en_proceso',
    prioridad VARCHAR(20) DEFAULT 'media',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comunicados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS encuestas_votaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_cierre DATE,
    votos_favor INT DEFAULT 0,
    votos_contra INT DEFAULT 0,
    estatus VARCHAR(30) DEFAULT 'activa'
);

CREATE TABLE IF NOT EXISTS presupuestos_extraordinarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    justificacion TEXT,
    monto_total NUMERIC(12,2) NOT NULL,
    solicitado_por VARCHAR(150),
    fecha DATE DEFAULT CURRENT_DATE,
    estatus VARCHAR(30) DEFAULT 'pendiente'
);

CREATE TABLE IF NOT EXISTS actas_asamblea (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    fecha_asamblea DATE NOT NULL,
    estatus VARCHAR(30) DEFAULT 'borrador',
    requiere_firmas INT DEFAULT 3,
    firmas_digitales_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(150),
    rol VARCHAR(50) DEFAULT 'condominios',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- DESACTIVAR RLS Y LIMPIEZA DE POLÍTICAS DUPLICADAS
-- Evita el error "ERROR 42710: policy already exists"
-- ====================================================================

ALTER TABLE public.system_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.residentes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marbetes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.casetas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.residencias DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas para evitar conflictos en caso de volver a habilitar RLS
DROP POLICY IF EXISTS "Permitir lectura publica de evidencias" ON public.evidencias;
DROP POLICY IF EXISTS "Permitir insercion de evidencias" ON public.evidencias;
DROP POLICY IF EXISTS "Permitir insercion publica de evidencias" ON public.evidencias;
DROP POLICY IF EXISTS "Permitir actualizacion de evidencias" ON public.evidencias;
DROP POLICY IF EXISTS "Permitir eliminacion de evidencias" ON public.evidencias;
DROP POLICY IF EXISTS "Permitir todo en evidencias" ON public.evidencias;

DROP POLICY IF EXISTS "Permitir acceso total a system_roles" ON public.system_roles;
DROP POLICY IF EXISTS "Allow select for system_roles" ON public.system_roles;
DROP POLICY IF EXISTS "Permitir acceso total a residentes" ON public.residentes;
DROP POLICY IF EXISTS "Permitir acceso total a authorized_users" ON public.authorized_users;
DROP POLICY IF EXISTS "Permitir acceso total a access_logs" ON public.access_logs;
DROP POLICY IF EXISTS "Permitir lectura publica de access_logs" ON public.access_logs;
DROP POLICY IF EXISTS "Permitir insercion publica de access_logs" ON public.access_logs;
DROP POLICY IF EXISTS "Permitir todo en access_logs" ON public.access_logs;

-- Conceder permisos completos a los roles de Supabase (anon, authenticated, service_role)
GRANT ALL ON TABLE public.system_roles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.access_logs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.evidencias TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.authorized_users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.residentes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.marbetes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.casetas TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.residencias TO anon, authenticated, service_role;

-- ====================================================================
-- TRIGGERS Y FUNCIONES DE SINCRONIZACIÓN AUTOMÁTICA
-- ====================================================================

CREATE OR REPLACE FUNCTION public.sync_system_roles_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL AND NEW.uid IS NOT NULL THEN
    NEW.id := NEW.uid;
  ELSIF NEW.uid IS NULL AND NEW.id IS NOT NULL THEN
    NEW.uid := NEW.id;
  END IF;

  IF NEW.is_active IS NULL AND NEW."isActive" IS NOT NULL THEN
    NEW.is_active := NEW."isActive";
  ELSIF NEW."isActive" IS NULL AND NEW.is_active IS NOT NULL THEN
    NEW."isActive" := NEW.is_active;
  END IF;

  IF NEW.created_at IS NULL AND NEW."createdAt" IS NOT NULL THEN
    NEW.created_at := NEW."createdAt";
  ELSIF NEW."createdAt" IS NULL AND NEW.created_at IS NOT NULL THEN
    NEW."createdAt" := NEW.created_at;
  END IF;

  IF NEW.residencia_id IS NULL AND NEW."residenciaId" IS NOT NULL THEN
    NEW.residencia_id := NEW."residenciaId";
  ELSIF NEW."residenciaId" IS NULL AND NEW.residencia_id IS NOT NULL THEN
    NEW."residenciaId" := NEW.residencia_id;
  END IF;

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

-- ====================================================================
-- INSERCIÓN / ACTUALIZACIÓN SEGURA DE USUARIOS ADMINISTRATIVOS
-- (ON CONFLICT DO UPDATE - CONSERVA DATOS Y NO DUPLICA)
-- ====================================================================

INSERT INTO public.system_roles (
  uid, name, email, username, role, "isActive", is_active, password, phone, "createdAt", created_at
)
VALUES (
  'emp_manual_01',
  'Carlos Barrientos',
  'cbarrientos@gmail.com',
  'cbarrientos',
  'supervisor',
  true,
  true,
  'Seguridad_2026',
  '+525544332211',
  NOW(),
  NOW()
)
ON CONFLICT (uid) DO UPDATE 
SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  "isActive" = EXCLUDED."isActive",
  is_active = EXCLUDED.is_active,
  password = EXCLUDED.password,
  phone = EXCLUDED.phone;

INSERT INTO public.system_roles (
  uid, name, email, username, role, "isActive", is_active, password, "createdAt", created_at
)
VALUES (
  'condo-harold-uid',
  'Harold Anguiano',
  'harold.anguiano@condominios.local',
  'harold.anguiano',
  'condominios',
  true,
  true,
  'Chevropar#1970',
  NOW(),
  NOW()
)
ON CONFLICT (uid) DO UPDATE 
SET 
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  "isActive" = true,
  is_active = true;

INSERT INTO public.system_roles (
  uid, name, email, username, role, "isActive", is_active, password, "createdAt", created_at
)
VALUES (
  'condo-admin-uid',
  'admin@condominios.local',
  'Administrador de Condominios',
  'admin',
  'condominios',
  true,
  true,
  'Admin_123',
  NOW(),
  NOW()
)
ON CONFLICT (uid) DO UPDATE 
SET 
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  "isActive" = true,
  is_active = true;

INSERT INTO public.system_roles (
  uid, name, email, username, role, "isActive", is_active, password, "createdAt", created_at
)
VALUES (
  'admin-main-uid',
  'admin@sistema.local',
  'Admin Principal',
  'admin',
  'admin',
  true,
  true,
  'Admin_123',
  NOW(),
  NOW()
)
ON CONFLICT (uid) DO UPDATE 
SET 
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  "isActive" = true,
  is_active = true;

INSERT INTO usuarios_sistema (username, password, nombre, rol, activo)
VALUES ('admin', 'Admin_123', 'Administrador del Condominio', 'condominios', true)
ON CONFLICT (username) DO UPDATE 
SET 
  password = EXCLUDED.password,
  nombre = EXCLUDED.nombre,
  rol = EXCLUDED.rol,
  activo = true;

-- ====================================================================
-- ÍNDICES DE ACELERACIÓN DE BÚSQUEDAS
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON public.access_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_evidencias_timestamp ON public.evidencias(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_evidencias_placas ON public.evidencias(placas);
CREATE INDEX IF NOT EXISTS idx_evidencias_tipo ON public.evidencias(tipo);
CREATE INDEX IF NOT EXISTS idx_unidades_estructura ON unidades(estructura_id);
CREATE INDEX IF NOT EXISTS idx_residentes_unidad ON residentes(unidad_id);
CREATE INDEX IF NOT EXISTS idx_pagos_unidad ON pagos_cuotas(unidad_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estatus ON pagos_cuotas(estatus);
CREATE INDEX IF NOT EXISTS idx_egresos_categoria ON egresos_condominio(categoria);
