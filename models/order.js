const { v4: uuidv4 } = require('uuid');
const Cart = require('./cart');

// In-memory orders storage
const orders = [];

function placeOrder(customerInfo, sessionId = 'default') {
  const cart = Cart.getCart(sessionId);

  if (!cart.items || cart.items.length === 0) {
    return { error: 'Cart is empty' };
  }

  const order = {
    id: uuidv4(),
    orderNumber: `FC-${Date.now().toString(36).toUpperCase()}`,
    customer: {
      name: customerInfo.name || 'Guest',
      email: customerInfo.email || '',
      phone: customerInfo.phone || '',
      address: customerInfo.address || ''
    },
    items: [...cart.items],
    totalItems: cart.totalItems,
    totalPrice: cart.totalPrice,
    status: 'confirmed',
    placedAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
  };

  orders.push(order);

  // Clear the cart after placing order
  Cart.clearCart(sessionId);

  return { success: true, order };
}

function getAll() {
  return orders.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
}

function getById(id) {
  return orders.find(o => o.id === id) || null;
}

module.exports = { placeOrder, getAll, getById };
