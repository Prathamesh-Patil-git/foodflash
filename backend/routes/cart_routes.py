import json
from flask import Blueprint, request, jsonify
from services.redis_service import RedisService
from utils.auth import token_required

cart_bp = Blueprint('cart', __name__)
redis_svc = RedisService()


@cart_bp.route('', methods=['GET'])
@token_required
def get_cart():
    """Get all items in the user's cart."""
    cart = redis_svc.get_cart(request.user_id)
    return jsonify({'cart': cart})


@cart_bp.route('', methods=['POST'])
@token_required
def add_to_cart():
    """Add an item to cart."""
    data = request.get_json()
    item_id = data.get('item_id')
    quantity = data.get('quantity', 1)
    item_data = data.get('item_data', {})  # name, price, restaurant, img, veg

    if not item_id:
        return jsonify({'error': 'item_id is required'}), 400

    redis_svc.add_to_cart(request.user_id, item_id, quantity, item_data)
    cart = redis_svc.get_cart(request.user_id)
    return jsonify({'message': 'Item added to cart', 'cart': cart})


@cart_bp.route('/<int:item_id>', methods=['PUT'])
@token_required
def update_cart_item(item_id):
    """Update item quantity in cart."""
    data = request.get_json()
    quantity = data.get('quantity', 1)

    if quantity <= 0:
        redis_svc.remove_from_cart(request.user_id, item_id)
    else:
        redis_svc.update_quantity(request.user_id, item_id, quantity)

    cart = redis_svc.get_cart(request.user_id)
    return jsonify({'message': 'Cart updated', 'cart': cart})


@cart_bp.route('/<int:item_id>', methods=['DELETE'])
@token_required
def remove_from_cart(item_id):
    """Remove an item from cart."""
    redis_svc.remove_from_cart(request.user_id, item_id)
    cart = redis_svc.get_cart(request.user_id)
    return jsonify({'message': 'Item removed', 'cart': cart})


@cart_bp.route('/clear', methods=['DELETE'])
@token_required
def clear_cart():
    """Clear entire cart."""
    redis_svc.clear_cart(request.user_id)
    return jsonify({'message': 'Cart cleared', 'cart': []})
