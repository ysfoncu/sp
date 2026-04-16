import { useState, useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import ReactMarkdown from 'react-markdown';

interface CapacityPlanningHelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// User guide content - imported from USER_GUIDE_CAPACITY_PLANNING.md
const USER_GUIDE_CONTENT = `# User Guide: Capacity Planning (PK Coordinator)

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Understanding the Interface](#understanding-the-interface)
4. [Creating Quota Requests](#creating-quota-requests)
5. [Managing Quota Requests](#managing-quota-requests)
6. [Available Quotas Dashboard](#available-quotas-dashboard)
7. [Filtering and Search](#filtering-and-search)
8. [Workflows and Best Practices](#workflows-and-best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Capacity Planning?

**Capacity Planning** is the central hub for PK coordinators to request, manage, and monitor praksis place quotas (available positions) for student placements. This page helps you secure enough internship positions before creating or during placement tasks.

### Key Concepts

**Quota Request:** A formal request to a praksis place for a specific number of student positions for a defined period.

**Available Quotas:** Approved quota requests that can be used for student assignments across placement tasks.

**Consumed Quotas:** The number of students already assigned to a specific quota request.

**Distributed Quotas:** Visual representation showing how quotas are distributed across time periods.

---

## Getting Started

### Accessing Capacity Planning

1. Log into the student placement management system
2. Click on **"Capacity planning"** in the left sidebar
3. You'll see the main capacity planning dashboard with two key sections:
   - **Available Quotas** (top section)
   - **Quota Requests** (bottom section)

### First Time Setup

When you first access the page:
- The **Available Quotas** section will be empty until you have approved requests
- The **Quota Requests** section will be empty until you create your first request
- Use the **"Request Quota"** button (purple button, top-right) to create your first request

---

## Understanding the Interface

### Page Layout

The Capacity Planning page consists of several key areas:

#### 1. **Header Section**
- **Title:** "Capacity planing"
- **Description:** Brief explanation of the page purpose
- Located at the very top of the page

#### 2. **Filters and Actions Bar**
Located just below the header in a white card:

**Default View (Collapsed Search):**
- **Search Button:** Click to activate search mode
- **Study Filter:** Dropdown to filter by study program (e.g., "Nursing", "Medicine")
- **Program Filter:** Dropdown to filter by program level (e.g., "Bachelor Year 1")
- **Status Filter:** Dropdown to filter quota requests by status
- **Request Quota Button:** Purple button to create new requests

**Search Mode (Expanded):**
- **Search Input:** Type to search across studies, programs, and praksis places
- **Close Button:** Exit search mode and return to filter view

#### 3. **Available Quotas Table**
(HIDDEN IF THERE IS NO REQUESTS YET)
Shows aggregated quota capacity by study program and program level:

**Columns:**
- **Study / Program:** The study name and program level
- **Total:** Total approved quota capacity for this study/program
- **Distributed Quota:** Line chart showing quota distribution over time

**Features:**
- **Dual-line Charts:** Purple line = Approved quotas, Orange line = In Review (pending)
- **Interactive Tooltips:** Hover over chart to see exact numbers per date
- **Date Range Display:** Shows the time period (current date to one year ahead)

**When visible:**
- Only appears when you have at least one quota request
- Hidden in search mode
- Automatically updates when requests are approved

#### 4. **Quota Requests Table**
Comprehensive table showing all your individual quota requests:

**Columns:**
1. **Study / Program:** Study name, program name, and subject (emne) if specified
2. **Praksis Place / Department:** The institution and specific department
3. **Contact:** Contact person's name and email with chat button
4. **Requested:** Number of positions you requested
5. **Approved:** Number of positions approved (if status = approved)
6. **Consumed:** Number of students already assigned (if status = approved)
7. **Period:** Date range for the quota (e.g., "Mar 15, 2026 - May 30, 2026")
8. **Status:** Badge showing current status (Pending, Approved, Rejected, Fulfilled)
9. **Actions:** Action buttons based on status

**Status Indicators:**
- 🟢 **Approved:** Green badge - Ready to use
- 🟡 **Pending:** Yellow badge - Awaiting approval
- 🔴 **Rejected:** Red badge - Request was declined
- 🔵 **Fulfilled:** Blue badge - All quotas consumed

**Action Buttons:**
- **Trash (🗑️):** Delete pending requests (only for pending status)
- **Check (✓):** Approve on behalf of SK contact (only for pending status)
- **Arrow (→):** Navigate to placement task (only for approved status)
- **Chat (💬):** Start conversation with contact person

---

## Creating Quota Requests

### Step-by-Step: Request Quota Button

Creating a quota request is the primary action on this page. Follow these steps:

#### 1. **Click "Request Quota" Button**

- Located in the top-right of the filters bar
- Purple button with "+" icon
- Opens the **Request Quota Modal**

#### 2. **Fill Out the Request Form**

The modal contains the following sections and fields:

**A. Study and Program Selection**

Required Fields:
- **Study Program:** Select from dropdown (e.g., "Nursing", "Medicine", "Social Work")
- **Program Level:** Select after choosing study (e.g., "Bachelor Year 1", "Master Year 2")
- **Subject (Emne):** Optional - Enter specific subject area

**💡 Pro Tip:** The program dropdown is disabled until you select a study program.

**B. Organizational Selection (Hierarchical)**

The system uses a **hierarchical organization selector** with three modes:

**Mode 1: Full Hierarchy (Default)**
1. **Select Praksis Place:** Choose the institution (e.g., "Oslo University Hospital")
2. **Select Region:** Choose organizational region
3. **Select Municipality:** Choose municipality within region
4. **Select Department:** Choose specific department
5. **Select Place:** Optional - Choose specific section/unit

**Mode 2: Skip Place Selection**
- Used when you want to request quota at department level
- Toggle the "Skip place selection" option if available
- Stops at Department level instead of requiring Place/Section

**💡 Pro Tip:** Use skip place selection when the praksis place doesn't have detailed section breakdown or when quota applies to entire department.

**C. Quota Details**

Required Fields:
- **Start Date:** First day of the placement period
- **End Date:** Last day of the placement period
- **Number of Students:** How many student positions you're requesting

**⚠️ Important:** 
- End date must be after start date
- Consider requesting more positions than your immediate need to account for growth

**D. Additional Information**

Optional Fields:
- **Notes/Requirements:** Add any special requirements, conditions, or context
- Examples: "Prefer morning shifts", "Pediatric focus required", "Level 3 trauma experience"

#### 3. **Review Conflict Detection**

Before submitting, the system automatically checks for conflicts:

**Conflict Types:**
- **Date Overlap:** You already have a request for same study/program/department with overlapping dates
- **Duplicate Request:** Identical request already exists

**If conflicts detected:**
- A warning message appears
- You can still submit but should review if it's intentional
- Consider modifying dates or capacity instead

#### 4. **Submit the Request**

- Click **"Create Request"** button
- The request is created with status = **"Pending"**
- Modal closes and returns to capacity planning page
- New request appears in the Quota Requests table

#### 5. **What Happens Next?**

After submission:
1. Request appears in table with **Yellow "Pending" badge**
2. Contact person at praksis place is notified (in real system)
3. You can track status in the Quota Requests table
4. You can delete the request if needed (trash icon)
5. You can approve on behalf of SK for demo purposes (checkmark icon)

---

## Managing Quota Requests

### Understanding Request Lifecycle

A quota request goes through several states:

\`\`\`
Pending → Approved → Fulfilled
   ↓
Rejected
\`\`\`

#### Status: Pending 🟡

**What it means:** Request submitted, waiting for approval from contact person

**Available Actions:**
- **Delete Request:** Remove if created by mistake or no longer needed
- **Approve on Behalf:** Simulate approval (for demonstration/testing)
- **Chat with Contact:** Discuss request details

**What you can do:**
- Wait for contact person to respond
- Follow up via chat if urgent
- Delete and recreate if details were wrong

#### Status: Approved 🟢

**What it means:** Contact person has approved the request

**Available Actions:**
- **Navigate to Placement (→):** Jump to a placement task to use this quota
- **Chat with Contact:** Discuss logistics or details

**What you see:**
- **Approved column:** Shows approved capacity (may differ from requested)
- **Consumed column:** Shows how many students are assigned
- **Quota appears in Available Quotas table** (top section)

**What you can do:**
- Use quota in placement tasks for student assignments
- Monitor consumption vs. capacity
- Track remaining availability

#### Status: Rejected 🔴

**What it means:** Contact person declined the request

**Available Actions:**
- **View rejection reason:** Check response notes
- **Chat with Contact:** Discuss alternative options

**What you can do:**
- Create a new request with different parameters
- Request quota from a different department
- Negotiate with contact person

#### Status: Fulfilled 🔵

**What it means:** All quota positions have been assigned to students

**Available Actions:**
- **View consumption details**
- **Navigate to Placement:** See which students are assigned

**What you can do:**
- Request additional quota if more students need placement
- Review completed assignments

### Approving Requests (On Behalf of SK)

**⚠️ Important:** This feature is for demonstration/testing purposes. In production, only the contact person (SK) at the praksis place should approve requests.

**How to approve:**
1. Find a **Pending** request in the table
2. Click the **green checkmark (✓)** button
3. **Warning dialog appears** explaining you're approving on behalf of SK
4. Read the warning and click **"Proceed to Approve"**
5. **Approve/Reject Modal opens** with options:

**In the Approval Modal:**

**Approval Option:**
- **Select Department:** Confirm or change the department
- **Approved Capacity:** Modify the approved number (can be less than requested)
- **Response Notes:** Add comments or conditions
- Click **"Approve Request"**

**Rejection Option:**
- Select rejection reason from dropdown
- Add detailed notes explaining why
- Click **"Reject Request"**

**After approval:**
- Status changes to **Approved** ✅
- Request appears in **Available Quotas** dashboard
- Can now be used in placement tasks

### Deleting Requests

**When to delete:**
- Request created by mistake
- Requirements changed
- No longer need quota from that praksis place
- Want to create new request with different parameters

**How to delete:**
1. Find the request with **Pending** status
2. Click the **red trash icon (🗑️)**
3. **Confirmation dialog appears**
4. Review the request details shown
5. Click **"Delete"** to confirm or **"Cancel"** to keep

**⚠️ Warning:** Deletion is permanent and cannot be undone.

**Cannot delete:**
- Approved requests (students may be assigned)
- Rejected requests (kept for record)
- Fulfilled requests (assignments exist)

### Navigating to Placement Tasks

**When available:** Only for **Approved** quota requests

**Purpose:** Jump directly to a placement task to assign students using this quota

**How to use:**
1. Find an **Approved** request (green badge)
2. Click the **blue arrow icon (→)** in the Actions column
3. System searches for relevant placement tasks that match:
   - Same study program
   - Same program level
   - Overlapping date range
4. If matching placement exists, navigates to that placement
5. If no match, may prompt to create new placement

**💡 Pro Tip:** Use this feature to quickly switch between capacity planning and active placements.

### Communicating with Contacts

**Chat Button (💬):**
- Available for all requests
- Opens a chat dialog with the contact person
- Shows contact's name and email

**Current Implementation:**
- Displays contact information
- Placeholder for future real-time chat functionality
- Use email contact in the meantime

---

## Available Quotas Dashboard

The **Available Quotas** section provides a high-level overview of your approved capacity.

### Understanding the Display

#### When It Appears

- Only visible when you have **at least one quota request** (any status)
- Hidden during **search mode**
- Always at top of page, above Quota Requests table

#### Table Columns

**Column 1: Study / Program**
- **Top line:** Study program name (e.g., "Nursing")
- **Bottom line:** Program level (e.g., "Bachelor Year 1")
- Groups all quotas for this study/program combination

**Column 2: Total**
- **Large purple number:** Sum of all **approved** quota capacity
- Does NOT include pending or rejected requests
- Represents total available positions across all approved requests

**Column 3: Distributed Quota**
- **Visual line chart** showing quota availability over time
- **X-axis:** Dates from today to one year ahead
- **Y-axis:** Number of available positions
- **Purple line:** Approved quotas
- **Orange line:** Pending quotas (in review)

### Reading the Charts

**Interactive Elements:**
- **Hover over chart:** See exact numbers for specific dates
- **Tooltip shows:** Date, Approved count, In Review count

**Chart Interpretation:**

Example chart interpretation:
\`\`\`
If you see:
- Purple line at 25 from Mar 15 to May 30
- Purple line at 15 from Jun 1 to Aug 15
- Orange line at 10 from Sep 1 to Dec 15

This means:
- 25 approved positions available Mar 15 - May 30
- 15 approved positions available Jun 1 - Aug 15
- 10 pending positions (not yet approved) Sep 1 - Dec 15
\`\`\`

**What affects the chart:**
- **Approved requests:** Show as purple line during their date range
- **Pending requests:** Show as orange line during their date range
- **Multiple overlapping requests:** Numbers stack/add up
- **Consumed quotas:** Doesn't reduce the chart (shows total approved, not remaining)

**💡 Pro Tip:** Use the chart to identify gaps in coverage. If you see no quota during certain periods, create requests to fill those gaps.

### Date Range Display

**Default Range:** Current date to one year ahead

**Display Format:** "Mar 13, 2026 - Mar 13, 2027"

**Why one year?**
- Covers typical academic year planning
- Allows advance capacity planning
- Matches common placement scheduling cycles

### Empty State

**When no quotas available:**
- Message: "No available quotas found"
- Suggestions based on context:
  - If filters active: "Try adjusting your filters"
  - If no filters: "No praksis places have offered capacity yet"

**What to do:**
- Create quota requests using "Request Quota" button
- Approve pending requests
- Adjust filters to see existing quotas

---

## Filtering and Search

### Filter Options

The capacity planning page offers powerful filtering to help you find specific quotas and requests.

#### Study Filter

**Purpose:** Filter by study program

**How to use:**
1. Click the **Study dropdown** (shows "All Studies" by default)
2. Select a specific study program
3. Page filters both Available Quotas and Quota Requests tables

**Effect:**
- Shows only quotas for selected study
- Enables the Program filter
- Updates Available Quotas charts
- Filters Quota Requests table

**Reset:** Select "All Studies" to clear filter

#### Program Filter

**Purpose:** Filter by program level within a study

**How to use:**
1. First select a Study (Program filter is disabled until study selected)
2. Click the **Program dropdown**
3. Select a specific program level

**Effect:**
- Further narrows results to specific program
- Updates all tables and charts
- Combines with study filter

**Reset:** Select "All Programs" to clear filter

**💡 Pro Tip:** Use Study + Program filters together to focus on one cohort at a time.

#### Status Filter

**Purpose:** Filter quota requests by approval status

**Options:**
- **All Statuses** (default)
- **Pending:** Awaiting approval
- **Approved:** Ready to use
- **Rejected:** Declined requests
- **Fulfilled:** Fully consumed

**How to use:**
1. Click the **Status dropdown**
2. Select desired status
3. Quota Requests table updates

**Common use cases:**
- Select "Pending" to see what needs attention
- Select "Approved" to see usable quotas
- Select "Fulfilled" to see completed assignments

### Search Functionality

**Activating Search Mode:**
1. Click the **"Search quotas and requests..."** button
2. Search input appears and expands
3. Filter dropdowns remain available
4. Available Quotas table hides (during search)

**Search Scope:**
Searches across multiple fields:
- Study program names
- Program level names
- Praksis place names
- Department names

**How to use:**
1. Type search term in the input field
2. Results filter in real-time as you type
3. Both Available Quotas and Quota Requests filter
4. Combine with filter dropdowns for precise results

**Search Examples:**
- Type "Oslo" → Shows all requests to Oslo-based institutions
- Type "Bachelor" → Shows all bachelor-level quotas
- Type "Nursing" → Shows all nursing-related requests
- Type "Cardiology" → Shows requests to cardiology departments

**Exiting Search Mode:**
1. Click the **"Close"** button (appears when search active)
2. Search input collapses back to button
3. Search term clears
4. Available Quotas table reappears
5. Filters remain as set

**💡 Pro Tip:** Use search for quick lookups by institution name. Use filters for systematic review by study program.

### Combining Filters and Search

**Power user workflow:**
1. Select **Study filter** to narrow to one program
2. Select **Program filter** to narrow to one level
3. Select **Status filter** to see only "Pending"
4. Activate **Search** and type praksis place name
5. Result: Precisely targeted list

**Reset all filters:**
- Set Study to "All Studies"
- Set Program to "All Programs"
- Set Status to "All Statuses"
- Close search if active

---

## Workflows and Best Practices

### Workflow 1: Planning Capacity for New Placement

**Scenario:** You're creating a placement for "Nursing Bachelor Year 2" in Spring 2027.

**Steps:**
1. **Access Capacity Planning page**
2. **Check existing capacity:**
   - Set Study filter to "Nursing"
   - Set Program filter to "Bachelor Year 2"
   - Review Available Quotas chart
   - Check if coverage exists for Spring 2027 period
3. **Identify gaps:**
   - Look for periods with zero or low quota
   - Note which departments already have quota
   - Calculate total students needing placement
4. **Create quota requests:**
   - Click "Request Quota" for each department needed
   - Specify Spring 2027 dates
   - Request appropriate capacity per location
5. **Submit and monitor:**
   - Track pending requests
   - Follow up with contact persons via chat
   - Approve requests (or wait for SK approval)
6. **Verify coverage:**
   - Check Available Quotas chart again
   - Confirm total capacity ≥ student count
   - Proceed to create placement task

**💡 Pro Tip:** Request quota 2-3 months in advance to allow time for approval and planning.

### Workflow 2: Monitoring Quota Consumption

**Scenario:** You have approved quotas and active placements. You want to track usage.

**Steps:**
1. **Access Capacity Planning page**
2. **Filter to relevant program:**
   - Set Study and Program filters
   - Set Status to "Approved"
3. **Review Quota Requests table:**
   - Compare **Approved** vs **Consumed** columns
   - Identify quotas nearing capacity
   - Note quotas with zero consumption
4. **Take action:**
   - If quota nearly full: Request additional capacity
   - If quota unused: Investigate why, consider reassigning students
   - If quota fully consumed: Status changes to "Fulfilled"
5. **Navigate to placement:**
   - Click arrow (→) icon on consumed quotas
   - Review which students are assigned
   - Make adjustments if needed

**💡 Pro Tip:** Check consumption regularly during active placement periods to catch capacity issues early.

### Workflow 3: Handling Rejected Requests

**Scenario:** A contact person rejected your quota request.

**Steps:**
1. **Find the rejected request:**
   - Set Status filter to "Rejected"
   - Locate the request in table
2. **Understand the reason:**
   - Review response notes (if available)
   - Click chat icon to discuss with contact
3. **Determine next steps:**
   - **Option A:** Request from different department at same institution
   - **Option B:** Request from different institution
   - **Option C:** Negotiate alternative dates or reduced capacity
4. **Create new request:**
   - Click "Request Quota"
   - Adjust parameters based on rejection reason
   - Add notes explaining changes
5. **Follow up:**
   - Monitor new request status
   - Communicate proactively with contact

**⚠️ Important:** Keep rejected requests visible in the table for record-keeping and future reference.

### Workflow 4: Annual Capacity Planning

**Scenario:** Planning quota needs for entire academic year across all programs.

**Steps:**
1. **Prepare capacity plan:**
   - List all study programs you coordinate
   - Identify student counts per program/level
   - Note placement period dates
2. **Review historical data:**
   - Check previous year's quotas (if available)
   - Identify successful praksis places
   - Note capacity changes or issues
3. **Create requests systematically:**
   - Work through one study program at a time
   - Request from proven praksis places first
   - Diversify across multiple institutions
   - Stagger placement periods if possible
4. **Batch create requests:**
   - Use "Request Quota" repeatedly
   - Create requests for Autumn semester
   - Create requests for Spring semester
   - Include buffer capacity (10-15% extra)
5. **Track approval progress:**
   - Set Status to "Pending"
   - Monitor approval rate
   - Follow up on delayed approvals
6. **Verify complete coverage:**
   - Review Available Quotas dashboard
   - Check all study programs have adequate capacity
   - Fill gaps with additional requests

**💡 Pro Tip:** Create quota requests in bulk during planning periods (June for Autumn, December for Spring).

### Best Practices

#### Quota Request Best Practices

✅ **DO:**
- Request quota well in advance (2-3 months minimum)
- Provide clear notes about student needs and expectations
- Request slightly more capacity than needed (buffer for changes)
- Maintain good relationships with contact persons
- Respond promptly to questions or concerns
- Track and monitor all requests actively
- Use consistent naming for subject (emne) fields

❌ **DON'T:**
- Request last-minute quota (except emergencies)
- Leave notes blank (provide context)
- Request excessive capacity you won't use
- Ignore pending requests without follow-up
- Create duplicate requests without checking first
- Delete approved requests (students may be assigned)

#### Communication Best Practices

✅ **DO:**
- Use chat feature to maintain conversation history
- Be professional and courteous in all communications
- Explain special requirements clearly in notes
- Thank contact persons for approvals
- Provide context when requesting changes
- Follow up on pending requests after reasonable time

❌ **DON'T:**
- Spam contact persons with repeated requests
- Use unclear or ambiguous language
- Make demands without consideration for praksis place capacity
- Ignore rejection reasons
- Change requests significantly without communication

#### Monitoring Best Practices

✅ **DO:**
- Check capacity planning page regularly (weekly minimum)
- Monitor quota consumption during active placements
- Set up regular review schedule
- Track trends across semesters
- Identify reliable praksis places for future planning
- Document successful partnerships

❌ **DON'T:**
- Ignore the page until crisis emerges
- Assume approved quotas will be automatically used
- Neglect to track which quotas are most effective
- Forget to request additional capacity when needed

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "No available quotas found"

**Possible Causes:**
1. No quota requests created yet
2. All requests still pending (not approved)
3. Active filters hiding results
4. Requests exist but for different study programs

**Solutions:**
1. Click "Request Quota" to create first request
2. Check Status filter - ensure not set to "Approved" if all are pending
3. Reset filters to "All Studies", "All Programs", "All Statuses"
4. Approve pending requests (if appropriate)

#### Issue: Can't see Program Filter options

**Cause:** No study selected in Study filter

**Solution:** 
1. First select a study program from Study filter dropdown
2. Program filter will automatically populate with options
3. Then select desired program level

#### Issue: Request created but not appearing in Available Quotas table

**Cause:** Request is still in "Pending" status

**Explanation:** 
- Available Quotas table only shows **approved** quota capacity
- Pending requests appear in orange line on chart (In Review)
- Once approved, quota moves to purple line and counts toward Total

**Solution:**
1. Check Quota Requests table - request should be there with yellow badge
2. Wait for contact person to approve
3. Or use "Approve on behalf of SK" for testing
4. After approval, quota appears in Available Quotas

#### Issue: Consumed count not updating

**Possible Causes:**
1. Students not yet assigned in placement task
2. Students assigned to different quota
3. Data not synchronized (refresh page)

**Solutions:**
1. Navigate to placement task (click arrow icon)
2. Verify students are actually assigned
3. Check that assignments reference this specific quota request ID
4. Refresh the browser page
5. Check if students assigned to overlapping quota from different request

#### Issue: Cannot delete approved request

**Cause:** System prevents deletion of approved requests to protect assignments

**Explanation:**
- Approved quotas may have students assigned
- Deleting would break assignment references
- Only pending requests can be deleted

**Solution:**
- Do not delete approved requests
- If you need to modify, contact system administrator
- Create new request with different parameters instead

---

## Quick Reference

### Key Actions

| Action | Location | Purpose |
|--------|----------|---------|
| Create Request | Purple "Request Quota" button | Submit new quota request |
| Search | "Search quotas and requests..." button | Find specific quotas |
| Filter by Study | Study dropdown | Show one study program |
| Filter by Program | Program dropdown | Show one program level |
| Filter by Status | Status dropdown | Show requests by approval status |
| Approve Request | Green checkmark (✓) | Approve pending request (demo) |
| Delete Request | Red trash (🗑️) | Remove pending request |
| Navigate to Placement | Blue arrow (→) | Jump to relevant placement task |
| Chat with Contact | Chat icon (💬) | Contact praksis place person |

### Status Meanings

| Status | Badge Color | Meaning | Actions Available |
|--------|-------------|---------|-------------------|
| Pending | Yellow 🟡 | Awaiting approval | Delete, Approve (demo), Chat |
| Approved | Green 🟢 | Ready to use | Navigate, Chat |
| Rejected | Red 🔴 | Request declined | Chat, View reason |
| Fulfilled | Blue 🔵 | Fully consumed | Navigate, View details |

### Table Columns Quick Guide

**Available Quotas Table:**
- Study / Program = What
- Total = How many approved
- Distributed Quota = When available (chart)

**Quota Requests Table:**
- Study / Program = What + subject
- Praksis Place / Department = Where
- Contact = Who to communicate with
- Requested = What you asked for
- Approved = What they gave
- Consumed = How many students assigned
- Period = When
- Status = Current state
- Actions = What you can do

---

*This user guide is part of the Student Placement Management System documentation. For technical support or questions, please contact your system administrator.*
`;

export function CapacityPlanningHelpOverlay({ isOpen, onClose }: CapacityPlanningHelpOverlayProps) {
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Capacity Planning Guide
              </h2>
              <p className="text-sm text-gray-600">
                Complete guide for managing quota requests and capacity
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
          <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-purple-600 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700">
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
                  <h3 className="text-xl font-semibold mb-3 mt-6 text-purple-600" {...props} />
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
                  <blockquote className="border-l-4 border-purple-500 bg-purple-50 pl-4 py-2 my-4 italic text-gray-700" {...props} />
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
                  <a className="text-purple-600 hover:text-purple-800 underline font-medium" {...props} />
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
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 px-4 py-3 my-3 rounded-r-lg" {...props} />
                    );
                  }
                  return <p className="mb-3 leading-relaxed" {...props} />;
                },
                // Add custom styling for strong text with special prefixes
                strong: ({ node, children, ...props }) => {
                  const text = children?.toString() || '';
                  if (text.startsWith('Step ') || text.startsWith('Method ') || text.startsWith('Status:') || text.startsWith('Workflow ')) {
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
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Close Guide
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
