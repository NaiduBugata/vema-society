const express = require('express');
const router = express.Router();
const { 
    getMyProfile, 
    getDashboardSummary,
    getMyTransactions,
    getMyLoanDetails,
    getMySuretyView,
    updateMyProfile
} = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/me', getMyProfile);
router.get('/dashboard', getDashboardSummary);
router.get('/transactions', getMyTransactions);
router.get('/loan', getMyLoanDetails);
router.get('/sureties', getMySuretyView);
router.put('/update-profile', updateMyProfile);

module.exports = router;
