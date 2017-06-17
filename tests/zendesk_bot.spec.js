const ZendeskBot = require('../lib');
const config = require('./_config.js');

describe('Zendesk Bot', () => {
  const credentials = config.credentials();

  let bot = null;

  beforeEach(() => {
    bot = new ZendeskBot({
      credentials,
    });
  });

  it('Constructor instantiates bot with correct settings', () => {
    expect(bot.type).toEqual('zendesk');
    expect(bot.requiresWebhook).toBe(false);
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

  it('__formatUpdate correctly formats the update that comes from the API', () => {
    const update = config.sampleUpdate();
    const promise = bot.__formatUpdate(update);
    expect(promise).resolves.toMatchObject({
      raw: config.sampleUpdate(),
      sender: {
        id: 20978392,
      },
      recipient: {
        id: null,
      },
      timestamp: 1304591932000,
      message: {
        mid: 35436,
        seq: null,
      },
      attachments: [],
    });
  });
});
