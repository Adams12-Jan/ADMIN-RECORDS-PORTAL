/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StationeryRequest, StationeryItem, InventoryTransaction, User } from '../types';
import {
  FolderLock,
  Truck,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Inbox,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

interface InventorySectionProps {
  currentUser: User;
  requests: StationeryRequest[];
  catalog: StationeryItem[];
  transactions: InventoryTransaction[];
  onIssueRequest: (id: string) => void;
  onCompleteRequest: (id: string) => void;
}

export default function InventorySection({
  currentUser,
  requests,
  catalog,
  transactions,
  onIssueRequest,
  onCompleteRequest
}: InventorySectionProps) {
  const [activeTab, setActiveTab] = useState<'requests_dispatch' | 'transaction_logs'>('requests_dispatch');
  const [txnSearch, setTxnSearch] = useState('');
  const [txnTypeFilter, setTxnTypeFilter] = useState('All');

  // Requests that require action from the Store Manager:
  // - Approved (Awaiting "Issue" actions)
  // - Issued (Awaiting final handover "Complete")
  const dispatchRequests = requests.filter((r) =>
    ['approved', 'issued'].includes(r.status)
  );

  const completedOrRejectedRequests = requests.filter((r) =>
    ['completed', 'rejected'].includes(r.status)
  );

  const filteredTransactions = transactions.filter((txn) => {
    const item = catalog.find((c) => c.id === txn.itemId);
    const itemName = item ? item.name.toLowerCase() : '';
    const matchSearch =
      txn.itemId.toLowerCase().includes(txnSearch.toLowerCase()) ||
      itemName.includes(txnSearch.toLowerCase()) ||
      txn.reason.toLowerCase().includes(txnSearch.toLowerCase());

    const matchType = txnTypeFilter === 'All' || txn.type === txnTypeFilter;

    return matchSearch && matchType;
  });

  const getTransactionBadgeColor = (type: string) => {
    switch (type) {
      case 'stock_in': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'stock_out': return 'bg-rose-50 text-rose-700 border-rose-220';
      case 'adjustment': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'transfer': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  const calculateRequestTotalCost = (req: StationeryRequest) => {
    return req.items.reduce((sum, item) => {
      const match = catalog.find((c) => c.id === item.itemId);
      const cost = item.unitCostSnapshot || (match ? match.unitCost : 0);
      return sum + (item.quantity * cost);
    }, 0);
  };

  return (
    <div id="store-manager-controls" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-indigo-600" />
            Store Room & Dispatch Controls
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Approve stationery issuance, mark items as physically dispatched, or track replenishment transactions.
          </p>
        </div>

        {/* Dispatch Nav Pills */}
        <div className="flex items-center gap-1.5 border border-slate-150 p-1 rounded-xl bg-slate-50 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('requests_dispatch')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'requests_dispatch'
                ? 'bg-white shadow-xs text-indigo-950 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dispatch Desk ({dispatchRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('transaction_logs')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'transaction_logs'
                ? 'bg-white shadow-xs text-indigo-950 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Stockroom Transaction Logs
          </button>
        </div>
      </div>

      {activeTab === 'requests_dispatch' ? (
        /* Action center: Approved/Issued dispatching desk */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispatch Desk (Interactive Column) */}
          <div className="lg:col-span-2 space-y-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Active Fulfillment Queue ({dispatchRequests.length})
            </span>

            {dispatchRequests.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Queue is completely empty!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No stationery requests are awaiting fulfillment or delivery.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dispatchRequests.map((req) => {
                  const reqCost = calculateRequestTotalCost(req);
                  const isReadyToIssue = req.status === 'approved';
                  const isReadyToComplete = req.status === 'issued';

                  return (
                    <div
                      key={req.id}
                      id={`dispatch-ticket-${req.id}`}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                    >
                      <div>
                        {/* Summary Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 font-mono">{req.id}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.25 rounded-xs font-bold">{req.departmentId}</span>
                          </div>
                          <div>
                            <span
                              className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                isReadyToIssue
                                  ? 'bg-violet-50 text-violet-700 border-violet-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}
                            >
                              Awaiting {isReadyToIssue ? 'Issuance Approval' : 'Physical Delivery'}
                            </span>
                          </div>
                        </div>

                        {/* Request Details */}
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold text-slate-800">
                                Requester: <strong className="text-slate-900 font-bold">{req.userFullName}</strong>
                              </p>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                <Calendar className="w-3 h-3" /> Requested {formatDate(req.createdAt)}
                              </span>
                            </div>
                            <div className="text-right font-mono">
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Value</p>
                              <p className="text-sm font-black text-slate-800">{formatCurrency(reqCost)}</p>
                            </div>
                          </div>

                          <div className="bg-slate-25 border border-slate-100 rounded-xl p-3 text-xs space-y-1 text-slate-600">
                            <p className="text-slate-500 italic mb-2">&ldquo;{req.justification}&rdquo;</p>
                            <span className="text-[9.5px] text-slate-450 uppercase font-bold block">Allocated Products:</span>
                            <div className="divide-y divide-slate-100/50 pt-1">
                              {req.items.map((it) => {
                                const catItem = catalog.find((c) => c.id === it.itemId);
                                return (
                                  <div key={it.itemId} className="flex justify-between py-1 font-semibold text-[11px]">
                                    <div className="text-slate-700">
                                      {catItem ? catItem.name : it.itemId}
                                    </div>
                                    <div className="font-mono text-slate-800 font-extrabold pr-2">
                                      x{it.quantity}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action trigger row */}
                      <div className="mt-5 flex items-center justify-end gap-3.5 pt-3.5 border-t border-slate-100">
                        {isReadyToIssue && (
                          <button
                            onClick={() => onIssueRequest(req.id)}
                            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                          >
                            <Truck className="w-4 h-4" /> Issue and Deduct Inventory
                          </button>
                        )}
                        {isReadyToComplete && (
                          <button
                            onClick={() => onCompleteRequest(req.id)}
                            className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                          >
                            ✓ Mark as Fully Completed
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Low Stock Indicators (Sidebar helper inside desk view) */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Stockroom Warnings
            </span>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-1 text-rose-600 font-extrabold text-[12px] pb-2 border-b border-slate-100">
                <AlertTriangle className="w-4.5 h-4.5 animate-bounce" /> Reorder Alert Board
              </div>

              {catalog.filter((c) => c.availableQuantity <= c.reorderLevel).length === 0 ? (
                <div className="text-center text-slate-400 p-4 font-normal">
                  All inventory balances currently restocked and healthy.
                </div>
              ) : (
                <div className="space-y-3">
                  {catalog
                    .filter((c) => c.availableQuantity <= c.reorderLevel)
                    .map((item) => (
                      <div key={item.id} className="p-3 bg-red-25/50 border border-red-50 rounded-xl space-y-1">
                        <div className="flex justify-between font-mono text-[10px] font-bold">
                          <span className="text-rose-600">{item.id}</span>
                          <span className="text-slate-400">{item.category}</span>
                        </div>
                        <p className="font-bold text-slate-800 truncate">{item.name}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-rose-700 font-black font-mono">{item.availableQuantity} left</span>
                          <span className="text-[10px] text-slate-400">Trigger: {item.reorderLevel}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* History lists of other inventory Transactions */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {/* Filters shelf */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-150 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <input
              type="text"
              placeholder="Search by Code, details, or reasons..."
              value={txnSearch}
              onChange={(e) => setTxnSearch(e.target.value)}
              className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs w-full sm:w-72 bg-white focus:outline-none"
            />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Type:</span>
              <select
                value={txnTypeFilter}
                onChange={(e) => setTxnTypeFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 cursor-pointer focus:outline-none w-full sm:w-44"
              >
                <option value="All">All Operations</option>
                <option value="stock_in">Stock In (Replenishment)</option>
                <option value="stock_out">Stock Out (Issuance)</option>
                <option value="adjustment">Stock Realignment</option>
                <option value="transfer">Stockroom Transfer</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-25 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-150">
                <tr>
                  <th className="p-3.5 pl-6">ID Reference</th>
                  <th className="p-3.5">Stationery Code</th>
                  <th className="p-3.5">Item Name</th>
                  <th className="p-3.5">Txn Type</th>
                  <th className="p-3.5 text-center">Qty Offset</th>
                  <th className="p-3.5">Business Rationale</th>
                  <th className="p-3.5">Action Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-450 font-normal">
                      No matching inventory log trails recorded or verified.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions
                    .slice()
                    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((t) => {
                      const matItem = catalog.find((c) => c.id === t.itemId);
                      return (
                        <tr key={t.id} className="hover:bg-slate-25/50 border-slate-150">
                          <td className="p-3.5 pl-6 font-mono font-bold text-slate-500">{t.id}</td>
                          <td className="p-3.5 font-mono font-extrabold text-slate-800">{t.itemId}</td>
                          <td className="p-3.5 font-semibold text-slate-700 truncate max-w-xs">
                            {matItem ? matItem.name : 'Unknown Stationery Product'}
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-sm border ${getTransactionBadgeColor(t.type)}`}>
                              {t.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className={`p-3.5 text-center font-mono font-bold ${t.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.quantity > 0 ? `+${t.quantity}` : t.quantity} units
                          </td>
                          <td className="p-3.5 text-slate-500 max-w-sm font-medium">{t.reason}</td>
                          <td className="p-3.5 text-slate-400 font-semibold">{formatDate(t.createdAt)}</td>
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
