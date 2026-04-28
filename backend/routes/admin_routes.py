from flask import Blueprint, request, jsonify
from utils.db import execute_query
from utils.auth import admin_required

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    """
    Aggregates key performance metrics for the admin dashboard.
    Calculates total historical revenue (excluding cancelled orders), daily order volume, 
    unique active customers, and average restaurant rating.
    Also retrieves the top 5 highest-selling menu items by joining order_items 
    and menu_items tables, grouped by item and restaurant.
    """
    revenue = execute_query(
        "SELECT COALESCE(SUM(final_amount), 0) AS total FROM orders WHERE status != 'cancelled'"
    )
    orders_today = execute_query(
        "SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = CURDATE()"
    )
    customers = execute_query(
        "SELECT COUNT(DISTINCT user_id) AS count FROM orders"
    )
    avg_rating = execute_query(
        "SELECT ROUND(AVG(rating), 1) AS avg FROM restaurants"
    )

    top_items = execute_query("""
        SELECT mi.name, mi.image_url, r.name AS restaurant, SUM(oi.quantity) AS total_sold
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        JOIN restaurants r ON mi.restaurant_id = r.id
        GROUP BY mi.id, mi.name, mi.image_url, r.name
        ORDER BY total_sold DESC LIMIT 5
    """)

    return jsonify({
        'total_revenue': float(revenue[0]['total']) if revenue else 0,
        'orders_today': orders_today[0]['count'] if orders_today else 0,
        'active_customers': customers[0]['count'] if customers else 0,
        'avg_rating': float(avg_rating[0]['avg']) if avg_rating and avg_rating[0]['avg'] else 0,
        'top_items': top_items
    })


@admin_bp.route('/orders', methods=['GET'])
@admin_required
def get_all_orders():
    """
    Retrieves a comprehensive list of all system orders for administrative review.
    Utilizes the vw_order_details view and concatenates individual order items 
    (name and quantity) into a single comma-separated string per order using GROUP_CONCAT.
    Results are sorted chronologically with the most recent orders first.
    """
    orders = execute_query("""
        SELECT v.*,
               GROUP_CONCAT(CONCAT(mi.name, ' x', oi.quantity) SEPARATOR ', ') AS items_text
        FROM vw_order_details v
        LEFT JOIN order_items oi ON v.order_id = oi.order_id
        LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
        GROUP BY v.order_id
        ORDER BY v.created_at DESC
    """)
    return jsonify({'orders': orders})


@admin_bp.route('/orders/<int:order_id>/status', methods=['PUT'])
@admin_required
def update_status(order_id):
    """
    Updates the fulfillment status of a specific order.
    Validates the requested status against an enumerated list of allowed states 
    (placed, confirmed, preparing, food_prepared, served, cancelled) before executing 
    the UPDATE query on the orders table. Returns 400 Bad Request on invalid state.
    """
    data = request.get_json()
    status = data.get('status')
    valid = ['placed', 'confirmed', 'preparing', 'food_prepared', 'served', 'cancelled']
    if status not in valid:
        return jsonify({'error': f'Invalid status. Must be one of: {valid}'}), 400

    execute_query("UPDATE orders SET status = %s WHERE id = %s", (status, order_id), fetch=False)
    return jsonify({'message': f'Order {order_id} status updated to {status}'})


@admin_bp.route('/menu', methods=['POST'])
@admin_required
def add_menu_item():
    """
    Provisions a new menu item in the database.
    Accepts JSON payload containing item specifications (name, price, category, etc.) 
    and executes an INSERT operation. Currently defaults to restaurant_id=1 for the 
    single-restaurant implementation. Returns the newly generated item ID.
    """
    data = request.get_json()

    item_id = execute_query(
        """INSERT INTO menu_items (restaurant_id, name, description, price, category, is_veg, image_url)
           VALUES (1, %s, %s, %s, %s, %s, %s)""",
        (data['name'], data.get('description', ''),
         data['price'], data['category'], data.get('is_veg', False), data.get('image_url', '')),
        fetch=False
    )
    return jsonify({'message': 'Menu item added', 'id': item_id}), 201


@admin_bp.route('/menu/<int:item_id>', methods=['PUT'])
@admin_required
def update_menu_item(item_id):
    """
    Modifies an existing menu item's attributes.
    Dynamically constructs an UPDATE SQL statement based on the fields provided 
    in the JSON payload. Only explicitly whitelisted fields are eligible for update.
    Returns a 400 error if no updatable fields are present in the request.
    """
    data = request.get_json()
    fields = []
    values = []
    for key in ['name', 'description', 'price', 'category', 'is_veg', 'image_url', 'is_available']:
        if key in data:
            fields.append(f"{key} = %s")
            values.append(data[key])
    if not fields:
        return jsonify({'error': 'No fields to update'}), 400
    values.append(item_id)
    execute_query(f"UPDATE menu_items SET {', '.join(fields)} WHERE id = %s", tuple(values), fetch=False)
    return jsonify({'message': 'Menu item updated'})


@admin_bp.route('/menu/<int:item_id>', methods=['DELETE'])
@admin_required
def delete_menu_item(item_id):
    """
    Removes a menu item from the system by ID.
    Executes a hard DELETE on the menu_items table. Note: This may fail due to 
    foreign key constraints if the item is referenced in existing order_items.
    """
    execute_query("DELETE FROM menu_items WHERE id = %s", (item_id,), fetch=False)
    return jsonify({'message': 'Menu item deleted'})


@admin_bp.route('/clear/orders', methods=['DELETE'])
@admin_required
def clear_all_orders():
    """
    Hard-deletes all transactional data across the platform.
    Executes a database transaction to wipe payments, order_items, and orders tables 
    in correct constraint order. Will rollback all changes if any single deletion fails.
    Intended strictly for testing/resetting environments.
    """
    from utils.db import get_db
    conn = get_db()
    cursor = conn.cursor()
    try:
        conn.start_transaction()
        cursor.execute("DELETE FROM payments")
        cursor.execute("DELETE FROM order_items")
        cursor.execute("DELETE FROM orders")
        conn.commit()
        return jsonify({'message': 'All orders, order items, and payments deleted'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@admin_bp.route('/clear/customers', methods=['DELETE'])
@admin_required
def clear_all_customers():
    """
    Purges all customer accounts and their associated historical data.
    Executes a cascaded transaction that first removes payments, order_items, and orders 
    tied to 'customer' role users, followed by deleting the user records themselves.
    Admin and restaurant accounts are explicitly preserved.
    """
    from utils.db import get_db
    conn = get_db()
    cursor = conn.cursor()
    try:
        conn.start_transaction()
        # First delete orders, payments, order_items for customers
        cursor.execute("DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (SELECT id FROM users WHERE role = 'customer'))")
        cursor.execute("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (SELECT id FROM users WHERE role = 'customer'))")
        cursor.execute("DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE role = 'customer')")
        cursor.execute("DELETE FROM users WHERE role = 'customer'")
        conn.commit()
        return jsonify({'message': 'All customer accounts and their data deleted'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
