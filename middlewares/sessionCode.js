const TrainingSession = require('../models/TrainingSession');
const District = require('../models/District');

// District Code: First 2 letters of state + First 3 letters of district
const getDistrictCode = (district) => {
  // Use census code if available (e.g., "MH-01" -> "MH01")
  if (!district) {
    console.error('District object is null/undefined');
    return 'UNKNOWN';
  }

  
  if (district.census_code) {
    return district.census_code.replace('-', '').toUpperCase();
  }

  if (!district.state) {
    console.warn('District state field missing:', district.name);
    // Default: Use first 2 letters of district name
    return (district.name || 'UN').slice(0, 5).toUpperCase();
  }

  // Fallback: State initials + District initials
  const stateCode = district.state.slice(0, 2).toUpperCase();
  const districtCode = district.name.slice(0, 3).toUpperCase();
  return stateCode + districtCode; // e.g., "MAMUM" for Maharashtra Mumbai
};

// Theme Code: Standard 3-letter codes
const getThemeCode = (theme) => {
  const themeCodes = {
    'flood': 'FLD',
    'earthquake': 'EQK',
    'fire': 'FIR',
    'cyclone': 'CYC',
    'general': 'GEN'
  };
  return themeCodes[theme] || theme.slice(0, 3).toUpperCase();
};

// Generate unique session code using timestamp (100% unique)
const generateSessionCode = async (district, theme) => {
  const districtCode = getDistrictCode(district);
  const themeCode = getThemeCode(theme);
  
  // Last 6 digits of timestamp (always unique)
  const uniqueNum = Date.now().toString().slice(-6);
  
  return `${districtCode}-${themeCode}-${uniqueNum}`;
};

// Middleware with validation
const autoGenerateSessionCode = async (req, res, next) => {
  // Only for training creation
  if (req.method !== 'POST' || !req.originalUrl.includes('/trainings')) {
    return next();
  }
  
  try {
    const { theme } = req.body; 
    
    const districtName = req.user?.district;
    console.log('District Name from user:', districtName);

    // Validation
    if (!theme) {
      console.log('ERROR: No theme in request body');
      return res.status(400).json({
        success: false,
        error: 'Theme is required for session code generation'
      });
    }
    
    if (!districtName) {
      console.log('ERROR: No district in user profile');
      return res.status(400).json({
        success: false,
        error: 'Trainer district not found in profile'
      });
    }
    
    
    const district = await District.findOne({ name: districtName });
    console.log('District found:', district);
    if (!district) {
      console.log('ERROR: District not found in database');
      return res.status(400).json({
        success: false,
        error: `District "${districtName}" not found in database`
      });
    }
    
    // Generate session code
    const sessionCode = await generateSessionCode(district, theme);
    
    // Attach to request
    req.body.session_code = sessionCode;
    
    // Log (for debugging)
    console.log(`🎫 Generated: ${sessionCode} (${district.name}, ${district.state})`);
    
    next();
  } catch (error) {
    console.error('Session code error:', error);
    res.status(500).json({
      success: false,
      error: 'Session code generation failed'
    });
  }
};

module.exports = { autoGenerateSessionCode, generateSessionCode };