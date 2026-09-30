# Store Management System - Backend

## Tech Stack
- **Node.js** + **Express.js** - REST API
- **Supabase** (PostgreSQL) - Database

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
copy .env.example .env
```

Edit `.env`:
```
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
FRONTEND_URL=http://localhost:5173
```

### 3. Setup Database
Go to your **Supabase Dashboard** → **SQL Editor** and run the contents of `schema.sql`.

### 4. Start the Server
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| **Categories** | | |
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |
| **Staff** | | |
| GET | `/api/staff` | Get all staff |
| POST | `/api/staff` | Create staff |
| PUT | `/api/staff/:id` | Update staff |
| DELETE | `/api/staff/:id` | Delete staff |
| **Item Master** | | |
| GET | `/api/items` | Get all items (supports `?search=&category=`) |
| GET | `/api/items/:code` | Get item by code |
| POST | `/api/items` | Create item |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |
| **Stock In** | | |
| GET | `/api/stock-in` | Get all stock in entries (supports filters) |
| POST | `/api/stock-in` | Add stock in entry |
| PUT | `/api/stock-in/:id` | Update entry |
| DELETE | `/api/stock-in/:id` | Delete entry |
| **Stock Out** | | |
| GET | `/api/stock-out` | Get all stock out entries (supports filters) |
| POST | `/api/stock-out` | Add stock out entry |
| PUT | `/api/stock-out/:id` | Update entry |
| DELETE | `/api/stock-out/:id` | Delete entry |
| **Current Stock** | | |
| GET | `/api/current-stock` | Get current stock summary |
| GET | `/api/current-stock/dashboard` | Get dashboard stats |

---

## Folder Structure
```
backend/
├── src/
│   ├── index.js              # Main server entry
│   ├── config/
│   │   └── supabase.js       # Supabase client
│   ├── controllers/
│   │   ├── categoryController.js
│   │   ├── staffController.js
│   │   ├── itemController.js
│   │   ├── stockInController.js
│   │   ├── stockOutController.js
│   │   └── stockController.js
│   └── routes/
│       ├── categoryRoutes.js
│       ├── staffRoutes.js
│       ├── itemRoutes.js
│       ├── stockInRoutes.js
│       ├── stockOutRoutes.js
│       └── stockRoutes.js
├── schema.sql                # Full database schema + seed data
├── .env.example              # Environment variables template
└── package.json
```
