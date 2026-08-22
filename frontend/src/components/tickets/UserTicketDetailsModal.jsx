import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, RefreshCw, Paperclip, CheckCircle2, User, Mail, Package, Clock, Loader2, RotateCcw } from 'lucide-react';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { AIBadge } from '../ui/AIBadge';
import { useTickets } from '../../context/TicketContext';

export const UserTicketDetailsModal = ({ ticket, isOpen, onClose }) => {
  const { retryAIAnalysis, updateTicketStatus, analyzingTicketId } = useTickets();
  const [confirmationAction, setConfirmationAction] = useState(null);

  if (!isOpen || !ticket) return null;

  const isAnalyzing = analyzingTicketId === ticket.id;

  const handleCustomerConfirmation = async (status, action) => {
    setConfirmationAction(action);
    await updateTicketStatus(ticket.id, status, ticket.customerName || 'Customer', {
      actorType: 'customer',
      action
    });
    setConfirmationAction(null);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold bg-indigo-950 text-indigo-300 px-2.5 py-1 rounded border border-indigo-700/50">
              {ticket.ticketId || ticket.id}
            </span>
            <div>
              <h2 className="text-base font-bold text-white truncate max-w-md">{ticket.subject}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>Created {formatDate(ticket.createdAt)}</span>
                <span>•</span>
                <StatusBadge status={ticket.status} size="xs" />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {ticket.status === 'Waiting for Customer' && (
          <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 space-y-3">
            <p className="text-sm font-semibold text-amber-900">
              The support team has requested your confirmation. Is your issue resolved?
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleCustomerConfirmation('Resolved', 'resolved')}
                disabled={Boolean(confirmationAction)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
              >
                {confirmationAction === 'resolved' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Yes, Issue Resolved
              </button>
              <button
                type="button"
                onClick={() => handleCustomerConfirmation('In Progress', 'needs_help')}
                disabled={Boolean(confirmationAction)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
              >
                {confirmationAction === 'needs_help' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                No, Still Need Help
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* SECTION 1: Original Ticket Payload (Preserved & Immutable) */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" /> Original Customer Ticket Details
              </h3>
              <span className="text-[11px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                Immutable Record
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Customer Name</span>
                <span className="font-semibold text-slate-800 text-sm">{ticket.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Customer Email</span>
                <span className="font-semibold text-slate-800 text-sm">{ticket.customerEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Product / Module</span>
                <span className="font-semibold text-slate-800 text-sm flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-slate-400" /> {ticket.product}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Attachment</span>
                {ticket.attachment ? (
                  <a
                    href={ticket.attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-blue-600 hover:underline flex items-center gap-1 truncate max-w-xs"
                  >
                    <Paperclip className="w-3.5 h-3.5" /> {ticket.attachment}
                  </a>
                ) : (
                  <span className="text-slate-400 italic">None attached</span>
                )}
              </div>
            </div>

            {/* Description Box */}
            <div className="pt-2">
              <span className="text-slate-400 block font-medium text-xs mb-1.5">Full Issue Description</span>
              <div className="p-3.5 bg-white rounded-lg border border-slate-200 text-slate-800 text-sm whitespace-pre-wrap leading-relaxed shadow-2xs font-sans">
                {ticket.description}
              </div>
            </div>
          </div>

          {/* SECTION 2: AI Suggestions Section */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white rounded-xl p-5 border border-indigo-200/80 shadow-xs space-y-4">
            {/* AI Banner Header */}
            <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 fill-indigo-200" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                    AI Triage Analysis
                    <AIBadge label="AI Suggested" size="xs" />
                  </h3>
                  <p className="text-[11px] text-indigo-700 font-medium">
                    Automated recommendations generated for support triage.
                  </p>
                </div>
              </div>

              {ticket.aiAnalysisStatus === 'failed' && (
                <button
                  onClick={() => retryAIAnalysis(ticket.id)}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  Retry AI Analysis
                </button>
              )}
            </div>

            {/* AI State Handling */}
            {isAnalyzing ? (
              <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-lg text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                <p className="text-xs text-indigo-800 font-medium">Gemini AI is analyzing your ticket...</p>
                <p className="text-[11px] text-indigo-600">This may take a few seconds.</p>
              </div>
            ) : ticket.aiAnalysisStatus === 'processing' ? (
              <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-lg text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                <p className="text-xs text-indigo-800 font-medium">AI Triage is processing...</p>
              </div>
            ) : ticket.aiAnalysisStatus === 'failed' ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-900">AI Analysis Failed</h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    The ticket was saved successfully. You can retry the AI analysis anytime using the button above.
                  </p>
                  {ticket.ai?.error && (
                    <p className="text-[11px] text-red-500 mt-1 font-mono">Error: {ticket.ai.error}</p>
                  )}
                </div>
              </div>
            ) : !ticket.aiSuggestions ? (
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg text-center py-6">
                <p className="text-xs text-indigo-800 font-medium">No AI suggestions available for this ticket.</p>
                <button
                  onClick={() => retryAIAnalysis(ticket.id)}
                  disabled={isAnalyzing}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Run AI Analysis
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Summary */}
                <div>
                  <span className="text-indigo-900 font-bold block mb-1 flex items-center gap-1">
                    AI Summary <AIBadge label="AI Suggested" size="xs" />
                  </span>
                  <p className="p-2.5 bg-white/90 rounded-lg border border-indigo-100 text-slate-800 font-medium leading-relaxed">
                    {ticket.aiSuggestions.summary}
                  </p>
                </div>

                {/* Priority & Category & Team Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white/90 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 font-medium block text-[11px] mb-1">
                      AI Suggested Priority
                    </span>
                    <PriorityBadge priority={ticket.aiSuggestions.priority} />
                  </div>

                  <div className="p-3 bg-white/90 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 font-medium block text-[11px] mb-1">
                      AI Suggested Category
                    </span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {ticket.aiSuggestions.category}
                    </span>
                  </div>

                  <div className="p-3 bg-white/90 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 font-medium block text-[11px] mb-1">
                      AI Recommended Team
                    </span>
                    <span className="font-bold text-indigo-700 text-xs">
                      {ticket.aiSuggestions.recommendedTeam}
                    </span>
                  </div>
                </div>

                {/* Priority Reason */}
                <div>
                  <span className="text-indigo-900 font-bold block mb-1">AI Priority Reason</span>
                  <p className="p-2.5 bg-white/90 rounded-lg border border-indigo-100 text-slate-700 italic">
                    "{ticket.aiSuggestions.priorityReason}"
                  </p>
                </div>

                {/* Suggested Response */}
                <div>
                  <span className="text-indigo-900 font-bold block mb-1 flex items-center gap-1">
                    Suggested Response <AIBadge label="AI Suggested Draft" size="xs" />
                  </span>
                  <div className="p-3 bg-white/90 rounded-lg border border-indigo-100 text-slate-800 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                    {ticket.aiSuggestions.suggestedResponse}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Current Status: <strong className="text-slate-800">{ticket.status}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
