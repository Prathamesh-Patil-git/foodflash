from flask import Blueprint, request, jsonify
from utils.db import execute_query
from utils.auth import hash_password, verify_password, generate_token, token_required

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone', '')
    address = data.get('address', '')

    if not all([name, email, password]):
        return jsonify({'error': 'Name, email and password are required'}), 400

    # Check if email already exists
    existing = execute_query("SELECT id FROM users WHERE email = %s", (email,))
    if existing:
        return jsonify({'error': 'Email already registered'}), 409

    # Create user
    hashed = hash_password(password)
    user_id = execute_query(
        "INSERT INTO users (name, email, password_hash, phone, address) VALUES (%s, %s, %s, %s, %s)",
        (name, email, hashed, phone, address), fetch=False
    )

    token = generate_token(user_id, 'customer')
    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': {'id': user_id, 'name': name, 'email': email, 'role': 'customer'}
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login and get JWT token."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({'error': 'Email and password are required'}), 400

    users = execute_query("SELECT * FROM users WHERE email = %s", (email,))
    if not users:
        return jsonify({'error': 'Invalid email or password'}), 401

    user = users[0]
    if not verify_password(password, user['password_hash']):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = generate_token(user['id'], user['role'])
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'phone': user['phone'],
            'address': user['address'],
            'restaurant_id': user.get('restaurant_id')
        }
    })


@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    """Get current user's profile."""
    users = execute_query(
        "SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = %s",
        (request.user_id,)
    )
    if not users:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': users[0]})


@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    """Update current user's profile."""
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone', '')
    address = data.get('address', '')

    if not name or not email:
        return jsonify({'error': 'Name and email are required'}), 400

    # Check if email is taken by another user
    existing = execute_query(
        "SELECT id FROM users WHERE email = %s AND id != %s", (email, request.user_id)
    )
    if existing:
        return jsonify({'error': 'Email already in use by another account'}), 409

    execute_query(
        "UPDATE users SET name = %s, email = %s, phone = %s, address = %s WHERE id = %s",
        (name, email, phone, address, request.user_id), fetch=False
    )

    return jsonify({
        'message': 'Profile updated successfully',
        'user': {'id': request.user_id, 'name': name, 'email': email, 'phone': phone, 'address': address}
    })

