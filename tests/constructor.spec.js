const ZendeskBot = require('../lib');
const config = require('./_config.js');

describe('Constructor', () => {
  it('Bot is instantiated with correct settings', () => {
    const credentials = config.credentials();
    const bot = new ZendeskBot({
      credentials,
    });

    expect(bot.type).toEqual('zendesk');
    expect(bot.requiresWebhook).toBe(false);
    expect(bot.requiredCredentials).toMatchObject(['subdomain', 'email', 'token']);

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
});
