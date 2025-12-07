const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    // 1. BASIC INFO
    firstName: { 
      type: String, 
      required: [true, 'First name is required'],
      trim: true
    },
    
    lastName: { 
      type: String, 
      trim: true,
      default: '' // Optional
    },

    // 2. AUTHENTICATION IDENTIFIERS
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },

    mobile_number: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true
    },

    // 3. ROLE & PERMISSIONS
    role: {
      type: String,
      enum: ['ndma_admin', 'sdma_admin', 'trainer', 'partner_org', 'volunteer'],
      required: true,
      default: 'volunteer'
    },

    // 4. GEOGRAPHY MAPPING
    state: {
      type: String,
      set: function(v) {
        return v ? v.trim().toLowerCase() : v;
      }
    },
    
    district: {
      type: String,
      set: function(v) {
        return v ? v.trim().toLowerCase() : v;
      }
    },
    
    home_district_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'District' 
    },

    // 5. PROFESSIONAL DATA
    skills: [{ 
      type: String,
      trim: true
    }],

    // 6. SECURITY & STATUS
    passwordHash: { 
      type: String 
    },
    
    isActive: { 
      type: Boolean, 
      default: true 
    },

    // 7. ONBOARDING INFO
    onboarding_source: { 
      type: String, 
      enum: ['pwa', 'whatsapp', 'manual'], 
      default: 'pwa' 
    }
  },
  { 
    timestamps: true
  }
);

module.exports = mongoose.model('User', UserSchema);