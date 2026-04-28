const Product = require('./product');

// In-memory cart storage (keyed by session — single-user demo uses 'default')
const carts = {};

function getCart(sessionId = 'default') {
  if (!carts[sessionId]) {
    carts[sessionId] = { items: [], updatedAt: new Date().toISOString() };
  }
  return carts[sessionId];
}

function addItem(productId, quantity = 1, sessionId = 'default') {
  const product = Product.getById(productId);
  if (!product) return { error: 'Product not found' };
  if (!product.inStock) return { error: 'Product is out of stock' };

  const cart = getCart(sessionId);
  const existing = cart.items.find(item => item.productId === productId);

  if (existing) {
    existing.quantity += quantity;
    existing.subtotal = +(existing.quantity * product.price).toFixed(2);
  } else {
    cart.items.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      emoji: product.emoji,
      quantity,
      subtotal: +(quantity * product.price).toFixed(2)
    });
  }

  cart.updatedAt = new Date().toISOString();
  return { success: true, cart: formatCart(cart) };
}

function updateItem(productId, quantity, sessionId = 'default') {
  const cart = getCart(sessionId);
  const item = cart.items.find(i => i.productId === productId);
  if (!item) return { error: 'Item not in cart' };

  if (quantity <= 0) {
    return removeItem(productId, sessionId);
  }

  item.quantity = quantity;
  item.subtotal = +(item.quantity * item.price).toFixed(2);
  cart.updatedAt = new Date().toISOString();
  return { success: true, cart: formatCart(cart) };
}

function removeItem(productId, sessionId = 'default') {
  const cart = getCart(sessionId);
  cart.items = cart.items.filter(i => i.productId !== productId);
  cart.updatedAt = new Date().toISOString();
  return { success: true, cart: formatCart(cart) };
}

function clearCart(sessionId = 'default') {
  carts[sessionId] = { items: [], updatedAt: new Date().toISOString() };
  return { success: true, cart: formatCart(carts[sessionId]) };
}

function formatCart(cart) {
  const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = +cart.items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2);
  return {
    items: cart.items,
    totalItems,
    totalPrice,
    updatedAt: cart.updatedAt
  };
}

module.exports = { getCart: (sid) => formatCart(getCart(sid)), addItem, updateItem, removeItem, clearCart };
