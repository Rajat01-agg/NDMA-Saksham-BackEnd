const mongoose = require('mongoose');
const { Schema } = mongoose;

const AttendanceLogSchema = new Schema(
  {
    session_id: { type: Schema.Types.ObjectId, ref: 'TrainingSession', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    timestamp: { type: Date, default: Date.now },

    method: {
      type: String,
      enum: ['MANUAL', 'QR', 'WHATSAPP', 'PHOTO_PROOF'],
      default: 'MANUAL'
    },

    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] } // [lng, lat]
    },

    is_valid: { type: Boolean, default: true }, // flagged if fraud/duplicate

    // store extra fields if needed (AI confidence, device info etc)
    meta: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Geo index (optional but useful)
AttendanceLogSchema.index({ location: '2dsphere' });

// Quick lookup indexes
AttendanceLogSchema.index({ session_id: 1 });
AttendanceLogSchema.index({ user_id: 1 });

module.exports = mongoose.model('AttendanceLog', AttendanceLogSchema);
