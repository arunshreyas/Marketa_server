const agentSelector = (campaignType) => {
  switch ((campaignType || '').toLowerCase()) {
    case 'funnel':
      return 'funnel';
    case 'ads':
      return 'ads';
    case 'research':
      return 'research';
    case 'content':
      return 'content';
    default:
      return 'content';
  }
};

module.exports = agentSelector;
