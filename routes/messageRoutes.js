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
const { addClient, removeClient } = require('../utils/sse');

// Get messages by campaign
router.route('/campaign/:campaignId')
  .get(getMessagesByCampaign);

// General message routes
router.route('/')
  .get((req, res, next) => {
    console.log('GET /messages route called');
    next();
  }, getAllMessages)
  .post((req, res, next) => {
    console.log('POST /messages route called');
    next();
  }, createMessage);

router.route('/:id')
  .get(getMessageById)
  .put(updateMessage)
  .delete(deleteMessage);

router.get('/stream/:campaignId', (req, res) => {
  const { campaignId } = req.params;

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  if (res.flushHeaders) res.flushHeaders();

  res.write(': connected\n\n');

  addClient(campaignId, res);

  const heartbeat = setInterval(() => {
    try { res.write('event: heartbeat\ndata: {}\n\n'); } catch (_) {}
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(campaignId, res);
    try { res.end(); } catch (_) {}
  });
});

module.exports = router;

