/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Department, AuditLog, SystemConfig, UserRole } from '../types';
import {
  Users,
  Shield,
  History,
  ToggleLeft,
  ChevronDown,
  Building,
  KeyRound,
  Wrench,
  Search,
  Filter,
  Plus
} from 'lucide-react';
import { formatDate } from '../utils/helpers';

interface SystemControlPanelProps {
  users: User[];
  departments: Department[];
  auditLogs: AuditLog[];
  systemConfig: SystemConfig;
  onUpdateUserDetails: (user: User) => void;
  onUpdateConfig: (config: SystemConfig) => void;
  onAddDepartment: (dept: Department) => void;
}

export default function SystemControlPanel({
  users,
  departments,
  auditLogs,
  systemConfig,
  onUpdateUserDetails,
  onUpdateConfig,
  onAddDepartment
}: SystemControlPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'departments' | 'config' | 'audits'>('users');

  // Search/Filter states for audits
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('All');

  // Add dept inputs
  const [deptId, setDeptId] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHeadId, setDeptHeadId] = useState('');

  const handleRoleToggle = (user: User, newRole: UserRole) => {
    onUpdateUserDetails({ ...user, role: newRole });
  };

  const handleStatusToggle = (user: User) => {
    onUpdateUserDetails({ ...user, status: user.status === 'active' ? 'inactive' : 'active' });
  };

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptId.trim() || !deptName.trim() || !deptCode.trim()) return;

    onAddDepartment({
      id: deptId.trim().toUpperCase(),
      name: deptName.trim(),
      code: deptCode.trim().toUpperCase(),
      headUserId: deptHeadId || 'USR-002'
    });

    setDeptId('');
    setDeptName('');
    setDeptCode('');
    setDeptHeadId('');
  };

  const filteredAudits = auditLogs.filter((log) => {
    const matchesSearch =
      log.userFullName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase());

    const matchesAction = auditActionFilter === 'All' || log.action === auditActionFilter;

    return matchesSearch && matchesAction;
  });

  // Get distinct actions for filtering list
  const uniqueAuditActions = ['All', ...Array.from(new Set(auditLogs.map((l) => l.action)))];

  return (
    <div id="system-superadmin-panel" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            Super Admin Control Center
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Oversee corporate departments, modify permissions, adjust approval workflow configurations, and explore complete security audit trails.
          </p>
        </div>

        {/* Panel Tabs */}
        <div className="flex items-center gap-1.5 border border-slate-150 p-1 bg-slate-50 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-white shadow-xs text-indigo-950 font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'departments' ? 'bg-white shadow-xs text-indigo-950 font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'config' ? 'bg-white shadow-xs text-indigo-950 font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Rules & Config
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'audits' ? 'bg-white shadow-xs text-indigo-950 font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        /* Super Admin User Management Table */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs animate-in fade-in duration-100">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-150 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Corporate Registered Users ({users.length})</span>
            <span className="text-[10px] text-slate-400 font-mono">Real-time status controls</span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#f8fafc] text-[10px] text-slate-400 font-bold uppercase border-b border-slate-150">
                <tr>
                  <th className="p-3.5 pl-6">Full Name</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5 font-sans">Department</th>
                  <th className="p-3.5">Granted Role Permission</th>
                  <th className="p-3.5 text-center">Status Toggle</th>
                  <th className="p-3.5 text-center">Security Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 whitespace-nowrap">
                {users.map((u) => {
                  const uDept = departments.find((d) => d.id === u.departmentId)?.name || u.departmentId;
                  const isCurRoot = u.role === 'super_admin';

                  return (
                    <tr key={u.id} className="hover:bg-slate-25/50 border-slate-150">
                      <td className="p-3.5 pl-6">
                        <div className="flex items-center gap-3">
                          <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-slate-100 object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <span className="font-extrabold text-slate-800">{u.fullName}</span>
                            <p className="text-[10px] text-slate-400 font-bold font-mono">UID: {u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-500 font-medium">{u.email}</td>
                      <td className="p-3.5 font-bold text-slate-700">{uDept}</td>
                      <td className="p-3.5">
                        <select
                          value={u.role}
                          disabled={isCurRoot}
                          onChange={(e) => handleRoleToggle(u, e.target.value as UserRole)}
                          className="px-2 py-1 text-[11px] border border-slate-250 bg-white text-slate-700 font-bold rounded-lg cursor-pointer focus:outline-none"
                        >
                          <option value="employee">Employee (User)</option>
                          <option value="approver">Department Head (Approver)</option>
                          <option value="admin">Store Manager (Admin)</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          disabled={isCurRoot}
                          onClick={() => handleStatusToggle(u)}
                          className={`px-3 py-1 text-[10.5px] rounded-full font-bold cursor-pointer border ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100/50'
                              : 'bg-slate-100 text-slate-400 border-slate-250 hover:bg-slate-200/50'
                          }`}
                        >
                          {u.status.toUpperCase()}
                        </button>
                      </td>
                      <td className="p-3.5 text-center text-slate-400 font-bold text-[10.5px]">
                        {isCurRoot ? 'PROTECTED ROOT' : 'STANDARD POLICIES'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'departments' && (
        /* Super Admin Department Hierarchy Management */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-100">
          {/* Dept List Table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-150 text-xs font-bold text-slate-700">
              Company Divisions Checklist
            </div>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#f8fafc] text-[10px] text-slate-400 font-bold uppercase border-b border-slate-150">
                  <tr>
                    <th className="p-3.5 pl-6">Dept ID</th>
                    <th className="p-3.5">Department Name</th>
                    <th className="p-3.5">Division Code</th>
                    <th className="p-3.5">Officer In Charge (Uid)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {departments.map((dept) => {
                    const matchedHead = users.find((u) => u.id === dept.headUserId);
                    return (
                      <tr key={dept.id} className="hover:bg-slate-25/50 border-slate-150">
                        <td className="p-3.5 pl-6 font-mono font-bold text-indigo-650">{dept.id}</td>
                        <td className="p-3.5 font-extrabold text-slate-800">{dept.name}</td>
                        <td className="p-3.5 font-bold text-slate-600">{dept.code}</td>
                        <td className="p-3.5 text-slate-500 font-semibold truncate max-w-sm">
                          {matchedHead ? matchedHead.fullName : dept.headUserId} ({dept.headUserId})
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Dept Form panel */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Building className="w-4.5 h-4.5 text-indigo-600" />
              Create Division Block
            </h3>
            <form onSubmit={handleCreateDept} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Unique Dept ID *</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., DEPT-HR"
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="w-full border border-slate-250 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Division Name *</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Human Resources Department"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full border border-slate-250 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pb-1">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Short Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="E.g., HR"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="w-full border border-slate-250 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">In Charge (User) *</label>
                  <select
                    value={deptHeadId}
                    onChange={(e) => setDeptHeadId(e.target.value)}
                    className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="">-- Choose Approver --</option>
                    {users
                      .filter((u) => u.role === 'approver')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Division
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-6 animate-in fade-in duration-100">
          {/* Super Admin Workflow Settings panel */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Wrench className="w-4.5 h-4.5 text-indigo-600" />
                Standard Global Workflow Rules Configuration
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Adjust procurement dollar constraints, threshold levels, and stock rule compliance guidelines.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-700">
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-500 mb-1.5 font-bold">Require Attachments Above Ticket Cost (USD)</label>
                  <input
                    type="number"
                    min="1"
                    value={systemConfig.requireAttachmentAboveCost}
                    onChange={(e) => onUpdateConfig({ ...systemConfig, requireAttachmentAboveCost: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-250 rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-450 font-normal mt-1 block">Requests with estimates above this amount require quotes or uploaded files.</span>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1.5 font-bold">Auto-Approve Under Dollar Threshold (USD)</label>
                  <input
                    type="number"
                    min="0"
                    value={systemConfig.autoApproveBelowCost}
                    onChange={(e) => onUpdateConfig({ ...systemConfig, autoApproveBelowCost: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-250 rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-450 font-normal mt-1 block">Low value orders bypass Department signoff routing (mocked logic checks).</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-500 mb-1.5 font-bold">Notification Email for Stock Alerts</label>
                  <input
                    type="email"
                    value={systemConfig.lowStockAlertEmail}
                    onChange={(e) => onUpdateConfig({ ...systemConfig, lowStockAlertEmail: e.target.value })}
                    className="w-full border border-slate-250 rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-450 font-normal mt-1 block">Destination for system critical stock warning alerts.</span>
                </div>

                <div className="pt-2 space-y-3.5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-slate-855 font-bold">Strict Stockout Enforcement</p>
                      <p className="text-[10.5px] text-slate-400 font-normal leading-4">Prevent employees from drafting requests exceeding stockroom balance.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemConfig.enforceStockLevels}
                      onChange={(e) => onUpdateConfig({ ...systemConfig, enforceStockLevels: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-slate-350 focus:ring-0 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-slate-855 font-bold">Allow Employee Direct Sourcing</p>
                      <p className="text-[10.5px] text-slate-400 font-normal leading-4">Permit direct catalog acquisitions and self-approval on active goods.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemConfig.allowEmployeeDirectSourcing}
                      onChange={(e) => onUpdateConfig({ ...systemConfig, allowEmployeeDirectSourcing: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-slate-350 focus:ring-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CMS / Content Customizer */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-amber-500" />
                CMS Portal Customizer (Page Branding & Announcement Editor)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Modify portal text labels, home hero headers, announcement lines, and active color designs dynamically.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-700">
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-500 mb-1.5 font-bold">Portal Main Title</label>
                  <input
                    type="text"
                    value={systemConfig.portalName || 'Stationery Request Hub'}
                    onChange={(e) => onUpdateConfig({ ...systemConfig, portalName: e.target.value })}
                    className="w-full border border-slate-250 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                    placeholder="Enter branding name"
                  />
                  <span className="text-[10px] text-slate-450 font-normal mt-1 block">Changes the system branding name in the header.</span>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1.5 font-bold">Portal Subtitle Label</label>
                  <input
                    type="text"
                    value={systemConfig.portalSubtitle || 'Corporate Services Portal'}
                    onChange={(e) => onUpdateConfig({ ...systemConfig, portalSubtitle: e.target.value })}
                    className="w-full border border-slate-250 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                    placeholder="Enter subtitle label"
                  />
                  <span className="text-[10px] text-slate-450 font-normal mt-1 block">Changes the sub-header label that appears next to the logo.</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-500 mb-1.5 font-bold font-sans">Corporate Dashboard Announcement Notice</label>
                  <textarea
                    rows={2}
                    value={systemConfig.announcementText || ''}
                    onChange={(e) => onUpdateConfig({ ...systemConfig, announcementText: e.target.value })}
                    className="w-full border border-slate-250 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                    placeholder="Welcome message or critical workspace notice to display on employee dashboards..."
                  />
                  <span className="text-[10px] text-slate-450 font-normal mt-1 block">Displays inside a custom banner at the top of the Home/Dashboard area.</span>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1.5 font-bold">System Preset Theme Accent</label>
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {[
                      { key: 'indigo', label: 'Classic Indigo', bg: 'bg-indigo-600' },
                      { key: 'slate', label: 'Ecom Slate', bg: 'bg-slate-700' },
                      { key: 'emerald', label: 'Zesty Emerald', bg: 'bg-emerald-600' },
                      { key: 'amber', label: 'Warm Amber', bg: 'bg-amber-500' },
                      { key: 'violet', label: 'Royal Violet', bg: 'bg-violet-600' }
                    ].map((accent) => {
                      const isSelected = (systemConfig.primaryColor || 'indigo') === accent.key;
                      return (
                        <button
                          key={accent.key}
                          type="button"
                          onClick={() => onUpdateConfig({ ...systemConfig, primaryColor: accent.key })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                            isSelected ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${accent.bg}`}></span>
                          {accent.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audits' && (
        /* Super Admin Audit Logs list */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs animate-in fade-in duration-100">
          <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit actions or users..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Action:</span>
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 cursor-pointer focus:outline-none w-full sm:w-48"
              >
                {uniqueAuditActions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto text-xs font-semibold">
            <table className="w-full text-left">
              <thead className="bg-[#f8fafc] text-[10px] text-slate-400 font-bold uppercase border-b border-slate-150">
                <tr>
                  <th className="p-3.5 pl-6">ID Code</th>
                  <th className="p-3.5">System Operator</th>
                  <th className="p-3.5 font-sans">Role Block</th>
                  <th className="p-3.5">Action Event</th>
                  <th className="p-3.5">Fulfillment Details</th>
                  <th className="p-3.5 text-center">Operator IP</th>
                  <th className="p-3.5 pr-6">Action Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 whitespace-nowrap">
                {filteredAudits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400 font-normal">
                      No matching audit trails recorded on file.
                    </td>
                  </tr>
                ) : (
                  filteredAudits
                    .slice()
                    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((log) => {
                      const getRoleBadge = (role: string) => {
                        switch(role) {
                          case 'super_admin': return 'bg-rose-50 border-rose-200 text-rose-700';
                          case 'admin': return 'bg-amber-50 border-amber-200 text-amber-700';
                          case 'approver': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                          default: return 'bg-slate-50 text-slate-500 border-slate-200';
                        }
                      };
                      return (
                        <tr key={log.id} className="hover:bg-slate-25/50 border-slate-150">
                          <td className="p-3.5 pl-6 font-mono font-bold text-slate-450">{log.id}</td>
                          <td className="p-3.5 font-extrabold text-slate-800">{log.userFullName}</td>
                          <td className="p-3.5">
                            <span className={`inline-block text-[9px] font-bold px-1.5 py-0.25 uppercase border rounded-sm ${getRoleBadge(log.userRole)}`}>
                              {log.userRole}
                            </span>
                          </td>
                          <td className="p-3.5 font-sans font-bold text-indigo-700">{log.action}</td>
                          <td className="p-3.5 text-slate-500 max-w-sm font-medium truncate">{log.details}</td>
                          <td className="p-3.5 font-mono text-center font-semibold text-slate-500">{log.ipAddress}</td>
                          <td className="p-3.5 text-slate-400 pr-6">{formatDate(log.createdAt)}</td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
