import React, { useState, useEffect } from 'react';
import { SystemRole } from '../types';
import { dbService } from '../services/dbService';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Phone, 
  Key, 
  Upload, 
  Camera, 
  Save, 
  Lock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface ProfileManagerProps {
  currentUser: SystemRole;
  onProfileUpdated: (updated: SystemRole) => void;
}

const PRESET_AVATARS = [
  { name: 'Oficial Plata Centinela', emoji: '👮' },
  { name: 'Supervisor Águila Oro', emoji: '🕵️' },
  { name: 'Administración Escudo', emoji: '🛡️' },
  { name: 'Soporte Técnico', emoji: '⚡' },
  { name: 'Oficial Femenil Nocturno', emoji: '🤶' },
  { name: 'Seguridad General', emoji: '👥' },
];

export const ProfileManager: React.FC<ProfileManagerProps> = ({ currentUser, onProfileUpdated }) => {
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [password, setPassword] = useState(currentUser.password || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');

  // Keep state synced with any parent container modifications in the active session
  useEffect(() => {
    setName(currentUser.name || '');
    setEmail(currentUser.email || '');
    setUsername(currentUser.username || '');
    setPhone(currentUser.phone || '');
    setPassword(currentUser.password || '');
    setAvatar(currentUser.avatar || '');
  }, [currentUser]);
  
  // Status message states
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // File drag-and-drop feedback
  const [isDragging, setIsDragging] = useState(false);

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPhotoFile(file);
    }
  };

  const processPhotoFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      showMsg('error', 'La imagen es demasiado grande. El límite es de 2MB para almacenamiento ligero.');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAvatar(base64String);
      showMsg('success', 'Foto de perfil cargada temporalmente de forma correcta.');
    };
    reader.onerror = () => {
      showMsg('error', 'Error al leer el archivo de imagen.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processPhotoFile(file);
    }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => {
      setStatusMsg(null);
    }, 4000);
  };

  const handlePresetSelect = (emoji: string) => {
    // Generate simple custom badge representation
    setAvatar(emoji);
    showMsg('success', `Insignia "${emoji}" seleccionada exitosamente como avatar.`);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      showMsg('error', 'El nombre completo es obligatorio.');
      return;
    }

    if (!username.trim()) {
      showMsg('error', 'El nombre de usuario (login) es obligatorio.');
      return;
    }

    setIsSaving(true);
    
    try {
      // Validate unique username among other operators (excluding self)
      const allRoles = await dbService.getAllSystemRoles();
      if (allRoles) {
        const usernameClash = allRoles.find(
          r => r.uid !== currentUser.uid && r.username?.toLowerCase() === username.trim().toLowerCase()
        );
        if (usernameClash) {
          showMsg('error', `El usuario "${username}" ya se encuentra ocupado por otro integrante del panel residencial.`);
          setIsSaving(false);
          return;
        }
      }

      // Prepare updated payload
      const payload: SystemRole = {
        ...currentUser,
        name: name.trim(),
        email: email.trim(),
        username: username.trim().toLowerCase(),
        phone: phone.trim(),
        password: password.trim(),
        avatar: avatar
      };

      await dbService.saveSystemRole(payload);
      
      // Propagate state update back to standard context
      onProfileUpdated(payload);
      showMsg('success', '¡Perfil actualizado con éxito! Las modificaciones se han guardado de forma permanente.');
    } catch (err: any) {
      console.error('Error al guardar datos de perfil', err);
      showMsg('error', 'Incapacidad de sincronización de datos con el servidor de la nube.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#2A2A2E] rounded-3xl border border-[#3e3e42] p-6 lg:p-8 space-y-8 max-w-3xl mx-auto font-sans text-slate-200">
      
      {/* Banner Intro */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#3e3e42] pb-6 gap-4">
        <div>
          <div className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/15 rounded-lg px-2.5 py-0.5 text-red-400 text-[10px] font-bold uppercase tracking-widest mb-2.5">
            Mi Cuenta CNLS
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Editar Datos del Servidor</h2>
          <p className="text-xs text-slate-400 mt-1">Configura tus credenciales reales y personaliza tu perfil de seguridad digital.</p>
        </div>
        
        <div className="px-4 py-2.5 bg-[#1A1A1E] border border-[#3e3e42] rounded-2xl flex items-center gap-2.5 shrink-0 shadow-inner">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Puesto de Turno</p>
            <p className="text-xs font-black text-amber-450 uppercase mt-0.5 tracking-wide">
              {currentUser.role === 'admin' ? 'Director General 🛡️' : 'Oficial de Seguridad / Caseta 👮'}
            </p>
          </div>
        </div>
      </div>

      {/* Alert toast messages */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl flex gap-3 animate-fade-in border ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-xs leading-relaxed font-semibold">{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Col 1: Avatar customization */}
          <div className="space-y-4 md:col-span-1">
            <label className="block text-[10.5px] font-bold text-white uppercase tracking-wider mb-2">Imagen / Foto de Perfil</label>
            
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative group h-40 bg-[#1A1A1E] rounded-3xl border-2 ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-500/5' 
                  : 'border-dashed border-[#3e3e42] hover:border-red-500'
              } transition-all duration-300 flex flex-col items-center justify-center p-4 text-center cursor-pointer overflow-hidden shadow-inner`}
            >
              <input
                id="profile-avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              
              {avatar ? (
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  {avatar.length < 5 ? (
                    // Emoji representation 
                    <div className="text-5xl select-none animate-fade-in py-2">{avatar}</div>
                  ) : (
                    // Base64 file representation
                    <img 
                      src={avatar} 
                      alt="Avatar de operador" 
                      className="w-24 h-24 rounded-full object-cover border-2 border-red-500/40 p-0.5 object-center animate-fade-in shadow-xl"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 rounded-3xl z-20 pointer-events-none">
                    <Camera className="w-4 h-4 text-red-500 animate-bounce" />
                    <span>Cambiar Imagen</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pointer-events-none">
                  <div className="w-11 h-11 bg-zinc-900 border border-[#3e3e42] text-slate-400 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition shrink-0">
                    <Camera className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-[10px] text-zinc-300 font-medium">Arrastra tu foto o haz clic para buscar</p>
                  <p className="text-[8.5px] text-zinc-550">Formatos JPG, PNG (Max. 2MB)</p>
                </div>
              )}
            </div>

            {/* Quick avatar badges gallery */}
            <div className="pt-2">
              <p className="text-[9px] uppercase font-bold text-zinc-400 mb-2 leading-none">O Elige un Distintivo Oficial:</p>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((av) => (
                  <button
                    key={av.name}
                    type="button"
                    onClick={() => handlePresetSelect(av.emoji)}
                    className={`py-2 bg-[#1A1A1E] text-lg hover:bg-slate-700/80 rounded-xl transition border border-[#3e3e42] cursor-pointer hover:border-red-500/40`}
                    title={av.name}
                  >
                    {av.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Col 2 & 3: Main credentials fields */}
          <div className="md:col-span-2 space-y-5">
            
            {/* Field: Full Name */}
            <div>
              <label htmlFor="pf-input-name" className="block text-[10px] font-bold text-white uppercase tracking-wider mb-2">Nombre Completo *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="pf-input-name"
                  type="text"
                  required
                  placeholder="Ej. Oficial Claudio Barrientos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1E] border border-[#3e3e42] text-white rounded-xl focus:border-red-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Field: Username */}
              <div>
                <label htmlFor="pf-input-username" className="block text-[10px] font-bold text-white uppercase tracking-wider mb-2">Nombre de Usuario (Login) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[11px] text-slate-500 font-black">@</span>
                  <input
                    id="pf-input-username"
                    type="text"
                    required
                    placeholder="Ej. cbarrientos"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full pl-9 pr-4 py-2.5 bg-[#1A1A1E] border border-[#3e3e42] text-white rounded-xl focus:border-red-500 focus:outline-hidden font-mono text-xs"
                  />
                </div>
              </div>

              {/* Field: Phone */}
              <div>
                <label htmlFor="pf-input-phone" className="block text-[10px] font-bold text-white uppercase tracking-wider mb-2">WhatsApp / Teléfono de Contacto</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="pf-input-phone"
                    type="tel"
                    placeholder="Ej. +52 5522 1100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1E] border border-[#3e3e42] text-white rounded-xl focus:border-red-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Field: Email */}
            <div>
              <label htmlFor="pf-input-email" className="block text-[10px] font-bold text-white uppercase tracking-wider mb-2">Correo Electrónico Autorizado</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="pf-input-email"
                  type="email"
                  placeholder="Ej. claudio@seguridad.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1E] border border-[#3e3e42] text-white rounded-xl focus:border-red-500 focus:outline-hidden font-mono text-xs"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="p-4 bg-zinc-950/45 border border-[#3e3e42] rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-red-550 shrink-0" />
                <span className="text-[10px] font-bold uppercase text-slate-200 tracking-wider">Contraseña de Acceso Directo</span>
              </div>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="pf-input-password"
                  type="text"
                  placeholder="Definir contraseña de login del empleado"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#1A1A1E] border border-[#3e3e42] text-white rounded-xl focus:border-red-500 focus:outline-hidden font-mono text-xs text-red-400 font-bold"
                />
              </div>
              <p className="text-[9px] text-zinc-400 leading-snug">
                Esta clave en combinación con tu usuario te sirve para ingresar al dashboard desde la pantalla principal sin necesidad de un enlace dinámico obligatorio.
              </p>
            </div>

          </div>
        </div>

        {/* Footer save operation triggers */}
        <div className="border-t border-[#3e3e42] pt-5 flex justify-end">
          <button
            id="btn-profile-submit-save"
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-red-650 hover:bg-red-600 disabled:bg-zinc-800 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sincronizando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Guardar y Sincronizar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
