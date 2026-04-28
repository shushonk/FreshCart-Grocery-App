/* ============================================================
   FreshCart — Frontend Application (Agent 3 UI + Agent 4 Integration)
   ============================================================ */

const API = '';  // same origin

// ──── STATE ────
let allProducts = [];
let cart = { items: [], totalItems: 0, totalPrice: 0 };
let activeCategory = 'all';
let searchQuery = '';
let sortValue = 'default';

// ──── DOM REFS ────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  grid:          $('#products-grid'),
  empty:         $('#products-empty'),
  count:         $('#product-count'),
  catInner:      $('.categories__inner'),
  searchInput:   $('#search-input'),
  searchClear:   $('#search-clear'),
  sortSelect:    $('#sort-select'),
  cartBtn:       $('#cart-btn'),
  cartBadge:     $('#cart-badge'),
  cartOverlay:   $('#cart-overlay'),
  cartSidebar:   $('#cart-sidebar'),
  cartClose:     $('#cart-close'),
  cartBody:      $('#cart-body'),
  cartItems:     $('#cart-items'),
  cartEmpty:     $('#cart-empty'),
  cartFooter:    $('#cart-footer'),
  cartSubtotal:  $('#cart-subtotal'),
  cartTotal:     $('#cart-total'),
  checkoutBtn:   $('#checkout-btn'),
  clearCartBtn:  $('#clear-cart-btn'),
  checkoutOverlay: $('#checkout-overlay'),
  checkoutModal: $('#checkout-modal'),
  checkoutClose: $('#checkout-close'),
  checkoutForm:  $('#checkout-form'),
  checkoutItemsCount: $('#checkout-items-count'),
  checkoutTotal: $('#checkout-total'),
  placeOrderBtn: $('#place-order-btn'),
  orderLoader:   $('#order-loader'),
  confirmOverlay:$('#confirm-overlay'),
  confirmModal:  $('#confirm-modal'),
  confirmNumber: $('#confirm-order-number'),
  confirmDetails:$('#confirm-details'),
  confirmDoneBtn:$('#confirm-done-btn'),
  ordersBtn:     $('#orders-btn'),
  ordersOverlay: $('#orders-overlay'),
  ordersModal:   $('#orders-modal'),
  ordersClose:   $('#orders-close'),
  ordersList:    $('#orders-list'),
  ordersEmpty:   $('#orders-empty'),
  heroCta:       $('#hero-cta'),
  navbar:        $('#navbar'),
  toastContainer:$('#toast-container'),
};

// ──── INIT ────
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadProducts();
  await loadCart();
  renderCategories();
  renderProducts();
  bindEvents();
}

// ──── API CALLS ────
async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

async function loadProducts() {
  const data = await api('/api/products');
  allProducts = data.products || [];
}

async function loadCart() {
  const data = await api('/api/cart');
  cart = data.cart || { items: [], totalItems: 0, totalPrice: 0 };
  updateCartUI();
}

// ──── PRODUCT RENDERING ────
function getFilteredProducts() {
  let list = [...allProducts];
  if (activeCategory !== 'all') {
    list = list.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }
  if (sortValue === 'price-asc') list.sort((a, b) => a.price - b.price);
  if (sortValue === 'price-desc') list.sort((a, b) => b.price - a.price);
  if (sortValue === 'rating') list.sort((a, b) => b.rating - a.rating);
  if (sortValue === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function renderProducts() {
  const list = getFilteredProducts();
  dom.count.textContent = `${list.length} product${list.length !== 1 ? 's' : ''}`;

  if (list.length === 0) {
    dom.grid.classList.add('hidden');
    dom.empty.classList.remove('hidden');
    return;
  }
  dom.grid.classList.remove('hidden');
  dom.empty.classList.add('hidden');

  dom.grid.innerHTML = list.map((p, i) => {
    const inCart = cart.items.find(it => it.productId === p.id);
    const qty = inCart ? inCart.quantity : 0;
    return `
      <div class="product-card" style="animation-delay:${i * 40}ms" data-id="${p.id}">
        <div class="product-card__image">
          <span>${p.emoji}</span>
          ${!p.inStock ? '<span class="product-card__badge product-card__badge--oos">Out of Stock</span>' :
            `<span class="product-card__badge product-card__badge--rating">⭐ ${p.rating}</span>`}
        </div>
        <div class="product-card__body">
          <div class="product-card__category">${p.category}</div>
          <div class="product-card__name">${p.name}</div>
          <div class="product-card__desc">${p.description}</div>
        </div>
        <div class="product-card__footer">
          <div>
            <span class="product-card__price">$${p.price.toFixed(2)}</span>
            <span class="product-card__unit"> / ${p.unit}</span>
          </div>
          ${!p.inStock ?
            `<button class="product-card__add-btn disabled" disabled>—</button>` :
            qty > 0 ?
              `<div class="product-card__qty">
                <button class="product-card__qty-btn" onclick="updateCartQty('${p.id}', ${qty - 1})">−</button>
                <span class="product-card__qty-val">${qty}</span>
                <button class="product-card__qty-btn" onclick="updateCartQty('${p.id}', ${qty + 1})">+</button>
              </div>` :
              `<button class="product-card__add-btn" onclick="addToCart('${p.id}')">+</button>`
          }
        </div>
      </div>`;
  }).join('');
}

function renderCategories() {
  const cats = [...new Set(allProducts.map(p => p.category))];
  const emojis = { 'Fruits & Vegetables': '🥦', 'Dairy & Eggs': '🧀', 'Bakery': '🥐', 'Beverages': '☕', 'Snacks': '🍫', 'Meat & Seafood': '🥩' };

  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'category-chip';
    btn.dataset.category = cat;
    btn.innerHTML = `<span class="category-chip__emoji">${emojis[cat] || '📦'}</span><span>${cat}</span>`;
    btn.addEventListener('click', () => setCategory(cat));
    dom.catInner.appendChild(btn);
  });
}

function setCategory(cat) {
  activeCategory = cat === activeCategory ? 'all' : cat;
  $$('.category-chip').forEach(c => {
    c.classList.toggle('active',
      (activeCategory === 'all' && c.dataset.category === 'all') ||
      c.dataset.category === activeCategory
    );
  });
  if (activeCategory === 'all') {
    $('#cat-all').classList.add('active');
  } else {
    $('#cat-all').classList.remove('active');
  }
  renderProducts();
}

// ──── CART OPERATIONS ────
async function addToCart(productId) {
  const data = await api('/api/cart', { method: 'POST', body: { productId, quantity: 1 } });
  if (data.success) {
    cart = data.cart;
    updateCartUI();
    renderProducts();
    const product = allProducts.find(p => p.id === productId);
    showToast(`${product.emoji} ${product.name} added to cart`);
  }
}

async function updateCartQty(productId, newQty) {
  let data;
  if (newQty <= 0) {
    data = await api(`/api/cart/${productId}`, { method: 'DELETE' });
  } else {
    data = await api(`/api/cart/${productId}`, { method: 'PUT', body: { quantity: newQty } });
  }
  if (data.success) {
    cart = data.cart;
    updateCartUI();
    renderProducts();
    renderCartItems();
  }
}

async function clearCart() {
  const data = await api('/api/cart', { method: 'DELETE' });
  if (data.success) {
    cart = data.cart;
    updateCartUI();
    renderProducts();
    renderCartItems();
    showToast('🗑️ Cart cleared');
  }
}

function updateCartUI() {
  if (cart.totalItems > 0) {
    dom.cartBadge.textContent = cart.totalItems;
    dom.cartBadge.classList.remove('hidden');
  } else {
    dom.cartBadge.classList.add('hidden');
  }
}

function renderCartItems() {
  if (cart.items.length === 0) {
    dom.cartEmpty.classList.remove('hidden');
    dom.cartItems.innerHTML = '';
    dom.cartFooter.classList.add('hidden');
    return;
  }
  dom.cartEmpty.classList.add('hidden');
  dom.cartFooter.classList.remove('hidden');
  dom.cartSubtotal.textContent = `$${cart.totalPrice.toFixed(2)}`;
  dom.cartTotal.textContent = `$${cart.totalPrice.toFixed(2)}`;

  dom.cartItems.innerHTML = cart.items.map(item => `
    <div class="cart-item" data-id="${item.productId}">
      <div class="cart-item__emoji">${item.emoji}</div>
      <div class="cart-item__info">
        <div class="cart-item__name">${item.name}</div>
        <div class="cart-item__price">$${item.price.toFixed(2)} / ${item.unit}</div>
      </div>
      <div class="cart-item__controls">
        <button class="cart-item__btn" onclick="updateCartQty('${item.productId}', ${item.quantity - 1})">−</button>
        <span class="cart-item__qty">${item.quantity}</span>
        <button class="cart-item__btn" onclick="updateCartQty('${item.productId}', ${item.quantity + 1})">+</button>
      </div>
      <div class="cart-item__subtotal">$${item.subtotal.toFixed(2)}</div>
      <button class="cart-item__btn cart-item__btn--remove" onclick="updateCartQty('${item.productId}', 0)" aria-label="Remove">✕</button>
    </div>
  `).join('');
}

// ──── CART SIDEBAR TOGGLE ────
function openCart() {
  renderCartItems();
  dom.cartSidebar.classList.remove('hidden');
  dom.cartOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  dom.cartSidebar.classList.add('hidden');
  dom.cartOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// ──── CHECKOUT ────
function openCheckout() {
  closeCart();
  dom.checkoutItemsCount.textContent = `${cart.totalItems} item${cart.totalItems !== 1 ? 's' : ''}`;
  dom.checkoutTotal.textContent = `$${cart.totalPrice.toFixed(2)}`;
  dom.checkoutModal.classList.remove('hidden');
  dom.checkoutOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  dom.checkoutModal.classList.add('hidden');
  dom.checkoutOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

async function placeOrder(e) {
  e.preventDefault();
  const submitText = $('.checkout-form__submit-text');
  submitText.classList.add('hidden');
  dom.orderLoader.classList.remove('hidden');

  const body = {
    name: $('#checkout-name').value,
    email: $('#checkout-email').value,
    phone: $('#checkout-phone').value,
    address: $('#checkout-address').value,
  };

  const data = await api('/api/orders', { method: 'POST', body });

  submitText.classList.remove('hidden');
  dom.orderLoader.classList.add('hidden');

  if (data.success) {
    closeCheckout();
    dom.checkoutForm.reset();
    cart = { items: [], totalItems: 0, totalPrice: 0 };
    updateCartUI();
    renderProducts();
    showConfirmation(data.order);
  } else {
    showToast('❌ ' + (data.error || 'Order failed'));
  }
}

function showConfirmation(order) {
  dom.confirmNumber.textContent = order.orderNumber;
  dom.confirmDetails.innerHTML = `
    <p style="font-size:.85rem;color:var(--text-secondary);margin-top:8px;">
      ${order.totalItems} item${order.totalItems !== 1 ? 's' : ''} · <strong>$${order.totalPrice.toFixed(2)}</strong>
    </p>`;
  dom.confirmModal.classList.remove('hidden');
  dom.confirmOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeConfirmation() {
  dom.confirmModal.classList.add('hidden');
  dom.confirmOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// ──── ORDERS ────
async function openOrders() {
  dom.ordersModal.classList.remove('hidden');
  dom.ordersOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const data = await api('/api/orders');
  const orders = data.orders || [];

  if (orders.length === 0) {
    dom.ordersEmpty.classList.remove('hidden');
    dom.ordersList.querySelectorAll('.order-card').forEach(el => el.remove());
    return;
  }
  dom.ordersEmpty.classList.add('hidden');

  // Remove old cards, keep empty state element
  dom.ordersList.querySelectorAll('.order-card').forEach(el => el.remove());

  orders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';
    const date = new Date(order.placedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    card.innerHTML = `
      <div class="order-card__header">
        <span class="order-card__number">#${order.orderNumber}</span>
        <span class="order-card__status">${order.status}</span>
      </div>
      <div class="order-card__items">${order.items.map(i => `${i.emoji} ${i.name} ×${i.quantity}`).join(', ')}</div>
      <div class="order-card__footer">
        <span class="order-card__total">$${order.totalPrice.toFixed(2)}</span>
        <span class="order-card__date">${date}</span>
      </div>`;
    dom.ordersList.appendChild(card);
  });
}

function closeOrders() {
  dom.ordersModal.classList.add('hidden');
  dom.ordersOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// ──── TOAST ────
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ──── EVENT BINDINGS ────
function bindEvents() {
  // Navbar scroll shadow
  window.addEventListener('scroll', () => {
    dom.navbar.classList.toggle('scrolled', window.scrollY > 10);
  });

  // Search
  let searchTimeout;
  dom.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchQuery = e.target.value.trim();
    dom.searchClear.classList.toggle('hidden', !searchQuery);
    searchTimeout = setTimeout(() => renderProducts(), 250);
  });
  dom.searchClear.addEventListener('click', () => {
    dom.searchInput.value = '';
    searchQuery = '';
    dom.searchClear.classList.add('hidden');
    renderProducts();
  });

  // Sort
  dom.sortSelect.addEventListener('change', (e) => {
    sortValue = e.target.value;
    renderProducts();
  });

  // Cart sidebar
  dom.cartBtn.addEventListener('click', openCart);
  dom.cartClose.addEventListener('click', closeCart);
  dom.cartOverlay.addEventListener('click', closeCart);

  // Checkout
  dom.checkoutBtn.addEventListener('click', openCheckout);
  dom.checkoutClose.addEventListener('click', closeCheckout);
  dom.checkoutOverlay.addEventListener('click', closeCheckout);
  dom.checkoutForm.addEventListener('submit', placeOrder);

  // Clear cart
  dom.clearCartBtn.addEventListener('click', clearCart);

  // Confirmation
  dom.confirmDoneBtn.addEventListener('click', closeConfirmation);
  dom.confirmOverlay.addEventListener('click', closeConfirmation);

  // Orders
  dom.ordersBtn.addEventListener('click', openOrders);
  dom.ordersClose.addEventListener('click', closeOrders);
  dom.ordersOverlay.addEventListener('click', closeOrders);

  // Hero CTA
  dom.heroCta.addEventListener('click', () => {
    document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
  });

  // Category "All" chip
  $('#cat-all').addEventListener('click', () => {
    activeCategory = 'all';
    $$('.category-chip').forEach(c => c.classList.remove('active'));
    $('#cat-all').classList.add('active');
    renderProducts();
  });
}
