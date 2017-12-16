/**
 * Created by ali71 on 18/10/2017.
 */
const helper = require('../../lib/helpers');

describe("Helper functions",()=>{
  it("should send mail to specific address", done => {
    let plainText = 'This is test.js mail';
    let htmlText = `<p>This is test mail</p>`;
    let to = 'ali.71hariri@gmail.com';
    let subject = 'Test sending mail functionality';

    helper.sendMail(plainText, htmlText, subject, to)
      .then(res => {
        expect(res).toBe('mail is sent');
        done();
      })
      .catch(err => {
        fail('Cannot send mail: ', err);
        done();
      });
  }, 15000);
});