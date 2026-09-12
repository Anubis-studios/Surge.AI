# Surge.AI — Backend API Documentation

Complete backend implementation for the Surge.AI supplier passthrough system.

## 📁 Structure

```
backend/
├── lib/
│   ├── supabaseClient.ts      # Supabase admin client
│   ├── auth.ts                # Authentication helpers
│   └── supplierClient.ts      # Video supplier integration
└── pages/api/
    ├── billing/
    │   └── status.ts          # GET /api/billing/status
    ├── videos/
    │   └── recent.ts          # GET /api/videos/recent
    ├── images/
    │   └── recent.ts          # GET /api/images/recent
    ├── render.ts              # POST /api/render
    └── supplier/
        └── callback.ts        # POST /api/supplier/callback
```

## 🔌 API Endpoints

### 1. GET /api/billing/status

Returns current billing status for the authenticated user.

**Response:**
```json
{
  "surge_coins": 25,
  "surge_bucks": 150,
  "login_streak": 3,
  "last_login": "2024-01-15"
}
```

**Used by:** Dashboard, Image Studio, Video Engine, Billing

---

### 2. GET /api/videos/recent

Returns recent videos for the Video Engine gallery.

**Query Parameters:**
- `limit` (optional): Number of videos to return (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": "vid_123",
    "tenant_id": "tenant_001",
    "owner_profile_id": "user_001",
    "status": "completed",
    "supplier": "primary",
    "input_prompt": "A cinematic sunset",
    "input_assets": {},
    "output_url": "https://storage.example.com/video.mp4",
    "metadata": {
      "duration": "4s",
      "resolution": "1080p",
      "fps": 24
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:30Z"
  }
]
```

**Used by:** Video Engine page

---

### 3. GET /api/images/recent

Returns recent images for the Image Studio gallery.

**Query Parameters:**
- `limit` (optional): Number of images to return (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": "img_123",
    "tenant_id": "tenant_001",
    "owner_profile_id": "user_001",
    "prompt": "A beautiful sunset",
    "params": {
      "style": "photorealistic",
      "width": 1024,
      "height": 1024
    },
    "output_url": "https://storage.example.com/image.png",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

**Used by:** Image Studio page

---

### 4. POST /api/render

Initiates video generation via supplier passthrough.

**Request Body:**
```json
{
  "prompt": "A cinematic sunset over the ocean",
  "assets": {
    "scenes": ["wide shot", "close-up"],
    "style": "cinematic"
  }
}
```

**Response (202 Accepted):**
```json
{
  "status": "queued",
  "job_id": "job_123",
  "remaining_bucks": 147,
  "estimated_time": 30
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication
- `400 Bad Request`: Invalid prompt
- `402 Payment Required`: Insufficient Surge Bucks
- `500 Internal Server Error`: Failed to create render job

**Flow:**
1. Authenticate user
2. Validate prompt
3. Check Surge Bucks balance
4. Deduct 3 Surge Bucks (atomic)
5. Create render job in database
6. Submit to supplier (async)
7. Return job ID immediately

**Used by:** Video Engine page

---

### 5. POST /api/supplier/callback

Receives completion notifications from video supplier.

**Request Body:**
```json
{
  "job_id": "job_123",
  "status": "completed",
  "output_url": "https://storage.example.com/video.mp4",
  "metadata": {
    "duration": "4s",
    "resolution": "1080p",
    "fps": 24,
    "file_size": 15728640
  },
  "signature": "hmac_signature_here"
}
```

**Response:**
```json
{
  "received": true
}
```

**Flow:**
1. Validate callback signature
2. Find render job by ID
3. Update render job status
4. If completed, create video record
5. Return success

**Used by:** External supplier API

---

## 🔧 Library Files

### supabaseClient.ts

Supabase admin client with service role key (bypasses RLS).

**Exports:**
- `supabaseAdmin`: Supabase client instance
- `getBillingByTenant(tenantId)`: Fetch billing account
- `getProfileByUserId(userId)`: Fetch user profile
- `getRecentVideos(tenantId, limit)`: Fetch recent videos
- `getRecentImages(tenantId, limit)`: Fetch recent images

### auth.ts

Authentication helpers for extracting user from requests.

**Exports:**
- `getUserFromRequest(req)`: Extract authenticated user
- `withAuth(handler)`: Middleware wrapper for protected routes

**Supports:**
- Bearer token in Authorization header
- Cookie-based session (sb-access-token)

### supplierClient.ts

Video supplier integration with retry logic and fallback suppliers.

**Exports:**
- `submitRenderJob(request)`: Submit render job to supplier
- `handleSupplierCallback(callback)`: Process supplier callback
- `getSupplierStatus()`: Check supplier health

**Features:**
- Primary supplier with 3 retries
- 2 fallback suppliers
- Exponential backoff
- Webhook signature verification
- Health monitoring

---

## 🔐 Authentication

All endpoints (except `/api/supplier/callback`) require authentication.

**Methods:**
1. **Bearer Token**: `Authorization: Bearer <token>`
2. **Cookie**: `sb-access-token=<token>`

**User Object:**
```typescript
interface AuthUser {
  id: string;
  email: string;
  tenant_id: string;
  display_name: string;
}
```

---

## 💰 Currency Operations

### Atomic Deductions

All currency deductions use Supabase RPC functions for atomicity:

```sql
-- Deduct Surge Coins
SELECT deduct_surge_coins(p_tenant_id, p_amount);

-- Deduct Surge Bucks
SELECT deduct_surge_bucks(p_tenant_id, p_amount);
```

**Returns:** `boolean` (true if successful, false if insufficient funds)

### Atomic Additions

```sql
-- Add Surge Coins
SELECT add_surge_coins(p_tenant_id, p_amount);

-- Add Surge Bucks
SELECT add_surge_bucks(p_tenant_id, p_amount);
```

---

## 🎥 Supplier Passthrough Architecture

```
┌──────────────┐
│   Frontend   │
│ Video Engine │
└──────┬───────┘
       │ POST /api/render
       ▼
┌──────────────┐
│  Next.js API │
│  /api/render │
└──────┬───────┘
       │ 1. Deduct 3 bucks
       │ 2. Create render_job
       │ 3. Submit to supplier
       ▼
┌──────────────┐
│   Supplier   │
│  (Primary)   │
└──────┬───────┘
       │ Fallback if fails
       ▼
┌──────────────┐
│  Supplier A  │
│  (Fallback)  │
└──────┬───────┘
       │ Fallback if fails
       ▼
┌──────────────┐
│  Supplier B  │
│  (Fallback)  │
└──────┬───────┘
       │ POST /api/supplier/callback
       ▼
┌──────────────┐
│  Next.js API │
│   Callback   │
└──────┬───────┘
       │ 1. Verify signature
       │ 2. Update render_job
       │ 3. Create video record
       ▼
┌──────────────┐
│   Frontend   │
│  Poll status │
└──────────────┘
```

---

## 🌍 Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# App
APP_URL=https://surge.ai

# Video Supplier (Primary)
SUPPLIER_API_URL=https://api.supplier.com/v1
SUPPLIER_API_KEY=your-primary-key
SUPPLIER_WEBHOOK_SECRET=your-webhook-secret

# Video Supplier (Fallback A)
SUPPLIER_FALLBACK_A_URL=https://api.fallback-a.com/v1
SUPPLIER_FALLBACK_A_KEY=your-fallback-a-key

# Video Supplier (Fallback B)
SUPPLIER_FALLBACK_B_URL=https://api.fallback-b.com/v1
SUPPLIER_FALLBACK_B_KEY=your-fallback-b-key

# Costs
VIDEO_COST_BUCKS=3
```

---

## 🚀 Deployment

### Next.js Configuration

```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
```

### Required Dependencies

```bash
npm install @supabase/supabase-js
```

### Database Setup

Run the Supabase migration:
```bash
psql $DATABASE_URL < scripts/supabase-migration.sql
```

---

## 🧪 Testing

### Manual Testing

```bash
# Get billing status
curl -H "Authorization: Bearer $TOKEN" \
  https://surge.ai/api/billing/status

# Get recent videos
curl -H "Authorization: Bearer $TOKEN" \
  "https://surge.ai/api/videos/recent?limit=10"

# Submit render job
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A cinematic sunset"}' \
  https://surge.ai/api/render
```

---

## 📊 Monitoring

### Supplier Health Check

```typescript
import { getSupplierStatus } from '@/lib/supplierClient';

const status = await getSupplierStatus();
console.log(status);
// {
//   primary: { name: 'primary', healthy: true },
//   fallbacks: [
//     { name: 'fallback-a', healthy: true },
//     { name: 'fallback-b', healthy: false }
//   ]
// }
```

### Error Tracking

All errors are logged with context:
- Authentication failures
- Insufficient funds
- Supplier submission failures
- Callback handling errors

---

## 🔒 Security

### Webhook Signature Verification

All supplier callbacks include HMAC signatures:

```typescript
const isValid = verifyWebhookSignature(callback);
if (!isValid) {
  return res.status(400).json({ error: 'invalid_signature' });
}
```

### Rate Limiting

Implement rate limiting on `/api/render`:
- Max 10 requests per minute per user
- Prevents abuse and supplier overload

### Input Validation

All endpoints validate:
- Authentication tokens
- Request body structure
- Prompt length (max 1000 chars)
- Asset URLs (must be HTTPS)

---

## 📝 Notes

- **Never expose service role key** in frontend code
- **Always use atomic operations** for currency changes
- **Implement retry logic** for supplier calls
- **Log all errors** with full context
- **Monitor supplier health** and switch to fallbacks
- **Verify webhook signatures** before processing callbacks

---

**Status:** ✅ Complete and production-ready
