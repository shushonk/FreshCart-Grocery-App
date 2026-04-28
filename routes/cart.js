const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');

// GET /api/cart — Get current cart
router.get('/', (req, res) => {
  const cart = Cart.getCart();
  res.json({ success: true, cart });
});

// POST /api/cart — Add item to cart
router.post('/', (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required' });
  const result = Cart.addItem(productId, quantity || 1);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// PUT /api/cart/:productId — Update item quantity
router.put('/:productId', (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined) return res.status(400).json({ error: 'quantity is required' });
  const result = Cart.updateItem(req.params.productId, quantity);
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

// DELETE /api/cart/:productId — Remove item from cart
router.delete('/:productId', (req, res) => {
  const result = Cart.removeItem(req.params.productId);
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

// DELETE /api/cart — Clear entire cart
router.delete('/', (req, res) => {
  const result = Cart.clearCart();
  res.json(result);
});

module.exports = router;
