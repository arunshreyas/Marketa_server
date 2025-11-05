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
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
   
  },
  { timestamps: true }
);

// Helpful compound index for fetching messages in a campaign by time
messageSchema.index({ campaign: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);


