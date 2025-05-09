const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');

/**
 * @route   GET /auth/verify
 * @desc    Verify if user is authorized
 * @access  Private
 */
router.get('/verify', auth, async (req, res) => {
  try {
    // If we get here, the user is authenticated and approved
    // (auth middleware already checked this)
    res.json({ 
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /auth/verify-admin
 * @desc    Verify if user is authorized as admin
 * @access  Private (admin only)
 */
router.get('/verify-admin', auth, authorize(['admin']), async (req, res) => {
  try {
    // If we get here, the user is authenticated and has admin role
    // (auth and authorize middleware already checked this)
    res.json({ 
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Error verifying admin:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 