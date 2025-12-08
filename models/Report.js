const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Basic Info
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  
  type: {
    type: String,
    enum: [
      'training_summary',        // Overall stats with filters
      'district_performance',    // District-specific analysis
      'trainer_performance',     // Trainer evaluation
      'theme_analysis',          // Disaster-type focused
      'gap_analysis',            // Coverage gaps & recommendations
      'comparative_analysis'     // State vs State comparison
    ],
    required: true
  },
  
  // Report Status
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },
  
  // User Info
  generated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  generated_by_role: {
    type: String,
    enum: ['ndma_admin', 'sdma_admin'],
    required: true
  },
  
  // Filters Applied
  filters: {
    // Date Range
    date_range: {
      start: Date,
      end: Date,
      preset: { 
        type: String, 
        enum: ['last_7_days', 'last_15_days', 'last_30_days', 'last_3_months', 'last_6_months', 'current_year', 'custom']
      }
    },
    
    // Geographic (Auto-applied based on role)
    geographic: {
      states: [String],              
      districts: [String],           
      auto_filtered: Boolean         
    },
    
    // Training Filters
    training: {
      themes: [String],              
      verification_status: {
        type: String,
        enum: ['all', 'verified', 'pending'],
        default: 'verified'
      }
    },
    
    // Specific Targets
    specific_targets: {
      trainer_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      district_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'District' }]
    }
  },
  
  // Generated Report Data
  report_data: {
    summary: {
      total_trainings: Number,
      total_participants: Number,
      unique_districts: Number,
      unique_trainers: Number,
      avg_participants_per_training: Number,
      date_range_covered: String
    },
    
    geographic_breakdown: [{
      state: String,
      district: String,
      training_count: Number,
      participant_count: Number,
      last_training_date: Date
    }],
    
    theme_distribution: [{
      theme: String,
      count: Number,
      participants: Number,
      percentage: Number
    }],
    
    top_performers: {
      districts: [{
        name: String,
        state: String,
        training_count: Number
      }],
      trainers: [{
        name: String,
        email: String,
        sessions_conducted: Number,
        total_participants: Number
      }]
    },
    
    gaps: {
      districts_with_zero_trainings: [{
        name: String,
        state: String
      }],
      inactive_districts: [{
        name: String,
        state: String,
        last_training_date: Date,
        days_since_last: Number
      }]
    },
    
    monthly_trends: [{
      month: String,
      training_count: Number,
      participant_count: Number
    }]
  },
  
  // AI Insights
  ai_insights: {
    executive_summary: String,
    key_findings: [String],
    recommendations: [String],
    trend_analysis: String
  },
  
  // File Info
  file_path: String,
  file_size: Number,
  generation_time_ms: Number,
  
  error_message: String
  
}, { 
  timestamps: true 
});

// Indexes
reportSchema.index({ generated_by: 1, createdAt: -1 });
reportSchema.index({ status: 1 });
reportSchema.index({ type: 1, generated_by_role: 1 });

module.exports = mongoose.model('Report', reportSchema);