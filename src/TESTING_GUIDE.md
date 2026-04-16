# Testing Guide: Auto-Import Quotas Feature

## Quick Start Testing

### Step 1: Generate Test Data
1. **Login as PK Coordinator** (default view)
2. Click **"Generate Praksis Places"** button in the top navbar
3. This creates:
   - 3 Praksis Places (Oslo University Hospital, Bergen Health Center, Trondheim Mental Health)
   - Multiple departments with supervisors
   - Active contracts

**Note**: The button now **ONLY creates praksis places**. Quota offerings must be created manually by SK persons.

### Step 2: Create Quota Offerings (SK Person)
1. **Switch to SK role** in the navbar
2. Navigate to **"Quota Management"** in sidebar
3. Click **"+ Create Quota Offering"** button
4. Fill in the form to create quota offerings for testing
5. Create offerings that match study programs (e.g., Nursing, Physiotherapy)

### Step 3: Switch Back to PK Role
1. Switch back to **PK role** in navbar
2. Navigate to **"Placements"** view

### Step 4: Create New Placement
1. Click **"+ Create New Placement"** button
2. You'll see the **Placement Details** form (Step 1/6)

### Step 5: Fill in Placement Details
Fill in the form:
- **Study**: Select "Helse-, sosial og idrettsfag"
- **Study Program**: Select "Nursing"
- **Placement title**: "Spring 2026 Nursing Placement"
- **Start Date**: "2026-03-01"
- **End Date**: "2026-05-30"
- **Year**: "2026"
- **Semester**: "Spring"
- **Subject**: "Clinical Nursing"
- **Number of Students**: 50

### Step 6: Save and Watch the Magic! ✨
1. Click **"Save and Continue"** button
2. **Observe**:
   - Toast notification appears: "Auto-imported 2 quota(s)"
   - Description shows the study/program name
   - Page transitions to main Step 1/6 view
   - **Green Alert** appears at top of Quotas section:
     - Title: "Quotas Auto-Imported"
     - Message: "2 quota offering(s) were automatically imported based on your placement details. You can review and adjust them below."
   - **Quota Overview table** shows 2 auto-imported quotas:
     - Oslo University Hospital - Emergency Department (5 quotas)
     - Bergen Community Health Center - Primary Care (3 quotas)

### Step 7: Review and Adjust (Optional)
- View the auto-imported quotas in the table
- Adjust quantities if needed
- Add more quotas manually via "Select/Request Quota" button
- Delete unwanted quotas

## Test Scenarios

### Scenario A: Match Found (Success)
**Input**:
- Study: "Helse-, sosial og idrettsfag"
- Program: "Nursing"
- Dates: 2026-03-01 to 2026-05-30

**Expected**:
- ✅ 2 quotas imported
- ✅ Green alert shown
- ✅ Toast notification
- ✅ Quotas visible in table

### Scenario B: Different Program
**Input**:
- Study: "Helse-, sosial og idrettsfag"
- Program: "Physiotherapy"
- Dates: 2026-03-01 to 2026-05-30

**Expected**:
- ✅ 1 quota imported (Pediatrics - Physiotherapy)
- ✅ Green alert shown
- ✅ Toast notification

### Scenario C: No Date Overlap
**Input**:
- Study: "Helse-, sosial og idrettsfag"
- Program: "Nursing"
- Dates: 2026-08-01 to 2026-10-30 (future dates)

**Expected**:
- ✅ 0 quotas imported
- ✅ No alert shown
- ✅ No toast
- ✅ Empty state shown

### Scenario D: No Matching Offerings
**Input**:
- Study: Create a new custom study in Settings
- Program: Custom program
- Any dates

**Expected**:
- ✅ 0 quotas imported
- ✅ No errors
- ✅ User can manually add quotas

## Visual Indicators

### Success Toast
```
┌─────────────────────────────────────┐
│ ✓ Auto-imported 2 quota(s)          │
│   Found 2 matching quota offering(s)│
│   for Helse-, sosial og idrettsfag / │
│   Nursing                            │
└─────────────────────────────────────┘
```

### Green Alert (in Quotas section)
```
┌────────────────────────────────────────────┐
│ ✓ Quotas Auto-Imported                     │
│                                             │
│ 2 quota offering(s) were automatically     │
│ imported based on your placement details.  │
│ You can review and adjust them below.      │
└────────────────────────────────────────────┘
```

### Quota Table
```
Quota Overview                    [Columns ▼] [Select/Request Quota]

┌──────────────────────────────────────────────────────────────────┐
│ Praksis Place                 │ Department    │ Fixed │ Request  │
├──────────────────────────────────────────────────────────────────┤
│ Oslo University Hospital      │ Emergency...  │ 5     │ 0        │
│ Bergen Community Health Ctr   │ Primary Care  │ 3     │ 0        │
└──────────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Issue: No quotas imported
**Check**:
1. Did you click "Generate Praksis Places" first?
2. Is the study/program combination correct?
3. Do the dates overlap with offering dates?
4. Try dates between 2026-02-01 and 2026-07-15

### Issue: Wrong quotas imported
**Verify**:
- Study and Program selections match the offerings
- Dates overlap with offering periods

### Issue: No green alert shown
**Possible reasons**:
- No quotas were auto-imported (no matches found)
- This is expected behavior when no matches exist

### Issue: Duplicates created
**Should not happen** - duplicate prevention is built-in. If you see this:
1. Check the quota table
2. Report as a bug with steps to reproduce

## Manual Testing Checklist

- [ ] Generate mock data creates praksis places
- [ ] SK person creates quota offerings
- [ ] Creating placement with matching study/program imports quotas
- [ ] Toast notification appears with correct count
- [ ] Green alert appears when quotas imported
- [ ] Quota table shows imported quotas
- [ ] Fixed quota values match offering capacity
- [ ] Request quota is initially 0
- [ ] No quotas imported for non-matching study/program
- [ ] No quotas imported for non-overlapping dates
- [ ] Can manually add more quotas after auto-import
- [ ] Can delete auto-imported quotas
- [ ] Can adjust quota quantities
- [ ] Re-saving placement doesn't create duplicates

## Developer Console Logs

Check browser console for:
```
Auto-imported 2 quotas for placement draft-xxxxx
```

This confirms the function executed successfully.

## Next Steps After Testing

If testing is successful:
1. ✅ Mark feature as complete
2. 📝 Document in user manual
3. 🎓 Create training materials
4. 🚀 Deploy to production

---

**Need Help?** Check `/IMPLEMENTATION_COMPLETE.md` for technical details.