const { TrainingSession } = require("../models");
const { District } = require("../models");
const { generateSessionCode } = require('../middlewares/sessionCode');

module.exports.getTrainingSessions = async (req, res) => {
            console.log('User accessing trainings:', {
                role: req.user.role,
                state: req.user.state,
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
        };


module.exports.createTrainingSession = async (req, res) => {
        // Use MongoDB user ID from JWT token
        const trainer_id = req.user.id;

        if (!trainer_id) {
            const error = new Error('User ID not found. Please ensure user is properly authenticated.');
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

        // Get district NAME from JWT user data
        const districtName = req.user.district; // Direct access from JWT token

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
};


module.exports.getTrainingSessionById = async (req, res) => {
        const { id } = req.params;

        console.log('Fetching training ID:', id);

        // Find training
        const training = await TrainingSession.findById(id);

        if (!training) {
            const error = new Error('Training session not found');
            error.status = 404;
            throw error;
        }

        // ✅ SIMPLE ACCESS: Koi bhi authenticated user dekh sakta hai
        // (Routes mein already requireAuth middleware hai)

        // Format response
        const response = {
            success: true,
            data: {
                id: training._id,
                session_code: training.session_code,
                theme: training.theme,
                start_date: training.start_date,
                end_date: training.end_date,
                venue_address: training.venue_address,
                description: training.description,
                venue_coordinates: training.geo_data?.submitted_location?.coordinates ? {
                    latitude: training.geo_data.actual_location.coordinates[1],
                    longitude: training.geo_data.actual_location.coordinates[0]
                } : null,
                status: training.status,
                verification_status: training.verification_status,
                scheduled_at: training.scheduled_at,
                created_at: training.createdAt,
                updated_at: training.updatedAt,
                // Trainer ID bhi dikhao (why hide it?)
                trainer_id: training.trainer_id
            }
        };

        res.json(response);
    };


module.exports.updateTraining = async (req, res) => {
        const { id } = req.params;
        const updates = req.body;
       

        if (updates.description === undefined) {
            console.log('WARNING: description is undefined in request body');
        }

        const training = req.training;

        if (updates.theme && updates.theme !== training.theme) {
            console.log('Theme changed, regenerating session code...');

            const district = await District.findById(training.district_id);
            if (!district) {
                const error = new Error('District not found');
                error.status = 400;
                throw error;
            }

            updates.session_code = await generateSessionCode(district, updates.theme);
            console.log('New session code:', updates.session_code);
        }
        
        // Restricted fields (cannot be updated)
        const restrictedFields = ['trainer_id', 'district_id', 'scheduled_at', '_id', 'Session_id'];
        restrictedFields.forEach(field => delete updates[field]);

        const userRole = req.user.role;

        // If user is trainer, additional restrictions
        if (userRole === 'trainer') {
            // Trainers cannot update certain status fields
            const trainerRestricted = ['verification_status', 'verification_score', 'status'];
            trainerRestricted.forEach(field => {
                if (updates[field] !== undefined) {
                    console.log(`Trainer cannot update ${field}, removing...`);
                    delete updates[field];
                }
            });


            // Trainers cannot update completed trainings
            if (training.status === 'completed') {
                const error = new Error('Cannot update a completed training session');
                error.status = 400;
                throw error;
            }
        }


        // Update
        const updatedTraining = await TrainingSession.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Training session updated successfully',
            data: updatedTraining
        });
    };


module.exports.deleteTraining = async (req, res) => {
        const { id } = req.params;
        const training = req.training; // From middleware
        const userRole = req.user.role;

        console.log('Deleting training (owner verified):', {
            id,
            userRole,
            trainingStatus: training.status
        });

        // Additional validations
        if (userRole === 'trainer') {
            // Trainers cannot delete completed trainings
            if (training.status === 'completed') {
                const error = new Error('Cannot delete a completed training session');
                error.status = 400;
                throw error;
            }

            // Trainers cannot delete if verification is in progress
            if (training.verification_status === 'verified') {
                const error = new Error('Cannot delete a verified training session');
                error.status = 400;
                throw error;
            }
        }

        // Delete the training
        await TrainingSession.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Training session deleted successfully',
            data: { id }
        });

    };