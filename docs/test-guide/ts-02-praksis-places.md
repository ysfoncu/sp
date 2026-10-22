---
id: ts-02
title: "Test Scenario 02 — Praksis places: edit an entity and add a new one"
short: 02 · Praksis places
order: 2
page: Praksis places
role: Placement Coordinator (PK)
goal: Change an existing entity, then create a new entity and make it ready for placements
needs: Nothing. The places, entities and contacts are already in the prototype.
minutes: 12
persists: Everything you change here is saved in this browser and is still there after a reload.
---

## What this page is

A **praksis place** is a hospital, a municipality or a service. An **entity** is where students are placed at a place, for example a clinic, a ward or a group. An entity says which program it takes, how many places it has, who the contacts are and what students are told.

You edit one entity (Ortopedisk klinikk at Oslo University Hospital HF) and create a new one (Surgery ward 3B at Bergen Kommune).

## Part A: Edit an existing entity

### 1. Open the entity
Press **Praksis places** in the left menu. The tab **Entities** shows the entities of Oslo University Hospital HF.

![Praksis places, Entities tab](/guide/ts-02/01-places.png)

Press **Ortopedisk klinikk** in the list on the left.

![The entity page](/guide/ts-02/02-entity.png)

Expected: a green line says "Ready for placements. Everything is filled in." The page has blocks: Entity, Accepted programs, Entity contacts and Placement information. Each block has its own **Edit** button and its own **Save**.

**Think aloud:** What do you expect "Accepted programs" to mean?

### 2. Change the number of places
In the block **Sjuksköterskeprogrammet (VYSJS)** press **Edit**. Change "Places per period" from 2 to 3 and press **Save**.

![Editing the places](/guide/ts-02/03-edit-places.png)

Expected: the block shows "3 places per period".

![Places saved](/guide/ts-02/04-places-saved.png)

> Try pressing another tab or entity while a block is open with changes. The prototype asks "Keep editing" or "Discard changes".

### 3. Add a contact
In the block **Entity contacts** press **Edit**. Open **Add an existing contact…** and choose **Erik Hagen · Supervisor**. Press **Save**.

![Adding a contact](/guide/ts-02/05-add-contact.png)

Expected: the block now shows four contacts. The contact is a person of the place, so the same person can be added to other entities too.

## Part B: Add a new entity

### 4. Create the entity
Press **Bergen Kommune** in the list, open the tab **Entities** and press **Add entity**. Choose the type **Avdeling**, type the name `Surgery ward 3B` and press **Create**.

![Add entity](/guide/ts-02/06-add-entity.png)

Expected: the page of the new entity opens. A yellow box says "To complete: 3 things missing" (Program, Contacts, Placement information) and that the entity is not offered when students are placed until it has a program and emner.

![The new entity, not complete yet](/guide/ts-02/07-new-entity.png)

### 5. Add a program
Press **Add program** and choose **Sjuksköterskeprogrammet (VYSJS)**. Leave both emner ticked. Set "Places per period" to `3` and press **Save**.

![Adding the program](/guide/ts-02/08-new-program.png)

Expected: the message "Sjuksköterskeprogrammet added".

### 6. Add a contact
In **Entity contacts** press **Edit**, choose **Ole Pedersen · Supervisor** under **Add an existing contact…** and press **Save**.

### 7. Fill in the placement information
In **Placement information** press **Edit** and fill in the fields, for example:

- Who to contact before the placement: `The unit contact`
- Contact person's phone number: `+47 55 00 00 00`
- Activity description: `Students follow the daily work of the ward with a supervisor.`
- Work organisation: `Day and evening shifts.`
- Rules for work clothes: `Uniform is provided by the ward.`

Press **Save**.

![Placement information](/guide/ts-02/09-placement-info.png)

Expected: the yellow box is gone and the page says "Ready for placements".

![The finished entity](/guide/ts-02/10-entity-ready.png)

## Final result

- Ortopedisk klinikk has 3 places for VYSJS and four contacts.
- Surgery ward 3B (Avdeling, Bergen Kommune) takes VYSJS, has 3 places, a contact and placement information, and is ready for placements.

Both changes stay after a reload. In scenario 4 the new entity is offered when you place students.

## Next

Go on to [Scenario 03: Priorities](#/guide/ts-03).

## For the researcher

- Did the participant understand the difference between a place and an entity?
- Did they notice that each block saves on its own? Did they lose a change by leaving a block open?
- Was the yellow "To complete" box enough to tell them what to do next?
- Did they expect places to limit placements? (They do not: places are only a guide.)
- Success: the new entity shows "Ready for placements".
