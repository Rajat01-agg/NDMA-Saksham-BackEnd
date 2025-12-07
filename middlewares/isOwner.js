const TrainingSession = require("../models/TrainingSession.js");
const District = require("../models/District.js");

const isOwnerOrAdmin = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userRole = req.user.role;
      const userId = req.user.id;
      
      console.log('isOwner check:', { id, userRole, userId });
      
      // Find the training
      const training = await TrainingSession.findById(id);
      
      if (!training) {
        const error = new Error('Training session not found');
        error.status = 404;
        throw error;
      }
      
      // NDMA Full access to everything
      if (userRole === 'ndma_admin') {
        console.log('Access: NDMA Admin - FULL ACCESS');
        req.training = training; // Attach training to request
        return next();
      }
      
      // SDMA - Access to trainings in their state
      if (userRole === 'sdma_admin') {
        const district = await District.findById(training.district_id);
        const userState = req.user.state;
        
        if (district && userState && 
            district.state.toLowerCase() === userState.toLowerCase()) {
          console.log('Access: SDMA Admin - SAME STATE');
          req.training = training;
          return next();
        } else {
          const error = new Error('Access denied. You can only access trainings in your state');
          error.status = 403;
          throw error;
        }
      }
      
      // Trainer - Must be the owner
      if (userRole === 'trainer') {
        // Get MongoDB user ID from req.user (set by requireAuth middleware)
        const mongoUserId = req.user.id;

        if (!mongoUserId) {
          const error = new Error('User ID not found. Please ensure user is properly authenticated.');
          error.status = 400;
          throw error;
        }
        
        // Compare MongoDB ObjectIds (both are MongoDB ObjectIds now)
        if (training.trainer_id.toString() === mongoUserId.toString()) {
          console.log('Access: Trainer - IS OWNER');
          req.training = training;
          return next();
        } else {
          const error = new Error('Access denied. You can only access your own training sessions');
          error.status = 403;
          throw error;
        }
      }
      
      const error = new Error('Access denied. Insufficient permissions');
      error.status = 403;
      throw error;
      
    } catch (error) {
      next(error);
    }
  };

  module.exports = isOwnerOrAdmin;