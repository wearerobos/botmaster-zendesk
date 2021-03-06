module.exports = {
  credentials() {
    return {
      subdomain: 'mydomain',
      email: 'myemail@domain.com',
      token: '1t30m3203',
    };
  },
  sampleUpdate: () => ({
    ticket: {
      id: 35436,
      url: 'https://company.zendesk.com/api/v2/tickets/35436.json',
      external_id: 'ahg35h3jh',
      created_at: '2009-07-20T22:55:29Z',
      updated_at: '2011-05-05T10:38:52Z',
      type: 'incident',
      subject: 'Help, my printer is on fire!',
      raw_subject: '{{dc.printer_on_fire}}',
      description: 'The fire is very colorful.',
      priority: 'high',
      status: 'open',
      recipient: 'support@company.com',
      requester_id: 20978392,
      submitter_id: 76872,
      assignee_id: 235323,
      organization_id: 509974,
      group_id: 98738,
      collaborator_ids: [35334, 234],
      forum_topic_id: 72648221,
      problem_id: 9873764,
      has_incidents: false,
      due_at: null,
      tags: ['enterprise', 'other_tag'],
      via: {
        channel: 'web',
      },
      custom_fields: [
        {
          id: 27642,
          value: '745',
        },
        {
          id: 27648,
          value: 'yes',
        },
      ],
      satisfaction_rating: {
        id: 1234,
        score: 'good',
        comment: 'Great support!',
      },
      sharing_agreement_ids: [84432],
    },
  }),
  sampleComments: () => ({
    comments: [{
      id: 1234,
      body: 'The fire is very colorful.',
      attachments: [
        {
          url: 'https://mydomain.zendesk.com/api/v2/attachments/8233553527.json',
          id: 8137133527,
          file_name: 'image001.gif',
          content_url: 'https://mydomain.zendesk.com/attachments/token/qj3xHCwPahyITjF5wt912W2ew/?name=image001.gif',
          mapped_content_url: 'https://mydomain.zendesk.com/attachments/token/qj3xHCwPahyITjF5wt912W2ew/?name=image001.gif',
          content_type: 'image/gif',
          size: 3022,
          width: null,
          height: null,
          inline: false,
          thumbnails: [
            {
              url: 'https://mydomain.zendesk.com/api/v2/attachments/8233553527.json',
              id: 8137133767,
              file_name: 'image001_thumb.gif',
              content_url: 'https://mydomain.zendesk.com/attachments/token/vhE12AbjjdGXPl8sYMGy3UfTa/?name=image001_thumb.gif',
              mapped_content_url: 'https://mydomain.zendesk.com/attachments/token/vhE12AbjjdGXPl8sYMGy3UfTa/?name=image001_thumb.gif',
              content_type: 'image/gif',
              size: 3022,
              width: 80,
              height: 18,
              inline: false,
            },
          ],
        },
        {
          url: 'https://mydomain.zendesk.com/api/v2/attachments/8310755868.json',
          id: 8310755868,
          file_name: 'yarn.lock',
          content_url: 'https://mydomain.zendesk.com/attachments/token/KjzjWAsbu9tcMiv7ukIaF9yXX/?name=yarn.lock',
          mapped_content_url: 'https://mydomain.zendesk.com/attachments/token/KjzjWAsbu9tcMiv7ukIaF9yXX/?name=yarn.lock',
          content_type: 'application/unknown',
          size: 86,
          width: null,
          height: null,
          inline: false,
          thumbnails: [],
        },
      ],
    }],
  }),
};
