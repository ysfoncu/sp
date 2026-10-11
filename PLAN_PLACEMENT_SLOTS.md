# Plan: Placement slots (reference "Hantera platser")

Built from three expert reports (architecture, UX, product/QA) plus the reference screenshots (UMU Praxia manual, printed pp. 10-11). Nothing is implemented yet.

## What the reference shows
- A **Placement Slot** is one student's booking on one profile: organisation, student, profile, dates (the example is a single day), shift type "All Day", slot status "Committed" (list: "Bokad"), mentor (dropdown of the unit's supervisors/coordinators), courses and specialties.
- **Hantera platser** is a list with tabs Plats / Assignments, filter chips (start date, end date, slot status, "Is Parent Slot"), filters (profile, student, program, kull, organisation, date range, status, deletable), export (all / this page), and a person icon in the supervisor column to assign a mentor.
- Not explained by the manual: how slots are created, whether open (unbooked) slots exist, what "Parent Slot" means, and whether "Platser" on an organisation means slots. Do not claim capacity.

## Honest value
The data already exists (the student's `assignedPraksisPlace`). What is missing is one **cross-placement list: who is booked where, when, with which mentor, and who still has no mentor**, with mentor assignment from that list. The problem is small but real for a coordinator who assigns mentors for a whole cohort.

## Decisions

| Topic | Decision | Why |
|---|---|---|
| Stored or derived | **Derived view**, no new stored entity | A stored slot would drift from assign, detach, mentor and publish; placements are not persisted anyway |
| Slot id | `slot:{placementId}:{studentId}` | One assignment per student per placement; stable while it exists |
| Capacity | Slot = **usage**, not pre-created open capacity. `places` stays the offer; slots are the rows behind `used` | Works with advisory capacity; open slots would duplicate `places` |
| Where | New sidebar item **Placement slots** (under Praksis-students) plus later a **Slots** tab per unit using the same list with fixed filters | One list, two entry points |
| Creating slots | Only in the placement workflow. The slots screen never creates | Avoids a second assign path |
| Editing | Mentor (popover, saves on select, toast with Undo). **No date editing** here: dates belong to the placement/student | Keeps one source of truth |
| Delete | No hard delete in v1. "Cancel slot" reuses the existing detach: the student returns to *In placement* and the unit's place is freed | Keeps rules in one place |
| Out of scope | Shift types, parent/child slots, courses/specialties editor, "Mina studenter" mode, site-contact edit flow | Not needed yet; reference unclear |
| Personnummer | Not shown in the list (sensitive); student ID shown | Privacy |

## Statuses (our terms)
Slot status = the assignment status already stored (planned → booked once published → completed, cancelled). List chips: **All · Planned · Booked · Completed · No mentor** (a Cancelled chip only if cancelled assignments are kept as rows; today detach removes them). Default view: Planned + Booked, sorted by start date.

## Data
- No data changes, no migration, no new localStorage key.
- New pure file `src/types/placementSlot.ts` (added to tsconfig include):
  - `type PlacementSlot` = id, placementId, placementTitle, placeId/placeName, unitId/unitName, profileId/profileName, programId, emneId, studentId/studentName, startDate, endDate, status, mentor, assignedDate.
  - `slotId(placementId, studentId)`
  - `buildSlots({ placements, taskStates, profiles, places, programName, emneName })`: one slot per student that has an assignment; profile via `resolveAssignmentProfile`; dates from the assignment, then the student's own period, then the placement window; sorted by start date then name.
  - `filterSlots(slots, f)`: text search, study/program/emne, place/unit, profile, mentor (any / specific / none), status, date range with overlap.
  - `slotsToCsv(slots)`: fixed header, RFC-4180 quoting, prefix cells starting with `= + - @` to block formula injection.
  - `countByStatus`.

## Rules
1. A mentor must be an associated contact of the slot's profile (reuse `mentorState`); a mentor removed from the profile shows "removed" and must be re-picked.
2. One active slot per student per placement.
3. Cancelling a slot frees the profile's place (usage already ignores cancelled/removed) and the student returns to *In placement* in Praksis-students.
4. A mentor change after publish is allowed, shows as changed since publish, and is logged in the drawer history.
5. A slot with no resolvable profile (older assignments) falls back through `resolveAssignmentProfile`.
6. Slot status never drifts: it is read from the assignment; Praksis-students status stays derived from the same data.
7. Bulk mentor assignment only when every selected slot is in the same unit; otherwise block with the reason and offer per-unit picking.
8. Over-capacity is shown as today; no new rule.

## UI
- **Placement slots page** (reuse the Praksis-students layout): status chips with counts (counts ignore the status filter), search, Study → Program → Emne, Place → Unit, Profile, Mentor, start date range, Clear filters (keeps status). Columns: ID, Student (name, student ID), Program/Emne, Place · Unit, Profile, Start, End, Mentor (name or an "Assign" ghost button), Status, row menu. Paging as in Praksis-students. Export button: filtered list as CSV, or selected rows.
- **Mentor popover**: search, only the profile's contacts, current one checked, "Remove mentor", saves on select.
- **Bulk bar**: "N selected · Assign mentor · Export selected · Clear".
- **Drawer** (row click): read-only place, unit, student, placement, profile, dates, emne; editable mentor; footer actions "Mark as completed" (only past the end date) and "Cancel slot" (confirm dialog, optional reason); last 10 history items; links "Open placement" and "Open student".
- **Empty states**: none placed ("Slots are created when you assign students in a placement") with a link to Student placement; no match with Clear filters; "No mentor" at zero shows "Every slot has a mentor."
- **Per unit** (phase 4): a "Slots" tab in Praksis places with place and unit fixed, chips Now / Upcoming / Past, and a count next to each supervisor ("supervising 2 now").
- Praksis-students gets a "View slot" link on placed rows.
- Terminology in the UI: **Placement slot**, status words Planned / Booked / Completed, "Mentor". Avoid the Swedish "kull" unless the data has a cohort.

## Wiring notes
- `PlacementTaskView` keeps its students in local state and syncs them up through `onTaskStateUpdate`, so a mentor change from the slots page must write into `placementTaskStates` in `App.tsx` through one shared function (reuse the mentor-assign logic and the "changed since publish" snapshot logic; extract it as a pure helper rather than copying). The placement view reads `initialTaskState` when it opens, so it picks the change up on the next open.
- Add the view id `slots` to `App.tsx` and `EnhancedSidebar.tsx`.

## Phases
1. **Logic (S/M):** `placementSlot.ts` + tests; tsconfig; `npm test`, `typecheck`, `build`.
2. **List + mentor assign (M):** `PlacementSlotsView.tsx`, sidebar item, App wiring, mentor popover with Undo, CSV export.
3. **Drawer, cancel, bulk mentor (M):** `PlacementSlotDrawer.tsx`, cancel through the existing detach, history, per-unit check for bulk.
4. **Unit tab (S):** Slots tab in Praksis places with fixed filters; link from Praksis-students.
5. **Safari acceptance, refine, report.**

## Unit tests
One slot per assigned student and none for others; deterministic unique ids across placements; legacy assignment without `profileId` resolves by fallback; dates fall back assignment → student → placement; every filter incl. date overlap edges and mentor none/any/specific; counts ignore the status filter; CSV quoting, formula-injection prefix and header; slot count per profile equals `used` from `profileTreeForPlacement` (consistency); mentor validity (ok / removed / none); one active slot per student per placement; bulk mentor blocked across units; cancel frees the place.

## Safari acceptance script
1. Import students, create profiles, create a placement and place students on two units (one profile with no contacts).
2. Open **Placement slots**: one row per placed student, columns as above, default Planned + Booked.
3. Search by student name; filter by place, unit, profile; counts on chips stay correct.
4. "No mentor" chip lists students without a mentor.
5. Click the mentor icon on a row: only that profile's contacts are listed; pick one; row updates and a toast with Undo appears; Undo restores.
6. Open the placement: same mentor shown in the students panel.
7. Remove that contact from the profile: slot shows "removed"; re-pick.
8. Select rows from two units, click Assign mentor: blocked with the reason; select rows from one unit: works.
9. Open the drawer: fields, history entry for the mentor change, links work.
10. Cancel a slot: confirm; row gone; profile shows one more place; student is *In placement* in Praksis-students.
11. Export CSV of the filtered list: rows match the screen; a name starting with "=" is prefixed.
12. Publish, then change a mentor: slot marked changed since publish.
13. Complete the placement: slots show Completed and stay visible under that chip.

## Not in scope
Shift types, parent slots, open slots as pre-created capacity, a stored slot table, email notifications, site-contact edit workflow, personnummer in lists.

## Open decisions (defaults in bold)
1. Derived view (**yes**) or real booked slots that capacity is booked against (only if a site contact must reserve places before choosing students)?
2. Keep cancelled slots as visible rows (needs a `cancelled` assignment status) or let cancel remove the row (**remove, as detach does today**)?
3. Per-unit Slots tab in the same release or later (**later**)?
