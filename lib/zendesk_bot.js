const BaseBot = require('botmaster').BaseBot;
const request = require('request-promise');

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
    return new Promise((resolve, reject) => {
      const { email, token } = this.credentials;
      const authToken = Buffer.from(`${email}/token:${token}`).toString('base64');
      const reqOptions = {
        uri: `${this.baseUrl}/tickets/${update.id}/comments.json`,
        headers: {
          Authorization: authToken,
        },
        json: true,
      };
      request(reqOptions)
        .then(attachments => attachments.map(formatAttachments))
        .then(attachments =>
          resolve({
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
            attachments,
          }))
        .catch(reject);
    });
  }
};

function formatAttachments(attachment) {
  return {
    type: parseContentType(attachment.content_type),
    payload: {
      url: attachment.content_url,
    },
  };
}

function parseContentType(type) {
  // TODO: this is somewhat naive so think of a better solution
  if (type.includes('image/')) {
    return 'image';
  }
  if (type.includes('application/')) {
    return 'file';
  }
  return '';
}
