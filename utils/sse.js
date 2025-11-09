const clientsByCampaign = new Map();

function addClient(campaignId, res) {
  let set = clientsByCampaign.get(campaignId);
  if (!set) {
    set = new Set();
    clientsByCampaign.set(campaignId, set);
  }
  set.add(res);
}

function removeClient(campaignId, res) {
  const set = clientsByCampaign.get(campaignId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clientsByCampaign.delete(campaignId);
}

function sendEvent(campaignId, event, data) {
  const set = clientsByCampaign.get(campaignId);
  if (!set) return;
  const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try {
      res.write(payload);
    } catch (_) {
      // ignore broken pipe; connection cleanup happens on 'close'
    }
  }
}

module.exports = { addClient, removeClient, sendEvent };