# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (from `/backend` directory)
```bash
# Install dependencies
npm install

# Run in development mode (auto-restart on changes)
npm run dev

# Run in production mode
npm start

# Fix missing dates in database
npm run fix-dates
```

### Frontend (from `/frontend` directory)
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to production
# Frontend is auto-deployed by Netlify when pushing to git main branch
git add .
git commit -m "your commit message"
git push origin main
```

### Running Full Application Locally
1. Start backend (Terminal 1):
   ```bash
   cd backend && npm run dev
   ```
2. Start frontend (Terminal 2):
   ```bash
   cd frontend && npm run dev
   ```
3. Access at `http://localhost:3000`

## Architecture Overview

### Technology Stack
- **Backend**: Node.js + Express + Firestore + JWT Auth
- **Frontend**: Vanilla JavaScript with component pattern + Mobile-first UI
- **Database**: Google Firestore (NoSQL)
- **Deployment**: 
  - Backend: Google Cloud Run (run `gcloud run deploy fantopark-backend --source . --region=us-central1` from backend directory)
  - Frontend: Netlify (auto-deploys on push to main branch)
- **Integrations**: Meta/Facebook API, Google Cloud Storage

### Key Architecture Patterns

1. **API Structure**: RESTful endpoints under `/api/*` with JWT middleware
   - All authenticated routes require `Bearer token` in Authorization header
   - Response format: `{ success: boolean, data/error: ... }`

2. **Frontend State Management**:
   - Global state via `window.appState`
   - Components return HTML strings (no React/Vue)
   - Client-side routing with `content-router.js`
   - Mobile gestures handled by dedicated components

3. **Database Collections**:
   - `crm_users`, `crm_leads`, `crm_inventory`, `crm_orders`, `crm_invoices`
   - All timestamps stored in IST (UTC+5:30)
   - Soft deletes via `isDeleted` field

4. **Component Pattern** (Frontend):
   ```javascript
   async function ComponentName(data) {
     return `<div class="component">${content}</div>`;
   }
   ```

5. **Role-Based Access**:
   - Roles: admin, manager, sales_rep, viewer
   - Permissions checked in middleware and frontend
   - Role hierarchy enforced throughout

### Critical Implementation Notes

1. **Timezone Handling**: ALL dates/times are in IST (Indian Standard Time)
   - Use `moment-timezone` with 'Asia/Kolkata' for all date operations
   - Frontend displays assume IST; no client timezone conversion
   - See `backend/IST_TIMESTAMP_CHANGES.md` for detailed implementation

2. **Lead Management**:
   - Leads have journey stages with IST timestamps
   - Assignment rules auto-assign leads based on criteria
   - Facebook webhook integration for real-time lead capture

3. **Inventory System**:
   - Categories have allocations by sales rep
   - Real-time availability tracking
   - Multi-currency support with exchange rates

4. **Mobile Optimization**:
   - Touch gestures for card swiping
   - Responsive components with mobile-specific versions
   - PWA capabilities with offline support

5. **Caching Strategy**:
   - Facebook forms cached for 15 minutes
   - Node-cache for frequently accessed data
   - Frontend polls for updates (no WebSocket)

### Common Development Tasks

- **Adding New API Endpoint**: Create route in `backend/src/routes/`, add middleware for auth
- **Adding New Component**: Create in `frontend/public/components/`, follow existing patterns
- **Database Migration**: Create script in `backend/src/scripts/`, handle IST conversion
- **Adding New Collection**: Update Firestore rules, create model in `backend/src/models/`

### Recent Features

#### Bulk Payment Upload (Added 2025-07-24)
- **Location**: Financials → Bulk Payment Upload tab
- **Access**: Super Admin, Finance Managers, Supply Sales Service Manager
- **Features**:
  - CSV upload for bulk payment processing
  - Support for multiple invoices per payment
  - Automatic order creation for paid leads
  - Validation with detailed error reporting
  - Upload history tracking
  - Sample data download for testing
- **Implementation**:
  - Backend: `/api/bulk-payments/*` endpoints
  - Frontend: `components/bulk-payment-upload.js` (v1.2 with React hooks fix)
  - Service: `backend/src/services/bulkPaymentService.js`
- **CSV Format**: lead_id, payment_date (DD-MM-YYYY), amount, payment_mode, reference_number, notes

### Environment Variables

Backend requires `.env` with:
- Firebase service account credentials
- JWT secret
- Meta/Facebook API tokens
- Google Cloud project ID

Frontend `.env.example` shows required variables:
- `VITE_API_URL` (default: http://localhost:8080/api)

### Testing & Debugging

- No automated tests currently implemented
- Use browser DevTools for frontend debugging
- Backend logs to console; check Cloud Run logs in production
- Common issues: IST timezone mismatches, permission errors, cache invalidation

## CRITICAL: Frontend Component Patterns

### ⚠️ DO NOT USE React Hooks in Modal/Component Functions

The frontend uses a specific pattern where components are rendered outside of React's component tree. **NEVER use useState, useEffect, or any React hooks** in these components as they will cause React error #310.

#### ❌ WRONG Pattern (causes React error #310):
```javascript
window.renderMyModal = () => {
  const [isOpen, setIsOpen] = useState(false); // ❌ WILL CRASH
  const [data, setData] = useState(null);      // ❌ WILL CRASH
  
  useEffect(() => {                            // ❌ WILL CRASH
    // effect code
  }, []);
}
```

#### ✅ CORRECT Pattern (use window state):
```javascript
// Initialize state object
window.myModalState = window.myModalState || {
  showModal: false,
  data: null,
  loading: false
};

// Global functions to manage state
window.openMyModal = () => {
  window.myModalState.showModal = true;
  window.myModalState.data = null;
  if (window.renderApp) window.renderApp();
};

window.closeMyModal = () => {
  window.myModalState.showModal = false;
  if (window.renderApp) window.renderApp();
};

// Render function just reads state
window.renderMyModal = () => {
  const state = window.myModalState;
  if (!state.showModal) return null;
  
  return React.createElement('div', { /* props */ },
    // modal content
  );
};
```

### State Management Rules:
1. **Use window objects** for state: `window.myComponentState = { ... }`
2. **Call window.renderApp()** after state changes to trigger re-render
3. **Event handlers** should be global functions: `window.handleMyAction = () => { ... }`
4. **Check existing components** for patterns (e.g., allocation-management.js, inventory.js)
5. **Never use hooks** - the components are called directly, not within React's render tree