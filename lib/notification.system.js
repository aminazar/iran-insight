let cron = require('node-cron');
let {mailPeriodConfig} = require('../env');
const sql = require('../sql');
const helpers = require('./helpers');

let dailyTask = cron.schedule(`${mailPeriodConfig.minute} ${mailPeriodConfig.hour} * * *`, function () {
  sendMailToRecipient('d');
});

let weeklyTask = cron.schedule(`${mailPeriodConfig.minute} ${mailPeriodConfig.hour} * * ${mailPeriodConfig.dayOfWeek}`, function () {
  sendMailToRecipient('w');
});

let notificationType = {
  Daily: 'd',
  Weekly: 'w',
  Never: 'n',
  Instantly: 'i',
};

let baseLink = 'https://iran-insight.com';

dailyTask.start();
weeklyTask.start();

console.log('Notification system is running ');

let sendMailToRecipient = (type) => {

  if (type !== 'w' && type !== 'd')
    return;

  sql.person.get({notify_period: type}).then(res => {

    if (res.length > 0) {

      res.forEach(person => {

        fetChNotifications(person.pid).forEach(note => {
          helpers.sendMail(note, null, 'notification', person.username).catch(err => console.log('-> ','failed to send email notification'));
        });
      });
    }
  });
};

let fetChNotifications = (pid) => {

  return [`note 1 for user ${pid}`,
    `note 2 for user ${pid}`,
    `note 3 for user ${pid}`]

};

let buildingMessage = (messageType, data, user_subscription_hash) => {
  let message = {
    subject: null,
    body_plain: '',
    body_html: '',
  };

  //Set subject part
  if (messageType === notificationType.Never)
    return null;

  switch (messageType) {
    case notificationType.Daily:
      message.subject = 'The daily report of Iran-Insight';
      break;
    case notificationType.Weekly:
      message.subject = 'The weekly report of Iran-Insight';
      break;
    case notificationType.Instantly:
      message.subject = 'Notification from Iran-Insight';
      break;
    default:
      message.subject = 'Notification from Iran-Insight';
      break;
  }

  //Set body part
  if (!data)
    return null;


  if (data.length === 1) {
    let item = data[0];
    let link = baseLink + '/';

    if (item.mid)
      link += 'message/' + item.mid;
    else if (item.pid)
      link += 'people/' + item.pid;
    else if (item.bid)
      link += 'business/' + item.bid;
    else if (item.oid)
      link += 'organization/' + item.oid;
    else {
      return null;
    }

    message.body_plain += 'You have new message from ' + item.name +
      '\n\t' + item.message +
      '\nTo see this message click on ' + link;
    message.body_html += `<div>
                                <div>You have new message from ${item.name}</div>
                                <div style="margin-left: 10px">${item.message}</div>
                                <div>To see this message click <a href="${link}">here</a></div>
                              </div>`;
  }
  else {
    let actionRequiredObjects = data.filter(el => el.mid);
    let personObjects = data.filter(el => el.pid);
    let businessObjects = data.filter(el => el.bid);
    let organizationObjects = data.filter(el => el.oid);

    //Generate Action Required Message
    let actionRequiredMessages_plain = (actionRequiredObjects.length) ? 'Your Messages\n' : null;
    let actionRequiredMessages_html = (actionRequiredObjects.length) ? `<div style="font-weight: bold">Your Messages</div>` : null;

    if (actionRequiredMessages_html) {
      let middleContent = '';
      actionRequiredObjects.forEach(el => {
        middleContent += `<tr>
                              <td>${el.name}</td>
                              <td>${el.message}</td>
                              <td><a href="${baseLink}/messages/${el.mid}" target="_blank">See Message</a></td>
                            </tr>`
      });
      actionRequiredMessages_html += `<div style="margin-left: 10px">
                                          <tabel>
                                            <thead>
                                              <td>Name</td>
                                              <td>Event</td>
                                              <td>Link</td>
                                            </thead>
                                            <tbody>` +
        middleContent +
        `</tbody>
                                          </tabel>
                                         </div>`;
    }

    actionRequiredObjects.forEach(el => {
      actionRequiredMessages_plain += '\t' + el.name + ': ' + el.message + '\nClick link to see message: ' + baseLink + '/messages/' + el.mid;
    });


    //Generate Person Messages
    let personMessages_plain = (personObjects.length) ? 'People\n' : null;
    let personMessages_html = (personObjects.length) ? `<div style="font-weight: bold">People</div>` : null;

    if (personMessages_html) {
      let middleContent = '';
      personObjects.forEach(el => {
        middleContent += `<tr>
                              <td>${el.name}</td>
                              <td>${el.message}</td>
                              <td><a href="${baseLink}/people/${el.pid}">See Message</a></td>
                            </tr>`;
      });
      personMessages_html += `<div style="margin-left: 10px">
                                  <tabel>
                                    <thead>
                                      <td>Name</td>
                                      <td>Event</td>
                                      <td>Link</td>
                                    </thead><tbody>` +
        middleContent +
        `</tbody></tabel>
         </div>`;
    }

    personObjects.forEach(el => {
      personMessages_plain += '\t' + el.name + ': ' + el.message + '\nClick to see message: ' + baseLink + '/people/' + el.pid;
    });

    //Generate Business Messages
    let businessMessages_plain = (businessObjects.length) ? 'Business\n' : null;
    let businessMessages_html = (businessObjects.length) ? `<div style="font-weight: bold">Business</div>` : null;

    if (businessMessages_html) {
      let middleContent = '';
      businessObjects.forEach(el => {
        middleContent += `<tr>
                              <td>${el.name}</td>
                              <td>${el.message}</td>
                              <td><a href="${baseLink}/business/${el.bid}">See Message</a></td>
                            </tr>`;
      });
      businessMessages_html += `<div style="margin-left: 10px">
                                  <tabel>
                                    <thead>
                                      <td>Name</td>
                                      <td>Event</td>
                                      <td>Link</td>
                                    </thead><tbody>` +
        middleContent +
        `</tbody></tabel>
         </div>`;
    }

    businessObjects.forEach(el => {
      businessMessages_plain += '\t' + el.name + ': ' + el.message + '\nClick to see message: ' + baseLink + '/business/' + el.bid;
    });

    //Generate Organization Messages
    let organizationMessages_plain = (organizationObjects.length) ? 'Organization\n' : null;
    let organizationMessages_html = (organizationObjects.length) ? `<div style="font-weight: bold">Organization</div>` : null;

    if (organizationMessages_html) {
      let middleContent = '';
      organizationObjects.forEach(el => {
        middleContent += `<tr>
                              <td>${el.name}</td>
                              <td>${el.message}</td>
                              <td><a href="${baseLink}/organization/${el.oid}">See Message</a></td>
                            </tr>`;
      });
      organizationMessages_html += `<div style="margin-left: 10px">
                                  <tabel>
                                    <thead>
                                      <td>Name</td>
                                      <td>Event</td>
                                      <td>Link</td>
                                    </thead><tbody>` +
        middleContent +
        `</tbody></tabel>
         </div>`;
    }

    organizationObjects.forEach(el => {
      organizationMessages_plain += '\t' + el.name + ': ' + el.message + '\nClick to see message: ' + baseLink + '/organization/' + el.oid;
    });

    //Merge all parts to one html-content and plain-content
    if (actionRequiredObjects.length) {
      message.body_plain += actionRequiredMessages_plain;
      message.body_html += actionRequiredMessages_html;
    }

    //Check to set separator
    if (businessObjects.length || organizationObjects.length || personObjects.length) {
      message.body_plain += '\n*****\nYour Notifications\n\n';
      message.body_html += `<br/><div style="text-align: center;"><p>*****</p><p>Your Notifications</p></div><br/>`;
    }

    if (businessObjects.length) {
      message.body_plain += businessMessages_plain;
      message.body_html += businessMessages_html;
    }

    if (organizationObjects.length) {
      message.body_plain += organizationMessages_plain;
      message.body_html += organizationMessages_html;
    }

    if (personObjects.length) {
      message.body_plain += personMessages_plain;
      message.body_html += personMessages_html;
    }
  }

  //Append unsubscription link end of the message
  message.body_plain += "\n\nYou received this email because subscribe to Iran-Insight's notifications and messages" +
    "\nIf you want to unsubscribe from Iran-Insight's notifications and messages via email, please click on below link: " +
    "\n" + baseLink + '/api/mail/unsubscribe/' + user_subscription_hash;
  message.body_html += `<div>
                            <p>You received this email because subscribe to Iran-Insight's notifications and messages</p>
                            <p>If you want to unsubscribe from Iran-Insight's notifications and messages via email, please click on below link: </p>
                            <p><a href="${baseLink}/api/mail/unsubscribe/${user_subscription_hash}">${baseLink}/api/mail/unsubscribe/${user_subscription_hash}</a></p>
                          </div>`;

  //Append signature
  message.body_plain += "\n\nBest regards\nIran-Insight Team";
  message.body_html += `<div><p>Best regards</p><p>Iran-Insight Team</p></div>`;

  return message;
};

module.exports = {
sendMailToRecipient,
  fetChNotifications,
  buildingMessage,
};
