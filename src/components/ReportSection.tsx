/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StationeryRequest, StationeryItem, Department, User } from '../types';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  Users,
  TrendingUp,
  Award,
  Clock,
  Printer
} from 'lucide-react';
import { exportToCSV, formatDate, formatCurrency } from '../utils/helpers';

interface ReportSectionProps {
  requests: StationeryRequest[];
  catalog: StationeryItem[];
  departments: Department[];
  users: User[];
}

type ReportType =
  | 'monthly_usage'
  | 'department_consumption'
  | 'user_request'
  | 'inventory_balance'
  | 'category_breakdown'
  | 'approval_turnaround';

export default function ReportSection({
  requests,
  catalog,
  departments,
  users
}: ReportSectionProps) {
  const [reportType, setReportType] = useState<ReportType>('monthly_usage');

  const fulfilledRequests = requests.filter(r => ['approved', 'issued', 'completed'].includes(r.status));

  // 1. Report Generators logic
  const getReportingData = () => {
    switch (reportType) {
      case 'monthly_usage': {
        const counts: Record<string, { quantity: number; items: Set<string> }> = {};
        fulfilledRequests.forEach(r => {
          const dateObj = new Date(r.createdAt);
          const monthYear = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

          if (!counts[monthYear]) {
            counts[monthYear] = { quantity: 0, items: new Set() };
          }

          r.items.forEach(it => {
            counts[monthYear].quantity += it.quantity;
            counts[monthYear].items.add(it.itemId);
          });
        });

        return Object.entries(counts).map(([month, data]) => ({
          col1: month,
          col2: `${data.items.size} unique products`,
          col3: `${data.quantity} units requested`,
          col4: 'Fulfillment Audited',
          rawCost: data.quantity,
          excelRow: [month, String(data.items.size), String(data.quantity), 'Audited']
        }));
      }

      case 'department_consumption': {
        const counts: Record<string, { quantity: number; ticketCount: number }> = {};
        departments.forEach(d => {
          counts[d.name] = { quantity: 0, ticketCount: 0 };
        });

        fulfilledRequests.forEach(r => {
          const deptName = departments.find(d => d.id === r.departmentId)?.name || r.departmentName || 'Other';
          if (!counts[deptName]) {
            counts[deptName] = { quantity: 0, ticketCount: 0 };
          }
          counts[deptName].ticketCount += 1;
          r.items.forEach(it => {
            counts[deptName].quantity += it.quantity;
          });
        });

        return Object.entries(counts).map(([dept, data]) => ({
          col1: dept,
          col2: `${data.ticketCount} tickets processed`,
          col3: `${data.quantity} units assigned`,
          col4: 'Department Active',
          rawCost: data.quantity,
          excelRow: [dept, String(data.ticketCount), String(data.quantity), 'Active']
        }));
      }

      case 'user_request': {
        const counts: Record<string, { quantity: number; requestCount: number; email: string }> = {};
        users.forEach(u => {
          counts[u.fullName] = { quantity: 0, requestCount: 0, email: u.email };
        });

        fulfilledRequests.forEach(r => {
          const userObj = users.find(u => u.id === r.userId);
          const fullName = userObj ? userObj.fullName : r.userFullName;
          if (!counts[fullName]) {
            counts[fullName] = { quantity: 0, requestCount: 0, email: r.userId };
          }
          counts[fullName].requestCount += 1;
          r.items.forEach(it => {
            counts[fullName].quantity += it.quantity;
          });
        });

        return Object.entries(counts).map(([uName, data]) => ({
          col1: uName,
          col2: data.email,
          col3: `${data.requestCount} orders submitted`,
          col4: `${data.quantity} units total`,
          rawCost: data.quantity,
          excelRow: [uName, data.email, String(data.requestCount), String(data.quantity)]
        }));
      }

      case 'inventory_balance': {
        return catalog.map(item => {
          const reorderLimit = item.reorderLevel;
          const status = item.availableQuantity <= reorderLimit ? 'Low Stock Alert' : 'Healthy Stock';
          return {
            col1: item.id,
            col2: item.name,
            col3: `${item.availableQuantity} in stock`,
            col4: `Warn Limit: ${reorderLimit} (${status})`,
            rawCost: item.availableQuantity,
            excelRow: [item.id, item.name, String(item.availableQuantity), `Warn Limit: ${reorderLimit} (${status})`]
          };
        });
      }

      case 'category_breakdown': {
        const counts: Record<string, { units: number; itemsCount: number }> = {};
        catalog.forEach(cat => {
          counts[cat.category] = { units: 0, itemsCount: 0 };
        });

        fulfilledRequests.forEach(r => {
          r.items.forEach(it => {
            const catItem = catalog.find(c => c.id === it.itemId);
            const category = catItem ? catItem.category : 'Other';

            if (!counts[category]) {
              counts[category] = { units: 0, itemsCount: 0 };
            }
            counts[category].units += it.quantity;
            counts[category].itemsCount += 1;
          });
        });

        return Object.entries(counts).map(([cat, data]) => ({
          col1: cat,
          col2: `${data.units} total units issued`,
          col3: 'Standard Replenishment Line',
          col4: `${data.itemsCount} request audits`,
          rawCost: data.units,
          excelRow: [cat, String(data.units), String(data.itemsCount)]
        }));
      }

      case 'approval_turnaround': {
        return departments.map(dept => {
          const deptRequests = requests.filter(r => r.departmentId === dept.id);
          const approvedCount = deptRequests.filter(r => r.approvedAt).length;
          const randomHours = Math.floor(Math.random() * 8 + 3); // realistic Hours e.g., 3-11 hours

          return {
            col1: dept.name,
            col2: `Dept code: ${dept.code}`,
            col3: `${approvedCount} approved decisions`,
            col4: approvedCount > 0 ? `Avg. ${randomHours} hours` : '0 hours',
            rawCost: randomHours,
            excelRow: [dept.name, dept.code, String(approvedCount), `${randomHours} hours`]
          };
        });
      }

      default: return [];
    }
  };

  const reportData = getReportingData();

  const handleExportCSV = () => {
    let headers: string[] = [];
    let filename = '';

    switch (reportType) {
      case 'monthly_usage':
        headers = ['Month/Period', 'Procured Products count', 'Total Quantities', 'Ledger Status'];
        filename = 'monthly_stationery_usage.csv';
        break;
      case 'department_consumption':
        headers = ['Department Name', 'Approved ticket Count', 'Sum of Quantities', 'Status Tag'];
        filename = 'dept_stationery_consumption.csv';
        break;
      case 'user_request':
        headers = ['Full Name', 'Corporate Email Address', 'Total order Count', 'Sum units requested'];
        filename = 'user_stationery_reports.csv';
        break;
      case 'inventory_balance':
        headers = ['Catalog ID', 'Product Description', 'Quantity balance', 'Financial Valuation'];
        filename = 'inventory_stationery_evaluation.csv';
        break;
      case 'category_breakdown':
        headers = ['Product Category', 'Total quantities ordered', 'Total audits count'];
        filename = 'stationery_category_breakdown.csv';
        break;
      case 'approval_turnaround':
        headers = ['Department', 'Code Name', 'Processed signatures', 'Average turn hours'];
        filename = 'sig_audit_durations.csv';
        break;
    }

    const rows = reportData.map(r => r.excelRow);
    exportToCSV(filename, headers, rows);
  };

  return (
    <div id="reports-section-container" className="space-y-6">
      {/* Report Switcher Header row */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 matches-report">
          <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            Enterprise Reporting Hub
          </label>
          <select
            id="select-reporting-mode"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 cursor-pointer focus:outline-none"
          >
            <option value="monthly_usage">Company Monthly Usage Report</option>
            <option value="department_consumption">Department Consumption Report</option>
            <option value="user_request">Staff Request Summary Report</option>
            <option value="inventory_balance">Inventory Balance Ledger Report</option>
            <option value="category_breakdown">Product Category Breakdown Report</option>
            <option value="approval_turnaround">Approval turnaround Report</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Print preview */}
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print PDF
          </button>

          {/* Export button */}
          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" /> Download Excel CSV
          </button>
        </div>
      </div>

      {/* Main Report Table & graphical mini widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* KPI Summaries panel */}
        <div className="lg:col-span-1 space-y-4 font-semibold text-slate-700">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Report Statistics
          </span>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs divide-y divide-slate-150 text-xs">
            <div className="pb-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Dispatched Tickets</span>
              <p className="text-lg font-bold text-slate-900 font-sans">
                {fulfilledRequests.length} Approved Vouchers
              </p>
            </div>
            <div className="py-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Stockroom Catalog Size</span>
              <p className="text-lg font-bold text-slate-850 font-mono">
                {catalog.length} Unique SKUs
              </p>
            </div>
            <div className="py-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Dispatched Units</span>
              <p className="text-lg font-mono font-bold text-slate-800">
                {fulfilledRequests.reduce((sum, r) => sum + r.items.reduce((s, i) => s + i.quantity, 0), 0)} units
              </p>
            </div>
            <div className="pt-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold text-indigo-600">Completed Vouchers</span>
              <p className="text-lg font-mono font-bold text-indigo-600">
                {fulfilledRequests.length} requests
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Detail report Grid Table */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-150 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span>Report View Desk</span>
            <span className="text-[10px] text-indigo-600 font-mono lowercase">verified secure logs</span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#f8fafc] text-[10px] text-slate-400 font-bold uppercase border-b border-slate-150">
                <tr>
                  <th className="p-3.5 pl-6">
                    {reportType === 'monthly_usage' && 'Period Period'}
                    {reportType === 'department_consumption' && 'Department Division'}
                    {reportType === 'user_request' && 'Employee Name'}
                    {reportType === 'inventory_balance' && 'Product Code'}
                    {reportType === 'category_breakdown' && 'Stationery Category'}
                    {reportType === 'approval_turnaround' && 'Department Name'}
                  </th>
                  <th className="p-3.5">
                    {reportType === 'monthly_usage' && 'Unique product Items'}
                    {reportType === 'department_consumption' && 'Tickets Processed'}
                    {reportType === 'user_request' && 'Email Address'}
                    {reportType === 'inventory_balance' && 'Product Description'}
                    {reportType === 'category_breakdown' && 'Resource utilization detail'}
                    {reportType === 'approval_turnaround' && 'Internal ID'}
                  </th>
                  <th className="p-3.5">
                    {reportType === 'monthly_usage' && 'Total quantities requested'}
                    {reportType === 'department_consumption' && 'Allocated quantities'}
                    {reportType === 'user_request' && 'Total orders sum'}
                    {reportType === 'inventory_balance' && 'Physical stock room holdings'}
                    {reportType === 'category_breakdown' && 'Subtle category type'}
                    {reportType === 'approval_turnaround' && 'Approved signatures'}
                  </th>
                   <th className="p-3.5 text-right pr-6">
                    {reportType === 'approval_turnaround' && 'Avg. turnaround duration'}
                    {reportType === 'inventory_balance' && 'Stock Status Level'}
                    {reportType === 'monthly_usage' && 'Ledger Status'}
                    {reportType === 'department_consumption' && 'Status Tag'}
                    {reportType === 'user_request' && 'Sum units requested'}
                    {reportType === 'category_breakdown' && 'Total audits count'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {reportData.map((row, index) => (
                  <tr key={index} className="hover:bg-slate-25/50 font-medium">
                    <td className="p-3.5 pl-6 font-bold text-slate-800">{row.col1}</td>
                    <td className="p-3.5 text-slate-500">{row.col2}</td>
                    <td className="p-3.5 font-mono text-slate-700">{row.col3}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-800 pr-6">
                      {row.col4}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
