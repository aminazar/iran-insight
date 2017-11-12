let cron = require('node-cron');
let {mailPeriodConfig} = require('../env');
const sql = require('../sql');
const helpers = require('./helpers');
const rx = require('rxjs');
const redis = require('../redis');

class NotificationSystem {
  constructor(test = NotificationSystem.test) {
    NotificationSystem.test = test;
    this.test = test;
    this.sql = test ? sql.test : sql;
    this.pattern = test ? 'tmsg:' : 'msg:';

    this.subs = {};
    this.obs = {};
    this.counter = {};

    this.dailyTask = cron.schedule(`${mailPeriodConfig.minute} ${mailPeriodConfig.hour} * * *`, () => {
      this.sendMailToRecipient('d');
    });

    this.weeklyTask = cron.schedule(`${mailPeriodConfig.minute} ${mailPeriodConfig.hour} * * ${mailPeriodConfig.dayOfWeek}`, () => {
      this.sendMailToRecipient('w');
    });

    redis.redisClientInit()
      .then(() => redis.redis_sub().psubscribe(`${this.pattern}*`))
      .then(() => {
        this.setup = true;
      })
  }

  sendMailToRecipient(type) {
    if (type !== 'w' && type !== 'd')
      return;

    this.sql.person.get({notify_period: type}).then(res => {

      if (res.length > 0) {

        res.forEach(person => {
          NotificationSystem.fetChNotifications(person.pid).forEach(note => {
            helpers.sendMail(note, null, 'notification', person.username).catch(err => console.log('-> ', 'failed to send email notification'));
          });
        });
      }
    });
  }

  fetchNotifications(pid) {
    let ret = [], keys;
    return new Promise((resolve, reject) => {
      redis.redis_client().keysAsync(`${this.pattern}:${pid}:*`)
        .then(res => {
          keys = res;
          return Promise.all(keys.map(k => redis.get(k)))
        })
        .then(values => {
          ret = values;
          return Promise.all(keys.map(k => redis.redis_client().delAsync(k)));
        })
        .then(() => {
          ret.sort((x,y) => y.order - x.order);
          resolve(ret);
        })
        .catch(reject)
    });
  };

  getChannel(pid) {
    if (!this.obs[pid]) {
      this.obs[pid] = new rx.Observable(subscriber => {
        redis.redis_sub().on('pmessage', (pattern, channel, message) => {
          try {
            if (+channel.split(':')[1] === pid)
              subscriber.next(JSON.parse(message));
          } catch (e) {
            subscriber.error(e);
          }
        })
      }).publish();

      this.obs[pid].connect();
    }
    return this.obs[pid];

  }

  subscribe(pid, onSuccess, onError = err => console.error(err), onComplete = () => {}) {
    let sub = this.getChannel(pid).subscribe(onSuccess, onError, onComplete);
    if(this.subs[pid])
      this.subs[pid].push(sub);
    else
      this.subs[pid] = [sub];
  }

  deleteChannel(pid) {
    if(this.subs[pid])
      this.subs[pid].forEach(sub => sub.unsubscribe());

    delete this.subs[pid];
    if(this.obs[pid]) {
      delete this.obs[pid];
    }
  }

  pushNotification(pid, note) {
    if(this.obs[pid]) {
      return redis.redis_client().publishAsync(`${this.pattern}${pid}`, JSON.stringify(note));
    } else {
      if(!this.counter[pid])
        this.counter[pid] = 1;
      note.timestamp = new Date();
      note.order = this.counter[pid];
      return redis.redis_client().setAsync(`${this.pattern}:${pid}:${this.counter[pid]++}`, JSON.stringify(note));
    }
  }

  start() {
    this.dailyTask.start();
    this.weeklyTask.start();

    console.log('Notification system scheduler is running ');
  }
}

NotificationSystem.Test = false;
let notificationSystem; // Singleton
let setup = (isTest = false) => {
  return new Promise( (resolve, reject) => {
    let c = 0;
    notificationSystem = new NotificationSystem(isTest);
    let notificationWaiter = setInterval(() => {
      if(notificationSystem.setup){
        clearInterval(notificationWaiter);
        resolve();
      } else if (c++ > 10) {
        reject('Failed after 10 attempts to initialize notification system');
      }
    }, 500);
  });
};
module.exports = {
  setup,
  get: () => notificationSystem,
};