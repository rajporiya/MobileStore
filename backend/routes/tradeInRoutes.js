const express = require('express');
const router = express.Router();
const {
  getDealers,
  createRequest,
  getMyRequests,
  getRequestById,
  getDealerRequests,
  approveRequest,
  rejectRequest,
  completeRequest,
  cancelRequest,
  getAllRequests,
  getDealerStats,
  deleteRequest,
} = require('../controllers/tradeInController');
const { protect, admin, dealer } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/dealers', getDealers);
router.get('/admin', protect, admin, getAllRequests);
router.get('/stats/dealer', protect, dealer, getDealerStats);
router.get('/my', protect, getMyRequests);
router.get('/dealer-requests', protect, dealer, getDealerRequests);
router.get('/:id', protect, getRequestById);

router.post('/', protect, upload.array('images', 5), createRequest);
router.put('/:id/approve', protect, dealer, approveRequest);
router.put('/:id/reject', protect, dealer, rejectRequest);
router.put('/:id/complete', protect, dealer, completeRequest);
router.put('/:id/cancel', protect, cancelRequest);
router.delete('/:id', protect, admin, deleteRequest);

module.exports = router;