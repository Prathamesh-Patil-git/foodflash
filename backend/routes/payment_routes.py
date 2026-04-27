import razorpay
from flask import Blueprint, request, jsonify
from config import Config
from utils.db import execute_query, get_db
from utils.auth import token_required

payment_bp = Blueprint('payments', __name__)
razorpay_client = razorpay.Client(auth=(Config.RAZORPAY_KEY_ID, Config.RAZORPAY_KEY_SECRET))


@payment_bp.route('/create', methods=['POST'])
@token_required
def create_payment():
    """Create a Razorpay order for payment."""
    data = request.get_json()
    order_id = data.get('order_id')
    amount = data.get('amount')  # in rupees

    if not order_id or not amount:
        return jsonify({'error': 'order_id and amount are required'}), 400

    # Create Razorpay order (amount in paise)
    rz_order = razorpay_client.order.create({
        'amount': int(amount * 100),
        'currency': 'INR',
        'receipt': f'order_{order_id}',
        'notes': {'foodflash_order_id': order_id}
    })

    # Update payment record with razorpay order id
    execute_query(
        "UPDATE payments SET razorpay_order_id = %s WHERE order_id = %s",
        (rz_order['id'], order_id), fetch=False
    )

    return jsonify({
        'razorpay_order_id': rz_order['id'],
        'razorpay_key_id': Config.RAZORPAY_KEY_ID,
        'amount': int(amount * 100),
        'currency': 'INR'
    })


@payment_bp.route('/verify', methods=['POST'])
@token_required
def verify_payment():
    """Verify Razorpay payment and complete the ACID transaction."""
    data = request.get_json()
    order_id = data.get('order_id')
    razorpay_payment_id = data.get('razorpay_payment_id')
    razorpay_order_id = data.get('razorpay_order_id')
    razorpay_signature = data.get('razorpay_signature')

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # Verify signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })

        # Fetch payment details from Razorpay to get the payment method (card, upi, etc.)
        try:
            payment_details = razorpay_client.payment.fetch(razorpay_payment_id)
            payment_method = payment_details.get('method', 'Razorpay')
        except Exception:
            payment_method = 'Razorpay'

        # ACID Transaction: update payment + order status
        conn.start_transaction()
        cursor.execute(
            """UPDATE payments SET razorpay_payment_id = %s, razorpay_signature = %s,
               status = 'captured', method = %s WHERE order_id = %s""",
            (razorpay_payment_id, razorpay_signature, payment_method, order_id)
        )
        cursor.execute("UPDATE orders SET status = 'confirmed' WHERE id = %s", (order_id,))
        conn.commit()

        return jsonify({'message': 'Payment verified successfully', 'status': 'captured'})

    except razorpay.errors.SignatureVerificationError:
        conn.start_transaction()
        cursor.execute("UPDATE payments SET status = 'failed' WHERE order_id = %s", (order_id,))
        cursor.execute("UPDATE orders SET status = 'cancelled' WHERE id = %s", (order_id,))
        conn.commit()
        return jsonify({'error': 'Payment verification failed', 'status': 'failed'}), 400

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
