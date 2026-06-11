/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StationeryItem,
  InventoryTransaction,
  User,
  Department,
  AuditLog
} from '../types';
import {
  formatCurrency,
  formatDate,
  createAuditLog
} from '../utils/helpers';
import {
  Terminal,
  Play,
  Trash2,
  HelpCircle,
  Package,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  History,
  CornerDownRight,
  Printer,
  ChevronRight,
  Laptop,
  FileText
} from 'lucide-react';

interface TerminalSectionProps {
  currentUser: User;
  catalog: StationeryItem[];
  setCatalog: React.Dispatch<React.SetStateAction<StationeryItem[]>>;
  transactions: InventoryTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<InventoryTransaction[]>>;
  departments: Department[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
}

interface TerminalLine {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'input' | 'list';
  text: string;
}

export default function TerminalSection({
  currentUser,
  catalog,
  setCatalog,
  transactions,
  setTransactions,
  departments,
  setAuditLogs
}: TerminalSectionProps) {
  // Active selected item for Bin Card view
  const [selectedSku, setSelectedSku] = useState<string>('STAT-009'); // Default to Laptop

  // Filter for selecting item list
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Terminal State
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [terminalLogs, setTerminalLogs] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      text: 'SYSTEM: Vetiva Stores Bin Card CLI Terminal Console v1.2'
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      text: 'STATUS: Ready for IT hardware & Admin consumables logging operations.'
    },
    {
      id: 'init-3',
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      text: 'INFO: Type "help" in the command line or click shortcuts below to list syntax.'
    }
  ]);

  // Command history states for Arrow UP / DOWN scroll
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Reference for terminal scrolling
  const terminalLogsEndRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    terminalLogsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Unique categories for filtering
  const categories = ['All', ...Array.from(new Set(catalog.map(i => i.category)))];

  // Map of category-specific icons
  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('hardware') || category.toLowerCase().includes('electronics')) {
      return <Laptop className="w-4 h-4 text-indigo-500" />;
    }
    return <FileText className="w-4 h-4 text-emerald-500" />;
  };

  // Filtered items list
  const filteredItems = catalog.filter(item => {
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get active item details
  const activeItem = catalog.find(i => i.id === selectedSku) || catalog[0];

  // Filter transactions specific to selected SKU (sorted chronological, oldest first for bin cards!)
  const itemTransactions = transactions
    .filter(t => t.itemId === selectedSku)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Generate continuous ledger lines with running stock balances
  const getBinCardRows = () => {
    let runningBalance = 0;
    
    return itemTransactions.map((txn, index) => {
      // Calculate balance at this step based on the quantity
      runningBalance += txn.quantity;
      
      return {
        ...txn,
        runningBalance
      };
    });
  };

  const binCardRows = getBinCardRows();

  // Helper log printer
  const appendLog = (text: string, type: 'info' | 'success' | 'error' | 'input' | 'list') => {
    setTerminalLogs(prev => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        type,
        text
      }
    ]);
  };

  // Handle Command Submission
  const handleExecuteCommand = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const trimmedInput = terminalInput.trim();
    if (!trimmedInput) return;

    // Log the input line
    appendLog(`CMD > ${trimmedInput}`, 'input');

    // Add to navigation history
    const updatedHistory = [trimmedInput, ...commandHistory.slice(0, 49)];
    setCommandHistory(updatedHistory);
    setHistoryIndex(-1);

    // Command parser
    const args: string[] = [];
    let currentArg = '';
    let insideQuotes = false;

    // Smart string tokenizer to support spaces in quotes, e.g.: add STAT-009 5 "New Batch Laptops"
    for (let i = 0; i < trimmedInput.length; i++) {
      const char = trimmedInput[i];
      if (char === '"' || char === "'") {
        insideQuotes = !insideQuotes;
      } else if (char === ' ' && !insideQuotes) {
        if (currentArg !== '') {
          args.push(currentArg);
          currentArg = '';
        }
      } else {
        currentArg += char;
      }
    }
    if (currentArg !== '') {
      args.push(currentArg);
    }

    if (args.length === 0) {
      setTerminalInput('');
      return;
    }

    const command = args[0].toLowerCase();
    const cmdArgs = args.slice(1);

    switch (command) {
      case 'help': {
        appendLog('----------------- AVAILABLE COMMANDS -----------------', 'list');
        appendLog('  help                                  Show list of valid commands', 'list');
        appendLog('  list                                  Display compact active inventory register', 'list');
        appendLog('  lookup <sku>                          Show bin card details for an item code', 'list');
        appendLog('  add <sku> <qty> [reason]              Receipt stock in (e.g. add STAT-009 10 "New delivery")', 'list');
        appendLog('  issue <sku> <qty> <dept> [reason]     Issue stock out to a department (e.g. issue STAT-012 2 ENG "Admin print")', 'list');
        appendLog('  set-reorder <sku> <level>             Modify reorder point threshold limits', 'list');
        appendLog('  clear                                 Clear terminal logs screener', 'list');
        appendLog('----------------------------------------------------', 'list');
        break;
      }

      case 'clear': {
        setTerminalLogs([]);
        break;
      }

      case 'list': {
        appendLog('----------------- ACTIVE REGISTER -----------------', 'list');
        catalog.forEach(item => {
          const isLow = item.availableQuantity <= item.reorderLevel;
          const label = `${item.id.padEnd(9)} | Qty: ${String(item.availableQuantity).padEnd(4)} | ${isLow ? '🚨 LOW ' : 'OK    '} | ${item.name.substring(0, 32)}`;
          appendLog(label, isLow ? 'error' : 'success');
        });
        appendLog(`Total SKUs listed: ${catalog.length}`, 'info');
        break;
      }

      case 'lookup': {
        if (cmdArgs.length < 1) {
          appendLog('ERROR: "lookup" command requires SKU value. Syntax: lookup <sku>', 'error');
          break;
        }
        const sku = cmdArgs[0].toUpperCase();
        const item = catalog.find(i => i.id.toUpperCase() === sku);
        if (!item) {
          appendLog(`ERROR: Item code "${sku}" not found in stores directory.`, 'error');
          break;
        }
        setSelectedSku(item.id);
        appendLog(`SUCCESS: Target loaded! Viewing bin card for ${item.name} (${item.id}).`, 'success');
        appendLog(`  Category: ${item.category} | Unit Cost: ${formatCurrency(item.unitCost)}`, 'list');
        appendLog(`  Available stock: ${item.availableQuantity} units (Reorder limit: ${item.reorderLevel} units)`, 'list');
        break;
      }

      case 'add': {
        if (cmdArgs.length < 2) {
          appendLog('ERROR: "add" command requires SKU and Quantity. Syntax: add <sku> <qty> [reason]', 'error');
          break;
        }
        const sku = cmdArgs[0].toUpperCase();
        const qty = parseInt(cmdArgs[1], 10);
        const reason = cmdArgs[2] || 'Manual CMD replenishment receipt';

        if (isNaN(qty) || qty <= 0) {
          appendLog(`ERROR: Amount "${cmdArgs[1]}" must be a positive integer.`, 'error');
          break;
        }

        const item = catalog.find(i => i.id.toUpperCase() === sku);
        if (!item) {
          appendLog(`ERROR: Item SKU code "${sku}" is unrecognized.`, 'error');
          break;
        }

        // Post transaction
        const newTxnId = `TXN-CMD-IN-${Date.now()}`;
        const newTxn: InventoryTransaction = {
          id: newTxnId,
          itemId: item.id,
          type: 'stock_in',
          quantity: qty,
          reason,
          createdAt: new Date().toISOString(),
          userId: currentUser.id
        };

        // Update state
        setCatalog(prev => prev.map(c => c.id === item.id ? { ...c, availableQuantity: c.availableQuantity + qty } : c));
        setTransactions(prev => [newTxn, ...prev]);

        // Audit Log
        setAuditLogs(prev => [
          createAuditLog(currentUser, 'CMD_STOCK_IN_RECEIPT', `CLI Command "add" added ${qty} units to ${item.name} (${item.id}). Reason: ${reason}`),
          ...prev
        ]);

        appendLog(`SUCCESS: Received ${qty} unit(s) of ${item.name} into stock ledger.`, 'success');
        appendLog(`  SKU: ${item.id} | Incremented Quantity: +${qty} | New Balance: ${item.availableQuantity + qty} units.`, 'success');
        
        // Auto select item
        setSelectedSku(item.id);
        break;
      }

      case 'issue': {
        if (cmdArgs.length < 3) {
          appendLog('ERROR: "issue" command requires SKU, Qty and Department. Syntax: issue <sku> <qty> <dept> [reason]', 'error');
          break;
        }
        const sku = cmdArgs[0].toUpperCase();
        const qty = parseInt(cmdArgs[1], 10);
        const deptToken = cmdArgs[2].toUpperCase();
        const reason = cmdArgs[3] || `CLI Issue transaction to ${deptToken}`;

        if (isNaN(qty) || qty <= 0) {
          appendLog(`ERROR: Issue amount "${cmdArgs[1]}" must be a positive integer.`, 'error');
          break;
        }

        const item = catalog.find(i => i.id.toUpperCase() === sku);
        if (!item) {
          appendLog(`ERROR: Item SKU code "${sku}" is unrecognized.`, 'error');
          break;
        }

        if (item.availableQuantity < qty) {
          appendLog(`WARNING: Dispatched volume (${qty}) exceeds active stockroom levels (${item.availableQuantity} left).`, 'error');
          appendLog(`  Command bypassed stock check. Performing partial drawdown...`, 'info');
        }

        // Verify representative department
        let deptName = deptToken;
        const matchingDept = departments.find(d => d.code.toUpperCase() === deptToken || d.name.toUpperCase().includes(deptToken));
        if (matchingDept) {
          deptName = matchingDept.name;
        }

        // Post stock out transaction (negative quantity represents store outgoing issue)
        const newTxnId = `TXN-CMD-OUT-${Date.now()}`;
        const newTxn: InventoryTransaction = {
          id: newTxnId,
          itemId: item.id,
          type: 'stock_out',
          quantity: -qty,
          reason: `Departmental Issue (${deptName}): ${reason}`,
          createdAt: new Date().toISOString(),
          userId: currentUser.id
        };

        // Update state
        setCatalog(prev => prev.map(c => c.id === item.id ? { ...c, availableQuantity: Math.max(0, c.availableQuantity - qty) } : c));
        setTransactions(prev => [newTxn, ...prev]);

        // Audit Log
        setAuditLogs(prev => [
          createAuditLog(currentUser, 'CMD_STOCK_OUT_ISSUE', `CLI Command "issue" dispatched ${qty} units of ${item.name} (${item.id}) to ${deptName}. Reason: ${reason}`),
          ...prev
        ]);

        appendLog(`SUCCESS: Dispatched ${qty} unit(s) of ${item.name} and debited stores.`, 'success');
        appendLog(`  Department: ${deptName} | SKU: ${item.id} | Deducted: -${qty} | Remaining Balance: ${Math.max(0, item.availableQuantity - qty)} units.`, 'success');
        
        // Auto select item to show bin card change
        setSelectedSku(item.id);
        break;
      }

      case 'set-reorder': {
        if (cmdArgs.length < 2) {
          appendLog('ERROR: "set-reorder" requires SKU and new level. Syntax: set-reorder <sku> <level>', 'error');
          break;
        }
        const sku = cmdArgs[0].toUpperCase();
        const level = parseInt(cmdArgs[1], 10);

        if (isNaN(level) || level < 0) {
          appendLog(`ERROR: Threshold point level must be a non-negative integer.`, 'error');
          break;
        }

        const item = catalog.find(i => i.id.toUpperCase() === sku);
        if (!item) {
          appendLog(`ERROR: SKU "${sku}" not found.`, 'error');
          break;
        }

        setCatalog(prev => prev.map(c => c.id === item.id ? { ...c, reorderLevel: level } : c));
        
        // Audit
        setAuditLogs(prev => [
          createAuditLog(currentUser, 'CMD_CONFIG_ADJUSTED', `CLI Command adjusted reorder limits for SKU ${item.id} to: ${level}`),
          ...prev
        ]);

        appendLog(`SUCCESS: Modified bounds for ${item.name} (${item.id}).`, 'success');
        appendLog(`  Old threshold point: ${item.reorderLevel} -> New trigger point: ${level} units.`, 'success');
        break;
      }

      default: {
        appendLog(`ERROR: Unrecognized instruction "${command}". Type "help" to list valid syntax guidelines.`, 'error');
        break;
      }
    }

    setTerminalInput('');
  };

  // Handle command history up/down navigation keys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex < commandHistory.length) {
        setHistoryIndex(nextIndex);
        setTerminalInput(commandHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const prevIndex = historyIndex - 1;
      if (prevIndex >= 0) {
        setHistoryIndex(prevIndex);
        setTerminalInput(commandHistory[prevIndex]);
      } else {
        setHistoryIndex(-1);
        setTerminalInput('');
      }
    }
  };

  // Helper macro injection to save user typing
  const runMacro = (cmd: string) => {
    setTerminalInput(cmd);
    terminalInputRef.current?.focus();
  };

  // Printing single card as receipts ledger action
  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div id="bin-card-cmd-panel" className="space-y-6">
      {/* Visual Section Introduction Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-indigo-120">
              Departmental Asset Auditing
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-600" />
            Stores Bin Card & CLI Command Utility
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl font-semibold">
            Manage physical stock bin cards directly via text instructions. Real-time logging of receipts and departmental allocations specifically for IT gear (laptops, power chargers, mice) and Admin stationery (toner cartridges, printing reams, envelopes).
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handlePrintCard}
            className="px-3 py-2 bg-slate-55 text-slate-700 hover:bg-slate-100 border border-slate-220 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print Card
          </button>
        </div>
      </div>

      {/* Main Grid: Item Selection and Bin Card Ledger Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Items selector listing (IT and Admin filtered) */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
              Stockroom Catalog Items
            </h3>
            
            {/* Search box filters list */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU or item name..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-xs py-2 pl-9 pr-4 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold text-slate-700"
              />
            </div>

            {/* Filter buttons by category */}
            <div className="flex flex-wrap gap-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'All' ? 'All Items' : cat}
                </button>
              ))}
            </div>

            {/* Items list list items selection */}
            <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100 pr-1">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  No matching items filtered.
                </div>
              ) : (
                filteredItems.map(item => {
                  const isSelected = item.id === selectedSku;
                  const isLow = item.availableQuantity <= item.reorderLevel;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedSku(item.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer border mt-1 ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-200 shadow-2xs'
                          : 'bg-transparent border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10.5px] font-black text-slate-500">
                            {item.id}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                            isLow 
                              ? 'bg-rose-50 text-rose-600 border border-rose-150 animate-pulse'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {isLow ? `${item.availableQuantity} Low` : `${item.availableQuantity} stock`}
                          </span>
                        </div>
                        <p className={`text-xs font-bold truncate mt-0.5 ${isSelected ? 'text-slate-800' : 'text-slate-700'}`}>
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold truncate leading-3 mt-0.5">
                          {item.category}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Quick macro instructions panel */}
          <div className="bg-slate-900 text-slate-300 rounded-3xl p-4 shadow-sm border border-slate-820 flex flex-col gap-2.5">
            <h4 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Quick Console CMD Macros
            </h4>
            <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed">
              Click any sample line below to load the template command in the terminal prompt input directly:
            </p>
            <div className="space-y-1.5 text-xs font-mono">
              <button
                onClick={() => runMacro('help')}
                className="w-full text-left p-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-lg hover:text-indigo-300 transition-all font-semibold flex items-center justify-between group"
              >
                <span>help</span>
                <ChevronRight className="w-3 h-3 text-slate-505 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => runMacro('list')}
                className="w-full text-left p-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-lg hover:text-indigo-300 transition-all font-semibold flex items-center justify-between group"
              >
                <span>list</span>
                <ChevronRight className="w-3 h-3 text-slate-505 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => runMacro('lookup STAT-009')}
                className="w-full text-left p-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-lg hover:text-indigo-300 transition-all font-semibold flex items-center justify-between group"
              >
                <span>lookup STAT-009</span>
                <ChevronRight className="w-3 h-3 text-slate-505 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => runMacro('add STAT-009 5 "Weekly IT procurement"')}
                className="w-full text-left p-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-lg hover:text-indigo-300 transition-all font-semibold flex items-center justify-between group"
              >
                <span className="truncate">add STAT-009 5 "New IT Stock"</span>
                <ChevronRight className="w-3 h-3 text-slate-505 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => runMacro('issue STAT-012 2 ENG "Admin copy printing"')}
                className="w-full text-left p-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-lg hover:text-indigo-300 transition-all font-semibold flex items-center justify-between group"
              >
                <span className="truncate">issue STAT-012 2 ENG "Office printer"</span>
                <ChevronRight className="w-3 h-3 text-slate-505 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => runMacro('set-reorder STAT-011 5')}
                className="w-full text-left p-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-lg hover:text-indigo-300 transition-all font-semibold flex items-center justify-between group"
              >
                <span>set-reorder STAT-011 5</span>
                <ChevronRight className="w-3 h-3 text-slate-505 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Visual Bin Card physical sheets */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
          {/* BIN CARD SHEET DESIGN */}
          <div id="physical-bin-card-ledger" className="bg-white border-2 border-slate-300 rounded-3xl p-6 shadow-xs relative print:border-none print:shadow-none print:p-0">
            {/* Header watermarks & visual binder strip */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-indigo-650 rounded-t-x5 border-b border-indigo-750 print:hidden" />
            
            {/* Real Bin Card Document Layout */}
            <div className="pt-2 text-slate-850">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b-2 border-slate-200 pb-4 mb-4 gap-2">
                <div>
                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                    Form Store Ledger-22
                  </span>
                  <h3 className="text-md font-extrabold text-slate-800 uppercase tracking-tight mt-1 font-mono">
                    PHYSICAL STORES BIN CARD LEDGER
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono tracking-widest mt-0.5">
                    STORES LOCATION SECTION: SHELF PARTITION D-12
                  </p>
                </div>
                <div className="text-left md:text-right font-mono">
                  <p className="text-xs font-semibold text-slate-400">LEDGER CARD SKU</p>
                  <p className="text-lg font-black text-slate-850 tracking-tight leading-4">
                    {activeItem.id}
                  </p>
                </div>
              </div>

              {/* Item Info Detail Blocks Matrix inside the card document */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs mb-4">
                <div className="space-y-0.5 font-mono">
                  <span className="text-[9.5px] text-slate-400 uppercase font-bold leading-3">Description Name</span>
                  <p className="font-extrabold text-slate-800 truncate" title={activeItem.name}>
                    {activeItem.name}
                  </p>
                </div>
                <div className="space-y-0.5 font-mono">
                  <span className="text-[9.5px] text-slate-400 uppercase font-bold">Product Category</span>
                  <p className="font-extrabold text-slate-800 truncate">
                    {activeItem.category}
                  </p>
                </div>
                <div className="space-y-0.5 font-mono">
                  <span className="text-[9.5px] text-slate-400 uppercase font-bold">Standard Unit Cost</span>
                  <p className="font-extrabold text-slate-800 font-sans">
                    {formatCurrency(activeItem.unitCost)}
                  </p>
                </div>
                <div className="space-y-0.5 font-mono">
                  <span className="text-[9.5px] text-slate-400 uppercase font-bold">Reorder Safety Level</span>
                  <p className="font-extrabold text-slate-800">
                    {activeItem.reorderLevel} units
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs mb-6">
                <div className="space-y-0.5 font-mono">
                  <span className="text-[9.5px] text-slate-400 uppercase font-bold">Supplier Vendor</span>
                  <p className="font-semibold text-slate-700 truncate">
                    {activeItem.vendorName || 'General Sourcing Ltd'}
                  </p>
                </div>
                <div className="space-y-0.5 font-mono">
                  <span className="text-[9.5px] text-slate-400 uppercase font-bold">Storage Bin Location</span>
                  <p className="font-semibold text-slate-700">
                    {activeItem.id.endsWith('9') || activeItem.id.endsWith('1') ? 'IT Drawer B-3' : 'Admin Vault Box A-5'}
                  </p>
                </div>
                <div className="space-y-0.5 font-mono">
                  <span className="text-[9.5px] text-slate-400 uppercase font-bold">Status Alerts</span>
                  <div>
                    {activeItem.availableQuantity <= activeItem.reorderLevel ? (
                      <span className="text-[9.5px] text-red-600 bg-red-50 border border-red-150 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider animate-pulse flex items-center gap-1 w-max">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Critically Low Stock
                      </span>
                    ) : (
                      <span className="text-[9.5px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1 w-max">
                        <CheckCircle className="w-3 h-3 shrink-0" />
                        Level Satisfied
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-0.5 font-mono">
                  <span className="text-[9.5px] text-indigo-500 uppercase font-black">STORES BALANCE ON-HAND</span>
                  <p className="text-sm font-extrabold text-indigo-600">
                    {activeItem.availableQuantity} units
                  </p>
                </div>
              </div>

              {/* Transactions Ledger Table Sheet inside Card */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-500 text-[10.5px] font-bold uppercase font-mono border-b border-slate-200">
                      <th className="p-3 pl-4">Audited Date</th>
                      <th className="p-3">Doc Voucher Ref</th>
                      <th className="p-3">Operation Details</th>
                      <th className="p-3 text-center w-20">In Receipts</th>
                      <th className="p-3 text-center w-20">Out Issues</th>
                      <th className="p-3 text-center bg-indigo-50 text-indigo-800 w-24">Running Bal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    <tr className="hover:bg-slate-25 font-mono text-slate-400">
                      <td className="p-3 pl-4">01 Jan 2026</td>
                      <td className="p-3">LEDGER-INIT</td>
                      <td className="p-3 italic text-[11px] font-medium">Standard starting entry physical level balance</td>
                      <td className="p-3 text-center font-bold text-slate-400">-</td>
                      <td className="p-3 text-center font-bold text-slate-400">-</td>
                      <td className="p-3 text-center font-bold bg-indigo-50/40 text-slate-600 border-l border-indigo-120">
                        {binCardRows.length > 0 
                          ? Math.max(0, activeItem.availableQuantity - binCardRows.reduce((sum, item) => sum + item.quantity, 0))
                          : activeItem.availableQuantity
                        } units
                      </td>
                    </tr>
                    
                    {binCardRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold italic bg-slate-25/50">
                          No post-initial transactions registered for this stock bin card.
                        </td>
                      </tr>
                    ) : (
                      binCardRows.map((row) => {
                        const isIn = row.quantity > 0;
                        const dateFormatted = formatDate(row.createdAt);
                        return (
                          <tr key={row.id} className="hover:bg-slate-25 transition-colors font-mono font-medium text-slate-700">
                            <td className="p-3 pl-4 text-[11px] text-slate-450 leading-tight">
                              {dateFormatted.split(',')[0]}
                              <span className="block text-[9.5px] text-slate-350">{dateFormatted.split(',')[1]}</span>
                            </td>
                            <td className="p-3 font-bold truncate max-w-[110px] text-[11px] text-slate-500" title={row.id}>
                              {row.id.startsWith('TXN-CMD-') ? 'CLI-COMMAND' : row.id.substring(0, 12)}
                            </td>
                            <td className="p-3 max-w-[150px] md:max-w-xs text-slate-600 truncate text-[11px]" title={row.reason}>
                              {row.reason}
                            </td>
                            <td className="p-3 text-center font-extrabold text-emerald-600 text-[12px] bg-emerald-25/30">
                              {isIn ? `+${row.quantity}` : '-'}
                            </td>
                            <td className="p-3 text-center font-extrabold text-rose-500 text-[12px] bg-rose-25/20">
                              {!isIn ? Math.abs(row.quantity) : '-'}
                            </td>
                            <td className="p-3 text-center font-extrabold bg-indigo-50 text-indigo-700 text-[12px] border-l border-indigo-150">
                              {row.runningBalance} units
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* THE CLI CMD TERMINAL ELEMENT */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col gap-4 text-slate-100 relative">
            {/* Visual Header Macos buttons design style */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[10px] font-mono text-slate-450 ml-2 uppercase font-black tracking-widest">
                  Vetiva-Stores-Terminal@CLI
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTerminalLogs([])}
                  className="p-1 px-2.5 text-[10px] font-extrabold font-mono text-slate-400 bg-slate-850 hover:bg-slate-800 hover:text-white rounded-lg transition-colors border border-slate-800 cursor-pointer"
                  title="Wipe terminal logging trails"
                >
                  CLEAR
                </button>
              </div>
            </div>

            {/* Scrollable Output Screen logs panel */}
            <div className="h-[210px] overflow-y-auto font-mono text-[11.5px] leading-relaxed space-y-2 pr-1.5 select-text selection:bg-indigo-900 selection:text-white">
              {terminalLogs.map((log) => {
                const getLogStyle = () => {
                  switch (log.type) {
                    case 'error': return 'text-rose-400';
                    case 'success': return 'text-emerald-400';
                    case 'input': return 'text-indigo-300';
                    case 'list': return 'text-slate-350';
                    default: return 'text-blue-300';
                  }
                };
                return (
                  <div key={log.id} className={`flex items-start gap-1 ${getLogStyle()}`}>
                    <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className="whitespace-pre-wrap flex-1">{log.text}</span>
                  </div>
                );
              })}
              <div ref={terminalLogsEndRef} />
            </div>

            {/* Command-Line Prompt Input */}
            <form onSubmit={handleExecuteCommand} className="flex items-center gap-2.5 border-t border-slate-800 pt-3 mt-1">
              <span className="text-indigo-400 font-mono font-black text-xs select-none">CMD &gt;</span>
              <input
                ref={terminalInputRef}
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type 'help' for support list, or inputs..."
                className="flex-1 bg-transparent border-none font-mono text-[12px] text-white focus:outline-none focus:ring-0 select-text p-1.5 h-8 placeholder-slate-650"
                autoComplete="off"
                autoFocus
              />
              <button
                type="submit"
                className="p-1.5 pr-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-mono text-[11px] font-black rounded-lg transition-all flex items-center gap-1.5 select-none shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                EXEC
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
