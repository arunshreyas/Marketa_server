const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Message = require('../models/Messages');
const Conversation = require('../models/Conversations');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all messages for a conversation
// @route   GET /api/messages/conversation/:conversationId
// @access  Public
const getMessagesByConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    res.status(400);
    throw new Error('Invalid conversation ID format');
  }

  // Verify conversation exists
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  const messages = await Message.find({ conversation: conversationId })
    .populate('sender', 'username email')
    .sort({ createdAt: 1 });
  
  res.json(messages);
});

// @desc    Get single message
// @route   GET /api/messages/:id
// @access  Public
const getMessageById = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id)
    .populate('conversation', 'title conversation_id')
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
    conversation: conversationId,
    sender: senderId,
    role,
    content,
    metadata
  } = req.body;

  if (!conversationId || !role || !content) {
    res.status(400);
    throw new Error('Conversation ID, role, and content are required');
  }

  // Validate conversation exists
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    res.status(400);
    throw new Error('Invalid conversation ID format');
  }
  
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
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
    conversation: conversation._id,
    sender: senderId ? senderId : undefined,
    role,
    content,
    metadata: metadata || {}
  });

  // Update conversation's last message info
  conversation.last_message = {
    role: message.role,
    content: message.content,
    timestamp: message.createdAt
  };
  conversation.last_message_at = message.createdAt;
  conversation.message_count = (conversation.message_count || 0) + 1;
  await conversation.save();

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
  
  // Update conversation's message count
  const conversation = await Conversation.findById(message.conversation);
  if (conversation && conversation.message_count > 0) {
    conversation.message_count -= 1;
    await conversation.save();
  }
  
  res.status(200).json({ message: 'Message deleted successfully' });
});

module.exports = {
  getMessagesByConversation,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage
};

