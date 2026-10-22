---
id: ts-05
title: "Test Scenario 05 — Reports: Invoicing"
short: 05 · Invoicing
order: 5
page: Reports → Invoicing
role: Placement Coordinator (PK)
goal: Read the invoice lines of the placement from scenario 4, change the weekly cost and filter the lines
needs: Scenario 4 done in the same session, without reloading the page.
minutes: 8
persists: The report is built from the placements, so it is empty again after a reload.
---

## What this page is

The Invoicing report has one line for each student who has a praksis place. The cost of a line is the number of weeks of the placement times the **weekly cost**. The report is meant to show what each place will cost.

> If you reload the page, or did not do scenario 4, the report is empty and says "No invoice lines — Assign students to praksis places, or adjust the filters."

## Steps

### 1. Open Invoicing
Open **Reports** in the left menu and press **Invoicing**.

![Invoicing, 50 invoice lines](/guide/ts-05/01-invoicing.png)

Expected: "50 invoice lines" and a total cost. With the weekly cost 1,809 the total is **814,050**: each line is 9 weeks (from week 36 to week 46, minus one) times 1,809 = 16,281. The lines are grouped by praksis place and entity, with a subtotal after each group. The status of every line is **Ongoing**, because the placement started on 2026-09-01.

**Think aloud:** Is it clear how each cost is worked out? What would you check first?

### 2. Change the weekly cost
Press the pencil next to **Weekly cost**.

![The weekly cost](/guide/ts-05/02-weekly-cost.png)

Type `2000` and press **Save**.

![A new weekly cost](/guide/ts-05/03-new-weekly-cost.png)

Expected: the total changes to **900,000** (50 lines × 9 weeks × 2,000).

### 3. Filter by praksis place and entity
Press the **Praksis place** filter. Point at **Bergen Kommune**; the entities of that place open next to it. Choose **Surgery ward 3B**.

![Praksis place and entity filter](/guide/ts-05/04-filter-place.png)

Expected: "3 invoice lines" with a total cost of **54,000** (3 × 9 × 2,000), and the filter reads "Bergen Kommune / Surgery ward 3B".

![Filtered lines](/guide/ts-05/05-filtered.png)

Press **Clear filters** to see all lines again. Try the other filters too: Study / Programme, Emne, location, status and Period.

## Final result

- You have seen the invoice lines of the placement from scenario 4: 50 lines, 814,050 at the weekly cost 1,809.
- With the weekly cost 2,000 the total is 900,000, and Surgery ward 3B alone is 3 lines and 54,000.

## For the researcher

- Did the participant understand where the lines come from? (From the placement; no publishing is needed.)
- Did they find the weekly cost and understand that it changes every line?
- Did they miss anything they need for real invoicing (invoice number, paid, cancellation columns are not filled in this prototype)?
- The statuses for cancelled places cannot be produced in this prototype, so do not ask about them.
- Success: they can say what the total is for one entity, and why.
