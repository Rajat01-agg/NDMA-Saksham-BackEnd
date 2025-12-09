const User = require("../models/User");

module.exports.checkTraineeEligibility = async (req, res, next) => {
    try {
        const userId = req.user.id; // From JWT

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const e = user.trainingEligibility;

        if (!e) {
            return res.status(400).json({
                success: false,
                message: "Eligibility parameters not submitted"
            });
        }

        let issues = [];

        // 1. AGE
        if (e.age < 18) issues.push("Age below minimum requirement");
        if (e.age > 45) issues.push("Above 45 allowed only for administrative roles");

        // 2. HEIGHT
        if (user.gender === "male" && e.height_cm < 158)
            issues.push("Height requirement not met (Male ≥ 158 cm)");
        if (user.gender === "female" && e.height_cm < 152)
            issues.push("Height requirement not met (Female ≥ 152 cm)");

        // 3. WEIGHT
        if (e.weight_kg < 48) issues.push("Minimum weight must be ≥ 48 kg");

        // 4. VISION
        const allowedVision = ["6/6", "6/9"];

        if (!allowedVision.includes(e.vision_left))
            issues.push("Left eye vision must be 6/6 or 6/9");
        if (!allowedVision.includes(e.vision_right))
            issues.push("Right eye vision must be 6/6 or 6/9");
        if (e.color_blindness === true)
            issues.push("Color blindness not allowed");

        // 5. HEARING
        if (e.hearing_distance_m < 6)
            issues.push("Must hear whisper at minimum 6 meters");

        // 6. MEDICAL CONDITIONS
        if (e.medical.heart_disease) issues.push("Heart disease disqualifies candidate");
        if (e.medical.uncontrolled_bp) issues.push("Uncontrolled BP disqualifies candidate");
        if (e.medical.asthma_moderate_or_severe) issues.push("Moderate/Severe asthma disqualifies candidate");
        if (e.medical.epilepsy) issues.push("Epilepsy disqualifies candidate");
        if (e.medical.major_orthopedic_issue) issues.push("Orthopedic issue disqualifies candidate");

        // ❌ If any issue found
        if (issues.length > 0) {
            return res.status(403).json({
                success: false,
                eligible: false,
                message: "Trainee is NOT eligible for field disaster training",
                reasons: issues
            });
        }

        // ✔ Eligible
        req.user.is_eligible = true;

        next();
    } catch (error) {
        console.error("Eligibility check error:", error);
        res.status(500).json({
            success: false,
            message: "Eligibility check failed"
        });
    }
};
