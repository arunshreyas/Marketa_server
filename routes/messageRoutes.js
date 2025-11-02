const express = require('express');
const router = express.Router();
const {
  getAllMessages,
  getMessagesByConversation,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage
} = require('../controllers/messageController');

// Get messages by conversation
router.route('/conversation/:conversationId')
  .get(getMessagesByConversation);

// General message routes
router.route('/')
  .get(getAllMessages)
  .post(createMessage);

router.route('/:id')
  .get(getMessageById)
  .put(updateMessage)
  .delete(deleteMessage);

module.exports = router;

