const User = require('../models/User');
const District = require('../models/District');

module.exports.getUserProfile = async (req, res) => {
    // Since we're using JWT, req.user already contains the authenticated user data from MongoDB
    const jwtUser = req.user;

    // Get the full user document to access all fields
    const mongoUser = await User.findById(jwtUser.id);

    if (!mongoUser) {
        return res.status(404).json({
            success: false,
            error: 'User not found in database'
        });
    }

    // Get district details if available
    let homeDistrict = null;
    if (mongoUser.home_district_id) {
        homeDistrict = await District.findById(mongoUser.home_district_id);
    }

    // If no home_district_id but has district name, find it
    if (!homeDistrict && mongoUser.district && mongoUser.state) {
        homeDistrict = await District.findOne({
            name: mongoUser.district.toLowerCase(),
            state: mongoUser.state.toLowerCase()
        });

        // Update user with district_id if found
        if (homeDistrict) {
            await User.findByIdAndUpdate(mongoUser._id, {
                home_district_id: homeDistrict._id
            });
        }
    }

    // Prepare response
    const response = {
        success: true,
        user: {
            // User ID (MongoDB ObjectId)
            id: mongoUser._id,
            name: `${mongoUser.firstName} ${mongoUser.lastName}`.trim(),
            email: mongoUser.email,
            mobile_number: mongoUser.mobile_number,
            role: mongoUser.role,
            state: mongoUser.state,
            district: mongoUser.district,
            profile_complete: true,

            // Additional MongoDB fields
            skills: mongoUser.skills || [],
            onboarding_source: mongoUser.onboarding_source,
            isActive: mongoUser.isActive,
            clerkId: mongoUser.clerkId, // If exists

            // District information
            home_district: homeDistrict ? {
                id: homeDistrict._id,
                name: homeDistrict.name,
                state: homeDistrict.state,
                code: homeDistrict.census_code,
                risk_level: homeDistrict.risk_level
            } : null,

            // Timestamps
            createdAt: mongoUser.createdAt,
            updatedAt: mongoUser.updatedAt
        }
    };

    res.json(response);
};


module.exports.updateUserProfile = async (req, res) => {
    // Since we're using JWT, req.user contains the authenticated user data
    const jwtUser = req.user;
    const updates = req.body;

    // Find the user by their MongoDB ID (which is already in req.user.id)
    const mongoUser = await User.findById(jwtUser.id);

    if (!mongoUser) {
        return res.status(404).json({
            success: false,
            error: 'User profile not found'
        });
    }

    // Remove restricted fields that users shouldn't be able to update directly
    const restrictedFields = ['_id', 'passwordHash', 'createdAt', 'updatedAt', '__v', 'role', 'isActive'];
    restrictedFields.forEach(field => delete updates[field]);

    // Validate and apply updates
    Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
            console.log(`Setting ${key}: ${mongoUser[key]} → ${updates[key]}`);
            mongoUser[key] = updates[key];
        }
    });

    // Save the updated user
    const updatedUser = await mongoUser.save();

    // Remove sensitive fields from response
    const userResponse = updatedUser.toObject();
    delete userResponse.passwordHash;

    res.json({
        success: true,
        message: 'Profile updated successfully',
        user: userResponse
    });
};


module.exports.getAllUsers = async (req, res, next) => {
    const { page = 1, limit = 10, role, state, district } = req.query;

    // Filter object
    const filter = {};
    if (role && role !== 'undefined') filter.role = role;
    if (state && state !== 'undefined') filter.state = state.toLowerCase();
    if (district && district !== 'undefined') filter.district = district.toLowerCase();

    // Pagination calculate
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Database se data lao
    const users = await User.find(filter)
        .select('firstName lastName email mobile_number role state district')
        .skip(skip)
        .limit(parseInt(limit))
        .sort('-createdAt');

    // Total count lao
    const total = await User.countDocuments(filter);

    // Response bhejo
    res.json({
        success: true,
        users,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
    });
};


module.exports.getUserById = async (req, res) => {
    const userId = req.params.id;

    // Find user (skip validation for speed)
    const user = await User.findById(userId)
        .select('-passwordHash')
        .lean();

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }

    // Simple response
    res.json({
        success: true,
        user: {
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role
        }
    });
};


module.exports.updateUserById = async (req, res) => {
    const userId = req.params.id;
    const updates = req.body;

    // Find the user first
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }

    // Remove fields that shouldn't be updated directly
    const restrictedFields = ['_id', 'passwordHash', 'createdAt', 'updatedAt', '__v'];
    restrictedFields.forEach(field => delete updates[field]);

    // If no valid updates provided
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            success: false,
            error: 'No valid fields to update'
        });
    }

    // Update user properties
    Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
            user[key] = updates[key];
        }
    });

    // Save the user (this will run all validations and hooks)
    const updatedUser = await user.save();

    // Remove passwordHash from response
    const userResponse = updatedUser.toObject();
    delete userResponse.passwordHash;

    res.json({
        success: true,
        message: 'User updated successfully',
        user: userResponse
    });
};

module.exports.deleteUserById = async (req, res) => {
    const userId = req.params.id;
    const { hardDelete = false } = req.query; // ?hardDelete=true

    console.log(`🗑️ Delete request: ${userId}, hardDelete: ${hardDelete}`);

    if (hardDelete === 'true') {
        // 🚨 HARD DELETE (permanent)
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        console.log('🚨 User permanently deleted');

        res.json({
            success: true,
            message: 'User permanently deleted',
            user: {
                id: deletedUser._id,
                name: `${deletedUser.firstName} ${deletedUser.lastName}`,
                email: deletedUser.email,
                role: deletedUser.role
            }
        });

    } else {
        // 🔒 SOFT DELETE (default)
        const user = await User.findByIdAndUpdate(
            userId,
            { isActive: false },
            { new: true }
        ).select('-passwordHash');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        console.log('🔒 User deactivated (soft delete)');

        res.json({
            success: true,
            message: 'User deactivated',
            user: {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                role: user.role,
                isActive: user.isActive // Will be false
            }
        });
    }
};