const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// GET /api/products — List all products
router.get('/', (req, res) => {
  const { category, search, sort } = req.query;

  let results = Product.getAll();

  if (category) {
    results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  if (sort === 'price-asc') results.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') results.sort((a, b) => b.price - a.price);
  if (sort === 'rating') results.sort((a, b) => b.rating - a.rating);
  if (sort === 'name') results.sort((a, b) => a.name.localeCompare(b.name));

  res.json({ success: true, count: results.length, products: results });
});

// GET /api/products/categories — List all categories
router.get('/categories', (req, res) => {
  res.json({ success: true, categories: Product.getCategories() });
});

// GET /api/products/:id — Get single product
router.get('/:id', (req, res) => {
  const product = Product.getById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ success: true, product });
});

module.exports = router;
