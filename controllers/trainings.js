const { TrainingSession } = require("../models");
const { District } = require("../models");

module.exports.getTrainingSessions =
    async (req, res) => {
        try {
            console.log('User accessing trainings:', {
                role: req.user.publicMetadata?.role,
                state: req.user.publicMetadata?.state,
                geoFilter: req.geoFilter
            });

            // Optimize query: sort and limit before populate for better performance
            const trainings = await TrainingSession.find(req.geoFilter)
                .sort({ start_date: -1 })
                .limit(10)
                .populate('trainer_id', 'name email')
                .populate('district_id', 'name state');

            res.json({
                success: true,
                count: trainings.length,
                data: trainings
            });
        } catch (error) {
            console.error('Error fetching trainings:', error);
            res.status(500).json({
                success: false,
                error: 'Server error - Not able to fetch trainings'
            });
        }
    };


module.exports.createTrainingSession = async (req, res, next) => {
    try {
        const trainer_id = req.user.id;

        if (!trainer_id) {
            const error = new Error('Trainer ID not found in user object');
            error.status = 400;
            throw error;
        }


        // Extract data from request body
        const {
            theme,
            start_date,
            end_date,
            venue_latitude,
            venue_longitude,
            ingestion_source = 'app',
            venue_address,
            description = ''
        } = req.body;

        const trainer_name = `${req.user.firstName} ${req.user.lastName}`;

        // Get district NAME from user profile
        const districtName = req.user.publicMetadata?.district; // e.g., "pune"

        if (!districtName) {
            const error = new Error('Trainer is not assigned to any district');
            error.status = 400;
            throw error;
        }

        // Find district by NAME, not ID
        const district = await District.findOne({ name: districtName });

        if (!district) {
            const error = new Error(`District "${districtName}" not found in database`);
            error.status = 400;
            throw error;
        }


        // Parse and validate dates
        const parsedStartDate = new Date(start_date);
        const parsedEndDate = new Date(end_date);

        if (isNaN(parsedStartDate.getTime())) {
            const error = new Error('Invalid start date format');
            error.status = 400;
            throw error;
        }

        if (isNaN(parsedEndDate.getTime())) {
            const error = new Error('Invalid end date format');
            error.status = 400;
            throw error;
        }

        // Create training session
        const trainingSession = new TrainingSession({
            trainer_id: trainer_id,

            theme,
            start_date: parsedStartDate,
            end_date: parsedEndDate,
            venue_latitude: parseFloat(venue_latitude),
            venue_longitude: parseFloat(venue_longitude),
            district_id: district._id,
            ingestion_source,
            venue_address,
            description,

            // Auto-generated fields (from middlewares)
            session_code: req.body.session_code, // From sessionCode middleware
            scheduled_at: new Date(),

            // Geo data
            geo_data: {
                actual_location: {
                    type: 'Point',
                    coordinates: [parseFloat(venue_longitude), parseFloat(venue_latitude)]
                },
                submitted_location: {
                    type: 'Point',
                    coordinates: [parseFloat(venue_longitude), parseFloat(venue_latitude)]
                },
                location_source: 'manual',
                distance_deviation_meters: 0,
                is_within_geofence: false
            },

            // Default values
            attendance_validation: {
                claimed_count: 0,
                ai_detected_count: 0,
                confidence_score: 0,
                is_flagged_discrepancy: false
            },
            media_evidence: [],
            verification_logs: [],
            status: 'scheduled',
            verification_status: 'unverified',
            verification_score: 0
        });

        console.log('Training session to save:', {
            trainer_id: trainingSession.trainer_id,
            theme: trainingSession.theme,
            district_id: trainingSession.district_id
        });

        // Save to database
        await trainingSession.save();

        // Success response
        res.status(201).json({
            success: true,
            message: 'Training session created successfully',
            data: {
                id: trainingSession._id,
                session_code: trainingSession.session_code,
                theme: trainingSession.theme,
                trainer: trainer_name,
                district: district.name,
                start_date: trainingSession.start_date,
                end_date: trainingSession.end_date,
                venue_address: trainingSession.venue_address,
                description: trainingSession.description,
                status: trainingSession.status,
                verification_status: trainingSession.verification_status,
                scheduled_at: trainingSession.scheduled_at
            }
        });

    } catch (error) {
        next(error);
    }
};