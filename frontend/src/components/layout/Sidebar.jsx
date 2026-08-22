import React from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  PlusCircle, 
  User, 
  LogOut, 
  Inbox, 
  AlertOctagon, 
  Clock, 
  CheckCircle2, 
  Users, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ activeTab, setActiveTab, onOpenCreateTicket, isMobileOpen, setIsMobileOpen }) => {
  const { currentUser, logout } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const userItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-tickets', label: 'My Tickets', icon: Ticket },
    { id: 'create', label: 'Create Ticket', icon: PlusCircle, isAction: true },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const adminItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'all-tickets', label: 'All Tickets', icon: Ticket },
    { id: 'unassigned', label: 'Unassigned', icon: Inbox },
    { id: 'critical', label: 'Critical', icon: AlertOctagon, color: 'text-red-500' },
    { id: 'in-progress', label: 'In Progress', icon: Clock },
    { id: 'resolved', label: 'Resolved', icon: CheckCircle2 },
    { id: 'teams', label: 'Teams', icon: Users }
  ];

  const items = isAdmin ? adminItems : userItems;

  const handleItemClick = (item) => {
    if (item.id === 'create') {
      if (onOpenCreateTicket) onOpenCreateTicket();
    } else {
      setActiveTab(item.id);
    }
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-900 text-slate-300 z-50 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-900/40">
              <Sparkles className="w-5 h-5 fill-indigo-200" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">TriageAI</span>
              <span className="block text-[10px] font-medium text-slate-400 -mt-1 tracking-wider uppercase">
                Support Management
              </span>
            </div>
          </div>
        </div>

        {/* Role Identity Tag */}
        <div className="px-4 py-3 mx-3 my-3 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${isAdmin ? 'text-indigo-400' : 'text-blue-400'}`} />
            <span className="text-xs font-semibold text-slate-200">
              {isAdmin ? 'Admin Console' : 'Support User Workspace'}
            </span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
            isAdmin ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/50' : 'bg-blue-950 text-blue-300 border border-blue-700/50'
          }`}>
            {currentUser?.role || 'User'}
          </span>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAction = item.isAction;

            if (isAction) {
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow-md transition-all duration-200 active:scale-98"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Ticket</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-xs border-l-4 border-indigo-500'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.color || (isActive ? 'text-indigo-400' : 'text-slate-400')}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Footer / Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs border border-slate-600 shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-200 truncate">{currentUser?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{currentUser?.email}</div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
