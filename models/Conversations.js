const {default: mongoose} = require("mongoose");

const { v4: uuidv4 } = require("uuid"); 

const conversationSchema = new mongoose.Schema({
  conversation_id: {
    type: String,
    default: uuidv4, 
    unique: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaign_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: false
  },
  title: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  context: {
    business_type: String,
    industry: String,
    target_audience: [String],
    marketing_goal: String,
    tone: String,
    competitors: [String],
    unique_selling_points: [String]
  },
  // Messages are now stored in the Message collection; keep denormalized summaries
  last_message: {
    role: { type: String, enum: ['user', 'assistant', 'system'] },
    content: { type: String },
    timestamp: { type: Date }
  },
  last_message_at: { type: Date },
  message_count: { type: Number, default: 0 },
  ai_preferences: {
    marketing_style: String,
    tone: String,
    favorite_frameworks: [String]
  }
}, { timestamps: true });

// Helpful indexes
conversationSchema.index({ user_id: 1, status: 1, updatedAt: -1 });
conversationSchema.index({ campaign_id: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);