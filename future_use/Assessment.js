// models/Assessment.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const AssessmentSchema = new Schema(
  {
    training_id: { type: Schema.Types.ObjectId, ref: 'TrainingSession', required: true },
    sample_participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    // Impact Metrics
    pre_avg_score: { type: Number, default: null },
    post_avg_score: { type: Number, default: null },
    knowledge_delta_percent: { type: Number, default: null },

    conducted_at: { type: Date, default: Date.now },
    meta: { type: Schema.Types.Mixed } // question-set id, method (IVR/SMS/onsite)
  },
  { timestamps: true }
);

// quick index by training
AssessmentSchema.index({ training_id: 1 });

module.exports = mongoose.model('Assessment', AssessmentSchema);
