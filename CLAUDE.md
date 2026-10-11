# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:3000 (auto-opens browser)
npm run build     # Build to ./dist/
```

```bash
npm test          # vitest: unit tests of the pure logic in src/types/*.test.ts
npm run typecheck # tsc over the logic files listed in tsconfig.json (the components are not type-checked)
```

There is no linter. The components are not type-checked, so after renaming a field or removing a type, grep for it.

## Architecture Overview

SP-R1 is a React + TypeScript + Vite prototype for a **Student Placement Management (SPM)** system used in Norwegian healthcare education. It is entirely frontend-only with mock data — no live backend calls are made during normal use.

### Entry point

`src/main.tsx` → `src/App.tsx`. All application state lives in `App.tsx` (no global state library). Views are rendered conditionally based on `currentView` state.

### Routing model

There is no router. `App.tsx` holds a `currentView` string and renders the appropriate component inline. The sidebar changes it through `goView` (`src/navigation.ts`), which also writes a history entry carrying the view in `history.state`, so the browser's Back and Forward move between views (`installHistory`).

Only the Praksis places page has a URL: the hash holds the place, tab and entity (`#/places/<place>`, `#/places/<place>/contacts|info`, `#/places/<place>/entities/<entity>`). `src/types/placesRoute.ts` parses and formats it and replaces anything that no longer exists (unknown place → first place, unknown entity → the place's list). `PraksisPlacesView` derives its state from the hash; go through `goPlaces` to move within the page.

Unsaved edits: each block of the entity page reports whether it holds changes (`useDirtyGuard` in `src/navGuard.ts`, comparators in `src/types/entityDirty.ts`). Anything that would leave the page (tabs, other entity or place, sidebar, Back/Forward, closing the tab) goes through `requestLeave`, and `LeaveDialog` asks "Keep editing / Discard changes". An open but unchanged block does not prompt.

### View hierarchy

| `currentView` value | Component rendered |
|---|---|
| `"dashboard"` | `<Dashboard>` |
| `"placements"` | `<TableView>` / `<GanttView>` (filtered list) |
| `"placementtask"` | `<PlacementTaskView>` (detail for one placement) |
| `"praksisstudents"` | `<PraksisStudentsView>` — students waiting for or in a placement, with status, filters and sorting |
| `"praksisplaces"` | `<PraksisPlacesView>` (tree of places and their entities; a place has Contacts / Entities / Place info tabs, the place header and tabs stay put and an entity opens inside the Entities tab (the page stays mounted while another tab shows, so a block being edited survives a tab switch): `components/entity/EntityPage.tsx`, one mode with no Edit button; every block saves as soon as it changes, and what is missing is listed at the top) / `<CreatePraksisPlaceView>` |
| `"settings"` | `<SettingsView>` |
| `"analytics"` | `<AnalyticsAI>` |
| `"onboarding-comments"` | `<OnboardingCommentsView>` (restricted to access code `E8W6B4C3`) |

### Domain model

The core types in `src/types/` are:

- **`StudentPlacement`** (`studentPlacement.ts`) — A batch placement event (year/semester/subject). Status progression: `draft → upload → select → publish → completed`.
- **`PlacementTaskState`** (`studentPlacement.ts`) — Working state for one placement: which tasks are done and its students with their assignments.
- **`PraksisPlace`** (`praksisPlace.ts`) — The main parent: a hospital, municipality or service. It has no hierarchy; `organizationType` (HF/Kommune) is only a label.
- **Entity = `PlacementProfile`** (`placementProfile.ts`) — Where students are placed at a place. Has a name (unique within the place), an `entityType` (klinikk, avdeling, seksjon, sengepost or gruppe; chosen in the Add entity dialog (`CreateEntityDialog`: type + name, made by `createEntity`), each with its own icon in `EntityTypeIcon`), one program, accepted emner (`emneIds`; explicit, never empty-means-all), `places` per period, placement information and `contacts`: links (`EntityContactLink`, with the flags told-on-placement and shown-to-students) to people of the place. Saved in `localStorage.placementProfiles` (storage version 4; older data is migrated on load by `migrateProfilesV1`, `V2` and `V3`). An entity can be incomplete: `entityMissing` lists what is missing (program, emner, places, contacts, information) and the page, tree and list all read it; `isPlaceable` (program + emner) decides whether placements may offer it. The UI calls it "entity".
- **`PlaceContact`** (`placeContact.ts`) — A person of a praksis place, a `supervisor` or an entity `contact`. Made once on the place (Praksis places → Contacts tab) and added to as many entities as needed; a mentor is one of the entity's contacts. Saved in `localStorage.placeContacts`.
- **Assignment** (`Student.assignedPraksisPlace`, `placementTask.ts`) — `placeId` + `profileId` (the entity). `entityId` and `departmentId` hold the same entity id and `departmentName` its name, for older readers. Status `planned` until the placement is published, then `booked`.
- **Usage / capacity** (`profileUsage.ts`, `profileRules.ts`) — Places left on an entity are worked out from the placed students (this placement and others in the same period); nothing is booked against an entity. The period is set once per place (`placePeriod.ts`).
- **`PraksisStudent`** (`praksisStudent.ts`) — A student imported before placement. The Import students button brings the 485 students of the Umeå sheets (`src/data/umeaStudents.ts`, generated from `/umea/*.xlsx`; each row is a student): it adds, as studies of the current university (so Settings lists them), one study "Hälso- och sjukvård samt social omsorg" (the SUN education field) with the 4 programs of the sheets (Sjuksköterskeprogrammet VYSJS, Barnmorskeprogrammet VYBAR, Fysioterapeutprogrammet VYFYS, Logopedprogrammet MYLOG), and one VFU course per program and intake ("VFU HT 2026" and "VFU VT 2026", with a start term), and gives each student a 10-week period from the intake date because the sheets have no praksis dates or hours. The sheets' intakes (2022 and 2023) are dated in 2026 in the data (`startDate` 2026-09-01 for the autumn intake, 2026-01-01 for the spring one), so the two autumn cohorts are one intake; students and catalogs saved earlier are moved to 2026 when loaded (`migrateCatalogV3`, `migrateProfilesV5`, and the load of `praksisStudents`). A student also carries `priorityPoints` ("Prioritet") and `registered`; the Priority column shows an approved application's points, else the imported points. Status is derived from the placements: waiting / in placement / planned / placed / completed. Saved in `localStorage.praksisStudents`.
- **`studyCatalog.ts`** — Studies → programs → emner, saved in `localStorage.studyCatalog` (version 2). An emne is one practice (VFU) course with optional `code` (unique within the program), `term` (1–12), `subject`, `pairPlacement` and `startTerm`; a program has an optional `code`. Version 2 migrated the old intake emner ("Kull 2026 Høst") by giving them `startTerm` and keeping their id and name. Settings edits them in place (`ProgramRow.tsx`); pickers show `programLabel` and `emneMeta`. `pairPlacement`, `subject` and `term` are stored and shown but not yet used by the placement logic.

### The two user roles (prototype)

The app currently only implements the **PK (Placement Coordinator)** role. The user is hardcoded as `"John Coordinator"`. The SK (Site Coordinator / "Stedkontakt") role is not implemented.

### Authentication

`src/components/LoginScreen.tsx` validates against a static list of 8-character alphanumeric codes in `src/types/access-codes.ts`. Auth state is persisted to `localStorage` (`spm_authenticated`, `spm_access_code`). The special code `E8W6B4C3` grants access to the onboarding comments admin view.

### Placement task workflow

`PlacementTaskView.tsx` is the most complex component. A new placement is made from a study, program and emne (no dates): its students are taken from Praksis-students and its period follows theirs. It drives a task checklist defined in `src/types/placementTask.ts` (`placementTasks[]`): students from Praksis-students, attach entities to students (the Available entities panel: the + button on an entity makes it the target, the students are then picked in the Students table, and a dark bar at the bottom adds them ("Add N to <entity>"; it shows "over by N" and closes once they are added; pressing the + of another entity switches the target and keeps the selection; Escape or Done ends it without adding; the first time a hint dialog explains it, with "Don't show this info again"). The other way round also works (students first): ticking students with no entity chosen shows a light indigo bar ("Students first") where `EntityPickerPopover` (a search over the entities grouped by place, helpers in `types/entityPicker.ts`) picks the entity, then "Add N to <entity>" places them through `handleAddToTarget(studentIds, targetId)`; with students ticked, the + of an entity card chooses that entity for them instead of starting the other flow (the card gets a "Chosen" tag and the panel says so); the dark + bar only appears when the + is pressed with nothing ticked, so only one bar shows at a time. The ticked students and the chosen entity are state of `PlacementTaskView`, because the table and the cards both read them. Assigning can start at once, there is no publish step before it. Places never block: more students than places left shows "over by N", and a full entity can still be picked. A batch of assignments shows a toast with Undo. Under an entity card, the expanded "N placed here" list has an X on each student that takes them off the entity (also with Undo; not offered once the assignments are published). The Students table has a checkbox only on students without an entity (students can be ticked before or after pressing the +), and no Actions menu: bulk attach files and bulk take-off were removed; a single student is taken off with Detach and gets files with Attach. `types/quickAssign.ts` has the ranking by points that "Select top N" uses), documents, mentors (picked from the entity's contacts), publish. Tasks are found by id, not by position.

State for each step is stored in `PlacementTaskState` and lifted to `App.tsx`.

### UI components

`src/components/ui/` contains shadcn/ui components. Import them from `./ui/<component>` — they are pre-configured with Tailwind and Radix UI primitives.

### Vite aliases

`vite.config.ts` maps versioned package names (e.g. `sonner@2.0.3`) to their unversioned equivalents. When importing library components in source, use the versioned form (e.g. `import { toast } from "sonner@2.0.3"`) as the Figma-generated code does. The alias in `vite.config.ts` resolves these at build time.

### Supabase backend (comments only)

`src/supabase/functions/server/` contains a Deno + Hono edge function for persisting onboarding comments to a KV store. This is only used by `OnboardingOverlay.tsx` and `OnboardingCommentsView.tsx`. It is **not** used for any core placement data — everything else is in-memory mock data.

### Figma assets

`figma:asset/<hash>.png` imports in components (e.g. `PlacementTaskView.tsx`) are resolved by the `figmaAssetResolver` Vite plugin to files under `src/assets/`. SVG data is imported from `src/imports/svg-*.ts` as string maps.

### Persistence

The data persisted across page reloads is:
- `localStorage.spm_authenticated` / `spm_access_code` — login state
- `localStorage.placementProfiles` — the entities; `localStorage.placeContacts` — the people of the places
- `localStorage.praksisStudents` — the imported students and which placement took them
- `localStorage.studyCatalog`, `praksisPlacePeriods` — studies/programs/emner and each place's period

A browser with nothing saved starts with the data in `src/data/seedEntities.ts`: the Umeå study with its 4 programs and 5 emner (HT 2026 for all four programs, VT 2026 for Sjuksköterskeprogrammet), and 40 entities (ten per program, each with all emner of its program) with 3 people each, over the three praksis places. The stores use it while their own key is missing, and also in a browser that is untouched (entities, people and studies all saved as empty lists, as an earlier version of the app left them; `isPristine` in `seedEntities.ts`), which is then saved; anything else the user saved is never replaced; the import finds the seeded study, programs and emner by name and adds nothing. Reset Data does not clear entities, people or the catalog.

All other state (placements, task states, praksis places) resets on page reload. A student's claim by a placement that is gone after a reload is dropped, so the student is waiting again.
