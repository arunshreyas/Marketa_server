const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const {
  getMessagesByConversation,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
  createMessageAndTriggerAI
} = require('../controllers/messageController');

// Get messages by conversation
router.route('/conversation/:conversationId')
  .get(getMessagesByConversation);

// General message routes
router.route('/')
  .post(createMessage);

// AI-powered message route (must come before /:id to avoid route conflicts)
router.post('/ai', verifyJWT, createMessageAndTriggerAI);

router.route('/:id')
  .get(getMessageById)
  .put(updateMessage)
  .delete(deleteMessage);

module.exports = router;

