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
npm run guide:check # test guide: every image and #/guide/<id> link exists, every tour guideId is a page
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
| `"dashboard"` | `<Dashboard>` (a "Student overview" strip on top, `StudentMetrics.tsx`, numbers from `studentMetrics` in `types/praksisStudent.ts` over the same rows as Praksis-students: waiting, planned, supervisor (mentor) not attached yet, total emner; a tile opens Praksis-students with that status chip, the sidebar opens it with the default chip) |
| `"placements"` | `<TableView>` / `<GanttView>` (filtered list) |
| `"placementtask"` | `<PlacementTaskView>` (detail for one placement) |
| `"praksisstudents"` | `<PraksisStudentsView>` — students waiting for or in a placement, with status, filters and sorting; pressing a row opens a side bar on the right with the student's details and placement history (`placementHistoryOf`: every placement the student was in, newest first, with entity, mentor and how it went; placements are not saved across reloads, so neither is the history) |
| `"praksisplaces"` | `<PraksisPlacesView>` (tree of places and their entities; a place has Contacts / Entities / Place info tabs, the place header and tabs stay put and an entity opens inside the Entities tab (the page stays mounted while another tab shows, so a block being edited survives a tab switch): `components/entity/EntityPage.tsx`, blocks with an Edit button and their own Save; "Accepted programs" holds one card per program (`entity/AcceptedProgramsSection.tsx`: its emner and its places, each card saved on its own, "Add program" opens a new card on the page, a program with students placed cannot be removed and keeps the emner they use), and what is missing is listed at the top) / `<CreatePraksisPlaceView>` |
| `"settings"` | `<SettingsView>` |
| `"analytics"` | `<AnalyticsAI>` |
| `"onboarding-comments"` | `<OnboardingCommentsView>` (restricted to access code `E8W6B4C3`) |
| `"guide"` | `<GuideView>` — the test guide for the research (sidebar item "Test guide" under Settings, hash `#/guide/<id>`), see "Test guide" below |

### Domain model

The core types in `src/types/` are:

- **`StudentPlacement`** (`studentPlacement.ts`) — A batch placement event (year/semester/subject). Status progression: `draft → upload → select → publish → completed`.
- **`PlacementTaskState`** (`studentPlacement.ts`) — Working state for one placement: which tasks are done and its students with their assignments.
- **`PraksisPlace`** (`praksisPlace.ts`) — The main parent: a hospital, municipality or service. It has no hierarchy; `organizationType` (HF/Kommune) is only a label.
- **Entity = `PlacementProfile`** (`placementProfile.ts`) — Where students are placed at a place. Has a name (unique within the place), an `entityType` (klinikk, avdeling, seksjon, sengepost or gruppe; chosen in the Add entity dialog (`CreateEntityDialog`: type + name, made by `createEntity`), each with its own icon in `EntityTypeIcon`), `programs` (`AcceptedProgram`: a program, its accepted emner (`emneIds`; explicit, never empty-means-all) and its own `places` per period; each program at most once, so an entity such as Barne seksjon can take several programs with separate places for each), placement information and `contacts`: links (`EntityContactLink`, with the flags told-on-placement and shown-to-students) to people of the place. Saved in `localStorage.placementProfiles` (storage version 6; older data is migrated on load by `migrateProfilesV1`, `V2`, `V3`, `V5` and `V6`, which wraps the old single program, emner and places into one `programs` entry; `FlatProfile` is the old shape). Helpers: `programEntry`, `placesFor(profile, programId)`, `totalPlaces`, `setProgramEntry`, `removeProgramEntry`. An entity can be incomplete: `entityMissing` lists what is missing (program, emner, contacts, information; with several programs the label names the program, e.g. "Emner for Logopedprogrammet (MYLOG)", and `programId` is set; places are never missing, 0 is a valid number of places) and the page, tree and list all read it; `isPlaceable` (at least one program, and every program has its emner) decides whether placements may offer it. The UI calls it "entity".
- **`PlaceContact`** (`placeContact.ts`) — A person of a praksis place, a `supervisor` or an entity `contact`. Made once on the place (Praksis places → Contacts tab) and added to as many entities as needed; a mentor is one of the entity's contacts. Saved in `localStorage.placeContacts`.
- **Assignment** (`Student.assignedPraksisPlace`, `placementTask.ts`) — `placeId` + `profileId` (the entity). `entityId` and `departmentId` hold the same entity id and `departmentName` its name, for older readers. Status `planned` until the placement is published, then `booked`.
- **Usage / capacity** (`profileUsage.ts`, `profileRules.ts`) — Places left on an entity are worked out per program from the placed students of that program (this placement and others of the same program in the same period; students of another program never use them); nothing is booked against an entity. `profileTreeForPlacement` gives each node the places of the placement's program and `otherPrograms`; `placedOnProfile(…, programId)` and `lockedEmneIds` work per program. The period is set once per place (`placePeriod.ts`).
- **`PraksisStudent`** (`praksisStudent.ts`) — A student imported before placement. The Import students button brings the 485 students of the Umeå sheets (`src/data/umeaStudents.ts`, generated from `/umea/*.xlsx`; each row is a student): it adds, as studies of the current university (so Settings lists them), one study "Hälso- och sjukvård samt social omsorg" (the SUN education field) with the 4 programs of the sheets (Sjuksköterskeprogrammet VYSJS, Barnmorskeprogrammet VYBAR, Fysioterapeutprogrammet VYFYS, Logopedprogrammet MYLOG), and one VFU course per program and intake ("VFU HT 2026" and "VFU VT 2026", with a start term), and gives each student a 10-week period from the intake date because the sheets have no praksis dates or hours. The sheets' intakes (2022 and 2023) are dated in 2026 in the data (`startDate` 2026-09-01 for the autumn intake, 2026-01-01 for the spring one), so the two autumn cohorts are one intake; students and catalogs saved earlier are moved to 2026 when loaded (`migrateCatalogV3`, `migrateProfilesV5`, and the load of `praksisStudents`). A student also carries `priorityPoints` ("Prioritet") and `registered`; the Priority column shows an approved application's points, else the imported points. Status is derived from the placements: waiting / in placement / planned / placed / completed. Saved in `localStorage.praksisStudents`.
- **`studyCatalog.ts`** — Studies → programs → emner, saved in `localStorage.studyCatalog` (version 2). An emne is one practice (VFU) course with optional `code` (unique within the program), `term` (1–12), `subject`, `requirement` and `startTerm`; a program has an optional `code`. Version 2 migrated the old intake emner ("Kull 2026 Høst") by giving them `startTerm` and keeping their id and name. Settings edits them in place (`ProgramRow.tsx`); pickers show `programLabel` and `emneMeta`. `requirement` is the "Emne requirements" option of the emne form in Settings: a checkbox plus a free text that is mandatory when the box is ticked (`validateEmne`), shown under the emne in the entity's Accepted programs (card and edit list) and in Settings; the old `pairPlacement` flag was removed. `subject` and `term` are stored and shown but not yet used by the placement logic.

### Application periods (Priorities)

Creating a priority list ("Create new priority list") is a page of its own, not a dialog, and goes the way creating a placement does (`CreatePriorityPeriodView.tsx`, shown by `PrioritiesView` in place of the list): header with back arrow and breadcrumb, a step info banner (`p1`, `p2` in `types/stepInfo.ts`), step 1 "Priority List Details" with study, program, emne and an optional location, step 2 "Priority Details" with the first notice date, the deadline and the message to the students. Back on step 2 returns to the choices; the arrow, the breadcrumb and Cancel on step 1 return to the Priorities list, and creating the list opens the details of the new priority list (its students, dates and notices), whose back button returns to the list. The students are the ones in Praksis-students: `App.tsx` turns them into the `EnrolledStudent` shape the priority part works with (`enrolledFromPraksis` in `types/enrolledFromPraksis.ts`, with `emneId` and `startDate`), `periodStudents` picks those of the emne (and location), the period takes them at once (`importedStudentIds` and `eligibleStudentIds`), and its year and semester follow their praksis start dates (`periodTerm`). With no students waiting for the emne, Next stays blocked.

### Test guide

`docs/test-guide/*.md` are the pages the test users read: `00-start-here.md` and `ts-01` … `ts-05` (Settings, Praksis places, Priorities, Student placement, Invoicing), in the order of the research plan (`PLAN_TEST_GUIDE.md`). `GuideView.tsx` reads them at build time (`import.meta.glob`, `?raw`) and shows them with react-markdown: a list of pages, the overview box from the front matter, "On this page", previous/next, and a folded "## For the researcher" part. `types/guideDocs.ts` holds the pure parts (front matter `id/title/short/order/page/role/goal/minutes/needs/persists`, the researcher split, headings, `parseGuideHash`/`formatGuideHash`, `guideImages`). `[text](#/guide/ts-02)` links stay in the app. App.tsx opens it through `openGuide(id)` (view `"guide"`, `guideDocId`; the tour and the sidebar use it). Images are `public/guide/<id>/NN-name.png`; `docs/test-guide/README.md` has the page template and `screenshots.md` the state each image was taken in. The numbers in the text (50 students, 814,050, "over by 31") come from running the scenarios on the starting data in order without a reload, so run them again after changing the data or the UI of a scenario. The guide has no access codes; the tour (`OnboardingOverlay.tsx`, 10 steps, Invoicing is step 8 and Settings 9) has an optional `scenario` badge and `guideId` per step with an "Open the guide for this page" button.

What the guide says about the prototype (keep it true): placements, priority lists, applications and Study Admins are not saved across a reload; there is no student side (applications are made with "Submit on behalf of student"); there is no "send first notice" button (setting the noticing date counts as sent); the Invoicing statuses for cancelled places cannot be produced.

Dates picked in a calendar are saved with `localIsoDate` (`types/localDate.ts`), not `toISOString()`, which moved the day back one in time zones east of Greenwich.

### The two user roles (prototype)

The app currently only implements the **PK (Placement Coordinator)** role. The user is hardcoded as `"John Coordinator"`. The SK (Site Coordinator / "Stedkontakt") role is not implemented.

### Authentication

`src/components/LoginScreen.tsx` validates against a static list of 8-character alphanumeric codes in `src/types/access-codes.ts`. Auth state is persisted to `localStorage` (`spm_authenticated`, `spm_access_code`). The special code `E8W6B4C3` grants access to the onboarding comments admin view.

### Placement task workflow

`PlacementTaskView.tsx` is the most complex component. A new placement is made from a study, program and emne (no dates): its students are taken from Praksis-students and its period follows theirs. An optional Location (the study locations of the students waiting for the emne, `waitingLocations`) narrows it: only the waiting students who study there are taken (`waitingForEmne(…, location)`), the title gets the location and `StudentPlacement.location` keeps it. After Continue comes step 2/7, "Choose entities and slots" (`PlacementEntitySlotsStep.tsx`, pure logic in `types/placementSlots.ts`): the chosen entities with a slot stepper on the left (the Available entities panel), every fitting entity (`slotCandidates` of the unrestricted usage tree) with Add on the right (an entity that is chosen leaves the right list and returns when removed); a new entity gets its free places as slots (at least 1), slots above the free places show "Over by N" and never block, an entity with students of the placement keeps at least that many slots and cannot be removed, and "Continue to students" is always possible, also with no entity (they can be added later with "Change entities", and the students panel then says no entities are chosen). The choice is `PlacementTaskState.entitySlots` + `entitySlotsConfirmed` (state of `PlacementTaskView`, synced to App.tsx); `profileTreeForPlacement(…, entitySlots)` then offers only the chosen entities with `places` = slots and counts only this placement's students against them (`fromSlots`; other placements' students were counted when the slots were set), and a placement without `entitySlots` (made before the step) uses every fitting entity as before. "Change entities" in the Available entities panel reopens the step. The Placement report lists, per placement, only the entities added to it (plus entities its students sit on; an older placement without chosen entities lists every fitting one), with Slots and Left measured against the slots. It drives a task checklist defined in `src/types/placementTask.ts` (`placementTasks[]`): students from Praksis-students, attach entities to students (the Available entities panel: the + button on an entity makes it the target, the students are then picked in the Students table, and a dark bar at the bottom adds them ("Add N to <entity>"; it shows "over by N" and closes once they are added; pressing the + of another entity switches the target and keeps the selection; Escape or Cancel ends it without adding; the first time a hint dialog explains it, with "Don't show this info again"). The other way round also works (students first): tick students, then press the + of an entity card to choose that entity for them. Both ways use the one floating bar (in `StudentsPanel`): the chosen praksis place on the left (or "No place chosen yet. Press + on an entity."), the number of selected students on the right (hovering it lists their names, and a click on a name scrolls the table to that student and highlights the row) with "Top N by points", Clear, "Add N" and Cancel (one row); the place is never picked from the bar (the place picker popover was removed), and `handleAddToTarget(studentIds, targetId)` does the placing. The ticked students and the chosen entity are state of `PlacementTaskView`, because the table and the cards both read them. Assigning can start at once, there is no publish step before it. Places never block: more students than places left shows "over by N", and a full entity can still be picked. A batch of assignments shows a toast with Undo. Under an entity card, the expanded "N placed here" list has an X on each student that takes them off the entity (also with Undo; not offered once the assignments are published). The Students table has a checkbox only on students without an entity (students can be ticked before or after pressing the +), and no Actions menu: bulk attach files and bulk take-off were removed; a single student is taken off with Detach and gets files with Attach. `types/quickAssign.ts` has the ranking by points that "Select top N" uses), documents, mentors (picked from the entity's contacts), publish in two steps (`types/publishState.ts`): "Publish to entities" records that the entities can see the placement (their side is not built here) and locks the assignments, then "Publish to students" (only after the entities) books the assignments and freezes what each student is told; the banner offers the next step, the confirm dialog follows the step (`publishMode`), Edit in the header unlocks everything and "Cancel edit" gives back what was published, and a placement saved with the single publish step counts as published to both (`normalizePublish`). Every step has an info banner (`StepInfoBanner.tsx`, texts in `types/stepInfo.ts` keyed by task id): the user's task and how to do it, with "Got it" (hidden for this visit) and "Don't show this again" (`localStorage.spm_hide_step_info_<task id>`; step 2 keeps its first key `spm_hide_entities_step_info`). Only the mandatory steps have one: steps 1, 2, 3, 6 and 7 (the optional documents and mentors have none). Step 1 shows it above Placement Details (task "1"), step 2 above the entities, and the students page shows the banner of the first mandatory task not done (placing students "4", then publish to entities "7", then publish to students "8"; after that there is none). Students can carry tags (`StudentTags.tsx`, store in `types/studentTags.ts`): chips on each row with an x and a "+ Tag" popover (find or make a tag; Enter makes it and puts it on the student; adding a tag, new or existing, closes the dialog, taking one off keeps it open; a tag can be deleted there), several tags per student, "Tag N selected" puts tags on the ticked students, and the "Tags" bar above the table lists the tags with counts: a click on a chip shows the students that have it (several picked chips show students with any of them, "Show all" clears). Tasks are found by id, not by position (7 steps now: students, entities and slots, attach, documents, mentors, publish to entities (id 7), publish to students (id 8); both publish steps are mandatory and the Dashboard reads the same list).

State for each step is stored in `PlacementTaskState` and lifted to `App.tsx`.

### UI components

`src/components/ui/` contains shadcn/ui components. Import them from `./ui/<component>` — they are pre-configured with Tailwind and Radix UI primitives.

### Vite aliases

`vite.config.ts` maps versioned package names (e.g. `sonner@2.0.3`) to their unversioned equivalents. When importing library components in source, use the versioned form (e.g. `import { toast } from "sonner@2.0.3"`) as the Figma-generated code does. The alias in `vite.config.ts` resolves these at build time.

### Supabase backend (comments only)

`src/supabase/functions/server/` contains a Deno + Hono edge function for persisting onboarding comments to a KV store. The onboarding tour (`OnboardingOverlay.tsx`, ten steps that follow the sidebar and open at the step of the page being viewed) no longer collects comments, so only `OnboardingCommentsView.tsx` still reads them. It is **not** used for any core placement data — everything else is in-memory mock data.

### Figma assets

`figma:asset/<hash>.png` imports in components (e.g. `PlacementTaskView.tsx`) are resolved by the `figmaAssetResolver` Vite plugin to files under `src/assets/`. SVG data is imported from `src/imports/svg-*.ts` as string maps.

### Persistence

The data persisted across page reloads is:
- `localStorage.spm_authenticated` / `spm_access_code` — login state
- `localStorage.placementProfiles` — the entities; `localStorage.placeContacts` — the people of the places
- `localStorage.praksisStudents` — the imported students and which placement took them
- `localStorage.studyCatalog`, `praksisPlacePeriods` — studies/programs/emner and each place's period
- `localStorage.studentTags` — the tags the user made and which students carry them (`types/studentTags.ts`, by student id)

A browser with nothing saved starts with the data in `src/data/seedEntities.ts`: the Umeå study with its 4 programs and 5 emner (HT 2026 for all four programs, VT 2026 for Sjuksköterskeprogrammet), and 40 entities (ten per program, each with all emner of its program; Barne seksjon also takes Sjuksköterskeprogrammet and Logopedprogrammet, with places of their own) with 3 people each, over the three praksis places. The stores use it while their own key is missing, and also in a browser that is untouched (entities, people and studies all saved as empty lists, as an earlier version of the app left them; `isPristine` in `seedEntities.ts`), which is then saved; anything else the user saved is never replaced; the import finds the seeded study, programs and emner by name and adds nothing. The 485 Umeå students are also imported at the start: a browser with no `praksisStudents` saved (or an untouched one that saved an empty list) gets them at once (`startingState` in `praksisStudent.ts`, after the catalog has its seed). Reset Data puts the students back to that start, none in a placement; it does not clear entities, people or the catalog.

All other state (placements, task states, praksis places) resets on page reload. A student's claim by a placement that is gone after a reload is dropped, so the student is waiting again.
