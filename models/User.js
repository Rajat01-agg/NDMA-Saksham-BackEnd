// models/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },

    user_id:{ type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId() },

    mobile_number: { type: String, required: true, unique: true, index: true },
    email: { type: String },

    role: {
      type: String,
      enum: ['ndma_admin', 'sdma_admin', 'trainer', 'partner_org', 'volunteer'],
      required: true
    },

    // Geography Mapping
    state: { type: String },
    district: { type: String },
    home_district_id: { type: Schema.Types.ObjectId, ref: 'District' },

    // Searchable Tags (e.g., "CPR", "FirstAid")- using drop down menu
    skills: [{ type: String }],

    // Security
    passwordHash: { type: String },
    isActive: { type: Boolean, default: true },

    // Device / Onboarding Logic
    onboarding_source: { type: String, enum: ['pwa', 'whatsapp', 'manual'], default: 'pwa' },
    device_id: { type: String },
    app_version: { type: String },

    /* --- COMPLIANCE / FUTURE FIELDS (COMMENTED FOR HACKATHON) ---
    aadhaar_vault_ref: { type: String },
    caste_category: { type: String, enum: ['GEN','OBC','SC','ST','OTHER'] },
    bank_details: {
       account_status: { type: String, enum: ['VERIFIED','PENDING'], default: 'PENDING' },
       upi_id: { type: String }
    },
    */

    meta: {
      createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
      createdFrom: { type: String } // e.g., 'district-entry', 'bulk-import'
    }
  },
  { timestamps: true }
);

// Pre-save hook to convert state and district to lowercase for case-insensitive matching
UserSchema.pre('save', function(next) {
  if (this.isModified('state') || this.isNew) {
    if (this.state) {
      this.state = this.state.toLowerCase();
    }
  }
  if (this.isModified('district') || this.isNew) {
    if (this.district) {
      this.district = this.district.toLowerCase();
    }
  }
  next();
});

// Pre-update hook for findOneAndUpdate, updateOne, etc.
UserSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate();
  if (update.state) {
    update.state = update.state.toLowerCase();
  }
  if (update.district) {
    update.district = update.district.toLowerCase();
  }
  if (update.$set) {
    if (update.$set.state) {
      update.$set.state = update.$set.state.toLowerCase();
    }
    if (update.$set.district) {
      update.$set.district = update.$set.district.toLowerCase();
    }
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
