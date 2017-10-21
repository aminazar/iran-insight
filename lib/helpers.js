/**
 * Created by Amin on 05/02/2017.
 */
const nodeMailer = require('nodemailer');
const env = require('../env');
function parseServerError(err) {
  try {
    let a;
    let dashPlace = err.message.indexOf('- ');
    let statusCode = err.message.substring(0, dashPlace);
    eval(`a=${err.message.substring(dashPlace + 2)}`);
    err = JSON.parse(a);
    return `\nStatus: ${statusCode}\nMessage: ${err.Message}\nServer stack:\n${err.Stack}`;
  } catch (e) {
    return err;
  }
}

let sendMail = function (plainContent, htmlContent, mailSubject, mailTo) {
  return new Promise((resolve, reject) => {
    let transporter = nodeMailer.createTransport(env.mailConfig);

    let mailOptions = {
      from: env.mailConfig.from,
      to: mailTo,
      subject: mailSubject,
      text: plainContent,
      html: htmlContent
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if(err){
        console.log('Error when sending mail: ', err);
        reject(err);
      }
      else{
        console.log('Message sent: ', info);
        resolve('mail is sent');
      }
    });
  });
};
function apiTestURL(api) {
  return ["http://localhost:3000/api/", api, '?test=tEsT'].join('');
}

module.exports = {
  isTestReq: function(req){return req.query.test==='tEsT'},
  adminCheck: function(username){return username==='admin'},
  parseServerError: parseServerError,
  apiTestURL: apiTestURL,
  sendMail: sendMail,
};