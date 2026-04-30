import json
from flask import Blueprint, request, jsonify
from utils.db import execute_query, get_db
from utils.auth import token_required

order_bp = Blueprint('orders', __name__)


@order_bp.route('', methods=['POST'])
@token_required
def place_order():
    """
    Executes a multi-step ACID transaction to finalize a new order.
    Calculates totals and taxes, inserts the parent order record, iterates to insert 
    individual order items, provisions an initial payment record, and finally commits 
    the transaction. Automatically rolls back all changes on any failure.
    """
    data = request.get_json()
    items = data.get('items', [])  # [{"menu_item_id":1, "quantity":2, "unit_price":349}]
    discount = data.get('discount', 0)

    if not items:
        return jsonify({'error': 'items are required'}), 400

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        conn.start_transaction()

        # Calculate total
        total = sum(int(item['quantity']) * float(item['unit_price']) for item in items)
        tax = round(total * 0.05, 2)
        final_amount = total + tax - discount

        # Insert order
        cursor.execute(
            """INSERT INTO orders (user_id, total_amount, tax_amount, discount, final_amount, status)
               VALUES (%s, %s, %s, %s, %s, 'placed')""",
            (request.user_id, total, tax, discount, final_amount)
        )
        order_id = cursor.lastrowid

        # Insert order items
        for item in items:
            cursor.execute(
                "INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES (%s, %s, %s, %s)",
                (order_id, item['menu_item_id'], item['quantity'], item['unit_price'])
            )

        # Insert payment record for Razorpay flow
        cursor.execute(
            "INSERT INTO payments (order_id, amount, status) VALUES (%s, %s, 'created')",
            (order_id, final_amount)
        )

        conn.commit()

        return jsonify({
            'message': 'Order placed successfully',
            'order': {
                'id': order_id,
                'total_amount': float(total),
                'tax_amount': float(tax),
                'discount': float(discount),
                'final_amount': float(final_amount),
                'status': 'placed'
            }
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Failed to place order: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()


@order_bp.route('', methods=['GET'])
@token_required
def get_orders():
    """
    Retrieves a chronological list of historical orders for the authenticated user,
    subsequently querying and appending detailed item records for each parent order.
    """
    orders = execute_query(
        """SELECT * FROM orders
           WHERE user_id = %s
           ORDER BY created_at DESC""",
        (request.user_id,)
    )

    # Attach items to each order
    for order in orders:
        items = execute_query(
            """SELECT oi.*, mi.name, mi.image_url
               FROM order_items oi
               JOIN menu_items mi ON oi.menu_item_id = mi.id
               WHERE oi.order_id = %s""",
            (order['id'],)
        )
        order['items'] = items

    return jsonify({'orders': orders})


@order_bp.route('/<int:order_id>', methods=['GET'])
@token_required
def get_order(order_id):
    """
    Fetches the complete breakdown of a specific order, including itemized products,
    ensuring the requestor is the owner of the order.
    """
    orders = execute_query(
        "SELECT * FROM orders WHERE id = %s AND user_id = %s",
        (order_id, request.user_id)
    )
    if not orders:
        return jsonify({'error': 'Order not found'}), 404

    order = orders[0]
    order['items'] = execute_query(
        """SELECT oi.*, mi.name, mi.image_url
           FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id
           WHERE oi.order_id = %s""",
        (order_id,)
    )
    return jsonify({'order': order})


@order_bp.route('/<int:order_id>/cancel', methods=['PUT'])
@token_required
def cancel_order(order_id):
    """
    Atomically cancels an active order and marks its associated payment as refunded.
    Uses row-level locking (SELECT FOR UPDATE) to prevent race conditions and validates 
    the current order status to enforce business rules (cannot cancel if food is prepared).
    Fully implements ACID principles to ensure data consistency during cancellations.
    """
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        conn.start_transaction()

        # Step 1: Fetch current order (with row lock for isolation)
        cursor.execute(
            "SELECT id, status, user_id FROM orders WHERE id = %s FOR UPDATE",
            (order_id,)
        )
        order = cursor.fetchone()

        if not order:
            conn.rollback()
            return jsonify({'error': 'Order not found'}), 404

        if order['user_id'] != request.user_id:
            conn.rollback()
            return jsonify({'error': 'Unauthorized'}), 403

        # Only allow cancel before food is prepared
        cancellable = ['placed', 'confirmed', 'preparing']
        if order['status'] not in cancellable:
            conn.rollback()
            return jsonify({'error': f'Cannot cancel order — food is already {order["status"].replace("_"," ")}'}), 400

        # Step 2: Cancel the order
        cursor.execute(
            "UPDATE orders SET status = 'cancelled' WHERE id = %s",
            (order_id,)
        )

        # Step 3: Refund the payment (mark as 'refunded')
        cursor.execute(
            "UPDATE payments SET status = 'refunded' WHERE order_id = %s",
            (order_id,)
        )

        # ACID: Durability — commit both changes atomically
        conn.commit()

        return jsonify({
            'message': 'Order cancelled and payment refunded successfully',
            'order_id': order_id,
            'status': 'cancelled',
            'payment_status': 'refunded'
        })

    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Failed to cancel order: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()
