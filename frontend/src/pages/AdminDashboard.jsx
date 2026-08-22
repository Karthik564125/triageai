import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { StatCard } from '../components/ui/StatCard';
import { TicketTable } from '../components/tickets/TicketTable';
import { AdminTicketDetailsModal } from '../components/tickets/AdminTicketDetailsModal';
import { useTickets } from '../context/TicketContext';
import { TEAMS, CATEGORIES } from '../data/mockData';
import { 
  Inbox, 
  UserCheck, 
  Clock, 
  AlertOctagon, 
  CheckCircle2, 
  Filter, 
  RefreshCcw, 
  Users,
  Loader2
} from 'lucide-react';

export const AdminDashboard = () => {
  const { tickets, loading, fetchTickets, fetchTeams, teamsData } = useTickets();

  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');

  // Selected Ticket for 2-column Admin Triage Drawer
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => (ticket.id && selectedTicketId && ticket.id === selectedTicketId) || (ticket.ticketId && selectedTicketId && ticket.ticketId === selectedTicketId)) || null,
    [tickets, selectedTicketId]
  );

  // Fetch real backend data on mount
  useEffect(() => {
    fetchTickets(true);
    fetchTeams();
  }, [fetchTickets, fetchTeams]);

  // Compute metrics dynamically from real tickets
  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'Open').length;
    const assigned = tickets.filter((t) => t.assignedTeam !== null).length;
    const inProgress = tickets.filter((t) => t.status === 'In Progress' || t.status === 'Waiting for Customer').length;
    const critical = tickets.filter((t) => t.priority === 'Critical').length;
    const resolved = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;

    return { open, assigned, inProgress, critical, resolved };
  }, [tickets]);

  // Unique assigned users for filter
  const assignedUsersList = useMemo(() => {
    const usersSet = new Set();
    tickets.forEach((t) => {
      const u = t.assignedMember || t.assignedUser;
      if (u) usersSet.add(u);
    });
    return Array.from(usersSet);
  }, [tickets]);

  // Dynamic Teams List from Firestore or Fallback
  const availableTeams = teamsData.teams.length > 0 ? teamsData.teams : TEAMS;

  // Filtered tickets logic based on Tab & Dropdowns & Search
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Sidebar Tab Filter
      if (activeTab === 'unassigned' && t.assignedTeam !== null) return false;
      if (activeTab === 'critical' && t.priority !== 'Critical') return false;
      if (activeTab === 'in-progress' && t.status !== 'In Progress' && t.status !== 'Waiting for Customer') return false;
      if (activeTab === 'resolved' && (t.status !== 'Resolved' && t.status !== 'Closed')) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ticketIdStr = (t.ticketId || t.id || '').toLowerCase();
        const matchId = ticketIdStr.includes(q);
        const matchSub = (t.subject || '').toLowerCase().includes(q);
        const matchCust = (t.customerName || '').toLowerCase().includes(q);
        const matchCat = (t.category || '').toLowerCase().includes(q);
        const matchTeam = (t.assignedTeam || '').toLowerCase().includes(q);
        const matchUser = ((t.assignedMember || t.assignedUser) || '').toLowerCase().includes(q);
        if (!matchId && !matchSub && !matchCust && !matchCat && !matchTeam && !matchUser) return false;
      }

      // Dropdowns
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (teamFilter !== 'ALL' && t.assignedTeam !== teamFilter) return false;
      if (userFilter !== 'ALL' && (t.assignedMember || t.assignedUser) !== userFilter) return false;

      return true;
    });
  }, [tickets, activeTab, searchQuery, statusFilter, priorityFilter, categoryFilter, teamFilter, userFilter]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
    setTeamFilter('ALL');
    setUserFilter('ALL');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          title={
            activeTab === 'unassigned'
              ? 'Unassigned Tickets Queue'
              : activeTab === 'critical'
              ? 'Critical Outage Tickets'
              : activeTab === 'teams'
              ? 'Support Teams Overview'
              : 'Admin Triage & Operations Console'
          }
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* TEAMS TAB VIEW */}
          {activeTab === 'teams' ? (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" /> Engineering &amp; Support Teams Taxonomy
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Firestore teams available for manual assignment and future AI recommendation routing.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
                  {availableTeams.length} Active Teams
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {availableTeams.map((teamName) => {
                  const count = tickets.filter((t) => t.assignedTeam === teamName).length;
                  const members = teamsData.members[teamName] || [];
                  return (
                    <div key={teamName} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{teamName}</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {count} tickets
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {members.length > 0 ? (
                          <span>Members: {members.map(m => m.name).join(', ')}</span>
                        ) : (
                          <span>No assigned members yet.</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* OVERVIEW CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                  title="Open Tickets"
                  value={stats.open}
                  icon={Inbox}
                  color="blue"
                  onClick={() => setStatusFilter('Open')}
                  isActive={statusFilter === 'Open'}
                />
                <StatCard
                  title="Assigned Tickets"
                  value={stats.assigned}
                  icon={UserCheck}
                  color="purple"
                  onClick={() => setActiveTab('all-tickets')}
                  isActive={activeTab === 'all-tickets'}
                />
                <StatCard
                  title="In Progress"
                  value={stats.inProgress}
                  icon={Clock}
                  color="amber"
                  onClick={() => setStatusFilter('In Progress')}
                  isActive={statusFilter === 'In Progress'}
                />
                <StatCard
                  title="Critical SLA"
                  value={stats.critical}
                  icon={AlertOctagon}
                  color="red"
                  onClick={() => setPriorityFilter('Critical')}
                  isActive={priorityFilter === 'Critical'}
                />
                <StatCard
                  title="Resolved"
                  value={stats.resolved}
                  icon={CheckCircle2}
                  color="emerald"
                  onClick={() => setStatusFilter('Resolved')}
                  isActive={statusFilter === 'Resolved'}
                />
              </div>

              {/* ADMIN FILTER BAR & DATA TABLE */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Filter className="w-4 h-4 text-indigo-600" />
                    <span>Admin Filters</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Status */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Open">Open</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Waiting for Customer">Waiting for Customer</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>

                    {/* Priority */}
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>

                    {/* Category */}
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">All Categories</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    {/* Assigned Team Filter */}
                    <select
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">All Teams</option>
                      {availableTeams.map((tm) => (
                        <option key={tm} value={tm}>
                          {tm}
                        </option>
                      ))}
                    </select>

                    {/* Assigned User Filter */}
                    <select
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">All Users</option>
                      {assignedUsersList.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>

                    {/* Reset Button */}
                    {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || teamFilter !== 'ALL' || userFilter !== 'ALL' || searchQuery !== '') && (
                      <button
                        onClick={resetFilters}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 bg-indigo-50 rounded-lg"
                      >
                        <RefreshCcw className="w-3 h-3" /> Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Loading Indicator */}
                {loading ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    <p className="text-sm font-medium">Loading tickets from Firestore...</p>
                  </div>
                ) : (
                  /* Admin Management Data Table */
                  <TicketTable
                    tickets={filteredTickets}
                    onSelectTicket={(t) => setSelectedTicketId(t.id || t.ticketId)}
                    isAdmin={true}
                  />
                )}
              </div>
            </>
          )}

        </main>
      </div>

      {/* 2-COLUMN ADMIN TRIAGE MODAL / DRAWER */}
      <AdminTicketDetailsModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicketId(null)}
      />
    </div>
  );
};
