# Architecture Research: AI-Powered Salla Dropshipping Store Builder

**Domain:** Salla eCommerce App + AI Store Builder
**Researched:** 2026-01-21
**Confidence:** HIGH

## Executive Summary

A Salla dropshipping store builder requires a **microservices architecture** with clear separation between Salla integration, product scraping, AI processing, and store generation. The system follows an **event-driven, queue-based pattern** where user actions trigger async jobs that flow through specialized services, culminating in store deployment via Salla APIs.

**Key architectural decisions:**
- **Webhook-driven Salla integration** using OAuth 2.0 and event subscriptions
- **Async job queue architecture** (BullMQ + Redis) for long-running operations
- **Separate microservices** for scraping, AI content, AI images
- **RESTful API** for external AI service integration
- **Database-backed job tracking** with Redis for queue management

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                              │
│                    (Web App / Salla Dashboard)                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SALLA APP CORE (Node.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ OAuth Handler│  │ Webhook      │  │ Salla API Client         │  │
│  │ (14-day      │  │ Receiver     │  │ (Products, Themes,       │  │
│  │ token)       │  │ (Signature   │  │ Store Config)            │  │
│  └──────────────┘  │ Verification)│  └──────────────────────────┘  │
│                    └──────────────┘                                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    JOB QUEUE (BullMQ + Redis)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Scrape Queue │  │ AI Content   │  │ AI Image Queue           │  │
│  │              │  │ Queue        │  │ (4 images/product)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Theme Queue  │  │ Landing Page │  │ Store Deploy Queue       │  │
│  │              │  │ Queue        │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                ┌────────────┴────────────┬───────────────┐
                ▼                         ▼               ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────┐
│  SCRAPING SERVICE    │  │   AI SERVICE         │  │ STORE GEN    │
│  (Python/Node.js)    │  │   (Node.js)          │  │ (Node.js)    │
│                      │  │                      │  │              │
│  - AliExpress        │  │  - Content Gen API   │  │ - Theme      │
│  - Amazon            │  │  - Image Enhance API │  │   Builder    │
│  - Proxy Rotation    │  │  - Prompt Templates  │  │ - Landing    │
│  - Retry Logic       │  │  - Batch Processing  │  │   Page Gen   │
│  - Dead Letter Queue │  │                      │  │ - Salla API  │
└──────────────────────┘  └──────────────────────┘  │   Deploy     │
                                                     └──────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BILLING SERVICE (Stripe)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Webhook      │  │ Subscription │  │ Usage Tracking           │  │
│  │ Handler      │  │ Manager      │  │ (stores created, AI gen) │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (PostgreSQL)                           │
│  - Merchants (OAuth tokens, refresh tokens)                          │
│  - Jobs (status, progress, results)                                  │
│  - Stores (config, theme settings, products)                         │
│  - Subscriptions (plans, usage limits)                               │
│  - Products (scraped data, AI content, images)                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Boundaries

### 1. Salla App Core

**Responsibility:** OAuth flow, webhook handling, Salla API communication, job orchestration

**Technologies:**
- Node.js + Express.js (Salla Express Starter Kit as foundation)
- Salla OAuth2 Client library
- Webhook signature verification (SHA256)

**Communicates With:**
- Salla Platform (OAuth, Webhooks, Merchant API)
- Job Queue (enqueues work)
- Database (stores merchant tokens, job status)
- Billing Service (subscription validation)

**Key Endpoints:**
```
POST /auth/callback          # OAuth callback URL
POST /webhooks/salla         # Webhook receiver (signature verified)
POST /api/store/create       # User-facing store creation endpoint
GET  /api/store/status/:id   # Check store creation progress
POST /api/product/add        # Add product to store queue
```

**Integration Points:**
- **Salla OAuth:** 14-day access token + refresh token (1-month validity)
- **Salla Webhooks:** Subscribe to `app.store.authorize`, `app.installed`, `order.created` events
- **Salla Merchant API:** Base URL `https://api.salla.dev/admin/v2`

**Configuration:**
- Client ID & Secret from Salla Partners Portal
- Webhook signature secret for verification
- OAuth scopes: `read:products`, `write:products`, `read:themes`, `write:themes`, `read:store`, `write:store`

---

### 2. Job Queue (BullMQ + Redis)

**Responsibility:** Async job management, retry logic, priority handling, progress tracking

**Technologies:**
- BullMQ (Node.js job queue library)
- Redis (job storage and state management)
- Neon Postgres (job audit log and results storage)

**Queue Types:**

| Queue Name | Purpose | Priority | Concurrency | Retry |
|------------|---------|----------|-------------|-------|
| `scrape` | Product URL scraping | High | 5 | 3x with 5min delay |
| `ai-content` | Generate product descriptions | Medium | 10 | 2x with 2min delay |
| `ai-image` | Enhance 4 images per product | Medium | 8 | 2x with 2min delay |
| `theme` | Configure Salla theme | Low | 2 | 3x with 5min delay |
| `landing` | Generate landing page | Low | 2 | 3x with 5min delay |
| `deploy` | Deploy to Salla store | Critical | 1 | 5x with 10min delay |

**Features:**
- Delayed jobs (schedule for later)
- Job prioritization (express vs standard)
- Dead letter queue for failed jobs
- Progress reporting (0-100%)
- Job chaining (scrape → AI content → AI image → deploy)

**Communicates With:**
- All services (produces and consumes jobs)
- Database (persists job results)

---

### 3. Scraping Service

**Responsibility:** Extract product data from AliExpress, Amazon, other platforms

**Technologies:**
- Python + Scrapy (for complex scraping) OR Node.js + Puppeteer (for JS-heavy sites)
- aiohttp + asyncio (async HTTP requests for 10-20x performance)
- Bright Data OR Oxylabs (proxy rotation for enterprise scraping)
- Docker containers (isolated scraping environments)

**Scraping Targets:**

| Platform | Data Extracted | Complexity | Notes |
|----------|----------------|------------|-------|
| AliExpress | Title, price, images (4+), description, variants, shipping | High | JS-rendered, requires Puppeteer |
| Amazon | Title, price, images (4+), description, reviews, Q&A | High | Anti-bot protection, proxy required |
| Other | Configurable per platform | Variable | Extensible architecture |

**Architecture Pattern:**
```
Input: Product URL + Platform
  ↓
Detect platform (regex matching)
  ↓
Select scraper strategy (Scrapy vs Puppeteer)
  ↓
Execute scrape with proxy rotation
  ↓
Parse HTML/JSON response
  ↓
Extract structured data
  ↓
On failure → Dead letter queue (retry with different proxy)
  ↓
On success → Return structured product data
```

**Data Output:**
```json
{
  "url": "https://aliexpress.com/item/123",
  "title": "Original product title",
  "price": 29.99,
  "currency": "USD",
  "images": ["url1", "url2", "url3", "url4"],
  "description": "Raw HTML description",
  "variants": [{"size": "M", "color": "Red", "price": 29.99}],
  "shipping": {"method": "Standard", "cost": 5.99, "days": "10-20"}
}
```

**Communicates With:**
- Job Queue (consumes scrape jobs, produces AI jobs)
- Database (stores raw scraped data)

**Scaling Strategy:**
- Kubernetes autoscaling based on queue depth
- Separate containers per platform (AliExpress, Amazon)
- Proxy pool with health checks

---

### 4. AI Service

**Responsibility:** Generate AI content, enhance images, optimize for MENA market

**Technologies:**
- Node.js + Express (API wrapper)
- OpenAI API / Anthropic Claude (content generation)
- Deep-Image.ai OR Claid.ai (image enhancement APIs)
- Runware API (if multi-model approach needed)

**Sub-Components:**

#### 4a. Content Generator
**Purpose:** Generate Arabic + English product descriptions optimized for SEO

**API Integration:**
```javascript
// Prompt Template
const prompt = `
You are writing product descriptions for a MENA ecommerce store.
Product: ${title}
Original Description: ${description}
Requirements:
- Generate Arabic and English versions
- SEO optimized (keywords: ${keywords})
- Persuasive, conversion-focused
- 150-200 words
- Highlight benefits, not just features
- Include call-to-action
`;
```

**Batch Processing:**
- Process 10 products concurrently (API rate limits)
- Cache common descriptions (similar products)
- Fallback to original if API fails

#### 4b. Image Enhancer
**Purpose:** Upscale and enhance 4 product images per product

**API Integration:**
```javascript
// Deep-Image.ai pattern (MEDIUM confidence - from WebSearch)
POST /image
  → Upload image, get image_id
GET /image/{image_id}
  → Check processing status
GET /image/{image_id}/enhanced
  → Retrieve enhanced image URL (S3 signed URL)
```

**Processing:**
- Queue 4 images per product in parallel
- 10-second avg processing time per image
- Download enhanced images and upload to Salla CDN
- Fallback to original if enhancement fails

**Communicates With:**
- Job Queue (consumes AI jobs)
- Database (stores AI-generated content)
- External APIs (OpenAI, Deep-Image.ai)

**Rate Limiting:**
- OpenAI: 3,500 requests/min (Tier 2)
- Image APIs: Variable (check provider limits)
- Implement exponential backoff

---

### 5. Store Generator

**Responsibility:** Create landing page, configure theme, deploy to Salla

**Technologies:**
- Node.js
- Salla Twilight SDK (theme customization)
- Salla Merchant API (product creation, theme config)
- Twig templates (landing page generation)

**Sub-Components:**

#### 5a. Theme Configurator
**Purpose:** Customize Salla theme based on product niche

**Twilight Integration:**
- Use Salla CLI to scaffold theme
- Customize `twilight.json` with brand colors, fonts
- Inject custom CSS via theme settings
- Deploy theme via Salla Partners Portal API

**Theme Components:**
```
/themes/ai-dropship-theme/
  ├── twilight.json          # Theme config
  ├── assets/
  │   ├── styles.css         # Custom styles
  │   └── scripts.js         # Custom JS
  ├── views/
  │   ├── home.twig          # Landing page template
  │   ├── product.twig       # Product page template
  │   └── components/        # Reusable components
  └── locales/
      ├── ar.json            # Arabic translations
      └── en.json            # English translations
```

#### 5b. Landing Page Generator
**Purpose:** Generate AI-powered landing page with product showcase

**Generation Flow:**
```
Input: Store niche + Products
  ↓
AI generates landing page copy (headline, benefits, CTA)
  ↓
Populate Twig template with content
  ↓
Inject product cards (images, titles, prices)
  ↓
Configure theme settings (colors, fonts)
  ↓
Deploy via Salla Twilight API
```

#### 5c. Salla Deployment
**Purpose:** Create products, configure store, activate theme

**API Calls:**
```javascript
// 1. Create products
POST /admin/v2/products
{
  "name": {"ar": "...", "en": "..."},
  "description": {"ar": "...", "en": "..."},
  "price": 29.99,
  "images": ["url1", "url2", "url3", "url4"],
  "quantity": 999
}

// 2. Configure theme
POST /admin/v2/store/theme
{
  "theme_id": "twilight-ai-dropship",
  "settings": {
    "primary_color": "#FF6B6B",
    "font_family": "Cairo"
  }
}

// 3. Update store settings
PUT /admin/v2/store
{
  "name": {"ar": "...", "en": "..."},
  "description": {"ar": "...", "en": "..."}
}
```

**Communicates With:**
- Job Queue (consumes deploy jobs)
- Salla API (creates products, configures theme)
- Database (marks store as deployed)

---

### 6. Billing Service

**Responsibility:** Subscription management, usage tracking, payment processing

**Technologies:**
- Node.js + Express
- Stripe (subscription billing)
- Webhook processing (background jobs)

**Subscription Plans:**

| Plan | Stores | AI Generations | Price/Month |
|------|--------|----------------|-------------|
| Starter | 1 | 50 products | $29 |
| Pro | 5 | 200 products | $79 |
| Enterprise | Unlimited | Unlimited | $199 |

**Stripe Integration:**
```javascript
// Webhook events
stripe.webhooks.on('customer.subscription.created', async (event) => {
  // Activate merchant account
});

stripe.webhooks.on('customer.subscription.deleted', async (event) => {
  // Deactivate merchant, disable store creation
});

stripe.webhooks.on('invoice.payment_failed', async (event) => {
  // Send payment reminder, grace period
});
```

**Usage Tracking:**
- Increment counter on store creation
- Increment counter on AI generation
- Check limits before job processing
- Webhook to Stripe for metered billing (if applicable)

**Communicates With:**
- Salla App Core (validates subscription before job creation)
- Database (stores subscription status)
- Stripe API (creates subscriptions, processes payments)

---

### 7. Data Layer (PostgreSQL)

**Responsibility:** Persistent storage for all system data

**Schema:**

```sql
-- Merchants (Salla store owners)
CREATE TABLE merchants (
  id UUID PRIMARY KEY,
  salla_merchant_id VARCHAR(255) UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  subscription_status VARCHAR(50), -- active, inactive, trial
  subscription_plan VARCHAR(50),   -- starter, pro, enterprise
  stores_created INT DEFAULT 0,
  ai_generations_used INT DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Jobs (async task tracking)
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  type VARCHAR(50),           -- scrape, ai-content, ai-image, deploy
  status VARCHAR(50),         -- pending, processing, completed, failed
  progress INT DEFAULT 0,     -- 0-100
  input JSONB,                -- Job input data
  output JSONB,               -- Job result data
  error TEXT,                 -- Error message if failed
  retry_count INT DEFAULT 0,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Stores (generated dropshipping stores)
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  salla_store_id VARCHAR(255),
  name JSONB,                 -- {"ar": "...", "en": "..."}
  theme_id VARCHAR(255),
  landing_page_url TEXT,
  status VARCHAR(50),         -- draft, deployed, active
  created_at TIMESTAMP,
  deployed_at TIMESTAMP
);

-- Products (scraped + AI-enhanced products)
CREATE TABLE products (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  source_url TEXT,
  source_platform VARCHAR(50), -- aliexpress, amazon
  original_data JSONB,         -- Raw scraped data
  ai_content JSONB,            -- AI-generated descriptions
  enhanced_images JSONB,       -- URLs of enhanced images
  salla_product_id VARCHAR(255),
  status VARCHAR(50),          -- scraped, enhanced, deployed
  created_at TIMESTAMP
);

-- Subscriptions (Stripe sync)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  plan VARCHAR(50),
  status VARCHAR(50),
  current_period_end TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_merchants_salla_id ON merchants(salla_merchant_id);
CREATE INDEX idx_jobs_merchant_status ON jobs(merchant_id, status);
CREATE INDEX idx_stores_merchant ON stores(merchant_id);
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_subscriptions_merchant ON subscriptions(merchant_id);
```

---

## Data Flow

### Primary Flow: User Pastes Product URL → Store Created

```
Step 1: USER INITIATES
  User pastes product URL (AliExpress/Amazon)
  ↓
  POST /api/store/create
  {
    "product_url": "https://aliexpress.com/item/123",
    "store_name": {"ar": "متجر المنتجات", "en": "Products Store"},
    "theme": "modern",
    "merchant_id": "uuid"
  }

Step 2: VALIDATION
  Salla App Core validates:
  ✓ Merchant has active subscription
  ✓ Merchant hasn't exceeded store limit
  ✓ Product URL is valid and supported
  ↓
  Create job chain in database
  Return job_id to user

Step 3: SCRAPE PRODUCT
  Job Queue → Scraping Service
  ↓
  Scraping Service:
  - Detects platform (AliExpress)
  - Launches Puppeteer with proxy
  - Extracts: title, price, 4 images, description, variants
  - Stores raw data in products table
  - Marks job as "completed"
  ↓
  Triggers next job: AI Content Generation

Step 4: GENERATE AI CONTENT
  Job Queue → AI Service (Content Generator)
  ↓
  AI Service:
  - Fetches scraped product data
  - Generates Arabic + English descriptions via OpenAI API
  - Optimizes for SEO keywords
  - Stores AI content in products table
  - Marks job as "completed"
  ↓
  Triggers next job: AI Image Enhancement

Step 5: ENHANCE IMAGES (PARALLEL)
  Job Queue → AI Service (Image Enhancer)
  ↓
  AI Service:
  - Fetches 4 product images
  - Submits to Deep-Image.ai API (parallel processing)
  - Polls for completion (10s avg per image)
  - Downloads enhanced images
  - Uploads to Salla CDN
  - Stores enhanced image URLs in products table
  - Marks job as "completed"
  ↓
  Triggers next job: Theme Configuration

Step 6: CONFIGURE THEME
  Job Queue → Store Generator (Theme Configurator)
  ↓
  Store Generator:
  - Generates theme based on product niche
  - Customizes colors, fonts, layout
  - Creates twilight.json config
  - Deploys theme to Salla (via CLI or API)
  - Stores theme_id in stores table
  - Marks job as "completed"
  ↓
  Triggers next job: Landing Page Generation

Step 7: GENERATE LANDING PAGE
  Job Queue → Store Generator (Landing Page Generator)
  ↓
  Store Generator:
  - Generates landing page copy via OpenAI API
  - Populates Twig template with product data
  - Configures product cards (images, titles, prices)
  - Updates theme with landing page content
  - Marks job as "completed"
  ↓
  Triggers next job: Deploy to Salla

Step 8: DEPLOY TO SALLA
  Job Queue → Store Generator (Salla Deployment)
  ↓
  Store Generator:
  - Creates product via Salla API
    POST /admin/v2/products
    {
      "name": {"ar": "...", "en": "..."},
      "description": {"ar": "...", "en": "..."},
      "price": 29.99,
      "images": ["enhanced1", "enhanced2", "enhanced3", "enhanced4"]
    }
  - Activates theme
  - Updates store settings
  - Marks store as "deployed" in database
  - Marks job as "completed"
  ↓
  Sends webhook to user (or notification)

Step 9: BILLING UPDATE
  Store Generator → Billing Service
  ↓
  Billing Service:
  - Increments stores_created counter
  - Increments ai_generations_used counter
  - Checks if limits exceeded
  - Sends usage event to Stripe (if metered billing)

Step 10: USER NOTIFICATION
  Salla App Core → User
  ↓
  Send notification:
  - Email: "Your store is ready!"
  - Webhook: POST to user's callback URL
  - In-app notification
  ↓
  User accesses store: https://merchant-store.salla.sa
```

**Total Time Estimate:**
- Scraping: 30-60 seconds
- AI Content: 10-20 seconds
- AI Images: 40-80 seconds (4 images × 10s each)
- Theme Config: 10-20 seconds
- Landing Page: 15-30 seconds
- Deploy: 20-40 seconds
**TOTAL: 2-4 minutes**

---

## Salla Integration Points

### 1. OAuth 2.0 Authorization

**Flow:**
```
User installs app from Salla App Store
  ↓
Salla redirects to app with authorization code
  ↓
App exchanges code for access token
POST https://oauth.salla.dev/oauth2/token
{
  "grant_type": "authorization_code",
  "client_id": "...",
  "client_secret": "...",
  "code": "...",
  "redirect_uri": "..."
}
  ↓
Response:
{
  "access_token": "...",   // Valid for 14 days
  "refresh_token": "...",  // Valid for 1 month
  "expires_in": 1209600,   // 14 days in seconds
  "token_type": "Bearer"
}
  ↓
Store tokens in database (merchants table)
```

**Token Refresh:**
```
Before token expires (14 days):
POST https://oauth.salla.dev/oauth2/token
{
  "grant_type": "refresh_token",
  "client_id": "...",
  "client_secret": "...",
  "refresh_token": "..."
}
  ↓
Update access_token and token_expires_at in database
```

**Required Scopes:**
```
offline_access           // For refresh tokens
read:products
write:products
read:themes
write:themes
read:store
write:store
read:orders              // For order fulfillment (future)
write:orders
```

---

### 2. Merchant API (RESTful)

**Base URL:** `https://api.salla.dev/admin/v2`

**Authentication:**
```
Authorization: Bearer {access_token}
```

**Key Endpoints:**

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/products` | POST | Create product | 60/min |
| `/products/{id}` | PUT | Update product | 60/min |
| `/products` | GET | List products | 100/min |
| `/store` | GET | Get store info | 100/min |
| `/store` | PUT | Update store settings | 30/min |
| `/store/theme` | POST | Configure theme | 30/min |
| `/webhooks` | POST | Register webhook | 10/min |

**Error Handling:**
- 401 Unauthorized → Refresh token
- 429 Too Many Requests → Exponential backoff
- 5xx Server Error → Retry with backoff

---

### 3. Webhooks

**Registration:**
```
POST https://api.salla.dev/admin/v2/webhooks
{
  "name": "Store Authorization",
  "event": "app.store.authorize",
  "url": "https://yourapp.com/webhooks/salla",
  "version": 2,
  "security_strategy": "signature"
}
```

**Webhook Verification:**
```javascript
const crypto = require('crypto');

function verifyWebhook(req, secret) {
  const signature = req.headers['x-salla-signature'];
  const payload = JSON.stringify(req.body);
  const hash = crypto.createHmac('sha256', secret)
                     .update(payload)
                     .digest('hex');

  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hash)
  );
}
```

**Critical Events:**

| Event | When Triggered | Action |
|-------|---------------|--------|
| `app.store.authorize` | Merchant authorizes app | Store access token |
| `app.installed` | App installed | Initialize merchant account |
| `app.subscription.upgraded` | Subscription plan changed | Update limits |
| `order.created` | New order placed | Process order (future) |
| `product.updated` | Product modified | Sync changes (future) |

**Retry Logic:**
- Salla retries 3 times at 5-minute intervals
- Return 200 OK quickly, process async

---

### 4. Twilight (Theme Engine)

**Twilight Components:**
- **Twilight SDK:** JavaScript library for storefront interactions
- **Salla CLI:** Command-line tool for theme development
- **Partners Portal:** Web interface for theme management
- **GitHub Integration:** Version control for theme files

**Theme Structure:**
```
/themes/ai-dropship-theme/
  ├── twilight.json          # Theme metadata and settings
  ├── assets/
  │   ├── styles.css
  │   └── app.js
  ├── views/
  │   ├── home.twig          # Landing page
  │   ├── product.twig       # Product page
  │   ├── layouts/
  │   │   └── master.twig
  │   └── components/
  │       ├── header.twig
  │       ├── product-card.twig
  │       └── footer.twig
  └── locales/
      ├── ar.json
      └── en.json
```

**Twilight SDK Usage:**
```javascript
// Auto-initialized in Twilight themes
salla.cart.addItem({
  product_id: 123,
  quantity: 1
});

salla.cart.event.onItemAdded((response) => {
  console.log('Item added:', response);
});

// Get store configuration
const storeName = salla.config.get('store.name');
const currency = salla.config.get('store.currency');
```

**Theme Deployment:**
```bash
# Via Salla CLI
salla theme create ai-dropship-theme
salla theme push
salla theme publish

# OR via API (programmatic)
POST /admin/v2/store/theme
{
  "theme_id": "ai-dropship-theme",
  "settings": {
    "primary_color": "#FF6B6B",
    "font_family": "Cairo",
    "logo_url": "https://cdn.salla.sa/logo.png"
  }
}
```

---

## Suggested Build Order

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Establish Salla integration and core infrastructure

1. **Salla App Core**
   - Set up Salla Partners account
   - Create app in Partners Portal
   - Implement OAuth 2.0 flow (authorization + token refresh)
   - Create webhook receiver with signature verification
   - Store merchant data in PostgreSQL

2. **Database Schema**
   - Set up PostgreSQL (Neon for serverless option)
   - Create tables: merchants, jobs, stores, products, subscriptions
   - Set up indexes

3. **Job Queue Infrastructure**
   - Set up Redis instance
   - Implement BullMQ queues (scrape, ai-content, ai-image, deploy)
   - Create basic job processing pattern
   - Implement retry logic and dead letter queue

**Validation:** Merchant can install app, authorize OAuth, tokens stored correctly

**Dependencies:** None (greenfield)

---

### Phase 2: Scraping (Weeks 3-4)
**Goal:** Extract product data from AliExpress and Amazon

4. **Scraping Service**
   - Implement platform detection (URL regex)
   - Build AliExpress scraper (Puppeteer + proxies)
   - Build Amazon scraper (Puppeteer + proxies)
   - Set up proxy rotation (Bright Data or Oxylabs)
   - Implement error handling and retry logic
   - Store scraped data in database

**Validation:** Given product URL, scraper extracts title, price, 4 images, description

**Dependencies:** Phase 1 (Job Queue)

---

### Phase 3: AI Content Generation (Weeks 5-6)
**Goal:** Generate Arabic + English descriptions and enhance images

5. **AI Content Service**
   - Integrate OpenAI API (GPT-4 for content generation)
   - Create prompt templates for MENA market
   - Implement batch processing (10 concurrent requests)
   - Cache common descriptions

6. **AI Image Service**
   - Integrate Deep-Image.ai or Claid.ai API
   - Implement parallel image processing (4 images/product)
   - Upload enhanced images to Salla CDN
   - Handle API rate limits and failures

**Validation:** Scraped product → AI-generated descriptions + enhanced images

**Dependencies:** Phase 2 (Scraping)

---

### Phase 4: Store Generation (Weeks 7-9)
**Goal:** Create landing pages and deploy to Salla

7. **Theme Configurator**
   - Create base Twilight theme (twilight.json + templates)
   - Implement theme customization (colors, fonts, layout)
   - Deploy theme via Salla CLI or API

8. **Landing Page Generator**
   - Create Twig templates for landing page
   - Implement AI-powered landing page copy generation
   - Populate product cards with scraped + AI data
   - Integrate Twilight SDK for dynamic content

9. **Salla Deployment**
   - Implement product creation via Merchant API
   - Implement theme activation
   - Implement store settings configuration
   - Handle API rate limits and errors

**Validation:** Product URL → Complete store with landing page deployed to Salla

**Dependencies:** Phase 3 (AI Services)

---

### Phase 5: Billing (Weeks 10-11)
**Goal:** Subscription management and usage tracking

10. **Billing Service**
    - Integrate Stripe (subscription plans)
    - Implement webhook handling (subscription events)
    - Create usage tracking (stores created, AI generations)
    - Implement subscription validation before job processing

**Validation:** Users can subscribe, limits enforced, Stripe webhooks processed

**Dependencies:** Phase 4 (Store Generation complete for testing billing)

---

### Phase 6: Polish & Optimization (Weeks 12-14)
**Goal:** Production-ready system with monitoring

11. **Monitoring & Observability**
    - Set up logging (Winston or Pino)
    - Implement metrics (Prometheus + Grafana)
    - Set up error tracking (Sentry)
    - Create admin dashboard (job status, metrics)

12. **Performance Optimization**
    - Optimize scraping (connection pooling, caching)
    - Optimize AI services (batch processing, caching)
    - Optimize database queries (indexes, connection pooling)
    - Implement CDN for static assets

13. **Testing & QA**
    - Unit tests (Jest)
    - Integration tests (Salla API mocks)
    - E2E tests (Playwright)
    - Load testing (k6)

**Validation:** System handles 100 concurrent store creations, <5% error rate

**Dependencies:** All previous phases

---

## Architecture Patterns to Follow

### 1. Microservices with Bounded Contexts
**Pattern:** Each service owns its domain logic and data
**Why:** Enables independent scaling, deployment, and technology choices
**Example:** Scraping Service can use Python while AI Service uses Node.js

### 2. Event-Driven Architecture
**Pattern:** Services communicate via job queue events, not direct calls
**Why:** Decouples services, enables async processing, natural retry mechanism
**Example:** Scrape completes → publishes event → AI service consumes

### 3. Saga Pattern for Distributed Transactions
**Pattern:** Job chain (scrape → AI → deploy) with compensating actions
**Why:** Ensures data consistency across services without distributed transactions
**Example:** If deploy fails, mark job as failed, notify user, don't retry infinitely

### 4. API Gateway Pattern
**Pattern:** Single entry point (Salla App Core) routes to services
**Why:** Centralized authentication, rate limiting, request validation
**Example:** All external requests go through Salla App Core, which validates subscription

### 5. Retry with Exponential Backoff
**Pattern:** Failed jobs retry with increasing delays (5min, 10min, 20min)
**Why:** Prevents thundering herd, gives external services time to recover
**Example:** Scraping fails → retry after 5min → retry after 10min → dead letter queue

### 6. Circuit Breaker for External APIs
**Pattern:** Stop calling failing external API after threshold, retry after cooldown
**Why:** Prevents cascading failures, protects system from external service outages
**Example:** If OpenAI API fails 5 times in 1 minute, circuit opens, requests fail fast

### 7. Database per Service (with Shared Database for MVP)
**Pattern:** Each service has its own schema, potential separate DB later
**Why:** Service independence, easier to scale and optimize per service
**Example:** Scraping Service has `products` table, Billing has `subscriptions` table

### 8. Idempotent Operations
**Pattern:** Repeated job execution produces same result, no duplicates
**Why:** Safe retries, handles network failures gracefully
**Example:** Product creation checks if `salla_product_id` exists before creating

---

## Anti-Patterns to Avoid

### 1. Synchronous Processing
**Problem:** User waits for entire scrape → AI → deploy flow (2-4 minutes)
**Why bad:** Poor UX, timeouts, no visibility into progress
**Instead:** Async job queue with progress updates, webhook notification on completion

### 2. Tight Coupling Between Services
**Problem:** Scraping Service directly calls AI Service, then Deploy Service
**Why bad:** Services can't scale independently, failures cascade
**Instead:** Job queue decouples services, each consumes and produces jobs

### 3. No Retry Logic
**Problem:** External API fails once → entire store creation fails
**Why bad:** High failure rate, poor user experience
**Instead:** Implement exponential backoff retries, dead letter queue for manual review

### 4. Storing Access Tokens Insecurely
**Problem:** Salla access tokens stored in plaintext, no encryption
**Why bad:** Token theft = unauthorized access to merchant stores
**Instead:** Encrypt tokens at rest (AES-256), use secure key management (AWS KMS)

### 5. Ignoring Rate Limits
**Problem:** Hammering Salla API without respecting 60 req/min limit
**Why bad:** 429 errors, account suspension, poor system reliability
**Instead:** Implement rate limiter (Redis-backed), queue requests, exponential backoff

### 6. Single Point of Failure
**Problem:** One Redis instance for job queue, no failover
**Why bad:** Redis crashes → entire system stops processing jobs
**Instead:** Redis cluster with replication, or managed Redis (AWS ElastiCache)

### 7. No Dead Letter Queue
**Problem:** Failed jobs retry infinitely, clog the queue
**Why bad:** Wastes resources, blocks other jobs, no visibility into persistent failures
**Instead:** After 3-5 retries, move to dead letter queue for manual review

### 8. Hardcoded Configuration
**Problem:** API keys, URLs, limits hardcoded in source code
**Why bad:** Can't change config without redeployment, security risk
**Instead:** Environment variables, secret management (AWS Secrets Manager, Vault)

### 9. No Monitoring or Observability
**Problem:** No logs, metrics, or alerts when things break
**Why bad:** Can't diagnose issues, slow incident response
**Instead:** Structured logging, metrics (job duration, success rate), alerts (Slack, PagerDuty)

### 10. Blocking on External APIs
**Problem:** Waiting synchronously for OpenAI API response (10-20 seconds)
**Why bad:** Ties up worker threads, reduces throughput
**Instead:** Async/await pattern, non-blocking I/O, separate worker processes

---

## Scalability Considerations

| Concern | At 10 Users | At 1,000 Users | At 10,000 Users |
|---------|-------------|----------------|-----------------|
| **Job Queue** | Single Redis instance | Redis cluster (3 nodes) | Managed Redis (AWS ElastiCache) + partitioning |
| **Scraping** | 2 workers, shared proxies | 10 workers, proxy pool (100 IPs) | 50+ workers, enterprise proxy (Bright Data) |
| **AI Content** | Sequential processing | Batch processing (10 concurrent) | Dedicated AI service cluster, caching |
| **AI Images** | 1 API account | Multiple API accounts (load balance) | Enterprise API plan, parallel processing |
| **Database** | Single PostgreSQL instance | Read replicas (2x) | Sharding by merchant_id, connection pooling |
| **Salla API** | 60 req/min limit | Request queuing, rate limiter | Multiple app instances, distributed rate limiter |
| **Deployment** | Single server (Docker Compose) | Kubernetes cluster (3 nodes) | Auto-scaling Kubernetes, multi-region |

---

## Technology Stack Recommendation

| Layer | Technology | Why | Confidence |
|-------|------------|-----|------------|
| **Salla Integration** | Salla Express Starter Kit + OAuth2 Client | Official starter kit, production-ready patterns | HIGH |
| **Backend** | Node.js + Express | JavaScript ecosystem, async I/O, Salla SDK support | HIGH |
| **Job Queue** | BullMQ + Redis | Modern, TypeScript-based, active development (2026) | HIGH |
| **Scraping** | Puppeteer + Bright Data | JS-heavy sites, enterprise proxy solution | HIGH |
| **AI Content** | OpenAI API (GPT-4) | Best multilingual support, Arabic quality | HIGH |
| **AI Images** | Deep-Image.ai OR Claid.ai | API parity, product photo optimization | MEDIUM |
| **Database** | PostgreSQL (Neon) | Relational data, serverless option, JSON support | HIGH |
| **Billing** | Stripe | Standard SaaS billing, webhook support | HIGH |
| **Monitoring** | Sentry + Prometheus + Grafana | Error tracking + metrics + dashboards | HIGH |
| **Hosting** | AWS / DigitalOcean / Render | Depends on budget and scale requirements | HIGH |

---

## Sources

### Salla Official Documentation
- [Salla Docs - Get Started](https://docs.salla.dev/421117m0)
- [Salla Webhooks Documentation](https://docs.salla.dev/421119m0)
- [Salla Authorization - OAuth 2.0](https://docs.salla.dev/421118m0)
- [Create Your First App - Salla Docs](https://docs.salla.dev/439059m0)
- [Salla Express Starter Kit - GitHub](https://github.com/SallaApp/express-starter-kit)
- [Twilight Theme Engine - Salla Docs](https://docs.salla.dev/422053m0)
- [Twilight JS SDK Overview](https://docs.salla.dev/422610m0)

### Architecture & Patterns
- [Ecommerce Architecture in 2026 - BigCommerce](https://www.bigcommerce.com/articles/ecommerce-website-development/ecommerce-architecture/)
- [Medusa - Ecommerce Architecture: Design and Types](https://medusajs.com/blog/ecommerce-architecture/)
- [Enterprise Web Scraping Architecture (2026)](https://affinco.com/enterprise-web-scraping/)

### Job Queues & Background Processing
- [BullMQ Official Documentation](https://bullmq.io/)
- [How to Build a Job Queue in Node.js with BullMQ and Redis (2026)](https://oneuptime.com/blog/post/2026-01-06-nodejs-job-queue-bullmq-redis/view)
- [Building Scalable Job Queues with BullMQ - Medium](https://medium.com/@sanipatel0401/building-scalable-job-queues-with-bullmq-a-complete-guide-with-image-processing-example-88c58b550cb8)

### AI & Image Enhancement
- [Best AI Image Enhancer APIs for Developers (2026)](https://letsenhance.io/blog/all/best-image-enhancer-apis/)
- [Deep-Image.ai - Image Enhancement API](https://deep-image.ai/about-api)
- [Building a Highly Scalable API for AI Image Enhancement](https://autoenhance.ai/blog/building-a-highly-scalable-api-for-ai-image-enhancement)

### Subscription Billing
- [Stripe Documentation - Using Webhooks with Subscriptions](https://docs.stripe.com/billing/subscriptions/webhooks)
- [SaaS Credits System Guide 2026](https://colorwhistle.com/saas-credits-system-guide/)
- [Best Subscription Billing Software for SaaS (2026)](https://blog.alguna.com/subscription-billing-software/)

### Dropshipping & Product Scraping
- [Top 10 AI Dropshipping Tools for 2026 - Shopify](https://www.shopify.com/blog/ai-dropshipping)
- [GitHub - nadinev6/dropship (AI-powered product research app)](https://github.com/nadinev6/dropship)
