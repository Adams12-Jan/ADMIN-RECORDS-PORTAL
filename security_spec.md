# Firestore Security Rules Specification

This document defines the high-security standard and test-driven validation (TDD) for the Vetiva Stores & Bin Card Portal's Firestore database.

## 1. Data Invariants

1.  **Identity Lock**: A user document's `id` field must strictly match its Firestore Document ID and the authenticated user's `request.auth.uid`. No user can create or modify a profile for another client UID unless they are an Admin.
2.  **Role Protection**: Non-admins are strictly forbidden from setting or changing their own `role` or `status` attributes.
3.  **Voucher Integrity**: Requests/requisitions must belong to a valid department and user; non-owners can only update specific fields during approval and dispatch states.
4.  **Audit Durability**: Audit logs are write-once; they can never be modified or deleted once stored.
5.  **Stock Ledger Protection**: Stationery catalog item records are modifiable only by administrative accounts.

---

## 2. The "Dirty Dozen" Vulnerability Payloads

The following malicious Firestore operations must be explicitly blocked and return `PERMISSION_DENIED`:

### User Profiles (`/users/{userId}`)
1.  **Self-Escalation**: User attempting to register or update their role to `super_admin`.
2.  **Identity Spoofing**: Signed-in user 'A' trying to overwrite user 'B''s profile.
3.  **Invalid ID Poisoning**: Registering with a bloated, malicious string as the Document ID.

### Catalog (`/catalog/{itemId}`)
4.  **Malicious Pricing Insert**: Regular employee attempting to update standard unit costs or reorder thresholds.
5.  **Mass Deletion**: Unauthorized deleting of stationery catalog templates.

### Requests (`/requests/{requestId}`)
6.  **Unapproved State Forgery**: Requester submitting a pre-approved voucher (`status: "approved"`) bypassing review gates.
7.  **Key Forgery**: User injecting unofficial "shadow keys" / custom parameters into a request ticket.
8.  **Status Hijacking**: Employee forcing status of another user's request directly to `completed`.

### System Config (`/systemConfig/{config`)
9.  **Config Destruction / Sabotage**: Non-admin overwriting system thresholds (`autoApproveBelowCost: 999999`).

### Audit & Transactions
10. **Ledger Tampering**: Modifying existing transaction stock ledger historical entries.
11. **Log Deletion**: Attempting to delete critical audit trail documents.
12. **Malicious Empty Log**: Creating an audit log document without the required size validator keys.

---

## 3. Test Runner Definition (`firestore.rules.test.ts`)

Here is the specification of tests to run in our testing suite to confirm that our security rules successfully prevent unauthorized access:

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

describe('Vetiva Firestore Security Rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'oval-quanta-t8gvj',
      firestore: {
        rules: require('fs').readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it('blocks user self-escalation role write', async () => {
    const context = testEnv.authenticatedContext('user_123', { email_verified: true });
    const db = context.firestore();
    const docRef = doc(db, 'users', 'user_123');
    await assertFails(setDoc(docRef, {
      id: 'user_123',
      email: 'user@example.com',
      fullName: 'Attacker',
      role: 'super_admin',
      departmentId: 'DEPT-1',
      status: 'active'
    }));
  });

  it('blocks unauthorized profile spoofing', async () => {
    const context = testEnv.authenticatedContext('user_123', { email_verified: true });
    const db = context.firestore();
    const docRef = doc(db, 'users', 'user_abc');
    await assertFails(setDoc(docRef, {
      id: 'user_abc',
      email: 'abc@example.com',
      fullName: 'Alice',
      role: 'employee',
      departmentId: 'DEPT-1',
      status: 'active'
    }));
  });
});
```
