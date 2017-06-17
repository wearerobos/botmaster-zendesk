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

    this.id = this.credentials.subdomain;
    this.baseUrl = `https://${this.credentials.subdomain}.zendesk.com/api/v2`;
  }

  __formatUpdate(update) {
    return new Promise(resolve => resolve({
      raw: update,
      sender: {
        id: update.requester_id,
      },
      recipient: {
        // TODO: define what the recipient id should be
        id: null,
      },
      timestamp: new Date(update.updated_at).getTime(),
      message: {
        mid: update.id,
        seq: null,
      },
      // TODO: needs to make an HTTP req to /comments.json to get it
      attachments: [],
    }));
  }
};
