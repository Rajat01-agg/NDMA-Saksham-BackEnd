const { Clerk } = require('@clerk/clerk-sdk-node');
const { District } = require('../models'); 

const clerk = new Clerk({ 
  secretKey: process.env.CLERK_SECRET_KEY 
});

// ========================
// 1. MAIN AUTHENTICATION MIDDLEWARE
// ========================

const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // TEMPORARY: Handle mock tokens for testing
    if (token.startsWith('user_')) {
      const mockUsers = {
        'user_ndma_admin': {
          _id: '507f1f77bcf86cd799439013', // ✅ ObjectId
          id: '507f1f77bcf86cd799439013',  // ✅ Same
          emailAddresses: [{ emailAddress: 'ndma.admin@test.com' }],
          firstName: 'NDMA',
          lastName: 'Admin',
          publicMetadata: { role: 'ndma_admin' }
        },
        'user_sdma_maharashtra': {
          _id: '507f1f77bcf86cd799439014',
          id: '507f1f77bcf86cd799439014',
          emailAddresses: [{ emailAddress: 'maharashtra.admin@test.com' }],
          firstName: 'Maharashtra', 
          lastName: 'Admin',
          publicMetadata: { role: 'sdma_admin', state: 'maharashtra' }
        },
        'user_trainer_pune': {
          _id: '507f1f77bcf86cd799439012', // ✅ ObjectId for trainer
          id: '507f1f77bcf86cd799439012',  // ✅ Same ObjectId
          emailAddresses: [{ emailAddress: 'trainer.pune@test.com' }],
          firstName: 'Pune',
          lastName: 'Trainer',
          publicMetadata: { role: 'trainer', district: 'pune' } // ✅ District: 'pune'
        },
        'user_volunteer_test': {
          _id: '507f1f77bcf86cd799439015',
          id: '507f1f77bcf86cd799439015',
          emailAddresses: [{ emailAddress: 'volunteer.test@test.com' }],
          firstName: 'Test',
          lastName: 'Volunteer',
          publicMetadata: { role: 'volunteer' }
        }
      };
      
      req.user = mockUsers[token];
      console.log('Mock user set:', { 
        id: req.user.id, 
        district: req.user.publicMetadata?.district 
      });
      return next();
    }

    // Original Clerk code (keep this for production)
    const session = await clerk.sessions.verifySession(token);
    const user = await clerk.users.getUser(session.userId);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ========================
// 2. ROLE-BASED ACCESS CONTROL
// ========================
const requireAnyRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.publicMetadata?.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}` 
      });
    }
    next();
  };
};

// ========================
// 3. STATE-BASED ACCESS FOR SDMA
// ========================
const requireStateAccess = (req, res, next) => {
  const userRole = req.user.publicMetadata?.role;
  const userState = req.user.publicMetadata?.state;
  
  // NDMA admins can access all states
  if (userRole === 'ndma_admin') {
    return next();
  }
  
  // SDMA admins can only access their state
  if (userRole === 'sdma_admin') {
    const requestedState = req.params.state || req.query.state || req.body.state;
    
    if (requestedState && requestedState !== userState) {
      return res.status(403).json({ 
        error: `Access denied. You can only access data for ${userState}` 
      });
    }
    return next();
  }
  
  return res.status(403).json({ error: 'Access denied' });
};

// ========================
// 4. TRAINER-SPECIFIC ACCESS CONTROL
// ========================
const requireTrainerAccess = async (req, res, next) => {
  const userRole = req.user.publicMetadata?.role;
  const user_id = req.user.id;
  
  // Only apply to trainers
  if (userRole !== 'trainer') {
    return next();
  }
  
  // For GET /api/trainer/my-trainings - automatically filter by trainer_id
  if (req.method === 'GET' && req.originalUrl.includes('/api/trainer/my-trainings')) {
    req.trainer_id = user_id;
    return next();
  }
  
  // For POST /api/trainer/trainings - automatically set trainer_id
  if (req.method === 'POST' && req.originalUrl.includes('/api/trainer/trainings')) {
    req.body.trainer_id = user_id;
    req.body.trainer_name = `${req.user.firstName} ${req.user.lastName}`;
    return next();
  }
  
  // For PUT/DELETE /api/trainer/trainings/:id - ensure trainer owns the session
  if ((req.method === 'PUT' || req.method === 'DELETE') && 
      req.originalUrl.includes('/api/trainer/trainings/')) {
    
    const Session_id = req.params.id;
    req.trainer_id = user_id;
    return next();
  }
  
  next();
};

// ========================
// 5. VOLUNTEER ACCESS (Basic - as per requirement)
// ========================
const requireVolunteerAccess = (req, res, next) => {
  const userRole = req.user.publicMetadata?.role;
  
  if (userRole === 'volunteer') {
    // Volunteers get minimal access - mostly read-only
    if (req.method !== 'GET') {
      return res.status(403).json({ error: 'Volunteers have read-only access' });
    }
  }
  
  next();
};

// ========================
// 6. GEOGRAPHICAL FILTERING MIDDLEWARE
// ========================
const applyGeographicalFilter = async (req, res, next) => {
  const userRole = req.user.publicMetadata?.role;
  // Convert to lowercase for case-insensitive matching
  const userState = req.user.publicMetadata?.state?.toLowerCase(); 
  const userDistrictName = req.user.publicMetadata?.district?.toLowerCase();

  req.geoFilter = {}; // Default to no filter for NDMA admin or if no specific role applies

  if (userRole === 'sdma_admin' && userState) {
    const districtDocs = await District.find({ state: userState }, '_id');
    const districtIds = districtDocs.map(doc => doc._id);
    if (districtIds.length > 0) {
      req.geoFilter = { district_id: { $in: districtIds } };
    }
  } else if (userRole === 'trainer' && userDistrictName) {
    const districtDoc = await District.findOne({ name: userDistrictName }, '_id');
    if (districtDoc) {
      req.geoFilter = { district_id: districtDoc._id };
    }
  }
  
  // NDMA admins get no filters (req.geoFilter remains {}) - handled by initial req.geoFilter = {};

  next();
};




module.exports = {
  requireAuth,
  requireAnyRole,
  requireStateAccess,
  requireTrainerAccess,
  requireVolunteerAccess,
  applyGeographicalFilter,
  clerk
};