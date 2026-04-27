// ===== FoodFlash — Menu JS Module =====
var API = window.FOODFLASH_API || 'http://localhost:5000/api';
const DEMO = [];

let allMenuItems = [];
let activeCategory = 'all';
const menuGrid = document.getElementById('menuGrid');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('menuSearch');

async function fetchMenu() {
  try {
    const r = await fetch(`${API}/menu`);
    if (!r.ok) throw new Error();
    const d = await r.json();
    allMenuItems = d.menu_items || [];
    if (!allMenuItems.length) throw new Error();
  } catch { allMenuItems = DEMO; }
  renderMenu(allMenuItems);
}

function renderMenu(items) {
  if (!menuGrid) return;
  if (!items.length) { menuGrid.innerHTML=''; if(noResults) noResults.style.display='block'; return; }
  if(noResults) noResults.style.display='none';
  menuGrid.innerHTML = items.map(item => {
    const v = item.is_veg ?? item.veg, rest = item.restaurant_name||item.restaurant;
    const rat = item.restaurant_rating||item.rating||4.0, img = item.image_url||item.img;
    return `<div class="food-card" data-id="${item.id}">
      <div class="food-card-img">
        <img src="${img}" alt="${item.name}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'">
        <div class="food-card-badges">
          <span class="badge ${v?'badge-veg':'badge-nonveg'}">
            <i class="fas ${v?'fa-leaf':'fa-circle'}" style="font-size:${v?8:6}px;"></i> ${v?'Veg':'Non-Veg'}
          </span>
          ${rat>=4.7?'<span class="badge badge-popular"><i class="fas fa-fire"></i> Popular</span>':''}
        </div>
      </div>
      <div class="food-card-body">
        <div class="food-card-name">${item.name}</div>
        <div class="food-card-restaurant">${rest}</div>
        <div class="food-card-footer">
          <div class="food-card-price">₹${item.price}</div>
          <div class="food-card-rating"><i class="fas fa-star"></i> ${rat}</div>
        </div>
        <button class="btn btn-primary btn-sm" style="width:100%;margin-top:12px;" onclick="handleAddToCart(${item.id})">
          <i class="fas fa-plus"></i> Add to Cart
        </button>
      </div>
    </div>`;
  }).join('');
}

function filterMenu() {
  const s = searchInput?.value?.toLowerCase()||'';
  let f = allMenuItems;
  if (activeCategory==='veg') f = f.filter(i=>i.is_veg??i.veg);
  else if (activeCategory!=='all') f = f.filter(i=>i.category===activeCategory);
  if (s) f = f.filter(i=>i.name.toLowerCase().includes(s)||(i.restaurant_name||i.restaurant||'').toLowerCase().includes(s));
  renderMenu(f);
}

async function handleAddToCart(id) {
  const item = allMenuItems.find(i=>i.id===id);
  if (!item) return;
  const token = localStorage.getItem('foodflash_token');
  
  // Always save to localStorage as well for the cart page
  const cartItem = { id:item.id, name:item.name, price:item.price, restaurant:item.restaurant_name||item.restaurant||'FoodFlash', restaurant_id:item.restaurant_id||1, img:item.image_url||item.img||'', veg:item.is_veg??item.veg??false };
  const cart = JSON.parse(localStorage.getItem('foodflash_cart') || '[]');
  const existing = cart.find(c => c.id === id);
  if (existing) { existing.qty = (existing.qty || 1) + 1; }
  else { cart.push({ ...cartItem, qty: 1 }); }
  localStorage.setItem('foodflash_cart', JSON.stringify(cart));
  updateCartCount();
  
  if (token) {
    try {
      await fetch(`${API}/cart`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ item_id:item.id, quantity:1, item_data:cartItem })
      });
    } catch {}
  }
  showToast(`${item.name} added to cart!`);
}

document.querySelectorAll('.category-chip')?.forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.category-chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    activeCategory = chip.dataset.cat;
    filterMenu();
  });
});
searchInput?.addEventListener('input', filterMenu);
if (menuGrid) fetchMenu();
