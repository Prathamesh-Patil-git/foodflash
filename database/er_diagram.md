# Entity-Relationship Diagram

This diagram visualizes the 6-table normalized schema for the FoodFlash single-restaurant platform.

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    RESTAURANTS ||--o{ MENU_ITEMS : offers
    RESTAURANTS ||--o{ ORDERS : receives
    MENU_ITEMS ||--o{ ORDER_ITEMS : includes
    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--o| PAYMENTS : has

    USERS {
        int id PK
        varchar name
        varchar email
        varchar password_hash
        varchar phone
        enum role "customer | admin"
        timestamp created_at
    }

    RESTAURANTS {
        int id PK
        varchar name
        varchar cuisine
        decimal rating
        int total_reviews
        text image_url
        int price_for_two
        boolean is_active
        timestamp created_at
    }

    MENU_ITEMS {
        int id PK
        int restaurant_id FK
        varchar name
        text description
        decimal price
        varchar category
        boolean is_veg
        text image_url
    }

    ORDERS {
        int id PK
        int user_id FK
        int restaurant_id FK
        decimal total_amount
        decimal tax_amount
        decimal discount
        decimal final_amount
        enum status "placed | confirmed | preparing | food_prepared | served | cancelled"
        timestamp created_at
        timestamp updated_at
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        int menu_item_id FK
        int quantity
        decimal unit_price
    }

    PAYMENTS {
        int id PK
        int order_id FK
        varchar razorpay_order_id
        varchar razorpay_payment_id
        varchar razorpay_signature
        decimal amount
        enum status "created | captured | failed | refunded"
        varchar method
        timestamp created_at
    }
```

## Relationships Explained
- **1 User** can place **Many Orders** (`1:N`)
- **1 Restaurant** offers **Many Menu Items** (`1:N`)
- **1 Restaurant** receives **Many Orders** (`1:N`)
- **1 Order** contains **Many Order Items** (`1:N`)
- **1 Menu Item** can be part of **Many Order Items** (`1:N`)
- **1 Order** has exactly **1 Payment** (`1:1`)
