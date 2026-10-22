# Test guide

The guide for the test users of the research. The pages are markdown files in this folder. The app shows them on the **Test guide** page (sidebar, under Settings); a page has the address `#/guide/<id>`.

| File | Page | Time |
|---|---|---|
| `00-start-here.md` | Start here: login, what is saved, how to give feedback | 5 min |
| `ts-01-settings-studies-programs.md` | Settings: study, program, emne, Study Admin | 10 min |
| `ts-02-praksis-places.md` | Praksis places: edit an entity, add a new one | 12 min |
| `ts-03-priorities.md` | Priorities: a new priority list from start to end | 12 min |
| `ts-04-student-placement.md` | Student placement: a placement from start to end | 20 min |
| `ts-05-invoicing-report.md` | Reports: Invoicing | 8 min |

The scenarios are meant to be done in this order in one session, without reloading. Scenario 4 uses the entity made in scenario 2 (optional), and scenario 5 needs scenario 4.

## A page

```
---
id: ts-06            # the address: #/guide/ts-06
title: "Test Scenario 06 — …"
short: 06 · Name     # the sidebar label
order: 6
page: …              # shown in the overview box
role: …
goal: …
needs: …             # "Before you start"
minutes: 10
persists: …          # "Saved or lost"
---
## What this page is
## Steps
### 1. A short heading
One or two sentences. Expected: …
![Caption](/guide/ts-06/01-name.png)
## Final result
## Next
## For the researcher      # shown folded; questions and what counts as success
```

- A link to another page is written `[text](#/guide/ts-02)` and stays inside the app.
- Images are in `public/guide/<id>/NN-name.png`, 1400 px wide at most, taken at a window of 1440 × 900.
- `npm run guide:check` lists images that are missing or unused and links to pages that do not exist.
- The guide does not contain access codes. The list for the testers is `public/access-codes-reference.txt`.

See `screenshots.md` for how to take the images again after the app changes.
