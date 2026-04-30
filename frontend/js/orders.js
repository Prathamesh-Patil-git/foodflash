// ===== FoodFlash — Orders JS Module =====
// Fetches order history from Flask API, renders order cards with
// status timeline and cancel button (ACID refund before food_prepared)
var API = window.FOODFLASH_API || 'http://localhost:5000/api';

const statusConfig = {
  placed:           { label:'Order Placed', icon:'fa-clock', class:'status-placed', step:1 },
  confirmed:        { label:'Confirmed', icon:'fa-check', class:'status-confirmed', step:2 },
  preparing:        { label:'Preparing', icon:'fa-fire', class:'status-preparing', step:3 },
  food_prepared:    { label:'Food Ready', icon:'fa-utensils', class:'status-preparing', step:4 },
  served:           { label:'Served', icon:'fa-check-circle', class:'status-delivered', step:5 },
  cancelled:        { label:'Cancelled', icon:'fa-times-circle', class:'status-cancelled', step:-1 },
};

const timelineSteps = [
  { icon:'fa-check', label:'Confirmed' },
  { icon:'fa-fire', label:'Preparing' },
  { icon:'fa-utensils', label:'Food Ready' },
  { icon:'fa-check-circle', label:'Served' },
];

async function fetchOrders() {
  const container = document.getElementById('ordersContainer');
  if (!container) return;

  const token = localStorage.getItem('foodflash_token');
  if (!token) {
    container.innerHTML = `<div style="text-align:center;padding:80px 0;">
      <div style="font-size:4rem;margin-bottom:20px;">🔒</div>
      <h2 style="margin-bottom:12px;">Please log in</h2>
      <p style="color:var(--text-muted);margin-bottom:32px;">Login to view your order history</p>
      <a href="login.html" class="btn btn-primary btn-lg"><i class="fas fa-sign-in-alt"></i> Login</a>
    </div>`;
    return;
  }

  let orders = [];
  try {
    const r = await fetch(`${API}/orders`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (r.ok) {
      const d = await r.json();
      if (d.orders) orders = d.orders;
    }
  } catch {}

  if (!orders.length) {
    container.innerHTML = `<div style="text-align:center;padding:80px 0;">
      <div style="font-size:4rem;margin-bottom:20px;">📋</div>
      <h2 style="margin-bottom:12px;">No orders yet</h2>
      <p style="color:var(--text-muted);margin-bottom:32px;">Start ordering from our delicious menu!</p>
      <a href="menu.html" class="btn btn-primary btn-lg"><i class="fas fa-utensils"></i> Browse Menu</a>
    </div>`;
    return;
  }

  container.innerHTML = orders.map((order, idx) => {
    const s = statusConfig[order.status] || statusConfig.placed;
    const date = new Date(order.created_at).toLocaleDateString('en-IN', { month:'long', day:'numeric', year:'numeric' });
    const currentStep = s.step;

    // Build timeline (5 steps after "placed")
    let timeline = '';
    if (s.step >= 0) {
      timeline = `<div style="display:flex;align-items:center;gap:0;margin:20px 0;padding:0 8px;">`;
      timelineSteps.forEach((step, i) => {
        const stepNum = i + 2; // Steps start at 2 (confirmed)
        const done = currentStep > stepNum;
        const active = currentStep === stepNum;
        const bg = done || active ? 'var(--accent-green)' : 'var(--bg-glass)';
        const border = done || active ? '' : 'border:1px solid var(--border-glass);';
        const color = done || active ? '#fff' : 'var(--text-muted)';
        const labelColor = done || active ? 'var(--accent-green)' : 'var(--text-muted)';
        if (i > 0) {
          const lineColor = done ? 'var(--accent-green)' : 'var(--border-glass)';
          timeline += `<div style="flex:1;height:3px;background:${lineColor};"></div>`;
        }
        timeline += `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <div style="width:32px;height:32px;border-radius:50%;background:${bg};${border}display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:${color};"><i class="fas ${step.icon}"></i></div>
          <span style="font-size:0.7rem;color:${labelColor};white-space:nowrap;">${step.label}</span>
        </div>`;
      });
      timeline += `</div>`;
    }

    // Cancelled timeline
    if (s.step === -1) {
      timeline = `<div style="text-align:center;padding:16px;margin:12px 0;border-radius:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);">
        <i class="fas fa-times-circle" style="color:var(--accent-red);font-size:1.2rem;"></i>
        <span style="color:var(--accent-red);font-weight:600;margin-left:8px;">Order Cancelled — Payment Refunded</span>
      </div>`;
    }

    const itemsHtml = (order.items||[]).map(i =>
      `<div class="order-item-row"><span>${i.quantity}x ${i.name}</span><span>₹${i.quantity * i.unit_price}</span></div>`
    ).join('');

    // Cancel button: only show if status is placed, confirmed, or preparing
    const canCancel = ['placed', 'confirmed', 'preparing'].includes(order.status);
    const cancelBtn = canCancel
      ? `<button class="btn btn-secondary btn-sm" onclick="cancelOrder(${order.id})" style="border-color:var(--accent-red);color:var(--accent-red);"><i class="fas fa-times"></i> Cancel Order</button>`
      : '';

    return `<div class="order-card animate-in${idx > 0 ? ` delay-${idx}` : ''}">
      <div class="order-header">
        <div>
          <div class="order-id">#ORD-${String(order.id).padStart(4,'0')}</div>
          <div style="font-size:0.85rem;color:var(--text-muted);">${date} • FoodFlash Kitchen</div>
        </div>
        <span class="order-status ${s.class}"><i class="fas ${s.icon}"></i> ${s.label}</span>
      </div>
      ${timeline}
      <div class="order-items-list">${itemsHtml}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:16px;border-top:1px solid var(--border-glass);">
        <div style="font-weight:800;font-size:1.1rem;color:var(--accent-orange);">Total: ₹${order.final_amount||order.total_amount||0}</div>
        <div style="display:flex;gap:8px;">
          ${cancelBtn}
          <button class="btn btn-secondary btn-sm" onclick="reorder(${order.id})"><i class="fas fa-redo"></i> Reorder</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

async function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order? Your payment will be refunded.')) return;

  const token = localStorage.getItem('foodflash_token');
  if (!token) { showToast('Please login first'); return; }

  try {
    const r = await fetch(`${API}/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    const d = await r.json();
    if (r.ok) {
      showToast('Order cancelled & payment refunded!');
      fetchOrders(); // Refresh the list
    } else {
      showToast(d.error || 'Cannot cancel this order');
    }
  } catch {
    showToast('Error cancelling order');
  }
}

function reorder(orderId) {
  showToast('Reorder feature coming soon!');
}

fetchOrders();
