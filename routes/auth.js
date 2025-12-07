const express = require('express');
const router = express.Router();
const {requireAuth} = require("../middlewares/auth");
const authController = require('../controllers/auth');
const wrapAsync = require('../util/wrapAsync');

router.route('/register')
    .post(wrapAsync(authController.register));

router.route('/login')
    .post(wrapAsync(authController.login));

router.route('/currentUser')
    .get(requireAuth, wrapAsync(authController.getCurrentUser));

router.route('/logout')
      .post(requireAuth, wrapAsync(authController.logout));

module.exports = router;