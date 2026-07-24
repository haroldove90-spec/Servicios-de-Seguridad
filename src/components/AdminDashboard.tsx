/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Search, Edit2, Trash2, QrCode, Download, Copy, Check, X, Calendar, 
  Clock, Shield, User, Smartphone, Eye, Mail, Info, RefreshCcw, UserPlus
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { AuthorizedUser, UserStatus } from '../types';
import { generateQRWithLogo } from '../utils/qrWithLogo';

interface AdminDashboardProps {
  onUsersUpdated: () => void;
  currentUser?: any;
}

export default function AdminDashboard({ onUsersUpdated, currentUser }: AdminDashboardProps) {
  // Visitor CRUD Lists
  const [visitors, setVisitors] = useState<AuthorizedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [residencias, setResidencias] = useState<any[]>([]);
  
  // Create / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formDocumentId, setFormDocumentId] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formStatus, setFormStatus] = useState<UserStatus>(UserStatus.ACTIVE);
  const [formOneTime, setFormOneTime] = useState<boolean>(false);
  const [formValidFrom, setFormValidFrom] = useState<string>(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:mm
  const [formValidUntil, setFormValidUntil] = useState<string>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)); // +30 days
  const [formDays, setFormDays] = useState<number[]>([]); // Empty = All days
  const [formStartTime, setFormStartTime] = useState<string>('08:00');
  const [formEndTime, setFormEndTime] = useState<string>('18:00');
  const [formResidenciaId, setFormResidenciaId] = useState<string>('');

  // QR Modal Overlay
  const [selectedQRUser, setSelectedQRUser] = useState<AuthorizedUser | null>(null);
  const [generatedQRUrl, setGeneratedQRUrl] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');

  // Load visitors list
  const loadVisitors = () => {
    dbService.getAuthorizedUsers().then(users => {
      setVisitors(users);
    });
  };

  useEffect(() => {
    loadVisitors();
    dbService.getResidencias().then(resList => {
      setResidencias(resList || []);
    });
  }, []);

  // Sync QR generation when visitor is selected for QR popup
  useEffect(() => {
    if (selectedQRUser) {
      const passUrl = `${window.location.origin}${window.location.pathname}?pass=${selectedQRUser.qrcodeToken}`;
      generateQRWithLogo(passUrl)
        .then(url => setGeneratedQRUrl(url))
        .catch(err => console.error('Fallo al generar imagen QR', err));
    } else {
      setGeneratedQRUrl('');
    }
  }, [selectedQRUser]);

  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormName('');
    setFormDocumentId('');
    setFormEmail('');
    setFormPhone('');
    setFormStatus(UserStatus.ACTIVE);
    setFormOneTime(false);
    
    // Set default dates
    const nowLocal = new Date();
    setFormValidFrom(new Date(nowLocal.getTime() - (nowLocal.getTimezoneOffset() * 60000)).toISOString().slice(0, 16));
    const nextMonth = new Date(nowLocal.getTime() + 30 * 24 * 60 * 60 * 1000);
    setFormValidUntil(new Date(nextMonth.getTime() - (nextMonth.getTimezoneOffset() * 60000)).toISOString().slice(0, 16));
    
    setFormDays([]);
    setFormStartTime('08:00');
    setFormEndTime('18:00');
    setFormResidenciaId(currentUser?.residenciaId || '');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (user: AuthorizedUser) => {
    setEditingId(user.id);
    setFormName(user.name);
    setFormDocumentId(user.documentId);
    setFormEmail(user.email || '');
    setFormPhone(user.phone || '');
    setFormStatus(user.status);
    setFormOneTime(user.oneTime);
    
    // ISO Dates to HTML input formats
    setFormValidFrom(new Date(user.validFrom).toISOString().slice(0, 16));
    setFormValidUntil(new Date(user.validUntil).toISOString().slice(0, 16));
    setFormDays(user.days || []);
    setFormStartTime(user.startTime || '08:00');
    setFormEndTime(user.endTime || '18:00');
    setFormResidenciaId(user.residenciaId || '');
    setIsFormOpen(true);
  };

  const handleDayToggle = (dayIndex: number) => {
    if (formDays.includes(dayIndex)) {
      setFormDays(formDays.filter(d => d !== dayIndex));
    } else {
      setFormDays([...formDays, dayIndex].sort());
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleSaveVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDocumentId) {
      alert('Por favor complete los campos obligatorios: Nombre y Documento de Identidad.');
      return;
    }

    const assignedRes = residencias.find(r => r.id === formResidenciaId);
    const resNombre = assignedRes ? assignedRes.nombre : (currentUser?.residenciaId ? currentUser.residenciaNombre : '');

    let validFromDate = new Date(formValidFrom);
    if (isNaN(validFromDate.getTime())) validFromDate = new Date();

    let validUntilDate = new Date(formValidUntil);
    if (typeof formValidUntil === 'string' && formValidUntil.length === 10 && formValidUntil.includes('-')) {
      const parts = formValidUntil.split('-').map(Number);
      validUntilDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
    }
    if (isNaN(validUntilDate.getTime())) validUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const payload = {
      name: formName.trim(),
      documentId: formDocumentId.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      status: formStatus,
      oneTime: formOneTime,
      used: editingId ? (visitors.find(v => v.id === editingId)?.used || false) : false,
      validFrom: validFromDate.toISOString(),
      validUntil: validUntilDate.toISOString(),
      days: formDays,
      startTime: formStartTime,
      endTime: formEndTime,
      updatedAt: new Date().toISOString(),
      residenciaId: formResidenciaId || currentUser?.residenciaId || undefined,
      residenciaNombre: resNombre || undefined
    };

    if (editingId) {
      // Update
      const existing = visitors.find(v => v.id === editingId);
      await dbService.updateAuthorizedUser(editingId, {
        ...payload,
        isResidentCreated: existing?.isResidentCreated || false,
        residentName: existing?.residentName || undefined,
        residentPhone: existing?.residentPhone || undefined,
      });
    } else {
      // Create new: generate unique random access token
      const secureToken = 'qrpass_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await dbService.createAuthorizedUser({
        ...payload,
        qrcodeToken: secureToken,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.uid || 'admin-current-active',
      });
    }

    loadVisitors();
    onUsersUpdated();
    setIsFormOpen(false);
  };

  const handleDeleteVisitor = (id: string, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmId) {
      await dbService.deleteAuthorizedUser(deleteConfirmId);
      loadVisitors();
      onUsersUpdated();
      setDeleteConfirmId(null);
      setDeleteConfirmName('');
    }
  };

  const rawVisitors = currentUser?.residenciaId
    ? visitors.filter(v => v.residenciaId === currentUser.residenciaId)
    : visitors;

  const filteredVisitors = rawVisitors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.documentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const daysLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div id="admin-crud-directory-container" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search header element */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="search-visitor-input"
            type="text"
            placeholder="Buscar por nombre, cédula o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:border-slate-700 focus:outline-hidden"
          />
        </div>

        <button
          id="btn-register-new-visitor"
          onClick={handleOpenCreateForm}
          className="inline-flex items-center gap-2 justify-center px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl transition shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Registrar Autorizado
        </button>
      </div>

      {/* Directory database representation */}
      <div id="visitors-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredVisitors.map((user) => (
          <div 
            key={user.id} 
            id={`visitor-card-${user.id}`}
            className="bg-[#2A2A2E] rounded-2xl border border-[#3e3e42] p-5 shadow-2xl relative flex flex-col justify-between hover:border-slate-650 transition-all animate-fade-in-up"
          >
            <div>
              {/* Badge row */}
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                  user.status === UserStatus.ACTIVE 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : user.status === UserStatus.SUSPENDED
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {user.status === UserStatus.ACTIVE ? '✓ Activo' : user.status === UserStatus.SUSPENDED ? '⚠ Suspendido' : '✗ Expirado'}
                </span>

                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                  user.oneTime 
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                    : 'bg-red-500/15 text-red-400 border-red-500/25'
                }`}>
                  {user.oneTime ? 'Pase Único' : 'Frecuente'}
                </span>
              </div>

              {/* Identity Row */}
              <h3 className="font-bold text-slate-100 text-sm tracking-tight">{user.name}</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">C.I. / R.U.T. : <span className="font-semibold text-red-400">{user.documentId}</span></p>

              {/* Parameters Summary */}
              <div className="mt-4 border-t border-slate-800 pt-3 space-y-2 text-[11px] text-slate-450">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                  <span className="truncate">
                    Vence: {new Date(user.validUntil).toLocaleDateString()} al cierre
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                  <span>
                    Rango horario: {user.startTime || 'Todo el día'} - {user.endTime || 'Todo el día'}
                  </span>
                </div>

                {user.oneTime && (
                  <div className="flex items-center gap-1.5 text-purple-400 font-semibold bg-purple-500/10 border border-purple-500/15 px-2 py-1 rounded-lg">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {user.used ? '✗ PASE YA CANJEADO' : '✓ PASE LISTO PARA USO'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer row */}
            <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                id={`btn-show-qr-${user.id}`}
                onClick={() => setSelectedQRUser(user)}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-650/20 px-2.5 py-1.5 rounded-lg transition"
              >
                <QrCode className="w-3.5 h-3.5" /> Mostrar QR
              </button>

              <div className="flex items-center gap-1">
                <button
                  id={`btn-edit-visitor-${user.id}`}
                  onClick={() => handleOpenEditForm(user)}
                  className="p-1.5 text-slate-400 hover:text-slate-105 hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-800 transition"
                  title="Editar Visitante"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  id={`btn-delete-visitor-${user.id}`}
                  onClick={() => handleDeleteVisitor(user.id, user.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition"
                  title="Eliminar Acceso"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredVisitors.length === 0 && (
          <div id="no-visitors-registered-panel" className="col-span-full text-center py-12 bg-slate-950 rounded-2xl border border-dashed border-slate-800">
            <User className="w-8 h-8 text-slate-650 mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-slate-300">No hay personas registradas</h3>
            <p className="text-[11px] text-slate-550 max-w-xs mx-auto mt-1">
              Prueba registrando un nuevo pase de visitante con código QR para comenzar las demostraciones de validación.
            </p>
          </div>
        )}
      </div>

      {/* FORM MODAL PANEL (SLIDE / DIALOG OVERLAY) */}
      {isFormOpen && createPortal(
        <div id="overlay-visitor-crud" className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div id="visitor-form-modal-body" className="bg-[#2A2A2E] rounded-2xl border border-[#3e3e42] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-[#3e3e42] flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" /> {editingId ? 'Modificar Pase de Acceso' : 'Emitir Credenciales QR'}
              </h3>
              <button 
                id="btn-close-visitor-form"
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVisitor} className="p-5 space-y-4 text-xs">
              {/* Profile details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre Completo *</label>
                  <input
                    id="input-visitor-name"
                    type="text"
                    required
                    placeholder="Ej. Juan de Dios Pérez"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-805 text-slate-100 rounded-xl focus:border-red-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Documento de Identidad (DNI/Passport) *</label>
                  <input
                    id="input-visitor-doc"
                    type="text"
                    required
                    placeholder="Ej. 12.345.678-K"
                    value={formDocumentId}
                    onChange={(e) => setFormDocumentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-805 text-slate-100 rounded-xl focus:border-red-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                  <input
                    id="input-visitor-email"
                    type="email"
                    placeholder="visitante@ejemplo.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-805 text-slate-100 rounded-xl focus:border-red-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Teléfono Celular</label>
                  <input
                    id="input-visitor-phone"
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-805 text-slate-100 rounded-xl focus:border-red-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Status and Single Use */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipo de Permiso</label>
                  <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                    <button
                      id="form-set-frequent"
                      type="button"
                      onClick={() => setFormOneTime(false)}
                      className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-all ${
                        !formOneTime 
                          ? 'bg-slate-800 text-white shadow-xs' 
                          : 'text-slate-400 hover:text-slate-150'
                      }`}
                    >
                      Multientrada
                    </button>
                    <button
                      id="form-set-onetime"
                      type="button"
                      onClick={() => setFormOneTime(true)}
                      className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-all ${
                        formOneTime 
                          ? 'bg-slate-800 text-white shadow-xs' 
                          : 'text-slate-400 hover:text-slate-150'
                      }`}
                    >
                      Un Solo Uso
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estado Administrativo</label>
                  <select
                    id="select-form-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as UserStatus)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-202 rounded-xl focus:border-red-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value={UserStatus.ACTIVE}>✓ Activo / Autorizado</option>
                    <option value={UserStatus.SUSPENDED}>⚠ Suspendido</option>
                    <option value={UserStatus.EXPIRED}>✗ Expirado / Caducado</option>
                  </select>
                </div>
              </div>

              {/* Residence Row Selection */}
              <div className="border-t border-slate-800 pt-3">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fraccionamiento / Residencia Asignada</label>
                <select
                  disabled={!!currentUser?.residenciaId}
                  id="select-form-residencia"
                  value={formResidenciaId}
                  onChange={(e) => setFormResidenciaId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-202 rounded-xl focus:border-red-500 focus:outline-hidden cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">-- Sin Residencia (Acceso Global) --</option>
                  {residencias.map(r => (
                    <option key={r.id} value={r.id}>
                      🏡 {r.nombre} (ID: {r.id})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 font-serif italic mt-1">
                  El pase se limitará a la validación de accesos en este desarrollo habitacional.
                </p>
              </div>

              {/* Schedule and Temporal Dates Range */}
              <div className="border-t border-slate-800 pt-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Válido Desde o Inicio</label>
                    <input
                      id="input-visitor-avail-start"
                      type="datetime-local"
                      value={formValidFrom}
                      onChange={(e) => setFormValidFrom(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:border-red-500 focus:outline-[#1e293b]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Expira o Caduca El</label>
                    <input
                      id="input-visitor-avail-end"
                      type="datetime-local"
                      value={formValidUntil}
                      onChange={(e) => setFormValidUntil(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:border-red-500 focus:outline-[#1e293b]"
                    />
                  </div>
                </div>

                {/* Day Selectors */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Días Autorizados de Entrada (Opcional - Vacío = Todos)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {daysLabels.map((label, idx) => (
                      <button
                        key={idx}
                        id={`btn-day-toggle-${idx}`}
                        type="button"
                        onClick={() => handleDayToggle(idx)}
                        className={`px-3 py-1.5 border rounded-lg font-semibold transition ${
                          formDays.includes(idx)
                            ? 'bg-red-600 text-white border-red-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daily Hour constraints */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hora Inicio Acceso</label>
                    <input
                      id="input-form-avail-startinghour"
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:border-red-500 focus:outline-[#1e293b]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hora Límite Acceso</label>
                    <input
                      id="input-form-avail-endinghour"
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:border-red-500 focus:outline-[#1e293b]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit triggers banner */}
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-300 flex gap-2">
                <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-semibold">
                  Al confirmar, encriptamos y generamos la clave única para embeber en el pase QR. Las restricciones son asimiladas al instante por el módulo de acceso.
                </p>
              </div>

              {/* Buttons rows */}
              <div className="flex gap-2 pt-4 border-t border-[#3e3e42] justify-end">
                <button
                  id="btn-cancel-form-process"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-[#1A1A1E] hover:bg-zinc-800 text-slate-200 border border-[#3e3e42] font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-form-save"
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition cursor-pointer"
                >
                  Guardar Permiso
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* QR MODAL PREVIEW OVERLAY */}
      {selectedQRUser && createPortal(
        <div id="overlay-qr-display" className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div id="qr-display-body" className="bg-[#2A2A2E] rounded-2xl border border-[#3e3e42] shadow-2xl max-w-sm w-full p-6 text-center text-xs text-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-[#3e3e42] mb-6">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider">Premises Entry Pass (QR)</h3>
              <button 
                id="btn-close-qr-preview"
                onClick={() => setSelectedQRUser(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 inline-block mb-4 shadow-inner">
              {generatedQRUrl ? (
                <img 
                  id="qrcode-rendered-image"
                  src={generatedQRUrl} 
                  alt="QR Access Token" 
                  className="w-60 h-60 mx-auto rounded-lg"
                />
              ) : (
                <div className="w-60 h-60 bg-slate-900 animate-pulse rounded-lg flex items-center justify-center text-slate-400 font-mono">
                  Generando QR...
                </div>
              )}
            </div>

            <h4 className="text-base font-bold text-slate-100 tracking-tight">{selectedQRUser.name}</h4>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">Identificación: <span className="text-slate-300 font-bold">{selectedQRUser.documentId}</span></p>

            {/* Quick Test Copy Section */}
            <div id="quick-copy-token-sandbox" className="mt-4 bg-[#1A1A1E] border border-[#3e3e42] p-2 rounded-xl text-left">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                <span>Token del Pase (Para Test)</span>
                <span className="text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 rounded-xs font-bold font-mono">Test Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-[10px] font-mono text-slate-350 flex-1 truncate block py-1 bg-black border border-[#3e3e42] rounded px-1.5">
                  {selectedQRUser.qrcodeToken.slice(0, 15)}...
                </code>
                <button
                  id="btn-copy-test-token"
                  onClick={() => handleCopyToken(selectedQRUser.qrcodeToken)}
                  className="p-1.5 bg-slate-900 border border-slate-800 text-slate-405 hover:text-white rounded-lg transition"
                  title="Copiar token para prueba manual"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-450" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <p className="text-[10.5px] leading-relaxed text-slate-400 mt-4 px-2">
              Haz que el visitante muestre este código o descarga la credencial física para acceso directo. El pase restringe automáticamente según los parámetros fijados.
            </p>

            <div className="grid grid-cols-2 gap-2 mt-6">
              <a
                id="link-download-qr-image"
                href={generatedQRUrl}
                download={`pase_qr_${selectedQRUser.name.replace(/\s+/g, '_').toLowerCase()}.png`}
                className="inline-flex items-center gap-1.5 justify-center px-4 py-2 border border-[#3e3e42] hover:bg-slate-900/60 text-slate-300 font-semibold rounded-xl text-xs transition text-center"
              >
                <Download className="w-3.5 h-3.5" /> Descargar
              </a>
              <button
                id="btn-share-pass-placeholder"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/?pass=${selectedQRUser.qrcodeToken}`);
                  alert('¡Enlace de pase público copiado al portapapeles! Ábrelo en tu teléfono móvil para realizar la prueba de cámara o en una pestaña nueva para simular.');
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Compartir Pase
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CUSTOM CONFIRMATION DIALOG */}
      {deleteConfirmId && createPortal(
        <div id="delete-confirmation-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#2A2A2E] rounded-2xl border border-[#3e3e42] shadow-2xl max-w-sm w-full p-6 text-center text-xs text-slate-200">
            <div className="w-12 h-12 bg-red-550/15 text-red-500 border border-red-500/25 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm mb-3 uppercase tracking-wider">Confirmar Eliminación</h3>
            <p className="text-slate-300 leading-relaxed mb-6">
              ¿Está seguro de que desea eliminar permanentemente los accesos autorizados para <strong className="text-red-400">"{deleteConfirmName}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmName('');
                }}
                className="px-4 py-2.5 bg-[#1A1A1E] hover:bg-zinc-800 text-slate-200 border border-[#3e3e42] font-semibold rounded-xl transition cursor-pointer"
              >
                No, cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 bg-red-650 hover:bg-red-555 text-white font-semibold rounded-xl transition cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
