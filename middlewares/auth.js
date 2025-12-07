const { Clerk } = require('@clerk/clerk-sdk-node');
const jwt = require('jsonwebtoken');
const { District, User } = require('../models'); 

const clerk = new Clerk({ 
  secretKey: process.env.CLERK_SECRET_KEY 
});

// ========================
// 1. MAIN AUTHENTICATION MIDDLEWARE
// ========================
const requireAuth = async (req, res, next) => {
  // 1. Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: 'No token provided. Format: Bearer <token>' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // 2. Verify JWT token
    const decoded = jwt.verify(
      token, 
      process.env.CLERK_SECRET_KEY || 'your-secret-key'
    );
    
    console.log('Decoded token:', decoded); // Debug log
    
    // 3. Find user in MongoDB using userId from token (NOT clerkId)
    const user = await User.findOne({ 
      _id: decoded.userId  // ✅ CORRECT: Use userId, not clerkId
    }).lean();
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found in database' 
      });
    }
    
    // 4. Attach user data to request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      state: user.state,
      district: user.district,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile_number: user.mobile_number,
      publicMetadata: {
        role: user.role,
        state: user.state,
        district: user.district
      }
    };
    
    console.log('✅ Authenticated user:', user.email);
    next();
    
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired' 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      error: 'Authentication failed: ' + error.message 
    });
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