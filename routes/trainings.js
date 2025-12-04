const express = require("express");
const router = express.Router();
const { requireAuth, applyGeographicalFilter, requireAnyRole } = require("../middlewares/auth");
const { autoGenerateSessionCode } = require('../middlewares/sessionCode');
const { validateTrainingCreation } = require('../middlewares/validation');
const wrapAsync = require("../util/wrapAsync.js");
const trainingController = require("../controllers/trainings.js");


router.route("/")
       .get(requireAuth, applyGeographicalFilter, 
        wrapAsync(trainingController.getTrainingSessions));

router.route('/')
  .post(
  requireAuth,
  requireAnyRole(['trainer']),
  validateTrainingCreation,
  autoGenerateSessionCode,
  wrapAsync(trainingController.createTrainingSession)
);


module.exports = router;