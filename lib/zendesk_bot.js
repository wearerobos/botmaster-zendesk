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
      getTicketDataById({ credentials: this.credentials, baseUrl: this.baseUrl, ticketId: update.id })
        .then(([ticket, attachments]) => {
          resolve({
            raw: Object.assign({ attachments }, ticket),
            sender: {
              id: ticket.requester_id,
            },
            recipient: {
              // TODO: define what the recipient id should be
              id: null,
            },
            timestamp: new Date(ticket.updated_at).getTime(),
            message: {
              mid: ticket.id,
              seq: null,
            },
            attachments,
          });
        })
        .catch(reject);
    });
  }
};

function getTicketDataById({ credentials, baseUrl, ticketId }) {
  const authToken = getAuthToken(credentials);
  const ticketDataUri = `${baseUrl}/tickets/${ticketId}.json`;
  const ticketCommentsUri = `${baseUrl}/tickets/${ticketId}/comments.json`;

  const json = true;
  const headers = {
    Authorization: authToken,
  };

  return Promise.all([
    request({ json, headers, uri: ticketDataUri }),
    request({ json, headers, uri: ticketCommentsUri }).then(attachments => attachments.map(formatAttachments)),
  ]);
}

function getAuthToken(credentials) {
  const { email, token } = credentials;
  const authToken = Buffer.from(`${email}/token:${token}`).toString('base64');
  return authToken;
}

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
