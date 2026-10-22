# Plan: test-user guide for the research

Goal: a simple guide for test users, five scenarios in the order you gave, each explained with real data from the prototype, plus an updated onboarding tour. Structure follows the TS-01 page of the example docs site.

## What the project looks like (analysis)

- **Pages:** Dashboard, Praksis-students, Student placement, Praksis places, Priorities, Reports (Placement report, Capacity report, Invoicing, Student report), Settings (Studies & Programs, Study Admins, Dashboard Items, Workflows). Login is an 8-character access code.
- **Data at start (nothing to set up):** 485 Umeå students; study "Hälso- och sjukvård samt social omsorg" with VYSJS, VYBAR, VYFYS, MYLOG and the emner VFU HT 2026 / VFU VT 2026; 3 praksis places (Oslo University Hospital HF, Bergen Kommune, Trondheim Mental Health Services); 40 entities with 3 contacts each. VYSJS VFU HT 2026 has 254 students (Umeå 204, Skellefteå 50).
- **What survives a reload:** studies/programs/emner, entities, contacts, praksis students, student tags. **What does not:** placements, priority lists and applications, Study Admins. This matters most for scenario 4 to 5.

## Scenarios (IDs, order, examples)

| ID | Page | ~min | Real example | Needs |
|---|---|---|---|---|
| TS-01 | Settings: Studies & Programs, Study Admins | 10 | Add study "Test Studie", program "Sykepleie" (code SYK-B), emne "Praksis 2 – Medisinsk sykepleie" (NSK201, term 2); add the "Emne requirements" text on a seeded emne; add Study Admin "Anne Larsen" | none |
| TS-02 | Praksis places: edit an entity, add a new entity | 12 | Edit **Ortopedisk klinikk** (VYSJS, 2 places): change places, add a contact. Add a new entity at Bergen Kommune ("Surgery ward 3B", Avdeling, VYSJS, VFU HT 2026, 3 places) | none |
| TS-03 | Priorities: new list end to end | 12 | VYSJS, VFU HT 2026, location Skellefteå (50 students); notice date + deadline + message; submit one application on behalf of a student; review it; publish decisions | none |
| TS-04 | Student placement: 7 steps end to end | 20 | Same VYSJS / VFU HT 2026 / Skellefteå (50 students); entities Ortopedisk klinikk (2) and Kardiologisk sengepost (5); see "over by N"; mentor; publish to entities, then to students | TS-02 optional (new entity) |
| TS-05 | Reports: Invoicing | 8 | After TS-04 the 50 students show as invoice lines (HT 2026 starts 2026-09-01, so "Ongoing"); change "Weekly cost"; filter by entity | TS-04 in the same session |

Each scenario page (and the "Start here" page) uses the same template: overview (Page, Role, Goal, Precondition, Time), What this page is, numbered Steps (short heading, 1-2 imperative sentences, screenshot with caption, "Expected:" inline, "Think aloud:" on key steps), Final result, Next link, and a collapsed "For the researcher" part (2-3 questions, success criteria).

## Findings that change the plan (found while checking the code)

1. **Priorities has no "send first notice" button.** `SendFirstNoticeModal` exists but is never shown; setting the "Noticing students date" counts as sent. The guide must say so, or we add the button first.
2. **There is no student side.** All applications in TS-03 are made by the coordinator with "Submit on behalf of student". The guide must tell testers this is intended.
3. **"Add student" / "Import students" on a priority list read an empty mock list** (not yet verified). Check before writing TS-03 and either fix or leave them out of the guide.
4. **Study Admins are not saved** and do nothing else yet. The guide says "this list is for this session".
5. **Invoicing** shows students as soon as they have an entity (publishing is not needed). The two "canceled" statuses cannot be produced in the prototype, so leave them out of the guide.
6. **Reload wipes placements.** TS-04 and TS-05 must be done in one go without reloading.

## Delivery

- **Recommended:** markdown files in `docs/test-guide/` rendered by a new **Guide** page inside the app (react-markdown is already installed), sidebar of scenarios, breadcrumbs, "On this page" and previous/next. Deep links as `#/guide/ts-03`, so the tour can open them. One deploy updates app and guide together.
- **Files:** `00-start-here.md` (login with an access code, what is mock, what resets, how to report: Bug / Confusion / Wish with scenario ID and step number), `ts-01…ts-05`, `README.md`, images in `public/guide/ts-0X/NN-slug.png`.
- **Screenshots:** captured with the browser tool at a fixed 1440x900 on a fresh browser state; one manifest (`screenshots.md`) lists each image, step and setup so they can be retaken after UI changes; a small `guide:check` script reports missing images.
- **Access:** the guide lives behind the login; a link "New here? Start here" on the login screen is optional (open question 1).

## Onboarding tour changes

- Keep the nine steps in sidebar order, but add per-step "Scenario N" badges and an "Open the guide for this page" button (new `guideId` on each step).
- Add a **Settings → Study Admins** mention to the Settings step, and split **Invoicing** out of the Reports step (what it shows, and that it is empty until students have an entity).
- Add a **Guide** link in the sidebar (next to Settings) and let the last tour step link to "Start here".
- Update `getOnboardingStepForView` for the new Guide view.

## Work order (estimate)

1. Verify the three open facts in the code (items 1, 3, 4 above) and decide fix or document (small).
2. Build the Guide page + markdown loader + hash route (small).
3. Write `00-start-here` and TS-01 to TS-05 with the real examples, running each scenario in the browser to confirm every label and expected result.
4. Capture the screenshots and write the manifest.
5. Update the tour and add the sidebar link.
6. `CLAUDE.md` section for the guide.

## Questions for you (defaults in bold)

1. Should the guide be readable **before login** (for recruiting)? **No: inside the app after login.** A public `/guide` route is a small extra.
2. Should placements, priority lists and Study Admins be **saved across reloads** so testers do not lose work? **No for now; warn in "Start here"**, add a "load scenario state" button if the pilot shows people losing work.
3. Researcher notes in the **same file (collapsed)** or separate? **Same file** to avoid drift.
