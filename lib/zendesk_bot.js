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
    debug('Creating mount points');
    this.app = express();
    this.requestListener = this.app;
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    this.app.post('*', (req, res) => {
      debug('got a request');
      this
        .__formatUpdate(req.body)
        .then(update => this.__emitUpdate(update))
        .catch((err) => {
          debug('Got an error while formatting the update: ', err);
          Object.assign(err, { message: `Error in __formatUpdate "${err.message}". Please report this.` });
          this.emit('error', err);
        });

      res.sendStatus(200);
    });
  }

  __formatUpdate(update) {
    debug('got new update: ', update);
    return new Promise((resolve, reject) => {
      getTicketDataById({ credentials: this.credentials, baseUrl: this.baseUrl, update })
        .then(([ticket, comment]) => {
          debug('formatting update');
          resolve({
            raw: Object.assign({ comment }, ticket),
            sender: {
              id: ticket.requester_id,
            },
            recipient: {
              id: this.credentials.email,
            },
            timestamp: new Date(ticket.updated_at).getTime(),
            message: {
              mid: ticket.id,
              seq: comment.id,
              text: comment.body,
            },
            attachments: comment.attachments.map(formatAttachments),
          });
        })
        .catch((err) => {
          debug(`botmaster-zendesk: error while getting ticket ${update.ticket_id} data: `, err);
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

  /**
   * Replies a simple text message to the ticket. We need to overwrite it because in Zendesk you don't reply
   * to a user but to a ticket.
   * @param  {object} incomingUpdate
   * @param  {string} text           text to send as a public commentary to the ticket
   * @param  {object} [sendOptions]    see `sendOptions` for `sendMessage`
   * @return {Promise} promise that resolves with a body object
   */
  reply(incomingUpdate, text, sendOptions) {
    return this.sendTextMessageTo(text, incomingUpdate.message.mid, sendOptions);
  }

  __sendMessage(rawMessage) {
    const ticketId = rawMessage._id;
    const authToken = getAuthToken(this.credentials);
    const options = {
      url: `${this.baseUrl}/tickets/${ticketId}.json`,
      method: 'PUT',
      json: rawMessage,
      headers: { Authorization: authToken },
    };

    debug('sending message with credentials: ', options);
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

  // we get only the ticket's id and the last comment's id in the update, so we need to request the rest of the data
  return Promise.all([
    request({ json, headers, uri: ticketDataUri }).then(response => response.ticket),
    request({ json, headers, uri: ticketCommentsUri })
      .then(response => response.comments.find(comment => Number(comment.id) === Number(update.comment_id))),
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
