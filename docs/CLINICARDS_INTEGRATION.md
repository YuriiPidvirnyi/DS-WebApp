# CliniCards API Integration

## Overview

CliniCards is a CRM system for medical institutions. In the current architecture, **Supabase is the primary source of truth for appointments**. CliniCards is used only for fetching available appointment slots.

## Architecture

```
  [Booking Form]
       │
       ▼
  POST /api/appointments ──► Supabase (primary)
       │
  [Admin Panel]
       │
       ▼
  Direct Supabase queries (AdminAppointmentsPage)

  [Appointment Slots]
       │
       ▼
  GET /api/appointments/slots ──► CliniCards API
       │                             │
       ├── Redis cache               │
       └── Fallback slots ◄──────────┘ (when CliniCards unavailable)
```

### Data Flow

| Operation               | Source                          | Used By           |
| ----------------------- | ------------------------------- | ----------------- |
| **Create appointment**  | Supabase (`appointments` table) | Booking form      |
| **List appointments**   | Supabase (direct query)         | Admin panel       |
| **Update status**       | Supabase (direct query)         | Admin panel       |
| **Delete/cancel**       | Supabase (direct query)         | Admin panel       |
| **Patient view**        | Supabase (direct query)         | Patient dashboard |
| **Get available slots** | CliniCards API (with fallback)  | Booking form      |

### Key Files

| File                                  | Purpose                                         |
| ------------------------------------- | ----------------------------------------------- |
| `src/lib/clinicards-client.ts`        | Server-side CliniCards API client               |
| `app/api/appointments/route.ts`       | Create appointment (Supabase)                   |
| `app/api/appointments/slots/route.ts` | Get slots (CliniCards → Redis cache → fallback) |
| `src/services/appointments.ts`        | Client-side service layer                       |

## Configuration

```env
CLINICARDS_API_KEY=your_clinicards_api_key
CLINICARDS_API_URL=https://api.cliniccards.com/v1
```

Both variables are server-only. If not set, the system falls back to generated slots based on working hours in the database.

## Slots Caching

- Slots are cached in Redis with a TTL
- Cache key format: `slots:{doctorId}:{date}`
- Fallback: `buildFallbackSlots(date)` generates slots from `working_hours` table

## Future Considerations

- If CliniCards is decommissioned, replace `GET /api/appointments/slots` with a Supabase-based schedule system
- Optional: Add background sync from Supabase → CliniCards for CRM purposes
- The legacy CliniCards CRUD routes (`GET/PATCH/DELETE /api/appointments/[id]`) reference CliniCards but are not used by the current admin UI (which queries Supabase directly)
