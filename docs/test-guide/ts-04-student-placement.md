---
id: ts-04
title: "Test Scenario 04 — Student placement: a placement from start to end"
short: 04 · Student placement
order: 4
page: Student placement
role: Placement Coordinator (PK)
goal: Place 50 students on entities and publish the placement to the entities and then to the students
needs: Do scenario 2 first if you want to use the new entity "Surgery ward 3B". Otherwise nothing.
minutes: 20
persists: A placement is only kept until you reload the page. Do scenarios 4 and 5 in one go.
---

## What this page is

A **student placement** places a group of waiting students on entities for one emne. It has seven steps. You choose the entities and how many **slots** each gives, place the students, add mentors, and publish: first to the entities, then to the students.

You place the **50 students of Sjuksköterskeprogrammet (VYSJS), VFU HT 2026, who study in Skellefteå**.

## Steps

### 1. Start a new placement
Press **Student placement** in the left menu, then **Create new student placement**.

![Student placement, no placements yet](/guide/ts-04/01-placements.png)

### 2. Step 1 of 7: Placement Details
Choose the study `Hälso- och sjukvård samt social omsorg`, the program `Sjuksköterskeprogrammet (VYSJS)`, the emne `VFU HT 2026` and the location `Skellefteå`.

![Placement Details](/guide/ts-04/02-placement-details.png)

Expected: "50 students are waiting for this emne at Skellefteå in Praksis-students. They are added to the placement automatically." Press **Continue**.

**Think aloud:** What do you expect "waiting" to mean here?

### 3. Step 2 of 7: Choose entities and slots
The right list shows every entity that accepts this program and emne, with its places and how many are free.

![Entities that fit VFU HT 2026](/guide/ts-04/03-choose-entities.png)

Press **Add** on **Ortopedisk klinikk** (3 places), **Kardiologisk sengepost** (5 places) and, if you made it in scenario 2, **Surgery ward 3B** (3 places). They move to the left panel with a slot stepper. Later, press **Change entities** and add **Onkologisk avdeling** (8 places) as well.

![Entities chosen](/guide/ts-04/04-entities-chosen.png)

Expected: "3 entities chosen · 11 slots in total · 50 students". The page warns "11 slots for 50 students" but does not stop you. Press **Continue to students**.

### 4. Step 3 of 7: Place the students
Press the person icon on **Ortopedisk klinikk**. The entity is marked "Placing here" and a dark bar appears at the bottom.

![Placing the students](/guide/ts-04/05-place-students.png)

Press **Top 3 by points** in the bar. The three students with the most priority points are ticked. Press **Add 3**.

![Top 3 by points](/guide/ts-04/06-top-by-points.png)

Do the same for **Kardiologisk sengepost** (**Top 5 by points**, **Add 5**) and **Surgery ward 3B** (**Top 3**). The first time, a hint explains the bar. Press **Got it**.

![The hint dialog](/guide/ts-04/07-place-hint.png)

### 5. Place the rest and see "over by N"
Press the person icon on **Onkologisk avdeling**, tick the box in the table header to select all 39 students that are left, and look at the bar: **over by 31**. Press **Add 39**.

![Over by 31](/guide/ts-04/08-over-by.png)

Expected: all 50 students are assigned. Onkologisk avdeling shows "31 over". Places never block you.

![All students placed](/guide/ts-04/09-all-placed.png)

**Think aloud:** Does it feel right that you can place more students than there are places?

### 6. Add a mentor (optional)
In the **Mentor** column of **Lisa Björk** press **Needs mentor** and choose **Anne Hansen**. The list shows the contacts of the entity, including Erik Hagen if you added him in scenario 2.

![Choosing a mentor](/guide/ts-04/11-mentor.png)

Expected: the message "Anne Hansen is now the mentor of Lisa Björk".

### 7. Step 6 of 7: Publish to entities
When every student is placed, the banner says "All students assigned — ready to publish to entities".

![Ready to publish](/guide/ts-04/10-ready-to-publish.png)

Press **Preview what students receive** if you like, then **Publish to entities** and confirm.

![Confirm publishing to entities](/guide/ts-04/12-publish-entities-confirm.png)

Expected: "Published to entities, not yet to students". Assignments are locked. **Edit** unlocks them.

![Published to entities](/guide/ts-04/13-published-entities.png)

### 8. Step 7 of 7: Publish to students
Press **Publish to students** and confirm. The warning about missing mentors does not stop you.

![Confirm publishing to students](/guide/ts-04/14-publish-students-confirm.png)

Expected: the message "Published to students" and a green banner. The assignments now say **Booked**.

![Published to students](/guide/ts-04/15-published-students.png)

## Final result

- A placement for VYSJS, VFU HT 2026, Skellefteå with 50 students, all placed: 3 on Ortopedisk klinikk, 5 on Kardiologisk sengepost, 3 on Surgery ward 3B and 39 on Onkologisk avdeling (31 over its 8 slots).
- Published to the entities and to the students.

Keep this page open or at least do not reload: scenario 5 reads these placements.

## Next

Go on to [Scenario 05: Invoicing](#/guide/ts-05).

## For the researcher

- Did the participant understand the difference between **slots** (this placement) and **places** (the entity)?
- Did they find the person icon, and understand the dark bar? Did they try the other way (tick students first)?
- How did they react to "over by 31"? Did they want it blocked?
- Did they see why there are two publish steps?
- Where did they hesitate? Note the step number.
- Success: the banner is green and says "Published to students".
