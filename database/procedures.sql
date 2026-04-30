-- =============================================
-- FoodFlash — Stored Procedures, Triggers & Views
-- Demonstrates: ACID Transactions, Stored Procs,
--               Triggers, Views, Aggregate Queries
-- =============================================
USE foodflash;

DELIMITER //

-- =============================================
-- PROCEDURE: place_order
-- ACID Transaction: Atomically creates order +
-- order_items + payment record.
-- On ANY error → full ROLLBACK (Atomicity)
-- InnoDB row-locks ensure Isolation
-- COMMIT ensures Durability
-- =============================================
CREATE PROCEDURE place_order(
    IN p_user_id INT,
    IN p_items JSON,
    IN p_discount DECIMAL(10,2),
    OUT p_order_id INT,
    OUT p_final_amount DECIMAL(10,2)
)
BEGIN
    DECLARE v_total DECIMAL(10,2) DEFAULT 0;
    DECLARE v_tax DECIMAL(10,2);
    DECLARE v_final DECIMAL(10,2);
    DECLARE v_count INT;
    DECLARE v_i INT DEFAULT 0;

    -- ACID: Atomicity — rollback everything on error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_order_id = -1;
        SET p_final_amount = 0;
    END;

    -- Begin ACID transaction
    START TRANSACTION;

    SET v_count = JSON_LENGTH(p_items);

    -- Step 1: Insert order (placeholder amounts)
    INSERT INTO orders (user_id, total_amount, tax_amount, discount, final_amount, status)
    VALUES (p_user_id, 0, 0, p_discount, 0, 'placed');

    SET p_order_id = LAST_INSERT_ID();

    -- Step 2: Insert each order item
    WHILE v_i < v_count DO
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price)
        VALUES (
            p_order_id,
            CAST(JSON_EXTRACT(p_items, CONCAT('$[', v_i, '].menu_item_id')) AS UNSIGNED),
            CAST(JSON_EXTRACT(p_items, CONCAT('$[', v_i, '].quantity')) AS UNSIGNED),
            CAST(JSON_EXTRACT(p_items, CONCAT('$[', v_i, '].unit_price')) AS DECIMAL(10,2))
        );

        SET v_total = v_total + (
            CAST(JSON_EXTRACT(p_items, CONCAT('$[', v_i, '].quantity')) AS UNSIGNED) *
            CAST(JSON_EXTRACT(p_items, CONCAT('$[', v_i, '].unit_price')) AS DECIMAL(10,2))
        );
        SET v_i = v_i + 1;
    END WHILE;

    -- Step 3: Calculate tax (5% GST) and final amount
    SET v_tax = ROUND(v_total * 0.05, 2);
    SET v_final = v_total + v_tax - p_discount;
    SET p_final_amount = v_final;

    -- Step 4: Update order with computed amounts
    UPDATE orders
    SET total_amount = v_total, tax_amount = v_tax, final_amount = v_final
    WHERE id = p_order_id;

    -- Step 5: Create payment record (initially 'created')
    INSERT INTO payments (order_id, amount, status)
    VALUES (p_order_id, v_final, 'created');

    -- ACID: Durability — commit all changes to disk
    COMMIT;
END //

-- =============================================
-- PROCEDURE: complete_payment
-- ACID Transaction: Updates both payment and order
-- status atomically. Either both succeed or both
-- rollback (Consistency + Atomicity).
-- =============================================
CREATE PROCEDURE complete_payment(
    IN p_order_id INT,
    IN p_razorpay_payment_id VARCHAR(100),
    IN p_razorpay_signature VARCHAR(255),
    IN p_method VARCHAR(50),
    IN p_success BOOLEAN
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;

    IF p_success THEN
        -- Payment captured: update payment + confirm order
        UPDATE payments
        SET razorpay_payment_id = p_razorpay_payment_id,
            razorpay_signature = p_razorpay_signature,
            method = p_method,
            status = 'captured'
        WHERE order_id = p_order_id;

        UPDATE orders SET status = 'confirmed' WHERE id = p_order_id;
    ELSE
        -- Payment failed: mark as failed + cancel order
        UPDATE payments SET status = 'failed' WHERE order_id = p_order_id;
        UPDATE orders SET status = 'cancelled' WHERE id = p_order_id;
    END IF;

    COMMIT;
END //

-- =============================================
-- PROCEDURE: update_order_status
-- Called by the admin dashboard to move orders
-- through the lifecycle.
-- =============================================
CREATE PROCEDURE update_order_status(
    IN p_order_id INT,
    IN p_new_status VARCHAR(30)
)
BEGIN
    UPDATE orders SET status = p_new_status WHERE id = p_order_id;
END //

-- =============================================
-- PROCEDURE: get_dashboard_stats
-- Complex aggregate queries with JOINs
-- =============================================
CREATE PROCEDURE get_dashboard_stats()
BEGIN
    -- Total revenue (excludes cancelled orders)
    SELECT COALESCE(SUM(final_amount), 0) AS total_revenue
    FROM orders WHERE status != 'cancelled';

    -- Orders placed today
    SELECT COUNT(*) AS orders_today
    FROM orders WHERE DATE(created_at) = CURDATE();

    -- Unique customers who have ordered
    SELECT COUNT(DISTINCT user_id) AS active_customers
    FROM orders;

    -- Top 5 selling items (JOIN + GROUP BY + ORDER BY)
    SELECT mi.name, mi.image_url, SUM(oi.quantity) AS total_sold
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    GROUP BY mi.id, mi.name, mi.image_url
    ORDER BY total_sold DESC
    LIMIT 5;
END //

-- =============================================
-- PROCEDURE: cancel_order
-- ACID Transaction: Cancels order + refunds payment
-- atomically. Only allowed before food_prepared.
-- Demonstrates Atomicity (both updates or neither)
-- and Consistency (validates cancellable status).
-- =============================================
CREATE PROCEDURE cancel_order(
    IN p_order_id INT,
    IN p_user_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_status VARCHAR(30);
    DECLARE v_owner_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Transaction failed - rolled back';
    END;

    START TRANSACTION;

    -- Lock the row for isolation (SELECT ... FOR UPDATE)
    SELECT status, user_id INTO v_status, v_owner_id
    FROM orders WHERE id = p_order_id FOR UPDATE;

    -- Validate ownership
    IF v_owner_id != p_user_id THEN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Unauthorized';
    -- Validate cancellable status (only before food is prepared)
    ELSEIF v_status NOT IN ('placed', 'confirmed', 'preparing') THEN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = CONCAT('Cannot cancel - order is already ', REPLACE(v_status, '_', ' '));
    ELSE
        -- Atomically: cancel order + refund payment
        UPDATE orders SET status = 'cancelled' WHERE id = p_order_id;
        UPDATE payments SET status = 'refunded' WHERE order_id = p_order_id;
        COMMIT;
        SET p_success = TRUE;
        SET p_message = 'Order cancelled and payment refunded';
    END IF;
END //

-- =============================================
-- TRIGGER: trg_prevent_invalid_cancel
-- Business rule: Once food is prepared, the order
-- cannot be cancelled. Enforces data Consistency.
-- =============================================
CREATE TRIGGER trg_prevent_invalid_cancel
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status IN ('food_prepared', 'served') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot cancel order after food is prepared';
    END IF;
END //

-- =============================================
-- TRIGGER: trg_validate_order_amount
-- Ensures final_amount is always positive
-- before inserting an order (Consistency).
-- =============================================
CREATE TRIGGER trg_validate_order_amount
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
    IF NEW.final_amount <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Order amount must be greater than zero';
    END IF;
END //

DELIMITER ;

-- =============================================
-- VIEWS (Virtual tables for common queries)
-- =============================================

-- View: Order details with customer and payment info
CREATE OR REPLACE VIEW vw_order_details AS
SELECT
    o.id AS order_id,
    o.user_id,
    u.name AS customer_name,
    u.email AS customer_email,
    o.total_amount, o.tax_amount,
    o.discount, o.final_amount, o.status,
    o.created_at,
    p.status AS payment_status,
    p.method AS payment_method,
    p.razorpay_payment_id
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN payments p ON o.id = p.order_id;

-- View: Menu items (all from the single restaurant)
CREATE OR REPLACE VIEW vw_menu_full AS
SELECT
    id, name, description, price,
    category, is_veg, image_url, is_available
FROM menu_items
WHERE is_available = TRUE;
