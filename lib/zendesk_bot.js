const BaseBot = require('botmaster').BaseBot;
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');
const debug = require('debug')('botmaster-zendesk');

module.exports = class ZendeskBot extends BaseBot {
  constructor(settings) {
    super(settings);

    this.type = 'zendesk';

    this.requiresWebhook = true;
    this.requiredCredentials = ['subdomain', 'email', 'token'];

    Object.assign(this.receives, {
      text: true,
      attachment: {
        file: true,
      },
    });

    Object.assign(this.sends, {
      text: true,
      attachment: {
        file: true,
      },
    });

    this.__applySettings(settings);

    this.id = this.credentials.subdomain;
    this.baseUrl = `https://${this.credentials.subdomain}.zendesk.com/api/v2`;

    this.__createMountPoints();
  }

  __createMountPoints() {
    debug('botmaster-zendesk: Creating mount points');
    this.app = express();
    this.requestListener = this.app;
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    this.app.post('*', (req, res) => {
      debug('botmaster-zendesk: got a request');
      this
        .__formatUpdate(req.body)
        .then(this.__emitUpdate)
        .catch((err) => {
          debug('botmaster-zendesk: Got an error while formatting the update: ', err);
          Object.assign(err, { message: `Error in __formatUpdate "${err.message}". Please report this.` });
          this.emit('error', err);
        });

      res.sendStatus(200);
    });
  }

  __formatUpdate(update) {
    debug('botmaster-zendesk: got new update: ', update);
    return new Promise((resolve, reject) => {
      getTicketDataById({ credentials: this.credentials, baseUrl: this.baseUrl, update })
        .then(([ticket, attachments]) => {
          debug('botmaster-zendesk: formatting update');
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
        .catch((err) => {
          debug(`botmaster-zendesk: error while getting ticket ${update.id} data: `, err);
          reject(err);
        });
    });
  }

  __formatOutgoingMessage(update) {
    return {
      _id: update.recipient.id,
      ticket: {
        comment: {
          body: update.message.text,
        },
      },
    };
  }

  __sendMessage(rawMessage) {
    debug('botmaster-zendesk: sending message');
    const ticketId = rawMessage._id;
    const options = {
      url: `${this.baseUrl}/tickets/${ticketId}.json`,
      method: 'PUT',
      json: rawMessage,
    };
    return request(options);
  }

  __createStandardBodyResponseComponents(sentOutgoingMessage, sentRawMessage, rawBody) {
    if (rawBody.error) {
      throw new Error(JSON.stringify(rawBody.error));
    }

    return {
      recipient_id: sentOutgoingMessage.recipient.id,
      message_id: sentOutgoingMessage.message.mid,
      sentOutgoingMessage,
      sentRawMessage,
      rawBody,
    };
  }
};

function getTicketDataById({ credentials, baseUrl, update }) {
  const authToken = getAuthToken(credentials);
  const ticketDataUri = `${baseUrl}/tickets/${update.ticket_id}.json`;
  const ticketCommentsUri = `${baseUrl}/tickets/${update.ticket_id}/comments.json`;

  const json = true;
  const headers = {
    Authorization: authToken,
  };

  return Promise.all([
    request({ json, headers, uri: ticketDataUri }),
    request({ json, headers, uri: ticketCommentsUri })
      .then(response => response.comments.find(comment => comment.id === update.comment_id))
      .then(comments => comments.attachments.map(formatAttachments)),
  ]);
}

function getAuthToken(credentials) {
  const { email, token } = credentials;
  const authToken = Buffer.from(`${email}/token:${token}`).toString('base64');
  return `Basic ${authToken}`;
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
