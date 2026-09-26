const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  getUserActivity,
  updateUserStatus,
  deleteUser,
  getDashboardStats,
  addToWishlist,
  getWishlist,
  getAllDealers,
  getDealerActivity,
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
router.get('/dealers/:id/activity', protect, admin, getDealerActivity);
router.put('/dealers/:id', protect, admin, updateDealer);
router.put('/dealers/:id/demote', protect, admin, demoteDealer);
router.get('/', protect, admin, getAllUsers);
// Declared before "/:id" so the literal segment is never read as an id.
router.get('/:id/activity', protect, admin, getUserActivity);
router.put('/:id/status', protect, admin, updateUserStatus);
router.get('/:id', protect, admin, getUserById);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
