// routes/reports.js
const express = require("express");
const router = express.Router();

const {
  requireAuth,
  requireAnyRole,
  applyGeographicalFilter,
} = require("../middlewares/auth"); // adjust path to your auth.js

const {isReportOwnerOrNdma} = require("../middlewares/isOwner");
const wrapAsync = require("../util/wrapAsync");  // same as trainings.js

const Report = require("../models/Report");
const reportController = require("../controllers/report");

// 🔐 Sab reports APIs JWT protected + role protected
router.use(requireAuth);
router.use(requireAnyRole(["ndma_admin", "sdma_admin"]));

/**
 * Generate training summary PDF report
 * POST /api/reports/generate
 */
router.post(
  "/generate",
  applyGeographicalFilter, // sets req.geoFilter based on user role
  wrapAsync(reportController.generateReport)
);

/**
 * Get current user's own reports
 * GET /api/reports
 */
router.get("/", wrapAsync(reportController.getMyReports));

/**
 * Download a report (only owner)
 * GET /api/reports/:id/download
 *
 * Yahan do options hain:
 *  1) isOwner middleware use karo, jo Report lekar owner check kare
 *  2) ya controller ke andar owner check rakho (already hai)
 *
 * Neeche assumption: isOwner(Model, ownerField) jaisa signature hai
 */
router.get(
  "/:id/download",
  isReportOwnerOrNdma,
  wrapAsync(reportController.downloadReport)
);

module.exports = router;

