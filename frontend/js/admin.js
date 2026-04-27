// ===== FoodFlash — Admin JS Module =====
// Dashboard stats, order management, menu CRUD, section switching
const API = window.FOODFLASH_API || 'http://localhost:5000/api';

let liveOrders = [];
let liveMenuItems = [];
const token = localStorage.getItem('foodflash_token');

// ===== SECTION SWITCHER =====
function switchSection(sectionName) {
  const content = document.querySelector('.admin-content');
  document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
  document.querySelector(`.sidebar-nav a[data-section="${sectionName}"]`)?.classList.add('active');

  switch(sectionName) {
    case 'dashboard': renderDashboard(content); break;
    case 'menu-items': renderMenuItems(content); break;
    case 'orders': renderOrders(content); break;
    case 'customers': renderCustomers(content); break;
    case 'payments': renderPayments(content); break;
    case 'chatbot': renderChatbot(content); break;
    case 'database': renderDatabase(content); break;
    default: renderDashboard(content);
  }
}

// ===== DASHBOARD =====
async function renderDashboard(container) {
  let stats = { total_revenue: 0, orders_today: 0, active_customers: 0, avg_rating: 0 };
  let orders = [];

  if (token) {
    try {
      const r = await fetch(`${API}/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); stats = { ...stats, ...d }; }
      const rO = await fetch(`${API}/admin/orders`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (rO.ok) { const dO = await rO.json(); if (dO.orders) orders = dO.orders; }
    } catch {}
  }
  liveOrders = orders;

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;">
      <div><h1 style="font-size:1.75rem;font-weight:800;">Dashboard</h1><p style="color:var(--text-muted);font-size:0.9rem;">Welcome back! Here's today's overview.</p></div>
      <div style="display:flex;gap:12px;">
        <button class="btn btn-secondary btn-sm" onclick="switchSection('orders')"><i class="fas fa-list"></i> View Orders</button>
        <button class="btn btn-primary btn-sm" id="addItemBtn"><i class="fas fa-plus"></i> Add Item</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div style="display:flex;justify-content:space-between;align-items:flex-start;"><div><div class="stat-card-label">Total Revenue</div><div class="stat-card-value" style="color:var(--accent-orange);">₹${(stats.total_revenue||0).toLocaleString('en-IN')}</div></div><div style="width:44px;height:44px;border-radius:12px;background:rgba(255,107,53,0.15);display:flex;align-items:center;justify-content:center;color:var(--accent-orange);"><i class="fas fa-indian-rupee-sign"></i></div></div></div>
      <div class="stat-card"><div style="display:flex;justify-content:space-between;align-items:flex-start;"><div><div class="stat-card-label">Orders Today</div><div class="stat-card-value" style="color:var(--accent-green);">${stats.orders_today||0}</div></div><div style="width:44px;height:44px;border-radius:12px;background:rgba(6,214,160,0.15);display:flex;align-items:center;justify-content:center;color:var(--accent-green);"><i class="fas fa-shopping-bag"></i></div></div></div>
      <div class="stat-card"><div style="display:flex;justify-content:space-between;align-items:flex-start;"><div><div class="stat-card-label">Active Customers</div><div class="stat-card-value" style="color:var(--accent-blue);">${stats.active_customers||0}</div></div><div style="width:44px;height:44px;border-radius:12px;background:rgba(17,138,178,0.15);display:flex;align-items:center;justify-content:center;color:var(--accent-blue);"><i class="fas fa-users"></i></div></div></div>
    </div>
    <div class="card" style="padding:24px;margin-top:32px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-weight:700;">Recent Orders</h3>
        <button class="btn btn-secondary btn-sm" onclick="switchSection('orders')">View All</button>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th></tr></thead>
        <tbody id="dashOrdersBody"></tbody></table>
      </div>
    </div>`;
  
  renderOrderRows(document.getElementById('dashOrdersBody'), orders.slice(0, 10));
  document.getElementById('addItemBtn')?.addEventListener('click', showAddItemModal);
}

// ===== ORDERS SECTION =====
async function renderOrders(container) {
  let orders = liveOrders;
  if (token && !orders.length) {
    try {
      const r = await fetch(`${API}/admin/orders`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); if (d.orders) orders = d.orders; liveOrders = orders; }
    } catch {}
  }
  if (!orders.length) orders = liveOrders;

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;">
      <div><h1 style="font-size:1.75rem;font-weight:800;">Orders</h1><p style="color:var(--text-muted);font-size:0.9rem;">Manage incoming and past orders. Update status in real time.</p></div>
      <button class="btn btn-secondary btn-sm" onclick="switchSection('dashboard')"><i class="fas fa-arrow-left"></i> Dashboard</button>
    </div>
    <div class="card" style="padding:24px;">
      <div style="overflow-x:auto;">
        <table class="data-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th></tr></thead>
        <tbody id="allOrdersBody"></tbody></table>
      </div>
    </div>`;
  renderOrderRows(document.getElementById('allOrdersBody'), orders);
}

function renderOrderRows(tbody, orders) {
  if (!tbody) return;
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No orders found</td></tr>';
    return;
  }

  const statusColors = {
    placed: { bg: 'rgba(108,117,125,0.15)', color: '#6c757d', icon: '📋' },
    confirmed: { bg: 'rgba(6,214,160,0.15)', color: '#06d6a0', icon: '✅' },
    preparing: { bg: 'rgba(255,183,77,0.15)', color: '#ffb74d', icon: '🔥' },
    food_prepared: { bg: 'rgba(17,138,178,0.15)', color: '#118ab2', icon: '🍽️' },
    served: { bg: 'rgba(6,214,160,0.2)', color: '#06d6a0', icon: '✅' },
    cancelled: { bg: 'rgba(231,76,60,0.15)', color: '#e74c3c', icon: '❌' }
  };

  const statusLabels = {
    placed: 'Placed', confirmed: 'Confirmed', preparing: 'Preparing',
    food_prepared: 'Food Ready', served: 'Served', cancelled: 'Cancelled'
  };

  tbody.innerHTML = orders.map(o => {
    const s = statusColors[o.status] || statusColors.placed;
    const isLocked = ['cancelled', 'served'].includes(o.status);
    const itemsText = o.items_text || 'No items';
    const shortItems = itemsText.length > 35 ? itemsText.substring(0, 35) + '…' : itemsText;

    return `<tr style="${isLocked ? 'opacity:0.7;' : ''}">
      <td style="font-weight:600;">#ORD-${o.order_id || o.id}</td>
      <td>${o.customer_name || o.customer || 'Customer'}</td>
      <td title="${itemsText}" style="max-width:200px;cursor:default;">
        <span style="font-size:0.85rem;">${shortItems}</span>
      </td>
      <td style="font-weight:700;color:var(--accent-orange);">₹${o.final_amount || o.total}</td>
      <td>
        ${isLocked
          ? `<span style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:50px;font-size:0.75rem;font-weight:700;background:${s.bg};color:${s.color};">
              ${s.icon} ${statusLabels[o.status]}
            </span>`
          : `<select class="order-status-select" data-id="${o.order_id || o.id}"
              style="padding:6px 10px;font-size:0.75rem;font-weight:600;border-radius:50px;border:1px solid ${s.color}33;
              background:${s.bg};color:${s.color};cursor:pointer;outline:none;min-width:150px;
              appearance:auto;">
              <option value="placed" ${o.status==='placed'?'selected':''}>📋 Placed</option>
              <option value="confirmed" ${o.status==='confirmed'?'selected':''}>✅ Confirmed</option>
              <option value="preparing" ${o.status==='preparing'?'selected':''}>🔥 Preparing</option>
              <option value="food_prepared" ${o.status==='food_prepared'?'selected':''}>🍽️ Food Ready</option>
              <option value="served" ${o.status==='served'?'selected':''}>✅ Served</option>
              <option value="cancelled" ${o.status==='cancelled'?'selected':''}>❌ Cancelled</option>
            </select>`
        }
      </td>
      <td style="color:var(--text-muted);font-size:0.85rem;">${o.time || (o.created_at ? new Date(o.created_at).toLocaleString() : '')}</td>
    </tr>`;
  }).join('');

  // Bind status change handlers (only for non-locked selects)
  document.querySelectorAll('.order-status-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const status = e.target.value;
      if (token) {
        try {
          const res = await fetch(`${API}/admin/orders/${id}/status`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status })
          });
          if (res.ok) {
            showToast(`Order #${id} → ${status.replace('_',' ')}`);
            // Refresh to update UI colors
            const currentSection = document.querySelector('.sidebar-nav a.active')?.dataset.section || 'dashboard';
            liveOrders = [];
            switchSection(currentSection);
          } else {
            const err = await res.json();
            showToast(err.error || 'Failed to update');
            // Revert select
            liveOrders = [];
            const currentSection = document.querySelector('.sidebar-nav a.active')?.dataset.section || 'dashboard';
            switchSection(currentSection);
          }
        } catch { showToast('Error updating status'); }
      } else {
        showToast('Unauthorized: Please login');
      }
    });
  });
}

// ===== MENU ITEMS SECTION =====
async function renderMenuItems(container) {
  let items = liveMenuItems;
  if (token) {
    try {
      const r = await fetch(`${API}/menu`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); if (d.menu_items) items = d.menu_items; liveMenuItems = items; }
    } catch {}
  }

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;">
      <div><h1 style="font-size:1.75rem;font-weight:800;">Menu Items</h1><p style="color:var(--text-muted);font-size:0.9rem;">Manage your restaurant's food items.</p></div>
      <button class="btn btn-primary btn-sm" id="addItemBtnMenu"><i class="fas fa-plus"></i> Add Item</button>
    </div>
    <div class="card" style="padding:24px;">
      <div style="overflow-x:auto;">
        <table class="data-table"><thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Type</th><th>Actions</th></tr></thead>
        <tbody>
          ${items.map(i => `<tr>
            <td>#${i.id}</td>
            <td style="font-weight:600;">${i.name}</td>
            <td>${i.category || i.cuisine || '-'}</td>
            <td style="font-weight:700;color:var(--accent-orange);">₹${i.price}</td>
            <td>${i.is_veg ? '<span style="color:var(--accent-green);">🟢 Veg</span>' : '<span style="color:#e74c3c;">🔴 Non-Veg</span>'}</td>
            <td><button class="btn btn-secondary btn-sm" onclick="deleteMenuItem(${i.id})"><i class="fas fa-trash"></i></button></td>
          </tr>`).join('')}
        </tbody></table>
      </div>
      ${!items.length ? '<p style="text-align:center;padding:40px;color:var(--text-muted);">No menu items found. Add some!</p>' : ''}
    </div>`;
  document.getElementById('addItemBtnMenu')?.addEventListener('click', showAddItemModal);
}

async function deleteMenuItem(id) {
  if (!confirm('Delete this menu item?')) return;
  if (token) {
    try {
      const r = await fetch(`${API}/admin/menu/${id}`, { method:'DELETE', headers:{'Authorization':`Bearer ${token}`} });
      if (r.ok) { showToast('Item deleted'); switchSection('menu-items'); return; }
    } catch {}
  }
  showToast('Failed to delete item');
}

// ===== CUSTOMERS SECTION =====
async function renderCustomers(container) {
  let customers = [];
  if (token) {
    try {
      const r = await fetch(`${API}/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); }
    } catch {}
  }
  // Use order data to derive customer info
  const customerMap = {};
  liveOrders.forEach(o => {
    const name = o.customer_name || o.customer || 'Unknown';
    if (!customerMap[name]) customerMap[name] = { name, orders: 0, total: 0, email: o.customer_email || '-' };
    customerMap[name].orders++;
    customerMap[name].total += parseFloat(o.final_amount || o.total || 0);
  });
  customers = Object.values(customerMap);

  container.innerHTML = `
    <div style="margin-bottom:32px;"><h1 style="font-size:1.75rem;font-weight:800;">Customers</h1><p style="color:var(--text-muted);font-size:0.9rem;">View customer activity and order history.</p></div>
    <div class="card" style="padding:24px;">
      <div style="overflow-x:auto;">
        <table class="data-table"><thead><tr><th>Customer</th><th>Email</th><th>Total Orders</th><th>Total Spent</th></tr></thead>
        <tbody>
          ${customers.map(c => `<tr>
            <td style="font-weight:600;">${c.name}</td>
            <td>${c.email}</td>
            <td>${c.orders}</td>
            <td style="font-weight:700;color:var(--accent-orange);">₹${c.total.toFixed(0)}</td>
          </tr>`).join('')}
        </tbody></table>
      </div>
      ${!customers.length ? '<p style="text-align:center;padding:40px;color:var(--text-muted);">Customer data is derived from orders. Place some orders first!</p>' : ''}
    </div>`;
}

// ===== PAYMENTS SECTION =====
async function renderPayments(container) {
  let payments = [];
  if (token) {
    try {
      const r = await fetch(`${API}/admin/orders`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); if (d.orders) payments = d.orders.filter(o => o.payment_status); }
    } catch {}
  }
  if (!payments.length) payments = liveOrders;

  container.innerHTML = `
    <div style="margin-bottom:32px;"><h1 style="font-size:1.75rem;font-weight:800;">Payments</h1><p style="color:var(--text-muted);font-size:0.9rem;">Track all Razorpay transactions.</p></div>
    <div class="card" style="padding:24px;">
      <div style="overflow-x:auto;">
        <table class="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Payment Status</th><th>Method</th></tr></thead>
        <tbody>
          ${payments.map(p => `<tr>
            <td style="font-weight:600;">#ORD-${p.order_id||p.id}</td>
            <td>${p.customer_name||p.customer||'-'}</td>
            <td style="font-weight:700;color:var(--accent-orange);">₹${p.final_amount||p.total||0}</td>
            <td><span class="order-status ${p.payment_status==='captured'?'status-delivered':'status-preparing'}" style="font-size:0.75rem;">${p.payment_status||'pending'}</span></td>
            <td>${p.payment_method||'Razorpay'}</td>
          </tr>`).join('')}
        </tbody></table>
      </div>
    </div>`;
}

// ===== AI CHATBOT SECTION =====
function renderChatbot(container) {
  container.innerHTML = `
    <div style="margin-bottom:32px;"><h1 style="font-size:1.75rem;font-weight:800;">AI Chatbot</h1><p style="color:var(--text-muted);font-size:0.9rem;">RAG-powered food recommendation engine (Gemini + ChromaDB).</p></div>
    <div class="card" style="padding:24px;max-width:600px;">
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;" id="adminChatMsgs">
        <div class="chat-msg bot">Hey! 👋 I'm the FoodFlash AI assistant. Ask me about menu recommendations, popular dishes, or dietary options.</div>
      </div>
      <div style="display:flex;gap:8px;">
        <input class="form-input" id="adminChatInput" placeholder="Ask about food..." style="flex:1;">
        <button class="btn btn-primary" id="adminChatSend"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>`;
  document.getElementById('adminChatSend')?.addEventListener('click', async () => {
    const input = document.getElementById('adminChatInput');
    const msg = input.value.trim();
    if (!msg) return;
    const msgs = document.getElementById('adminChatMsgs');
    msgs.innerHTML += `<div class="chat-msg user">${msg}</div>`;
    input.value = '';
    try {
      const r = await fetch(`${API}/chatbot/ask`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message:msg}) });
      const d = await r.json();
      msgs.innerHTML += `<div class="chat-msg bot">${d.response || d.message || 'Sorry, I could not process that.'}</div>`;
    } catch {
      msgs.innerHTML += `<div class="chat-msg bot">I'm having trouble connecting. Make sure GEMINI_API_KEY is set in .env!</div>`;
    }
    msgs.scrollTop = msgs.scrollHeight;
  });
  document.getElementById('adminChatInput')?.addEventListener('keypress', (e) => { if (e.key==='Enter') document.getElementById('adminChatSend')?.click(); });
}

// ===== DATABASE SECTION =====
function renderDatabase(container) {
  container.innerHTML = `
    <div style="margin-bottom:32px;"><h1 style="font-size:1.75rem;font-weight:800;">Database</h1><p style="color:var(--text-muted);font-size:0.9rem;">MySQL 8.0 — Single restaurant, 3NF normalized, 6 tables, InnoDB engine.</p></div>
    <div class="card" style="padding:24px;">
      <h3 style="margin-bottom:16px;font-weight:700;">Schema Tables</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
        ${['users','restaurants','menu_items','orders','order_items','payments'].map(t => `
          <div style="padding:16px;border-radius:12px;background:var(--bg-glass);border:1px solid var(--border-glass);">
            <div style="font-weight:700;margin-bottom:4px;"><i class="fas fa-table" style="color:var(--accent-orange);"></i> ${t}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${{
              users:'Roles: customer, admin | email, phone',
              restaurants:'Single entry — name, cuisine, rating',
              menu_items:'FK→restaurants | price, category, veg',
              orders:'FK→users | total, tax, discount, status',
              order_items:'Junction (order↔menu) | qty, price',
              payments:'Razorpay IDs, signature, method'
            }[t]}</div>
          </div>`).join('')}
      </div>
      <h3 style="margin:24px 0 16px;font-weight:700;">Stored Procedures</h3>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${['place_order()','complete_payment()','update_order_status()','get_dashboard_stats()'].map(p => 
          `<span style="padding:6px 14px;border-radius:8px;background:rgba(255,107,53,0.1);color:var(--accent-orange);font-size:0.85rem;font-weight:600;">${p}</span>`
        ).join('')}
      </div>
      <h3 style="margin:24px 0 16px;font-weight:700;">Triggers</h3>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${['trg_prevent_invalid_cancel','trg_validate_order_amount'].map(t => 
          `<span style="padding:6px 14px;border-radius:8px;background:rgba(6,214,160,0.1);color:var(--accent-green);font-size:0.85rem;font-weight:600;">${t}</span>`
        ).join('')}
      </div>
    </div>

    <div class="card" style="padding:24px;margin-top:24px;">
      <h3 style="margin-bottom:8px;font-weight:700;"><i class="fas fa-tools" style="color:var(--accent-orange);"></i> Data Management</h3>
      <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:20px;">Danger zone — these actions permanently delete data from the database.</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;">
        <button id="btnClearOrders" style="padding:12px 24px;border-radius:12px;border:1px solid rgba(231,76,60,0.4);background:rgba(231,76,60,0.1);color:#e74c3c;font-weight:700;font-size:0.85rem;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s;">
          <i class="fas fa-trash-alt"></i> Delete All Orders
        </button>
        <button id="btnClearCustomers" style="padding:12px 24px;border-radius:12px;border:1px solid rgba(231,76,60,0.4);background:rgba(231,76,60,0.1);color:#e74c3c;font-weight:700;font-size:0.85rem;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s;">
          <i class="fas fa-users-slash"></i> Delete All Customers
        </button>
      </div>
    </div>`;

  // Bind delete buttons
  document.getElementById('btnClearOrders')?.addEventListener('click', async () => {
    if (!confirm('⚠️ Are you sure? This will permanently delete ALL orders, order items, and payments from the database.')) return;
    if (!confirm('This cannot be undone. Type YES to confirm.')) return;
    try {
      const res = await fetch(`${API}/admin/clear/orders`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) { showToast('All orders deleted successfully'); switchSection('dashboard'); }
      else showToast(data.error || 'Failed to delete orders');
    } catch { showToast('Error deleting orders'); }
  });

  document.getElementById('btnClearCustomers')?.addEventListener('click', async () => {
    if (!confirm('⚠️ Are you sure? This will permanently delete ALL customer accounts and their orders/payments.')) return;
    if (!confirm('This cannot be undone. Type YES to confirm.')) return;
    try {
      const res = await fetch(`${API}/admin/clear/customers`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) { showToast('All customer accounts deleted'); switchSection('dashboard'); }
      else showToast(data.error || 'Failed to delete customers');
    } catch { showToast('Error deleting customers'); }
  });
}

// ===== ADD ITEM MODAL =====
function showAddItemModal() {
  const existing = document.getElementById('addItemModal');
  if (existing) { existing.remove(); return; }

  const modal = document.createElement('div');
  modal.id = 'addItemModal';
  Object.assign(modal.style, {
    position:'fixed', inset:'0', background:'rgba(0,0,0,0.6)', display:'flex',
    alignItems:'center', justifyContent:'center', zIndex:'10000', backdropFilter:'blur(8px)'
  });
  modal.innerHTML = `
    <div style="background:var(--bg-card);border-radius:20px;padding:32px;max-width:480px;width:90%;border:1px solid var(--border-glass);">
      <h3 style="margin-bottom:24px;">Add Menu Item</h3>
      <form id="addItemForm">
        <div class="form-group"><label>Item Name</label><input class="form-input" id="aiName" required placeholder="e.g. Chicken Tikka"></div>
        <div class="form-group"><label>Description</label><input class="form-input" id="aiDesc" placeholder="Juicy tandoori chicken"></div>
        <div class="form-group"><label>Price (₹)</label><input class="form-input" type="number" id="aiPrice" required placeholder="299"></div>
        <div class="form-group"><label>Category</label>
          <select class="form-input" id="aiCategory">
            <option value="north-indian">North Indian</option><option value="south-indian">South Indian</option>
            <option value="italian">Italian</option><option value="chinese">Chinese</option><option value="american">American</option>
            <option value="desserts">Desserts</option><option value="beverages">Beverages</option>
          </select>
        </div>
        <div class="form-group"><label>Image URL (optional)</label><input class="form-input" id="aiImg" placeholder="https://..."></div>
        <div class="form-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" id="aiVeg" style="accent-color:var(--accent-green);"> Vegetarian
        </label></div>
        <div style="display:flex;gap:12px;margin-top:24px;">
          <button type="button" class="btn btn-secondary" style="flex:1;" onclick="document.getElementById('addItemModal').remove()">Cancel</button>
          <button type="submit" class="btn btn-primary" style="flex:1;"><i class="fas fa-plus"></i> Add Item</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  document.getElementById('addItemForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemData = {
      name: document.getElementById('aiName').value,
      description: document.getElementById('aiDesc')?.value || '',
      price: parseFloat(document.getElementById('aiPrice').value),
      category: document.getElementById('aiCategory').value,
      is_veg: document.getElementById('aiVeg').checked,
      image_url: document.getElementById('aiImg')?.value || '',
      restaurant_id: 1
    };

    if (token) {
      try {
        const r = await fetch(`${API}/admin/menu`, {
          method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
          body: JSON.stringify(itemData)
        });
        if (r.ok) { showToast('✅ Menu item added successfully!'); modal.remove(); switchSection('menu-items'); return; }
        else { const err = await r.json(); showToast(err.error || 'Failed to add item'); }
      } catch { showToast('Error connecting to server'); }
    } else {
      showToast('Unauthorized: Please login');
    }
    modal.remove();
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar click handling
  document.querySelectorAll('.sidebar-nav a[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchSection(link.dataset.section);
    });
  });

  // Load dashboard by default
  const content = document.querySelector('.admin-content');
  if (content) renderDashboard(content);
});
