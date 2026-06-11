/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'employee' | 'approver' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  departmentId: string;
  avatarUrl?: string;
  status: 'active' | 'inactive';
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headUserId: string; // User ID of the department head
}

export interface StationeryItem {
  id: string; // Item Code (e.g. STAT-001)
  name: string;
  category: string;
  description: string;
  unitCost: number;
  availableQuantity: number;
  reorderLevel: number;
  vendorName: string;
  status: 'active' | 'inactive';
}

export type RequestStatus =
  | 'draft'
  | 'submitted'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'issued'
  | 'completed';

export interface RequestItem {
  itemId: string;
  quantity: number;
  unitCostSnapshot: number; // Snapshot of cost at order time
}

export interface StationeryRequest {
  id: string; // Request Code (e.g., REQ-2026-0001)
  userId: string; // Requester User ID
  userFullName: string;
  departmentId: string;
  departmentName: string;
  items: RequestItem[];
  justification: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  approvalComment?: string;
  approvedByUserId?: string;
  approvedAt?: string;
  issuedByUserId?: string;
  issuedAt?: string;
  completedAt?: string;
  rejectedByUserId?: string;
  rejectedAt?: string;
  supportAttachmentName?: string; // Optional file reference
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'transfer';
  quantity: number; // Positive or negative
  referenceId?: string; // E.g., request ID
  reason: string;
  createdAt: string;
  userId: string; // Actor
}

export interface AuditLog {
  id: string;
  userId: string;
  userFullName: string;
  userRole: UserRole;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string; // Empty string for all admins or specific for a user
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  isRead: boolean;
  createdAt: string;
}

export interface SystemConfig {
  requireAttachmentAboveCost: number;
  lowStockAlertEmail: string;
  autoApproveBelowCost: number;
  enforceStockLevels: boolean;
  allowEmployeeDirectSourcing: boolean;
  portalName?: string;
  portalSubtitle?: string;
  announcementText?: string;
  primaryColor?: string;
}
