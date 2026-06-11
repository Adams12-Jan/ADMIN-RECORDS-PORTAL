/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuditLog, User } from '../types';

export function loadState<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch (err) {
    console.error('Failed to load local storage state:', err);
  }
  return defaultValue;
}

export function saveState<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to local storage state:', err);
  }
}

export function createAuditLog(
  user: User,
  action: string,
  details: string
): AuditLog {
  return {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userFullName: user.fullName,
    userRole: user.role,
    action,
    details,
    ipAddress: '192.168.1.' + Math.floor(Math.random() * 254 + 1),
    createdAt: new Date().toISOString()
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Simple export CSV utility
export function exportToCSV(filename: string, headers: string[], rows: string[][]) {
  const content = [
    headers.join(','),
    ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function resolveLogoUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  // Match Imgur album: imgur.com/a/xxxx
  const albumRegex = /imgur\.com\/a\/([a-zA-Z0-9]+)/;
  const albumMatch = url.match(albumRegex);
  if (albumMatch && albumMatch[1]) {
    return `https://i.imgur.com/${albumMatch[1]}.png`;
  }
  
  // Match standard Imgur page: imgur.com/xxxx (excluding static directories/words)
  const singleRegex = /imgur\.com\/([a-zA-Z0-9]+)(?:\.\w+)?$/;
  const singleMatch = url.match(singleRegex);
  if (singleMatch && singleMatch[1]) {
    return `https://i.imgur.com/${singleMatch[1]}.png`;
  }

  return url;
}
