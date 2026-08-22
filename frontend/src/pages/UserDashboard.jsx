import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { StatCard } from '../components/ui/StatCard';
import { TicketTable } from '../components/tickets/TicketTable';
import { CreateTicketModal } from '../components/tickets/CreateTicketModal';
import { UserTicketDetailsModal } from '../components/tickets/UserTicketDetailsModal';
import { useTickets } from '../context/TicketContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../data/mockData';
import { Ticket, Clock, CheckCircle2, AlertCircle, PlusCircle, Filter, RefreshCcw, Loader2 } from 'lucide-react';

export const UserDashboard = () => {
  const { tickets, loading, fetchTickets } = useTickets();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Table Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => (
      (ticket.id && selectedTicketId && ticket.id === selectedTicketId)
      || (ticket.ticketId && selectedTicketId && ticket.ticketId === selectedTicketId)
    )) || null,
    [tickets, selectedTicketId]
  );

  // Fetch tickets on mount / user change
  useEffect(() => {
    if (currentUser) {
      fetchTickets(false, currentUser.email, currentUser.id);
    }
  }, [currentUser, fetchTickets]);

  // Compute metrics dynamically from real Firestore tickets
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'Open' || t.status === 'Assigned').length;
    const inProgress = tickets.filter((t) => t.status === 'In Progress' || t.status === 'Waiting for Customer').length;
    const resolved = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;

    return { total, open, inProgress, resolved };
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ticketIdStr = (t.ticketId || t.id || '').toLowerCase();
        const matchId = ticketIdStr.includes(q);
        const matchSub = (t.subject || '').toLowerCase().includes(q);
        const matchCust = (t.customerName || '').toLowerCase().includes(q);
        const matchCat = (t.category || '').toLowerCase().includes(q);
        if (!matchId && !matchSub && !matchCust && !matchCat) return false;
      }

      // Dropdown filters
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

      return true;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateTicket={() => setIsCreateOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          title={activeTab === 'my-tickets' ? 'My Support Tickets' : activeTab === 'profile' ? 'User Profile' : 'Support Dashboard'}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenCreateTicket={() => setIsCreateOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* PROFILE TAB VIEW */}
          {activeTab === 'profile' ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-2xl mx-auto space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                  {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{currentUser?.name}</h2>
                  <p className="text-sm text-slate-500">{currentUser?.email}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                    {currentUser?.roleLabel || 'Support User'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 block font-medium">Role</span>
                  <span className="font-semibold text-slate-800">{currentUser?.roleLabel || 'Support User'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Status</span>
                  <span className="font-semibold text-emerald-600">Active</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* SUMMARY STAT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Tickets"
                  value={stats.total}
                  icon={Ticket}
                  color="blue"
                  onClick={() => setStatusFilter('ALL')}
                  isActive={statusFilter === 'ALL'}
                />
                <StatCard
                  title="Open Tickets"
                  value={stats.open}
                  icon={AlertCircle}
                  color="amber"
                  onClick={() => setStatusFilter('Open')}
                  isActive={statusFilter === 'Open'}
                />
                <StatCard
                  title="In Progress"
                  value={stats.inProgress}
                  icon={Clock}
                  color="purple"
                  onClick={() => setStatusFilter('In Progress')}
                  isActive={statusFilter === 'In Progress'}
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

              {/* FILTER BAR & TABLE CONTAINER */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span>Filter Tickets</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Open">Open</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Waiting for Customer">Waiting for Customer</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>

                    {/* Category Filter */}
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">All Categories</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    {/* Reset button */}
                    {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || searchQuery !== '') && (
                      <button
                        onClick={resetFilters}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-50 rounded-lg"
                      >
                        <RefreshCcw className="w-3 h-3" /> Reset
                      </button>
                    )}
                  </div>

                  {/* Create Ticket Action Button */}
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-98"
                  >
                    <PlusCircle className="w-4 h-4" /> Create Ticket
                  </button>
                </div>

                {/* Loading State Indicator */}
                {loading ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <p className="text-sm font-medium">Loading tickets...</p>
                  </div>
                ) : (
                  /* Tickets Table */
                  <TicketTable
                    tickets={filteredTickets}
                    onSelectTicket={(t) => setSelectedTicketId(t.id || t.ticketId)}
                    isAdmin={false}
                  />
                )}
              </div>
            </>
          )}

        </main>
      </div>

      {/* CREATE TICKET MODAL */}
      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreatedAndSelect={(t) => setSelectedTicketId(t.id || t.ticketId)}
      />

      {/* USER TICKET DETAILS MODAL */}
      <UserTicketDetailsModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicketId(null)}
      />
    </div>
  );
};
