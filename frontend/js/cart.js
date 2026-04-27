// ===== FoodFlash — Cart JS Module =====
// Cart CRUD via Redis API + Razorpay checkout integration
const API = window.FOODFLASH_API || 'http://localhost:5000/api';
const TAX_RATE = 0.05;
let discountAmount = 0;

function renderCart() {
  const cart = getCart();
  const emptyEl = document.getElementById('emptyCart');
  const contentEl = document.getElementById('cartContent');
  const listEl = document.getElementById('cartItemsList');
  if (!emptyEl || !contentEl || !listEl) return;

  if (cart.length === 0) {
    emptyEl.style.display = 'block';
    contentEl.style.display = 'none';
    return;
  }
  emptyEl.style.display = 'none';
  contentEl.style.display = 'grid';

  listEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img"><img src="${item.img}" alt="${item.name}"
           onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop'"></div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div style="font-size:0.85rem;color:var(--text-muted);">${item.restaurant}</div>
        <div class="cart-item-price">₹${item.price}</div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" onclick="changeQty(${item.id},-1)"><i class="fas fa-minus"></i></button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id},1)"><i class="fas fa-plus"></i></button>
      </div>
      <div style="font-weight:700;min-width:70px;text-align:right;">₹${item.price * item.qty}</div>
      <button class="btn-icon" onclick="removeItem(${item.id})" style="width:36px;height:36px;flex-shrink:0;">
        <i class="fas fa-trash" style="font-size:0.8rem;color:var(--accent-red);"></i>
      </button>
    </div>
  `).join('');

  updateSummary(cart);
}

function updateSummary(cart) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const taxes = Math.round(subtotal * TAX_RATE);
  const total = subtotal + taxes - discountAmount;
  document.getElementById('subtotal').textContent = `₹${subtotal}`;
  document.getElementById('taxes').textContent = `₹${taxes}`;
  document.getElementById('totalAmount').textContent = `₹${Math.max(0, total)}`;
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
  renderCart();
}

function removeItem(id) {
  let cart = getCart().filter(c => c.id !== id);
  saveCart(cart);
  renderCart();
  showToast('Item removed from cart');
}

// --- Razorpay Checkout ---
async function initiateCheckout() {
  const cart = getCart();
  if (cart.length === 0) { showToast('Cart is empty!'); return; }

  const token = localStorage.getItem('foodflash_token');
  if (!token) { showToast('Please login to checkout'); window.location.href = 'login.html'; return; }

  const btn = document.getElementById('checkoutBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

  try {
    // Step 1: Place order via API
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const items = cart.map(i => ({ menu_item_id: i.id, quantity: i.qty, unit_price: i.price }));

    const orderRes = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ restaurant_id: 1, items, discount: discountAmount })
    });

    if (!orderRes.ok) {
      const err = await orderRes.json();
      throw new Error(err.error || 'Failed to place order');
    }
    const orderData = await orderRes.json();
    const orderId = orderData.order.id;
    const finalAmount = orderData.order.final_amount;

    // Step 2: Create Razorpay payment order
    const payRes = await fetch(`${API}/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ order_id: orderId, amount: finalAmount })
    });

    if (!payRes.ok) throw new Error('Failed to create payment');
    const payData = await payRes.json();

    // Step 3: Open Razorpay checkout
    const user = JSON.parse(localStorage.getItem('foodflash_user') || '{}');
    const options = {
      key: payData.razorpay_key_id,
      amount: payData.amount,
      currency: payData.currency,
      name: 'FoodFlash',
      description: `Order #${orderId}`,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop',
      order_id: payData.razorpay_order_id,
      prefill: { name: user.name || '', email: user.email || '', contact: user.phone || '' },
      theme: { color: '#FF6B35' },
      handler: async function(response) {
        // Step 4: Verify payment on backend
        try {
          const verifyRes = await fetch(`${API}/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              order_id: orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          if (verifyRes.ok) {
            saveCart([]);
            // Show success overlay while Razorpay sound plays
            showPaymentSuccess(orderId);
            // Wait for Razorpay success sound + animation to finish before redirect
            setTimeout(() => { window.location.href = 'orders.html'; }, 3500);
          } else {
            showToast('Payment verification failed');
          }
        } catch { showToast('Error verifying payment'); }
      },
      modal: {
        ondismiss: function() { showToast('Payment cancelled'); },
        confirm_close: true,
        animation: true
      },
      notes: { foodflash_order_id: orderId }
    };

    if (window.Razorpay) {
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function(resp) {
        showToast('Payment failed: ' + (resp.error.description || 'Unknown error'));
      });
      rzp.open();
    } else {
      showToast('Razorpay SDK not loaded. Check your internet connection.');
    }

  } catch (err) {
    console.error('Checkout error:', err);
    showToast(err.message || 'Checkout failed. Please try again.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-lock"></i> Proceed to Checkout';
  }
}

// --- Coupon code ---
document.getElementById('applyCoupon')?.addEventListener('click', () => {
  const code = document.getElementById('couponInput').value.trim().toUpperCase();
  const validCoupons = { 'FLASH20': 60, 'FOODIE50': 50, 'WELCOME': 100 };
  if (validCoupons[code]) {
    discountAmount = validCoupons[code];
    document.getElementById('discountRow').style.display = 'flex';
    document.getElementById('discount').textContent = `-₹${discountAmount}`;
    showToast(`Coupon ${code} applied! ₹${discountAmount} off`);
    updateSummary(getCart());
  } else {
    showToast('Invalid coupon code');
  }
});

// --- Payment success overlay ---
function showPaymentSuccess(orderId) {
  const overlay = document.createElement('div');
  overlay.id = 'paymentSuccessOverlay';
  overlay.innerHTML = `
    <style>
      #paymentSuccessOverlay {
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(0,0,0,0.7); backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease;
      }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      .success-box {
        background: var(--bg-card, #1a1a2e); border-radius: 24px; padding: 48px;
        text-align: center; max-width: 400px; width: 90%;
        border: 1px solid rgba(6,214,160,0.3);
        box-shadow: 0 24px 80px rgba(6,214,160,0.15);
        animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
      }
      @keyframes popIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
      .success-checkmark {
        width: 80px; height: 80px; border-radius: 50%;
        background: linear-gradient(135deg, #06d6a0, #00b894);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 24px; font-size: 2rem; color: #fff;
        box-shadow: 0 8px 32px rgba(6,214,160,0.4);
        animation: checkBounce 0.6s ease 0.3s both;
      }
      @keyframes checkBounce {
        0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); }
      }
      .success-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 8px; color: #06d6a0; }
      .success-subtitle { color: #999; font-size: 0.95rem; margin-bottom: 8px; }
      .success-order { font-weight: 700; color: var(--accent-orange, #ff6b35); font-size: 1.1rem; }
      .success-redirect { color: #666; font-size: 0.8rem; margin-top: 20px; }
    </style>
    <div class="success-box">
      <div class="success-checkmark"><i class="fas fa-check"></i></div>
      <div class="success-title">Payment Successful!</div>
      <div class="success-subtitle">Your order has been confirmed</div>
      <div class="success-order">Order #ORD-${orderId}</div>
      <div class="success-redirect"><i class="fas fa-spinner fa-spin"></i> Redirecting to orders...</div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// --- Checkout button ---
document.getElementById('checkoutBtn')?.addEventListener('click', initiateCheckout);

// --- Init ---
renderCart();

