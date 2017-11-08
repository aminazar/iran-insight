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
