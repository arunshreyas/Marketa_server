const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Message = require('../models/Messages');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const Campaign = require('../models/Campaigns');

// @desc    Get all messages
// @route   GET /api/messages
// @access  Public
const getAllMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find()
    .populate('sender', 'username email')
    .populate('campaign', 'campaign_name campaign_id')
    .sort({ createdAt: -1 })
    .limit(100); // Limit to prevent huge responses
  
  res.json(messages);
});

// @desc    Get all messages for a campaign
// @route   GET /api/messages/campaign/:campaignId
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
    .populate('campaign', 'campaign_name campaign_id')
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
    content,
    metadata
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
    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      res.status(400);
      throw new Error('Invalid sender ID format');
    }
    const sender = await User.findById(senderId);
    if (!sender) {
      res.status(404);
      throw new Error('Sender not found');
    }
  }

  // Validate role
  const validRoles = ['user', 'assistant', 'system'];
  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error('Invalid role. Must be one of: user, assistant, system');
  }

  // Create message
  const message = await Message.create({
    message_id: uuidv4(),
    campaign: campaign ? campaign._id : undefined,
    sender: senderId ? senderId : undefined,
    role,
    content,
    metadata: metadata || {}
  });

  res.status(201).json(message);
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

  const { content, metadata } = req.body;
  
  if (content !== undefined) message.content = content;
  if (metadata !== undefined) message.metadata = metadata;

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

