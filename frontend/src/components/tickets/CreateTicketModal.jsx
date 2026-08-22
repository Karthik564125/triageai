import React, { useState } from 'react';
import { X, Sparkles, Save, Loader2, AlertTriangle, Paperclip } from 'lucide-react';
import { PRODUCTS } from '../../data/mockData';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const CreateTicketModal = ({ isOpen, onClose, onCreatedAndSelect }) => {
  const { createTicket, analyzeTicket } = useTickets();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    customerName: currentUser?.name || 'Karthik',
    customerEmail: currentUser?.username ? `${currentUser.username}@demo.com` : 'karthik@demo.com',
    subject: '',
    description: '',
    product: PRODUCTS[0],
    attachment: ''
  });

  const [errors, setErrors] = useState({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!formData.customerEmail.trim()) newErrors.customerEmail = 'Customer email is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveOnly = async () => {
    if (!validate()) return;

    try {
      setIsSimulating(true);
      const ticket = await createTicket({
        ...formData,
        userId: currentUser?.id
      });
      setIsSimulating(false);
      onClose();
      if (onCreatedAndSelect && ticket) onCreatedAndSelect(ticket);
    } catch (err) {
      setIsSimulating(false);
    }
  };

  const handleSaveAndAnalyze = async () => {
    if (!validate()) return;

    setIsSimulating(true);
    setSimulationStep(1); // 1 = Saving ticket to Firestore

    try {
      // 1. Save original ticket to Firestore first
      const ticket = await createTicket({
        ...formData,
        userId: currentUser?.id
      });

      if (!ticket || !ticket.id) {
        setIsSimulating(false);
        setSimulationStep(0);
        return;
      }

      setSimulationStep(2); // 2 = Analyzing ticket with Gemini AI

      // 2. Trigger Gemini AI Analysis on backend
      let analyzedTicket = ticket;
      try {
        analyzedTicket = (await analyzeTicket(ticket.id)) || ticket;
      } catch (aiErr) {
        console.error('AI Analysis step error:', aiErr);
      }

      setSimulationStep(3); // 3 = Complete

      setTimeout(() => {
        setIsSimulating(false);
        setSimulationStep(0);
        onClose();
        if (onCreatedAndSelect && analyzedTicket) onCreatedAndSelect(analyzedTicket);
      }, 500);
    } catch (err) {
      setIsSimulating(false);
      setSimulationStep(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Create Support Ticket</h2>
              <p className="text-xs text-slate-300">Submit ticket details to Firestore database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSimulating}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner when submitting */}
        {isSimulating && (
          <div className="p-6 bg-indigo-50 border-b border-indigo-100 text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-indigo-950 text-sm">
                  {simulationStep === 1 && 'Saving ticket to Firestore database...'}
                  {simulationStep === 2 && 'Analyzing ticket with Gemini AI...'}
                  {simulationStep === 3 && 'Analysis completed! Opening ticket...'}
                </h4>
                <p className="text-xs text-indigo-700">
                  Storing original customer payload and initializing ticket lifecycle...
                </p>
              </div>
            </div>


            {/* Progress bar */}
            <div className="w-full bg-indigo-200 h-2 rounded-full overflow-hidden max-w-md mx-auto">
              <div
                className="bg-indigo-600 h-full transition-all duration-700 ease-out"
                style={{
                  width: simulationStep === 1 ? '50%' : simulationStep === 2 ? '85%' : '100%'
                }}
              />
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Customer Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Jane Doe"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.customerName ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                }`}
              />
              {errors.customerName && <p className="text-xs text-red-600 mt-1">{errors.customerName}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="jane@company.com"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.customerEmail ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                }`}
              />
              {errors.customerEmail && <p className="text-xs text-red-600 mt-1">{errors.customerEmail}</p>}
            </div>
          </div>

          {/* Subject & Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subject / Issue Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Brief summary of the issue..."
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.subject ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                }`}
              />
              {errors.subject && <p className="text-xs text-red-600 mt-1">{errors.subject}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Product / Module
              </label>
              <select
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Issue Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Provide detailed description of the error, steps to reproduce, or affected systems..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
              }`}
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          {/* Attachment Link */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5 text-slate-400" /> Attachment Link (Optional)
            </label>
            <input
              type="url"
              placeholder="https://logs.domain.com/dump.log"
              value={formData.attachment}
              onChange={(e) => setFormData({ ...formData, attachment: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSimulating}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveOnly}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors shadow-xs"
            >
              <Save className="w-4 h-4 text-slate-500" /> Save Ticket
            </button>

            <button
              type="button"
              onClick={handleSaveAndAnalyze}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md active:scale-98"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Save &amp; Analyze with AI
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
