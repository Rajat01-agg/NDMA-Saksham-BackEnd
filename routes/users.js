const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');

// Define your user-related routes here, for example:
router.get('/', (req, res) => {
  res.send('User routes are working!');
});

// GET /api/users/profile - Current user ka profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.emailAddresses[0]?.emailAddress,
        role: user.publicMetadata?.role,
        state: user.publicMetadata?.state,
        district: user.publicMetadata?.district,
        profile_complete: true
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Profile fetch nahi ho paya'
    });
  }
});

module.exports = router;
