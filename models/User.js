/* const mongoose = require('mongoose');
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

    clerkId: {
      type: String,
      unique: true,
      sparse: true // Allows multiple null values
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
*/

module.exports = mongoose.model('User', UserSchema); */
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
      default: ''
    },
    gender : {
      type: String,
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

    clerkId: {
      type: String,
      unique: true,
      sparse: true
    },

    // 3. ROLE
    role: {
      type: String,
      enum: ['ndma_admin', 'sdma_admin', 'trainer', 'volunteer'],
      required: true,
      default: 'volunteer'
    },

    // 4. GEOGRAPHY
    state: {
      type: String,
      set: v => (v ? v.trim().toLowerCase() : v)
    },
    district: {
      type: String,
      set: v => (v ? v.trim().toLowerCase() : v)
    },
    home_district_id: {
      type: Schema.Types.ObjectId,
      ref: 'District'
    },

    // 5. PROFESSIONAL DATA
    skills: [{ type: String, trim: true }],

    // 6. SECURITY
    passwordHash: { type: String },
    isActive: { type: Boolean, default: true },

    // 7. ONBOARDING SOURCE
    onboarding_source: {
      type: String,
      enum: ['pwa', 'whatsapp', 'manual'],
      default: 'pwa'
    },

    /* -----------------------------------------------------
       8. TRAINING ELIGIBILITY PARAMETERS
    ------------------------------------------------------*/
    trainingEligibility: {
      // 1. AGE
      age: {
        type: Number,
        required: true,
      },

      // 2. HEIGHT
      height_cm: {
        type: Number,
        required: true,
      },

      // 3. WEIGHT
      weight_kg: {
        type: Number,
        required: true,
      },

      // 4. VISION
      vision_left: {
        type: String,
        required: true
      },
      vision_right: {
        type: String,
        required: true
      },
      color_blindness: {
        type: Boolean,
        default: false
      },

      // 5. HEARING
      hearing_distance_m: {
        type: Number,
        required: true,
      },

      // 6. MEDICAL CONDITIONS
      medical: {
        heart_disease: { type: Boolean, default: false },
        uncontrolled_bp: { type: Boolean, default: false },
        asthma_moderate_or_severe: { type: Boolean, default: false },
        epilepsy: { type: Boolean, default: false },
        major_orthopedic_issue: { type: Boolean, default: false } // spine, knee
      }, // Search-and-rescue skill etc.

      overall_eligibility: {
        type: String,
        enum: ['eligible', 'not_eligible', 'review_required'],
        default: 'review_required'
      }
    },

    /* -----------------------------------------------------
       9. TRAINING PROGRESS & COMPLETION
    ------------------------------------------------------*/
    is_eligible : {
      type: Boolean,
      default: false
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
