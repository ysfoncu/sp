# Competitor analysis: Stockholm University VFU portal (staff side) vs SP-R1

**Source:** the 20 "Kunskapsartiklar" on https://www.su.se/enheter/support-vfu---verksamhetsforlagd-utbildning/vfu-portalen---for-larosatesanstallda
(owner Studentavdelningen, pages last updated between 2025-10-14 and 2026-09-04). Article numbers in brackets refer to the list at the end.

**Method:** four agents read the 20 articles and wrote notes. Three expert agents (product/domain, UX, architecture/process) then compared the notes with our app.

**Limits of the evidence**
- The articles are short help pages. Our fetch tool returned summaries, so some wording is paraphrased.
- No screenshots were available, so visual quality cannot be compared.
- Article 9 showed no date or owner.
- Where we describe our app's behaviour from type definitions rather than from running it, the experts said so; treat those rows as "to confirm".
- Article 1 and articles 6/13 give different dates for the same kind of deadline (region-specific). Verify before copying any date.

## 1. What the competitor is

SU's portal is **municipality-centred**. The university *orders* places from municipalities (platsbeställning), the municipal VFU coordinator answers, and staff place students on a municipality → school → supervisor. Everything is organised along the **term calendar**: plan, order, place, remind, pay.

Our app is **supply-centred**. A praksis place publishes unit-level profiles (program, accepted emner, places, contacts, information) and the coordinator (PK) places waiting Praksis-students onto them.

## 2. Process timeline (SU)

| When | What | Article |
|---|---|---|
| 15 May / 15 Oct | Course occasions and place orders due for autumn / spring (Region Syd: 5 Nov for spring) | 6, 13 |
| 15 Apr / 15 Oct | Reminders for students who need a new placement can be made | 18, 1 |
| After Ladok registration | Placement proposal run (needs a travel-time run by SU admins) | 14 |
| 20 Jun / 20 Dec | VFU registrations due; VFU II and later within 3 weeks of term start | 1 |
| 1 Jul / 1 Jan | Portal switches term; registrations become "main placement", additional placements disappear | 8, 1 |
| 1 Feb / 15 Aug | Compensation basis due for autumn / spring | 1, 10 |
| Per term, self-set | Deadline for student change applications | 5 |

Ours: a placement runs draft → upload → select → publish → completed with a task checklist. There is no calendar of deadlines, no term switch, no demand, request, change-application, reminder or compensation stage.

## 3. Feature-by-feature

| Lifecycle step | SU | Ours | Verdict |
|---|---|---|---|
| Program mapping | Programplanering: program, study paths per specialization, VFU courses with term/level/code, subjects, "pair placement" flag; linking needs an email to support [11] | Study → Program → Emne catalog, self-service, archiving | We are better (self-service). Gap: no study-path or part-time variants, no pair-placement flag |
| Course occasions | VFU-kurstillfälle fetched from Ladok, VFU days, credits; removal blocked once a portfolio exists; "programkoppling saknas" [13] | Dates, hours and period live on each imported student; the placement has year/semester/dates from its students | Gap: no first-class course-occasion entity, no Ladok lookup |
| Place ordering (demand) | Platsbeställning per term, subject, municipality; unspecified municipal places plus per-school places; copy from up to 2 terms back, skipping inactive units [6, 7] | Profiles per unit with `places`; profile copy exists | Different direction. Gap: no "places we need" per emne and term, no ordering deadline, no copy of a whole term |
| Prioritisation | Prioritised schools per university, feeding the matching order [12] | Priority periods and applications for **students** (points, reasons, approve/reject) | Different object. We are better for students; gap: no preferred-site flag per unit |
| Matching | "Ta fram placeringsförslag": program/course + max travel time, three tiers, review, send with a visibility date [14] | Manual assignment, then two-stage publish with snapshot | **Biggest gap: no automatic proposal.** We are better on publish (snapshot, change detection) |
| Student registry | Placera studenter, unplaced-first list, hourglass for pending requests, study-break students on the start page, manual add by personnummer [2, 8, 17] | Praksis-students with waiting / in placement / placed / completed, filters, counts, import | Roughly parity. Gap: no study-break state, no "needs action first" grouping, no pending icon |
| Manual placement | "Hantera placering": municipality, school, mentor in one dialog; inline create of missing school or supervisor; additional placement for part of a course [4, 8, 15] | Assign to unit/profile, then mentor in a separate step | Gap: no partial-period or second placement, no inline create |
| Per-student request | Placeringsförfrågan to one or more municipalities; statuses unanswered / accepted / declined / offer; automatic emails; "ask one at a time" [9] | Student custom request flag only; the old quota-request flow was removed | **Gap:** no PK → site request with an answer |
| Change applications | Bytesansökan with a term deadline, approve to a new municipality or decline with reason [5] | None | Gap |
| Supervisors | Unique email, subjects, schools, training flags; removal blocked while students are linked; "selectable" toggle [3, 4] | Profile contacts with notify-on-placement and visibility, mentor picker, "mentor removed" state | We are better on profile contacts. Gap: no training flag, no mentor load, no delete-guard |
| Reminders | Per student, templated, sent to the placing municipality only [18] | Notices go to students | Gap |
| Special reasons | One checkbox on the student card, searchable in proposals [16] | Scored priority reasons with review | We are better, but PraksisStudent has no such flag |
| Compensation | Excel per municipality with invoice address; free if cancelled more than 3 weeks before start, full price otherwise [10] | Invoice report (weekly cost, filters) | Parity on the report. Gap: no cancellation rule, no per-recipient export |
| Reports / exports | Excel from student, supervisor and school lists [4, 8, 19, 20] | Placement, capacity and invoice reports, Gantt, network diagram, analytics | We are better |
| School / unit registry | Create school (secretary role only), overview with filters, duplicate and naming rules [15, 20] | Praksis places with a typed hierarchy (HF 5 levels, Kommune 4) | We are better on structure. Gap: no duplicate warning, no inline create from placement |
| Roles | Staff, secretary, course instructor (read-only), municipal coordinator, supervisor, student [15, 19] | PK only, hard-coded | Gap |

## 4. Where we are better

- Unit-level profiles with practical information (housing, transport, work clothes, contacts, who is notified). SU has no equivalent.
- Scored student priority with reasons and approval.
- Two-stage publish with a frozen snapshot and change detection.
- Deep organisation hierarchy with activation and usage validation.
- Self-service study, program and emne administration.
- Richer reporting and visualisation.
- A derived student status that cannot drift from the placements.

## 5. What to adopt (ranked, merged from all three experts)

| # | Idea | Why | Effort |
|---|---|---|---|
| 1 | **Student card + special-reasons flag + wish list** on Praksis-students (needs-action group first, pending icon) [2, 8, 16] | Cheap, extends existing data, prerequisite for matching | S |
| 2 | **Auto-proposal v1**: suggest placements for a placement's waiting students over profiles with places left, in tiers; draft + review before anything is assigned [12, 14] | Biggest gap; the data already exists (waiting students, profile usage) | M |
| 3 | **Preferred-site flag** per profile/unit and tier ordering [12] | Feeds matching | S |
| 4 | **Per-student placement request with status** (unanswered / accepted / declined / offer) and one-click "place now" on offers [9] | Closes the loop with the site; replaces the removed quota request | M |
| 5 | **Term calendar and deadline banners**, configurable per region [1, 6, 13, 18] | SU keeps deadlines in help text only; we can do better | M |
| 6 | **Demand per emne and term** and copy-last-term [6, 7] | Gives supply-versus-demand on the profile list | S/M |
| 7 | **Combined place + mentor dialog** with inline create and duplicate check [4, 8, 15] | Fewer steps | S/M |
| 8 | **Compensation basis export** with cancellation rule [10] | Only if the Norwegian agreement model charges; confirm first | S/M |
| 9 | **Change applications and site-facing reminders** [5, 18] | Real workflow, but wait for user validation | M/L |
| 10 | **Supervisor hygiene**: selectable toggle, delete-guard, mentor load [3, 4] | Small | S |

Matching sketch (from the architecture expert): candidates = waiting students for the emne; capacity = active matching profiles with places left; score by tier, the student's wishes/history and optional distance; greedy assignment with one repair pass; the output is a draft proposal with reasons and unplaced students, written to assignments only when the coordinator approves.
Data still missing for it: student and unit locations, a per-profile priority flag, a special-reasons flag, a wish list, and mentor subject matching by emne id.

## 6. What does not fit a Norwegian healthcare context

- Municipality/school/preschool as the unit and school forms (ours is HF/Kommune with departments).
- Region Stockholm/Syd cooperation and the shared "Klara med VFU" school [1].
- Ladok and personnummer lookup [13, 17] (Norwegian equivalent is an import from the student system).
- SL travel-time data [14]. Distance matching may still help, with a different source.
- Pair placement (teacher education) [11].
- Compensation as a payment to municipalities [1, 10]: Norwegian agreements differ; check locally.
- Supervisor "matrix" training [1, 4]: mentor qualification exists in healthcare but with different content.
- Criminal-record extract in the portal menu [1]: Norwegian healthcare uses politiattest and vaccination/TB checks instead.

## 7. Weaknesses in SU's workflow to avoid

- **Email as glue:** linking subjects to programs [11], missing subjects [6], date confirmation and the travel-time run [14], notifying coordinators [18]. Keep these actions in the product, with an audit trail.
- **Hidden prerequisites:** the Ladok course must exist first, and the error "programkoppling saknas" only appears after trying [13]. Show prerequisites as a checklist and disable actions with a reason.
- **Deadlines only in the docs.** Show banners and countdowns.
- **Policy not enforced:** "ask one municipality at a time" [9], duplicate schools [15, 20].
- **Status hidden behind an icon** (hourglass) with detail on another page. Show the status text in the row.
- **Search behind a "Visa" button** [8, 19, 20]. Live filtering is better.
- **Hard term switch** makes additional placements vanish [8].
- **Copy limits** (two terms back, inactive units dropped, courses must be re-linked) [7].

## 8. Article list

1 Gemensamma rutiner Region Stockholm · 2 Startsidan · 3 Ta bort VFU-handledare · 4 Skapa VFU-handledare · 5 Bytesansökan · 6 Platsbeställning · 7 Kopiera platsbeställning · 8 Placera studenter · 9 Placeringsförfrågan · 10 Skapa ersättningsunderlag · 11 Programplanering · 12 Lägga in prioriterade skolor · 13 Lägg till VFU-kurstillfällen · 14 Ta fram placeringsförslag · 15 Skapa VFU-skola · 16 Särskilda skäl på studentkortet · 17 Lägg till student · 18 Skapa påminnelser · 19 Studenter · 20 Översikt förskolor/skolor samt kontaktuppgifter

## 9. Expert meeting outcome (product strategist, SU-style coordinator, architect, sceptic)

**Verdict:** covering SU's whole user group is not realistic. SU's VFU is mostly teacher education and municipality-centred (the university orders places, municipalities answer), while our model is supply-centred around unit profiles. A pilot is realistic only for SU programs that place students in healthcare units, and only after the owner names real coordinators and a buyer.

**Do now (also good for the Norwegian product)**
1. CSV/Excel student import with error report and no duplicates on re-import.
2. Student card: special-reasons flag, wish list, study-break state, "needs action first" grouping.
3. Preferred-site flag on profiles/units.
4. Draft placement proposal (three tiers, reasons per student, unplaced list, manual override, nothing written until approved).
5. Per-student placement request with status (unanswered / accepted / declined / offer), shown as text in the row.
6. Deadline/term calendar with banners, configurable.

**Prototype honestly:** a visible Demo role switcher (PK / Site / Student), an in-app outbox instead of email, every simulated step labelled "Simulated", and no claims about matching quality, travel time or Ladok.

**Do not build yet:** Ladok or SL travel-time integration, pair placement, compensation payments, change applications, site reminders, supervisor training matrix, SU-style demand ordering, whole-term copy, distance scoring.

**Before any pilot with real students (not a feature)**
- Real login (SSO or named accounts) and server-enforced roles; today access is a shared 8-character code and one hard-coded user.
- A database instead of localStorage (several actors cannot share browser storage), with an audit trail.
- GDPR: personnummer and special reasons are sensitive; needs a processing agreement, retention, access logging, EU hosting and a DPIA.
- Language: a Swedish UI.
- Roles needed: staff, read-only course instructor, secretary, site user.

**Effort (architect):** prototype of the SU-shaped flow about 6-8 weeks; production is months and needs backend/security skills. Extract a data layer from App.tsx (about 1,800 lines, all state lifted) before adding more multi-actor flows.

**Gate for going after SU:** at least 3 SU-type staff say they would pilot and one has budget or a sponsor; the core works without a fork (CSV import acceptable, no Ladok dependency); under about 20% of the work is SU-only; no Norwegian customer is delayed.

**One-week test (no building):** show the unit-profile and Praksis-students screens to 5-8 Swedish VFU staff and ask them to walk through last term's ordering. Success = 3+ unprompted asks for auto-proposal or deadlines and nobody naming Ladok as a precondition. If Ladok or municipality ordering is the first blocker, stop.
