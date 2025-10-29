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
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      ai_model: { type: String },
      tokens_used: { type: Number },
      campaign_suggestions: [{ type: String }],
      // Extend with any message-level metadata you need
    },
  },
  { timestamps: true }
);

// Helpful compound index for fetching messages in a conversation by time
messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);


