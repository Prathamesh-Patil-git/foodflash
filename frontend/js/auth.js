// ===== FoodFlash — Auth JS Module =====
// Handles login, registration, JWT storage, and auth state management

const API_BASE = window.FOODFLASH_API || 'http://localhost:5000/api';

// --- JWT Token management ---
function getToken() {
  return localStorage.getItem('foodflash_token');
}
function setToken(token) {
  localStorage.setItem('foodflash_token', token);
}
function removeToken() {
  localStorage.removeItem('foodflash_token');
}

// --- User data management ---
function getUser() {
  try { return JSON.parse(localStorage.getItem('foodflash_user') || 'null'); }
  catch { return null; }
}
function setUser(user) {
  localStorage.setItem('foodflash_user', JSON.stringify(user));
}
function removeUser() {
  localStorage.removeItem('foodflash_user');
}

// --- Check auth state ---
function isLoggedIn() {
  return !!getToken() && !!getUser();
}
function isAdmin() {
  const user = getUser();
  return user?.role === 'admin';
}

// --- Authenticated fetch wrapper ---
async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${url}`, { ...options, headers });
  // Handle expired token
  if (response.status === 401) {
    logout();
    return response;
  }
  return response;
}

// --- Login ---
async function handleLogin(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    setToken(data.token);
    setUser(data.user);
    showToast('Login successful! Redirecting...');

    // Redirect based on role
    setTimeout(() => {
      window.location.href = ['admin', 'restaurant'].includes(data.user.role) ? 'admin.html' : 'menu.html';
    }, 1000);
    return data;
  } catch (err) {
    showToast(err.message);
    throw err;
  }
}

// --- Register ---
async function handleRegister(name, email, password, phone) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    setToken(data.token);
    setUser(data.user);
    showToast('Account created! Redirecting...');
    setTimeout(() => { window.location.href = 'menu.html'; }, 1000);
    return data;
  } catch (err) {
    showToast(err.message);
    throw err;
  }
}



// --- Logout ---
function logout() {
  removeToken();
  removeUser();
  localStorage.removeItem('foodflash_cart');
  showToast('Logged out successfully');
  setTimeout(() => { window.location.href = 'login.html'; }, 800);
}

// --- Update navbar based on auth state ---
function updateAuthUI() {
  const user = getUser();
  const loginBtns = document.querySelectorAll('a[href="login.html"].btn');

  loginBtns.forEach(btn => {
    if (user) {
      btn.href = 'profile.html';
      btn.classList.add('logged-in');
      btn.innerHTML = '<i class="fas fa-user-circle"></i> My Profile';
    }
  });
}

// Run on every page
document.addEventListener('DOMContentLoaded', updateAuthUI);

// --- Bind login form ---
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const btn = e.target.querySelector('button[type="submit"]');

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

  try {
    await handleLogin(email, password);
  } catch {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
  }
});

// --- Bind register form ---
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('confirmPassword').value;
  const phone = document.getElementById('phone')?.value || '';
  // Address removed

  if (password !== confirm) {
    showToast('Passwords do not match');
    return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters');
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

  try {
    await handleRegister(name, email, password, phone);
  } catch {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
  }
});
