---
id: ts-03
title: "Test Scenario 03 — Priorities: a new priority list from start to end"
short: 03 · Priorities
order: 3
page: Priorities
role: Placement Coordinator (PK)
goal: Create a priority list, register one student's application, review it and publish the decisions
needs: Nothing. The 485 students are already in Praksis-students.
minutes: 12
persists: Priority lists and applications are only kept until you reload the page. Do the whole scenario without reloading.
---

## What this page is

Students who have a reason to be placed first (for example a small child) can ask for priority. A **priority list** is made for one emne and collects those requests. The coordinator checks them, approves or rejects each one, and publishes the decisions.

In this prototype there is no student side. The coordinator registers a request for the student with **Submit on behalf of student**. That is intended.

You make a list for **Sjuksköterskeprogrammet (VYSJS), VFU HT 2026, location Skellefteå**. That group has 50 students.

## Steps

### 1. Open Priorities
Press **Priorities** in the left menu. The list is empty.

![Priorities, no lists yet](/guide/ts-03/01-priorities.png)

Press **Create new priority list**.

### 2. Choose study, program and emne
Choose:

- Study: `Hälso- och sjukvård samt social omsorg`
- Study Program: `Sjuksköterskeprogrammet`
- Emne: `VFU HT 2026`
- Location (optional): `Skellefteå`

![Step 1 of 2: Priority List Details](/guide/ts-03/02-list-details.png)

Expected: the title at the top follows your choices and the Location list shows "Skellefteå 50 students". Press **Continue**.

**Think aloud:** Where do you think the students on the list come from?

### 3. Set the dates and the message
Set **Noticing students date** to today (22 Oct 2026) and **Application deadline** to 30 Oct 2026. The message to the students is filled in already; you can change it. Press **Create priority list**.

![Step 2 of 2: Priority Details](/guide/ts-03/03-priority-details.png)

> The deadline has to be after the noticing date. Try the same day for both and read what the page says.

Expected: the message "Application period created" and the page of the new list opens with 50 students.

![The new priority list](/guide/ts-03/04-list-created.png)

> There is no separate "send first notice" button. Setting the noticing date counts as the first notice. Without a noticing date the submit icon in each row stays off.

### 4. Register an application for a student
In the row of **Lisa Björk** press the icon in the **Action** column (**Submit on behalf of student**). Tick the reason **Guardian of a child under 8 years of age** (4 pts) and press **Next: Documents**.

![The application](/guide/ts-03/05-submit-application.png)

You can attach PDF files, or skip this. Press **Submit application**.

![Supporting documents](/guide/ts-03/06-submit-documents.png)

Expected: the message "Application submitted for student". The row shows the date, "4 pts" and the status **Pending**.

![Application submitted](/guide/ts-03/07-submitted.png)

### 5. Review the application
Press **Review** in the row. Read the reasons and the points, then press **Approve**. (**Reject** asks for a reason first.)

![Review dialog](/guide/ts-03/08-review.png)

Expected: the status changes to **Approved** and the button to **View**.

### 6. Publish the decisions
Press **Publish decisions** at the top and confirm with **Publish**.

![Confirm publishing](/guide/ts-03/09-publish-confirm.png)

Expected: the list is **Closed** and says "Decisions published 2026-10-22". **Reopen for editing** brings it back.

![Decisions published](/guide/ts-03/10-published.png)

## Final result

- A priority list for VYSJS, VFU HT 2026, Skellefteå, with 50 students, notice date 22 Oct and deadline 30 Oct 2026.
- One approved application (Lisa Björk, 4 pts), and the decisions published.

The list is gone after a reload, so it does not carry over to the next scenarios.

## Next

Go on to [Scenario 04: Student placement](#/guide/ts-04).

## For the researcher

- Did the participant understand that the students on the list come from Praksis-students and that nothing needs to be imported?
- Did they look for a "send first notice" button? What did they expect it to do?
- Did they understand why they register the application themselves ("on behalf")?
- Was the difference between **Approve** and **Publish decisions** clear?
- Success: the list is Closed with decisions published.
