const express = require('express');
const router = express.Router();
const Order = require('../models/order');

// POST /api/orders — Place a new order
router.post('/', (req, res) => {
  const { name, email, phone, address } = req.body;
  const result = Order.placeOrder({ name, email, phone, address });
  if (result.error) return res.status(400).json(result);
  res.status(201).json(result);
});

// GET /api/orders — List all orders
router.get('/', (req, res) => {
  const orders = Order.getAll();
  res.json({ success: true, count: orders.length, orders });
});

// GET /api/orders/:id — Get single order
router.get('/:id', (req, res) => {
  const order = Order.getById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ success: true, order });
});

module.exports = router;
