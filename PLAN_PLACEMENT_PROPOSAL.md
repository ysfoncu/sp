# Plan: draft placement proposal on profiles

Built from three expert reports (algorithm/data, UX, product/QA). Nothing is implemented yet.

## Goal
On a placement, the coordinator clicks **Suggest placements** and gets a **draft** that puts each waiting student on a profile, with a tier and a plain-language reason per student, an **unplaced list**, and **manual override**. **Nothing is assigned until the coordinator approves.**

## Decisions (where the experts differed)

| Topic | Decision | Why |
|---|---|---|
| Tier 1 | Profile matches a **student wish** (profile, unit or place) | Student's own preference wins |
| Tier 2 | Profile is flagged **preferred** by the site | SU's "prioritised schools", set once on the profile |
| Tier 3 | Any other active profile that fits and has places left | SU's "other / unspecified places" |
| Unplaced | No fitting profile has places left (or dates/period do not fit) | Always with a reason |
| Student order | special reasons → fewest options → earliest start → name → id | Fair to hard cases, deterministic |
| Capacity | Respect `places − used − usedElsewhere` with a working ledger inside the draft | Reuses `profileTreeForPlacement` |
| Over capacity | Not proposed. A manual override past capacity is allowed with a visible "over" mark and a confirm, **if** the pending decision to make capacity advisory is taken; otherwise blocked | Follows the capacity decision |
| Mentor | Never picked automatically. Row shows "mentor needed" warning; approval is allowed | Mentor is chosen from profile contacts later |
| Draft storage | In memory in the placement's task state, discarded on reload | Placements are not saved across reloads, so a saved draft would point at nothing |
| Apply | Through the existing `handleAssignStudent` (no second assign path), per row or "apply all valid" | One rule set |
| Stale draft | Fingerprint of profile versions, places, students and assignments; banner and revalidation on approve | Prevents double booking |

## Data changes (all optional fields, no migration)
- `PlacementProfile.preferred?: boolean` (add to `MATERIAL_FIELDS` so toggling bumps `version`).
- `PraksisStudent.wishes?: { placeId; unitId?; profileId?; rank }[]` (max 3) and `specialReasons?: boolean`.
- `PlacementTaskState.proposal?: Proposal`.
- New file `src/types/placementProposal.ts` (pure logic, added to tsconfig include):
  `runProposal`, `overrideEntry`, `proposalIssues`, `applyPlan`, `summarize`, plus types `Proposal`, `ProposalEntry` (studentId, profileId, tier, score, reasons[], override?), `UnplacedEntry` (code, text), `ProposalFingerprint`.

## Rules the draft must obey (testable)
1. Only active profiles; archived never proposed.
2. Profile matches the student's program and emne (`profileMatches`).
3. Profile unit is a lowest unit of the place.
4. Profile period key equals the placement's period key; the student's own dates must fall in it, else unplaced "dates outside period".
5. Capacity from `profileTreeForPlacement` (includes other placements and excludes cancelled); the draft decrements its own copy.
6. One proposed place per student; students with a non-cancelled assignment are "already placed"; students claimed by another open placement are excluded.
7. Deterministic: same input, same output, including shuffled input.
8. Every proposed or unplaced student has at least one plain-language reason.
9. A manual override that breaks a hard rule (1-4, 6) is blocked; one that breaks a soft rule (mentor, same-unit repeat, over capacity) is allowed and marked "overridden".
10. One repair pass only: swap an already placed student to a free alternative so an unplaced student fits. Never moves a manual override.

## Algorithm (`runProposal`)
1. Split students into eligible / already placed / no period.
2. Build the capacity ledger from `profileTreeForPlacement` (once).
3. Order students (see table).
4. For each student list candidate profiles with ledger > 0, tier them (wish, preferred, other), score within tier, pick best; ties go to the larger remaining, then older profile, then id; decrement ledger.
5. One repair pass for unplaced students.
6. Return the draft with fingerprint; nothing is written to any student.

## UI (PlacementTaskView, new `PlacementProposalPanel.tsx`)
- Entry: "Suggest placements" on task "Attach praksis places", in the students toolbar, and in the unplaced banner. Disabled with a reason when no profile has places or no students are waiting.
- Screen: header "Draft, nothing assigned yet" with Regenerate / Discard / Apply; summary chips (Tier 1, 2, 3, Unplaced, Locked); table grouped by profile (toggle: group by tier) with columns lock, student, wish, profile dropdown, tier badge, reason; sticky capacity cards (placed grey, proposed blue, remaining empty, over amber/red).
- Override: profile dropdown (shows places left, disables full ones unless over-capacity override is allowed), lock toggle, exclude, "Place..." from the unplaced list. Changing a row locks it and sets tier "Manual".
- Regenerate keeps locked rows. Stale banner when profiles, places or students changed.
- Apply: summary dialog ("Apply 38 placements, 4 unplaced"), then students show as placed (status planned), toast with Undo for about 10 s. Task 3/6 completes only when everyone is really placed.
- Reasons in plain language, e.g. Tier 1 "Your wish: Oslo Kreft avd 3 · 3 places left", Tier 2 "Preferred by the site · 2 places left", Tier 3 "No wish or preferred site had places; this profile fits and has 1 place left"; unplaced "All profiles that accept this emne are full" / "No profile accepts this emne" / "Dates outside the profile period" / "Excluded by you".
- Tier shown with text and icon, never colour alone; dropdowns labelled per student; live region announces changes.
- Profile editor gets a "Preferred site" switch; the Praksis-students student card gets wishes and special reasons (small, see COMPETITOR_ANALYSIS_SU_VFU.md).

## Phases
1. **Logic (M)**: `placementProposal.ts`, fields on profile/student/task state, tsconfig include, unit tests (see below). Verify with `npm test`, `typecheck`, `build`.
2. **Review UI (M)**: panel, entry points, override, stale banner, apply with Undo.
3. **Inputs (S)**: Preferred switch in the profile editor; wishes and special reasons on the student (import seeds some wishes so tier 1 shows up in the demo).
4. **Acceptance in Safari, refine, report.**

## Unit tests
Eligibility (program, emne, archived, period mismatch, dates, already placed, cancelled); capacity across entries and `usedElsewhere`, never below 0; wish at profile/unit/place level gets the right tier; preferred beats other; scarcity order places the student who fits only one profile; special reasons first; repair swap; determinism; one place per student; unplaced codes; reasons non-empty; override survives re-run; override over capacity flagged or blocked per the capacity decision; `proposalIssues` catches version change, archived profile and a student assigned meanwhile; `applyPlan` skips students already placed.

## Safari acceptance script
1. Import students, create a profile for an emne with places 3, create a placement for that emne with more than 3 students: Suggest placements opens a draft with tier badges, reasons and an unplaced list; the main list still shows no places.
2. Mark one student with special reasons: placed first when places are tight.
3. Give a student a wish for a profile: tier 1 with the wish in the reason.
4. Flag another profile preferred: tier 2 for students without wishes.
5. Archive a profile and regenerate: nobody on it.
6. Lower places to 1: surplus moves to unplaced with the right reason.
7. Override a row to another profile: row locks, marked Manual, capacity cards update.
8. Try a full profile: blocked (or "over" mark per the capacity decision).
9. Edit places after the draft: stale banner; Apply revalidates.
10. Apply two rows: those two placed (planned), the rest stay in the draft.
11. Undo restores them.
12. Regenerate keeps locked rows.
13. Second placement for the same emne shows capacity that includes the first.
14. Cancel an assignment and regenerate: that place is free again.

## Not in scope
Travel time/distance, auto-assigning, emails (at most a labelled "Simulated" outbox), Ladok, pair placement, any claim about matching quality, supervisor auto-pick.

## Open questions (defaults in bold)
1. Over capacity in an override: **allow with confirm and "over" mark** (needs the capacity decision from earlier) or block?
2. Wishes: **up to 3 ranked wishes per student, seeded in the demo import** or skip tier 1 for now?
3. Previous placement continuity as a tie-break (from `studentHistory.ts`): **later**.
4. Approve: **per row plus "apply all valid"**.
5. Where "preferred" lives: **on the profile**.
