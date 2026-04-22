



## Praksis Places Page

### Slots Tab

A new Slots tab lets coordinators define a maximum student capacity per organizational node within a praksis place. Settings are enforced in the quota request form across both the Capacity Planning page and the Placement Task page.

---

## Capacity Planning Page

### Multi-Entity Quota Requests

> A quota request is normally made to a single department (entity) within a praksis place. A multi-entity request lets a coordinator request capacity from several departments within the same praksis place in a single submission — for example, requesting 5 spots from *Kirurgisk klinikk* and 3 from *Akuttavdeling* at Oslo University Hospital HF as one request, rather than two separate ones. Each department keeps its own quota, approval status, and assigned student count.

### Request Quota Dialog

The dialog is reorganized into 3 steps:

**Step 1** uses a two-column layout. The left column contains the form fields in this order: Praksis Place selector, Placement Period (start/end dates), and Academic Information (study, program, emne — only shown when opened outside a placement context). The right column reactively shows active existing requests for the selected praksis place (requests with an end date in the future), with columns Study/Program, Entity, Req · Apr · Con, Period, and Status. If no place is selected yet a placeholder is shown.

**Step 2** shows the entity distribution. The left column is the org-tree for the selected place — first-level entities (clinics/departments directly under the root) are expanded by default. The right column is the entity distribution table with columns: #, Entity Name, **Max** (slot limit in orange, or — if none configured), Quota (editable input capped at Max), and Action. This makes the configured slot limit visible for every entity at a glance.

**Step 3** is the summary: a review card showing all selections and a notes field.

### Slot Limits in Quota Requests

The org-tree selector shows each node's configured slot limit as a fraction next to the quantity input (e.g. `3 / 10`). The input is capped at the slot maximum; the Add button is disabled if the limit is zero or exceeded. The entity distribution table shows the slot limit as a dedicated Max column and enforces the cap with an inline validation error.

## Placement Task Page

### Layout

The page is reorganized into a two-panel layout: a sticky quota sidebar (400 px, left) and a scrollable student panel (right). Quota information stays visible while working through the student list. An expand/collapse button temporarily hides the sidebar to give the student table full width.

The student table is horizontally scrollable on narrower screens without affecting the overall page width.

The task progress banner in the main content area is replaced by a compact step chip in the page header.

### Available Quotas Panel

The flat table-with-chart layout is replaced with a hierarchical card list grouped by **Praksis Place → Request → Entity**.

Each entity row shows inline metrics:
- `req · apr` — requested vs. approved quota
- `con · avail · asgn` — consumed by other placements / available for this placement / assigned here

Available capacity accounts for students assigned in *other* concurrent placements using the same quota. Formula: `approved − consumed by other placements − assigned in this placement`. The consumed-by-others count is shown in orange when non-zero.

Per-entity approval status is independent: an entity can be approved even if sibling entities in the same request are still pending.

Clicking any entity row opens a detail dialog showing a full capacity breakdown, date range, per-placement assignment counts, and an availability summary.

### Student Table

- Toggle to show only unassigned students
- Progress bar showing assigned / total count
- Assigned students visually de-emphasized (faded green); unassigned students highlighted
- Search field to filter by student name
- Sortable name column (asc / desc / unsorted, toggled by clicking the header)

### Assignment Workflow

Main task indicator moved to top right

Once all students are assigned, a banner appears offering to publish (lock) the assignments. Published state and date are stored in `PlacementTaskState`. The header shows an **Edit** button to re-enter edit mode; **Cancel Edit** restores the locked state without re-publishing.

### Conflict Warnings (Assign Students Modal)

Students who have a placement history at the same praksis place or department being assigned are highlighted in amber with an inline warning showing the conflicting placement details (year, semester, subject code, unit name).

---

## Test Flow

### 1. Configure slot capacities (Praksis Places)

1. Open the **Praksis Places** tab from the sidebar.
2. Click **Oslo University Hospital HF**.
3. Go to the **Slots** tab inside the detail view.
4. Find **Kirurgisk klinikk** and set its capacity to `10`.
5. Find **Akuttavdeling** (under Ortopedisk klinikk) and set it to `3`.
6. Save — these limits will be enforced in quota request forms.

---

### 2. Create a multi-entity quota request (Capacity Planning)

1. Open the **Capacity Planning** tab from the sidebar.
2. Click **New Request** — the dialog opens at step 1.
3. In the left column select **Oslo University Hospital HF**. The right column immediately shows any active existing requests for that place.
4. Set a start and end date, then click **Next**.
5. In step 2, the org-tree opens with first-level nodes already expanded. Click **Kirurgisk klinikk** and enter `8` — the input is capped at 10 (the slot limit shown in the tree as `8 / 10`).
6. Click **Akuttavdeling** (under Ortopedisk klinikk) and try entering `5`. The input is blocked at `3`. In the distribution table the **Max** column shows `3` in orange for this entity.
7. Set it to `2` and click **Add**. The distribution table now shows two rows.
8. Click **Next** to reach the summary, then **Submit**. The request appears in the list with status **Pending**.
9. Approve **Kirurgisk klinikk** with quota `8`, leave **Akuttavdeling** pending — per-entity approval works independently.
10. Create a placement task from the approved request by pressing →

---

### 3. Check the placement task page layout (Placement Task)

1. Confirm the page shows a sticky quota sidebar on the left and the student panel on the right.
2. Click the **expand** button (top of the sidebar) — the sidebar collapses and the student table fills the full width. Click again to restore.
2. Check the page header: the task progress chip (e.g. *Step 2 / 6*) should appear in the top right instead of a banner in the main content area.

---

### 4. Inspect the Available Quotas panel

1. In the quota sidebar, confirm quotas are displayed as a hierarchical card list: **Oslo University Hospital HF → request → Kirurgisk klinikk** and **Akuttavdeling** as separate entity rows.
2. Each entity row shows `req · apr` and `con · avail · asgn` metrics inline.
3. If another placement is using the same quota, the **con** value is shown in orange.
4. Click the **Kirurgisk klinikk** entity row — a detail dialog opens showing the full capacity breakdown, date range, and per-placement consumption list. Close the dialog.

---

### 5. Work with the student table

1. In the student panel, type **"Emma"** in the search field — the table filters to show only Emma Johnson.
2. Clear the search. Click the **Name** column header to sort ascending, click again for descending, click a third time to clear sorting.
3. Toggle **Show unassigned only** — assigned students disappear from the list; the progress bar at the top shows `X / 5 assigned`.

---

### 6. Assign students and check conflict warnings

1. Click **Assign** next to a student. In the Quick Assign modal, select **Oslo University Hospital HF → Kirurgisk klinikk**.
2. If a student (e.g. Michael Chen) has a prior placement at Oslo University Hospital HF, their row is highlighted in amber with a conflict warning showing the year, semester, subject code, and unit name.
3. Assign all five students. The progress bar reaches `5 / 5`.

---

### 7. Publish and edit assignments

1. Once all students are assigned, a **Publish** banner appears at the top of the student panel. Click **Publish**.
2. The banner updates to show the published date. All assignment rows become read-only.
3. Click **Edit** in the page header to re-enter edit mode. Make a change.
4. Click **Cancel Edit** — the locked state is restored without re-publishing.


