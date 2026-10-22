---
id: ts-01
title: "Test Scenario 01 — Settings: Studies, Programs and Study Admins"
short: 01 · Settings
order: 1
page: Settings
role: Placement Coordinator (PK)
goal: Add a study with a program and an emne (a practice course), then add a Study Admin
needs: Nothing. You start with the data already in the prototype.
minutes: 10
persists: Studies, programs and emner are saved in this browser. Study Admins are only kept until you reload the page.
---

## What this page is

Settings is where the coordinator keeps the **studies**, their **programs** and the **emner** (practice courses) that students are placed in. Study Admins are the people who look after a study.

In this scenario you add a small study of your own, so you do not change the data the other scenarios use.

## Steps

### 1. Open Settings
Press **Settings** in the left menu. The tab **Studies & Programs** is open. Look at the study "Hälso- och sjukvård samt social omsorg" with its four programs.

![Settings, Studies & Programs](/guide/ts-01/01-settings.png)

**Think aloud:** Is it clear what a study, a program and an emne are?

### 2. Add a study
Press **Add Study**, type `Test Studie` and press **Add**.

![The new study in the list](/guide/ts-01/02-study-added.png)

Expected: "Test Studie" appears in the list.

### 3. Add a program
Open "Test Studie", press **Add Program**, type the name `Sykepleie` and the code `SYK-B`, then press **Add**.

![Add Program](/guide/ts-01/03-add-program.png)

### 4. Add an emne
Open the program "Sykepleie" and press **Add Emne**. Fill in:

- Emne name: `Praksis 2 – Medisinsk sykepleie`
- Course code: `NSK201`
- Term: `2`
- Start term: `2026 Høst`
- Tick **Emne requirements** and write `Bring a valid vaccination record to the first day.`

Press **Add emne**.

![The Add Emne form](/guide/ts-01/04-add-emne.png)

Expected: the emne is listed under "Sykepleie", with the requirement in amber under it.

![The emne with its requirement](/guide/ts-01/05-emne-added.png)

> If you tick **Emne requirements** and leave the text empty, the form tells you to describe the requirement or untick the box. Try it.

### 5. Add a Study Admin
Open the tab **Study Admins** and press **Add Admin**. Fill in the name `Anne Larsen`, the e-mail `anne.larsen@example.com`, choose the study "Test Studie" and tick the program "Sykepleie". Press **Add**.

![Add Admin](/guide/ts-01/06-add-admin.png)

Expected: Anne Larsen is listed with "1 program".

![The admin in the list](/guide/ts-01/07-admin-added.png)

> Study Admins are for this session only: they are gone after a reload, and nothing else in the prototype uses them yet.

## Final result

- A study "Test Studie" with the program "Sykepleie" (SYK-B) and the emne "Praksis 2 – Medisinsk sykepleie" (NSK201, term 2) that carries a requirement.
- A Study Admin "Anne Larsen" for that program.

## Next

Go on to [Scenario 02: Praksis places](#/guide/ts-02).

## For the researcher

- Did the participant find **Add Program** and **Add Emne** without help? Note where they looked first.
- Did they understand "Start term" and "Emne requirements"? Ask what they expect the requirement to do.
- Did they expect a Study Admin to be saved or to have an effect somewhere?
- Success: study, program and emne exist and the admin is listed.
