const nock = require('nock');

const ZendeskBot = require('../lib');
const config = require('./_config.js');

describe('Zendesk Bot', () => {
  const credentials = config.credentials();
  const myDomain = 'https://mydomain.zendesk.com/api/v2';

  let bot = null;

  beforeEach(() => {
    bot = new ZendeskBot({
      credentials,
      webhookEndpoint: 'webhook1234',
    });
  });

  it('Constructor instantiates bot with correct settings', () => {
    expect(bot.type).toEqual('zendesk');
    expect(bot.requiresWebhook).toBe(true);
    expect(bot.requiredCredentials).toMatchObject(['subdomain', 'email', 'token']);

    expect(bot.id).toEqual(config.credentials().subdomain);

    expect(bot.receives).toMatchObject({
      text: true,
      attachment: {
        file: true,
      },
    });

    expect(bot.sends).toMatchObject({
      text: true,
      attachment: {
        file: true,
      },
    });

    expect(bot.retrievesUserInfo).toBe(false);
    expect(bot.baseUrl).toEqual(`https://${credentials.subdomain}.zendesk.com/api/v2`);
  });

  it('Formats the update that comes from the API', () => {
    const update = {
      ticket_id: config.sampleUpdate().id,
      comment_id: 1234,
    };

    nock(myDomain)
      .get(`/tickets/${update.ticket_id}/comments.json`)
      .reply(200, config.sampleComments());

    nock(myDomain)
      .get(`/tickets/${update.ticket_id}.json`)
      .reply(200, config.sampleUpdate());

    const promise = bot.__formatUpdate(update);
    expect(promise).resolves.toMatchObject({
      raw: config.sampleUpdate(),
      sender: {
        id: 20978392,
      },
      recipient: {
        // TODO: define what should be here
        id: null,
      },
      timestamp: 1304591932000,
      message: {
        mid: 35436,
        // TODO: define what should be here
        seq: null,
      },
      attachments: [{
        type: 'image',
        payload: {
          url: 'https://mydomain.zendesk.com/attachments/token/qj3xHCwPahyITjF5wt912W2ew/?name=image001.gif',
        },
      }, {
        type: 'file',
        payload: {
          url: 'https://mydomain.zendesk.com/attachments/token/KjzjWAsbu9tcMiv7ukIaF9yXX/?name=yarn.lock',
        },
      }],
    });
  });

  it('Formats a text-only update to the format that Zendesk API requires', () => {
    const update = {
      sender: { id: 1234 },
      recipient: { id: 35436 },
      timestamp: 1497895333705,
      message: {
        text: 'Heyllo',
      },
    };

    const outgoingMessage = bot.__formatOutgoingMessage(update);
    expect(outgoingMessage).toMatchObject({
      ticket: {
        comment: {
          body: 'Heyllo',
        },
      },
    });
  });

  it('Sends an OutgoingMessage to Zendesk', () => {
    const update = {
      sender: { id: 1234 },
      recipient: { id: 35436 },
      timestamp: 1497895333705,
      message: {
        text: 'Heyllo',
      },
    };
    const outgoingMessage = bot.__formatOutgoingMessage(update);

    nock(myDomain)
      .put(`/tickets/${update.recipient.id}.json`, outgoingMessage)
      .delay(0)
      .reply(200);
    return bot
      .__sendMessage(outgoingMessage)
      .then(() => {
        expect(nock.isDone()).toBe(true);
      });
  });
});
