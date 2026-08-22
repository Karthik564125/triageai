import React, { useState } from 'react';
import { Search, Bell, Menu, ShieldCheck, UserCheck, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ title, searchQuery, setSearchQuery, onToggleMobileSidebar, onOpenCreateTicket }) => {
  const { currentUser } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between shadow-xs">
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {title}
            {isAdmin ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                <ShieldCheck className="w-3 h-3 text-indigo-600" /> Admin Console
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                <UserCheck className="w-3 h-3 text-blue-600" /> Support Desk
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by ID, subject, customer, or category..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Side: Quick Actions, Notifications & Profile Badge */}
      <div className="flex items-center gap-3">
        {/* Create Ticket Shortcut for User */}
        {!isAdmin && onOpenCreateTicket && (
          <button
            onClick={onOpenCreateTicket}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            + New Ticket
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Check className="w-3 h-3" /> Mark read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs ${n.unread ? 'bg-indigo-50/40' : 'bg-white'} hover:bg-slate-50 transition-colors`}
                    >
                      <div className="flex justify-between text-slate-900 font-medium">{n.text}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{n.time}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">No notifications yet.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info Badge */}
        <div className="pl-3 border-l border-slate-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shadow-xs border border-slate-300">
            {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
          </div>
          <div className="hidden xl:block">
            <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser?.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                isAdmin 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {currentUser?.roleLabel || (isAdmin ? 'Administrator' : 'Support User')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
