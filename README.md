# 🍔 FoodFlash — Food Ordering Platform

<div align="center">

**A full-stack single-restaurant food ordering platform built as a DBMS Mini Project**

*Covers ER modeling, SQL transactions, NoSQL caching, vector databases & RAG — all four syllabus units in one project.*

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Razorpay](https://img.shields.io/badge/Razorpay-Test_Mode-0C2451?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database Design](#-database-design)
- [Getting Started](#-getting-started)
- [Running the Backend](#-running-the-backend)
- [Running the Frontend](#-running-the-frontend)
- [Quick Start (One Command)](#-quick-start-one-command)
- [API Reference](#-api-reference)
- [DBMS Concepts Demonstrated](#-dbms-concepts-demonstrated)
- [Project Structure](#-project-structure)
- [Team](#-team)

---

## 🎯 About the Project

**FoodFlash** is a single-restaurant food ordering and management platform. Built as a DBMS mini project for SY IoT Semester 4, it demonstrates mastery of database concepts across all four syllabus units:

| Unit | Concept | Implementation |
|------|---------|---------------|
| **Unit I** | ER Modeling, Relational Schema, Normalization | 6-table normalized schema with full ER diagram |
| **Unit II** | SQL (DDL/DML/DCL), Joins, Transactions | Complex queries, stored procedures, ACID-compliant order processing |
| **Unit III** | NoSQL, Key-Value Stores | Redis for cart management and menu caching |
| **Unit IV** | Vector Databases, Embeddings, RAG | ChromaDB + Gemini AI chatbot for intelligent menu search |

---

## ✨ Features

### 👤 Customer Features
- **Smart Menu Search** — Filter by category, price range, veg/non-veg, and keyword search
- **Shopping Cart** — Redis-backed persistent cart with real-time quantity management
- **Secure Payments** — Razorpay test-mode checkout with success sound & animations
- **Order Tracking** — Real-time order status timeline (Placed → Confirmed → Preparing → Food Ready → Served)
- **AI Chatbot** — Ask natural language questions like *"Show me veg pizzas under ₹300"*
- **User Profile** — Manage account info and view order history

### 🔧 Admin Features
- **Dashboard** — Revenue stats, order analytics, top-selling items, and live metrics
- **Menu Management** — Full CRUD for menu items with image URLs
- **Order Management** — View all orders, update status with color-coded pills (locked for served/cancelled)
- **Database Management** — View schema info, delete all orders/customers with safety confirmations
- **Dedicated Admin Login** — Separate login page with role-based access control

### 🔐 Authentication
- **JWT-based Auth** — Secure token-based authentication
- **Role-based Access** — Separate flows for customers and admins
- **Password Hashing** — bcrypt-encrypted password storage

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **HTML5** | Semantic page structure |
| **CSS3** | Custom design system with glassmorphism, animations, dark theme |
| **JavaScript (ES6+)** | DOM manipulation, API integration, client-side routing |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Python 3.10+** | Primary programming language |
| **Flask 3.0** | REST API framework with Blueprint routing |
| **Flask-CORS** | Cross-origin resource sharing |
| **PyJWT** | JSON Web Token authentication |
| **bcrypt** | Password hashing |
| **python-dotenv** | Environment variable management |

### Databases
| Technology | Purpose | Syllabus |
|-----------|---------|----------|
| **MySQL 8.0** | Primary relational database — users, orders, payments | Unit I & II |
| **Redis 7.0** | Cart storage, menu caching, session management (with in-memory fallback) | Unit III |
| **ChromaDB** | Vector database for menu item embeddings | Unit IV |

### External Services
| Technology | Purpose |
|-----------|---------|
| **Razorpay (Test Mode)** | Payment gateway — triggers ACID transaction demo |
| **Google Gemini API** | Free LLM for RAG-based chatbot responses |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (HTML/CSS/JS)                   │
│  ┌─────────┐ ┌──────┐ ┌──────┐ ┌────────┐ ┌──────────────┐  │
│  │  Home   │ │ Menu │ │ Cart │ │ Orders │ │ Admin Panel  │  │
│  └────┬────┘ └──┬───┘ └──┬───┘ └───┬────┘ └──────┬───────┘  │
│       │         │        │         │              │          │
└───────┼─────────┼────────┼─────────┼──────────────┼──────────┘
        │         │        │         │              │
        ▼         ▼        ▼         ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│                    FLASK REST API (Python)                    │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────┐  │
│  │ Auth API │ │ Menu API │ │ Order API │ │ Chatbot API   │  │
│  └────┬─────┘ └────┬─────┘ └─────┬─────┘ └───────┬───────┘  │
└───────┼────────────┼─────────────┼────────────────┼──────────┘
        │            │             │                │
        ▼            ▼             ▼                ▼
┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐
│  MySQL 8.0  │ │  Redis   │ │ Razorpay │ │ ChromaDB +     │
│  (Primary)  │ │  (Cache) │ │ (Pay)    │ │ Gemini (RAG)   │
└─────────────┘ └──────────┘ └──────────┘ └────────────────┘
```

---

## 🗄 Database Design

### Schema Overview

The database follows a **normalized 3NF schema** with 6 core tables designed for a single-restaurant system:

| Table | Description |
|-------|-------------|
| `users` | Customer & admin accounts — name, email, phone, role (customer/admin) |
| `restaurants` | Single restaurant config — name, cuisine, rating, price |
| `menu_items` | Food items — FK→restaurants, category, price, veg/non-veg, availability |
| `orders` | Customer orders — FK→users, total, tax, discount, status tracking, ACID |
| `order_items` | Junction table (order↔menu) — quantity, unit_price, computed subtotal |
| `payments` | Razorpay integration — order IDs, signature verification, payment method |

### Order Status Flow

```
placed → confirmed → preparing → food_prepared → served
   └──────────────────→ cancelled (only before food_prepared)
```

### Key Relationships

```
users ──(1:N)──> orders ──(1:N)──> order_items ──(N:1)──> menu_items
                    │                                          │
                    └──(1:1)──> payments     restaurants ──(1:N)┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** — [Download](https://python.org)
- **MySQL 8.0** — [Download](https://dev.mysql.com/downloads/)
- **Redis** — [Download](https://redis.io/download) or use `memurai` on Windows
- **Git** — [Download](https://git-scm.com)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Food_Ordering_Platform.git
cd Food_Ordering_Platform

# 2. Set up the MySQL database
mysql -u root -p < database/schema.sql
mysql -u root -p foodflash < database/seed_data.sql
mysql -u root -p foodflash < database/procedures.sql

# 3. Create a virtual environment & install dependencies
cd backend
python -m venv venv

# Activate the virtual environment:
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your MySQL password, Razorpay keys, etc.
```

### Environment Variables (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `MYSQL_PASSWORD` | Your MySQL root password | `your_password` |
| `RAZORPAY_KEY_ID` | Razorpay test key ID | `rzp_test_xxxxxxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay test secret | `xxxxxxxxxxxxxxxxxxxxxxxx` |
| `GEMINI_API_KEY` | Google Gemini API key (for chatbot) | `AIza...` |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |

---

## ⚙️ Running the Backend

### Step 1 — Start Redis Server

Open a **separate terminal** and run:

```bash
redis-server
```

> **Note:** If Redis is not installed on Windows, you can use [Memurai](https://www.memurai.com/) as a Windows-native alternative. The app also has an **in-memory fallback** — it will work without Redis (cart data won't persist across restarts).

### Step 2 — Start the Flask API Server

Open a terminal in the project root:

```bash
# Navigate to the backend directory
cd backend

# Activate the virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (Command Prompt):
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Start the Flask development server
python app.py
```

The backend API will be running at: **http://localhost:5000**

> Flask also serves the frontend static files, so you can access the full app at the same URL.

---

## 🌐 Running the Frontend

The frontend is **served directly by Flask** — no separate frontend server is needed.

Once the backend is running, open your browser and navigate to:

```
http://localhost:5000
```

### Alternative: Standalone Frontend Development

If you want to work on the frontend independently (e.g., with hot-reload), you can use VS Code's **Live Server** extension:

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in VS Code
2. Right-click on `frontend/index.html`
3. Select **"Open with Live Server"**
4. The frontend will open at `http://127.0.0.1:5500`

> **Note:** When using Live Server, make sure the Flask backend is still running on port 5000 for API calls to work.

---

## ⚡ Quick Start (One Command)

A batch script is included for Windows users to launch everything at once:

```bash
# From the project root directory
start_servers.bat
```

This script will:
1. Start **Redis server** in a new terminal window
2. Activate the **Python virtual environment**
3. Start the **Flask backend** in a new terminal window
4. The app will be accessible at **http://localhost:5000**

---

## 🔐 Test Credentials

| Role | Email | Password | Login URL |
|------|-------|----------|-----------|
| Customer | `customer@test.com` | `test1234` | `/login.html` |
| Admin | `admin@test.com` | `admin1234` | `/admin-login.html` |

### Razorpay Test Card

```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
OTP: 1234
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/auth/register` | Register a new customer |
| `POST` | `/api/auth/login` | Login and receive JWT token |
| `GET` | `/api/auth/profile` | Get current user profile |

### Menu

| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/api/menu` | List menu items (supports `?category=`, `?veg=`, `?search=`) |
| `GET` | `/api/menu/:id` | Get single menu item details |

### Cart (Redis)

| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/api/cart` | Get current cart items |
| `POST` | `/api/cart` | Add item to cart |
| `PUT` | `/api/cart/:item_id` | Update item quantity |
| `DELETE` | `/api/cart/:item_id` | Remove item from cart |

### Orders & Payments

| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/orders` | Place a new order (ACID transaction) |
| `GET` | `/api/orders` | Get user's order history |
| `PUT` | `/api/orders/:id/cancel` | Cancel an order (refunds payment) |
| `POST` | `/api/payments/create` | Create Razorpay payment order |
| `POST` | `/api/payments/verify` | Verify Razorpay payment signature |

### Admin

| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/api/admin/stats` | Dashboard statistics |
| `GET` | `/api/admin/orders` | Get all orders with items |
| `PUT` | `/api/admin/orders/:id/status` | Update order status |
| `POST` | `/api/admin/menu` | Add new menu item |
| `PUT` | `/api/admin/menu/:id` | Update menu item |
| `DELETE` | `/api/admin/menu/:id` | Delete menu item |
| `DELETE` | `/api/admin/clear/orders` | Delete all orders (danger) |
| `DELETE` | `/api/admin/clear/customers` | Delete all customers (danger) |

### AI Chatbot

| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/chatbot` | Send natural language query, get RAG response |

---

## 📚 DBMS Concepts Demonstrated

### Unit I — Database Design
- ✅ **ER Diagram** with entities, attributes, relationships, and cardinality
- ✅ **Relational Schema** mapping from ER to tables
- ✅ **Normalization** — All tables verified in 3NF with functional dependency analysis
- ✅ **Keys** — Primary keys, foreign keys, composite keys, candidate keys

### Unit II — SQL & Transactions
- ✅ **DDL** — CREATE TABLE, ALTER TABLE, DROP TABLE
- ✅ **DML** — INSERT, UPDATE, DELETE, SELECT with complex conditions
- ✅ **Joins** — INNER JOIN, LEFT JOIN across multiple tables
- ✅ **Subqueries** — Nested SELECT for analytics
- ✅ **Aggregate Functions** — COUNT, SUM, AVG, GROUP BY, HAVING
- ✅ **Stored Procedures** — `place_order()`, `complete_payment()`, `update_order_status()`, `get_dashboard_stats()`
- ✅ **Triggers** — `trg_prevent_invalid_cancel`, `trg_validate_order_amount`
- ✅ **Views** — `vw_order_details` for consolidated order information
- ✅ **ACID Transactions** — Order placement with COMMIT/ROLLBACK on payment status
- ✅ **Indexing** — B-tree indexes on frequently queried columns

### Unit III — NoSQL
- ✅ **Key-Value Store** — Redis for cart data (`HSET`, `HGET`, `HDEL`, `HGETALL`)
- ✅ **Caching** — Menu data cached in Redis with TTL
- ✅ **In-Memory Fallback** — Automatic fallback to Python dict when Redis is unavailable
- ✅ **Comparison** — SQL vs NoSQL trade-offs documented

### Unit IV — Advanced Topics
- ✅ **Vector Database** — ChromaDB for storing menu embeddings
- ✅ **Embeddings** — Text → vector conversion for semantic search
- ✅ **RAG Pipeline** — Retrieval-Augmented Generation with Gemini
- ✅ **Similarity Search** — Find related menu items using cosine similarity

---

## 📁 Project Structure

```
Food_Ordering_Platform/
├── README.md                        # This file
├── start_servers.bat                # One-click startup script (Windows)
│
├── frontend/                        # Client-side code
│   ├── index.html                   # Landing page
│   ├── menu.html                    # Menu browsing
│   ├── cart.html                    # Shopping cart
│   ├── orders.html                  # Order history & tracking
│   ├── login.html                   # Customer login
│   ├── register.html                # Customer registration
│   ├── admin.html                   # Admin dashboard
│   ├── admin-login.html             # Admin login page
│   ├── profile.html                 # User profile management
│   ├── css/
│   │   └── styles.css               # Design system (glassmorphism, dark theme)
│   └── js/
│       ├── app.js                   # Core app logic, routing, shared utilities
│       ├── auth.js                  # Login/register, JWT management
│       ├── menu.js                  # Menu browsing and search
│       ├── cart.js                  # Cart management, Razorpay checkout
│       ├── orders.js                # Order history and tracking
│       ├── admin.js                 # Admin dashboard, stats, order management
│       └── chatbot.js               # AI chatbot UI and API integration
│
├── backend/                         # Flask REST API
│   ├── app.py                       # Entry point — registers blueprints, serves frontend
│   ├── config.py                    # Configuration from environment variables
│   ├── requirements.txt             # Python dependencies
│   ├── .env.example                 # Environment variable template
│   ├── routes/                      # API route handlers (Blueprints)
│   │   ├── auth_routes.py           # /api/auth — login, register, profile
│   │   ├── menu_routes.py           # /api/menu — menu listing, search
│   │   ├── cart_routes.py           # /api/cart — Redis-backed cart CRUD
│   │   ├── order_routes.py          # /api/orders — place order, cancel, list
│   │   ├── payment_routes.py        # /api/payments — Razorpay create + verify
│   │   ├── admin_routes.py          # /api/admin — stats, orders, menu CRUD, data mgmt
│   │   └── chatbot_routes.py        # /api/chatbot — RAG AI chatbot
│   ├── services/                    # Business logic layer
│   │   ├── redis_service.py         # Redis with auto-fallback to in-memory dict
│   │   ├── rag_service.py           # ChromaDB + Gemini RAG pipeline
│   │   └── razorpay_service.py      # Razorpay payment integration
│   └── utils/                       # Helpers and middleware
│       ├── auth.py                  # JWT + bcrypt, role decorators
│       └── db.py                    # MySQL connection pool management
│
└── database/                        # SQL scripts
    ├── schema.sql                   # Table definitions (DDL) — 6 tables
    ├── seed_data.sql                # Sample data (DML) — users, menu, orders
    └── procedures.sql               # Stored procedures, triggers, views
```

---

## 👥 Team

| Name | Role | Contributions |
|------|------|--------------|
| *Your Name* | Full Stack Developer | Frontend, Backend, Database Design |
| *Team Member 2* | Database & Backend | MySQL Schema, Stored Procedures, Flask APIs |
| *Team Member 3* | Integration & Testing | Redis, Razorpay, ChromaDB + Gemini |

---

## 📄 License

This project is built for academic purposes as part of the **DBMS Mini Project — SY IoT, Semester 4**.

---

<div align="center">

**Built with ❤️ using Flask, MySQL, Redis, and AI**

*FoodFlash — Order Smart, Eat Happy* 🍕

</div>
