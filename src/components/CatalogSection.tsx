/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StationeryItem, User, InventoryTransaction } from '../types';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Sliders,
  DollarSign,
  Undo2,
  ArrowRightLeft,
  Activity,
  Maximize2
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

interface CatalogSectionProps {
  currentUser: User;
  catalog: StationeryItem[];
  transactions: InventoryTransaction[];
  onAddNewItem: (item: StationeryItem) => void;
  onUpdateItem: (item: StationeryItem) => void;
  onDeleteItem: (id: string) => void;
  onPostTransaction: (txn: Omit<InventoryTransaction, 'id' | 'createdAt' | 'userId'>) => void;
}

export default function CatalogSection({
  currentUser,
  catalog,
  transactions,
  onAddNewItem,
  onUpdateItem,
  onDeleteItem,
  onPostTransaction
}: CatalogSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<StationeryItem | null>(null);

  // States for inventory transactions
  const [activeTxnItem, setActiveTxnItem] = useState<StationeryItem | null>(null);
  const [txnType, setTxnType] = useState<'stock_in' | 'stock_out' | 'adjustment' | 'transfer'>('stock_in');
  const [txnQty, setTxnQty] = useState<number>(1);
  const [txnReason, setTxnReason] = useState<string>('');

  // New item form states
  const [itemId, setItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Writing Instruments');
  const [itemDesc, setItemDesc] = useState('');
  const [itemCost, setItemCost] = useState<number>(1.00);
  const [itemAvailable, setItemAvailable] = useState<number>(50);
  const [itemReorder, setItemReorder] = useState<number>(10);
  const [itemVendor, setItemVendor] = useState('');

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';

  // Get unique categories list
  const categories = ['All', ...Array.from(new Set(catalog.map(item => item.category)))];

  // Filtering
  const filteredCatalog = catalog.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'active' && item.status === 'active') ||
      (statusFilter === 'inactive' && item.status === 'inactive') ||
      (statusFilter === 'low_stock' && item.availableQuantity <= item.reorderLevel);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId.trim() || !itemName.trim()) return;

    const newItem: StationeryItem = {
      id: itemId.trim().toUpperCase(),
      name: itemName.trim(),
      category: itemCategory,
      description: itemDesc.trim(),
      unitCost: itemCost,
      availableQuantity: itemAvailable,
      reorderLevel: itemReorder,
      vendorName: itemVendor.trim() || 'Direct Vendor Co.',
      status: 'active'
    };

    onAddNewItem(newItem);
    setIsAddingItem(false);
    resetForm();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    onUpdateItem(editingItem);
    setEditingItem(null);
  };

  const handleTxnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTxnItem) return;

    // Adjust quantity multiplier based on transaction type
    let finalQty = txnQty;
    if (txnType === 'stock_out') {
      finalQty = -Math.abs(txnQty);
    } else if (txnType === 'adjustment') {
      // Could be negative or positive depending on reason
      finalQty = txnQty;
    }

    onPostTransaction({
      itemId: activeTxnItem.id,
      type: txnType,
      quantity: finalQty,
      reason: txnReason || `${txnType.replace('_', ' ')} manual updates`
    });

    setActiveTxnItem(null);
    setTxnQty(1);
    setTxnReason('');
  };

  const resetForm = () => {
    setItemId('');
    setItemName('');
    setItemCategory('Writing Instruments');
    setItemDesc('');
    setItemCost(1.00);
    setItemAvailable(50);
    setItemReorder(10);
    setItemVendor('');
  };

  return (
    <div id="catalog-section-container" className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 id-search-icon w-4 text-slate-400" />
          <input
            id="input-catalog-search"
            type="text"
            placeholder="Search by Code, Name, or Vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Filter */}
          <select
            id="select-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 cursor-pointer focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Stock Filter status */}
          <select
            id="select-stock-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="low_stock">Low Stock Alerts ⚠️</option>
          </select>

          {/* Add New Item Button (Admins only) */}
          {isAdmin && (
            <button
              id="btn-add-catalog-item"
              onClick={() => {
                resetForm();
                setIsAddingItem(true);
              }}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ml-auto md:ml-0"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          )}
        </div>
      </div>

      {/* Grid of Stationery Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredCatalog.map((item) => {
          const isLowStock = item.availableQuantity <= item.reorderLevel;
          const isInactive = item.status === 'inactive';

          return (
            <div
              key={item.id}
              id={`stationery-card-${item.id}`}
              className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all relative overflow-hidden group ${
                isInactive ? 'border-dashed border-slate-200 opacity-65 bg-slate-50' :
                isLowStock ? 'border-rose-250 ring-1 ring-rose-100' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header Labels */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm font-mono tracking-wide">
                    {item.id}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-28 uppercase font-semibold">
                    {item.category}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {item.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 h-8">
                  {item.description || 'No item description available.'}
                </p>

                {/* Logistics */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-150 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">In Stock</span>
                    <p className={`font-mono font-bold mt-0.5 ${isLowStock ? 'text-rose-600' : 'text-slate-800'}`}>
                      {item.availableQuantity} units
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-450 uppercase tracking-wider font-bold">Reorder Level</span>
                    <p className="font-mono font-bold text-slate-800 mt-0.5">
                      {item.reorderLevel} units
                    </p>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-400 truncate">
                  Vendor: <span className="font-semibold text-slate-500">{item.vendorName}</span>
                </div>
              </div>

              {/* Status and Action bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {isInactive ? (
                    <span className="text-[9px] px-1.5 py-0.5 roundedbg-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      Inactive
                    </span>
                  ) : isLowStock ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-extrabold uppercase tracking-wider flex items-center gap-0.5">
                      <AlertCircle className="w-2.5 h-2.5" /> Low Stock
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase tracking-wider">
                      Active
                    </span>
                  )}
                </div>

                {/* Admin controls */}
                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    {/* Log stock interaction */}
                    <button
                      onClick={() => {
                        setActiveTxnItem(item);
                        setTxnType('stock_in');
                      }}
                      className="p-1 px-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold rounded-md flex items-center gap-0.5 transition-colors cursor-pointer"
                      title="Adjust inventory levels manually"
                    >
                      <Sliders className="w-3 h-3" /> Stock Op
                    </button>

                    {/* Edit item details */}
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                      title="Edit stationery product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete item details */}
                    <button
                      onClick={() => {
                        if (confirm(`Do you really want to permanently remove ${item.name} (${item.id})?`)) {
                          onDeleteItem(item.id);
                        }
                      }}
                      className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-25 rounded-md transition-colors cursor-pointer"
                      title="Delete product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredCatalog.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200 p-12 text-center text-slate-400 rounded-2xl">
            <Sliders className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <h4 className="text-slate-700 font-semibold text-sm">No items found</h4>
            <p className="text-xs text-slate-400 mt-1">Adjust your search parameters or query filters to expand the stationery list.</p>
          </div>
        )}
      </div>

      {/* Add Stationery Modal/Popup */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight">Create Stationery Catalog Product</h3>
              <button onClick={() => setIsAddingItem(false)} className="text-slate-400 hover:text-white cursor-pointer font-sans text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs font-medium text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">Product Code (Item ID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., STAT-009"
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-350"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">Category *</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none"
                  >
                    <option value="Writing Instruments">Writing Instruments</option>
                    <option value="Paper Products">Paper Products</option>
                    <option value="Filing & Storage">Filing & Storage</option>
                    <option value="Desk Organizers">Desk Organizers</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Facility Safety">Facility Safety</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">Stationery Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Heavy Duty Stapler (Silver Edition)"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">Product Description</label>
                <textarea
                  rows={2}
                  placeholder="Insert size, colors, or specification details..."
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">Initial Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemAvailable}
                    onChange={(e) => setItemAvailable(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">Low-Stock Trigger *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={itemReorder}
                    onChange={(e) => setItemReorder(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">Vendor Representative Co.</label>
                <input
                  type="text"
                  placeholder="E.g., Global Office Supplies Ltd."
                  value={itemVendor}
                  onChange={(e) => setItemVendor(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Stationery Modal/Popup */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight">Edit Catalog Item Details</h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white cursor-pointer font-sans text-lg">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="block text-slate-500 mb-1.5">Item Name *</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">Reorder Level *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editingItem.reorderLevel}
                  onChange={(e) => setEditingItem({ ...editingItem, reorderLevel: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">Vendor Name</label>
                  <input
                    type="text"
                    value={editingItem.vendorName}
                    onChange={(e) => setEditingItem({ ...editingItem, vendorName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">Item Status</label>
                  <select
                    value={editingItem.status}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none"
                  >
                    <option value="active">Active (Available)</option>
                    <option value="inactive">Inactive (Discontinued)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock adjustment Op Form */}
      {activeTxnItem && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight">Post Inventory Adjustment</h3>
              <button onClick={() => setActiveTxnItem(null)} className="text-slate-400 hover:text-white cursor-pointer font-sans text-lg">&times;</button>
            </div>
            <div className="px-5 py-3.5 bg-indigo-25 text-[11px] text-slate-600">
              Adjusting stock levels for <strong>{activeTxnItem.name} ({activeTxnItem.id})</strong>.<br />
              Current Quantity Available: <span className="font-mono font-bold text-slate-800">{activeTxnItem.availableQuantity}</span>
            </div>
            <form onSubmit={handleTxnSubmit} className="p-5 space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="block text-slate-500 mb-1.5">Adjustment Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxnType('stock_in')}
                    className={`py-2 px-3 border rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                      txnType === 'stock_in' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Stock In (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxnType('stock_out')}
                    className={`py-2 px-3 border rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                      txnType === 'stock_out' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Undo2 className="w-3.5 h-3.5 rotate-180" /> Stock Out (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxnType('adjustment')}
                    className={`py-2 px-3 border rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                      txnType === 'adjustment' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Activity className="w-1.5 h-1.5 stroke-2" /> Alignment (+/-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxnType('transfer')}
                    className={`py-2 px-3 border rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                      txnType === 'transfer' ? 'bg-slate-700 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">Adjustment Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={txnQty}
                    onChange={(e) => setTxnQty(parseInt(e.target.value) || 1)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {txnType === 'stock_in' && `Increases inventory by ${txnQty} units.`}
                    {txnType === 'stock_out' && `Decreases inventory by ${txnQty} units.`}
                    {txnType === 'adjustment' && `Manual level adjustments (${txnQty} unit offset).`}
                    {txnType === 'transfer' && `Transfer ${txnQty} items outwards or inwards.`}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">Audit Purpose / Reason *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Insert authorization code, reasoning, or invoice references..."
                  value={txnReason}
                  onChange={(e) => setTxnReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTxnItem(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Post Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
