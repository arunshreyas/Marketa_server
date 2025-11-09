const {default:mongoose} = require("mongoose");
const {v4:uuidv4} = require("uuid");

const responseSchema = new mongoose.Schema({
  response_id: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Campaign",  
    required: true
  },
  message_id: {
    type: String,
    required: false
  },
  response: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Response", responseSchema);