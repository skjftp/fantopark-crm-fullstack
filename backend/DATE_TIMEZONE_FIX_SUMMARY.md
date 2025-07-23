# Date Timezone Fix Summary

## Issue Identified

1. **Discrepancy in Lead Counts**: Firebase shows 27 Instagram leads for July 22nd, but Marketing Performance shows 36 leads.

2. **Root Cause**: The Marketing Performance page uses `formatDateForQuery` which converts IST dates to UTC boundaries:
   - July 22 IST (00:00:00 to 23:59:59) becomes July 21 18:30:00 UTC to July 22 18:29:59 UTC
   - This UTC range includes some leads from late July 21st IST (after midnight IST but before midnight UTC)

3. **Data Inconsistency**: Some leads have `date_of_enquiry` values that are:
   - In different formats (some UTC with Z, some without)
   - Sometimes matching `created_date`, sometimes not
   - Sometimes stored as IST time but marked as UTC

## How Different Sources Set date_of_enquiry

1. **Manual Lead Creation (Frontend Form)**:
   - Uses HTML date input (YYYY-MM-DD format)
   - Backend Lead model converts using `convertToIST()` → Returns UTC ISO string

2. **Bulk Upload**:
   - Uses `parseDate()` function to handle various date formats
   - Calls `convertToIST()` → Returns UTC ISO string

3. **Webhook (Instagram/Facebook)**:
   - Uses `convertToIST()` with Meta's created_time
   - Returns UTC ISO string

4. **Website Direct**:
   - Should also use Lead model which calls `convertToIST()`

## Solution Implemented

### 1. Created Analysis Script
- `/frontend/public/analyze-july22-discrepancy.js` - Analyzes the specific discrepancy
- Shows exactly which leads are causing the count difference

### 2. Created Fix Script
- `/frontend/public/fix-date-of-enquiry-timezone.js` - Fixes timezone issues
- Can be run with dry run first to see what will be changed
- Fixes leads from July 23 onwards

### 3. Backend Code Review
- All sources correctly use `convertToIST()` which returns UTC ISO strings
- The function name is misleading but the implementation is correct

## How to Run the Fix

1. **Open Firebase Console** in your browser

2. **Run the analysis first**:
   ```javascript
   // Load the script
   const script = document.createElement('script');
   script.src = '/analyze-july22-discrepancy.js';
   document.head.appendChild(script);
   
   // After loading, run:
   analyzeJuly22Discrepancy();
   ```

3. **Run the fix script**:
   ```javascript
   // Load the fix script
   const script2 = document.createElement('script');
   script2.src = '/fix-date-of-enquiry-timezone.js';
   document.head.appendChild(script2);
   
   // After loading, run dry run first:
   fixDateOfEnquiryTimezone("2025-07-23", true);
   
   // If looks good, apply the fix:
   fixDateOfEnquiryTimezone("2025-07-23", false);
   
   // Verify the fix worked:
   verifyJuly22Counts();
   ```

## Expected Results

After running the fix:
1. All `date_of_enquiry` values will be in proper UTC ISO format
2. Firebase query and Marketing Performance query should show the same counts
3. Date filtering will work consistently across the application

## Important Notes

1. The `convertToIST` function name is misleading - it actually converts to UTC, not IST
2. All dates are stored as UTC in the database
3. The UI displays them in IST using timezone conversion
4. The discrepancy is due to timezone boundary differences in queries, not incorrect data storage

## Preventive Measures

1. Ensure all new lead creation paths use the Lead model
2. The Lead model automatically handles date conversion
3. No need to change the existing code - it's working correctly
4. The fix script will clean up any historical data issues