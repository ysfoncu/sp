

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