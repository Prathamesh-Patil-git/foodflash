from flask import Blueprint, request, jsonify
from utils.db import execute_query

menu_bp = Blueprint('menu', __name__)


@menu_bp.route('/menu', methods=['GET'])
def get_menu():
    """
    Retrieves menu items dynamically based on provided query parameters 
    (category, vegetarian status, search term). Constructs a parameterized 
    SQL query to filter results and prevent SQL injection.
    """
    category = request.args.get('category')
    veg = request.args.get('veg')
    search = request.args.get('search')

    query = "SELECT * FROM vw_menu_full WHERE 1=1"
    params = []

    if category and category != 'all':
        query += " AND category = %s"
        params.append(category)
    if veg is not None:
        query += " AND is_veg = %s"
        params.append(veg.lower() == 'true')
    if search:
        query += " AND name LIKE %s"
        params.append(f'%{search}%')

    query += " ORDER BY name ASC"
    items = execute_query(query, tuple(params))
    return jsonify({'menu_items': items})


@menu_bp.route('/menu/<int:item_id>', methods=['GET'])
def get_menu_item(item_id):
    """
    Fetches the complete details for a specific menu item using its unique 
    identifier from the vw_menu_full view.
    """
    items = execute_query(
        "SELECT * FROM vw_menu_full WHERE id = %s", (item_id,)
    )
    if not items:
        return jsonify({'error': 'Menu item not found'}), 404
    return jsonify({'menu_item': items[0]})


@menu_bp.route('/public/stats', methods=['GET'])
def get_public_stats():
    """
    Aggregates high-level platform statistics (total active menu items, total 
    completed orders, unique customers) for display on public-facing marketing pages.
    Requires no authentication.
    """
    menu_items = execute_query("SELECT COUNT(*) AS cnt FROM menu_items WHERE is_available = TRUE")
    orders = execute_query("SELECT COUNT(*) AS cnt FROM orders WHERE status != 'cancelled'")
    customers = execute_query("SELECT COUNT(DISTINCT user_id) AS cnt FROM orders")
    return jsonify({
        'menu_items': menu_items[0]['cnt'] if menu_items else 0,
        'orders_served': orders[0]['cnt'] if orders else 0,
        'customers': customers[0]['cnt'] if customers else 0
    })
