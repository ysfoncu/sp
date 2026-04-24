# Change Requests — Unpushed Changes

Branch: `placement` | Status: **not yet pushed to origin**

---

## 1. Per-Entity Rejection in the Review Quota Request Dialog

**Files changed:**
- `src/types/coordinatorQuotaRequest.ts`
- `src/components/ApproveRejectQuotaModal.tsx`
- `src/components/CoordinatorQuotasView.tsx`

### What changed

#### Type: `EntityDistribution` — new `status` field

```ts
// src/types/coordinatorQuotaRequest.ts
status?: 'pending' | 'approved' | 'rejected'; // Per-entity review status
```

Each entity in a quota request now carries its own approval state independently of the parent request.

---

#### Dialog width — wider

The **Review Quota Request** dialog was widened from `max-w-2xl` (768 px) to `max-w-4xl` (896 px) to give the entity table enough room for the new column.

---

#### Entity Distributions table — new "Reject" column

The table inside the dialog now has four columns instead of three:

| Entity | Requested | Approve | **Reject** |
|--------|-----------|---------|------------|
| Ortopedisk klinikk | 2 | `[input]` | `[✕ toggle]` |
| Akuttavdeling | 1 | `[input]` | `[✕ toggle]` |

**Behaviour:**
- Clicking the **✕ toggle** marks that entity as rejected. The row turns red, the entity name gets a strikethrough, and the Approve input is disabled.
- Clicking the toggle again **undoes** the rejection.
- The footer summary shows a **Rejected** counter when at least one entity is rejected.
- If **all** entities are marked as rejected the form blocks submission and asks the user to use the top-level Reject button instead.
- The `onApprove` callback now also receives `entityStatuses` — a map of `entityId → 'approved' | 'rejected'` — so the parent can persist per-entity outcomes.

```
┌─────────────────────────────────────────────────────────┐
│  Entity              │ Requested │ Approve │  Reject     │
├──────────────────────┼───────────┼─────────┼─────────────┤
│  Ortopedisk klinikk  │     2     │  [ 2 ]  │   ○  (off)  │
├──────────────────────┼───────────┼─────────┼─────────────┤
│  ~~Akuttavdeling~~   │     1     │  ░░░░   │   ● (on/red)│
└─────────────────────────────────────────────────────────┘
  Total  Requested: 3   To Approve: 2   Rejected: 1
```

---

## 2. Per-Entity Status in the Capacity Planning — Quota Requests Table

**File changed:** `src/components/CoordinatorQuotasView.tsx`

### What changed

Previously the **Status** column used `rowspan` to show a single overall badge with one check icon covering all entity rows of a request.

Now each entity row has its own Status cell derived from `entity.status`:

| Row | Status cell |
|-----|-------------|
| First entity (isFirstRow) | coloured badge **with** icon (check / clock / X) |
| Every subsequent entity | coloured badge **without** icon (text only, smaller) |

This means only **one check icon** is ever visible per request group (first row), while every entity still shows its individual approval outcome.

**Status colour mapping:**

| Status | Badge colour |
|--------|-------------|
| `approved` | Green (`bg-green-100 text-green-700`) |
| `rejected` | Red (`bg-red-100 text-red-700`) |
| `pending` | Yellow (`bg-yellow-100 text-yellow-700`) |

Entity statuses are no longer displayed inside the **Entities** column — they appear only in the **Status** column.

---

## 3. Rejected-Entity Indicators in the Placement Task — Available Quotas Panel

**File changed:** `src/components/AvailableQuotasTable.tsx`

### What changed

#### `processQuotaRequests` — correct entity status derivation

Previously, an entity with `approvedQuota = 0` was incorrectly treated as `'approved'` because `0 !== undefined`. The fix checks `entity.status === 'rejected'` first:

```ts
// Before
const entityStatus = entityExplicitlyApproved || request.status === 'approved'
  ? 'approved' : 'pending';

// After
const entityStatus =
  entity.status === 'rejected' ? 'rejected' :
  entityExplicitlyApproved || request.status === 'approved' ? 'approved' : 'pending';
```

#### Entity row — visual states

Three distinct row states are now rendered:

| State | Row background | Assign button |
|-------|---------------|--------------|
| Pending | Amber (`bg-amber-100/70`) | Edit / Delete / Approve actions |
| Approved (available) | White (hover blue) | **Green** circle (`text-green-600`) |
| Approved (full) | Light gray | Gray circle (disabled) |
| **Rejected** | **Red tint** (`bg-red-50/60`) | **Red** circle (disabled, cursor-not-allowed) |

Before this change the assign button was blue for available slots. It is now **green** for approved/available and **red** for rejected — making it immediately clear that students cannot be assigned to a rejected entity.

```
┌──────────────────────────────────────────────────────────────────┐
│  Oslo University Hospital HF          2 avail  •  2 approved     │
├──────────────────────────────────────────────────────────────────┤
│  • Ortopedisk klinikk ⓘ    1/1 req·apr  |  0/1/0 con·avail·asgn  [🟢]│
├──────────────────────────────────────────────────────────────────┤
│  • Akuttavdeling ⓘ  (red bg) 1/0 req·apr  |  0/0/0 con·avail·asgn [🔴]│
└──────────────────────────────────────────────────────────────────┘
```

---

#### Entity detail dialog — rejection notice

Clicking a **rejected** entity row now shows a dialog with:

1. A red banner at the top: **"This request has been rejected"**
2. The Capacity card has a red tint and shows `1 requested / rejected` instead of an approved count
3. The Assignment breakdown, Total used, and Available rows are hidden (irrelevant for rejected entities)

```
┌──────────────────────────────────────────────┐
│  Oslo University Hospital HF            ✕    │
│  Akuttavdeling                               │
│                                              │
│  ⚠ This request has been rejected            │  ← red banner
│                                              │
│  ┌───────────────────┐  ┌──────────────────┐ │
│  │ CAPACITY (red bg) │  │ PERIOD           │ │
│  │ 1 requested       │  │ 24 Apr – 30 Apr  │ │
│  │ / rejected        │  │                  │ │
│  └───────────────────┘  └──────────────────┘ │
│                                              │
│                              [ Close ]       │
└──────────────────────────────────────────────┘
```

---

## Summary of files changed

| File | Change |
|------|--------|
| `src/types/coordinatorQuotaRequest.ts` | Added `status` field to `EntityDistribution` |
| `src/components/ApproveRejectQuotaModal.tsx` | Wider dialog; Reject column in entity table; per-entity rejection logic; `entityStatuses` passed to parent |
| `src/components/CoordinatorQuotasView.tsx` | Per-entity status badge in Status column (one icon per group); `entityStatuses` persisted on approve |
| `src/components/AvailableQuotasTable.tsx` | Correct rejected entity status detection; red row + red button for rejected entities; rejection notice in detail dialog |
