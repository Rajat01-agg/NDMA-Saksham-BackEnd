const express = require('express');
const router = express.Router();
const { requireAuth, requireAnyRole } = require('../middlewares/auth');
const wrapAsync = require('../util/wrapAsync');
const userController = require('../controllers/users');


// GET and UPDATE User Profile
router.route('/profile')
  .get(requireAuth, wrapAsync(userController.getUserProfile))
  .put(requireAuth, wrapAsync(userController.updateUserProfile));

//Admin 
router.route('/')
     .get(requireAuth,
      requireAnyRole(['ndma_admin', 'sdma_admin']),
      wrapAsync(userController.getAllUsers));


router.route('/:id')
       .get(requireAuth, wrapAsync(userController.getUserById))
       .put(requireAuth, wrapAsync(userController.updateUserById))
       .delete(requireAuth, wrapAsync(userController.deleteUserById))

module.exports = router;