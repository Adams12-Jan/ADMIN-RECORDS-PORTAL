/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth, writeToFirestore, deleteFromFirestore, OperationType } from './lib/firebase';
import {
  User,
  Department,
  StationeryItem,
  StationeryRequest,
  InventoryTransaction,
  AuditLog,
  AppNotification,
  SystemConfig,
  UserRole,
  Memo
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
import TerminalSection from './components/TerminalSection';
import LandingPage from './components/LandingPage';
import MemoHubSection from './components/MemoHubSection';

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
  Terminal,
  X,
  FileText
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

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => loadState('stationery_logged_in', false));
  const [memos, setMemos] = useState<Memo[]>(() => loadState('stationery_memos', []));

  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Authenticate anonymously to facilitate secure Firestore transactions
    signInAnonymously(auth)
      .then(() => {
        setAuthReady(true);
      })
      .catch((err) => {
        console.warn("Auth initial login custom warning (typical if offline or blocked):", err);
        // Resilient fallback for offline support
        setAuthReady(true);
      });
  }, []);

  // Synchronize active simulator session profile with Firestore
  useEffect(() => {
    if (!authReady || !auth.currentUser) return;
    
    const syncProfile = async () => {
      const uid = auth.currentUser!.uid;
      const profileDoc = {
        id: uid,
        email: `${uid}@anonymous.com`,
        fullName: currentUser.fullName,
        role: currentUser.role,
        departmentId: currentUser.departmentId,
        status: 'active' as const,
        avatarUrl: currentUser.avatarUrl || ''
      };
      
      try {
        await writeToFirestore('users', uid, profileDoc, OperationType.UPDATE);
      } catch (err) {
        console.warn("Failed to synchronize active simulator profile:", err);
      }
    };
    
    syncProfile();
  }, [authReady, currentUser]);

  useEffect(() => {
    if (!authReady) return;

    // Seeding function to populate empty Firestore collections safely in a single batch-like workflow
    const seedFirebaseData = async () => {
      try {
        console.log("Checking if Firestore database is unseeded...");
        const configRef = collection(db, 'systemConfig');
        const configSnap = await getDocs(configRef);
        const hasConfig = configSnap.docs.some(d => d.id === 'default');

        if (!hasConfig) {
          console.log("Firestore database is unseeded. Initializing seed data...");

          // 1. Seed users
          console.log("Seeding users...");
          for (const u of users) {
            console.log(`Writing user: ${u.id}`);
            await writeToFirestore('users', u.id, u, OperationType.CREATE);
          }

          // 2. Seed departments
          console.log("Seeding departments...");
          for (const d of departments) {
            console.log(`Writing department: ${d.id}`);
            await writeToFirestore('departments', d.id, d, OperationType.CREATE);
          }

          // 3. Seed catalog
          console.log("Seeding catalog...");
          for (const item of catalog) {
            console.log(`Writing catalog item: ${item.id}`);
            await writeToFirestore('catalog', item.id, item, OperationType.CREATE);
          }

          // 4. Seed requests
          console.log("Seeding requests...");
          for (const r of requests) {
            console.log(`Writing request: ${r.id}`);
            await writeToFirestore('requests', r.id, r, OperationType.CREATE);
          }

          // 5. Seed transactions
          console.log("Seeding transactions...");
          for (const tx of transactions) {
            console.log(`Writing transaction: ${tx.id}`);
            await writeToFirestore('transactions', tx.id, tx, OperationType.CREATE);
          }

          // 6. Seed auditLogs
          console.log("Seeding auditLogs...");
          for (const log of auditLogs) {
             console.log(`Writing auditLog: ${log.id}`);
             await writeToFirestore('auditLogs', log.id, log, OperationType.CREATE);
          }

          // 7. Seed notifications
          console.log("Seeding notifications...");
          for (const n of notifications) {
             console.log(`Writing notification: ${n.id}`);
             await writeToFirestore('notifications', n.id, n, OperationType.CREATE);
          }

          // 8. Seed config (written last, sealing the "unseeded" window as a lock field)
          console.log("Writing systemConfig 'default' lock document...");
          await writeToFirestore('systemConfig', 'default', systemConfig, OperationType.CREATE);

          console.log("Firestore database seeded successfully!");
        } else {
          console.log("Firestore database already seeded.");
        }
      } catch (err) {
        console.error("Firestore seeding failed; typical for restricted custom rules:", err);
      }
    };

    seedFirebaseData();

    // Setup active listeners
    const unsubConfig = onSnapshot(collection(db, 'systemConfig'), (snapshot) => {
      const found = snapshot.docs.find(d => d.id === 'default');
      if (found) setSystemConfig(found.data() as SystemConfig);
    }, (err) => console.warn("Sync err on config:", err));

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: User[] = [];
      snapshot.forEach(doc => list.push(doc.data() as User));
      if (list.length > 0) setUsers(list);
    }, (err) => console.warn("Sync err on users:", err));

    const unsubDepts = onSnapshot(collection(db, 'departments'), (snapshot) => {
      const list: Department[] = [];
      snapshot.forEach(doc => list.push(doc.data() as Department));
      if (list.length > 0) setDepartments(list);
    }, (err) => console.warn("Sync err on departments:", err));

    const unsubCatalog = onSnapshot(collection(db, 'catalog'), (snapshot) => {
      const list: StationeryItem[] = [];
      snapshot.forEach(doc => list.push(doc.data() as StationeryItem));
      if (list.length > 0) setCatalog(list);
    }, (err) => console.warn("Sync err on catalog:", err));

    const unsubRequests = onSnapshot(collection(db, 'requests'), (snapshot) => {
      const list: StationeryRequest[] = [];
      snapshot.forEach(doc => list.push(doc.data() as StationeryRequest));
      if (list.length > 0) setRequests(list);
    }, (err) => console.warn("Sync err on requests:", err));

    const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const list: InventoryTransaction[] = [];
      snapshot.forEach(doc => list.push(doc.data() as InventoryTransaction));
      if (list.length > 0) setTransactions(list);
    }, (err) => console.warn("Sync err on transactions:", err));

    const unsubAuditLogs = onSnapshot(collection(db, 'auditLogs'), (snapshot) => {
      const list: AuditLog[] = [];
      snapshot.forEach(doc => list.push(doc.data() as AuditLog));
      if (list.length > 0) setAuditLogs(list);
    }, (err) => console.warn("Sync err on auditLogs:", err));

    const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach(doc => list.push(doc.data() as AppNotification));
      if (list.length > 0) setNotifications(list);
    }, (err) => console.warn("Sync err on notifications:", err));

    const unsubMemos = onSnapshot(collection(db, 'memos'), (snapshot) => {
      const list: Memo[] = [];
      snapshot.forEach(doc => list.push(doc.data() as Memo));
      if (list.length > 0) setMemos(list);
    }, (err) => console.warn("Sync err on memos:", err));

    return () => {
      unsubConfig();
      unsubUsers();
      unsubDepts();
      unsubCatalog();
      unsubRequests();
      unsubTransactions();
      unsubAuditLogs();
      unsubNotifications();
      unsubMemos();
    };

  }, [authReady]);

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
    document.title = `${systemConfig.portalName || 'Stationery Request Hub'} | ${systemConfig.portalSubtitle || 'Vetiva Admin'}`;
  }, [systemConfig.portalName, systemConfig.portalSubtitle]);

  useEffect(() => {
    saveState('stationery_active_user', currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveState('stationery_logged_in', isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    saveState('stationery_memos', memos);
  }, [memos]);

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

  // Automated 5-stage Memo approval handlers
  const handleAddMemo = async (newMemoData: Omit<Memo, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => {
    const newId = `MEMO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newMemo: Memo = {
      ...newMemoData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `STEP-${Date.now()}`,
          stage: 'draft',
          action: 'create',
          userId: currentUser.id,
          userFullName: currentUser.fullName,
          userRole: currentUser.role,
          comments: 'Memo draft submitted to Head of Admin.',
          timestamp: new Date().toISOString()
        }
      ]
    };

    setMemos(prev => [newMemo, ...prev]);
    await writeToFirestore('memos', newId, newMemo, OperationType.CREATE);

    // Notify David (Head of Admin)
    const adminNotification: AppNotification = {
      id: `NTF-${Date.now()}`,
      userId: 'USR-002', // David's user ID
      title: 'New Memo Review Request',
      message: `A new administrative memo (${newId}) is pending your approval: "${newMemo.title}"`,
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [adminNotification, ...prev]);
    await writeToFirestore('notifications', adminNotification.id, adminNotification, OperationType.CREATE);

    // Audit Log
    const audit = createAuditLog(currentUser, 'MEMO_INITIATED', `Initiated 5-stage approval memo ${newId}: ${newMemo.title}`);
    setAuditLogs(prev => [audit, ...prev]);
    await writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
  };

  const handleUpdateMemo = async (updatedMemo: Memo) => {
    setMemos(prev => prev.map(m => m.id === updatedMemo.id ? updatedMemo : m));
    await writeToFirestore('memos', updatedMemo.id, updatedMemo, OperationType.UPDATE);

    const nextStage = updatedMemo.currentStage;
    let targetUserId = '';
    let notificationTitle = 'Pending Memo Action';
    let notificationText = '';

    if (nextStage === 'pending_internal_control') {
      targetUserId = 'USR-003'; // Alex Carter
      notificationText = `Memo ${updatedMemo.id} approved by Admin. Awaiting Internal Control auditing.`;
    } else if (nextStage === 'pending_md') {
      targetUserId = 'USR-004'; // Samantha Sterling
      notificationText = `Memo ${updatedMemo.id} cleared Internal Control. Awaiting Managing Director signature.`;
    } else if (nextStage === 'pending_finance') {
      targetUserId = 'USR-006'; // Sarah Jenkins
      notificationText = `Managing Director approved Memo ${updatedMemo.id}. Standing by for Finance payout.`;
    } else if (nextStage === 'completed') {
      targetUserId = updatedMemo.initiatorId; // Notify initiator
      notificationTitle = 'Memo Approved & Disbursed! ₦';
      notificationText = `Memo ${updatedMemo.id} completed. Finance has released the requisition funds.`;
    } else if (nextStage === 'rejected') {
      targetUserId = updatedMemo.initiatorId; // Notify initiator
      notificationTitle = 'Memo REJECTED ✗';
      notificationText = `Attention: Memo ${updatedMemo.id} has been rejected by workflow authority.`;
    }

    if (targetUserId) {
      const nextNtf: AppNotification = {
        id: `NTF-${Date.now()}`,
        userId: targetUserId,
        title: notificationTitle,
        message: notificationText,
        type: nextStage === 'completed' ? 'success' : nextStage === 'rejected' ? 'danger' : 'warning',
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [nextNtf, ...prev]);
      await writeToFirestore('notifications', nextNtf.id, nextNtf, OperationType.CREATE);
    }

    // Capture Audit entries
    const lastAction = updatedMemo.history[updatedMemo.history.length - 1];
    const auditActionCode = `MEMO_${(lastAction?.action || 'update').toUpperCase()}`;
    const audit = createAuditLog(
      currentUser,
      auditActionCode,
      `Memo ${updatedMemo.id} stage transitioned to: ${nextStage} by ${lastAction?.userFullName || currentUser.fullName}`
    );
    setAuditLogs(prev => [audit, ...prev]);
    await writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
  };

  // Catalog methods
  const handleAddNewItem = (newItem: StationeryItem) => {
    setCatalog(prev => [newItem, ...prev]);
    writeToFirestore('catalog', newItem.id, newItem, OperationType.CREATE);

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
      writeToFirestore('transactions', initialTxn.id, initialTxn, OperationType.CREATE);
    }

    // Append audit
    const audit = createAuditLog(currentUser, 'CATALOG_ITEM_CREATE', `Created item code: ${newItem.id} - ${newItem.name}`);
    setAuditLogs(prev => [audit, ...prev]);
    writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
  };

  const handleUpdateItem = (updatedItem: StationeryItem) => {
    setCatalog(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    writeToFirestore('catalog', updatedItem.id, updatedItem, OperationType.UPDATE);

    const audit = createAuditLog(currentUser, 'CATALOG_ITEM_UPDATE', `Modified item details for ${updatedItem.id}`);
    setAuditLogs(prev => [audit, ...prev]);
    writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
  };

  const handleDeleteItem = (id: string) => {
    setCatalog(prev => prev.filter(item => item.id !== id));
    deleteFromFirestore('catalog', id);

    const audit = createAuditLog(currentUser, 'CATALOG_ITEM_DELETE', `Hard-deleted item code ${id} from corporate registers.`);
    setAuditLogs(prev => [audit, ...prev]);
    writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
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
    writeToFirestore('transactions', fullTxn.id, fullTxn, OperationType.CREATE);

    // Update product quantity level
    setCatalog(prev => prev.map(item => {
      if (item.id === txn.itemId) {
        const nextQty = Math.max(0, item.availableQuantity + txn.quantity);
        const updatedItem = { ...item, availableQuantity: nextQty };
        writeToFirestore('catalog', item.id, updatedItem, OperationType.UPDATE);

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
          writeToFirestore('notifications', warnNotif.id, warnNotif, OperationType.CREATE);
        }

        return updatedItem;
      }
      return item;
    }));

    const audit = createAuditLog(currentUser, 'INVENTORY_TRANSACTION_POSTED', `Posted stock offset [${txn.quantity}] to catalog SKU: ${txn.itemId}. Reason: ${txn.reason}`);
    setAuditLogs(prev => [audit, ...prev]);
    writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
  };

  // Stationery requests submitting (Employee Workflow)
  const handleRequestSubmit = (newRequest: StationeryRequest) => {
    setRequests(prev => [newRequest, ...prev]);
    writeToFirestore('requests', newRequest.id, newRequest, OperationType.CREATE);

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
      writeToFirestore('notifications', deptNotif.id, deptNotif, OperationType.CREATE);

      const audit = createAuditLog(currentUser, 'REQUEST_SUBMITTED', `Submited stationery ticket: ${newRequest.id} for department approval.`);
      setAuditLogs(prev => [audit, ...prev]);
      writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
    } else {
      const audit = createAuditLog(currentUser, 'REQUEST_DRAFT_SAVE', `Saved draft ticket: ${newRequest.id}`);
      setAuditLogs(prev => [audit, ...prev]);
      writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
    }
  };

  const handleCancelRequest = (requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
    deleteFromFirestore('requests', requestId);

    const audit = createAuditLog(currentUser, 'REQUEST_CANCELLED', `Cancelled request number: ${requestId}`);
    setAuditLogs(prev => [audit, ...prev]);
    writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
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
        writeToFirestore('notifications', successNotif.id, successNotif, OperationType.CREATE);

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
        writeToFirestore('notifications', adminNotif.id, adminNotif, OperationType.CREATE);

        const updated = {
          ...r,
          status: 'approved' as const,
          approvalComment: comment,
          approvedByUserId: currentUser.id,
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        writeToFirestore('requests', r.id, updated, OperationType.UPDATE);
        return updated;
      }
      return r;
    }));

    const audit = createAuditLog(currentUser, 'REQUEST_APPROVAL_SIGNED', `Approved request: ${id}. Comment: ${comment}`);
    setAuditLogs(prev => [audit, ...prev]);
    writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
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
        writeToFirestore('notifications', rejectNotif.id, rejectNotif, OperationType.CREATE);

        const updated = {
          ...r,
          status: 'rejected' as const,
          approvalComment: comment,
          rejectedByUserId: currentUser.id,
          rejectedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        writeToFirestore('requests', r.id, updated, OperationType.UPDATE);
        return updated;
      }
      return r;
    }));

    const audit = createAuditLog(currentUser, 'REQUEST_REJECTION_SIGNED', `Declined/Rejected request: ${id}. Comment: ${comment}`);
    setAuditLogs(prev => [audit, ...prev]);
    writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
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
        writeToFirestore('notifications', successNotif.id, successNotif, OperationType.CREATE);

        const updated = {
          ...r,
          status: 'approved' as const,
          approvalComment: 'Approved via department manager bulk sequence.',
          approvedByUserId: currentUser.id,
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        writeToFirestore('requests', r.id, updated, OperationType.UPDATE);
        return updated;
      }
      return r;
    }));

    const audit = createAuditLog(currentUser, 'REQUEST_APPROVAL_BULK_SIGNED', `Processed bulk signoff approvals for tickets: ${ids.join(', ')}`);
    setAuditLogs(prev => [audit, ...prev]);
    writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
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
          writeToFirestore('transactions', deductTxn.id, deductTxn, OperationType.CREATE);

          // Lower quantity from physical Catalog list
          setCatalog(oldCat => oldCat.map(catItem => {
            if (catItem.id === it.itemId) {
              const resultingQty = Math.max(0, catItem.availableQuantity - it.quantity);
              const updatedItem = { ...catItem, availableQuantity: resultingQty };
              writeToFirestore('catalog', catItem.id, updatedItem, OperationType.UPDATE);

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
                writeToFirestore('notifications', stockAlert.id, stockAlert, OperationType.CREATE);
              }

              return updatedItem;
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
        writeToFirestore('notifications', issuedNotif.id, issuedNotif, OperationType.CREATE);

        const updated = {
          ...r,
          status: 'issued' as const,
          issuedByUserId: currentUser.id,
          issuedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        writeToFirestore('requests', r.id, updated, OperationType.UPDATE);
        return updated;
      }
      return r;
    }));

    const audit = createAuditLog(currentUser, 'REQUEST_DISPATCHED_ISSUED', `Marked request ${id} as issued and lowered item inventories.`);
    setAuditLogs(prev => [audit, ...prev]);
    writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
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
        writeToFirestore('notifications', completeNotit.id, completeNotit, OperationType.CREATE);

        const updated = {
          ...r,
          status: 'completed' as const,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        writeToFirestore('requests', r.id, updated, OperationType.UPDATE);
        return updated;
      }
      return r;
    }));

    const audit = createAuditLog(currentUser, 'REQUEST_STATUS_COMPLETED', `Marked order ${id} as physically received & completed.`);
    setAuditLogs(prev => [audit, ...prev]);
    writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
  };

  // Super-admin user systems adjusters
  const handleUpdateUserDetails = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    writeToFirestore('users', updatedUser.id, updatedUser, OperationType.UPDATE);

    const audit = createAuditLog(currentUser, 'USER_ACCOUNT_UPDATE', `Modified status/role configuration for corporate user: ${updatedUser.fullName} (${updatedUser.id})`);
    setAuditLogs(prev => [audit, ...prev]);
    writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
  };

  const handleUpdateConfig = (config: SystemConfig) => {
    setSystemConfig(config);
    writeToFirestore('systemConfig', 'default', config, OperationType.UPDATE);

    const audit = createAuditLog(currentUser, 'SYSTEM_CONFIG_UPDATE', `Adjusted global dollar thresholds and stock enforcement configurations.`);
    setAuditLogs(prev => [audit, ...prev]);
    writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
  };

  const handleAddDepartment = (dept: Department) => {
    setDepartments(prev => [...prev, dept]);
    writeToFirestore('departments', dept.id, dept, OperationType.CREATE);

    const audit = createAuditLog(currentUser, 'DEPARTMENT_CREATED', `Added new department corporate block: ${dept.name} [${dept.id}]`);
    setAuditLogs(prev => [audit, ...prev]);
    writeToFirestore('auditLogs', audit.id, audit, OperationType.CREATE);
  };

  // Notification methods
  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === id) {
        const updated = { ...n, isRead: true };
        writeToFirestore('notifications', n.id, updated, OperationType.UPDATE);
        return updated;
      }
      return n;
    }));
  };

  const handleClearNotifications = () => {
    setNotifications(prev => prev.map(n => {
      let nextN = n;
      // Mark as read based on active roles
      if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
        if (!n.userId) nextN = { ...n, isRead: true };
      }
      if (n.userId === currentUser.id) {
        nextN = { ...n, isRead: true };
      }
      if (nextN !== n) {
        writeToFirestore('notifications', n.id, nextN, OperationType.UPDATE);
      }
      return nextN;
    }));
  };

  // Left sidebar Navigation filters by active role rules
  const getSidebarTabs = () => {
    const defaultTabs = [
      { id: 'dashboard', label: 'Overview Metrics', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'memos', label: 'Automated Memos', icon: <FileText className="w-4 h-4 text-orange-500" /> },
      { id: 'catalog', label: 'Stockroom Catalog', icon: <ShoppingBag className="w-4 h-4" /> },
      { id: 'requests', label: 'Create Request', icon: <History className="w-4 h-4" /> },
      { id: 'bincard', label: 'Bin Card CMD', icon: <Terminal className="w-4 h-4 text-indigo-400" /> }
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

  if (!isLoggedIn) {
    return (
      <LandingPage
        users={users}
        onSignIn={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
        }}
      />
    );
  }

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

          {/* Log Out Button */}
          <button
            id="btn-logout"
            onClick={() => {
              if (confirm("Confirm: Sign out of your current Vetiva employee session?")) {
                setIsLoggedIn(false);
              }
            }}
            className="p-2 text-white bg-rose-950/60 hover:bg-rose-950 border border-rose-800 rounded-lg transition-all cursor-pointer"
            title="Log out of employee session"
          >
            <LogOut className="w-4.5 h-4.5" />
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
                          ? 'bg-orange-600 text-white font-extrabold shadow-sm hover:bg-orange-750'
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

          {activeTab === 'memos' && (
            <MemoHubSection
              currentUser={currentUser}
              memos={memos}
              users={users}
              departments={departments}
              onAddMemo={handleAddMemo}
              onUpdateMemo={handleUpdateMemo}
              onImpersonateUser={handleUserChange}
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

          {activeTab === 'bincard' && (
            <TerminalSection
              currentUser={currentUser}
              catalog={catalog}
              setCatalog={setCatalog}
              transactions={transactions}
              setTransactions={setTransactions}
              departments={departments}
              setAuditLogs={setAuditLogs}
            />
          )}
        </main>
      </div>
    </div>
  );
}
