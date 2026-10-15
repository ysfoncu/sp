# Summary of changes

Two parts: commit 32 (`3364372`, 2026-10-12), and the changes made since, which are not committed yet.

## Commit 32 (`3364372`)

An entity can accept several programs, and the emne definition got a requirement text.

- **Praksis places → Entities → entity page**
  - "Accepted programs" is now one card per program, each with its own emner and its own places per period. A program is added with "Add program" and removed with "Remove program" (blocked while students are placed under it).
  - Each card is edited and saved on its own. An emne's requirement is shown under the emne.
- **Entities list:** one line per program with its own placed / places count, and a total. The program filter matches any of an entity's programs.
- **Student placement → Available entities:** shows the matching program, "Also accepts …" for the entity's other programs, and counts only students of the same program against a program's places.
- **Reports and Dashboard:** the Capacity report, Placement report and Dashboard use the per-program numbers.
- **Settings → Studies and programs:** "Pair placement requested" is replaced by "Emne requirements": a checkbox plus a text that is required when the box is ticked.
- **Starting data:** Barne seksjon accepts three programs (VYBAR, VYSJS, MYLOG), with places for each.
- **Removed:** the "Set places" dialog.
- **Under the hood:** entities are saved in a new shape (storage version 6; older data is migrated). 129 tests passed.


### Student placement (a new placement now has 7 steps)
- **Step 1, Placement Details:** an optional Location (the study locations of the waiting students, with counts). It is shown from the start and is disabled until an emne is chosen. With a location only the students who study there are taken, and the title gets the location.
- **Step 2, Choose entities and slots (new):** the chosen entities with a slot stepper on the left, every entity that fits on the right (an entity leaves the right list when it is chosen). Slots never block ("Over by N" is only a note). The step can be skipped and entities added later with "Change entities". Both panels have a search.
- **Step 3, Place students:**
  - Only the chosen entities are offered. One floating bar serves both ways of starting (from an entity or from ticked students): the praksis place on the left, the number of selected students on the right, and Cancel. Hovering the count lists the names, and a click on a name scrolls to the student.
  - Students can be given tags (chips): several per student, "Tag N selected" for many, and a bar above the table that filters by tag.
  - The pick boxes are larger. The header shows the number of students.
  - The "not enough slots" warning is gone.
- **Steps 6 and 7, publishing is split in two:** "Publish to entities", then "Publish to students" (only after the entities). Edit unlocks, "Cancel edit" gives back what was published. The banner is indigo until the last step and green only once published to students.
- **Info banners:** every mandatory step (1, 2, 3, 6, 7) has an info banner with "Got it" and "Don't show this again".

### Praksis places
- **Entity page:** a program with 0 places is valid. There is no warning or "Places not set" tag for it.

### Praksis-students
- Pressing a student opens a right-hand side bar with the student's details and placement history (every placement the student was in, with entity and mentor).
- It can be opened from the Dashboard with a status chip already on.

### Dashboard
- A "Student overview" strip on top, above Placement Overview: Waiting for a place, Planned, Supervisor not attached yet, Total emner. The first two open Praksis-students.
- Dashboard tasks now read the 7-step list.

### Priorities
- Creating a priority list is now a page of its own, not a dialog: step 1 study, program, emne and an optional location (students come from Praksis-students), step 2 priority details. Afterwards the details of the new list open.
- The students of the whole Priorities part now come from Praksis-students.

### Reports
- **Placement report:** only the entities added to each placement are listed. "Start date", "End date", "Left", "Used elsewhere" and the status chips are removed, and the table shows Slots and Placed here.

### Onboarding tour
- The comment field is removed, and the nine steps are rewritten to follow the current app.


