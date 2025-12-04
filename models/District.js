const mongoose = require('mongoose');

const DistrictSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  state: { type: String, required: true, index: true },
  census_code: { type: String, unique: true }, // The "Interoperability" Link

  // Geospatial Center (For calculating distance)
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' } // [lng, lat]
  },

  risk_level: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'],
    default: 'MODERATE',
    index: true // Recommended: Adds an index for faster filtering by risk
  },

  risk_profile: {
    flood_prone: { type: Boolean, default: false },
    seismic_zone: { type: Number, default: 2 }, // Zones typically range 2-5
    cyclone_history: { type: Boolean, default: false }
  },

  stats: {
    last_training_date: { type: Date, default: null },
    total_volunteers_trained: { type: Number, default: 0 },
  },

  meta: {
    source: { type: String }, // e.g., 'preload-csv-2025'
    imported_at: { type: Date }
  }
}, { timestamps: true });

// Pre-save hook to convert name and state to lowercase for case-insensitive matching
DistrictSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.name = this.name.toLowerCase();
  }
  if (this.isModified('state') || this.isNew) {
    this.state = this.state.toLowerCase();
  }
  next();
});

// Pre-update hook for findOneAndUpdate, updateOne, etc.
DistrictSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate();
  if (update.name) {
    update.name = update.name.toLowerCase();
  }
  if (update.state) {
    update.state = update.state.toLowerCase();
  }
  if (update.$set) {
    if (update.$set.name) {
      update.$set.name = update.$set.name.toLowerCase();
    }
    if (update.$set.state) {
      update.$set.state = update.$set.state.toLowerCase();
    }
  }
  next();
});

DistrictSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('District', DistrictSchema);