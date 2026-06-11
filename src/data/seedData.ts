/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Department, StationeryItem, StationeryRequest, InventoryTransaction, AuditLog, AppNotification, SystemConfig } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-000',
    email: 'gideonline18@gmail.com',
    fullName: 'Gideon',
    role: 'super_admin',
    departmentId: 'DEPT-EXEC',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    status: 'active'
  },
  {
    id: 'USR-001',
    email: 'emily@corporate.com',
    fullName: 'Emily Thorne',
    role: 'employee',
    departmentId: 'DEPT-ENG',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    status: 'active'
  },
  {
    id: 'USR-002',
    email: 'david@corporate.com',
    fullName: 'David Vance',
    role: 'approver',
    departmentId: 'DEPT-ENG',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
    status: 'active'
  },
  {
    id: 'USR-003',
    email: 'alex@corporate.com',
    fullName: 'Alex Carter',
    role: 'admin',
    departmentId: 'DEPT-OPS',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120',
    status: 'active'
  },
  {
    id: 'USR-004',
    email: 'sam@corporate.com',
    fullName: 'Samantha Sterling',
    role: 'super_admin',
    departmentId: 'DEPT-EXEC',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120',
    status: 'active'
  },
  {
    id: 'USR-005',
    email: 'james@corporate.com',
    fullName: 'James Miller',
    role: 'employee',
    departmentId: 'DEPT-FIN',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    status: 'active'
  },
  {
    id: 'USR-006',
    email: 'sarah@corporate.com',
    fullName: 'Sarah Jenkins',
    role: 'approver',
    departmentId: 'DEPT-FIN',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120',
    status: 'active'
  }
];

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'DEPT-ENG', name: 'Engineering & QA', code: 'ENG', headUserId: 'USR-002' },
  { id: 'DEPT-FIN', name: 'Finance & Accounting', code: 'FIN', headUserId: 'USR-006' },
  { id: 'DEPT-OPS', name: 'Operations & Facilities', code: 'OPS', headUserId: 'USR-003' },
  { id: 'DEPT-EXEC', name: 'Executive Suite', code: 'EXEC', headUserId: 'USR-000' }
];

export const INITIAL_CATALOG: StationeryItem[] = [
  {
    id: 'STAT-001',
    name: 'Premium Gel Pens (Black, Pack of 10)',
    category: 'Writing Instruments',
    description: '0.5mm extra fine point dynamic gel ink pens for clean and smudge-free signatures.',
    unitCost: 12.50,
    availableQuantity: 85,
    reorderLevel: 20,
    vendorName: 'Global Office Supplies Ltd.',
    status: 'active'
  },
  {
    id: 'STAT-002',
    name: 'A4 White Copy Paper (500 Sheets, 80gsm)',
    category: 'Paper Products',
    description: 'High whiteness premium multi-purpose paper for laser printers and copiers.',
    unitCost: 6.99,
    availableQuantity: 140,
    reorderLevel: 30,
    vendorName: 'PaperMills Inc.',
    status: 'active'
  },
  {
    id: 'STAT-003',
    name: 'Heavy Duty Lever Arch File (A4, 75mm)',
    category: 'Filing & Storage',
    description: 'Durable cardboard file covered in wipe-clean polypropylene. Equipped with strong metal thumb ring.',
    unitCost: 4.80,
    availableQuantity: 8,
    reorderLevel: 15,
    vendorName: 'Folder Tech Solutions',
    status: 'active'
  },
  {
    id: 'STAT-004',
    name: 'Metallic Mesh Desk Organizer',
    category: 'Desk Organizers',
    description: 'Three compartments to hold envelopes, mail, sticky notes, and writing accessories.',
    unitCost: 15.20,
    availableQuantity: 24,
    reorderLevel: 8,
    vendorName: 'Global Office Supplies Ltd.',
    status: 'active'
  },
  {
    id: 'STAT-005',
    name: 'Scientific Calculator (FX-991EX)',
    category: 'Electronics',
    description: 'High-resolution display LCD scientific calculator with 552 functions. Ideal for engineering.',
    unitCost: 28.00,
    availableQuantity: 12,
    reorderLevel: 5,
    vendorName: 'UniTech Instruments',
    status: 'active'
  },
  {
    id: 'STAT-006',
    name: 'Fluorescent Highlighter Markers (Assorted Pack of 6)',
    category: 'Writing Instruments',
    description: 'Chisel tip markers in Yellow, Pink, Green, Orange, Blue, and Purple colors.',
    unitCost: 5.50,
    availableQuantity: 4,
    reorderLevel: 10,
    vendorName: 'ColorLine Ltd.',
    status: 'active'
  },
  {
    id: 'STAT-007',
    name: 'Adhesive Sticky Notes (3x3 inch, 12 Pads)',
    category: 'Paper Products',
    description: 'Ultra-sticky notes in super bright colors, 100 sheets per pad.',
    unitCost: 9.99,
    availableQuantity: 95,
    reorderLevel: 25,
    vendorName: 'Global Office Supplies Ltd.',
    status: 'active'
  },
  {
    id: 'STAT-008',
    name: 'Wireless Ergonomic Desktop Mouse',
    category: 'Electronics',
    description: '2.4G optical vertical mouse with adjustable DPI comfortable for prolonged office use.',
    unitCost: 22.00,
    availableQuantity: 15,
    reorderLevel: 6,
    vendorName: 'UniTech Instruments',
    status: 'active'
  }
];

export const INITIAL_REQUESTS: StationeryRequest[] = [
  {
    id: 'REQ-2026-001',
    userId: 'USR-001',
    userFullName: 'Emily Thorne',
    departmentId: 'DEPT-ENG',
    departmentName: 'Engineering & QA',
    items: [
      { itemId: 'STAT-001', quantity: 2, unitCostSnapshot: 12.50 },
      { itemId: 'STAT-005', quantity: 1, unitCostSnapshot: 28.00 }
    ],
    justification: 'Required for technical sketching and structural layout calculations in the QA laboratory.',
    status: 'completed',
    createdAt: '2026-06-01T09:30:00-07:00',
    updatedAt: '2026-06-03T11:20:00-07:00',
    approvedByUserId: 'USR-002',
    approvedAt: '2026-06-01T14:15:00-07:00',
    issuedByUserId: 'USR-003',
    issuedAt: '2026-06-02T10:00:00-07:00',
    completedAt: '2026-06-03T11:20:00-07:00',
    approvalComment: 'Fully justified. Verified alignment with engineering budget.'
  },
  {
    id: 'REQ-2026-002',
    userId: 'USR-005',
    userFullName: 'James Miller',
    departmentId: 'DEPT-FIN',
    departmentName: 'Finance & Accounting',
    items: [
      { itemId: 'STAT-002', quantity: 10, unitCostSnapshot: 6.99 },
      { itemId: 'STAT-003', quantity: 5, unitCostSnapshot: 4.80 }
    ],
    justification: 'Filing audit notebooks and printing physical records for Q2 close preparation.',
    status: 'pending_approval',
    createdAt: '2026-06-09T10:15:00-07:00',
    updatedAt: '2026-06-09T10:15:00-07:00'
  },
  {
    id: 'REQ-2026-003',
    userId: 'USR-001',
    userFullName: 'Emily Thorne',
    departmentId: 'DEPT-ENG',
    departmentName: 'Engineering & QA',
    items: [
      { itemId: 'STAT-004', quantity: 1, unitCostSnapshot: 15.20 },
      { itemId: 'STAT-006', quantity: 2, unitCostSnapshot: 5.50 }
    ],
    justification: 'Desk organization and highlight coloring of schematic blueprints.',
    status: 'approved',
    createdAt: '2026-06-10T08:00:00-07:00',
    updatedAt: '2026-06-10T15:30:00-07:00',
    approvedByUserId: 'USR-002',
    approvedAt: '2026-06-10T15:30:00-07:00',
    approvalComment: 'Approved. Grab from stock directly.'
  },
  {
    id: 'REQ-2026-004',
    userId: 'USR-001',
    userFullName: 'Emily Thorne',
    departmentId: 'DEPT-ENG',
    departmentName: 'Engineering & QA',
    items: [
      { itemId: 'STAT-008', quantity: 1, unitCostSnapshot: 22.00 }
    ],
    justification: 'Slightly damaged standard mouse; requested ergonomic layout due to wrist pain.',
    status: 'draft',
    createdAt: '2026-06-11T06:30:00-07:00',
    updatedAt: '2026-06-11T06:30:00-07:00'
  },
  {
    id: 'REQ-2026-005',
    userId: 'USR-005',
    userFullName: 'James Miller',
    departmentId: 'DEPT-FIN',
    departmentName: 'Finance & Accounting',
    items: [
      { itemId: 'STAT-005', quantity: 2, unitCostSnapshot: 28.00 }
    ],
    justification: 'Replacement for damaged units in the auditing cubicles.',
    status: 'rejected',
    createdAt: '2026-06-08T11:00:00-07:00',
    updatedAt: '2026-06-08T16:00:00-07:00',
    rejectedByUserId: 'USR-006',
    rejectedAt: '2026-06-08T16:00:00-07:00',
    approvalComment: 'Please utilize current inventory spares in Ops division first before purchase.'
  }
];

export const INITIAL_TRANSACTIONS: InventoryTransaction[] = [
  {
    id: 'TXN-001',
    itemId: 'STAT-001',
    type: 'stock_in',
    quantity: 100,
    reason: 'Initial setup bulk procurement',
    createdAt: '2026-05-15T08:00:00-07:00',
    userId: 'USR-003'
  },
  {
    id: 'TXN-002',
    itemId: 'STAT-001',
    type: 'stock_out',
    quantity: -15, // Net remaining is 85 (100 - 15)
    referenceId: 'REQ-2026-001',
    reason: 'Issued for Request REQ-2026-001',
    createdAt: '2026-06-02T10:00:00-07:00',
    userId: 'USR-003'
  },
  {
    id: 'TXN-003',
    itemId: 'STAT-003',
    type: 'adjustment',
    quantity: -5,
    reason: 'Damaged item auditing in stockroom partition C',
    createdAt: '2026-06-05T14:30:00-07:00',
    userId: 'USR-003'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-001',
    userId: 'USR-004',
    userFullName: 'Samantha Sterling',
    userRole: 'super_admin',
    action: 'SYSTEM_SETTINGS_UPDATE',
    details: 'Modified Enforce Stock Levels configuration to [true] and reorder criteria alerts.',
    ipAddress: '192.168.1.45',
    createdAt: '2026-06-11T07:15:00-07:00'
  },
  {
    id: 'AUD-002',
    userId: 'USR-002',
    userFullName: 'David Vance',
    userRole: 'approver',
    action: 'REQUEST_APPROVAL',
    details: 'Approved stationery request [REQ-2026-003] for Emily Thorne.',
    ipAddress: '192.168.1.18',
    createdAt: '2026-06-10T15:30:00-07:00'
  },
  {
    id: 'AUD-003',
    userId: 'USR-003',
    userFullName: 'Alex Carter',
    userRole: 'admin',
    action: 'INVENTORY_ADJUSTMENT',
    details: 'Wrote down 5 units of Lever Arch File STAT-003 due to water stain damages.',
    ipAddress: '192.168.1.12',
    createdAt: '2026-06-05T14:30:00-07:00'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'NOTIF-001',
    userId: '', // Everyone or admins
    title: 'Low Stock Alert',
    message: 'Heavy Duty Lever Arch File (A4, 75mm) is down to 8 units (Reorder limit: 15).',
    type: 'warning',
    isRead: false,
    createdAt: '2026-06-11T05:00:00-07:00'
  },
  {
    id: 'NOTIF-002',
    userId: '',
    title: 'Low Stock Alert',
    message: 'Fluorescent Highlighter Markers is down to 4 units (Reorder limit: 10).',
    type: 'warning',
    isRead: false,
    createdAt: '2026-06-11T05:05:00-07:00'
  },
  {
    id: 'NOTIF-003',
    userId: 'USR-001',
    title: 'Request Approved',
    message: 'Your request for Desk Organizer and Markers (REQ-2026-003) has been approved by David Vance.',
    type: 'success',
    isRead: false,
    createdAt: '2026-06-10T15:30:00-07:00'
  }
];

export const INITIAL_CONFIG: SystemConfig = {
  requireAttachmentAboveCost: 100.00,
  lowStockAlertEmail: 'store-manager@corporate.com',
  autoApproveBelowCost: 15.00,
  enforceStockLevels: true,
  allowEmployeeDirectSourcing: false,
  portalName: 'Stationery Request Hub',
  portalSubtitle: 'Corporate Services Portal',
  announcementText: 'Welcome to the Corporate Stationery Request dispatch desk! Log a ticket, track your manager signoff, or request stock room pickups.',
  primaryColor: 'indigo'
};
