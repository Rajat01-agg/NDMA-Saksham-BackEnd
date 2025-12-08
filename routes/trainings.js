const express = require("express");
const router = express.Router();
const { requireAuth, applyGeographicalFilter, requireAnyRole } = require("../middlewares/auth");
const { autoGenerateSessionCode } = require('../middlewares/sessionCode');
const { validateTrainingCreation, validateTrainingUpdate } = require('../middlewares/validation');
const {isOwnerOrAdmin} = require('../middlewares/isOwner');
const wrapAsync = require("../util/wrapAsync.js");
const trainingController = require("../controllers/trainings.js");

//show Training Sessions
router.route("/")
       .get(requireAuth, applyGeographicalFilter, 
        wrapAsync(trainingController.getTrainingSessions));

//create Training Session
router.route('/new')
  .post(
  requireAuth,
  requireAnyRole(['trainer']),
  validateTrainingCreation,
  autoGenerateSessionCode,
  wrapAsync(trainingController.createTrainingSession)
);

//show Training Session by ID
router.route('/:id')
    .get(requireAuth,
        requireAnyRole(['trainer', 'ndma_admin', 'sdma_admin']),
         wrapAsync(trainingController.getTrainingSessionById))
    .put(requireAuth,
        requireAnyRole(['trainer', 'ndma_admin', 'sdma_admin']),
        isOwnerOrAdmin,
        validateTrainingUpdate,
         wrapAsync(trainingController.updateTraining))
    .delete(requireAuth,
        requireAnyRole(['trainer', 'ndma_admin', 'sdma_admin']),
        isOwnerOrAdmin,
         wrapAsync(trainingController.deleteTraining));

         
module.exports = router;