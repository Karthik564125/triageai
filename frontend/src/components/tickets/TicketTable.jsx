import React from 'react';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { AIBadge } from '../ui/AIBadge';
import { Eye, Settings2, UserCheck, Inbox } from 'lucide-react';

export const TicketTable = ({ tickets, onSelectTicket, isAdmin = false }) => {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No Tickets Found</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          No support tickets match your current filters or search query. Try clearing your search parameters.
        </p>
      </div>
    );
  }

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Ticket ID</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Priority</th>
              {isAdmin && <th className="py-3 px-4">AI Rec. Team</th>}
              <th className="py-3 px-4">Assigned Team</th>
              {isAdmin && <th className="py-3 px-4">Assigned User</th>}
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Updated</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {tickets.map((t) => (
              <tr
                key={t.id}
                onClick={() => onSelectTicket(t)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                {/* ID */}
                <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600 group-hover:text-blue-700 whitespace-nowrap">
                  {t.ticketId || t.id}
                </td>

                {/* Subject */}
                <td className="py-3.5 px-4 max-w-xs">
                  <div className="font-semibold text-slate-900 truncate" title={t.subject}>
                    {t.subject}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">{t.product}</div>
                </td>

                {/* Customer */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="font-medium text-slate-800 text-xs">{t.customerName}</div>
                  <div className="text-[11px] text-slate-400">{t.customerEmail}</div>
                </td>

                {/* Category */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-block px-2.5 py-1 text-xs rounded-md bg-slate-100 text-slate-700 font-medium">
                    {t.category || 'General'}
                  </span>
                </td>

                {/* Priority */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <PriorityBadge priority={t.priority} />
                </td>

                {/* AI Rec Team (Admin only) */}
                {isAdmin && (
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {t.aiSuggestions?.recommendedTeam ? (
                      <div className="flex items-center gap-1">
                        <AIBadge label={t.aiSuggestions.recommendedTeam} size="xs" />
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Unanalyzed</span>
                    )}
                  </td>
                )}

                {/* Assigned Team */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {t.assignedTeam ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                      <UserCheck className="w-3 h-3 text-slate-500" />
                      {t.assignedTeam}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                      Unassigned
                    </span>
                  )}
                </td>

                {/* Assigned User (Admin only) */}
                {isAdmin && (
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                    {t.assignedMember || t.assignedUser || <span className="text-slate-400">—</span>}
                  </td>
                )}

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StatusBadge status={t.status} />
                </td>

                {/* Updated Date */}
                <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                  {formatDate(t.updatedAt || t.createdAt)}
                </td>

                {/* Action */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTicket(t);
                    }}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isAdmin
                        ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                    }`}
                  >
                    {isAdmin ? (
                      <>
                        <Settings2 className="w-3.5 h-3.5" /> Manage Triage
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> View
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
