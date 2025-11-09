const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Message = require('../models/Messages');
const axios = require("axios");

const User = require('../models/User');
const Campaign = require('../models/Campaign');
const { v4: uuidv4 } = require('uuid');
const { sendEvent } = require('../utils/sse');

// @desc    Get all messages
// @route   GET /api/messages
// @access  Public
const getAllMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find()
    .populate('sender', 'username email')
    .populate('campaign', 'campaign_name campaign_id user')
    .sort({ createdAt: -1 })
    .limit(100); // Limit to prevent huge responses
  
  res.json(messages);
});

// @desc    Get all messages for a conversation
// @route   GET /api/messages/conversation/:conversationId
// @access  Public
const getMessagesByCampaign = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    res.status(400);
    throw new Error('Invalid campaign ID format');
  }

  // Verify campaign exists
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  const messages = await Message.find({ campaign: campaignId })
    .populate('sender', 'username email')
    .sort({ createdAt: 1 });
  
  res.json(messages);
});

// @desc    Get single message
// @route   GET /api/messages/:id
// @access  Public
const getMessageById = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id)
    .populate('campaign', 'campaign_name campaign_id user')
    .populate('sender', 'username email');
  
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }
  
  res.json(message);
});

// @desc    Create a new message
// @route   POST /api/messages
// @access  Public
const createMessage = asyncHandler(async (req, res) => {
  const {
    campaign: campaignId,
    sender: senderId,
    role,
    content
  } = req.body;

  if (!role || !content) {
    res.status(400);
    throw new Error('Role and content are required');
  }

  // Validate campaign if provided (optional)
  let campaign = null;
  if (campaignId) {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      res.status(400);
      throw new Error('Invalid campaign ID format');
    }
    campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      res.status(404);
      throw new Error('Campaign not found');
    }
  }

  // Validate sender if provided (optional for assistant/system messages)
  if (senderId) {
    try {
      if (mongoose.Types.ObjectId.isValid(senderId)) {
        const sender = await User.findById(senderId);
        if (!sender) {
          // ignore bad sender; proceed without linking
          req.body.sender = undefined;
        }
      } else {
        // ignore invalid format; proceed without linking
        req.body.sender = undefined;
      }
    } catch (_) {
      req.body.sender = undefined;
    }
  }

  // Create user message
  const userMessage = await Message.create({
    message_id: uuidv4(),
    campaign: campaign ? campaign._id : undefined,
    sender: (senderId && mongoose.Types.ObjectId.isValid(senderId)) ? senderId : undefined,
    role,
    content,
  });

  // Optional: trigger n8n webhook for AI reply
  let aiMessage = null;
  try {
    if (process.env.N8N_WEBHOOK_URL) {
      const n8nResponse = await axios.post(process.env.N8N_WEBHOOK_URL, {
        campaignId: campaignId || null,
        userId: senderId || null,
        userMessage: content,
        message_id: userMessage.message_id
      });
      const aiReplyText = n8nResponse?.data?.reply;
      if (aiReplyText) {
        aiMessage = await Message.create({
          message_id: uuidv4(),
          campaign: campaign ? campaign._id : undefined,
          role: 'assistant',
          content: aiReplyText,
        });
        if (campaign) {
          try { sendEvent(campaign._id.toString(), 'message:new', aiMessage); } catch (_) {}
        }
      }
    }
  } catch (err) {
    console.error('n8n webhook error:', err.message);
  }

  res.status(201).json({ success: true, userMessage, aiMessage });
});

// @desc    Update a message
// @route   PUT /api/messages/:id
// @access  Public
const updateMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  const { content } = req.body;
  
  if (content !== undefined) message.content = content;

  await message.save();
  
  res.json({
    message: 'Message updated successfully',
    message_data: message
  });
});

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Public
const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid message ID format');
  }

  const message = await Message.findById(id);
  
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  await Message.findByIdAndDelete(id);
  
  res.status(200).json({ message: 'Message deleted successfully' });
});

module.exports = {
  getAllMessages,
  getMessagesByCampaign,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage
};
