const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Everything the admin panel needs that no single existing resource route
// provides. Resource CRUD stays on /api/products, /api/orders, /api/users,
// /api/categories and /api/tradein — this router only holds the cross-model
// read that the dashboard needs.
router.get('/dashboard', protect, admin, getDashboard);

module.exports = router;
