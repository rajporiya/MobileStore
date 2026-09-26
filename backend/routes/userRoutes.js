const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  deleteUser,
  getDashboardStats,
  addToWishlist,
  getWishlist,
  getAllDealers,
  promoteToDealer,
  updateDealer,
  demoteDealer,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/stats', protect, admin, getDashboardStats);
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:productId', protect, addToWishlist);
router.get('/dealers', protect, admin, getAllDealers);
router.post('/dealers', protect, admin, promoteToDealer);
router.put('/dealers/:id', protect, admin, updateDealer);
router.put('/dealers/:id/demote', protect, admin, demoteDealer);
router.get('/', protect, admin, getAllUsers);
router.get('/:id', protect, admin, getUserById);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
