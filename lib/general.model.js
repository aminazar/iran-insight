/**
 * Created by Sareh on 01/18/2017.
 */

const Err = require('./errors.list');
const sql = require('../sql');
const env = require('../env');
const moment = require('moment');
const Notification = require('./notification.system');
let NotificationCategory = null;
let NF = null;
Notification.setup().then(() => {
  NF = Notification.get();
  NotificationCategory = NF.getNotificationCategory();
});

class General {
  constructor(test = General.test) {
    General.test = test;
    this.sql = test ? sql.test : sql;
    this.db = test ? env.testDb : env.db;
  }

  getServerDateTime() {
    return this.sql.general.getServerDateTime();
  }
}

General.test = false;

module.exports = General;
