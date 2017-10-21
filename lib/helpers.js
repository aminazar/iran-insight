/**
 * Created by Amin on 05/02/2017.
 */
const nodeMailer = require('nodemailer');
const env = require('../env');

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

module.exports = {
  isTestReq: function(req){return req.query.test==='tEsT'},
  adminCheck: function(username){return username==='admin'},
  sendMail: sendMail,
};