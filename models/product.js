const fs = require('fs');
const path = require('path');

let products = [];

function loadProducts() {
  const data = fs.readFileSync(path.join(__dirname, '..', 'data', 'products.json'), 'utf8');
  products = JSON.parse(data);
}

loadProducts();

function getAll() {
  return products;
}

function getById(id) {
  return products.find(p => p.id === id) || null;
}

function getByCategory(category) {
  return products.filter(p => p.category.toLowerCase() === category.toLowerCase());
}

function search(query) {
  const q = query.toLowerCase();
  return products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );
}

function getCategories() {
  return [...new Set(products.map(p => p.category))];
}

module.exports = { getAll, getById, getByCategory, search, getCategories };
