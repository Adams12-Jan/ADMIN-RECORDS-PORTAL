/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  Department,
  StationeryItem,
  StationeryRequest,
  InventoryTransaction,
  AuditLog,
  AppNotification,
  SystemConfig,
  UserRole
} from './types';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_CATALOG,
  INITIAL_REQUESTS,
  INITIAL_TRANSACTIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CONFIG
} from './data/seedData';
import {
  loadState,
  saveState,
  createAuditLog,
  resolveLogoUrl
} from './utils/helpers';

// Components
import RoleSwitcher from './components/RoleSwitcher';
import DashboardOverview from './components/DashboardOverview';
import CatalogSection from './components/CatalogSection';
import RequestSection from './components/RequestSection';
import ApprovalSection from './components/ApprovalSection';
import InventorySection from './components/InventorySection';
import ReportSection from './components/ReportSection';
import SystemControlPanel from './components/SystemControlPanel';
import ProfileSection from './components/ProfileSection';

// Icons
import {
  Layers,
  LayoutDashboard,
  ShoppingBag,
  History,
  CheckSquare,
  Truck,
  TrendingUp,
  Settings,
  User as UserIcon,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  Building,
  ShieldCheck,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  // Theme Toggle Mode
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  // Load States from LocalStorage or use pre-cooked seedData
  const [users, setUsers] = useState<User[]>(() => {
    const loaded = loadState<User[]>('stationery_users', INITIAL_USERS);
    if (!loaded.some(u => u.email === 'gideonline18@gmail.com')) {
      const gideon = INITIAL_USERS.find(u => u.email === 'gideonline18@gmail.com');
      if (gideon) return [gideon, ...loaded];
    }
    return loaded;
  });
  const [departments, setDepartments] = useState<Department[]>(() => {
    const loaded = loadState<Department[]>('stationery_departments', INITIAL_DEPARTMENTS);
    if (!loaded.some(d => d.headUserId === 'USR-000')) {
      return loaded.map(d => d.id === 'DEPT-EXEC' ? { ...d, headUserId: 'USR-000' } : d);
    }
    return loaded;
  });
  const [catalog, setCatalog] = useState<StationeryItem[]>(() => loadState('stationery_catalog', INITIAL_CATALOG));
  const [requests, setRequests] = useState<StationeryRequest[]>(() => loadState('stationery_requests', INITIAL_REQUESTS));
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(() => loadState('stationery_transactions', INITIAL_TRANSACTIONS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadState('stationery_audit_logs', INITIAL_AUDIT_LOGS));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadState('stationery_notifications', INITIAL_NOTIFICATIONS));
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    const loaded = loadState<SystemConfig>('stationery_config', INITIAL_CONFIG);
    const updated = { ...loaded };
    if (!updated.portalSubtitle || updated.portalSubtitle === 'Corporate Services Portal') {
      updated.portalSubtitle = 'Vetiva Admin Services Portal';
    }
    if (!updated.portalLogoUrl || updated.portalLogoUrl === 'https://i.imgur.com/hDAdzgz.png') {
      updated.portalLogoUrl = 'https://i.imgur.com/G8yzhqN.png';
    }
    return updated;
  });

  // Current Active Impersonation User State
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUser = loadState<User | null>('stationery_active_user', null);
    const gideon = INITIAL_USERS.find(u => u.email === 'gideonline18@gmail.com') || INITIAL_USERS[0];
    
    // Auto-switch to Gideon's profile on loaded workspace to ensure immediate access
    if (!localStorage.getItem('stationery_gideon_auto_switched_v2')) {
      localStorage.setItem('stationery_gideon_auto_switched_v2', 'true');
      return gideon;
    }
    return savedUser ? savedUser : gideon;
  });

  // Current tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Sidebar toggled state for mobile views
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync to local storage on changes
  useEffect(() => {
    saveState('stationery_users', users);
  }, [users]);

  useEffect(() => {
    saveState('stationery_departments', departments);
  }, [departments]);

  useEffect(() => {
    saveState('stationery_catalog', catalog);
  }, [catalog]);

  useEffect(() => {
    saveState('stationery_requests', requests);
  }, [requests]);

  useEffect(() => {
    saveState('stationery_transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    saveState('stationery_audit_logs', auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    saveState('stationery_notifications', notifications);
  }, [notifications]);

  useEffect(() => {
    saveState('stationery_config', systemConfig);
  }, [systemConfig]);

  useEffect(() => {
    saveState('stationery_active_user', currentUser);
  }, [currentUser]);

  // Toast Stockroom check logic
  const lowStockCount = catalog.filter(i => i.status === 'active' && i.availableQuantity <= i.reorderLevel).length;

  const handleUserChange = (newUser: User) => {
    setCurrentUser(newUser);

    // Append simple audit trail log
    const audit = createAuditLog(newUser, 'USER_IMPERSONATION_LOGIN', `Impersonated and swapped session details for ${newUser.fullName}.`);
    setAuditLogs(prev => [audit, ...prev]);

    // Go back to matching dashboard
    setActiveTab('dashboard');
    setSidebarOpen(false);
  };

  // Catalog methods
  const handleAddNewItem = (newItem: StationeryItem) => {
    setCatalog(prev => [newItem, ...prev]);

    // Log transaction initial
    if (newItem.availableQuantity > 0) {
      const initialTxn: InventoryTransaction = {
        id: `TXN-NEW-${Date.now()}`,
        itemId: newItem.id,
        type: 'stock_in',
        quantity: newItem.availableQuantity,
        reason: 'Initial catalog creation stock replenishment',
        createdAt: new Date().toISOString(),
        userId: currentUser.id
      };
      setTransactions(prev => [initialTxn, ...prev]);
    }

    // Append audit
    const audit = createAuditLog(currentUser, 'CATALOG_ITEM_CREATE', `Created item code: ${newItem.id} - ${newItem.name}`);
    setAuditLogs(prev => [audit, ...prev]);
  };

  const handleUpdateItem = (updatedItem: StationeryItem) => {
    setCatalog(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));

    const audit = createAuditLog(currentUser, 'CATALOG_ITEM_UPDATE', `Modified item details for ${updatedItem.id}`);
    setAuditLogs(prev => [audit, ...prev]);
  };

  const handleDeleteItem = (id: string) => {
    setCatalog(prev => prev.filter(item => item.id !== id));

    const audit = createAuditLog(currentUser, 'CATALOG_ITEM_DELETE', `Hard-deleted item code ${id} from corporate registers.`);
    setAuditLogs(prev => [audit, ...prev]);
  };

  // Inventory transaction logger (Stock room Operations tab)
  const handlePostTransaction = (txn: Omit<InventoryTransaction, 'id' | 'createdAt' | 'userId'>) => {
    const fullTxn: InventoryTransaction = {
      ...txn,
      id: `TXN-${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: currentUser.id
    };

    setTransactions(prev => [fullTxn, ...prev]);

    // Update product quantity level
    setCatalog(prev => prev.map(item => {
      if (item.id === txn.itemId) {
        const nextQty = Math.max(0, item.availableQuantity + txn.quantity);

        // Low stock warning trigger checks
        if (nextQty <= item.reorderLevel) {
          const warnNotif: AppNotification = {
            id: `NOTIF-${Date.now()}`,
            userId: '', // broadcast
            title: 'Low stock limits breached!',
            message: `${item.name} is down to ${nextQty} units left (threshold level: ${item.reorderLevel}).`,
            type: 'warning',
            isRead: false,
            createdAt: new Date().toISOString()
          };
          setNotifications(old => [warnNotif, ...old]);
        }

        return { ...item, availableQuantity: nextQty };
      }
      return item;
    }));

    const audit = createAuditLog(currentUser, 'INVENTORY_TRANSACTION_POSTED', `Posted stock offset [${txn.quantity}] to catalog SKU: ${txn.itemId}. Reason: ${txn.reason}`);
    setAuditLogs(prev => [audit, ...prev]);
  };

  // Stationery requests submitting (Employee Workflow)
  const handleRequestSubmit = (newRequest: StationeryRequest) => {
    setRequests(prev => [newRequest, ...prev]);

    // If it is submitted, send department head a notification
    if (newRequest.status === 'submitted') {
      const parentDept = departments.find(d => d.id === newRequest.departmentId);
      const headId = parentDept ? parentDept.headUserId : '';

      const deptNotif: AppNotification = {
        id: `NOTIF-${Date.now()}`,
        userId: headId,
        title: 'New Stationery Submission Awaiting Approval',
        message: `${newRequest.userFullName} submitted request ${newRequest.id} for department sign-off.`,
        type: 'info',
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [deptNotif, ...prev]);

      const audit = createAuditLog(currentUser, 'REQUEST_SUBMITTED', `Submited stationery ticket: ${newRequest.id} for department approval.`);
      setAuditLogs(prev => [audit, ...prev]);
    } else {
      const audit = createAuditLog(currentUser, 'REQUEST_DRAFT_SAVE', `Saved draft ticket: ${newRequest.id}`);
      setAuditLogs(prev => [audit, ...prev]);
    }
  };

  const handleCancelRequest = (requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));

    const audit = createAuditLog(currentUser, 'REQUEST_CANCELLED', `Cancelled request number: ${requestId}`);
    setAuditLogs(prev => [audit, ...prev]);
  };

  // Department Sign-offs (Department head)
  const handleApprovalSubmit = (id: string, comment: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id === id) {
        // Send requester a notification
        const successNotif: AppNotification = {
          id: `NOTIF-${Date.now()}`,
          userId: r.userId,
          title: 'Stationery Request Approved',
          message: `Your request ${r.id} has been signed-off by department head ${currentUser.fullName}.`,
          type: 'success',
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(old => [successNotif, ...old]);

        // Push global admin notification
        const adminNotif: AppNotification = {
          id: `NOTIF-ADMIN-${Date.now()}`,
          userId: '', // broad admin alert
          title: 'Fulfillment queue ticket ready',
          message: `Request ${r.id} approved by department head and released for warehouse dispatch.`,
          type: 'info',
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(old => [adminNotif, ...old]);

        return {
          ...r,
          status: 'approved',
          approvalComment: comment,
          approvedByUserId: currentUser.id,
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    }));

    const audit = createAuditLog(currentUser, 'REQUEST_APPROVAL_SIGNED', `Approved request: ${id}. Comment: ${comment}`);
    setAuditLogs(prev => [audit, ...prev]);
  };

  const handleRejectSubmit = (id: string, comment: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id === id) {
        // Notif
        const rejectNotif: AppNotification = {
          id: `NOTIF-${Date.now()}`,
          userId: r.userId,
          title: 'Stationery Request Rejected',
          message: `Your request ${r.id} was rejected with comment: "${comment}"`,
          type: 'danger',
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(old => [rejectNotif, ...old]);

        return {
          ...r,
          status: 'rejected',
          approvalComment: comment,
          rejectedByUserId: currentUser.id,
          rejectedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    }));

    const audit = createAuditLog(currentUser, 'REQUEST_REJECTION_SIGNED', `Declined/Rejected request: ${id}. Comment: ${comment}`);
    setAuditLogs(prev => [audit, ...prev]);
  };

  const handleBulkApproveRequests = (ids: string[]) => {
    setRequests(prev => prev.map(r => {
      if (ids.includes(r.id)) {
        // push notification
        const successNotif: AppNotification = {
          id: `NOTIF-${Date.now() + Math.random()}`,
          userId: r.userId,
          title: 'Stationery Ticket Approved (Bulk)',
          message: `Your request ${r.id} signed off via bulk approval sequence.`,
          type: 'success',
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(old => [successNotif, ...old]);

        return {
          ...r,
          status: 'approved',
          approvalComment: 'Approved via department manager bulk sequence.',
          approvedByUserId: currentUser.id,
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    }));

    const audit = createAuditLog(currentUser, 'REQUEST_APPROVAL_BULK_SIGNED', `Processed bulk signoff approvals for tickets: ${ids.join(', ')}`);
    setAuditLogs(prev => [audit, ...prev]);
  };

  // Dispatch desk warehouse adjustments (Store Keeper Admin)
  const handleIssueRequest = (id: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id === id) {
        // Deduct associated inventory levels & log transactions
        r.items.forEach(it => {
          const deductTxn: InventoryTransaction = {
            id: `TXN-ISSUE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            itemId: it.itemId,
            type: 'stock_out',
            quantity: -it.quantity,
            referenceId: r.id,
            reason: `Issued for Request: ${r.id}`,
            createdAt: new Date().toISOString(),
            userId: currentUser.id
          };
          setTransactions(old => [deductTxn, ...old]);

          // Lower quantity from physical Catalog list
          setCatalog(oldCat => oldCat.map(catItem => {
            if (catItem.id === it.itemId) {
              const resultingQty = Math.max(0, catItem.availableQuantity - it.quantity);

              if (resultingQty <= catItem.reorderLevel) {
                const stockAlert: AppNotification = {
                  id: `NOTIF-${Date.now()}-${Math.random()}`,
                  userId: '',
                  title: 'Critical Stock Limit reached',
                  message: `${catItem.name} drops to ${resultingQty} units following issuance of request ${r.id}.`,
                  type: 'warning',
                  isRead: false,
                  createdAt: new Date().toISOString()
                };
                setNotifications(oldN => [stockAlert, ...oldN]);
              }

              return { ...catItem, availableQuantity: resultingQty };
            }
            return catItem;
          }));
        });

        // Notify
        const issuedNotif: AppNotification = {
          id: `NOTIF-${Date.now()}`,
          userId: r.userId,
          title: 'Stationery Items Dispatched',
          message: `Your request ${r.id} items have been issued by the stockroom. Please drop by for collection.`,
          type: 'success',
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(old => [issuedNotif, ...old]);

        return {
          ...r,
          status: 'issued',
          issuedByUserId: currentUser.id,
          issuedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    }));

    const audit = createAuditLog(currentUser, 'REQUEST_DISPATCHED_ISSUED', `Marked request ${id} as issued and lowered item inventories.`);
    setAuditLogs(prev => [audit, ...prev]);
  };

  const handleCompleteRequest = (id: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id === id) {
        // notify
        const completeNotit: AppNotification = {
          id: `NOTIF-${Date.now()}`,
          userId: r.userId,
          title: 'Fulfillment Order Completed',
          message: `Stationery order ${r.id} completed. Thank you!`,
          type: 'success',
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(old => [completeNotit, ...old]);

        return {
          ...r,
          status: 'completed',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    }));

    const audit = createAuditLog(currentUser, 'REQUEST_STATUS_COMPLETED', `Marked order ${id} as physically received & completed.`);
    setAuditLogs(prev => [audit, ...prev]);
  };

  // Super-admin user systems adjusters
  const handleUpdateUserDetails = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

    const audit = createAuditLog(currentUser, 'USER_ACCOUNT_UPDATE', `Modified status/role configuration for corporate user: ${updatedUser.fullName} (${updatedUser.id})`);
    setAuditLogs(prev => [audit, ...prev]);
  };

  const handleUpdateConfig = (config: SystemConfig) => {
    setSystemConfig(config);

    const audit = createAuditLog(currentUser, 'SYSTEM_CONFIG_UPDATE', `Adjusted global dollar thresholds and stock enforcement configurations.`);
    setAuditLogs(prev => [audit, ...prev]);
  };

  const handleAddDepartment = (dept: Department) => {
    setDepartments(prev => [...prev, dept]);

    const audit = createAuditLog(currentUser, 'DEPARTMENT_CREATED', `Added new department corporate block: ${dept.name} [${dept.id}]`);
    setAuditLogs(prev => [audit, ...prev]);
  };

  // Notification methods
  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleClearNotifications = () => {
    setNotifications(prev => prev.map(n => {
      // Mark as read based on active roles
      if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
        if (!n.userId) return { ...n, isRead: true };
      }
      if (n.userId === currentUser.id) {
        return { ...n, isRead: true };
      }
      return n;
    }));
  };

  // Left sidebar Navigation filters by active role rules
  const getSidebarTabs = () => {
    const defaultTabs = [
      { id: 'dashboard', label: 'Overview Metrics', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'catalog', label: 'Stockroom Catalog', icon: <ShoppingBag className="w-4 h-4" /> },
      { id: 'requests', label: 'Create Request', icon: <History className="w-4 h-4" /> }
    ];

    if (currentUser.role === 'approver') {
      defaultTabs.push({ id: 'approvals', label: 'Department Approvals', icon: <CheckSquare className="w-4 h-4" /> });
    }

    if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
      if (currentUser.role === 'admin') {
        defaultTabs.push({ id: 'approvals', label: 'Department Approvals', icon: <CheckSquare className="w-4 h-4" /> });
      }
      defaultTabs.push({ id: 'inventory', label: 'Fulfillment Dispatch', icon: <Truck className="w-4 h-4" /> });
      defaultTabs.push({ id: 'reports', label: 'Usage Reports', icon: <TrendingUp className="w-4 h-4" /> });
    }

    if (currentUser.role === 'super_admin') {
      defaultTabs.push({ id: 'approvals', label: 'Department Approvals', icon: <CheckSquare className="w-4 h-4" /> });
      defaultTabs.push({ id: 'system', label: 'CMS Control Panel', icon: <Settings className="w-4 h-4" /> });
    }

    // Every user has a profile tab
    defaultTabs.push({ id: 'profile', label: 'User Profile', icon: <UserIcon className="w-4 h-4" /> });

    return defaultTabs;
  };

  const sidebarTabs = getSidebarTabs();

  return (
    <div className={`min-h-screen font-sans ${themeMode === 'dark' ? 'dark bg-[#1D1A4B] text-white' : 'bg-[#f8fafc] text-slate-800'}`}>
      {/* Upper header navigation */}
      <header id="app-workspace-header" className="sticky top-0 z-40 bg-gradient-to-r from-[#10182D] to-[#1D1A4B] border-b border-[#1D293D] px-4 md:px-6 py-3.5 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 text-white bg-[#1D293D] hover:bg-[#25344d] rounded-lg cursor-pointer transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            {systemConfig.portalLogoUrl ? (
              <img
                src={resolveLogoUrl(systemConfig.portalLogoUrl)}
                alt="Vetiva Logo"
                id="portal-header-logo-image"
                referrerPolicy="no-referrer"
                className="h-10 w-auto max-w-[150px] object-contain rounded-lg"
              />
            ) : (
              <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-lg shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className="text-sm font-black tracking-tight text-white uppercase">
                {systemConfig.portalName || 'Stationery Request Hub'}
              </h1>
              <p className="text-[9.5px] font-bold text-blue-200/90 uppercase tracking-widest leading-3 mt-0.5">
                {systemConfig.portalSubtitle || 'Vetiva Admin Services Portal'}
              </p>
            </div>
          </div>
        </div>

        {/* Action icons and active impersonator switch widget */}
        <div className="flex items-center gap-3">
          {/* Low Stock Indicator Header Bar */}
          {lowStockCount > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white text-[11px] font-extrabold border border-red-600 rounded-full cursor-pointer animate-pulse" onClick={() => { setActiveTab('catalog'); }}>
              <AlertTriangle className="w-3.5 h-3.5" />
              {lowStockCount} Low stock warnings
            </div>
          )}

          {/* Theme Mode Button */}
          <button
            id="btn-toggle-theme"
            onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
            className="p-2 text-white bg-[#1D293D] hover:bg-[#25344d] rounded-lg transition-all cursor-pointer"
            title="Alternative dark-mode simulation"
          >
            {themeMode === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5 text-amber-500" />}
          </button>

          {/* Active Impersonation Swapper */}
          <RoleSwitcher
            currentUser={currentUser}
            onUserChange={handleUserChange}
            users={users}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onClearNotifications={handleClearNotifications}
          />
        </div>
      </header>

      {/* Main structure wrapping body layout */}
      <div className="flex relative">
        {/* Responsive left sidebar */}
        <aside
          id="app-sidebar-nav"
          className={`fixed md:sticky top-[69px] h-[calc(100vh-69px)] w-64 bg-[#10182D] border-r border-[#1D293D] p-4 shrink-0 transition-transform duration-200 ease-in-out z-35 md:translate-x-0 print:hidden ${
            sidebarOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col justify-between pb-6">
            {/* List tabs matches security matrix */}
            <nav className="space-y-1">
              {sidebarTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`sidebar-link-${tab.id}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-bold tracking-wide transition-all cursor-pointer ${
                      isActive
                        ? tab.id === 'dashboard'
                          ? 'bg-red-600 text-white font-extrabold shadow-sm hover:bg-red-700'
                          : 'bg-[#1D293D] text-white font-extrabold shadow-sm hover:bg-[#25344d] border border-[#2d3a52]'
                        : 'text-slate-300 hover:bg-[#1D293D]/40 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Bottom active statistics indicator */}
            <div className="space-y-3.5 border-t border-[#1D293D] pt-4 px-1.5">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Authorized Section</span>
                <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Security: ACTIVE
                </p>
                <p className="text-[10px] text-slate-400 font-mono">UID: {currentUser.id}</p>
              </div>

              {/* Reset to fresh storage state anchor */}
              <button
                onClick={() => {
                  if (confirm('Verify: This resets all corporate requests, custom quantities, and restores default catalog logs.')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="w-full text-center text-[10.5px] font-bold text-slate-300 hover:text-rose-450 border border-[#1D293D] hover:border-rose-500 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Reset System State
              </button>
            </div>
          </div>
        </aside>

        {/* Content body component swap block */}
        <main id="app-workspace-main" className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 max-w-7xl mx-auto overflow-y-auto print:p-0">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              currentUser={currentUser}
              requests={requests}
              catalog={catalog}
              departments={departments}
              users={users}
              onNavigateTo={(tab) => setActiveTab(tab)}
              systemConfig={systemConfig}
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogSection
              currentUser={currentUser}
              catalog={catalog}
              transactions={transactions}
              onAddNewItem={handleAddNewItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onPostTransaction={handlePostTransaction}
            />
          )}

          {activeTab === 'requests' && (
            <RequestSection
              currentUser={currentUser}
              requests={requests}
              catalog={catalog}
              onSubmitRequest={handleRequestSubmit}
              onCancelRequest={handleCancelRequest}
            />
          )}

          {activeTab === 'approvals' && (
            <ApprovalSection
              currentUser={currentUser}
              requests={requests}
              catalog={catalog}
              onApproveRequest={handleApprovalSubmit}
              onRejectRequest={handleRejectSubmit}
              onBulkApproveRequests={handleBulkApproveRequests}
            />
          )}

          {activeTab === 'inventory' && (
            <InventorySection
              currentUser={currentUser}
              requests={requests}
              catalog={catalog}
              transactions={transactions}
              onIssueRequest={handleIssueRequest}
              onCompleteRequest={handleCompleteRequest}
            />
          )}

          {activeTab === 'reports' && (
            <ReportSection
              requests={requests}
              catalog={catalog}
              departments={departments}
              users={users}
            />
          )}

          {activeTab === 'system' && (
            <SystemControlPanel
              users={users}
              departments={departments}
              auditLogs={auditLogs}
              systemConfig={systemConfig}
              onUpdateUserDetails={handleUpdateUserDetails}
              onUpdateConfig={handleUpdateConfig}
              onAddDepartment={handleAddDepartment}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileSection
              currentUser={currentUser}
              onUpdateUserDetails={handleUpdateUserDetails}
            />
          )}
        </main>
      </div>
    </div>
  );
}
