# Assigning students to praksis places: what is left to do

Written after assigning 50 students in Safari and reviewing the result with three experts (workflow design, allocation logic and data, performance and accessibility). Items that have since been built were checked against the code and removed from this file. Built so far: the first-publish step and its warning are gone. Placing students no longer uses a dialog: the + button on an entity makes it the target (highlighted, with a one-time hint dialog that can be switched off), the students are picked in the Students table (or ticked first: a light indigo "Students first" bar then lets you search and pick the entity, grouped by place with places left and "over by N", or press the + of a card, which then chooses that entity for the ticked students), and a dark bar at the bottom adds them ("Add N to <entity>", "over by N", "Select top N by points", Undo; it closes after Add, and Done or Escape ends it; the + of another entity switches the target and keeps the selection). The table shows imported priority points, study location, "Not registered" and the address, ranks by points, and searches by address; its assigned / not assigned counts are filters, with icons and a places-left line; "Select all" takes every unassigned student the filters show; the table's Actions menu is gone, and checkboxes show only on students without an entity (so selection is only for placing); full entities can be picked in the per-student dialog (shown as over); the capacity bars are progressbars; lists are memoized, and the Students table has no paging: every student is listed (154 rows rendered fine; at 500 or more the long list may need virtualization, see the speed notes).

## 1. What was tested

- Placement: Sjuksköterskeprogrammet, VFU HT 2022 (study "Hälso- och sjukvård samt social omsorg").
- 154 students waiting, 10 eligible entities with 53 places in total. The page shows "Not enough places: 154 students, 53 places, add 101 more".
- Mock data: 3 praksis places, 40 entities (ten per program), 485 imported Umeå students.
- 50 students were assigned through the old Quick Assign dialog (now replaced by the placing bar), one entity at a time: 10 entities took 10 rounds (open, tick N, confirm).

## 2. How efficient is it today

Clicks are not the main cost. The decisions were made blind, which the dialog now partly fixes. The remaining cost is the entity-at-a-time unit of work.

| Students | Rounds (about 5 per entity) | Estimated time (expert estimate, not measured) |
|---|---|---|
| 50 (tested) | 10 | a few minutes by hand |
| 100 | about 20 | about 10 minutes |
| 500 | about 100 | 45 to 60 minutes |

### 2b. The per-student "Add praksis place" path (tested)

- "Add praksis place" on a row opens "Select Praksis Place", a dialog listing the entities grouped by place with "N left" or "Full". One click on an entity assigns the student. That is 2 clicks per student, or about 200 clicks per 100 students (the table lists every student, with no paging).
- The student's preferred place (when there is one) is visible in the same row, but the dialog itself shows no priority, location or preference.

Unexplained: after the 50-student run the page showed 50 assigned and 3 of 53 places left. When I came back to test the per-student path it showed 40 assigned and 13 of 53 left. I did not detach anyone on purpose and have not found the cause. It should be checked before relying on those numbers.

## 3. Findings still open

1. **One entity at a time.** There is no way to say "fill the Bergen places from students who prefer Bergen".
2. **Preference data is missing.** The first-publish step is gone, so students no longer submit "Preferred: …" requests, and nothing collects them. Where they existed, they were a place name only, not an entity.
3. **History is matched by name.** The placed-here-before warning compares place and unit names as text. The students table does not show it yet.
4. **The "Not enough places" banner offers no action.** The progress line says how many students are "without a free place", but nothing helps raise places or ask for more.

## 4. Recommended design

### Principle

Invert the unit of work. Work from the student queue against entity capacity, and let the system propose a distribution that the coordinator reviews.

### Phase 2: the step change

- **Suggest, then review.** One pure function, `proposeAllocation(students, entities, ctx, rules, locked)` in a new `src/types/allocation.ts`. It writes nothing. A "Suggest distribution" step shows the result as a preview.
  - Hard constraints (never auto-placed if broken, listed as "needs manual"): not already assigned or locked, registered, entity active and matching program and emne, period overlap, not claimed by another placement.
  - Soft scoring, with weights shown to the coordinator and editable:
    - priority points (dominant);
    - preference rank (1st, 2nd, 3rd choice);
    - same region as the study location;
    - penalty for the same place or entity as before;
    - slight nudge toward entities with more places left.
  - Deterministic order: priority descending, then preference rank, then import date, then id. Each student takes the best-scoring entity with places left. Ties go to the entity with the most places left, then name, then id. A greedy method is easy to explain, so do not use an optimiser yet.
  - Each proposed row carries its reasons ("Preferred Bergen", "Priority 87") and the runner-up entity.
  - The coordinator can deselect rows, change the entity for a row, then press "Apply N assignments". One apply is one undo entry.
  - Manual assignments are locked. A re-run only touches unlocked "planned" rows.
- **Split view, what is left.** The core is built (pick students in the table, add them from the bar). Still to do: shift-click range selection in the table, filters on the entity cards (by place, "has capacity"), a program and emne match marker on the cards, and showing preferred place and history as columns once they have data.
- **Demand over capacity (154 students, 53 places).** Never block and never overbook silently.
  - The suggestion fills each entity to its places in priority order and lists the rest as "unplaced (no free place)" with a reason.
  - Replace the "add 101 more" banner with a "capacity gap by place" table (demand by preferred place against places) and an action to ask a place for more places.
  - An optional, off-by-default setting can allow overbooking up to a percentage on the best-fit entities. Those rows carry an "over by N" tag.

### Phase 3: refinement

- **Collect student preferences** in a step of their own, now that the first publish is gone. Preferences should name an entity or place (ranked, at most 3), plus a free-text reason.
- Keyboard flow: autofocus search in the dialog, Enter to assign, shift-click range select, per-row "Assign to…", focus moves to the next entity after assigning. Drag and drop is secondary because it does not scale across 154 rows.
- Pair placement, repeat-avoidance and region rules per emne.
- Optimal global matching in place of greedy. Not now.

## 5. Data model changes needed

| Change | Size | Testable as pure function |
|---|---|---|
| `proposeAllocation` with scoring, tie-breaks and explanations (`src/types/allocation.ts`) | medium | yes: determinism, constraints, lock, over-demand, tie-breaks |
| `assignedPraksisPlace.source` (manual or auto), `locked`, `batchId`, and undo helper | small | yes (apply and undo as pure reducers) |
| Rule set per emne in the catalog (`pairPlacement`, avoid repeat, weights) | small to medium | yes |
| Region on `PraksisPlace` plus a `studyLocation` to region mapping | medium | yes (`locationScore`) |
| Structured student address (street, postcode, city, country) in place of the free-text line; only 27 of 485 imported addresses have a postcode or city | medium | yes (parsing) |
| Entity-level ranked preferences on the student request (ids, max 3, plus reason) | medium (student-facing UI too) | scoring yes |
| Structured previous placements (place id, entity id, emne id, outcome) in place of name-string matching | medium | yes |
| Mentor capacity (`maxStudents`) per entity contact | small to medium | yes |
| Checks at apply time: stale profile version, claimed elsewhere, period overlap | small | yes |

Suggested order: `allocation.ts` with priority, preference, capacity and locks, then the preview UI in `PlacementTaskView`, then location and repeat rules, then mentor capacity.

## 6. Risks and edge cases

- **Stale entity data:** record the entity version on each proposal row and check it at apply time. Block apply for an archived entity.
- **Cancelled assignments:** ignore them for counts and for repeat avoidance.
- **Claimed elsewhere:** one placement per student. Re-check at apply, because the claim can change while the preview is open.
- **Overlapping periods:** treat as a hard constraint, not a warning.
- **Other placements sharing an entity:** start from places remaining, not places offered, and re-read at apply time.
- **Undo:** keep a stack of batches. Undo only restores students who have not been changed by hand since.
- **Late preferences:** when preferences arrive after some students are assigned, re-runs only move unlocked "planned" rows, and show moved students clearly.
- **Fairness:** priority rules are policy. Keep the weights visible and log the rule set used per run.
- **Mentor removed after allocation:** surface it in the preview.
- **Home address:** personal data. Keep it for the coordinator only, out of what students are shown and out of exports.

## 7. What to keep as it is

- The place-grouped "N / N left" entity list (reuse it as the capacity cards).
- "Planned", "Detach" and the "Needs mentor" dropdown as per-student row actions.
- One placement per program and emne.
- The "Not enough places" banner, as a trigger for the capacity-gap view.
- The per-student "Add praksis place" button as an exception path, shown as a row action.

## 8. How to verify the work

- **vitest (pure logic in `src/types`):**
  - parity between a new indexed `profileTreeForPlacement` and the current one for used, used elsewhere, remaining and over, including cancelled assignments and other periods;
  - a speed guard: 2000 students times 500 entities in about 100 ms or less;
  - allocation determinism and constraint tests;
  - undo and apply reducers.
- **By hand:**
  - Safari production build at 154, 485 and about 2000 students, with React Profiler (dev mode is slower, so part of the lag seen may be dev-only). The speed-ups of phase 1 are in but not yet measured; `profileTreeForPlacement` and `usePlacedOnProfile` are still unindexed;
  - VoiceOver on the dialog (dialog announced, count read on change, focus returns on close);
  - Tab through the whole assign flow without a mouse;
  - status states in grayscale.

## 9. Files involved

- `src/components/PlacementTaskView.tsx`
- `src/components/PlacementModals.tsx` (the per-student "Select Praksis Place" dialog)
- `src/components/StudentsPanel.tsx`
- `src/components/AvailableProfilesPanel.tsx`
- `src/types/praksisStudent.ts`
- `src/types/profileUsage.ts`
- `src/types/placementTask.ts`
- new: `src/types/allocation.ts`

## 10. Open questions

- Should the suggest-and-review step (phase 2) be built next?
- Should unregistered students (the imported "Not registered" flag) be excluded from suggestions, or only flagged?
- Where do study locations map to regions (Umeå, Skellefteå against Oslo, Bergen, Trondheim)? The mock places are Norwegian and the imported students Swedish, so this needs a decision before location scoring is meaningful.
- Where should student preferences be collected now that the first publish is gone?
