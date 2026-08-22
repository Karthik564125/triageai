import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  UserCheck, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Send, 
  ShieldAlert, 
  MessageSquare, 
  Activity, 
  Building2, 
  Tag, 
  AlertCircle,
  FileText,
  Lock,
  Loader2
} from 'lucide-react';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { AIBadge } from '../ui/AIBadge';
import { TEAMS, CATEGORIES } from '../../data/mockData';
import { normalizeCategory } from '../../utils/categoryNormalizer';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';

export const AdminTicketDetailsModal = ({ ticket, isOpen, onClose }) => {
  const { 
    retryAIAnalysis, 
    acceptAISuggestions, 
    rejectAISuggestions, 
    assignTicket, 
    updateTicketStatus, 
    addInternalComment,
    analyzingTicketId,
    teamsData
  } = useTickets();
  const { currentUser } = useAuth();

  const availableTeams = teamsData?.teams?.length > 0 ? teamsData.teams : TEAMS;

  // Local state for editable AI triage fields before admin confirms
  const [editableAI, setEditableAI] = useState({
    summary: '',
    category: '',
    priority: '',
    recommendedTeam: '',
    suggestedResponse: ''
  });

  // Local state for Assignment
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);

  // Local state for Status
  const [selectedStatus, setSelectedStatus] = useState('');

  // Local state for Comment Input
  const [commentInput, setCommentInput] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);

  useEffect(() => {
    if (ticket) {
      if (ticket.aiSuggestions) {
        setEditableAI({
          summary: ticket.aiSuggestions.summary || '',
          category: normalizeCategory(ticket.aiSuggestions.category || ticket.category),
          priority: ticket.aiSuggestions.priority || ticket.priority || 'Medium',
          recommendedTeam: ticket.aiSuggestions.recommendedTeam || availableTeams[0],
          suggestedResponse: ticket.aiSuggestions.suggestedResponse || ''
        });
      }
      setSelectedTeam(ticket.assignedTeam || ticket.aiSuggestions?.recommendedTeam || availableTeams[0]);
      setSelectedUser(ticket.assignedMember || ticket.assignedUser || '');
      setSelectedStatus(ticket.status || 'Open');
    }
  }, [ticket, availableTeams]);

  if (!isOpen || !ticket) return null;

  const isAnalyzing = analyzingTicketId === ticket.id;

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle Team Change in dropdown to reset User options
  const handleTeamChange = (teamName) => {
    setSelectedTeam(teamName);
    const members = teamsData?.members?.[teamName] || [];
    setSelectedUser(members.length > 0 ? members[0].name : '');
  };

  const runAction = async (action, callback) => {
    if (loadingAction) return;
    setLoadingAction(action);
    try {
      await callback();
    } finally {
      setLoadingAction(null);
    }
  };

  // Admin Actions
  const handleAcceptAI = () => runAction('accept-ai', () => (
    acceptAISuggestions(ticket.id, editableAI, currentUser?.name)
  ));

  const handleRejectAI = () => runAction('reject-ai', () => (
    rejectAISuggestions(ticket.id, currentUser?.name)
  ));

  const handleAssign = () => runAction('assign', async () => {
    const updatedTicket = await assignTicket(ticket.id, selectedTeam, selectedUser, currentUser?.name);
    if (updatedTicket) setIsEditingAssignment(false);
  });

  const handleUpdateStatus = (status = selectedStatus) => runAction('status', () => (
    updateTicketStatus(ticket.id, status, currentUser?.name)
  ));

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    await runAction('comment', async () => {
      const updatedTicket = await addInternalComment(ticket.id, commentInput, currentUser?.name, currentUser?.avatar);
      if (updatedTicket) setCommentInput('');
    });
  };

  const currentTeamMembers = teamsData?.members?.[selectedTeam] || [];
  const hasAcceptedAISuggestions = ticket.aiAnalysisStatus === 'accepted'
    || ticket.timeline?.some((event) => event.type === 'ai_accepted');
  const hasRejectedAISuggestions = ticket.aiAnalysisStatus === 'rejected'
    || ticket.timeline?.some((event) => event.type === 'ai_rejected');
  const hasPendingAISuggestions = Boolean(ticket.aiSuggestions) && !hasAcceptedAISuggestions && !hasRejectedAISuggestions;
  const isAssigned = Boolean(ticket.assignedTeam);
  const nextStatus = {
    Open: 'In Progress',
    Assigned: 'In Progress',
    'In Progress': 'Waiting for Customer',
    'Waiting for Customer': 'Resolved',
    Resolved: 'Closed'
  }[ticket.status];
  const statusActionLabel = {
    Open: 'Start Progress',
    Assigned: 'Start Progress',
    'In Progress': 'Waiting for Customer',
    'Waiting for Customer': 'Mark as Resolved',
    Resolved: 'Close Ticket',
    Closed: '✓ Closed'
  }[ticket.status] || 'Change Status';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold bg-indigo-950 text-indigo-300 px-3 py-1 rounded border border-indigo-700/50">
              {ticket.ticketId || ticket.id}
            </span>
            <div>
              <h2 className="text-base font-bold text-white truncate max-w-xl">{ticket.subject}</h2>
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5">
                <span>Customer: <strong className="text-white">{ticket.customerName}</strong></span>
                <span>•</span>
                <StatusBadge status={ticket.status} size="xs" />
                <span>•</span>
                <PriorityBadge priority={ticket.priority} size="xs" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs bg-indigo-950 text-indigo-300 px-3 py-1 rounded-full border border-indigo-700 font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" /> Admin Triage Mode
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Authority Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-2 border-b border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>
              <strong>AI Triage System:</strong> Suggestions are recommendations only. You hold final authority over category, priority, and team assignments.
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 font-mono">
              AI = Suggestion
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50 font-mono">
              Admin = Final Authority
            </span>
          </div>
        </div>

        {/* Main Two-Column View */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* ================= LEFT COLUMN: Customer Ticket + Activity Timeline ================= */}
          <div className="lg:col-span-6 p-6 space-y-6 bg-slate-50/50">
            
            {/* Customer Ticket Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" /> Customer Ticket Payload
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  <Lock className="w-3 h-3" /> Immutable
                </span>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Customer Name</span>
                  <span className="font-semibold text-slate-800">{ticket.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Customer Email</span>
                  <span className="font-semibold text-slate-800 truncate block">{ticket.customerEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Product / Module</span>
                  <span className="font-semibold text-slate-800">{ticket.product}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Attachment</span>
                  {ticket.attachment ? (
                    <a href={ticket.attachment} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline truncate block">
                      {ticket.attachment}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">None</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Created Date</span>
                  <span className="text-slate-700 font-mono text-[11px]">{formatDate(ticket.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Last Updated</span>
                  <span className="text-slate-700 font-mono text-[11px]">{formatDate(ticket.updatedAt)}</span>
                </div>
              </div>

              {/* Prominent Original Description */}
              <div>
                <span className="text-slate-500 block font-bold text-xs mb-1.5">Original Issue Description</span>
                <div className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs leading-relaxed font-sans font-normal border border-slate-800 shadow-inner whitespace-pre-wrap">
                  {ticket.description}
                </div>
              </div>
            </div>

            {/* Activity Timeline Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-500" /> Chronological Activity Timeline
                </h3>
                <span className="text-xs text-slate-400 font-mono">{ticket.timeline?.length || 0} events</span>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {ticket.timeline && ticket.timeline.length > 0 ? (
                  [...ticket.timeline]
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                    .map((event, idx) => (
                    <div key={event.id || idx} className="relative flex items-start gap-3 text-xs">
                      {/* Icon Bullet */}
                      <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-indigo-500 text-indigo-600 flex items-center justify-center text-[10px] shadow-2xs font-bold">
                        •
                      </span>
                      <div className="flex-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{event.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{formatDate(event.timestamp)}</span>
                        </div>
                        <p className="text-slate-600 mt-1">{event.description}</p>
                        <div className="text-[10px] text-slate-400 mt-1 italic">By: {event.user}</div>
                      </div>
                    </div>
                    ))
                ) : (
                  <p className="text-slate-400 italic text-xs">No activity recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: AI Triage + Assignment + Status + Comments ================= */}
          <div className="lg:col-span-6 p-6 space-y-6 bg-white">
            
            {/* 1. AI TRIAGE CARD */}
            <div className="bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white rounded-xl p-5 border border-indigo-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4 fill-indigo-200" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                      AI Triage Review
                      <AIBadge label="AI Suggested" size="xs" />
                    </h3>
                    <p className="text-[11px] text-indigo-700 font-medium">Edit fields below before approving AI suggestions.</p>
                  </div>
                </div>

                <button
                  onClick={() => retryAIAnalysis(ticket.id)}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  Retry AI
                </button>
              </div>

              {isAnalyzing ? (
                <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-lg text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                  <p className="text-xs text-indigo-800 font-medium">Gemini AI is analyzing this ticket...</p>
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
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-red-900">AI Analysis Failed</h4>
                    <p className="text-xs text-red-700 mt-0.5">
                      The ticket was saved successfully. You can retry the analysis or manually perform triage below.
                    </p>
                    {ticket.ai?.error && (
                      <p className="text-[11px] text-red-500 mt-1 font-mono">Error: {ticket.ai.error}</p>
                    )}
                  </div>
                </div>
              ) : !ticket.aiSuggestions && !ticket.ai?.summary ? (
                <p className="text-xs text-slate-500 italic">No AI triage suggestions yet. Click <strong>Retry AI</strong> to analyze this ticket.</p>
              ) : (
                <div className="space-y-3.5 text-xs">
                  {/* AI Summary (Editable) */}
                  <div>
                    <label className="block font-bold text-indigo-900 mb-1 flex items-center justify-between">
                      <span>AI Suggested Summary</span>
                      <AIBadge label="AI Suggested" size="xs" />
                    </label>
                    <input
                      type="text"
                      value={editableAI.summary}
                      onChange={(e) => setEditableAI({ ...editableAI, summary: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                    />
                  </div>

                  {/* AI Category & Priority & Team Row (Editable) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-indigo-900 mb-1">Category</label>
                      <select
                        value={editableAI.category}
                        onChange={(e) => setEditableAI({ ...editableAI, category: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-indigo-900 mb-1">Priority</label>
                      <select
                        value={editableAI.priority}
                        onChange={(e) => setEditableAI({ ...editableAI, priority: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-indigo-900 mb-1">Recommended Team</label>
                      <select
                        value={editableAI.recommendedTeam}
                        onChange={(e) => setEditableAI({ ...editableAI, recommendedTeam: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-indigo-700 font-bold focus:ring-2 focus:ring-indigo-500"
                      >
                        {availableTeams.map((tm) => (
                          <option key={tm} value={tm}>
                            {tm}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* AI decision state is read from the refreshed ticket. */}
                  {hasPendingAISuggestions ? (
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        onClick={handleAcceptAI}
                        disabled={Boolean(loadingAction)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loadingAction === 'accept-ai' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {loadingAction === 'accept-ai' ? 'Accepting...' : 'Accept Suggestions'}
                      </button>
                      <button
                        onClick={handleRejectAI}
                        disabled={Boolean(loadingAction)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loadingAction === 'reject-ai' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 text-slate-500" />}
                        {loadingAction === 'reject-ai' ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  ) : hasAcceptedAISuggestions ? (
                    <div className="pt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Suggestions Accepted
                    </div>
                  ) : (
                    <div className="pt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold">
                      <XCircle className="w-4 h-4" /> Suggestions Rejected
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. ASSIGNMENT SECTION CARD */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" /> Team &amp; User Assignment
                </h3>
                <span className="text-[11px] text-slate-400">Admin Confirmation Required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Team Dropdown */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Team</label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => handleTeamChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {availableTeams.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assign User Dropdown */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign Team Member</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Unassigned (Team Pool)</option>
                    {currentTeamMembers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignment state is read from the refreshed ticket. */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">
                  {isAssigned ? (
                    <span>Assigned to <strong className="text-blue-700">{ticket.assignedTeam}</strong>{ticket.assignedMember || ticket.assignedUser ? ` (${ticket.assignedMember || ticket.assignedUser})` : ' (Team Pool)'}</span>
                  ) : (
                    <span>AI Recommended Team: <strong className="text-indigo-700">{ticket.aiSuggestions?.recommendedTeam || ticket.ai?.recommendedTeam || 'None'}</strong></span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAssign}
                    disabled={Boolean(loadingAction) || (isAssigned && !isEditingAssignment)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loadingAction === 'assign' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    {loadingAction === 'assign' ? 'Assigning...' : isAssigned && !isEditingAssignment ? '✓ Assigned' : isEditingAssignment ? 'Reassign Ticket' : 'Assign Ticket'}
                  </button>
                  {isAssigned && (
                    <button
                      onClick={() => { setIsEditingAssignment(true); setSelectedTeam(ticket.assignedTeam || ''); setSelectedUser(ticket.assignedMember || ticket.assignedUser || ''); }}
                      disabled={Boolean(loadingAction)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-lg transition-colors disabled:opacity-60"
                    >
                      Change Assignment
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 3. STATUS MANAGEMENT CARD */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-emerald-600" /> Ticket Status Lifecycle
                </h3>
                <StatusBadge status={ticket.status} size="xs" />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Open">Open</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting for Customer">Waiting for Customer</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(nextStatus)}
                    disabled={Boolean(loadingAction) || !nextStatus}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loadingAction === 'status' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {loadingAction === 'status' ? 'Updating...' : statusActionLabel}
                  </button>
                  {ticket.status === 'Resolved' && (
                    <button
                      onClick={() => handleUpdateStatus('Closed')}
                      disabled={Boolean(loadingAction)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-lg transition-colors disabled:opacity-60"
                    >
                      Close Ticket
                    </button>
                  )}
                  {ticket.status !== 'Closed' && selectedStatus !== ticket.status && (
                    <button
                      onClick={() => handleUpdateStatus()}
                      disabled={Boolean(loadingAction)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs rounded-lg transition-colors disabled:opacity-60"
                    >
                      Change Status
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 4. INTERNAL COMMENTS SECTION */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-500" /> Internal Notes &amp; Comments
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  Internal Note (Not Customer Facing)
                </span>
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="space-y-2">
                <textarea
                  rows={2}
                  placeholder="Add an internal comment for team members (visible only to support staff)..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentInput.trim()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Add Comment
                  </button>
                </div>
              </form>

              {/* List of Comments */}
              <div className="space-y-3 pt-2 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {ticket.comments && ticket.comments.length > 0 ? (
                  ticket.comments.map((c) => (
                    <div key={c.id} className="pt-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">
                            {c.author ? c.author.charAt(0) : 'A'}
                          </div>
                          <span className="font-bold text-slate-800">{c.author}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Internal Note
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{formatDate(c.timestamp)}</span>
                      </div>
                      <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed font-sans">
                        {c.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-2">No internal comments added yet.</p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900 text-slate-300 text-xs flex items-center justify-between border-t border-slate-800">
          <span>Ticket ID: <strong className="text-white">{ticket.ticketId || ticket.id}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
          >
            Close Triage Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
