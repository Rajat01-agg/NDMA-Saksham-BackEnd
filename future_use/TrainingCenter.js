const mongoose = require('mongoose');
const { Schema } = mongoose;

const TrainingCenterSchema = new Schema({
  center_id:{ type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId() },
  name: { type: String, required: true, index: true },
  address: { type: String },
  pincode: { type: String, index: true },

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' } // [lng, lat]
  },

  center_type: { type: String, enum: ['school', 'phc', 'community_hall', 'open_space', 'other'], default: 'other' },
  capacity: { type: Number, default: 0 },

  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  meta: {
    created_from: { type: String } // e.g., 'district-entry', 'bulk-import'
  }
}, { timestamps: true });

TrainingCenterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('TrainingCenter', TrainingCenterSchema);
