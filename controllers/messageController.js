const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const axios = require('axios');
const Message = require('../models/Messages');
const Conversation = require('../models/Conversations');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const { logEvents } = require('../middleware/logger');

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

// @desc    Create message and trigger AI reply via n8n webhook
// @route   POST /api/messages/ai
// @access  Private (JWT required)
const createMessageAndTriggerAI = asyncHandler(async (req, res) => {
  try {
    // Validate JWT - req.userId should be set by verifyJWT middleware
    if (!req.userId) {
      res.status(401);
      throw new Error('Unauthorized - No user ID found in token');
    }

    const {
      conversation: conversationId,
      campaignId,
      content,
      context
    } = req.body;

    // Validate required fields
    if (!conversationId || !content) {
      res.status(400);
      throw new Error('Conversation ID and content are required');
    }

    // Validate conversation ID format
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400);
      throw new Error('Invalid conversation ID format');
    }

    // Verify conversation exists and belongs to user
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found');
    }

    if (conversation.user_id.toString() !== req.userId.toString()) {
      res.status(403);
      throw new Error('Access denied - This conversation does not belong to you');
    }

    // Validate user exists
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Save user's message first
    const userMessage = await Message.create({
      message_id: uuidv4(),
      conversation: conversation._id,
      sender: req.userId,
      role: 'user',
      content,
      metadata: {}
    });

    // Log user message creation
    console.log(`User message created: ${userMessage._id} for conversation: ${conversationId}`);

    // Update conversation with user's message
    conversation.last_message = {
      role: userMessage.role,
      content: userMessage.content,
      timestamp: userMessage.createdAt
    };
    conversation.last_message_at = userMessage.createdAt;
    conversation.message_count = (conversation.message_count || 0) + 1;
    await conversation.save();

    // Prepare payload for n8n webhook
    const n8nPayload = {
      userId: req.userId,
      conversationId: conversationId,
      campaignId: campaignId || conversation.campaign_id?.toString() || null,
      messageContent: content,
      context: context || conversation.context || {}
    };

    // Call n8n webhook
    let aiReplyContent = '';
    try {
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
      
      if (!n8nWebhookUrl) {
        console.error('N8N_WEBHOOK_URL not configured in environment variables');
        throw new Error('AI service is not configured');
      }

      console.log(`Calling n8n webhook: ${n8nWebhookUrl}`);
      
      const n8nResponse = await axios.post(n8nWebhookUrl, n8nPayload, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`n8n response status: ${n8nResponse.status}`);

      // Extract AI reply from n8n response
      if (n8nResponse.data && n8nResponse.data.reply) {
        aiReplyContent = n8nResponse.data.reply;
      } else if (typeof n8nResponse.data === 'string') {
        // Handle case where n8n returns a plain string
        aiReplyContent = n8nResponse.data;
      } else if (n8nResponse.data && n8nResponse.data.message) {
        // Handle alternative response format
        aiReplyContent = n8nResponse.data.message;
      } else {
        console.warn('Unexpected n8n response format:', JSON.stringify(n8nResponse.data).substring(0, 200));
        throw new Error('Invalid response format from AI service');
      }

      // Log for debugging (truncated)
      const truncatedReply = aiReplyContent.length > 100 
        ? aiReplyContent.substring(0, 100) + '...' 
        : aiReplyContent;
      console.log(`AI reply received (${aiReplyContent.length} chars): ${truncatedReply}`);

    } catch (n8nError) {
      // Log the error
      console.error('n8n webhook error:', n8nError.message);
      
      // Log detailed error information
      if (n8nError.response) {
        console.error('n8n response status:', n8nError.response.status);
        console.error('n8n response data:', n8nError.response.data);
        logEvents(
          `n8n Error: ${n8nError.message} - Status: ${n8nError.response.status}`,
          'errLog.log'
        );
      } else if (n8nError.request) {
        console.error('n8n request timeout or network error');
        logEvents(
          `n8n Network Error: ${n8nError.message}`,
          'errLog.log'
        );
      } else {
        logEvents(
          `n8n Error: ${n8nError.message}`,
          'errLog.log'
        );
      }

      // Use fallback reply
      aiReplyContent = 'AI is unavailable. Please try again later.';
    }

    // Save AI reply as a message
    const aiMessage = await Message.create({
      message_id: uuidv4(),
      conversation: conversation._id,
      sender: undefined, // AI messages don't have a human sender
      role: 'assistant',
      content: aiReplyContent,
      metadata: {
        ai_model: 'n8n_workflow',
        timestamp: new Date().toISOString()
      }
    });

    console.log(`AI message created: ${aiMessage._id}`);

    // Update conversation with AI's message
    conversation.last_message = {
      role: aiMessage.role,
      content: aiMessage.content,
      timestamp: aiMessage.createdAt
    };
    conversation.last_message_at = aiMessage.createdAt;
    conversation.message_count = (conversation.message_count || 0) + 1;
    await conversation.save();

    // Return both messages in the response
    res.status(201).json({
      status: 'success',
      userMessage: {
        _id: userMessage._id,
        message_id: userMessage.message_id,
        role: userMessage.role,
        content: userMessage.content,
        createdAt: userMessage.createdAt,
        updatedAt: userMessage.updatedAt
      },
      aiMessage: {
        _id: aiMessage._id,
        message_id: aiMessage.message_id,
        role: aiMessage.role,
        content: aiMessage.content,
        createdAt: aiMessage.createdAt,
        updatedAt: aiMessage.updatedAt,
        metadata: aiMessage.metadata
      }
    });

  } catch (error) {
    // Log the error
    console.error('createMessageAndTriggerAI error:', error.message);
    logEvents(
      `Message AI Error: ${error.message} - ${req.method} ${req.url}`,
      'errLog.log'
    );

    // Return error response
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
      status: 'error',
      message: error.message || 'An error occurred while processing your message'
    });
  }
});

module.exports = {
  getMessagesByConversation,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
  createMessageAndTriggerAI
};

