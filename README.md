# URLKit - URL Shortener with Analytics Dashboard

A full-stack URL shortener with real-time analytics, QR code generation, and a modern dashboard built with React and Django.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Tech Stack](https://img.shields.io/badge/Django-4.2-092E20?logo=django) ![Tech Stack](https://img.shields.io/badge/MongoDB-4.8-47A248?logo=mongodb) ![Tech Stack](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript) ![Tech Stack](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss)

## Features

- **URL Shortening** — Base62 encoding (62^6 = 56 billion unique codes) with custom alias support
- **Real-Time Analytics** — Clicks over time, browser/device/OS breakdown, top referrers
- **QR Code Generation** — 4 styles (rounded, square, circle, gapped) with custom colors
- **Expiry Support** — Optional expiration dates for short URLs
- **Async Click Tracking** — Background thread logging with zero redirect latency impact

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + TailwindCSS + Recharts |
| Backend | Django 4.2 + Django REST Framework |
| Database | MongoDB (via PyMongo) |
| QR Codes | Python `qrcode` library with styled output |

## Architecture Highlights

### Base62 Encoding
Generates short, URL-safe, human-readable codes using `[a-zA-Z0-9]`. Includes collision detection with retry logic.

### Atomic Click Counting
Uses MongoDB `$inc` operator for thread-safe click counting — no read-modify-write cycle, handles concurrent clicks correctly.

### Async Analytics (Non-Blocking)
Redirect completes in <5ms. Detailed click data (browser, OS, device, referrer) is logged in a background thread using fire-and-forget pattern.

### MongoDB Aggregation Pipelines
Real-time analytics powered by native MongoDB aggregation (`$group`, `$sort`, `$limit`) — no separate analytics database needed.

### Optimized Indexes
```python
db.urls.create_index("short_code", unique=True)
db.clicks.create_index([("short_code", ASCENDING), ("clicked_at", ASCENDING)])
```
Compound indexes achieve sub-10ms query times without Redis.

## Project Structure

```
URLKit/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── urlkit/              # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── api/                 # Core application
│       ├── mongo.py         # MongoDB connection + indexes
│       ├── services.py      # Base62, QR, analytics, click tracking
│       ├── views.py         # API endpoints + redirect
│       └── urls.py
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── api.ts           # API client + types
│       └── components/
│           ├── ShortenForm.tsx
│           ├── URLList.tsx
│           ├── Analytics.tsx
│           └── QRCodeModal.tsx
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/shorten/` | Create short URL |
| `GET` | `/api/urls/` | List all URLs |
| `GET` | `/api/urls/<code>/analytics/` | Detailed analytics |
| `GET` | `/api/urls/<code>/qr/` | Generate QR code |
| `DELETE` | `/api/urls/<code>/` | Delete URL |
| `GET` | `/<code>/` | Redirect to original URL |

### POST /api/shorten/

```json
{
  "url": "https://example.com/very-long-url",
  "custom_alias": "my-link",
  "expires_at": "2025-12-31T23:59:59"
}
```

### GET /api/urls/\<code\>/qr/

Query params: `fill` (hex color), `bg` (hex color), `style` (rounded|square|circle|gapped)

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB running on `localhost:27017`

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

### Environment Variables (optional)

Create `backend/.env`:

```env
DJANGO_SECRET_KEY=your-secret-key
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=urlkit
BASE_URL=http://localhost:8000
DEBUG=True
```

## Screenshots

### URL Shortening
Paste a URL, optionally set a custom alias and expiry, click Shorten.

### Analytics Dashboard
View clicks over time (line chart), browser distribution (pie chart), device breakdown, OS stats, and top referrers.

### QR Code Generator
Generate QR codes with 4 module styles and custom fill/background colors. Download as PNG.
