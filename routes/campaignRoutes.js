const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const {
  getAllCampaigns,
  getCampaignsByUser,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign
} = require('../controllers/campaignController');

// Protect all campaign routes
router.use(verifyJWT);

router.route('/')
  .get(getAllCampaigns)
  .post(createCampaign);

router.route('/user/:userId')
  .get(getCampaignsByUser);

router.route('/:id')
  .get(getCampaignById)
  .put(updateCampaign)
  .delete(deleteCampaign);

module.exports = router;
