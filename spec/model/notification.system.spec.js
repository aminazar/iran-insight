const Notification = require('../../lib/notification.system');
const sql  = require('../../sql');
const helpers = require('../../lib/helpers');

describe("Notification model",()=> {
  it("should send message with message builder", done => {
    let data = [
      {
        bid: 1,
        name: 'Snapp Business',
        message: 'Message from Snapp business',
      },
      {
        mid: 1,
        name: 'Asghar Agha',
        message: 'Ask be representative of supermarket',
      },
      {
        mid: 1,
        name: 'Agha Essi',
        message: 'Confirm your member. You now the member of BerizBepash organization',
      },
      {
        oid: 4,
        name: 'DONTCARE ORG',
        message: 'This organization change his profile',
      },
      {
        bid: 2,
        name: 'ZoodFood',
        message: 'We need more sugar',
      },
      {
        pid: 7,
        name: 'John',
        message: 'I had good date two month ago',
      },
      {
        pid: 5,
        name: 'Marry',
        message: 'Be polite. I can ... (sorry for continue of sentence.)',
      },
    ];

    let notification = new Notification();
    let result = notification.buildingMessage('d', data, 1, '12345');
    helpers.sendMail(result.body_plain, result.body_html, result.subject, 'ali.71hariri@gmail.com')
      .then(res => {
        expect(res).toBeTruthy();
        done();
      })
      .catch(err => {
        fail(err);
        done();
      })
  });
});