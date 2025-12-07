const User = require('../models/User');
const District = require('../models/District');
const { clerk } = require('../middlewares/auth');
const { generateToken } = require('../util/jwt');

module.exports.register = async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      mobile_number,
      password,
      role = 'volunteer',
      state,
      district
    } = req.body;

    // 1. Validate required fields
    if (!firstName || !email || !mobile_number || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: firstName, email, mobile_number, password'
      });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { mobile_number }] 
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email or mobile number'
      });
    }

    // 3. Create user (password will be hashed if you have pre-save hook)
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName?.trim() || '',
      email: email.toLowerCase().trim(),
      mobile_number: mobile_number.trim(),
      passwordHash: password, // Plain text - add hashing in User model pre-save
      role,
      state: state?.toLowerCase(),
      district: district?.toLowerCase(),
      isActive: true,
      onboarding_source: 'pwa'
    });

    // 4. Generate JWT token
    const token = generateToken(user);

    // 5. Response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        mobile_number: user.mobile_number,
        role: user.role,
        state: user.state,
        district: user.district
      },
      token
    });
};


module.exports.login = async (req, res) => {
  const { email, mobile_number, password } = req.body;
    
  // Build query dynamically - only include conditions that are provided
  const queryConditions = [];
  if (email) {
    queryConditions.push({ email: email.toLowerCase() });
  }
  if (mobile_number) {
    queryConditions.push({ mobile_number: mobile_number.trim() });
  }

  if (queryConditions.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Email or mobile number is required'
    });
  }

  const query = queryConditions.length === 1 ? queryConditions[0] : { $or: queryConditions };

  // Find user by email OR mobile - explicitly select passwordHash
  const user = await User.findOne(query).select('+passwordHash');

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'User not found'
    });
  }

  // Check password
  if (!password || user.passwordHash !== password) {
    return res.status(401).json({
      success: false,
      error: 'Invalid password'
    });
  }

  // Check if user has clerkId
  // if (!user.clerkId) {
  //   return res.status(400).json({
  //     success: false,
  //     error: 'User not registered with Clerk. Please register first.'
  //   });
  // }

  const token = generateToken(user);
  
  // Success response
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role,
      state: user.state,
      district: user.district
    },
    token: token
  });
};


module.exports.getCurrentUser = async(req, res) => {
  const user = req.user;
    
  // Use the data already in req.user (from requireAuth)
  res.json({
    success: true,
    user: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      mobile_number: user.mobile_number,
      role: user.role,
      state: user.state,
      district: user.district,
      skills: user.skills || [], // Add if you store skills in user
      isActive: user.isActive !== false,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString()
    }
  });
};

module.exports.logout = async(req, res) => {
  console.log('🔓 Logout requested');
  
  // Since we're using JWT tokens (not Clerk session tokens),
  // logout is primarily handled client-side by removing the token.
  // In a production system, you could implement a token blacklist here.
  
  // For now, we'll just return success.
  // The client should remove the token from localStorage/sessionStorage.
  
  res.json({
    success: true,
    message: 'Logged out successfully. Please remove token from client storage.'
  });
};