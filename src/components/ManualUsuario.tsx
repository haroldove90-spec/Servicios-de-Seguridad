import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Shield, 
  Users, 
  Home, 
  Smartphone, 
  ScanLine, 
  MessageSquare, 
  AlertTriangle, 
  ChevronRight, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  ClipboardCheck,
  FileText
} from 'lucide-react';

interface ManualUsuarioProps {
  onGoToTab?: (tab: string) => void;
}

export const ManualUsuario: React.FC<ManualUsuarioProps> = ({ onGoToTab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'inicio' | 'residencias' | 'personas' | 'caseta' | 'whatsapp'>('all');

  const manualSteps = [
    {
      id: 'step-1',
      category: 'inicio',
      title: '1. Acceso al Sistema y Roles',
      icon: <Shield className="w-5 h-5 text-red-500" />,
      tag: 'Configuración Básica',
      description: 'Cómo ingresar a la plataforma y entender los privilegios de cada cuenta.',
      points: [
        {
          title: 'Iniciar Sesión',
          text: 'Ingresa a la pantalla principal. Puedes usar las credenciales asignadas por tu administrador o usar las de prueba temporal: usuario "admin" con contraseña "Admin_123" para control absoluto.'
        },
        {
          title: 'Roles de Usuarios',
          text: 'El sistema maneja dos roles principales en caseta y administración: "Director Administrador 🛡️" (gestiona todo) y "Oficial de Seguridad / Caseta 👮" (controla los accesos diario y escanea QR).'
        },
        {
          title: 'Independencia de Residencias',
          text: 'Cada subdivisión o condominio tiene su propio sub-administrador y su propia caseta de oficialía, garantizando la privacidad de los datos.'
        }
      ],
      tip: 'Puedes cambiar de perfil en cualquier momento tocando "Cerrar Sesión" en la esquina superior derecha para volver al menú de entrada.'
    },
    {
      id: 'step-2',
      category: 'residencias',
      title: '2. Registro de Subdivisiones y Residencias',
      icon: <Home className="w-5 h-5 text-amber-500" />,
      tag: 'Gestión Residencial',
      description: 'Alta de condominios, clústeres, privadas o colonias que serán controladas.',
      points: [
        {
          title: 'Acceder al Módulo',
          text: 'Ve al menú lateral izquierdo (icono de hamburguesa) y selecciona "Registro de Residencia".'
        },
        {
          title: 'Llenar los Datos',
          text: 'Presiona "Registrar Nueva Residencia". Escribe el nombre de la privada (ej. "Lomas del Sol") y el nombre del Administrador asignado para ese desarrollo residencial.'
        },
        {
          title: 'Creación de Cuentas Automáticas',
          text: '¡Magia! Al registrar una residencia, el sistema auto-genera e instala al instante una cuenta de Administrador de Residencia y una cuenta de Oficial de Caseta con contraseñas seguras y teléfonos de guardia asignados.'
        }
      ],
      tip: 'Esto evita que configures manualmente las contraseñas para los guardias de cada caseta nueva. ¡Todo se autoconfigura!'
    },
    {
      id: 'step-3',
      category: 'personas',
      title: '3. Alta de Residentes y Empleados',
      icon: <Users className="w-5 h-5 text-blue-500" />,
      tag: 'Control de Personal',
      description: 'Registro de los habitantes de un condominio y del personal de seguridad.',
      points: [
        {
          title: 'Registrar un Residente',
          text: 'Ve al módulo "Registro de Residente" desde el menú lateral. Elige la subdivisión a la que pertenece y coloca su teléfono de contacto y correo electrónico.'
        },
        {
          title: 'Alta de Empleados y Guardias',
          text: 'En el módulo "Privilegios y Roles", el Administrador General puede dar de alta nuevos directores, supervisores y oficiales capturando su nombre, usuario y teléfono WhatsApp.'
        }
      ],
      tip: 'Asegúrate de colocar números telefónicos válidos de 10 dígitos (ej. 5512345678) para que el envío automatizado de mensajes de WhatsApp funcione perfectamente.'
    },
    {
      id: 'step-4',
      category: 'whatsapp',
      title: '4. Envío Automatizado por WhatsApp',
      icon: <MessageSquare className="w-5 h-5 text-emerald-500" />,
      tag: 'Notificaciones Instantáneas',
      description: 'Cómo despachar las credenciales de los nuevos operarios directo a su celular.',
      points: [
        {
          title: 'Funcionalidad de WhatsApp Automática',
          text: 'Al terminar de registrar un empleado en "Privilegios y Roles", el sistema creará su perfil y automáticamente intentará abrir una pestaña de WhatsApp Web con un mensaje ya redactado conteniendo su usuario, contraseña y la URL del sistema.'
        },
        {
          title: 'Soporte de Bloqueo de Ventanas Emergentes',
          text: 'Si el navegador web o iframe bloquea el popup automático, aparecerá un cuadro amarillo con un botón verde que dice "Enviar por WhatsApp 💬". Presiónalo para abrir el chat de manera directa.'
        },
        {
          title: 'Copiar Mensaje Compartible',
          text: 'También cuentas con un botón de "Copiar Mensaje". Así puedes copiar el contenido de las credenciales al portapapeles y mandarlo libremente por correo u otra red social.'
        }
      ],
      tip: 'Es sumamente útil para que el guardia reciba sus contraseñas en su teléfono móvil sin que tengas que transcribir nada.'
    },
    {
      id: 'step-5',
      category: 'caseta',
      title: '5. Control de Accesos y Escaneo (Caseta)',
      icon: <ScanLine className="w-5 h-5 text-red-400" />,
      tag: 'Operación Diaria',
      description: 'Guía paso a paso para los guardias de seguridad en caseta para escanear pases QR.',
      points: [
        {
          title: 'Escanear Pase QR',
          text: 'El guardia de turno ingresa a "Acceso de Residente". Verás la cámara activa apuntando a lector de pases.'
        },
        {
          title: 'Escanear Código',
          text: 'El visitante muestra el código QR desde su celular o impreso. El escáner lo lee en milisegundos.'
        },
        {
          title: 'Validación en Pantalla',
          text: 'Aparece la foto del visitante y un marco de color indicando el estado del pase:\n🟢 VERDE (Pase Activo y Autorizado) - Permite el paso.\n🔴 ROJO (Pase Vencido, Ya Usado o Inexistente) - Acceso Denegado.'
        }
      ],
      tip: 'En el módulo de simulación puedes dar clic en "Simular Escaneo" para ver cómo procesa y valida los pases en tiempo real de forma segura.'
    }
  ];

  // Filtering logic
  const filteredSteps = manualSteps.filter(step => {
    const matchesSearch = 
      step.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      step.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      step.points.some(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.text.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = activeCategory === 'all' || step.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="manual-usuario-module" className="bg-[#1A1A1E] border border-[#3e3e42] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden font-sans">
      
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-3xl rounded-full pointer-events-none"></div>
      
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-[#3e3e42] gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-650/15 border border-red-500/25 flex items-center justify-center text-red-500">
            <BookOpen className="w-5.5 h-5.5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Manual del Usuario</h2>
            <p className="text-xs text-slate-400 mt-1">Guía paso a paso simplificada para la administración y control de accesos CNLS.</p>
          </div>
        </div>
        
        {/* Quick action to go to a quick help panel */}
        <div className="flex items-center gap-2 text-[10.5px] bg-[#242429] hover:bg-zinc-800 text-amber-400 font-mono font-bold px-3 py-1.5 rounded-lg border border-amber-500/10">
          <Sparkles className="w-3.5 h-3.5" />
          <span>¡LISTO PARA CLIENTES!</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="manual-search-input"
            type="text"
            placeholder="Buscar tema (ej. WhatsApp, residencias, guardia)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#141418] border border-[#3e3e42] text-white text-xs sm:text-sm rounded-xl focus:border-red-500 focus:outline-hidden font-sans placeholder:text-slate-500"
          />
        </div>
        
        {/* Category Filters Pill Box */}
        <div className="flex flex-wrap gap-1.5 self-start md:self-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition uppercase ${
              activeCategory === 'all' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'bg-[#242429] text-slate-400 hover:text-white border border-[#3e3e42]'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveCategory('inicio')}
            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition uppercase ${
              activeCategory === 'inicio' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'bg-[#242429] text-slate-400 hover:text-white border border-[#3e3e42]'
            }`}
          >
            Acceso
          </button>
          <button
            onClick={() => setActiveCategory('residencias')}
            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition uppercase ${
              activeCategory === 'residencias' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'bg-[#242429] text-slate-400 hover:text-white border border-[#3e3e42]'
            }`}
          >
            Subdivisiones
          </button>
          <button
            onClick={() => setActiveCategory('personas')}
            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition uppercase ${
              activeCategory === 'personas' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'bg-[#242429] text-slate-400 hover:text-white border border-[#3e3e42]'
            }`}
          >
            Residentes
          </button>
          <button
            onClick={() => setActiveCategory('whatsapp')}
            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition uppercase ${
              activeCategory === 'whatsapp' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'bg-[#242429] text-slate-400 hover:text-white border border-[#3e3e42]'
            }`}
          >
            WhatsApp
          </button>
        </div>
      </div>

      {/* Manual Content Steps Grid */}
      <div className="mt-8 space-y-6">
        {filteredSteps.length > 0 ? (
          filteredSteps.map((step) => (
            <div 
              key={step.id} 
              className="bg-[#1F1F24] border border-[#3e3e42] hover:border-slate-500/40 rounded-2xl p-5 sm:p-6 transition-all duration-200"
            >
              {/* Step Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-zinc-850 border border-[#3e3e42] flex items-center justify-center">
                    {step.icon}
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-tight">
                    {step.title}
                  </h3>
                </div>
                <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 bg-red-650/15 text-red-400 rounded-md border border-red-500/10">
                  {step.tag}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-5 font-sans">
                {step.description}
              </p>

              {/* Step Key Points */}
              <div className="space-y-4 border-l-2 border-red-655 pl-4 ml-2">
                {step.points.map((point, pIndex) => (
                  <div key={pIndex} className="relative">
                    {/* Tiny bullet circle */}
                    <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-red-500"></div>
                    
                    <h4 className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
                      {point.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed mt-1 font-sans whitespace-pre-line">
                      {point.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tip Pro box */}
              <div className="mt-5 p-3.5 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 rounded-xl flex gap-3 transition">
                <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-200 font-sans leading-normal">
                  <strong>💡 Pro-Tip:</strong> {step.tip}
                </p>
              </div>

            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-[#1F1F24] rounded-2xl border border-dashed border-[#3e3e42]">
            <HelpCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-xs text-slate-300">No encontramos resultados para tu búsqueda.</p>
            <button 
              onClick={() => { setSearchTerm(''); setActiveCategory('all'); }} 
              className="mt-3 text-xs text-red-500 hover:underline font-bold"
            >
              Limpiar filtros y buscar de nuevo
            </button>
          </div>
        )}
      </div>

      {/* Cheat Sheet Summary */}
      <div className="mt-10 bg-[#121215] border border-[#2e2e34] rounded-2.5xl p-6 relative">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4.5 h-4.5 text-blue-400" />
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Acordeón de Operación Rápida</h3>
        </div>
        <div className="text-[11px] text-slate-405 leading-relaxed space-y-2.5 font-mono">
          <p>🏁 <b>Paso 1</b>: Entra con usuario <span className="text-slate-300 font-bold">admin</span> contraseña <span className="text-red-400 font-bold">Admin_123</span>.</p>
          <p>🏡 <b>Paso 2</b>: Registra la privada o condominio en <b>"Registro de Residencia"</b>.</p>
          <p>👮 <b>Paso 3</b>: Observa las claves generadas o agrega oficiales de caseta en <b>"Privilegios y Roles"</b>.</p>
          <p>🌱 <b>Paso 4</b>: Envía automáticamente las credenciales por <b>WhatsApp instantáneo</b>.</p>
          <p>📸 <b>Paso 5</b>: El guardia usa su clave en la caseta para entrar con rol Supervisor y escanea QR con la cámara.</p>
        </div>
      </div>

    </div>
  );
};
