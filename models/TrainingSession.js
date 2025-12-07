const mongoose = require('mongoose');
const { Schema } = mongoose;

/* --- Embedded sub-schema: MediaEvidence --- */
const MediaEvidenceSchema = new Schema({
  url: { type: String, required: true },
  media_type: { type: String, enum: ['image', 'video', 'audio', 'document'], default: 'image' },
  stage: { type: String, enum: ['pre_session', 'during_session', 'post_session', 'attendance_sheet'], default: 'during_session' },
  uploaded_at: { type: Date, default: Date.now },
  meta: {
    // optional EXIF-like geo proof for the media
    gps: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] } // [lng, lat]
    }
    // device_make: String, // commented - future
    // device_model: String, // commented - future
    // exif_full: { type: Schema.Types.Mixed } //mixed-metadata
  }
}, { _id: false });

/* --- Embedded sub-schema: VerificationLog --- */
const VerificationLogSchema = new Schema({
  check_type: { type: String, enum: ['geofence', 'ai_headcount', 'time_validity', 'manual_check'], required: true },
  status: { type: String, enum: ['pass', 'fail', 'warning'], required: true },
  // notes: { type: String },
  // actor_id: { type: Schema.Types.ObjectId, ref: 'User' }, // who performed manual check (optional)
  // created_at: { type: Date, default: Date.now }
}, { _id: false });

/* --- TrainingSession main schema --- */
const TrainingSessionSchema = new Schema({
  Session_id:{ type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId() },

  session_code: { type: String, unique: true, index: true },

  trainer_id: { type: Schema.Types.ObjectId , ref: 'User', required: true },
  district_id: { type: Schema.Types.ObjectId, ref: 'District', required: true },
  theme: { type: String, enum: ['flood', 'earthquake', 'fire', 'cyclone', 'general'], default: 'general' },

  start_date: { type: Date, default: Date.now, index: true },
  end_date: { type: Date, default: Date.now, index: true },
  scheduled_at: { type: Date, default: Date.now }, // When trainer scheduled

  ingestion_source: {
    type: String,
    enum: ['whatsapp', 'app', 'sms_fallback', 'chatbot'],
    default: 'app',
    required: true
  },

  geo_data: {
    actual_location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] } // [lng, lat]
    },
    submitted_location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: null } // [lng, lat]
    },
    location_source: { type: String, enum: ['gps', 'network', 'mock', 'manual'], default: 'gps' },
    distance_deviation_meters: { type: Number, default: 0 },
    is_within_geofence: { type: Boolean, default: false }
  },

  attendance_validation: {
    claimed_count: { type: Number, required: true },
    ai_detected_count: { type: Number, default: 0 },
    confidence_score: { type: Number, default: 0 }, // 0-100
    is_flagged_discrepancy: { type: Boolean, default: false }
  },

  media_evidence: [MediaEvidenceSchema],
  verification_logs: [VerificationLogSchema],

  status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'pending'], default: 'scheduled' },
  verification_status: { type: String, enum: ['unverified', 'verified', 'rejected', 'manual_review'], default: 'unverified' },
  verification_score: { type: Number, default: 0 }, // 0-100 //optional
 
  /* --- FUTURE / OFFLINE FIELDS (COMMENTED) ---
  synced: { type: Boolean, default: false },
  synced_at: { type: Date },
  attendance_method: { type: String, enum: ['QR','BIOMETRIC','MANUAL','WHATSAPP'] }
  */

  // optional link to a center (normalization)
  // training_center_id: { type: Schema.Types.ObjectId, ref: 'TrainingCenter' }

  venue_address: { type: String, default: '' },
  description: { type: String, default: '' },
  
}, { timestamps: true });

// geo index
TrainingSessionSchema.index({ "geo_data.submitted_location": "2dsphere" });
TrainingSessionSchema.index({ district_id: 1, status: 1 });
TrainingSessionSchema.index({ trainer_id: 1, start_date: -1 });

module.exports = mongoose.model('TrainingSession', TrainingSessionSchema);
