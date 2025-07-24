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

# Deploy to Google Cloud Run
npm run deploy
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
- **Deployment**: Google Cloud Run (backend) + Firebase/Vercel (frontend)
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