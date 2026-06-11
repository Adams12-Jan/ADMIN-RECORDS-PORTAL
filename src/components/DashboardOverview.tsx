/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  StationeryItem,
  StationeryRequest,
  User,
  Department,
  SystemConfig
} from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

interface DashboardOverviewProps {
  currentUser: User;
  requests: StationeryRequest[];
  catalog: StationeryItem[];
  departments: Department[];
  users: User[];
  onNavigateTo: (tabname: string) => void;
  systemConfig?: SystemConfig;
}

export default function DashboardOverview({
  currentUser,
  requests,
  catalog,
  departments,
  onNavigateTo,
  systemConfig
}: DashboardOverviewProps) {
  // 1. Calculate General Metrics
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'pending_approval' || r.status === 'submitted').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const rejectedRequests = requests.filter(r => r.status === 'rejected').length;
  const completedRequests = requests.filter(r => r.status === 'completed' || r.status === 'issued').length;

  const totalItemsAvailable = catalog.filter(i => i.status === 'active').reduce((sum, item) => sum + item.availableQuantity, 0);
  const lowStockItems = catalog.filter(i => i.status === 'active' && i.availableQuantity <= i.reorderLevel);

  // 2. Quantity Analysis Calculations (by Category, Department)
  const categoryChartData: { name: string; value: number }[] = [];
  const departmentChartData: { name: string; value: number }[] = [];

  // Group stationery transactions (only from completed, approved, or issued items)
  const completedAndIssuedRequests = requests.filter(r => ['completed', 'issued', 'approved'].includes(r.status));

  const totalQuantities = completedAndIssuedRequests.reduce((sum, r) => {
    return sum + r.items.reduce((itemSum, item) => {
      return itemSum + item.quantity;
    }, 0);
  }, 0);

  // Calculate by Category
  const categoryQuantities: Record<string, number> = {};
  completedAndIssuedRequests.forEach(r => {
    r.items.forEach(reqItem => {
      const catItem = catalog.find(i => i.id === reqItem.itemId);
      const category = catItem ? catItem.category : 'Other';
      categoryQuantities[category] = (categoryQuantities[category] || 0) + reqItem.quantity;
    });
  });

  Object.entries(categoryQuantities).forEach(([name, value]) => {
    categoryChartData.push({ name, value });
  });

  // Calculate by Department
  const deptQuantities: Record<string, number> = {};
  completedAndIssuedRequests.forEach(r => {
    const deptName = departments.find(d => d.id === r.departmentId)?.name || r.departmentName || 'Unknown';
    const requestQty = r.items.reduce((sum, item) => sum + item.quantity, 0);
    deptQuantities[deptName] = (deptQuantities[deptName] || 0) + requestQty;
  });

  Object.entries(deptQuantities).forEach(([name, value]) => {
    departmentChartData.push({ name, value });
  });

  // Fill initial defaults if zero
  if (categoryChartData.length === 0) {
    categoryChartData.push({ name: 'Writing Instruments', value: 0 });
    categoryChartData.push({ name: 'Paper Products', value: 0 });
    categoryChartData.push({ name: 'Filing & Storage', value: 0 });
  }
  if (departmentChartData.length === 0) {
    departmentChartData.push({ name: 'Engineering', value: 0 });
    departmentChartData.push({ name: 'Finance', value: 0 });
  }

  // Bar Graph Color Array
  const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

  // 3. User Specific Stats
  const myRequests = requests.filter(r => r.userId === currentUser.id);
  const myPendingRequests = myRequests.filter(r => ['submitted', 'pending_approval'].includes(r.status));
  const myCompletedRequests = myRequests.filter(r => ['completed', 'issued'].includes(r.status));

  return (
    <div id="dashboard-tab-view" className="space-y-6">
      {/* Targeted Gideon Super Admin Notice */}
      {currentUser.email === 'gideonline18@gmail.com' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between shadow-xs gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-lg shadow-sm shrink-0">
              ★
            </span>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-800 tracking-tight font-sans">CMS Portal Management Active</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed leading-5">
                Hi <strong className="text-slate-800">Gideon</strong>, the platform has configured your <strong className="text-slate-700">Super Admin</strong> session. You have full workspace permissions to sign off on department requests, manage items, export reporting CSV sheets, and customize application titles or announcement banners using the <strong className="text-indigo-600">CMS Control Panel</strong> option below.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTo('system')}
            className="text-xs font-bold text-amber-800 bg-white hover:bg-slate-50 border border-amber-200 shadow-xs hover:border-amber-300 px-4 py-2 rounded-xl cursor-pointer transition-all shrink-0 self-start md:self-auto"
          >
            Open CMS settings &rarr;
          </button>
        </div>
      )}

      {/* Dynamic Announcement banner */}
      {systemConfig?.announcementText && (
        <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
          <span className="flex items-center justify-center text-base p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
            📢
          </span>
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-widest block font-mono">Workspace Announcement</span>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">{systemConfig.announcementText}</p>
          </div>
        </div>
      )}

      {/* Dynamic Header */}
      <div className="bg-gradient-to-r from-black via-slate-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800/40">
        <div className="max-w-3xl">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight font-sans">
            Welcome back, {currentUser.fullName}!
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1.5 leading-relaxed leading-6">
            {currentUser.role === 'employee' && "Submit and track stationery orders, check available items in stock, or draft requests directly."}
            {currentUser.role === 'approver' && "Review pending stationery submissions from your department staff, check budgets, or view activity."}
            {currentUser.role === 'admin' && "Oversee stationery replenishment logs, handle stock allocation, check alerts, and dispatch stationery."}
            {currentUser.role === 'super_admin' && "Audit system logs, change system configurations, modify department heads, or toggle users."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {currentUser.role === 'employee' && (
              <button
                id="btn-quick-new-request"
                onClick={() => onNavigateTo('requests')}
                className="bg-white text-indigo-950 font-semibold text-xs px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
              >
                + Submit New Request
              </button>
            )}
            {currentUser.role === 'approver' && (
              <button
                id="btn-quick-approvals"
                onClick={() => onNavigateTo('approvals')}
                className="bg-white text-indigo-950 font-semibold text-xs px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
              >
                Go to Approvals ({pendingRequests})
              </button>
            )}
            {currentUser.role === 'admin' && (
              <button
                id="btn-quick-inventory"
                onClick={() => onNavigateTo('catalog')}
                className="bg-amber-500 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg shadow-sm hover:bg-amber-400 transition-all cursor-pointer"
              >
                Manage Stockroom
              </button>
            )}
            <button
              onClick={() => onNavigateTo('catalog')}
              className="bg-slate-800 text-slate-100 font-semibold text-xs px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer"
            >
              Browse Catalog
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Bento-Style */}
      <div id="metric-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total / My Requests */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:shadow-xs transition-shadow flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {currentUser.role === 'employee' ? 'My Total Orders' : 'System Requests'}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
              {currentUser.role === 'employee' ? myRequests.length : totalRequests}
            </h3>
            <p className="text-[10px] text-slate-400">
              {currentUser.role === 'employee' ? `${myRequests.filter(r => r.status==='draft').length} saved drafts` : 'Total submissions'}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:shadow-xs transition-shadow flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Orders</p>
            <h3 className="text-2xl font-bold text-amber-600 font-sans tracking-tight">
              {currentUser.role === 'employee' ? myPendingRequests.length : pendingRequests}
            </h3>
            <p className="text-[10px] text-slate-400">Awaiting processing</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl animate-pulse">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Completed Requests */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:shadow-xs transition-shadow flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {currentUser.role === 'employee' ? 'My Fulfilled' : 'Issued Requests'}
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 font-sans tracking-tight">
              {currentUser.role === 'employee' ? myCompletedRequests.length : completedRequests}
            </h3>
            <p className="text-[10px] text-slate-400">Marked as Issued / Completed</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Stock Status / Expenditures */}
        {currentUser.role === 'employee' ? (
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:shadow-xs transition-shadow flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Ordered Units</p>
              <h3 className="text-2xl font-bold text-indigo-600 font-sans tracking-tight">
                {myRequests
                  .filter(r => ['approved', 'issued', 'completed'].includes(r.status))
                  .reduce((total, r) => total + r.items.reduce((s, i) => s + i.quantity, 0), 0)}
              </h3>
              <p className="text-[10px] text-slate-400">Total units approved/dispatched</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:shadow-xs transition-shadow flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Items</p>
              <h3 className={`text-2xl font-bold font-sans tracking-tight ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {lowStockItems.length}
              </h3>
              <p className="text-[10px] text-slate-400">At or below reorder limit</p>
            </div>
            <div className={`p-3 rounded-xl ${lowStockItems.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              {lowStockItems.length > 0 ? <AlertTriangle className="w-5 h-5 animate-bounce" /> : <Package className="w-5 h-5" />}
            </div>
          </div>
        )}
      </div>

      {/* Analytics and Side Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenditure Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Stationery Distributed by Category (Units)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Accumulated quantities ({totalQuantities} total units) from approved, issued, and completed stationery requests.
            </p>
          </div>
          <div className="h-64 mt-4 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`${value} units`, 'Quantity']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Share / Donut Chart */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Department Quantity Share
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Proportional stock distribution across company divisions.</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center mt-4">
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {departmentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} units`, 'Total']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-3">Total Units</p>
                <p className="text-base font-bold text-slate-800 font-sans mt-0.5">{totalQuantities}</p>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="w-full mt-3 divide-y divide-slate-100 max-h-32 overflow-y-auto">
              {departmentChartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs py-1 text-slate-600">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[(index + 2) % CHART_COLORS.length] }}
                    />
                    <span className="truncate">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{entry.value} units</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Stock alerts and Recent Requests quick views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Alerts Widget */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-rose-50 mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
              Stock alerts & Reorder levels
            </h3>
            <button
              onClick={() => onNavigateTo('catalog')}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Reorder stock
            </button>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-100 rounded-xl">
                <p className="text-xs font-semibold text-slate-700">All levels green!</p>
                <p className="text-[10px] mt-0.5">Every stationery item is well above reorder thresholds.</p>
              </div>
            ) : (
              lowStockItems.map((item) => {
                const stockPct = Math.max(0, Math.min(100, (item.availableQuantity / item.reorderLevel) * 100));
                return (
                  <div key={item.id} className="p-3 bg-red-25 border border-red-50 rounded-xl space-y-1.5 hover:bg-red-50/50 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-sm font-mono">{item.id}</span>
                      <span className="text-xs text-slate-500 font-medium truncate">{item.vendorName}</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Category: {item.category}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-rose-700 font-mono">{item.availableQuantity} left</span>
                        <p className="text-[10px] text-slate-400">Reorder limit: {item.reorderLevel}</p>
                      </div>
                    </div>
                    {/* Progress Bar visual indicator */}
                    <div className="w-full bg-red-100 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-rose-500 h-full transition-all duration-500"
                        style={{ width: `${stockPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Order History Widget */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4.5 h-4.5 text-indigo-600" />
              {currentUser.role === 'employee' ? 'My Recent Requests' : 'Recent System Submissions'}
            </h3>
            <button
              onClick={() => onNavigateTo('requests')}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              See all
            </button>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {(currentUser.role === 'employee' ? myRequests : requests).length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-100 rounded-xl">
                <p className="text-xs font-semibold text-slate-700">No requests log</p>
                <p className="text-[10px] mt-0.5">Submit your first stationery request in the portal.</p>
              </div>
            ) : (
              (currentUser.role === 'employee' ? myRequests : requests)
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 4)
                .map((req) => {
                  const getBadgeColor = (status: string) => {
                    switch (status) {
                      case 'draft': return 'bg-slate-100 text-slate-600 border-slate-200';
                      case 'submitted': return 'bg-blue-50 text-blue-700 border-blue-200';
                      case 'pending_approval': return 'bg-amber-50 text-amber-700 border-amber-200';
                      case 'approved': return 'bg-violet-50 text-violet-700 border-violet-200';
                      case 'issued': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-250';
                      default: return 'bg-slate-100 text-slate-500';
                    }
                  };
                  const rTotalCost = req.items.reduce((total, i) => total + (i.quantity * i.unitCostSnapshot), 0);
                  const totalItems = req.items.reduce((sum, i) => sum + i.quantity, 0);

                  return (
                    <div
                      key={req.id}
                      className="p-3 border border-slate-100 hover:border-slate-200 rounded-xl flex items-center justify-between gap-3 transition-colors hover:shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-800">{req.id}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-sm">
                          Requested by <strong className="text-slate-700">{req.userFullName}</strong> ({req.departmentName})
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {totalItems} items • {formatCurrency(rTotalCost)}
                        </p>
                      </div>

                      <div>
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getBadgeColor(req.status)}`}>
                          {req.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
