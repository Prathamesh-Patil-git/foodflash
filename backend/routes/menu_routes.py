from flask import Blueprint, request, jsonify
from utils.db import execute_query

menu_bp = Blueprint('menu', __name__)


@menu_bp.route('/restaurants', methods=['GET'])
def get_restaurants():
    """List all active restaurants."""
    restaurants = execute_query(
        "SELECT * FROM restaurants WHERE is_active = TRUE ORDER BY rating DESC"
    )
    return jsonify({'restaurants': restaurants})


@menu_bp.route('/menu', methods=['GET'])
def get_menu():
    """List menu items with optional filters."""
    category = request.args.get('category')
    veg = request.args.get('veg')
    search = request.args.get('search')
    restaurant_id = request.args.get('restaurant_id')

    query = "SELECT * FROM vw_menu_full WHERE 1=1"
    params = []

    if category and category != 'all':
        query += " AND category = %s"
        params.append(category)
    if veg is not None:
        query += " AND is_veg = %s"
        params.append(veg.lower() == 'true')
    if search:
        query += " AND (name LIKE %s OR restaurant_name LIKE %s)"
        params.extend([f'%{search}%', f'%{search}%'])
    if restaurant_id:
        query += " AND id IN (SELECT id FROM menu_items WHERE restaurant_id = %s)"
        params.append(restaurant_id)

    query += " ORDER BY restaurant_rating DESC, name ASC"
    items = execute_query(query, tuple(params))
    return jsonify({'menu_items': items})


@menu_bp.route('/menu/<int:item_id>', methods=['GET'])
def get_menu_item(item_id):
    """Get a single menu item by ID."""
    items = execute_query(
        "SELECT * FROM vw_menu_full WHERE id = %s", (item_id,)
    )
    if not items:
        return jsonify({'error': 'Menu item not found'}), 404
    return jsonify({'menu_item': items[0]})


@menu_bp.route('/public/stats', methods=['GET'])
def get_public_stats():
    """Public stats for the homepage hero — no auth required."""
    menu_items = execute_query("SELECT COUNT(*) AS cnt FROM menu_items WHERE is_available = TRUE")
    orders = execute_query("SELECT COUNT(*) AS cnt FROM orders WHERE status != 'cancelled'")
    customers = execute_query("SELECT COUNT(DISTINCT user_id) AS cnt FROM orders")
    return jsonify({
        'menu_items': menu_items[0]['cnt'] if menu_items else 0,
        'orders_served': orders[0]['cnt'] if orders else 0,
        'customers': customers[0]['cnt'] if customers else 0
    })
