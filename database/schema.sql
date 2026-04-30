-- =============================================
-- FoodFlash — MySQL Database Schema
-- Single-restaurant food ordering system
-- Engine: InnoDB (supports ACID transactions)
-- =============================================

CREATE DATABASE IF NOT EXISTS foodflash;
USE foodflash;

-- =============================================
-- 1. USERS TABLE
-- Stores customer and admin accounts.
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    email       VARCHAR(150)    NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    phone       VARCHAR(20),
    role        ENUM('customer', 'admin') DEFAULT 'customer',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- =============================================
-- 2. MENU ITEMS TABLE
-- All items belong to the single restaurant.
-- =============================================
CREATE TABLE IF NOT EXISTS menu_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150)    NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2)   NOT NULL CHECK (price > 0),
    category        VARCHAR(50)     NOT NULL,
    is_veg          BOOLEAN         DEFAULT FALSE,
    image_url       VARCHAR(500),
    is_available    BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_menu_category (category),
    INDEX idx_menu_veg (is_veg)
) ENGINE=InnoDB;

-- =============================================
-- 3. ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT             NOT NULL,
    total_amount    DECIMAL(10,2)   NOT NULL,
    tax_amount      DECIMAL(10,2)   DEFAULT 0.00,
    discount        DECIMAL(10,2)   DEFAULT 0.00,
    final_amount    DECIMAL(10,2)   NOT NULL,
    status          ENUM('placed','confirmed','preparing','food_prepared','served','cancelled')
                    DEFAULT 'placed',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_created (created_at)
) ENGINE=InnoDB;

-- =============================================
-- 4. ORDER ITEMS TABLE (Junction / Composite)
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT             NOT NULL,
    menu_item_id    INT             NOT NULL,
    quantity        INT             NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price      DECIMAL(10,2)   NOT NULL,
    subtotal        DECIMAL(10,2)   GENERATED ALWAYS AS (quantity * unit_price) STORED,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    INDEX idx_oi_order (order_id),
    INDEX idx_oi_menu (menu_item_id)
) ENGINE=InnoDB;

-- =============================================
-- 5. PAYMENTS TABLE (Razorpay integration)
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT             NOT NULL UNIQUE,
    razorpay_order_id   VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature  VARCHAR(255),
    amount          DECIMAL(10,2)   NOT NULL,
    currency        VARCHAR(10)     DEFAULT 'INR',
    status          ENUM('created','authorized','captured','failed','refunded')
                    DEFAULT 'created',
    method          VARCHAR(50),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_payments_status (status),
    INDEX idx_payments_razorpay (razorpay_order_id)
) ENGINE=InnoDB;
