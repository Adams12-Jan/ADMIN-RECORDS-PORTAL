import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Plus,
  Shield,
  Search,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Send,
  DollarSign,
  Paperclip,
  ChevronRight,
  User,
  Filter,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Memo, MemoStage, User as AppUser, Department, MemoHistoryEntry } from '../types';

interface MemoHubSectionProps {
  currentUser: AppUser;
  memos: Memo[];
  users: AppUser[];
  departments: Department[];
  onAddMemo: (memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => Promise<void>;
  onUpdateMemo: (memo: Memo) => Promise<void>;
  onImpersonateUser: (user: AppUser) => void;
}

export default function MemoHubSection({
  currentUser,
  memos,
  users,
  departments,
  onAddMemo,
  onUpdateMemo,
  onImpersonateUser
}: MemoHubSectionProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Create Form States
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [justification, setJustification] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [attachmentName, setAttachmentName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Approval comments
  const [approvalComments, setApprovalComments] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Helper mapping the tiers and expected roles/users for testing
  const WORKFLOW_STAGES = [
    {
      stage: 'pending_head_admin' as MemoStage,
      label: 'Head of Admin',
      actorRole: 'approver',
      expectedUserEmail: 'david@corporate.com',
      expectedUserName: 'David Vance',
      description: 'First screening for administrative compliance'
    },
    {
      stage: 'pending_internal_control' as MemoStage,
      label: 'Internal Control',
      expectedUserEmail: 'alex@corporate.com',
      expectedUserName: 'Alex Carter',
      actorRole: 'admin',
      description: 'Audit auditing and fraud prevention compliance'
    },
    {
      stage: 'pending_md' as MemoStage,
      label: 'Managing Director',
      expectedUserEmail: 'sam@corporate.com',
      expectedUserName: 'Samantha Sterling',
      actorRole: 'super_admin',
      description: 'Executive director commercial sign-off'
    },
    {
      stage: 'pending_finance' as MemoStage,
      label: 'Finance Department',
      expectedUserEmail: 'sarah@corporate.com',
      expectedUserName: 'Sarah Jenkins',
      actorRole: 'approver', // Finance Approver head
      description: 'Disbursement of funds and ledger posting'
    }
  ];

  const getStageUser = (stage: MemoStage): AppUser | undefined => {
    switch (stage) {
      case 'pending_head_admin':
        return users.find(u => u.email === 'david@corporate.com');
      case 'pending_internal_control':
        return users.find(u => u.email === 'alex@corporate.com');
      case 'pending_md':
        return users.find(u => u.email === 'sam@corporate.com') || users.find(u => u.role === 'super_admin');
      case 'pending_finance':
        return users.find(u => u.email === 'sarah@corporate.com') || users.find(u => u.departmentId === 'DEPT-FIN');
      default:
        return undefined;
    }
  };

  const getStageLabel = (stage: MemoStage) => {
    switch (stage) {
      case 'draft': return 'Draft Saved';
      case 'pending_head_admin': return 'Pending Head of Admin';
      case 'pending_internal_control': return 'Pending Internal Control';
      case 'pending_md': return 'Pending Managing Director';
      case 'pending_finance': return 'Pending Finance Release';
      case 'completed': return 'Approved & Completed';
      case 'rejected': return 'Memo Rejected';
      default: return stage;
    }
  };

  const handlesDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handlesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAttachmentName(e.dataTransfer.files[0].name);
    }
  };

  const handleSimulateFileSelect = () => {
    const templates = [
      'Procurement_Invoice_V7.pdf',
      'Operations_Requisition_Signoff.pdf',
      'Vendor_Agreement_Vetiva_2026.pdf',
      'Finance_Cost_Matrix_v2.xls'
    ];
    const randomName = templates[Math.floor(Math.random() * templates.length)];
    setAttachmentName(randomName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setIsSubmittingAction(true);
      await onAddMemo({
        title,
        content,
        initiatorId: currentUser.id,
        initiatorName: currentUser.fullName,
        initiatorEmail: currentUser.email,
        departmentId: currentUser.departmentId,
        amount: Number(amount) || 0,
        currentStage: 'pending_head_admin', // Automates start of workflow
        attachmentName: attachmentName || undefined,
        justification: justification || undefined
      });

      // Clear states
      setTitle('');
      setContent('');
      setAmount(0);
      setJustification('');
      setAttachmentName('');
      setIsCreating(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleWorkflowAction = async (memo: Memo, action: 'approve' | 'reject') => {
    setIsSubmittingAction(true);
    try {
      let nextStage: MemoStage = memo.currentStage;

      if (action === 'approve') {
        if (memo.currentStage === 'pending_head_admin') {
          nextStage = 'pending_internal_control';
        } else if (memo.currentStage === 'pending_internal_control') {
          nextStage = 'pending_md';
        } else if (memo.currentStage === 'pending_md') {
          nextStage = 'pending_finance';
        } else if (memo.currentStage === 'pending_finance') {
          nextStage = 'completed';
        }
      } else {
        nextStage = 'rejected';
      }

      const stepHistoryEntry: MemoHistoryEntry = {
        id: `STEP-${Date.now()}`,
        stage: memo.currentStage,
        action: action === 'approve' ? 'approve' : 'reject',
        userId: currentUser.id,
        userFullName: currentUser.fullName,
        userRole: currentUser.role,
        comments: approvalComments || (action === 'approve' ? 'Approved and forwarded.' : 'Memo rejected.'),
        timestamp: new Date().toISOString()
      };

      const updatedHistory = [...memo.history, stepHistoryEntry];
      const updatedMemo: Memo = {
        ...memo,
        currentStage: nextStage,
        history: updatedHistory,
        updatedAt: new Date().toISOString()
      };

      await onUpdateMemo(updatedMemo);
      setApprovalComments('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Logic to calculate if current user can approve current stage
  const selectedMemo = memos.find(m => m.id === selectedMemoId);
  
  const canUserApproveCurrentStage = (memo: Memo): boolean => {
    const stage = memo.currentStage;
    if (stage === 'completed' || stage === 'rejected' || stage === 'draft') return false;

    // Check if the current user matches the expected email/department/role for the active stage
    if (stage === 'pending_head_admin') {
      // Head Of Admin - Represented by David Vance (email david@corporate.com)
      return currentUser.email === 'david@corporate.com' || currentUser.role === 'admin' || currentUser.role === 'super_admin';
    }
    if (stage === 'pending_internal_control') {
      // Internal Control - Alex Carter (email alex@corporate.com)
      return currentUser.email === 'alex@corporate.com' || currentUser.role === 'admin' || currentUser.role === 'super_admin';
    }
    if (stage === 'pending_md') {
      // Managing Director - Samantha Sterling (email sam@corporate.com)
      return currentUser.email === 'sam@corporate.com' || currentUser.role === 'super_admin';
    }
    if (stage === 'pending_finance') {
      // Finance Department - Sarah Jenkins or Finance Dept head
      return currentUser.email === 'sarah@corporate.com' || currentUser.departmentId === 'DEPT-FIN' || currentUser.role === 'super_admin';
    }
    return false;
  };

  // Filtrations
  const filteredMemos = memos.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.initiatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : m.currentStage === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Overview stats header */}
      <div className="bg-gradient-to-r from-slate-900 to-[#1d1b4c] border border-slate-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div id="memo-decoration-dot" className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-orange-500 text-white rounded text-[10px] uppercase font-bold tracking-widest">Core Automation</span>
              <span className="text-xs text-indigo-200">5-Tier Memo Suite</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Automated Memo Approvals</h1>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl">
              Initiate, screen, audit, and finalize administrative and expenditure memos seamlessly. 
              The sequential workflow triggers context-based assignments, complete with real-time Firestore replication.
            </p>
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow transition-all self-start md:self-center"
          >
            <Plus className="w-4 h-4" />
            INITIATE MEMO
          </button>
        </div>

        {/* Core dynamic statistics container */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 border-t border-slate-800/80 pt-6">
          <div className="bg-slate-900/60 p-4 border border-slate-800/60 rounded-xl">
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold">Active Memos</p>
            <p className="text-2xl font-black text-white mt-1">
              {memos.filter(m => m.currentStage !== 'completed' && m.currentStage !== 'rejected').length}
            </p>
          </div>
          <div className="bg-slate-900/60 p-4 border border-slate-800/60 rounded-xl">
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold">Tasks For Active Role</p>
            <p className="text-2xl font-black text-amber-400 mt-1">
              {memos.filter(m => m.currentStage !== 'completed' && m.currentStage !== 'rejected' && canUserApproveCurrentStage(m)).length}
            </p>
          </div>
          <div className="bg-slate-900/60 p-4 border border-slate-800/60 rounded-xl">
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold">Completed & Disbursed</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {memos.filter(m => m.currentStage === 'completed').length}
            </p>
          </div>
          <div className="bg-slate-900/60 p-4 border border-slate-800/60 rounded-xl">
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold">Rejected</p>
            <p className="text-2xl font-black text-rose-450 mt-1">
              {memos.filter(m => m.currentStage === 'rejected').length}
            </p>
          </div>
        </div>
      </div>

      {/* Main split work layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Memo Lists & Filters */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#1E1B4B] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search memos by code, title, initiator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">⚡ All Stages</option>
                <option value="pending_head_admin">Pending Head of Admin</option>
                <option value="pending_internal_control">Pending Internal Control</option>
                <option value="pending_md">Pending Managing Director</option>
                <option value="pending_finance">Pending Finance</option>
                <option value="completed">Completed & Approved</option>
                <option value="rejected">Rejected Only</option>
              </select>
            </div>

            {/* List entries */}
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredMemos.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-bold">No memos found matching selected filter criteria</p>
                </div>
              ) : (
                filteredMemos.map((memo) => {
                  const isSelected = selectedMemoId === memo.id;
                  const isPendingUser = canUserApproveCurrentStage(memo);
                  return (
                    <div
                      key={memo.id}
                      onClick={() => {
                        setSelectedMemoId(memo.id);
                        setIsCreating(false);
                      }}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{memo.id}</p>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 mt-0.5 line-clamp-1">{memo.title}</h4>
                        </div>
                        {memo.amount > 0 && (
                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                            ₦{memo.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                            {memo.initiatorName.charAt(0)}
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">Initiator: {memo.initiatorName}</span>
                        </div>

                        {/* Workflow status badge */}
                        <div className="flex items-center gap-1">
                          {isPendingUser && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Requires your action!" />
                          )}
                          <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase ${
                            memo.currentStage === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : memo.currentStage === 'rejected'
                              ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-800'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                          }`}>
                            {getStageLabel(memo.currentStage).replace('Pending ', '')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Core visual aid: Simulation guidelines / switcher cheat sheet */}
          <div className="bg-gradient-to-br from-[#10182D] to-indigo-950 border border-slate-800 p-4 rounded-2xl text-white">
            <div className="flex items-center gap-2 mb-2 text-indigo-300">
              <Shield className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-black uppercase tracking-wider">Approval Path Simulator</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              To test the automated workflow progression, click the quick-login switches below to transition roles and authorize steps instantly:
            </p>

            <div className="space-y-2">
              <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/85 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Tier 1: Admin Assistant (Emily)</p>
                  <p className="text-[10px] font-black text-slate-200">Emily Thorne (Initiator)</p>
                </div>
                <button
                  onClick={() => {
                    const user = users.find(u => u.email === 'emily@corporate.com');
                    if (user) onImpersonateUser(user);
                  }}
                  className={`px-2 py-1 text-[9.5px] font-bold rounded cursor-pointer border ${
                    currentUser.email === 'emily@corporate.com'
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {currentUser.email === 'emily@corporate.com' ? 'Active ✓' : 'Login'}
                </button>
              </div>

              <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/85 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Tier 2: Head of Admin (David)</p>
                  <p className="text-[10px] font-black text-slate-200">David Vance (Approver)</p>
                </div>
                <button
                  onClick={() => {
                    const user = users.find(u => u.email === 'david@corporate.com');
                    if (user) onImpersonateUser(user);
                  }}
                  className={`px-2 py-1 text-[9.5px] font-bold rounded cursor-pointer border ${
                    currentUser.email === 'david@corporate.com'
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {currentUser.email === 'david@corporate.com' ? 'Active ✓' : 'Login'}
                </button>
              </div>

              <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/85 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Tier 3: Internal Control (Alex)</p>
                  <p className="text-[10px] font-black text-slate-200">Alex Carter (Auditor)</p>
                </div>
                <button
                  onClick={() => {
                    const user = users.find(u => u.email === 'alex@corporate.com');
                    if (user) onImpersonateUser(user);
                  }}
                  className={`px-2 py-1 text-[9.5px] font-bold rounded cursor-pointer border ${
                    currentUser.email === 'alex@corporate.com'
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {currentUser.email === 'alex@corporate.com' ? 'Active ✓' : 'Login'}
                </button>
              </div>

              <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/85 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Tier 4: Managing Director (Samantha)</p>
                  <p className="text-[10px] font-black text-slate-200">Samantha Sterling (MD)</p>
                </div>
                <button
                  onClick={() => {
                    const user = users.find(u => u.email === 'sam@corporate.com');
                    if (user) onImpersonateUser(user);
                  }}
                  className={`px-2 py-1 text-[9.5px] font-bold rounded cursor-pointer border ${
                    currentUser.email === 'sam@corporate.com'
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {currentUser.email === 'sam@corporate.com' ? 'Active ✓' : 'Login'}
                </button>
              </div>

              <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/85 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Tier 5: Finance (Sarah)</p>
                  <p className="text-[10px] font-black text-slate-200">Sarah Jenkins (Disbursement)</p>
                </div>
                <button
                  onClick={() => {
                    const user = users.find(u => u.email === 'sarah@corporate.com');
                    if (user) onImpersonateUser(user);
                  }}
                  className={`px-2 py-1 text-[9.5px] font-bold rounded cursor-pointer border ${
                    currentUser.email === 'sarah@corporate.com'
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {currentUser.email === 'sarah@corporate.com' ? 'Active ✓' : 'Login'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Initiation Form or Detailed Step Stepper Tracker */}
        <div className="lg:col-span-7">
          {isCreating ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1E1B4B] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6"
            >
              <div className="border-b border-slate-100 dark:border-slate-800/85 pb-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Initiate Commercial Memo / Requisition Voucher
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Draft an administrative proposal or requisition requesting funding or sign-off. Initiating starts the sequential approval route.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Subject Title */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider mb-1.5">
                    Memo Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Purchase of Admin Consumables & High-Yield Cartridges"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Estimated cost */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider mb-1.5">
                      Memo Requisition Cost (₦)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">₦</div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount || ''}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full text-xs pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider mb-1.5">
                      Urgency/Priority Level
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                    >
                      <option value="low">☕ Low (Routine Administrative)</option>
                      <option value="medium">⚡ Medium (Operational Standard)</option>
                      <option value="high">🔥 High (Immediate / Urgent Commercial)</option>
                    </select>
                  </div>
                </div>

                {/* Content body */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider mb-1.5">
                    Memo Subject / Proposals Content *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Provide a detailed administrative description, item breakdowns, pricing calculations, reasons, and objectives..."
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Justification */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider mb-1.5">
                    Business Impact / Procurement Justification
                  </label>
                  <input
                    type="text"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="e.g. Critical for enabling daily printing needs in Operations, Finance and Execution rooms."
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Drag and Drop Attachment */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider mb-1.5">
                    Support Documents / Expenditure Invoice
                  </label>
                  <div
                    onDragEnter={handlesDrag}
                    onDragLeave={handlesDrag}
                    onDragOver={handlesDrag}
                    onDrop={handlesDrop}
                    className={`border border-dashed rounded-xl p-4 text-center transition-all ${
                      dragActive
                        ? 'border-indigo-500 bg-indigo-50/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {attachmentName ? (
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{attachmentName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachmentName('')}
                          className="text-xs font-bold text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Paperclip className="w-6 h-6 text-slate-350 mx-auto mb-1" />
                        <p className="text-[11px] text-slate-500 font-semibold mb-1">
                          Drag and drop support receipts here or select a template file
                        </p>
                        <button
                          type="button"
                          onClick={handleSimulateFileSelect}
                          className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded"
                        >
                          ⚡ Attach mock invoice file
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions submit/cancel */}
                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAction}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmittingAction ? 'Initiating...' : 'Submit to Head of Admin'}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : selectedMemo ? (
            <motion.div
              layoutId={selectedMemo.id}
              className="bg-white dark:bg-[#1E1B4B] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6"
            >
              {/* Header Title Grid */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-mono text-slate-400">{selectedMemo.id}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      selectedMemo.currentStage === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20'
                        : selectedMemo.currentStage === 'rejected'
                        ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/20'
                    }`}>
                      {getStageLabel(selectedMemo.currentStage)}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight uppercase mt-1">
                    {selectedMemo.title}
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                    Initiated on {new Date(selectedMemo.createdAt).toLocaleString()} by <strong className="text-slate-700 dark:text-slate-300 font-bold">{selectedMemo.initiatorName}</strong>
                  </p>
                </div>

                {selectedMemo.amount > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-3 border border-slate-200/80 dark:border-slate-800/60 rounded-xl text-right sm:self-start">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-3">Approved Amount</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                      ₦{selectedMemo.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Main Contents Display */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Proposal Body & Content:</h4>
                  <div className="mt-1.5 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-150 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedMemo.content}
                  </div>
                </div>

                {selectedMemo.justification && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/40 rounded-xl">
                      <h4 className="text-[9.5px] font-black uppercase text-blue-800 dark:text-blue-300 tracking-wider">Business Impact / Justification</h4>
                      <p className="text-xs text-blue-900 dark:text-blue-300/90 mt-1 italic">
                        "{selectedMemo.justification}"
                      </p>
                    </div>

                    {selectedMemo.attachmentName && (
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Verification Attachment</h4>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block mt-0.5 flex items-center gap-1">
                            <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                            {selectedMemo.attachmentName}
                          </span>
                        </div>
                        <a href="#view" onClick={(e) => { e.preventDefault(); alert("File simulated successfully!"); }} className="text-[10.5px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                          View PDF
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AUTOMATED Workflow Step Stepper Visualization */}
              <div className="border-t border-slate-105 dark:border-slate-800/80 pt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Automated 5-Tier Sequential Approval Route
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Step 1: Initiator */}
                  <div className="flex gap-3 relative">
                    <div className="absolute left-[13px] top-[26.5px] bottom-[-24px] w-0.5 bg-emerald-500" />
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 z-10">
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">Tier 1: Initiator (Admin Assistant)</span>
                        <span className="text-[10.5px] text-slate-500 font-mono">100% COMPLETE</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Submitted by <strong className="text-slate-700 dark:text-slate-300">{selectedMemo.initiatorName}</strong> ({selectedMemo.initiatorEmail})
                      </p>
                    </div>
                  </div>

                  {/* Sequential Workflow Stages Loop */}
                  {WORKFLOW_STAGES.map((ws, idx) => {
                    // Logic to see if this stage is completed, active, or waiting
                    let stepStatus: 'completed' | 'active' | 'waiting' | 'rejected' = 'waiting';
                    const historyStep = selectedMemo.history.find(h => h.stage === ws.stage);

                    // Check if rejected
                    const isRejectedAtThisStep = selectedMemo.currentStage === 'rejected' && selectedMemo.history[selectedMemo.history.length - 1]?.stage === ws.stage;

                    if (historyStep) {
                      stepStatus = historyStep.action === 'reject' ? 'rejected' : 'completed';
                    } else if (selectedMemo.currentStage === ws.stage) {
                      stepStatus = 'active';
                    } else if (selectedMemo.currentStage === 'rejected') {
                      stepStatus = 'waiting'; // Shortcircuited
                    } else {
                      // Determine if previous stages are completed
                      const prevStages = WORKFLOW_STAGES.slice(0, idx);
                      const allPrevCompleted = prevStages.every(ps => selectedMemo.history.some(h => h.stage === ps.stage));
                      if (allPrevCompleted && selectedMemo.currentStage !== 'completed') {
                        stepStatus = 'active';
                      }
                    }

                    if (selectedMemo.currentStage === 'completed') {
                      stepStatus = 'completed';
                    }

                    // Connector line color
                    const isNextCompletedOrLast = idx === WORKFLOW_STAGES.length - 1;
                    const connectorColor = stepStatus === 'completed' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800';

                    return (
                      <div key={ws.stage} className="flex gap-3 relative">
                        {!isNextCompletedOrLast && (
                          <div className={`absolute left-[13px] top-[26.5px] bottom-[-24px] w-0.5 ${connectorColor}`} />
                        )}

                        {/* Node circle state */}
                        {stepStatus === 'completed' ? (
                          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 z-10">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : stepStatus === 'rejected' ? (
                          <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 z-10">
                            <XCircle className="w-4 h-4" />
                          </div>
                        ) : stepStatus === 'active' ? (
                          <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-center shrink-0 z-10 relative">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute" />
                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 shrink-0 z-10">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                        )}

                        {/* Detail text */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-black ${
                              stepStatus === 'active'
                                ? 'text-amber-655 font-black'
                                : stepStatus === 'completed'
                                ? 'text-slate-800 dark:text-slate-200'
                                : 'text-slate-400'
                            }`}>
                              Tier {idx + 2}: {ws.label}
                            </span>
                            <span className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              stepStatus === 'completed'
                                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
                                : stepStatus === 'rejected'
                                ? 'text-red-600 bg-red-50 dark:bg-red-950/20'
                                : stepStatus === 'active'
                                ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 animate-pulse'
                                : 'text-slate-400'
                            }`}>
                              {stepStatus === 'completed' ? 'APPROVED' : stepStatus === 'rejected' ? 'REJECTED' : stepStatus === 'active' ? 'PENDING ACTION' : 'AWAITING STAGE'}
                            </span>
                          </div>
                          
                          <p className="text-[10.5px] text-slate-500 leading-normal">
                            Assigned to: <strong className="text-slate-600 dark:text-slate-350">{getStageUser(ws.stage)?.fullName || ws.expectedUserName}</strong> ({ws.expectedUserEmail})
                          </p>

                          {/* Stage notes / comments */}
                          {historyStep ? (
                            <div className="mt-1.5 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-lg text-[11px] text-slate-600 dark:text-slate-300">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                                Comments from {historyStep.userFullName}:
                              </p>
                              "{historyStep.comments}"
                              <span className="block text-[9px] text-slate-400 font-mono mt-1 text-right">
                                {new Date(historyStep.timestamp).toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic mt-0.5">{ws.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Action decision gate */}
              {canUserApproveCurrentStage(selectedMemo) ? (
                <div className="mt-5 p-4 bg-amber-500/5 dark:bg-amber-500/2 border border-amber-500/20 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4.5 h-4.5 text-amber-500" />
                    <div>
                      <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wide">
                        Pending Actions for Corporate Role
                      </h4>
                      <p className="text-[10.5px] text-slate-560 dark:text-slate-400">
                        You have permission as <span className="font-bold text-slate-705 dark:text-slate-200">{currentUser.fullName} ({currentUser.role})</span> to complete this stage.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9.5px] font-black uppercase text-slate-500 tracking-wider mb-1">
                        Workflow Audit Comments (Optional)
                      </label>
                      <input
                        type="text"
                        value={approvalComments}
                        onChange={(e) => setApprovalComments(e.target.value)}
                        placeholder="e.g. Budget verification complete. Everything is in order."
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleWorkflowAction(selectedMemo, 'reject')}
                        disabled={isSubmittingAction}
                        className="flex-1 py-2 bg-red-650 hover:bg-red-700 hover:text-white text-white dark:hover:bg-red-750 text-xs font-bold rounded-xl border border-red-750 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Memo
                      </button>

                      <button
                        onClick={() => handleWorkflowAction(selectedMemo, 'approve')}
                        disabled={isSubmittingAction}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve & Forward
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                selectedMemo.currentStage !== 'completed' && selectedMemo.currentStage !== 'rejected' && (
                  <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-slate-400" />
                    <p className="text-[10.5px] text-slate-500">
                      Waiting for the assigned user (<strong className="text-slate-600 dark:text-slate-300">
                        {getStageUser(selectedMemo.currentStage)?.fullName || WORKFLOW_STAGES.find(w => w.stage === selectedMemo.currentStage)?.expectedUserName}
                      </strong>) to sign off on this step. Use the quick selector cheat-sheet on the left side to impersonate the current active role instantly.
                    </p>
                  </div>
                )
              )}
            </motion.div>
          ) : (
            <div className="bg-white dark:bg-[#1E1B4B] border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Select a Memo</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Pick a request memo from the list on the left to track its live 5-stage automated progress cycle, or create a new one to start.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
