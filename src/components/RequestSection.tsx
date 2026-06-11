/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StationeryRequest, StationeryItem, User, RequestItem } from '../types';
import {
  FileText,
  Trash2,
  Send,
  AlertTriangle,
  History,
  FileCheck2,
  Calendar,
  X,
  Plus,
  Paperclip,
  CheckCircle,
  Truck,
  Building,
  Printer,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

interface RequestSectionProps {
  currentUser: User;
  requests: StationeryRequest[];
  catalog: StationeryItem[];
  onSubmitRequest: (request: StationeryRequest) => void;
  onCancelRequest: (requestId: string) => void;
}

export default function RequestSection({
  currentUser,
  requests,
  catalog,
  onSubmitRequest,
  onCancelRequest
}: RequestSectionProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ itemId: string; quantity: number }[]>([]);
  const [justification, setJustification] = useState('');
  const [draftAttachment, setDraftAttachment] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'my_requests' | 'drafts'>('my_requests');

  // Multi-item creation states
  const [newItemId, setNewItemId] = useState('');
  const [newItemQty, setNewItemIdQty] = useState(1);

  // Active viewing voucher/detail state
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<StationeryRequest | null>(null);

  // Filter user requests
  const userRequests = requests.filter(
    (r) => r.userId === currentUser.id && r.status !== 'draft'
  );
  const userDrafts = requests.filter(
    (r) => r.userId === currentUser.id && r.status === 'draft'
  );

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'draft': return 0;
      case 'submitted': return 1;
      case 'pending_approval': return 2;
      case 'approved': return 3;
      case 'issued': return 4;
      case 'completed': return 5;
      default: return -1;
    }
  };

  const handleAddItemToForm = () => {
    if (!newItemId) return;
    const existsIndex = selectedItems.findIndex((i) => i.itemId === newItemId);

    if (existsIndex > -1) {
      // update
      const updated = [...selectedItems];
      updated[existsIndex].quantity += newItemQty;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, { itemId: newItemId, quantity: newItemQty }]);
    }
    setNewItemId('');
    setNewItemIdQty(1);
  };

  const handleRemoveItemFromForm = (itemId: string) => {
    setSelectedItems(selectedItems.filter((i) => i.itemId !== itemId));
  };

  const handleSubmit = (status: 'submitted' | 'draft') => {
    if (selectedItems.length === 0) {
      alert('Please select at least one stationery item.');
      return;
    }
    if (status === 'submitted' && !justification.trim()) {
      alert('Justification/reason is mandatory for submitted requests.');
      return;
    }

    const compiledItems: RequestItem[] = selectedItems.map((item) => {
      const match = catalog.find((c) => c.id === item.itemId);
      return {
        itemId: item.itemId,
        quantity: item.quantity,
        unitCostSnapshot: match ? match.unitCost : 0.00
      };
    });

    const isDirectSourcingOverridden = false; // Mock attribute

    const newRequest: StationeryRequest = {
      id: `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      departmentId: currentUser.departmentId,
      departmentName: currentUser.departmentId === 'DEPT-ENG' ? 'Engineering & QA' : 'Finance & Accounting',
      items: compiledItems,
      justification: justification.trim() || 'No description provided.',
      status: status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      supportAttachmentName: draftAttachment || undefined
    };

    onSubmitRequest(newRequest);
    setIsCreating(false);
    setSelectedItems([]);
    setJustification('');
    setDraftAttachment('');
  };

  const handleLoadDraft = (draft: StationeryRequest) => {
    const formatted = draft.items.map(i => ({ itemId: i.itemId, quantity: i.quantity }));
    setSelectedItems(formatted);
    setJustification(draft.justification);
    setDraftAttachment(draft.supportAttachmentName || '');
    onCancelRequest(draft.id); // removes original draft so we can update/resave it
    setIsCreating(true);
  };

  const calculateTotalCost = (items: { itemId: string; quantity: number }[]) => {
    return items.reduce((sum, item) => {
      const catMatch = catalog.find((c) => c.id === item.itemId);
      return sum + (item.quantity * (catMatch ? catMatch.unitCost : 0));
    }, 0);
  };

  const calculateRequestTotalCost = (items: RequestItem[]) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitCostSnapshot), 0);
  };

  return (
    <div id="request-section-view" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          Stationery Requests Control
        </h2>
        {!isCreating && (
          <button
            id="btn-create-request-tab"
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Create Stationery Request
          </button>
        )}
      </div>

      {isCreating ? (
        /* Create Request Form Pane */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden animate-in fade-in duration-150">
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4.5 h-4.5 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">New Procurement Ticket</h3>
            </div>
            <button
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-semibold"
            >
              Close Form
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left side: Item Picker list */}
            <div className="lg:col-span-3 space-y-4">
              <span className="text-xs font-bold text-slate-700 block pb-1 border-b border-slate-100">
                1. Select Catalog Products
              </span>

              <div className="flex gap-2.5 items-end">
                <div className="flex-1">
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Catalog Item</label>
                  <select
                    id="select-item-picker"
                    value={newItemId}
                    onChange={(e) => setNewItemId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none"
                  >
                    <option value="">-- Choose Stationery Item --</option>
                    {catalog
                      .filter((c) => c.status === 'active')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({formatCurrency(c.unitCost)} - {c.availableQuantity} available)
                        </option>
                      ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Quantity</label>
                  <input
                    id="input-picker-qty"
                    type="number"
                    min="1"
                    value={newItemQty}
                    onChange={(e) => setNewItemIdQty(parseInt(e.target.value) || 1)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none font-mono"
                  />
                </div>
                <button
                  type="button"
                  id="btn-add-item-to-form"
                  onClick={handleAddItemToForm}
                  className="p-2 py-2.5 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-700 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                  title="Add to application list"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Items Selected Grid */}
              <div className="border border-slate-150 rounded-xl overflow-hidden mt-4 bg-slate-25 min-h-36">
                <div className="px-3.5 py-2 bg-slate-100/50 border-b border-slate-150 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                  Stationery Items Cart ({selectedItems.length})
                </div>
                {selectedItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No items selected yet. Choose products from the dropdown menu above.
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-150">
                      <tr>
                        <th className="p-2.5 pl-4">Item Code</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right w-24">Est. Cost</th>
                        <th className="p-2.5 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 bg-white">
                      {selectedItems.map((item) => {
                        const product = catalog.find((c) => c.id === item.itemId);
                        const rowCost = (product ? product.unitCost : 0) * item.quantity;
                        return (
                          <tr key={item.itemId} className="hover:bg-slate-25">
                            <td className="p-2.5 pl-4 font-mono font-bold text-slate-500">{item.itemId}</td>
                            <td className="p-2.5 font-semibold text-slate-700">{product ? product.name : 'Unknown'}</td>
                            <td className="p-2.5 text-center font-mono font-semibold text-slate-800">{item.quantity}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                              {formatCurrency(rowCost)}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemFromForm(item.itemId)}
                                className="p-1 text-slate-300 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                        <td colSpan={3} className="p-3 pl-4 text-right uppercase tracking-wider font-bold">Total Estimate</td>
                        <td className="p-3 text-right font-mono text-sm font-bold text-indigo-600">
                          {formatCurrency(calculateTotalCost(selectedItems))}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right side: Rationale & attachments */}
            <div className="lg:col-span-2 space-y-4 border-t lg:border-t-0 lg:border-l border-slate-150 pt-5 lg:pt-0 lg:pl-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-700 block pb-1 border-b border-slate-100">
                  2. Business Description & Attachments
                </span>

                <div>
                  <label className="block text-slate-500 text-[11px] mb-1.5 font-bold">Justification / Purpose *</label>
                  <textarea
                    id="input-justification"
                    rows={4}
                    required
                    placeholder="Provide detailed reasoning for stationery usage (e.g. Preparing client proposals, onboarding new design engineer...)"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Simulated file uploader */}
                <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Paperclip className="w-5 h-5 text-slate-400" />
                    <p className="text-[11px] font-bold text-slate-700">Supporting Attachment</p>
                    <p className="text-[10px] text-slate-400">PDF, Excel or PNG under 10MB (Optional)</p>
                  </div>
                  <input
                    type="text"
                    id="input-attachment"
                    placeholder="E.g., design_invoice_quote.pdf"
                    value={draftAttachment}
                    onChange={(e) => setDraftAttachment(e.target.value)}
                    className="mt-2 text-center text-xs border border-slate-100 rounded-md px-2 py-1 focus:outline-none w-full"
                  />
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center gap-2 pt-5 border-t border-slate-150">
                <button
                  type="button"
                  id="btn-save-draft"
                  onClick={() => handleSubmit('draft')}
                  className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  id="btn-submit-request"
                  onClick={() => handleSubmit('submitted')}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Requests History View */
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
            <button
              id="tab-history-sub"
              onClick={() => setActiveTab('my_requests')}
              className={`pb-2 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'my_requests'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Submitted Requests ({userRequests.length})
            </button>
            <button
              id="tab-history-drafts"
              onClick={() => setActiveTab('drafts')}
              className={`pb-2 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'drafts'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              My Saved Drafts ({userDrafts.length})
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {activeTab === 'my_requests' ? (
              userRequests.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">No requests submitted</p>
                  <p className="text-[11px] text-slate-400 mt-1">Create and submit stationery requests to view history log lists.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-150">
                      <tr>
                        <th className="p-3.5 pl-6">ID Code</th>
                        <th className="p-3.5">Details</th>
                        <th className="p-3.5">Quantity</th>
                        <th className="p-3.5 text-right">Total Cost</th>
                        <th className="p-3.5">Status Timeline</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {userRequests.map((req) => {
                        const totalUnits = req.items.reduce((sum, i) => sum + i.quantity, 0);
                        const totalCostValue = calculateRequestTotalCost(req.items);
                        const stepIdx = getStatusStepIndex(req.status);

                        const getStatusStyle = (status: string) => {
                          switch (status) {
                            case 'submitted': return 'bg-blue-50 text-blue-700 border-blue-200';
                            case 'pending_approval': return 'bg-amber-50 text-amber-700 border-amber-200';
                            case 'approved': return 'bg-violet-50 text-violet-700 border-violet-200';
                            case 'issued': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-250';
                            case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-250';
                            default: return 'bg-slate-50 text-slate-600';
                          }
                        };

                        return (
                          <tr key={req.id} className="hover:bg-slate-25/50 transition-colors">
                            <td className="p-3.5 pl-6 font-mono font-bold text-slate-800">
                              <button
                                onClick={() => setSelectedRequestDetails(req)}
                                className="text-indigo-600 hover:underline hover:text-indigo-800 text-left cursor-pointer font-sans"
                              >
                                {req.id}
                              </button>
                            </td>
                            <td className="p-3.5">
                              <span className="text-[10px] text-slate-400 block font-semibold flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(req.createdAt)}
                              </span>
                              <p className="text-slate-600 line-clamp-1 truncate max-w-xs mt-0.5 font-medium">{req.justification}</p>
                            </td>
                            <td className="p-3.5 font-mono text-slate-500 font-semibold">{totalUnits} units</td>
                            <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                              {formatCurrency(totalCostValue)}
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${getStatusStyle(req.status)}`}>
                                  {req.status.replace('_', ' ')}
                                </span>
                                {req.status !== 'rejected' && (
                                  <div className="hidden lg:flex items-center text-[10px] text-slate-400 gap-0.5 font-bold font-mono">
                                    <span>Step {stepIdx + (/approved|issued|completed/.test(req.status) ? 1 : 1)}/6</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5 text-center space-x-1.5">
                              <button
                                onClick={() => setSelectedRequestDetails(req)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer inline-flex items-center gap-0.5"
                              >
                                <Printer className="w-3 h-3" /> Voucher
                              </button>
                              {['submitted', 'pending_approval'].includes(req.status) && (
                                <button
                                  onClick={() => {
                                    if (confirm('Cancel this pending stationer ticket?')) {
                                      onCancelRequest(req.id);
                                    }
                                  }}
                                  className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[10.5px] font-semibold transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              /* Drafts Tab */
              userDrafts.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Paperclip className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">No saved drafts</p>
                  <p className="text-[11px] text-slate-400 mt-1">Select stationery and click "Save Draft" within the builder.</p>
                </div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-150">
                      <tr>
                        <th className="p-3.5 pl-6">ID Reference</th>
                        <th className="p-3.5">Details</th>
                        <th className="p-3.5">Quantity Items</th>
                        <th className="p-3.5 text-right w-24">Draft Cost</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {userDrafts.map((draft) => {
                        const totalUnits = draft.items.reduce((sum, i) => sum + i.quantity, 0);
                        const totalCostValue = calculateRequestTotalCost(draft.items);

                        return (
                          <tr key={draft.id} className="hover:bg-slate-25/50">
                            <td className="p-3.5 pl-6 font-mono font-bold text-slate-800">{draft.id}</td>
                            <td className="p-3.5">
                              <span className="text-[10px] text-slate-400 block font-semibold">Saved {formatDate(draft.createdAt)}</span>
                              <p className="text-slate-500 line-clamp-1 max-w-sm font-medium">{draft.justification}</p>
                            </td>
                            <td className="p-3.5 text-slate-500 font-mono font-semibold">{totalUnits} units</td>
                            <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                              {formatCurrency(totalCostValue)}
                            </td>
                            <td className="p-3.5 text-center space-x-2">
                              <button
                                onClick={() => handleLoadDraft(draft)}
                                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Edit & Submit
                              </button>
                              <button
                                onClick={() => onCancelRequest(draft.id)}
                                className="px-3 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-25 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Printable Issue Voucher Drawer / Overlays */}
      {selectedRequestDetails && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-indigo-300">
                <Printer className="w-4 h-4" />
                Procurement Issue Voucher View
              </span>
              <button
                onClick={() => setSelectedRequestDetails(null)}
                className="text-slate-400 hover:text-white cursor-pointer font-sans text-sm font-bold"
              >
                Close Voucher
              </button>
            </div>

            {/* Print Area */}
            <div id="print-vouchers-content" className="p-8 space-y-6 bg-white relative">
              {/* Internal Watermarked Title */}
              <div className="absolute right-8 top-8 opacity-5 text-[10px] font-serif border border-slate-900 p-2 font-black rotate-12 uppercase">
                Enterprise Official Receipt
              </div>

              {/* Company Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-350 gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5 font-sans">
                    <Building className="w-5 h-5 text-indigo-600" />
                    CORPORATE SERVICES DIVISION
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Bureau of Supply room & Inventory Management</p>
                </div>
                <div className="text-left sm:text-right font-mono text-[11px] text-slate-500">
                  <p>Date: {new Date(selectedRequestDetails.createdAt).toLocaleDateString()}</p>
                  <p>Receipt Code: <span className="font-bold text-slate-800">{selectedRequestDetails.id}</span></p>
                </div>
              </div>

              {/* Request Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-25 border border-slate-150 p-4 rounded-xl text-xs text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Requester Information</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedRequestDetails.userFullName}</p>
                  <p className="text-slate-500 mt-0.5">{selectedRequestDetails.departmentName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Voucher Status</span>
                  <p className="font-bold text-slate-800 mt-0.5 uppercase tracking-wide">
                    {selectedRequestDetails.status.replace('_', ' ')}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Updated: {new Date(selectedRequestDetails.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Stationery Issued items list</span>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                      <th className="p-2">Item Code</th>
                      <th className="p-2">Product Name</th>
                      <th className="p-2 text-center w-16">Qty</th>
                      <th className="p-2 text-right w-24">Unit Cost</th>
                      <th className="p-2 text-right w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {selectedRequestDetails.items.map((i) => {
                      const matchItem = catalog.find((cat) => cat.id === i.itemId);
                      const unitCost = i.unitCostSnapshot || (matchItem ? matchItem.unitCost : 0.00);
                      return (
                        <tr key={i.itemId}>
                          <td className="p-2 font-mono font-bold text-slate-500">{i.itemId}</td>
                          <td className="p-2 font-semibold text-slate-800">{matchItem ? matchItem.name : 'Stationery Product'}</td>
                          <td className="p-2 text-center font-mono font-bold text-slate-800">{i.quantity}</td>
                          <td className="p-2 text-right font-mono text-slate-600">{formatCurrency(unitCost)}</td>
                          <td className="p-2 text-right font-mono font-extrabold text-slate-800">
                            {formatCurrency(unitCost * i.quantity)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="font-bold text-slate-900 border-t-2 border-slate-200 bg-slate-50/50">
                      <td colSpan={4} className="p-2 text-right uppercase tracking-wider font-bold">Grand Cost Integration</td>
                      <td className="p-2 text-right font-mono text-indigo-600 text-sm font-extrabold">
                        {formatCurrency(calculateRequestTotalCost(selectedRequestDetails.items))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Audit comments / Sign-offs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 text-xs font-semibold text-slate-600">
                <div className="space-y-1 bg-slate-20/50 p-3 rounded-lg border border-slate-100 h-24 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Comments/Justification</span>
                    <p className="text-slate-500 line-clamp-2 leading-relaxed text-[11px] font-medium mt-0.5">
                      {selectedRequestDetails.justification}
                    </p>
                  </div>
                  {selectedRequestDetails.approvalComment && (
                    <p className="text-[10px] text-indigo-600 truncate">
                      <strong>Approver comment:</strong> {selectedRequestDetails.approvalComment}
                    </p>
                  )}
                </div>

                <div className="flex flex-col justify-end text-center max-w-72 sm:ml-auto">
                  <div className="border-b border-slate-250 pb-1 font-mono text-[11px] font-bold text-slate-800">
                    {selectedRequestDetails.approvedByUserId ? 'DAVID VANCE (CS HEAD)' : 'PENDING OFFICIAL SIGN'}
                  </div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mt-1">Authorized signature / Audit Lock</span>
                </div>
              </div>

              {/* Barcode & QR Code Section (EXTRA FEATURES requirement) */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-6">
                {/* Barcode representation using custom CSS lines */}
                <div className="space-y-1 flex-1">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">Document Barcode</span>
                  <div className="flex items-end h-8 gap-[1px] bg-slate-50 p-1 border border-slate-100 rounded-sm">
                    {/* Unique layout barcode pattern */}
                    {[2, 4, 1, 3, 2, 4, 1, 1, 3, 2, 4, 1, 2, 3, 4, 1, 3, 2, 4, 1, 1, 3, 2, 4, 1, 2, 3].map((thickness, index) => {
                      const isLine = index % 3 !== 0;
                      return (
                        <div
                          key={index}
                          className={`bg-slate-900 h-full ${isLine ? '' : 'bg-transparent'}`}
                          style={{ width: `${thickness}px` }}
                        />
                      );
                    })}
                  </div>
                  <p className="font-mono text-[10px] text-slate-500 font-bold">{selectedRequestDetails.id}-SECURE-AUTH-ALIGNED</p>
                </div>

                {/* QR Code simulation using simple retro css grid table */}
                <div className="space-y-1 text-center shrink-0">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">Scan item</span>
                  <div className="w-12 h-12 bg-slate-100 p-1.5 border border-slate-200 rounded flex flex-wrap gap-[1px]">
                    {/* Generates an elegant geometric QR-like grid of blocks */}
                    {Array.from({ length: 36 }).map((_, idx) => {
                      // Solid corner anchors
                      const isAnchor =
                        idx === 0 || idx === 1 || idx === 5 || idx === 6 || idx === 30 || idx === 35;
                      const randomColored = Math.random() > 0.45;
                      const isDark = isAnchor || randomColored;
                      return (
                        <div
                          key={idx}
                          className={`w-[5.5px] h-[5.5px] rounded-xs ${isDark ? 'bg-slate-900' : 'bg-transparent'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Voucher Toolbar footer */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-150 flex justify-end gap-2.5 print:hidden">
              <button
                onClick={() => setSelectedRequestDetails(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
