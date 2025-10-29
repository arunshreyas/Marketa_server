const { default: mongoose } = require("mongoose");
const { v4: uuidv4 } = require("uuid"); 

const campaignSchema = new mongoose.Schema({
  campaign_id: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",  
    required: true
  },
  campaign_name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  goals: {
    type: String,
    required: true
  },
  channels: {
    type: String,
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  audience: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
