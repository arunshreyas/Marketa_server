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
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      ai_model: String,
      tokens_used: Number,
      campaign_suggestions: [String]
    }
  }],
  ai_preferences: {
    marketing_style: String,
    tone: String,
    favorite_frameworks: [String]
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);