const BaseBot = require('botmaster').BaseBot;

module.exports = class ZendeskBot extends BaseBot {
  constructor(settings) {
    super(settings);

    this.type = 'zendesk';

    this.requiredCredentials = ['subdomain', 'email', 'token'];

    this.receives = {
      text: true,
      attachment: {
        file: true,
      },
    };

    this.sends = {
      text: true,
      attachment: {
        file: true,
      },
    };

    this.__applySettings(settings);
    this.baseUrl = `https://${this.credentials.subdomain}.zendesk.com/api/v2`;
  }
};
