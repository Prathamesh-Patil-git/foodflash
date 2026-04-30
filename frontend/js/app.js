// ===== FoodFlash — Shared App JS =====
const currentHost = window.location.hostname || 'localhost';
window.FOODFLASH_API = `http://${currentHost}:5000/api`;

// --- Theme: apply saved theme immediately to prevent flash ---
(function() {
  const saved = localStorage.getItem('foodflash_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();

// --- Navbar scroll effect ---
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 50);
});

// --- Theme toggle ---
const themeToggle = document.getElementById('themeToggle');
themeToggle?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('foodflash_theme', next);
});

// --- Mobile hamburger ---
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger?.addEventListener('click', () => {
  navLinks?.classList.toggle('open');
  hamburger.classList.toggle('active');
});

// --- Close mobile nav on link click ---
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => navLinks?.classList.remove('open'));
});

// --- Cart count from localStorage ---
function getCart() {
  try { return JSON.parse(localStorage.getItem('foodflash_cart') || '[]'); }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem('foodflash_cart', JSON.stringify(cart));
  updateCartCount();
}
function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + (i.qty || 1), 0);
  document.querySelectorAll('#navCartCount, .cart-count').forEach(el => {
    if (el) { el.textContent = total; el.style.display = total > 0 ? 'flex' : 'none'; }
  });
}
updateCartCount();

// --- Add to cart ---
async function addToCart(id) {
  let item = null;
  
  // Try to find it in the global menu items array (populated by menu.js)
  if (window.allMenuItems && window.allMenuItems.length > 0) {
    item = window.allMenuItems.find(i => i.id === id);
  }
  
  // If not found (e.g. called from homepage), fetch it from API
  if (!item) {
    try {
      var API = window.FOODFLASH_API || 'http://localhost:5000/api';
      const r = await fetch(`${API}/menu/${id}`);
      if (r.ok) {
        const d = await r.json();
        item = d.menu_item;
      }
    } catch (e) {
      console.error("Could not fetch item", e);
    }
  }

  if (!item) {
    showToast('Item not found');
    return;
  }

  // Normalize structure for cart
  const cartItem = {
    id: item.id,
    name: item.name,
    price: item.price,
    restaurant: 'FoodFlash Kitchen',
    img: item.image_url || item.img,
    veg: item.is_veg !== undefined ? item.is_veg : item.veg
  };

  const cart = getCart();
  const existing = cart.find(c => c.id === cartItem.id);
  if (existing) { existing.qty = (existing.qty || 1) + 1; }
  else { cart.push({ ...cartItem, qty: 1 }); }
  saveCart(cart);
  showToast(`${cartItem.name} added to cart!`);
}

// --- Toast notification ---
function showToast(message) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  Object.assign(toast.style, {
    position:'fixed', bottom:'100px', left:'50%', transform:'translateX(-50%)',
    background:'var(--accent-green)', color:'#fff', padding:'12px 24px',
    borderRadius:'50px', fontSize:'0.9rem', fontWeight:'600', zIndex:'9999',
    display:'flex', alignItems:'center', gap:'8px',
    animation:'slideUp 0.3s ease', boxShadow:'0 8px 32px rgba(6,214,160,0.3)',
    fontFamily:'var(--font)'
  });
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = '0.3s'; }, 2000);
  setTimeout(() => toast.remove(), 2500);
}

// --- Chatbot toggle (handled by chatbot.js if loaded, fallback here) ---
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('script[src*="chatbot.js"]')) {
    document.getElementById('chatbotToggle')?.addEventListener('click', () => {
      document.getElementById('chatbotWindow')?.classList.toggle('open');
    });
  }
});


// --- Intersection Observer for animations ---
const animateElements = document.querySelectorAll('.card, .food-card, .stat-card');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

animateElements.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});
