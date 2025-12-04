const mongoose = require('mongoose');
const { Schema } = mongoose;

const AlertSchema = new Schema(
  {
    alert_type: {
      type: String,
      enum: ['CYCLONE', 'FLOOD', 'MOCK_DRILL', 'GENERAL'],
      default: 'GENERAL'
    },
    severity: {
      type: String,
      enum: ['WATCH', 'WARNING', 'EVACUATE'],
      default: 'WATCH'
    },

    // Target
    affected_districts: [{ type: Schema.Types.ObjectId, ref: 'District' }],
    geo_polygon: {
      type: { type: String, enum: ['Polygon'], default: 'Polygon' },
      coordinates: { type: [[[Number]]], default: [] } // GeoJSON polygon
    },

    message: { type: String },
    volunteers_notified: { type: Number, default: 0 },

    deployment_status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE'
    },

    meta: {
      issued_by: { type: Schema.Types.ObjectId, ref: 'User' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', AlertSchema);
