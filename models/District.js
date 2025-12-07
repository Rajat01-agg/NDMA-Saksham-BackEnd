// models/District.js
const mongoose = require('mongoose');

const DistrictSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true,
    set: function (v) {
      return v ? v.trim().toLowerCase() : v;
    }
  },

  state: {
    type: String,
    required: true,
    index: true,
    set: function (v) {
      return v ? v.trim().toLowerCase() : v;
    }
  },

  census_code: {
    type: String,
    unique: true
  }, // The "Interoperability" Link

  // Geospatial Center (For calculating distance)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    } // [lng, lat]
  },

  risk_level: {
    type: String,
    enum: ['critical', 'high', 'moderate', 'low'],
    default: 'moderate',
    index: true
  },

  // risk_profile: {
  //   flood_prone: { 
  //     type: Boolean, 
  //     default: false 
  //   },
  //   seismic_zone: { 
  //     type: Number, 
  //     default: 2 
  //   }, // Zones typically range 2-5
  //   cyclone_history: { 
  //     type: Boolean, 
  //     default: false 
  //   }
  // },

  stats: {
    last_training_date: {
      type: Date,
      default: null
    },
    total_volunteers_trained: {
      type: Number,
      default: 0
    },
  },

  meta: {
    source: {
      type: String
    },
    imported_at: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Optional indexes for better performance
DistrictSchema.index({ state: 1, name: 1 }); // Compound index for state+name queries
DistrictSchema.index({ risk_level: 1, state: 1 }); // For risk-based filtering

module.exports = mongoose.model('District', DistrictSchema);