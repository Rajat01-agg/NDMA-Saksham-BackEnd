const fs = require("fs");
const Report = require("../models/Report");
const dataFetchService = require("../services/dataFetchService");
const pdfService = require("../services/pdfService");

// Abhi ke liye sirf training_summary support kar rahe hain
const ALLOWED_TYPES = ["training_summary"];

/**
 * POST /api/reports/generate
 * Body: { title, type, filters }
 * Middlewares:
 *  - requireAuth
 *  - requireAnyRole(['ndma_admin', 'sdma_admin'])
 *  - applyGeographicalFilter (sets req.geoFilter)
 */
module.exports.generateReport = async (req, res) => {
    const startTime = Date.now();
    const { title, type, filters = {} } = req.body;

    // Basic validation (role/geo already checked by middlewares)
    if (!type || !ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({
            success: false,
            message: `Invalid report type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
        });
    }

    if (!title || !title.trim()) {
        return res.status(400).json({
            success: false,
            message: "Report title is required",
        });
    }

    // Geo filter middleware se aayega (NDMA → {}, SDMA → restricted)
    const geoFilter = req.geoFilter || {};

    // 1) Training data + analytics lao
    const reportData = await dataFetchService.fetchReportData(
        type,
        filters,
        geoFilter
    );

    // 2) Report document create karo (initially generating)
    const userId = req.user.id || req.user._id;

    const reportDoc = await Report.create({
        title: title.trim(),
        type,
        generated_by: userId,
        generated_by_role: req.user.role,
        filters,
        status: "generating",
    });

    // 3) PDF generate karo
    const pdfPath = await pdfService.generateTrainingSummaryPDF(
        reportDoc,
        reportData
    );

    // 4) File stats nikaalo & DB update karo
    const stats = fs.statSync(pdfPath);

    reportDoc.status = "completed";
    reportDoc.file_path = pdfPath;
    reportDoc.file_size = stats.size;
    reportDoc.report_data = reportData; // optional: agar schema me field hai
    reportDoc.generation_time_ms = Date.now() - startTime;

    await reportDoc.save();

    return res.status(201).json({
        success: true,
        message: "Report generated successfully",
        data: {
            id: reportDoc._id,
            title: reportDoc.title,
            type: reportDoc.type,
            status: reportDoc.status,
            fileSize: reportDoc.file_size,
            createdAt: reportDoc.createdAt,
        },
    });
};

/**
 * GET /api/reports
 * Query: ?type=training_summary&status=completed&page=1&limit=20
 * Middlewares:
 *  - requireAuth
 *  - requireAnyRole(['ndma_admin', 'sdma_admin'])
 */
module.exports.getMyReports = async (req, res) => {
    const { type, status, page = 1, limit = 20 } = req.query;

    const userId = req.user.id || req.user._id;

    const query = {
        generated_by: userId,
    };

    if (type && type !== "all") {
        query.type = type;
    }

    if (status && status !== "all") {
        query.status = status;
    }

    const pageInt = parseInt(page, 10) || 1;
    const limitInt = parseInt(limit, 10) || 20;
    const skip = (pageInt - 1) * limitInt;

    const [reports, totalCount] = await Promise.all([
        Report.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitInt)
            .select("-report_data") // heavy field list me nahi bhejna
            .lean(),
        Report.countDocuments(query),
    ]);

    return res.json({
        success: true,
        count: reports.length,
        totalCount,
        currentPage: pageInt,
        totalPages: Math.ceil(totalCount / limitInt),
        data: reports,
    });
};

/**
 * GET /api/reports/:id/download
 * Middlewares:
 *  - requireAuth
 *  - requireAnyRole(['ndma_admin', 'sdma_admin'])
 *  - isOwner(Report, 'generated_by')  // optional, agar aise bana hai
 *
 * Agar isOwner file se report attach kar deta hai (req.report),
 * to controller aur bhi simple ho jayega.
 */
module.exports.downloadReport = async (req, res) => {
    // yahan aate-aate isReportOwnerOrNdma already access check kar chuka hoga
    const report = req.report;

    if (!report) {
        return res.status(500).json({
            success: false,
            message: "Report not attached to request",
        });
    }

    if (report.status !== "completed") {
        return res.status(400).json({
            success: false,
            message: `Report is not ready. Current status: ${report.status}`,
        });
    }

    if (!report.file_path) {
        return res.status(500).json({
            success: false,
            message: "Report file path is missing",
        });
    }

    if (!fs.existsSync(report.file_path)) {
        return res.status(500).json({
            success: false,
            message: "Report file not found on server",
        });
    }

    const safeName = report.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const downloadName = `${safeName || "report"}.pdf`;

    return res.download(report.file_path, downloadName);
};