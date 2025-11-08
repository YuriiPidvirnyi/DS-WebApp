# API Documentation

**DS-WebApp API Reference** - Comprehensive documentation for all API endpoints used by the Dental Story web application.

## Table of Contents

- [Overview](#overview)
- [Base Configuration](#base-configuration)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Contacts](#contacts)
  - [Appointments](#appointments)
  - [Subscriptions](#subscriptions)
  - [Reviews](#reviews)
  - [Feedback](#feedback)
- [Request/Response Schemas](#requestresponse-schemas)
- [Caching Strategy](#caching-strategy)
- [Development Mode](#development-mode)

---

## Overview

The DS-WebApp uses a REST API architecture with JSON request/response format. All API communication goes through the centralized `http` service built on Axios with built-in features:

- ✅ Automatic retries on transient errors (429, 5xx, network errors)
- ✅ Rate limiting (10 requests/minute per endpoint)
- ✅ Request caching for GET endpoints (30s TTL)
- ✅ Request correlation IDs
- ✅ Exponential backoff retry strategy
- ✅ Mock fallback for development without backend

**Base URL**: `http://localhost:3001/api` (configurable via `VITE_API_URL`)

---

## Base Configuration

### Environment Variables

```env
# Required
VITE_API_URL=http://localhost:3001/api

# Optional
VITE_SENTRY_DSN=https://...
VITE_TURNSTILE_SITE_KEY=...
```

### Timeouts

- **Request Timeout**: 10,000ms (10 seconds)
- **Retry Delays**: 250ms → 500ms → 1000ms (exponential backoff)
- **Cache TTL**: 30,000ms (30 seconds) for GET requests

---

## Authentication

Currently, authentication is optional and uses Bearer token approach:

```typescript
// Token is attached automatically if available
window.__AUTH_TOKEN__ = 'your-jwt-token'
```

**Header**:

```
Authorization: Bearer <token>
```

> **Note**: Auth implementation is placeholder. Tokens are not currently validated.

---

## Rate Limiting

### Client-Side Rate Limiting

- **Window**: 60 seconds
- **Max Requests**: 10 per endpoint per minute
- **Scope**: Per HTTP method + endpoint combination

**Example**:

- `POST /contacts`: 10 requests/minute
- `GET /appointments/slots`: 10 requests/minute (separate counter)

### Rate Limit Exceeded

When rate limit is exceeded, a `RateLimitExceededError` is thrown:

```typescript
{
  name: "RateLimitExceededError",
  message: "Rate limit exceeded for POST:http://localhost:3001/api/contacts. Retry after 30000ms.",
  retryAfter: 30000 // milliseconds
}
```

### Server-Side Rate Limiting

If the server returns `429 Too Many Requests`, the client automatically updates its rate limit window based on the `Retry-After` header.

---

## Error Handling

### Error Types

#### APIError

```typescript
class APIError extends Error {
  statusCode?: number
  code?: string
  details?: unknown
}
```

**Common Error Codes**:

| Code               | Description                       |
| ------------------ | --------------------------------- |
| `NETWORK_ERROR`    | Connection failed, check internet |
| `TIMEOUT_ERROR`    | Request took longer than 10s      |
| `VALIDATION_ERROR` | Invalid request data              |
| `RATE_LIMIT_ERROR` | Too many requests                 |
| `SERVER_ERROR`     | Server-side error (5xx)           |
| `NOT_FOUND`        | Resource not found (404)          |
| `UNAUTHORIZED`     | Authentication required (401)     |
| `FORBIDDEN`        | Insufficient permissions (403)    |

### Error Response Format

```json
{
  "success": false,
  "error": "Detailed error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "name",
    "issue": "Name must be at least 2 characters"
  }
}
```

### Retry Logic

Automatic retries occur for:

- Network errors (no response)
- 429 (rate limit - after delay)
- 5xx (server errors)

**Max Retries**: 3
**Retry Delays**: 250ms, 500ms, 1000ms

---

## Endpoints

### Contacts

#### Create Contact Request

**Endpoint**: `POST /contacts`

**Purpose**: Submit contact form inquiry

**Request Body**:

```typescript
{
  name: string // Min 2 chars, max 50 chars, letters only
  email: string // Valid email format
  phone: string // Ukrainian format: +380XXXXXXXXX
  message: string // Min 10 chars, max 1000 chars
  consent: boolean // Must be true
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "contact-1699876543210"
  },
  "message": "Contact request received successfully"
}
```

**Validation Rules**:

- `name`: `/^[a-zA-ZаА-яЯієїґІЄЇҐ\s'-]+$/`
- `email`: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- `phone`: `/^\+?380\d{9}$/`

**Error Responses**:

- `400`: Invalid request data
- `429`: Rate limit exceeded (wait 60s)
- `500`: Server error (retries automatic)

**Mock Fallback**: ✅ Returns mock ID after 600ms delay

---

### Appointments

#### Create Appointment

**Endpoint**: `POST /appointments`

**Purpose**: Book a new dental appointment

**Request Body**:

```typescript
{
  // Personal Info
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string      // ISO format: "YYYY-MM-DD"

  // Appointment Details
  service: string          // From SERVICES enum
  date: string             // ISO format: "YYYY-MM-DD"
  time: string             // HH:mm format: "14:30"
  doctor?: string          // Doctor ID or "any"

  // Additional Info (optional)
  isFirstVisit: boolean
  symptoms?: string
  medicalHistory?: string
  allergies?: string
  medications?: string
  notes?: string

  // Consent
  consent: boolean         // Must be true
  marketingConsent?: boolean
  reminderPreference?: "email" | "phone" | "both" | "none"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": "apt-1699876543210",
    "firstName": "Іван",
    "lastName": "Петренко",
    "status": "pending",
    "createdAt": "2024-11-08T22:00:00.000Z",
    ...
  },
  "message": "Appointment created successfully"
}
```

**Appointment Statuses**:

- `pending`: Awaiting confirmation
- `confirmed`: Confirmed by clinic
- `cancelled`: Cancelled by patient/clinic
- `completed`: Appointment finished
- `no-show`: Patient didn't show up

**Mock Fallback**: ✅ Returns mock appointment after 800ms delay

---

#### Get Available Slots

**Endpoint**: `GET /appointments/slots`

**Purpose**: Fetch available time slots for booking

**Query Parameters**:

```typescript
{
  date: string       // Required: "YYYY-MM-DD"
  doctorId?: string  // Optional: Filter by doctor
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]
}
```

**Cache**: ✅ Cached for 30 seconds

**Mock Fallback**: ✅ Returns 9 slots (09:00-18:00) after 500ms

---

#### Get Appointment by ID

**Endpoint**: `GET /appointments/:id`

**Purpose**: Retrieve specific appointment details

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "apt-123",
    "firstName": "Іван",
    "status": "confirmed",
    ...
  }
}
```

**Error Responses**:

- `404`: Appointment not found
- `401`: Unauthorized (if auth required)

---

#### Get All Appointments (Admin)

**Endpoint**: `GET /appointments`

**Purpose**: List all appointments (admin only)

**Query Parameters**:

```typescript
{
  status?: "pending" | "confirmed" | "cancelled" | "completed"
  date?: string        // Filter by date
  doctorId?: string    // Filter by doctor
  limit?: number       // Pagination limit
  offset?: number      // Pagination offset
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": [
    { "id": "apt-1", ... },
    { "id": "apt-2", ... }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### Update Appointment Status

**Endpoint**: `PATCH /appointments/:id/status`

**Purpose**: Change appointment status (admin only)

**Request Body**:

```json
{
  "status": "confirmed"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "apt-123",
    "status": "confirmed",
    ...
  }
}
```

---

#### Cancel Appointment

**Endpoint**: `DELETE /appointments/:id`

**Purpose**: Cancel an appointment

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Appointment cancelled successfully"
}
```

---

### Subscriptions

#### Create Newsletter Subscription

**Endpoint**: `POST /subscriptions/newsletter`

**Request Body**:

```json
{
  "email": "user@example.com",
  "consent": true
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": "sub-123",
    "email": "user@example.com"
  }
}
```

---

### Reviews

#### Submit Review

**Endpoint**: `POST /reviews`

**Request Body**:

```typescript
{
  name: string
  email?: string
  rating: number       // 1-5
  review: string       // Min 10 chars, max 1000 chars
  visitDate?: string
  wouldRecommend: boolean
  consent: boolean
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": "review-123",
    "status": "pending"
  }
}
```

#### Get Published Reviews

**Endpoint**: `GET /reviews`

**Query Parameters**:

```typescript
{
  limit?: number
  offset?: number
  rating?: number      // Filter by rating
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": "review-1",
      "name": "Марія",
      "rating": 5,
      "review": "Чудовий сервіс!",
      "createdAt": "2024-11-01T10:00:00Z"
    }
  ]
}
```

---

### Feedback

#### Submit Micro Feedback

**Endpoint**: `POST /feedback`

**Request Body**:

```json
{
  "form": "contact" | "booking" | "callback",
  "rating": 1 | 2 | 3,  // 1=bad, 2=neutral, 3=good
  "comment?: string
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": "Feedback submitted"
}
```

---

## Request/Response Schemas

### Common Types

```typescript
// Generic API Response
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Contact Request
interface ContactRequest {
  name: string
  email: string
  phone: string
  message: string
  consent: boolean
}

// Appointment
interface Appointment {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  service: string
  date: string
  time: string
  doctor?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show'
  isFirstVisit: boolean
  symptoms?: string
  medicalHistory?: string
  allergies?: string
  medications?: string
  notes?: string
  consent: boolean
  marketingConsent?: boolean
  reminderPreference?: 'email' | 'phone' | 'both' | 'none'
  createdAt: Date
  updatedAt?: Date
}
```

---

## Caching Strategy

### GET Requests

All `GET` requests are cached client-side for **30 seconds**:

```typescript
Cache-Control: max-age=30
```

**Cache Key Format**:

```
{baseURL}{endpoint}?{queryParams}
```

**Example**:

```
http://localhost:3001/api/appointments/slots?date=2024-11-15&doctorId=123
```

### Cache Invalidation

Cache is automatically cleared:

- After 30 seconds (TTL expiry)
- On page reload
- On any `POST`, `PUT`, `PATCH`, `DELETE` request to the same endpoint

### Manual Cache Clearing

```typescript
// Clear specific cache entry
cache.delete(key)

// Clear all cache
cache.clear()
```

---

## Development Mode

### Mock API Responses

When backend is unavailable, services automatically fall back to mock responses:

**Features**:

- ✅ Simulated network delays (500-800ms)
- ✅ Generates realistic IDs
- ✅ Returns proper data structures
- ✅ Helpful for frontend development

**Example**:

```typescript
// If real API fails, this runs automatically
return mockAPIResponse({ id: `contact-${Date.now()}` }, 600)
```

### Mock Error Testing

```typescript
import { mockAPIError } from '@/services/api'

// Simulate error after 1s
await mockAPIError('Something went wrong', 1000)
```

---

## Best Practices

### 1. Error Handling

Always wrap API calls in try-catch:

```typescript
try {
  const result = await createContact(data)
  // Handle success
} catch (error) {
  if (isAPIError(error)) {
    console.error(`API Error: ${error.code}`, error.message)
  }
}
```

### 2. Loading States

Show loading indicators during API calls:

```typescript
const [isSubmitting, setIsSubmitting] = useState(false)

const handleSubmit = async () => {
  setIsSubmitting(true)
  try {
    await createContact(data)
  } finally {
    setIsSubmitting(false)
  }
}
```

### 3. Rate Limiting

Handle rate limit errors gracefully:

```typescript
catch (error) {
  if (error instanceof RateLimitExceededError) {
    toast.error(`Too many requests. Please wait ${error.retryAfter / 1000}s`)
  }
}
```

### 4. Validation

Validate data before sending:

```typescript
import { contactFormSchema } from '@/utils/validationSchemas'

// Validate with Zod
const result = contactFormSchema.safeParse(formData)
if (!result.success) {
  // Handle validation errors
}
```

---

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem**: `Access-Control-Allow-Origin` error

**Solution**: Configure backend to allow origin:

```javascript
app.use(cors({ origin: 'http://localhost:3000' }))
```

#### 2. Timeout Errors

**Problem**: Request takes longer than 10s

**Solution**:

- Optimize backend performance
- Increase timeout in `http.ts`
- Check network connectivity

#### 3. Rate Limit Errors

**Problem**: Too many requests

**Solution**:

- Wait for rate limit window to reset (60s)
- Implement request debouncing/throttling
- Reduce polling frequency

#### 4. Mock Data in Production

**Problem**: Seeing mock data in production

**Solution**:

- Ensure `VITE_API_URL` is set correctly
- Check backend is running and accessible
- Verify network requests in DevTools

---

## API Versioning

Currently at **v1**. Future versions will use URL prefix:

```
/api/v1/contacts
/api/v2/contacts
```

---

## Support

For API issues:

- **GitHub Issues**: https://github.com/YuriiPidvirnyi/DS-WebApp/issues
- **Email**: dev@dentalstory.com.ua

---

**Last Updated**: 2024-11-08  
**API Version**: 1.0.0
