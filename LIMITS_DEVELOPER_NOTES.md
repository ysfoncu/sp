# Developer notes: Praksis place limits replace Capacity planning

These are the functional changes in this update. Capacity planning (quota requests per emne) is retired. Student placement capacity now comes from **praksis place limits**. Limits are set on the organisation tree of a praksis place, split by emne, and counted per year or semester.

---

## 1. Removed and hidden

| What | Change | Where |
|---|---|---|
| **Capacity planning page** | Removed from the sidebar. The code is kept but nothing links to it (`currentView === "quotas"` still renders `CoordinatorQuotasView`). | `EnhancedSidebar.tsx`, `App.tsx` |
| Dashboard "Quota requests" widget | Always hidden, because it linked to Capacity planning. `App.tsx` passes `dashboardSettings={{ ...dashboardSettings, quotaRequests: false }}`. | `App.tsx` |
| Request quota from a placement | Removed: the RequestQuotaModal wiring and the approve / edit / delete request handlers are gone from the placement task, and it no longer reads quota requests. | `PlacementTaskView.tsx`, `PlacementModals.tsx` |
| "Available Quotas" panel | Replaced by **Available limits**. `AvailableQuotasTable.tsx` is only kept for its exported `CrossPlacementData` type. | `PlacementTaskView.tsx` |
| Praksis places → **Slots** tab | Replaced by the **Limits** tab. The tab key is still `"slots"`. | `PraksisPlacesView.tsx` |
| Capacity planning report (quota requests) | Rewritten to use limits (section 5). | `CapacityPlanningReportView.tsx` |

Kept but unused: `CoordinatorQuotasView.tsx`, `AddCapacityModal.tsx`, `RequestQuotaModal.tsx`, and the quota-request state plus its `localStorage.coordinatorQuotaRequests` persistence in `App.tsx`. Adding the sidebar item back brings the page back.

---

## 2. Data model

`src/types/praksisLimit.ts`

```ts
interface PraksisPlaceLimit {
  id; praksisPlaceId; entityId; entityName;
  limit: number;                        // total
  limitType: "yearly" | "semester";
  periodStart?: "MM/DD"; periodEnd?: "MM/DD";   // yearly only
  emneShares: LimitEmneShare[];         // { studyId, programId, programName, emneId, emneName, limit }, sums to `limit`
  createdAt;
}
```

- **Store:** a small module-level store (`usePraksisLimits`, `savePraksisLimits`, `removePraksisLimit`). It lives outside App state, so saving limits doesn't re-render or reset the rest of the app.
- **Persistence:** `localStorage["praksisPlaceLimits"]`. Limits survive reloads. Placements are still in-memory only.
- **One limit per entity:** `mergeDuplicateLimits` runs when the store loads and after every save. Limits for the same entity are merged into the oldest one: shares are added up and its type and period are kept.

---

## 3. Praksis places → Limits tab

`PraksisPlacesView.tsx`, `AddLimitModal.tsx`, `src/types/limitUsage.ts`

### Table
- **Tree:** the table is the praksis place's organisation tree, and branches can be collapsed.
  - The **top entity** (the praksis place itself) isn't shown and can't get a limit.
  - When an entity is **selected in the left tree**, only that entity and its units are shown. Selecting the praksis place shows all units.
- **Columns:**
  - Entity;
  - Limit;
  - **Total limit**: the own limit when the entity has one (its units are part of it), otherwise the sum of its units' totals. A grey "N set on units" note shows how much of a limit is given to limits below it;
  - Programs / Emner;
  - Type / Period;
  - Actions: **+ Add limit**, or Edit / Delete.
- **Rule violations:** existing limits that break the nesting rules (saved before the rules existed) get a red row, a red danger icon, and the reasons written under the entity name.

### Add / Edit limit dialog
The dialog is for **one limit on one entity**. There's no entity picker.
- **Required:** the limit total, the Programs / Emner (picked through study → program → emne; picking a program selects all its emner), the distribution of the total between the emner (it must add up; *Split evenly* fills it in), the limit type, and the period (MM/DD, yearly only).
- **"Within {parent}" line:** shows the parent's shares and how much room is left for this unit.
- **Range hints:** "Allowed: 50+" or "Allowed: 0–10" under the total, and "min · max" under each emne share. They turn red when a value is out of range.
- **Type and period:**
  - **Under a parent limit:** they are **locked to the parent's**.
  - **On a top limit:** a change also applies to every limit below it ("Also updates N limits below").
- **Blocking:** Save stays disabled while any rule is broken, and every rule break is listed in red.

### Nesting rules (`limitBounds`, `validateLimit`, `limitViolations` in `limitUsage.ts`)
- **P(X):** the nearest limit above X. **C(X):** the nearest limits below X; deeper limits count inside those.
- **R1:** for every limit N, `N.limit ≥ Σ C(N).limit`, and for each emne `N.share(e) ≥ Σ C(N).share(e)`. A share that is missing counts as 0.
  - So a limit can't be lower than the limits under it.
  - A limit must fit in the room its parent has left after its siblings: `max = P.limit − Σ(other C(P))`. This applies to the total and to each emne.
  - A child can't use an emne its parent doesn't include.
- **R2:** a limit's type and period match P(X).
- **Deleting a limit is always allowed.** Removing a limit in the middle can't break R1.

---

## 4. Student placement

`PlacementMetadataForm.tsx`, `PlacementTaskView.tsx`, `AvailableLimitsPanel.tsx`, `PlacementModals.tsx`, `src/types/limitUsage.ts`

### Creating a placement
- Placements are always created from blank.
- **Emne is required** and picked from the emner defined for the chosen program in Settings.
- After saving the details, a toast says how many limits the emne can use, or that none exist yet.

### How capacity is calculated (`limitTreeForPlacement`)
- **Only the unit is stored.** A placed student records the unit (`assignedPraksisPlace.placeId` + `entityId`/`departmentId`). `quotaRequestId` is no longer set or read.
- **Where an emne can place:** units with at least one limit above them (or on themselves), where **every** limit above them has a share for the emne. The limit's period must also cover the placement.
- **Usage of a limit:** the students of this emne (same program) placed at its entity or any unit under it. It counts this placement plus other placements whose period matches:
  - **yearly:** the placement's start date falls in the same MM/DD–MM/DD window, including windows that cross New Year;
  - **semester:** the same year and semester.
- **Places left at a unit:** the smallest remainder over the limits above it. The limit with the smallest remainder is named in tooltips.
- **Changes apply at once:** because usage is always recalculated, adding, changing or removing a parent limit later is correct immediately.

### Page
- **Available limits panel** (left), per praksis place, with the limits nested:
  - Each limit shows its period, places left against its share with a bar, "N used in other placements", and the placed students (expandable list).
  - **"Capped by {parent}: N left"** appears when a parent limit is tighter.
  - **Quick assign** assigns to the limit's entity.
  - The **edit** pencil opens the limit dialog with the emne **locked** to the placement's. The same rules apply.
  - A red danger icon and reasons appear for limits that break the rules.
  - There's **no "Add limit" here.** The empty state and footer point to *Praksis places → Limits*.
- **"Add praksis place" dialog for a student:** units are grouped by praksis place and show "N left". Full units are disabled ("Full: {limit} limit reached"). Earlier placements of the student at the same unit are highlighted.
- **Network diagram:** each student is drawn under the nearest limit above their unit. Its node counts show students attached to that limit directly, while the panel shows the full totals.
- **"Not enough places" alert and step 1 auto-complete:** these use the places the placement can use, i.e. the top-level shares minus what other placements used.

---

## 5. Capacity planning report

`CapacityPlanningReportView.tsx`. App now passes `praksisPlaces` instead of `requests`.
- **Left:** a Study → Program → Emne tree with search. Programs and emner show how many limits include them.
- **Top right:** a Year selector and a Spring / Autumn toggle set the period usage is counted for. It defaults to the current semester.
- **Right:** clicking a study, program or emne shows one card per emne under it.
  - **Header:** Places / Used / Left.
  - **Table,** grouped by praksis place and indented by nesting:

    | Column | Shows |
    |---|---|
    | Type / Period | The limit's type and period |
    | Limit | The emne's share |
    | Used | Students placed in the entity or its units in that period |
    | Left | Places remaining, plus "capped by …" when a parent is tighter |
    | Used by placements | The placements and how many students each placed |

  - Limits that break the rules show a red danger icon and the reason.

---

## 6. Other changes made along the way
- **Settings:** Settings → Studies & Programs uses App's `studies` state, so studies persist across navigation. There are two predefined study sets.
- **Help text:** `PlacementTaskHelpOverlay.tsx` explains limits instead of quota requests.

## 7. Key files

| File | Role |
|---|---|
| `src/types/praksisLimit.ts` | Limit type, store, persistence, merging duplicates |
| `src/types/limitUsage.ts` | Periods, tree calculation, nesting rules, violations |
| `src/components/AddLimitModal.tsx` | Add / Edit limit dialog |
| `src/components/PraksisPlacesView.tsx` | Limits tab (tree table) |
| `src/components/AvailableLimitsPanel.tsx` | Placement left panel |
| `src/components/PlacementTaskView.tsx` / `PlacementModals.tsx` | Placement capacity, assign dialog, diagram |
| `src/components/CapacityPlanningReportView.tsx` | Capacity planning report |

## 8. Known gaps
- **Placement report:** still reads the old quota requests, so it doesn't reflect limit-based placements.
- **Onboarding tour:** `OnboardingOverlay.tsx` still has a "Capacity Planning" step.
- **In-memory data:** placements and assignments aren't persisted. A full reload, including editing `App.tsx` during development, clears them; limits are kept.
- **Existing type errors:** two were there before this work: `App.tsx` `performedByRole: "system"`, and the `status` type of `NetworkDiagramQuota` in `PlacementModals.tsx`.
- **Type-checking:** `vite build` doesn't catch undefined identifiers. Check changed files with:
  ```bash
  npx -p typescript@5 tsc --noEmit --jsx react-jsx --skipLibCheck --esModuleInterop \
    --moduleResolution bundler --module esnext --target es2020 <files>
  ```
  Ignore the "Cannot find module" and implicit-any noise from the versioned imports.
