# IST Timestamp Implementation Summary

## Overview
Implemented consistent IST (Indian Standard Time) handling across all lead creation methods and date filters to fix the issue where leads created after 6:30 PM IST were being counted in the next day.

## Changes Made

### 1. Core Date Utility Functions (`src/utils/dateHelpers.js`)
- **convertToIST()**: Converts any date format to UTC ISO string (preserving original UTC time)
- **formatDateForQuery()**: Handles IST timezone boundaries for date range queries
- **getISTDateString()**: Extracts IST date (YYYY-MM-DD) from UTC timestamp
- **isOnISTDate()**: Checks if a UTC timestamp falls on a specific IST date
- **displayInIST()**: Formats UTC timestamp for IST display

### 2. Lead Model (`src/models/Lead.js`)
- Updated to use `convertToIST()` for:
  - `date_of_enquiry`
  - `created_date`
  - `updated_date`
  - `client_last_activity`

### 3. Webhook Integration (`src/routes/webhooks.js`)
- Updated to use `convertToIST()` for `date_of_enquiry` when processing Meta/Facebook leads
- Fixed debug endpoint to use IST for date filtering

### 4. Bulk Upload (`src/routes/upload.js`)
- Updated `parseDate()` function to use `convertToIST()`
- All dates from CSV/Excel files now properly converted to UTC with IST awareness
- Updated metadata timestamps (`created_date`, `updated_date`, `import_date`)

### 5. Website Leads Import (`src/services/leadMappingService.js`)
- Added `date_of_enquiry` field with IST conversion
- Updated all timestamp fields to use `convertToIST()`

### 6. Manual Lead Creation (`src/routes/leads.js`)
- Updated auto-assignment date to use `convertToIST()`
- Updated client activity tracking to use IST

### 7. Date Filtering Updates
- **Marketing Route** (`src/routes/marketing.js`): Updated to use `formatDateForQuery()` for IST-aware date filtering
- **Sales Performance** (`src/routes/sales-performance.js`): Updated date filtering for orders
- **Webhooks Debug** (`src/routes/webhooks.js`): Updated cutoff date calculation

## Key Concepts

1. **Storage Format**: All timestamps are stored as UTC ISO strings in the database
2. **IST Awareness**: Date queries and display logic account for IST timezone (+5:30 from UTC)
3. **Date Boundaries**: 
   - Start of July 21 in IST = July 20 18:30:00 UTC
   - End of July 21 in IST = July 21 18:29:59 UTC

## Testing

Created `test-ist-timestamps.js` to verify:
- Date conversion functions work correctly
- July 21 leads created after 6:30 PM IST are correctly attributed to July 21
- Various date formats (Meta webhook, CSV, manual entry) are handled properly

## Result

The marketing report now correctly shows:
- Leads created on July 21 after 6:30 PM IST are counted as July 21 leads
- Date filters properly handle IST timezone boundaries
- All lead creation methods consistently use IST-aware timestamps