/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StationeryRequest, StationeryItem, User } from '../types';
import {
  CheckSquare,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ClipboardList,
  AlertCircle,
  Filter,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

interface ApprovalSectionProps {
  currentUser: User;
  requests: StationeryRequest[];
  catalog: StationeryItem[];
  onApproveRequest: (id: string, comment: string) => void;
  onRejectRequest: (id: string, comment: string) => void;
  onBulkApproveRequests: (ids: string[]) => void;
}

export default function ApprovalSection({
  currentUser,
  requests,
  catalog,
  onApproveRequest,
  onRejectRequest,
  onBulkApproveRequests
}: ApprovalSectionProps) {
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, string>>({});
  const [rejectionComment, setRejectionComment] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [activeRequestDetails, setActiveRequestDetails] = useState<StationeryRequest | null>(null);

  // Filter department requests (matching departmentId)
  // For safety, Approver handles requests that are in 'submitted' or 'pending_approval'
  const departmentPendingRequests = requests.filter(
    (r) =>
      r.departmentId === currentUser.departmentId &&
      ['submitted', 'pending_approval'].includes(r.status) &&
      r.userId !== currentUser.id // Cannot self-approve
  );

  const departmentApprovedHistory = requests.filter(
    (r) =>
      r.departmentId === currentUser.departmentId &&
      ['approved', 'rejected', 'issued', 'completed'].includes(r.status)
  );

  const handleSelectToggle = (id: string) => {
    if (selectedRequestIds.includes(id)) {
      setSelectedRequestIds(selectedRequestIds.filter((x) => x !== id));
    } else {
      setSelectedRequestIds([...selectedRequestIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedRequestIds.length === departmentPendingRequests.length) {
      setSelectedRequestIds([]);
    } else {
      setSelectedRequestIds(departmentPendingRequests.map((r) => r.id));
    }
  };

  const calculateRequestCost = (req: StationeryRequest) => {
    return req.items.reduce((sum, item) => {
      const match = catalog.find((c) => c.id === item.itemId);
      const cost = item.unitCostSnapshot || (match ? match.unitCost : 0);
      return sum + (item.quantity * cost);
    }, 0);
  };

  const handleSingleApproveSubmit = (id: string) => {
    const comment = commentsMap[id] || 'Order verified against department budget constraints.';
    onApproveRequest(id, comment);
    // remove from selection if there
    setSelectedRequestIds(selectedRequestIds.filter(x => x !== id));
  };

  const handleSingleRejectBtnClick = (id: string) => {
    setRejectingRequestId(id);
    setRejectionComment('');
  };

  const handleSingleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequestId || !rejectionComment.trim()) return;

    onRejectRequest(rejectingRequestId, rejectionComment.trim());
    setSelectedRequestIds(selectedRequestIds.filter(x => x !== rejectingRequestId));
    setRejectingRequestId(null);
  };

  const handleBulkApproveSubmit = () => {
    if (selectedRequestIds.length === 0) return;
    if (confirm(`Are you sure you want to approve all ${selectedRequestIds.length} selected requests in bulk?`)) {
      onBulkApproveRequests(selectedRequestIds);
      setSelectedRequestIds([]);
    }
  };

  return (
    <div id="approvals-section-container" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            Department Sign-Off Controls
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Approve or reject stationery tickets drafted by staff in your department (<strong>{currentUser.departmentId}</strong>).
          </p>
        </div>

        {/* Bulk approve banner actions */}
        {selectedRequestIds.length > 0 && (
          <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
              {selectedRequestIds.length} Selected
            </span>
            <button
              id="btn-bulk-approve"
              onClick={handleBulkApproveSubmit}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              ✓ Bulk Approve Selected
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Pending table / log */}
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-150 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Pending Audits ({departmentPendingRequests.length})</span>
            {departmentPendingRequests.length > 0 && (
              <button
                id="btn-select-all-approvals"
                onClick={handleSelectAll}
                className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                {selectedRequestIds.length === departmentPendingRequests.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {departmentPendingRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="text-xs font-bold text-slate-700">Inbox empty!</p>
              <p className="text-[11px] text-slate-400 mt-1">There are no pending stationery requests awaiting your signature.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-150">
              {departmentPendingRequests.map((req) => {
                const isChecked = selectedRequestIds.includes(req.id);
                const reqCost = calculateRequestCost(req);

                return (
                  <div
                    key={req.id}
                    className={`p-5 transition-colors flex flex-col md:flex-row md:items-start gap-4 justify-between ${
                      isChecked ? 'bg-indigo-25/40' : 'hover:bg-slate-25/50'
                    }`}
                  >
                    {/* Left block checkbox and item description */}
                    <div className="flex gap-3.5 items-start min-w-0 flex-1">
                      <button
                        onClick={() => handleSelectToggle(req.id)}
                        className="text-slate-400 hover:text-indigo-600 cursor-pointer p-0.5 mt-1"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                        )}
                      </button>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 font-mono">{req.id}</span>
                          <span className="text-[10px] text-slate-400 font-medium">by {req.userFullName}</span>
                          <span className="text-[10px] text-slate-400 font-medium">• {formatDate(req.createdAt)}</span>
                        </div>

                        <p className="font-semibold text-xs text-slate-800 leading-relaxed max-w-2xl">
                          &ldquo;{req.justification}&rdquo;
                        </p>

                        {/* List items requested as subtle bullet pills */}
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {req.items.map((i) => {
                            const catalogItem = catalog.find((c) => c.id === i.itemId);
                            return (
                              <span
                                key={i.itemId}
                                className="inline-block text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full"
                              >
                                {catalogItem ? catalogItem.name : i.itemId} (x{i.quantity})
                              </span>
                            );
                          })}
                        </div>

                        {/* Cost threshold warning */}
                        {reqCost > 150.00 && (
                          <div className="text-[9.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-3 h-3" /> Cost exceeds standard pre-approved tier limits ($150.00). Requires thorough justification review.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right block: total cost and quick actions */}
                    <div className="flex flex-col items-start md:items-end justify-between self-stretch gap-3 border-t md:border-t-0 pt-3 md:pt-0 pl-8 md:pl-0">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Est. Ticket Cost</span>
                        <p className="text-base font-extrabold text-slate-800 font-mono tracking-tight">
                          {formatCurrency(reqCost)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 w-full md:w-auto">
                        <input
                          type="text"
                          placeholder="Audit comment (e.g., approved)"
                          value={commentsMap[req.id] || ''}
                          onChange={(e) => setCommentsMap({ ...commentsMap, [req.id]: e.target.value })}
                          className="px-2.5 py-1 text-[11px] border border-slate-200 rounded-lg focus:outline-none w-36"
                        />

                        <button
                          onClick={() => handleSingleApproveSubmit(req.id)}
                          className="p-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-xs rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleSingleRejectBtnClick(req.id)}
                          className="p-1.5 px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          &times; Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Historical approval decision Logs */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-150 text-xs font-bold text-slate-600">
            Sign Off Audit Trail Checklist ({departmentApprovedHistory.length})
          </div>

          {departmentApprovedHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No historical decisions recorded under your department code yet.
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-25 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-150">
                  <tr>
                    <th className="p-3.5 pl-6">ID Code</th>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Details Summary</th>
                    <th className="p-3.5 text-right">Cost</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5">Review Commentary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {departmentApprovedHistory
                    .slice()
                    .sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .map((h) => {
                      const cost = calculateRequestCost(h);
                      return (
                        <tr key={h.id} className="hover:bg-slate-25/50">
                          <td className="p-3.5 pl-6 font-mono font-bold text-slate-800">{h.id}</td>
                          <td className="p-3.5 font-semibold text-slate-700">{h.userFullName}</td>
                          <td className="p-3.5 font-medium text-slate-500 max-w-xs truncate">{h.justification}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-800">{formatCurrency(cost)}</td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`inline-block text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                                h.status === 'rejected'
                                  ? 'bg-rose-50 text-rose-700 border-rose-250'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-250'
                              }`}
                            >
                              {h.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500 italic max-w-xs truncate font-medium">
                            {h.approvalComment || 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason input dialog */}
      {rejectingRequestId && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider">Confirm Request Rejection</h3>
              <button
                onClick={() => setRejectingRequestId(null)}
                className="text-slate-400 hover:text-white cursor-pointer font-sans text-sm font-semibold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSingleRejectSubmit} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200/50 rounded-xl flex items-start gap-2 text-[11px]">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <p className="font-bold">Declining request {rejectingRequestId}</p>
                  <p className="font-normal text-rose-700 mt-0.5">Please provide audit comments explaining the precise logic for rejecting this stationery ticket (required).</p>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 font-bold">Rejection Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionComment}
                  onChange={(e) => setRejectionComment(e.target.value)}
                  placeholder="E.g., Please utilize existing stockroom reserves in room 204 or submit smaller quantities for paper reams..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingRequestId(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Decline Stationery Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
