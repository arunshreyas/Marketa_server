const { default: mongoose } = require("mongoose"); 

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: String,
  profile_picture: {
    type: String,
    default: null // URL or path to the profile picture
  },
  business_profile: {
    industry: String,
    target_audience: [String],
    marketing_goals: [String]
  },
  subscription: {
    plan: { type: String, default: 'free' },
    status: { type: String, default: 'active' }
  },
  usage_metrics: {
    ai_requests_this_month: { type: Number, default: 0 }
  },
  campaigns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }]

}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);