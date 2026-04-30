# Entity-Relationship Diagram

This diagram visualizes the 5-table normalized schema for the FoodFlash single-restaurant platform.

---

## ER Diagram (Mermaid)

```mermaid
erDiagram
    USERS {
        int         id              PK
        varchar     name
        varchar     email               "unique"
        varchar     password_hash
        varchar     phone
        enum        role            "customer | admin"
        timestamp   created_at
    }

    MENU_ITEMS {
        int         id              PK
        varchar     name
        text        description
        decimal     price
        varchar     category
        boolean     is_veg
        text        image_url
        boolean     is_available
        timestamp   created_at
    }

    ORDERS {
        int         id              PK
        int         user_id         FK
        decimal     total_amount
        decimal     tax_amount
        decimal     discount
        decimal     final_amount
        enum        status              "placed,confirmed,preparing,food_prepared,served,cancelled"
        timestamp   created_at
        timestamp   updated_at
    }

    ORDER_ITEMS {
        int         id              PK
        int         order_id        FK
        int         menu_item_id    FK
        int         quantity
        decimal     unit_price
        decimal     subtotal
    }

    PAYMENTS {
        int         id              PK
        int         order_id        FK  "unique"
        varchar     razorpay_order_id
        varchar     razorpay_payment_id
        varchar     razorpay_signature
        decimal     amount
        enum        status              "created,captured,failed,refunded"
        varchar     method
        timestamp   created_at
    }

    USERS      ||--o{ ORDERS      : "places"
    ORDERS     ||--o{ ORDER_ITEMS : "contains"
    MENU_ITEMS ||--o{ ORDER_ITEMS : "included in"
    ORDERS     ||--o| PAYMENTS    : "paid via"
```

---

## Schema Relationships Explained

| Relationship | Type | Description |
|---|---|---|
| USERS to ORDERS | One-to-Many (1:N) | One user can place many orders |
| ORDERS to ORDER_ITEMS | One-to-Many (1:N) | One order contains many line items |
| MENU_ITEMS to ORDER_ITEMS | One-to-Many (1:N) | One dish can appear in many orders |
| ORDERS to PAYMENTS | One-to-One (1:1) | Each order has exactly one payment record |

---

## Entity Map (Visual)

```mermaid
flowchart LR
    classDef table    fill:#0f3460,stroke:#06d6a0,stroke-width:2px,color:#d0fff5
    classDef pk       fill:#16213e,stroke:#4a9eff,stroke-width:1px,color:#aad4ff
    classDef fk       fill:#1a1a2e,stroke:#ff6b35,stroke-width:1px,color:#ffd0b0
    classDef junction fill:#0d2137,stroke:#e040fb,stroke-width:2px,color:#f0d0ff

    USERS:::table
    MENU_ITEMS:::table
    ORDERS:::table
    ORDER_ITEMS:::junction
    PAYMENTS:::table

    USERS      -->|"1 user\nplaces many"| ORDERS
    ORDERS     -->|"1 order\ncontains many"| ORDER_ITEMS
    MENU_ITEMS -->|"1 item\nincluded in many"| ORDER_ITEMS
    ORDERS     -->|"1 order\npaid via 1"| PAYMENTS
```

---

## Key Constraints

| Table | Constraint | Column | Rule |
|-------|-----------|--------|------|
| `users` | UNIQUE | `email` | No two users share the same email |
| `menu_items` | CHECK | `price` | `price > 0` |
| `orders` | ENUM | `status` | Only 6 valid status values |
| `orders` | TRIGGER | `final_amount` | `trg_validate_order_amount` rejects `<= 0` |
| `orders` | TRIGGER | `status` | `trg_prevent_invalid_cancel` blocks cancel after `food_prepared` |
| `order_items` | CHECK | `quantity` | `quantity > 0` |
| `order_items` | FK | `order_id` | `ON DELETE CASCADE` |
| `order_items` | FK | `menu_item_id` | `ON DELETE CASCADE` |
| `payments` | UNIQUE | `order_id` | One payment record per order |
| `payments` | FK | `order_id` | `ON DELETE CASCADE` |
