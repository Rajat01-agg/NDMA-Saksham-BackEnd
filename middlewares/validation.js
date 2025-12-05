const { District, TrainingSession } = require('../models');

const validateTheme = (theme, errors) => {
    const validThemes = ['flood', 'earthquake', 'fire', 'cyclone', 'general'];
    if (!theme) {
        errors.push('Theme is required');
    } else if (!validThemes.includes(theme.toLowerCase())) {
        errors.push(`Theme must be one of: ${validThemes.join(', ')}`);
    }
};

const validateLocation = (venue_latitude, venue_longitude, errors) => {
    if (venue_latitude !== undefined) {
        if (typeof venue_latitude !== 'number' || venue_latitude < -90 || venue_latitude > 90) {
            errors.push('Latitude must be a valid number between -90 and 90');
        }
    }

    if (venue_longitude !== undefined) {
        if (typeof venue_longitude !== 'number' || venue_longitude < -180 || venue_longitude > 180) {
            errors.push('Longitude must be a valid number between -180 and 180');
        }
    }
};

const validateIngestionSource = (ingestion_source, errors) => {
    const validSources = ['whatsapp', 'app', 'sms_fallback', 'chatbot'];
    if (ingestion_source && !validSources.includes(ingestion_source)) {
        errors.push(`Ingestion source must be one of: ${validSources.join(', ')}`);
    }
};

// const validateDistrict = async (district_id, errors) => {
//     if (!district_id) {
//         errors.push('District is required');
//     } else {
//         const district = await District.findById(district_id);
//         if (!district) {
//             errors.push('Invalid district_id');
//         }
//     }
// };

const validateVenueAddress = (venue_address, errors, isCreation = false) => {
    // For creation, venue_address is required
    if (isCreation && venue_address === undefined) {
        errors.push('Venue address is required');
        return;
    }

    // For updates, venue_address is optional
    if (!isCreation && venue_address === undefined) {
        return;
    }

    // Type check
    if (typeof venue_address !== 'string') {
        errors.push('Venue address must be a string');
        return;
    }

    // Empty check
    if (!venue_address.trim()) {
        errors.push('Venue address cannot be empty');
    } else if (venue_address.length > 500) {
        errors.push('Venue address must be less than 500 characters');
    }

};


const validateTrainingCreation = async (req, res, next) => {
    const {
        theme,
        start_date,
        end_date,
        venue_latitude,
        venue_longitude,
        ingestion_source = 'app',
        venue_address,
        description = '',
    } = req.body;

    console.log('req.body:', req.body);

    const errors = [];
    validateTheme(theme, errors);

    if (!start_date) {
        errors.push('Start date is required');
    } else {
        const startDate = new Date(start_date);
        if (isNaN(startDate.getTime())) {
            errors.push('Start date must be a valid date');
        } else {
            // Allow dates that are at least 1 minute in the future to account for processing time
            const now = new Date();
            const oneMinuteFromNow = new Date(now.getTime() + 60000); // Add 1 minute buffer
            if (startDate < oneMinuteFromNow) {
                errors.push('Start date must be at least 1 minute in the future');
            }
        }
    }

    if (!end_date) {
        errors.push('End date is required');
    } else {
        const endDate = new Date(end_date);
        const startDate = new Date(start_date || 0);

        if (isNaN(endDate.getTime())) {
            errors.push('End date must be a valid date');
        } else if (endDate < startDate) {
            errors.push('End date must be after start date');
        } else {
            const durationHours = (endDate - startDate) / (1000 * 60 * 60);
            if (durationHours < 1) {
                errors.push('Minimum training duration is 1 hour');
            }
            if (durationHours > 168) { // 7 days * 24 hours = 168 hours
                errors.push('Maximum training duration is 1 week (168 hours)');
            }
        }
    }
    validateLocation(venue_latitude, venue_longitude, errors);
    validateIngestionSource(ingestion_source, errors);

    if (!req.user?.publicMetadata?.district) {
        errors.push('Trainer is not assigned to any district');
    }

    validateVenueAddress(venue_address, errors, true);

    if (description !== undefined && description !== null && description.length > 2000) {
        errors.push('Description must be less than 2000 characters');
    }

    // If there are errors, send response
    if (errors.length > 0) {
        console.log('VALIDATION ERRORS:', errors);
        const error = new Error('Validation failed');
        error.status = 400;
        error.details = errors;
        return next(error);
    }

    // Validation passed
    next();
};


const validateTrainingUpdate = async (req, res, next) => {
    const updates = req.body;
    const { id } = req.params;

    const {
        theme,
        start_date,
        end_date,
        venue_latitude,
        venue_longitude,
        ingestion_source,
        venue_address,
        description
    } = updates;
    const errors = [];

    // Validate theme if provided
    if (theme !== undefined) {
        validateTheme(theme, errors);
    }

    // Validate location if provided
    if (venue_latitude !== undefined || venue_longitude !== undefined) {
        validateLocation(venue_latitude, venue_longitude, errors);
    }

    // Validate ingestion source if provided
    if (ingestion_source !== undefined) {
        validateIngestionSource(ingestion_source, errors);
    }

    // Validate venue address if provided
    if (venue_address !== undefined) {
        validateVenueAddress(venue_address, errors, false);
    }

    // Date validation for updates
    // Check if user is trying to update dates
    const isUpdatingStartDate = start_date !== undefined;
    const isUpdatingEndDate = end_date !== undefined;

    if (isUpdatingStartDate || isUpdatingEndDate) {
        // Fetch existing training to get current dates
        const training = await TrainingSession.findById(req.params.id);

        if (!training) {
            const error = new Error('Training session not found');
            error.status = 404;
            return next(error);
        }

        // Use updated date or existing date
        const startDate = isUpdatingStartDate
            ? new Date(start_date)
            : new Date(training.start_date);

        const endDate = isUpdatingEndDate
            ? new Date(end_date)
            : new Date(training.end_date);

        // Validate the dates
        if (isUpdatingStartDate && isNaN(startDate.getTime())) {
            errors.push('Start date must be a valid date');

        }

        if (isUpdatingEndDate && isNaN(endDate.getTime())) {
            errors.push('End date must be a valid date');

        }

        // Validate date range (only if both dates are valid)
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            if (endDate < startDate) {
                errors.push('End date must be after start date');
            } else {
                const durationHours = (endDate - startDate) / (1000 * 60 * 60);
                if (durationHours < 1) {
                    errors.push('Minimum training duration is 1 hour');
                }
                if (durationHours > 168) {
                    errors.push('Maximum training duration is 1 week (168 hours)');
                }
            }
        }
    }

    if (description !== undefined && description.length > 2000) {
        errors.push('Description must be less than 2000 characters');
    }


    // If there are errors, send response
    if (errors.length > 0) {
        const error = new Error('Validation failed');
        error.status = 400;
        error.details = errors;
        return next(error);
    }

    next();
};

module.exports = {
    validateTrainingCreation,
    validateTrainingUpdate
};