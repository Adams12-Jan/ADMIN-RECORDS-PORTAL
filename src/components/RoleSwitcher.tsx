/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole, AppNotification } from '../types';
import { Shield, Sparkles, UserCheck, Bell, Check, Trash } from 'lucide-react';

interface RoleSwitcherProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  users: User[];
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
}

export default function RoleSwitcher({
  currentUser,
  onUserChange,
  users,
  notifications,
  onMarkNotificationRead,
  onClearNotifications
}: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'admin': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'approver': return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      case 'employee': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Store Manager (Admin)';
      case 'approver': return 'Department Head (Approver)';
      case 'employee': return 'Employee (User)';
    }
  };

  // Filter notifications based on active role or general
  const unreadNotifications = notifications.filter(n => {
    if (n.isRead) return false;
    // Admin notifications have empty userId or match
    if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
      return !n.userId;
    }
    return n.userId === currentUser.id;
  });

  return (
    <div id="role-switcher-container" className="flex items-center gap-3">
      {/* Active Role Quick Toggle */}
      <div className="relative">
        <button
          id="btn-role-switcher-dropdown"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-3 py-1.5 bg-[#1D293D] text-white border border-[#2d3a52] rounded-lg hover:bg-[#25344d] transition-colors shadow-xs text-left cursor-pointer"
        >
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-8 h-8 rounded-full border border-slate-100 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#10182D] flex items-center justify-center text-white font-medium text-sm">
              {currentUser.fullName.charAt(0)}
            </div>
          )}
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-white leading-3">{currentUser.fullName}</p>
            <span className={`inline-block text-[10px] px-1.5 py-0.25 font-semibold uppercase tracking-wider rounded-sm border mt-0.5 ${getRoleColor(currentUser.role)}`}>
              {getRoleLabel(currentUser.role)}
            </span>
          </div>
          <svg className={`w-4 h-4 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div id="role-list-popup" className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                Workflow Impersonator
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Easily toggle roles to simulate request cycles, stockroom adjustments, or configurations instantly.
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {users.map((u) => {
                const isActive = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    id={`btn-impersonate-${u.id}`}
                    onClick={() => {
                      onUserChange(u);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left cursor-pointer group ${isActive ? 'bg-indigo-25/50 font-medium' : ''}`}
                  >
                    <img
                      src={u.avatarUrl}
                      alt={u.fullName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-800 truncate leading-4">{u.fullName}</p>
                        {isActive && <UserCheck className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                      <span className={`inline-block text-[9px] px-1 py-0.25 font-bold uppercase tracking-wider rounded-sm border mt-1 ${getRoleColor(u.role)}`}>
                        {getRoleLabel(u.role)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Notification Bell Widget */}
      <div className="relative">
        <button
          id="btn-notif-center"
          onClick={() => setIsNotifOpen(!isNotifOpen)}
          className="relative p-2 text-white bg-[#1D293D] hover:bg-[#25344d] rounded-lg transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications.length > 0 && (
            <span id="badge-notif-count" className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadNotifications.length}
            </span>
          )}
        </button>

        {isNotifOpen && (
          <div id="notif-popup-container" className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 font-sans">Notifications</span>
              {unreadNotifications.length > 0 && (
                <button
                  id="btn-clear-notifs"
                  onClick={() => {
                    onClearNotifications();
                    setIsNotifOpen(false);
                  }}
                  className="text-[11px] font-medium text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <Trash className="w-3 h-3" /> Clear All
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {unreadNotifications.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <Sparkles className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium">All caught up!</p>
                  <p className="text-[10px] mt-0.5">No new workflow alerts.</p>
                </div>
              ) : (
                unreadNotifications.map((notif) => {
                  const itemColor = notif.type === 'warning' ? 'border-amber-400' :
                                    notif.type === 'success' ? 'border-emerald-400' : 'border-slate-300';
                  return (
                    <div
                      key={notif.id}
                      className={`p-3 border-l-4 hover:bg-slate-25 transition-colors flex gap-2 justify-between items-start ${itemColor}`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-700">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 leading-4">{notif.message}</p>
                        <p className="text-[9px] text-slate-400">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => onMarkNotificationRead(notif.id)}
                        className="p-1 text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
