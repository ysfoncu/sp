

Still very long process for adding quota
lets try something else
Update capacity planning page and Use an architechture smilar to in praksis places page.
after left navigation display studies, program and emnes to the left hyerarchically.

when study is pressed display programs as seperate tables
each table should list emne rows
and user will add quota to using program or emne.
If program is being used user will be able to add quota to multiple emnes.
each request will be displayed under each emne.

when program is pressed from left display one table with emnes.

adding capacity to emne should be updated as well.
if user is using program start with selecting emnes 
then user select praksis place and entity,
after selecting praksis place and entity user should be able to select another praksis place and entity
in the next step user should add requested quota, permanent or not and should be approved or not
in this case items should be added under emnes

if user is using emne 
then user select praksis place and entity,
after selecting praksis place and entity user should be able to select another praksis place and entity
in the next step user should add requested quota, permanent or not and should be approved or not
in this case items should be added under emnes


Student Slots
Configure how many students each place can accept per semester

Change this part as
Praksis place limits
Configure how many students in total can be deployed to a praksis place between 2 dates

initially this tab shold be empty
only a button as add limit should be displayed.
when this button is pressed display a pop up smilar to add quota step 2

user should be able to select entity of the org
limit- max place can be used
select limit type. Limit can be yearly or by semester. for both start of the year and end of the year should be selected as days and month like 01/01 - 12/31
select due date. this date will show until when
fex: if a user adds a lilit as
 Oslo University hospital/Ortopedisk clinic -100 - yearly/01/01 to 12/31 - due:12/31/2030
 It means until 12/31/2030 evey year 100 students can be sent to this org

 note: If a limit is added to a parent, another limit cannot be added t the child 

User should be able to 
for each item in table display a button as set limit.
Limit can be yearly or by semester
in both options user shoul select the 
When clicked user should be able to set a start and end date and set a number.
This will be used as total number of students which will be placed cannot exeed this number within selected dates

One more update in limits dialog
I should be able to select, programs or multiple emnes who can use this limit
If only program is selected it means all emnes of program are selected
display a new column after limit as studies/emnes
user should be select studies or menes and and distribute selected limit between emnes,
if all limit is not distributed display validation error


now we will use these limits in student placement tasks and deprecate capacity planning page.
based on selected emne display limits instead of Available Quotas
which means user have to define a limit for the emne and will use that limit for placement.
this way we will be deprecate capacity planning page and remove the extra complexcity.

ask clarification questions if any and plan the changes

praksis places page, limits tab still not happy with limiting logic. 
User cannot set limit to each entity except already added.
And when they add parent calculation become really messy.
Check functionality and sugegst a proper solution



And displaying 
 level. if a limit to an entity exsists users cannot
  set. parent item should carry and display child limit. display Praksis place limits


1- remove top entity from Praksis place limits table
2- When items from praksis places part is selected, only selected item and its children should be displayed in Praksis place limits table
3- Add new column after limit as total limit. it should display the sum of child and own 

❯ When an entity has its own limit and its units have limits too,  the total adds them together => to fix this lets plan a logic.

when setting a limit to an entity, if its child items having a limit, user cannot set a limit below sum of limit of child entities.

when setting a limit to an entity, if having parent item,  and parent item is having a limit, limit of entity cannot exeed the parent fixed limit

This is the most curicial logic

check all variations and create proper logic.

Items violates logic should be displayed as danger icon and violation reason should be displayed 

very nice.
Now we will fix another big logical problem
Student management
Sytem will receive students before placement.
Students are being imported to the system before placement. And when they are imported, they are already registered to a praksis with a study, program, emne, start and end dates. 
Main purpose in the app finding praksis place to the student. 
Imagine like this user is having 100 students from one study/program and from one emne. Its already decided and defined that students will have the praxsis, and user is trying to find praksis places to the students using profiles and place them to praksis places

tasks
Add new side item as Praksis-students
Add a button as import students.
When pressed imports 100 students belongs to 2 different studies, 4 different programs, and 8 different emnes. 
In this state we know which praksis, student will have but place is not decided. So add necessary columns to student item
Check related parts of referance document if you need help 
https://www.umu.se/globalassets/organisation/fakulteter/medfak/medicinska-fakulteten/utbildning/vfuvil/vfu-samordnare.pdf?e=J3h7fJ
Use proper filters in this page to filter students
This page will display students who are waiting for placement

When creating a new placement no need to select start and end date of the placement.
User will select 
study/program/emne/Placement title optional and pres continue. if title is empty selected attributes will be used
In the next screen students will be displayed automatically, from Praksis-students page and profiles who are accepting this emne students

Students will stay in Praksis-students page until placement is completed for the student. and this data should be displayed.

Now use your group of experts analyse the change and create your detailed plan. After plan continue with implementing, test it, refine it and let me know when completed.

If you will have questions after planning just ask.

4. Draft placement proposal: three tiers, reasons per student, an unplaced list and manual override. Nothing is assigned until the coordinator approves.

https://www.umu.se/globalassets/organisation/fakulteter/medfak/medicinska-fakulteten/utbildning/vfuvil/vfu-samordnare.pdf?e=J3h7fJ

Check this again and identify difference in organisations and profiles
Should we remove childentities in praksis places.
Still I could not clearly understand how organisations and profiles are build in reference and what is different in our implementation?
Check with your experts

The earlier answer that "slot" appears nowhere in the UMU manual was wrong. The word is in a screenshot on printed page 11, and my text search couldn't see inside images. It reads "Placement Slot" and is described under "Hantera platser". It is one student's booking on a profile, with dates, a shift type, a status (such as Committed) and a mentor. It is not a capacity number. I should have looked at the images then, as I did now.

I want to make another structural change.
I want to change existing hyererchical structure of praksis places.
There will be only main parent praksis place.
User should be able to add entity to main praksis place.
structure of the entity is same as profile.
So exsisting hyerarchical structure will be removed and profiles will become entities.
While creating entities as profiles user wont select the unit, but have to write profile name and this will be used as entity name

user will add contacts manually using contacts to the entity.
Now use your experts plan the changes and implement them

when an entity is added it should be displayed under main praksis place expanded/collapsed view. smilar to previous view but one level only.
When top praksis place is clicked, it should display 3 tabs, contacts, entities and place info.
Entities tab should display all registered entities and when card is clicked its details should be displayed in page, and it should be selected on left menu automatically.
When an entity is clicked in left panel details should be displayed. 
A contact can be added to multiple entities so user should be able to create contact rhen add it to enttities. contacts canbe supervisor or entity contact

when placing students using student placemen details screen, if places for the entity is 0 