# FoodFlash — Food Ordering Platform

<div align="center">

**A full-stack single-restaurant food ordering platform built as a DBMS Mini Project**

*Covers ER modeling, SQL transactions, vector databases & RAG — all four syllabus units in one project.*

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![Razorpay](https://img.shields.io/badge/Razorpay-Test_Mode-0C2451?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com)

</div>

---

## Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Design](#database-design)
- [Getting Started](#getting-started)
- [Running the App](#running-the-app)
- [Quick Start](#quick-start-one-command)
- [Test Credentials](#test-credentials)
- [API Reference](#api-reference)
- [DBMS Concepts Demonstrated](#dbms-concepts-demonstrated)
- [Project Structure](#project-structure)

---

## About the Project

**FoodFlash** is a single-restaurant food ordering and management platform for **FoodFlash Kitchen**. Built as a DBMS mini project for SY IoT Semester 4, it demonstrates mastery of database concepts across all four syllabus units:

| Unit | Concept | Implementation |
|------|---------|---------------|
| **Unit I** | ER Modeling, Relational Schema, Normalization | 4-table normalized schema with full ER diagram |
| **Unit II** | SQL (DDL/DML/DCL), Joins, Transactions | Complex queries, stored procedures, ACID-compliant order processing |
| **Unit III** | NoSQL, In-Memory Data Structures | In-memory cart service (Python dict) demonstrating key-value concepts |
| **Unit IV** | Vector Databases, Embeddings, RAG | ChromaDB + Gemini AI chatbot for intelligent menu search |

---

## Features

### Customer Features
- **Smart Menu Search** — Filter by category, veg/non-veg, and keyword search
- **Shopping Cart** — In-memory persistent cart with real-time quantity management
- **Secure Payments** — Razorpay test-mode checkout with success animation
- **Order Tracking** — Real-time order status timeline (Placed > Confirmed > Preparing > Food Ready > Served)
- **Order Cancellation** — ACID-guaranteed cancel + payment refund (before food is prepared)
- **AI Chatbot** — Ask natural language questions like *"Show me veg pizzas under Rs.300"*
- **User Profile** — Manage account info and view order history

### Admin Features
- **Dashboard** — Revenue stats, orders today, active customers, and top-selling items
- **Menu Management** — Full CRUD for menu items with image URLs and category
- **Order Management** — View all orders, update status with color-coded dropdowns
- **Database Management** — View schema info, bulk delete orders/customers with safety confirmations
- **Dedicated Admin Login** — Separate login page with role-based access control

### Authentication
- **JWT-based Auth** — Secure token-based authentication
- **Role-based Access** — Separate flows for customers (`customer`) and administrators (`admin`)
- **Password Hashing** — bcrypt-encrypted password storage

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **HTML5** | Semantic page structure |
| **CSS3** | Custom design system with glassmorphism, animations, dark theme |
| **JavaScript (ES6+)** | DOM manipulation, API integration, Razorpay checkout |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Python 3.10+** | Primary programming language |
| **Flask 3.0** | REST API framework with Blueprint routing |
| **Flask-CORS** | Cross-origin resource sharing |
| **PyJWT** | JSON Web Token authentication |
| **bcrypt** | Password hashing |
| **python-dotenv** | Environment variable management |

### Databases & Storage
| Technology | Purpose | Syllabus Unit |
|-----------|---------|--------------|
| **MySQL 8.0** | Primary relational database — users, orders, menu, payments | Unit I & II |
| **Python dict (in-memory)** | Cart storage — key-value concept demonstration | Unit III |
| **ChromaDB** | Vector database for menu item embeddings | Unit IV |

### External Services
| Technology | Purpose |
|-----------|---------|
| **Razorpay (Test Mode)** | Payment gateway — triggers ACID transaction demo |
| **Google Gemini API** | LLM for RAG-based chatbot responses |

---

## Architecture

```
+--------------------------------------------------------------+
|                     FRONTEND (HTML/CSS/JS)                   |
|  +---------+ +------+ +------+ +--------+ +--------------+  |
|  |  Home   | | Menu | | Cart | | Orders | | Admin Panel  |  |
|  +----+----+ +--+---+ +--+---+ +---+----+ +------+-------+  |
+-------+---------+--------+---------+--------------+----------+
        |         |        |         |              |
        v         v        v         v              v
+--------------------------------------------------------------+
|                    FLASK REST API (Python)                    |
|  +----------+ +----------+ +-----------+ +---------------+  |
|  | Auth API | | Menu API | | Order API | | Chatbot API   |  |
|  +----+-----+ +----+-----+ +-----+-----+ +-------+-------+  |
+-------+------------+-------------+----------------+----------+
        |            |             |                |
        v            v             v                v
+-------------+ +----------+ +----------+ +----------------+
|  MySQL 8.0  | |  In-Mem  | | Razorpay | | ChromaDB +     |
|  (Primary)  | |  Cart    | |  (Pay)   | | Gemini (RAG)   |
+-------------+ +----------+ +----------+ +----------------+
```

---

## Database Design

### Schema Overview

The database follows a **normalized 3NF schema** with 5 tables — no `restaurants` table needed since FoodFlash Kitchen is a single-restaurant system:

| Table | Description |
|-------|-------------|
| `users` | Customer & admin accounts — name, email, phone, role (`customer`/`admin`) |
| `menu_items` | Food items — name, price, category, veg/non-veg, image, availability |
| `orders` | Customer orders — FK to users, total, tax, discount, final amount, status |
| `order_items` | Junction table (order to menu) — quantity, unit_price, computed subtotal |
| `payments` | Razorpay integration — order IDs, signature verification, payment method |

### Views
| View | Description |
|------|-------------|
| `vw_order_details` | JOIN of orders + users + payments — used by admin dashboard |
| `vw_menu_full` | Filtered view of available menu items — used by menu API |

### Order Status Flow

```
placed -> confirmed -> preparing -> food_prepared -> served
   +-------------------> cancelled (only before food_prepared)
```

### Key Relationships

```
users --(1:N)--> orders --(1:N)--> order_items --(N:1)--> menu_items
                    |
                    +--(1:1)--> payments
```

---

## How It Works

### Overall Workflow
1. **User Browsing & Cart (In-Memory):** When a customer browses the menu, items are fetched via Flask APIs. Cart state is stored in a Python in-memory dict (key-value store concept).
2. **Checkout & Payment:** Upon checkout, a pending order is created in MySQL and a payment request is sent to **Razorpay**.
3. **ACID Transaction:** Once payment is verified, the order and payment tables are updated atomically via `START TRANSACTION / COMMIT / ROLLBACK`.
4. **Order Tracking:** The user tracks their order status in real-time as the Admin updates it from the dashboard.

### AI Chatbot (RAG & ChromaDB)
FoodFlash features an intelligent menu assistant powered by **Retrieval-Augmented Generation (RAG)**:

1. **Data Ingestion:** All menu items are vectorized and stored in **ChromaDB**.
2. **User Query:** The customer asks a natural language question.
3. **Semantic Search:** ChromaDB finds the most relevant menu items using cosine similarity.
4. **LLM Generation:** Retrieved items are injected into a prompt sent to **Gemini API**.
5. **Final Response:** A conversational, context-grounded answer is returned.

---

## Getting Started

### Prerequisites

- **Python 3.10+** — [Download](https://python.org)
- **MySQL 8.0** — [Download](https://dev.mysql.com/downloads/)
- **Git** — [Download](https://git-scm.com)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Food_Ordering_Platform.git
cd Food_Ordering_Platform

# 2. Set up the MySQL database (run in order)
mysql -u root -p < database/schema.sql
mysql -u root -p foodflash < database/procedures.sql
mysql -u root -p foodflash < database/seed_data.sql

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
copy .env.example .env
# Edit .env with your MySQL password, Razorpay keys, Gemini API key
```

### Environment Variables (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `MYSQL_PASSWORD` | Your MySQL root password | `your_password` |
| `RAZORPAY_KEY_ID` | Razorpay test key ID | `rzp_test_xxxxxxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay test secret | `xxxxxxxxxxxxxxxxxxxxxxxx` |
| `GEMINI_API_KEY` | Google Gemini API key (for chatbot) | `AIza...` |

---

## Running the App

```bash
# Navigate to the backend directory
cd backend

# Activate the virtual environment
.\venv\Scripts\Activate.ps1        # Windows PowerShell
# or: venv\Scripts\activate        # Windows CMD
# or: source venv/bin/activate     # macOS/Linux

# Start the Flask development server
python app.py
```

The app will be running at: **http://localhost:5000**

> Flask serves both the API and the frontend static files — no separate server needed.

---

## Quick Start (One Command)

A batch script is included for Windows users:

```bash
# From the project root directory
start_servers.bat
```

This launches the Flask backend in a new terminal window. Access at **http://localhost:5000**.

---

## Test Credentials

### Admin Account

| Email | Password | Login URL |
|-------|----------|-----------|
| `admin@test.com` | `admin1234` | `http://localhost:5000/admin-login.html` |

> Admin has access to the dashboard, order management, menu CRUD, and data management tools.

### Customer Accounts

| Name | Email | Password | Login URL |
|------|-------|----------|-----------|
| Rahul Sharma | `rahul@test.com` | `test1234` | `http://localhost:5000/login.html` |
| Priya Mehta | `priya@test.com` | `test1234` | `http://localhost:5000/login.html` |
| Amit Kumar | `amit@test.com` | `test1234` | `http://localhost:5000/login.html` |
| Sneha Reddy | `sneha@test.com` | `test1234` | `http://localhost:5000/login.html` |
| Vikram Singh | `vikram@test.com` | `test1234` | `http://localhost:5000/login.html` |

### Razorpay Test Card

```
Card Number: 4111 1111 1111 1111
Expiry:      Any future date
CVV:         Any 3 digits
OTP:         1234
```

---

## API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Requires Auth | Description |
|--------|---------|---------------|-------------|
| `POST` | `/api/auth/register` | No | Register a new customer |
| `POST` | `/api/auth/login` | No | Login and receive JWT token |
| `GET` | `/api/auth/profile` | Yes | Get current user profile |
| `PUT` | `/api/auth/profile` | Yes | Update user profile |

### Menu (`/api`)

| Method | Endpoint | Requires Auth | Description |
|--------|---------|---------------|-------------|
| `GET` | `/api/menu` | No | List menu items (`?category=`, `?veg=`, `?search=`) |
| `GET` | `/api/menu/:id` | No | Get a single menu item |
| `GET` | `/api/public/stats` | No | Public platform stats (items, orders, customers) |

### Cart (`/api/cart`)

| Method | Endpoint | Requires Auth | Description |
|--------|---------|---------------|-------------|
| `GET` | `/api/cart` | Yes | Get current cart items |
| `POST` | `/api/cart` | Yes | Add item to cart |
| `PUT` | `/api/cart/:item_id` | Yes | Update item quantity |
| `DELETE` | `/api/cart/:item_id` | Yes | Remove item from cart |
| `DELETE` | `/api/cart/clear` | Yes | Clear entire cart |

### Orders (`/api/orders`)

| Method | Endpoint | Requires Auth | Description |
|--------|---------|---------------|-------------|
| `POST` | `/api/orders` | Yes | Place a new order (ACID transaction) |
| `GET` | `/api/orders` | Yes | Get user's order history with items |
| `GET` | `/api/orders/:id` | Yes | Get a single order detail |
| `PUT` | `/api/orders/:id/cancel` | Yes | Cancel order + refund payment (ACID) |

### Payments (`/api/payments`)

| Method | Endpoint | Requires Auth | Description |
|--------|---------|---------------|-------------|
| `POST` | `/api/payments/create` | Yes | Create Razorpay payment order |
| `POST` | `/api/payments/verify` | Yes | Verify Razorpay signature (ACID update) |

### Admin (`/api/admin`) — Admin role required

| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/api/admin/stats` | Dashboard stats (revenue, orders today, customers, top items) |
| `GET` | `/api/admin/orders` | All orders with items summary |
| `PUT` | `/api/admin/orders/:id/status` | Update order status |
| `POST` | `/api/admin/menu` | Add new menu item |
| `PUT` | `/api/admin/menu/:id` | Update menu item |
| `DELETE` | `/api/admin/menu/:id` | Delete menu item |
| `DELETE` | `/api/admin/clear/orders` | Delete all orders (danger zone) |
| `DELETE` | `/api/admin/clear/customers` | Delete all customer accounts (danger zone) |

### AI Chatbot (`/api/chatbot`)

| Method | Endpoint | Requires Auth | Description |
|--------|---------|---------------|-------------|
| `POST` | `/api/chatbot` | No | Send natural language query, get RAG response |

---

## DBMS Concepts Demonstrated

### Unit I — Database Design
- **ER Diagram** — entities, attributes, relationships, cardinality (`database/er_diagram.md`)
- **Relational Schema** — mapping from ER to normalized tables
- **3NF Normalization** — all tables free of transitive dependencies
- **Keys** — Primary keys, foreign keys (`ON DELETE CASCADE`), unique constraints

### Unit II — SQL & Transactions
- **DDL** — `CREATE TABLE`, indexes, check constraints, enum types
- **DML** — `INSERT`, `UPDATE`, `DELETE`, `SELECT` with complex conditions
- **Joins** — `INNER JOIN`, `LEFT JOIN` across multiple tables
- **Aggregate Functions** — `COUNT`, `SUM`, `AVG`, `GROUP BY`, `GROUP_CONCAT`
- **Stored Procedures** — `place_order()`, `complete_payment()`, `cancel_order()`, `update_order_status()`, `get_dashboard_stats()`
- **Triggers** — `trg_prevent_invalid_cancel`, `trg_validate_order_amount`
- **Views** — `vw_order_details`, `vw_menu_full`
- **ACID Transactions** — `START TRANSACTION`, `COMMIT`, `ROLLBACK`, `SELECT FOR UPDATE` (row-level locking)
- **Indexing** — B-tree indexes on `email`, `role`, `status`, `created_at`

### Unit III — NoSQL / In-Memory Concepts
- **Key-Value Store Concept** — Cart stored as `{ "cart:<user_id>": { "<item_id>": {...} } }` in Python dict
- **Session-scoped Storage** — Cart persists across requests within a server session
- **NoSQL vs SQL Trade-offs** — Speed of in-memory access vs ACID durability of MySQL

### Unit IV — Advanced Topics
- **Vector Database** — ChromaDB for storing menu item embeddings
- **Text Embeddings** — Menu descriptions converted to mathematical vectors
- **RAG Pipeline** — Retrieval-Augmented Generation with ChromaDB + Gemini
- **Semantic Search** — Find menu items using cosine similarity (not just keyword match)

---

## Project Structure

```
Food_Ordering_Platform/
+-- README.md                        # This file
+-- start_servers.bat                # One-click startup script (Windows)
|
+-- frontend/                        # Client-side code
|   +-- index.html                   # Landing page
|   +-- menu.html                    # Menu browsing & search
|   +-- cart.html                    # Shopping cart + Razorpay checkout
|   +-- orders.html                  # Order history & status tracking
|   +-- login.html                   # Customer login
|   +-- register.html                # Customer registration
|   +-- admin.html                   # Admin dashboard
|   +-- admin-login.html             # Admin login page
|   +-- profile.html                 # User profile management
|   +-- css/
|   |   +-- styles.css               # Design system (glassmorphism, dark theme)
|   +-- js/
|       +-- app.js                   # Core app logic, shared utilities, cart helpers
|       +-- auth.js                  # Login/register, JWT management
|       +-- menu.js                  # Menu browsing and search
|       +-- cart.js                  # Cart management, Razorpay checkout
|       +-- orders.js                # Order history and cancel
|       +-- admin.js                 # Admin dashboard, stats, order & menu management
|       +-- chatbot.js               # AI chatbot UI and API integration
|
+-- backend/                         # Flask REST API
|   +-- app.py                       # Entry point — registers blueprints, serves frontend
|   +-- config.py                    # Configuration from environment variables
|   +-- requirements.txt             # Python dependencies
|   +-- .env.example                 # Environment variable template
|   +-- routes/                      # API route handlers (Blueprints)
|   |   +-- auth_routes.py           # /api/auth — login, register, profile
|   |   +-- menu_routes.py           # /api/menu — menu listing, search
|   |   +-- cart_routes.py           # /api/cart — in-memory cart CRUD
|   |   +-- order_routes.py          # /api/orders — place, list, cancel (ACID)
|   |   +-- payment_routes.py        # /api/payments — Razorpay create + verify
|   |   +-- admin_routes.py          # /api/admin — stats, orders, menu CRUD
|   |   +-- chatbot_routes.py        # /api/chatbot — RAG AI chatbot
|   +-- services/                    # Business logic layer
|   |   +-- cart_service.py          # In-memory cart (key-value store concept)
|   |   +-- rag_service.py           # ChromaDB + Gemini RAG pipeline
|   |   +-- razorpay_service.py      # Razorpay payment integration stub
|   +-- utils/                       # Helpers and middleware
|       +-- auth.py                  # JWT + bcrypt, token_required, admin_required
|       +-- db.py                    # MySQL connection pool management
|
+-- database/                        # SQL scripts
|   +-- schema.sql                   # DDL — 5 tables (users, menu_items, orders, order_items, payments)
|   +-- procedures.sql               # Stored procedures, triggers (x2), views (x2)
|   +-- seed_data.sql                # Sample data — 6 users, 26 menu items, 4 orders
|   +-- er_diagram.md                # ER diagram (Mermaid)
|   +-- README.md                    # Database documentation
|
+-- docs/
    +-- architecture.md              # System architecture & DBMS syllabus mapping
```

---

## License

This project is built for academic purposes as part of the **DBMS Mini Project — SY IoT, Semester 4**.

---

<div align="center">

**Built with Flask, MySQL & AI**

*FoodFlash Kitchen — Order Smart, Eat Happy*

</div>
