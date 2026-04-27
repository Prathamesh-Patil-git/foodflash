# FoodFlash System Architecture

This document provides a high-level overview of the architectural design and technologies used in the FoodFlash platform. It demonstrates the integration of multiple database paradigms across all four DBMS syllabus units.

## 1. High-Level Architecture
FoodFlash uses a **Client-Server Architecture** with a clear separation between the frontend UI, the RESTful backend, and a multi-database persistence layer.

```mermaid
flowchart TD
    %% Frontend Components
    subgraph Frontend [Client / Frontend (HTML, CSS, JS)]
        UI[User Interface]
        AuthJS[Firebase Auth & Local JS]
        RazorpayUI[Razorpay Checkout]
    end

    %% Backend Services
    subgraph Backend [Flask REST API (Python)]
        AuthAPI[Auth Service (JWT)]
        MenuAPI[Menu Service]
        OrderAPI[Order/Payment Service]
        ChatAPI[RAG Chatbot Service]
    end

    %% Databases
    subgraph Databases [Persistence Layer]
        MySQL[(MySQL 8.0\nPrimary Relational)]
        Redis[(Redis 7.0\nIn-Memory Cache)]
        Chroma[(ChromaDB\nVector Database)]
    end

    %% External APIs
    subgraph External [External Services]
        Razorpay[Razorpay Gateway]
        Gemini[Google Gemini API]
        Firebase[Firebase Authentication]
    end

    %% Flow connections
    UI <-->|REST API over HTTP| Backend
    AuthJS <-->|OAuth2| Firebase
    RazorpayUI <-->|Token processing| Razorpay

    AuthAPI <--> MySQL
    MenuAPI <--> MySQL
    MenuAPI <-->|Reads/Caches| Redis
    OrderAPI <--> MySQL
    OrderAPI <-->|Cart Mgmt| Redis
    OrderAPI <-->|Server Verify| Razorpay
    
    ChatAPI <-->|Vector Search| Chroma
    ChatAPI <-->|RAG Generation| Gemini
    MySQL -.->|Seed Embeddings| Chroma
```

## 2. Technology Stack Mapping to DBMS Syllabus

### Unit I: Relational Database Design
- **Technology:** MySQL 8.0
- **Implementation:** 
  - A 3NF normalized schema encompassing 7 tables (`users`, `restaurants`, `menu_items`, `orders`, `order_items`, `payments`, `reviews`).
  - Enforcement of Primary Keys, Foreign Keys (with `ON DELETE CASCADE`), and Check constraints.
  - Multi-role support (`customer`, `restaurant`, `admin`) natively mapped within the schema.

### Unit II: Advanced SQL & Transactions
- **Technology:** MySQL 8.0 (Stored Procedures & Triggers)
- **Implementation:**
  - **ACID Transactions:** The order placement and payment verification flow uses `START TRANSACTION`, `COMMIT`, and `ROLLBACK` within the `place_order` and `complete_payment` stored procedures to ensure atomic inserts across 3 tables.
  - **Triggers:** Automatic calculation of a restaurant's average rating whenever a new review is inserted (`trg_update_rating_after_insert`).
  - **Views & Aggregation:** Complex JOINs and GROUP BY queries power the Admin dashboard statistics.

### Unit III: NoSQL & Caching
- **Technology:** Redis
- **Implementation:**
  - **Shopping Cart:** Implemented using Redis Hashes (`HSET`, `HGETALL`) for extremely fast read/writes. Carts use an automatic Time-To-Live (TTL) expiry.
  - **Caching:** Menu responses are cached using `SETEX` to reduce MySQL load on high-traffic endpoints.
  - **Resilience:** The system detects if the Redis server is unavailable and automatically falls back to an in-memory dictionary.

### Unit IV: Vector Databases & RAG AI
- **Technology:** ChromaDB & Google Gemini
- **Implementation:**
  - **Embeddings:** All menu items (names, descriptions, categories) are concatenated and seeded into a local ChromaDB collection as vector embeddings.
  - **Semantic Search:** Users can query the menu using natural language (e.g., "Find me spicy non-veg options"). ChromaDB performs a cosine-similarity search.
  - **Retrieval-Augmented Generation:** The retrieved menu documents are passed as context to the Gemini LLM to construct a friendly, conversational response.

## 3. Order Processing Flow

1. **Cart Management (Redis):** As a user browses, items are quickly pushed to their Redis cart.
2. **Order Placement (MySQL):** Upon checkout, the cart items are pulled and passed to the `place_order` MySQL stored procedure, creating an unconfirmed order.
3. **Payment Initiation (Razorpay):** The backend creates a Razorpay order ID and sends it to the frontend.
4. **Checkout (Frontend):** The Razorpay JS widget captures payment details.
5. **Verification (Backend):** Razorpay sends a signature back. The backend validates it. If valid, it triggers `complete_payment` in MySQL to lock the order state.
6. **Fulfillment:** The order now appears on the specific restaurant's Admin Dashboard to be updated (Preparing -> Out for Delivery -> Delivered).
