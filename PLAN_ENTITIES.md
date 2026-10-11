# Plan: praksis place → entities (profiles become entities, hierarchy removed)

Built from three expert reports (architecture, UX, impact/QA).

## Request
There is only the main praksis place. A user adds **entities** to it. An entity has the structure of today's profile (program, accepted emner, places, placement information, contacts). The organisation hierarchy goes away. Creating an entity: no unit is picked; the user writes the **name**, which is the entity name. Contacts are added **manually** on the entity.

## Decisions
| Topic | Decision |
|---|---|
| Entity | The existing `PlacementProfile` type becomes the entity (type name kept, UI says "entity"). `unitId` is removed; the entity id is its identity |
| Contacts | Embedded on the entity: `{id, name, role, email, phone, notifyOnPlacement, availableToStudents}`. The old `associated` flag goes away. No shared people directory, no inheritance |
| Mentor | Chosen from the entity's contacts |
| Assignment | Stores `placeId` + `profileId`; `entityId` and `departmentId` are kept as copies of the entity id and `departmentName` as the entity name, so older readers (reports, dashboard, diagram) keep working |
| Duplicates | Entity names are unique per place (case-insensitive). Several entities may cover the same program and emne |
| Copy | Duplicate within the same place, name "Copy of X"; copy-to-other-units is removed |
| Place | Flat: name, type label (HF/Kommune), address and the existing fields. No tree, no departments, no levels |
| Migration | Stored profiles move to storage version 2: contacts are copied from the old people they pointed to, names are made unique, `unitId` is dropped |

## Order (build, tests and typecheck green after each step)
1. Types and migration (`placementProfile.ts`, `profileRules.ts`, `profileUsage.ts`, `studentView.ts`, `profilePeople.ts`) + tests
2. Entity editor with manual contacts, entities list, mentor picker, duplicate dialog
3. Place pages: flat list and place detail with an Entities tab; create-place form; remove the tree
4. Assignment flows (panel, assign dialog, quick assign, diagram, demo placement)
5. Reports, dashboard and AI text
6. Delete dead files (`organizationStructure.ts`, `praksisPlaceHierarchy.ts`, `StructureOverviewTab`, `HierarchicalOrganizationSelector`, `AddDepartmentMemberModal`, `PraksisPlaceDetailModal`, `CopyProfileDialog`), grep for leftovers
7. Safari acceptance, refine, report

## Not in scope
Nested entities, a shared people directory, copying to another place, bulk import, Norwegian wording.
