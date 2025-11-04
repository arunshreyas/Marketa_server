const { default: mongoose } = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const messageSchema = new mongoose.Schema(
  {
    message_id: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    // Optional relation to a conversation (not required)
    // Optional relation directly to a campaign
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: false,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
      default: 'user'
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

// Helpful compound index for fetching messages in a conversation by time
messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ campaign: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);


