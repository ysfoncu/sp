# Screenshots of the guide

All images were taken on 2026-10-22 in Safari at 1440 × 900, logged in with an ordinary access code, on a fresh browser state (the starting data of the app). Resize with `sips -Z 1400`.

Do the scenarios in order in one session without reloading. To start again: clear the site data of `localhost:3000` (or use **Reset Data** and remove the saved studies, entities and people), reload and log in.

| Scenario | Images | State they need |
|---|---|---|
| start | `01-login` | Not logged in |
| ts-01 | `01-settings` to `07-admin-added` | Study "Test Studie", program "Sykepleie" (SYK-B), emne "Praksis 2 – Medisinsk sykepleie" (NSK201, term 2, requirement "Bring a valid vaccination record to the first day."), admin Anne Larsen |
| ts-02 | `01-places` to `10-entity-ready` | Ortopedisk klinikk set to 3 places and contact Erik Hagen added; new entity "Surgery ward 3B" (Avdeling, Bergen Kommune, VYSJS, both emner, 3 places, contact Ole Pedersen, placement information filled in) |
| ts-03 | `01-priorities` to `10-published` | Notice date 22 Oct 2026, deadline 30 Oct 2026; Lisa Björk with "Guardian of a child under 8 years of age" (4 pts), approved, decisions published |
| ts-04 | `01-placements` to `15-published-students` | Entities Ortopedisk klinikk (3), Kardiologisk sengepost (5), Surgery ward 3B (3), Onkologisk avdeling (8); 3 + 5 + 3 + 39 students; mentor Anne Hansen for Lisa Björk |
| ts-05 | `01-invoicing` to `05-filtered` | Placement of ts-04 published; weekly cost 1,809, then 2,000; filter Bergen Kommune / Surgery ward 3B |

The numbers in the text (50 students, 814,050, 900,000, 54,000, "over by 31") come from these states. If the starting data changes, run the scenarios again and check them.

Order of the images inside a scenario is the order of the steps in the page. After a change in the app, take the images of the affected scenario again with the same file names and run `npm run guide:check`.
