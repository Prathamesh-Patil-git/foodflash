from flask import Blueprint, request, jsonify
from services.cart_service import CartService
from utils.auth import token_required

cart_bp = Blueprint('cart', __name__)
cart_svc = CartService()


@cart_bp.route('', methods=['GET'])
@token_required
def get_cart():
    """
    Retrieves the current state of the user's shopping cart.
    Fetches the list of items from the in-memory cart store.
    """
    cart = cart_svc.get_cart(request.user_id)
    return jsonify({'cart': cart})


@cart_bp.route('', methods=['POST'])
@token_required
def add_to_cart():
    """
    Appends a new menu item to the user's session cart.
    Automatically increments quantity if the item already exists.
    """
    data = request.get_json()
    item_id = data.get('item_id')
    quantity = data.get('quantity', 1)
    item_data = data.get('item_data', {})  # name, price, img, veg

    if not item_id:
        return jsonify({'error': 'item_id is required'}), 400

    cart_svc.add_to_cart(request.user_id, item_id, quantity, item_data)
    cart = cart_svc.get_cart(request.user_id)
    return jsonify({'message': 'Item added to cart', 'cart': cart})


@cart_bp.route('/<int:item_id>', methods=['PUT'])
@token_required
def update_cart_item(item_id):
    """
    Modifies the quantity of a specific item within the cart.
    If quantity is set to 0 or less, the item is removed entirely.
    """
    data = request.get_json()
    quantity = data.get('quantity', 1)

    if quantity <= 0:
        cart_svc.remove_from_cart(request.user_id, item_id)
    else:
        cart_svc.update_quantity(request.user_id, item_id, quantity)

    cart = cart_svc.get_cart(request.user_id)
    return jsonify({'message': 'Cart updated', 'cart': cart})


@cart_bp.route('/<int:item_id>', methods=['DELETE'])
@token_required
def remove_from_cart(item_id):
    """
    Deletes a specific item entirely from the user's cart,
    regardless of its current quantity.
    """
    cart_svc.remove_from_cart(request.user_id, item_id)
    cart = cart_svc.get_cart(request.user_id)
    return jsonify({'message': 'Item removed', 'cart': cart})


@cart_bp.route('/clear', methods=['DELETE'])
@token_required
def clear_cart():
    """
    Purges all items from the user's cart.
    """
    cart_svc.clear_cart(request.user_id)
    return jsonify({'message': 'Cart cleared', 'cart': []})
