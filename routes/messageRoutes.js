const express = require('express');
const router = express.Router();
const {
  getAllMessages,
  getMessagesByCampaign,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage
} = require('../controllers/messageController');

// Get messages by campaign
router.route('/campaign/:campaignId')
  .get(getMessagesByCampaign);

// General message routes
router.route('/')
  .get(getAllMessages)
  .post(createMessage);

router.route('/:id')
  .get(getMessageById)
  .put(updateMessage)
  .delete(deleteMessage);

module.exports = router;

