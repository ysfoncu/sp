import { useState, useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import ReactMarkdown from 'react-markdown';

interface PlacementTaskHelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// User guide content
const USER_GUIDE_CONTENT = `# User Guide: Creating a Placement Task (PK Coordinator)

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Creating a New Placement Task](#creating-a-new-placement-task)
4. [The 5-Step Placement Workflow](#the-5-step-placement-workflow)
5. [Key Features & Tools](#key-features--tools)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### What is a Placement Task?

A **Placement Task** is a structured workflow that helps PK coordinators manage the entire student internship placement process from start to finish. It guides you through checking the entities, importing students, assigning praksis places, managing documents, and publishing placement information.

### Who is this guide for?

This guide is designed for **PK Coordinators** (Program Koordinator/Teachers) who are responsible for:
- Managing student internship placements
- Coordinating with praksis places (internship sites)
- Checking the places that entities offer
- Assigning students to praksis places
- Finalizing placement documentation

---

## Getting Started

### Accessing Placement Tasks

1. Log into the student placement management system
2. Navigate to the **Placement Tasks** section from the main dashboard
3. Click **\"Create New Placement\"** or **\"+ New Placement Task\"**

---

## Creating a New Placement Task

### Step-by-Step: Initial Setup

#### 1. **Enter Basic Information**

Fill out the placement metadata form with the following details:

**Required Fields:**
- **Placement Title**: A descriptive name for this placement (e.g., \"Nursing Clinical Practice Spring 2026\")
- **Study Program**: Select the academic study program from the dropdown
- **Program Level**: Choose the specific program level (e.g., Bachelor Year 1, Master Year 2)
- **Subject**: Enter or select the subject area (e.g., \"Clinical Nursing\", \"Pediatric Care\")
- **Academic Year**: Select the year (e.g., \"2026\")
- **Semester**: Choose Spring or Autumn
- **Start Date**: First day of the placement period
- **End Date**: Last day of the placement period
- **Number of Students**: Estimated total students requiring placement

**Important Notes:**
- The system will calculate the semester automatically based on the start date if not specified
- Start date must be before the end date
- The number of students is compared with the places the matching entities offer

#### 2. **Review and Create**

- Click **\"Create Placement\"** to initialize the task
- The system will create a draft placement and open the detailed task view
- You'll see the **5-step workflow tracker** at the top of the screen

---

## The 5-Step Placement Workflow

The placement task follows a structured **5-step workflow** designed to ensure all students are properly placed and all documentation is complete.

---

### Step 1/5: Import students

**Status:** Mandatory | **Type:** Auto-completes

#### What happens in this step?

This is the foundation step where you check that the entities for this emne have places and prepare your student list.

#### Actions Required:

**A. Check the available entities**

1. **Look at \"Available entities\"** on the left of the placement view
2. It lists the **entities** that take this placement's program and emne, with the places left in the current period
3. **No entity, or not enough places?** Add an entity or raise its places under **Praksis places → Entities**:
   - Give the entity a name and pick the program (and emner) it is for
   - Set the places per period (the period is set once per praksis place) and fill in the contacts and information students get

**B. Import Students**

1. **Navigate to \"Students\" tab**
2. Click **\"Import Students\"** button
3. The system will load students matching your:
   - Study program
   - Program level
   - Academic year/semester

4. **Review the imported student list**
   - Verify all students are correctly loaded
   - Check for any missing students

#### When does this step complete?

✅ **Auto-completes when:**
- Students have been imported, AND
- The entities for this emne offer at least as many places as there are students

**💡 Pro Tip:** Entities at several praksis places add up, so you can spread students across them.

---

### Step 2/5: Attach Praksis Places to Students

**Status:** Mandatory | **Type:** Auto-completes

#### What happens in this step?

This is where you assign each student to an entity of a praksis place.

#### Actions Required:

**Method 1: Manual Assignment (Individual)**

1. **Navigate to \"Students\" tab**
2. **Find the student** you want to assign
3. **Click the \"Assign\" button** next to their name
4. **In the assignment modal:**
   - Select the praksis place from the dropdown
   - Choose the entity
   - Verify the entity has places left
   - Confirm the assignment

5. **Repeat** for each student

**Method 2: AI Auto-Assign (Batch)**

When the **AI Auto-Assign** button appears in the Current Task Banner:

1. **Click \"AI Auto-Assign\"** 
2. **Review the AI's suggested assignments:**
   - The AI considers student preferences
   - Balances the load across entities
   - Respects capacity
   - Accounts for custom requests

3. **Accept or modify suggestions:**
   - You can accept all suggestions at once
   - Or manually adjust individual assignments

4. **Confirm the assignments**

**Method 3: Quick Assign from an entity**

1. **Look at \"Available entities\"** on the left
2. **Find an entity** with places left
3. **Click \"Quick Assign Students\"** button
4. **In the Quick Assign modal:**
   - View unassigned students
   - Select multiple students (checkbox selection)
   - Click \"Assign Selected Students\"
   - Students are placed on that entity

**Method 4: Assign one student at a time**

1. **Click \"Add praksis place\"** on a student's row
2. **Pick an entity** with places left
3. The student is placed on that entity

#### When does this step complete?

✅ **Auto-completes when:**
- All students have been assigned to a praksis place
- No unassigned students remain

**💡 Pro Tip:** Use AI Auto-Assign for initial bulk assignments, then manually adjust any special cases or student preferences.

---

### Step 3/5: Attach Required Documents

**Status:** Optional | **Type:** Mark as completed

#### What happens in this step?

Upload and send necessary documentation to praksis places, such as insurance certificates, learning objectives, evaluation forms, or placement agreements.

#### Actions Required:

1. **Navigate to \"Praksis Places\" tab**
2. **Select a praksis place** that requires documentation
3. **Click \"Attach Documents\" or \"Upload Documents\"**
4. **Upload files:**
   - Drag and drop files
   - Or click to browse and select
   - Supported formats: PDF, DOCX, XLSX, images

5. **Add document details:**
   - Document type/category
   - Description or notes
   - Expiry date (if applicable)

6. **Send to praksis place:**
   - Documents can be shared directly with the contact person
   - Track document delivery status

7. **Repeat** for all praksis places requiring documentation

#### When does this step complete?

✅ **Manually completed when:**
- You click **\"Mark as completed\"** button in the Current Task Banner
- This button appears when the current task is 3/5

**📝 Note:** This is an optional step. You can skip it if no documentation is required, or mark it complete when ready to proceed.

---

### Step 4/5: Assign Supervisors to Students

**Status:** Optional | **Type:** Mark as completed

#### This is an experimental step. Just skip the task


#### When does this step complete?

✅ **Manually completed when:**
- You click **\"Mark as completed\"** button in the Current Task Banner
- This button appears when the current task is 4/5

**📝 Note:** This is an optional step. Some placements may not require formal supervisor assignment at this stage.

---

### Step 5/5: Publish (Finalize)

**Status:** Mandatory | **Type:** Auto-completes

#### What happens in this step?

The final publication locks the placement, sends notifications to all parties, and marks the placement as completed.

#### Actions Required:

**Prerequisites:**
- All mandatory tasks (1/5, 2/5) must be completed
- You must be ready to finalize the placement

#### Publish Options:

**If all mandatory tasks are complete:**
- The step **auto-completes** automatically
- A **green success banner** appears confirming completion
- The placement status changes to \"completed\"

**If you need to finalize manually:**
- Click **\"Finalize & Publish\"** if available
- Confirm that all information is accurate
- The system will send final notifications

#### What happens after second publish?

- ✅ All students receive final placement confirmations
- ✅ Praksis places receive student lists and details
- ✅ Supervisors are notified of their assignments
- ✅ The placement is locked and archived
- ✅ Reporting and analytics are finalized

**⚠️ Important:** After second publish, major changes require creating a new placement or manual intervention.

---

## Key Features & Tools

### Current Task Banner

- **Location:** Top of the screen, below any alerts
- **Purpose:** Shows your current step and available actions
- **Features:**
  - Step indicator (e.g., \"2/5 Attach praksis places to students\")
  - Description of what to do
  - Action buttons specific to the current step
  - \"View all\" link to see complete task list

### Task Modal (View All Tasks)

Access the complete task overview:

1. Click **\"View all\"** in the Current Task Banner
2. See all 5 steps with:
   - Completion status (✓ or pending)
   - Step titles and descriptions
   - Action buttons for each step
   - Mandatory vs. Optional labels

### Entities

**Where entities come from:**
- Entities are made on a praksis place under **Praksis places → Entities**
- Each entity is for one program (all or some of its emner) and offers a number of places; this placement can use the entities that take its program and emne
- A yearly entity's places are shared by all placements it covers in the same yearly period; a semester entity's by placements in the same semester

**Available entities panel:**
- One row per entity, grouped by praksis place
- Shows places left, and how many are used in other placements
- Quick assign places students on the entity

### AI Auto-Assign

**When available:**
- Appears when the entities have places AND students are imported
- Shows in the Current Task Banner during step 2/5

**How it works:**
1. AI analyzes student data, preferences, and custom requests
2. Considers praksis place capacity and requirements
3. Optimizes assignments for balanced distribution
4. Presents suggestions for your review
5. You can accept, modify, or reject suggestions

**Benefits:**
- Saves time on bulk assignments
- Considers multiple factors simultaneously
- Ensures fair distribution
- Respects student preferences when possible

### Quick Assign Students Modal

**Access from:**
- The assign button on an entity in the Available entities panel

**Features:**
- Shows unassigned students only
- Multi-select checkboxes
- Batch assignment to a specific entity
- Real-time capacity validation
- Prevents over-assignment

### Students Table: Advanced Features

#### Network Diagram

The **Network Diagram** button provides a visual representation of the organizational structure and people associated with your placement.

**Location:**
- Students tab toolbar (top-right area)
- Purple button with network icon labeled \"Diagram\"

**What it shows:**
1. **Praksis places and entities:**
   - Each praksis place with its entities, and the places left on each
   - Color-coded nodes (purple = has students placed, gray = empty entities)

2. **Student distribution:**
   - Students placed on each entity
   - Count indicators per entity

3. **Interactive Elements:**
   - Drag a student onto an entity to place them there
   - Zoom in/out controls
   - Pan and navigate the diagram

**When to use:**
- ✅ Seeing how students are spread across entities
- ✅ Identifying entities with free places
- ✅ Placing students by drag and drop

**How to use:**
1. Navigate to the **Students** tab
2. Click the **\"Diagram\"** button (purple button with network icon)
3. The modal opens showing the full organizational network
4. Use mouse to:
   - **Drag** to pan the view
   - **Scroll** to zoom in/out
   - **Click nodes** to see details
5. Use the **Controls** in the bottom-right:
   - Zoom in (+)
   - Zoom out (-)
   - Fit view (⊡)
   - Reset view
6. View the **Mini-map** in bottom-left corner for navigation
7. Click **Close** or press **Esc** to exit

**💡 Pro Tip:** The network diagram helps you visualize how students are spread across entities and identify underutilized entities that could accept more students.

#### Columns Button

The **Columns** button allows you to customize which columns are visible in the students table, helping you focus on relevant information.

**Location:**
- Students tab toolbar (top-right area)
- Button with columns icon (three vertical lines) labeled \"Columns\"

**Available Columns:**
1. **Student** - Name, email, and year (always visible by default)
2. **Placement History** - Previous placements and semesters
3. **Assigned Praksis Place** - Current assignment details
4. **Supervisor** - Assigned academic supervisor(s)
5. **Priorities** - Student's ranked praksis place preferences
6. **Custom Request** - Student's custom placement requests
7. **Attach Files** - Document attachments and uploads

**How to use:**
1. Click the **\"Columns\"** button in the Students tab toolbar
2. A dropdown menu appears showing all available columns
3. **Check/uncheck** columns to show or hide them:
   - ✅ Checked = Column is visible
   - ☐ Unchecked = Column is hidden
4. The table updates immediately
5. Click outside the menu or press **Esc** to close

**Default visible columns:**
- Student ✓
- Placement History ✓
- Assigned Praksis Place ✓
- Supervisor ✗ (hidden)
- Priorities ✓
- Custom Request ✓
- Attach Files ✓

**When to use:**
- ✅ **During Assignment (Step 2/5):** Show \"Assigned Praksis Place\" and \"Priorities\"
- ✅ **Reviewing History:** Enable \"Placement History\" to see student experience
- ✅ **Supervisor Assignment (Step 4/5):** Show \"Supervisor\" column
- ✅ **Document Management (Step 3/5):** Show \"Attach Files\" column
- ✅ **Reviewing Requests:** Show \"Custom Request\" to see student preferences
- ✅ **Clean View:** Hide unnecessary columns to reduce clutter

**💡 Pro Tip:** Hide columns you don't need for the current task to make the table easier to scan. For example, during initial assignments, hide \"Supervisor\" and \"Attach Files\" to focus on placement matching.

### Alerts and Warnings

The system provides helpful alerts:

**\"No entities chosen\" Alert:**
- Appears when students are in the placement but no entity is chosen yet
- Use Change entities to choose entities and slots
- Slots never block: you can place more students than slots (the entity shows \"over by N\")

**\"All Students Assigned\" Success:**
- Confirms step 2/5 completion
- Shows completion checkmark

**Validation Errors:**
- Date range validation
- Required field checks
- Capacity warnings

---


---

*This user guide is part of the Student Placement Management System documentation. For technical support or questions, please contact your system administrator.*
`;

export function PlacementTaskHelpOverlay({ isOpen, onClose }: PlacementTaskHelpOverlayProps) {
  const [markdownContent, setMarkdownContent] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Set the markdown content directly from the USER_GUIDE_CONTENT
      setMarkdownContent(USER_GUIDE_CONTENT);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div 
        className={`fixed right-0 top-0 h-full w-2/3 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Placement Task Guide
              </h2>
              <p className="text-sm text-gray-600">
                Step-by-step instructions for managing placement tasks
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-80px)] overflow-y-auto px-8 py-6">
          <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700">
            <ReactMarkdown
              components={{
                // Style headings
                h1: ({ node, ...props }) => (
                  <h1 className="text-3xl font-bold mb-6 mt-8 pb-3 border-b-2 border-gray-200" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-2xl font-bold mb-4 mt-8 pb-2 border-b border-gray-200" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-xl font-semibold mb-3 mt-6 text-blue-600" {...props} />
                ),
                h4: ({ node, ...props }) => (
                  <h4 className="text-lg font-semibold mb-2 mt-4 text-gray-800" {...props} />
                ),
                // Style code blocks
                code: ({ node, className, children, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono" {...props}>
                      {children}
                    </code>
                  );
                },
                // Style blockquotes
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-2 my-4 italic text-gray-700" {...props} />
                ),
                // Style lists
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-6 my-3 space-y-1" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal pl-6 my-3 space-y-1" {...props} />
                ),
                // Style links
                a: ({ node, ...props }) => (
                  <a className="text-blue-600 hover:text-blue-800 underline font-medium" {...props} />
                ),
                // Style tables
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border border-gray-300 rounded-lg" {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th className="bg-gray-100 border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="border border-gray-300 px-4 py-2 text-gray-700" {...props} />
                ),
                // Style horizontal rules
                hr: ({ node, ...props }) => (
                  <hr className="my-8 border-t-2 border-gray-200" {...props} />
                ),
                // Style paragraphs
                p: ({ node, ...props }) => {
                  const text = props.children?.toString() || '';
                  // Check if paragraph starts with emoji indicators
                  if (text.startsWith('✅') || text.startsWith('⚠️') || text.startsWith('📝') || text.startsWith('💡')) {
                    return (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 px-4 py-3 my-3 rounded-r-lg" {...props} />
                    );
                  }
                  return <p className="mb-3 leading-relaxed" {...props} />;
                },
                // Add custom styling for strong text with special prefixes
                strong: ({ node, children, ...props }) => {
                  const text = children?.toString() || '';
                  if (text.startsWith('Step ') || text.startsWith('Method ') || text.startsWith('Status:')) {
                    return (
                      <strong className="text-purple-700 font-bold" {...props}>{children}</strong>
                    );
                  }
                  return <strong className="font-semibold text-gray-900" {...props}>{children}</strong>;
                },
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer with quick action */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Need more help? Contact your system administrator
            </p>
            <Button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Close Guide
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}