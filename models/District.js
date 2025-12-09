// models/District.js
const mongoose = require('mongoose');

const HAZARD_TYPES = [
  // 🌊 Hydro-Meteorological
  'flood',
  'flash_flood',
  'urban_flood',
  'drought',
  'cyclone',
  'storm_surge',
  'heatwave',
  'cold_wave',
  'hailstorm',
  'cloudburst',

  // 🌍 Geological
  'earthquake',
  'tsunami',
  'landslide',
  'avalanche',
  'volcanic_eruption',

  // 🔥 Fire & Critical Infrastructure
  'forest_fire',
  'urban_fire',
  'industrial_fire',

  // ☣️ Chemical, Biological, Radiological & Nuclear (CBRN)
  'chemical_hazard',
  'biological_hazard',
  'radiological_hazard',
  'nuclear_hazard',
  'gas_leak',

  // 🚧 Industrial & Technological
  'industrial_accident',
  'mine_collapse',
  'dam_failure',
  'oil_spill',

  // 🧬 Public Health & Epidemic
  'epidemic',
  'pandemic',
  'water_borne_disease',
  'vector_borne_disease',

  // ✅ Fallback
  'others'
];


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

  risk_profile:[
    {
      hazard: {
        type: String,
        enum: HAZARD_TYPES,
        required: true,
        index: true
      },
      risk_level: {
        type: String,
        enum: ['critical', 'high', 'moderate', 'low'],
        default: 'moderate'
      }
    }
  ],
  
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