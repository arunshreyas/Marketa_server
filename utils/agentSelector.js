const agentSelector = (campaignType) => {
  const normalized = (campaignType || '').toLowerCase();

  let agent;
  switch (normalized) {
    case 'funnel':
      agent = 'funnel';
      break;
    case 'ads':
      agent = 'ads';
      break;
    case 'research':
      agent = 'research';
      break;
    case 'content':
      agent = 'content';
      break;
    default:
      agent = 'content';
      break;
  }

  console.log('Selected agent:', { campaignType: campaignType || null, agent });
  return agent;
};

module.exports = agentSelector;
