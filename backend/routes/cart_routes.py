import json
from flask import Blueprint, request, jsonify
from services.redis_service import RedisService
from utils.auth import token_required

cart_bp = Blueprint('cart', __name__)
redis_svc = RedisService()


@cart_bp.route('', methods=['GET'])
@token_required
def get_cart():
    """
    Retrieves the current state of the user's shopping cart.
    Fetches the deserialized list of items from the Redis key-value store cache layer.
    """
    cart = redis_svc.get_cart(request.user_id)
    return jsonify({'cart': cart})


@cart_bp.route('', methods=['POST'])
@token_required
def add_to_cart():
    """
    Appends a new menu item to the user's session cart.
    Interfaces with the Redis service to store item data temporarily, automatically 
    incrementing quantities if the item already exists in the cart.
    """
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
    """
    Modifies the quantity of a specific item within the cart.
    Updates the Redis hash field for the given item. If the specified quantity 
    is set to 0 or less, the item is entirely removed from the cart.
    """
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
    """
    Deletes a specific item entirely from the user's Redis session cart,
    regardless of its current quantity.
    """
    redis_svc.remove_from_cart(request.user_id, item_id)
    cart = redis_svc.get_cart(request.user_id)
    return jsonify({'message': 'Item removed', 'cart': cart})


@cart_bp.route('/clear', methods=['DELETE'])
@token_required
def clear_cart():
    """
    Purges all items from the user's cart by deleting the associated 
    session key from the Redis datastore.
    """
    redis_svc.clear_cart(request.user_id)
    return jsonify({'message': 'Cart cleared', 'cart': []})
