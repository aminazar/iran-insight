const SqlTable = require('./sqlTable.model');
const moment = require('moment');
const Err = require('./errors.list');
const Notification = require('./notification.system');
let NotificationCategory = null;
let NF = null;
Notification.setup().then(() => {
  NF = Notification.get();
  NotificationCategory = NF.getNotificationCategory();
});
const Person = require('./person.model');

let tableName = 'event';
let idColumn = 'eid';
let columns = [
  "organizer_pid",
  "organizer_oid",
  "organizer_bid",
  "title",
  "title_fa",
  "address",
  "address_fa",
  // "geo_location",
  "start_date",
  "end_date",
  "description",
  "saved_at",
  "saved_by",
  "description_fa",
];

class Event extends SqlTable {
  constructor(test = Event.test) {
    Event.test = test;
    super(tableName, idColumn, test, columns);
  }

  load(eid, pid) {
    let result;
    return this.sql.event.getById({eid: eid})
      .then(res => {
        this.importData(res[0]);
        result = this;
        if (pid)
          return this.sql.attendance.get({eid: eid, pid: pid});
        else
          return Promise.resolve([]);
      })
      .then(res => {
        if (res.length)
          result.attendance = res[0];
        return Promise.resolve(result);
      });
  }

  importData(data) {
    this.columns.concat([this.idMember,'organizer_name','organizer_name_fa']).forEach(c => {
      if (data[c]) {
        if (data[c].constructor.name === 'Date') {
          this[c] = moment(data[c]).format('YYYYMMDD');
        } else {
          this[c] = data[c];
        }
      }
      else
        this[c] = null;
    })
  }

  canModifyEvent(pid, organizer_pid, organizer_oid, organizer_bid) {
    return new Promise((resolve, reject) => {
      this.sql.person.isAdmin({pid: pid})
        .then(res => {
          if (res.length) {
            resolve('admin can modify any event');
          } else if (+pid === +organizer_pid) {
            resolve('a person can modify his event');
          } else if (organizer_oid) {
            this.sql.person.orgRep({pid: pid, oid: organizer_oid})
              .then(res => {
                if (!res.length) {
                  reject(Err.notEventOwnerOrgRep);
                } else {
                  resolve("a rep can modify his org's event");
                }
              });
          } else if (organizer_bid) {
            this.sql.person.bizRep({pid: pid, bid: organizer_bid})
              .then(res => {
                if (!res.length) {
                  reject(Err.notEventOwnerBizRep);
                } else {
                  resolve("a rep can modify his biz's event");
                }
              });
          } else {
            reject(Err.notEventOwner);
          }
        })
        .catch(reject)
    });
  }

  saveData(data, user, eid) {
    if (!user)
      return Promise.reject(Err.notLoggedInUser);

    return new Promise((resolve, reject) => {
      let oldData = null;
      this.loadOrData(eid, data)
        .then(result => {
          oldData = result;
          return this.canModifyEvent(user.pid, result.organizer_pid, result.organizer_oid, result.organizer_bid);
        })
        .then(msg => {
          console.log(msg);
          data.saved_by = user.pid;
          return super.saveData(data, eid)
        })
        .then(res => {
          let getOrganizer = null;

          if (oldData.organizer_pid)
            getOrganizer = this.sql.person.getUserById({pid: oldData.organizer_pid, is_user: true});
          else if (oldData.organizer_oid)
            getOrganizer = this.sql.organization.getById({oid: oldData.organizer_oid});
          else if (oldData.organizer_bid)
            getOrganizer = this.sql.business.get({bid: oldData.organizer_bid});

          getOrganizer
            .then(res => {
              let msg = {
                from: user,
                about: NotificationCategory.OrganizerAddUpdateEvent,
                aboutData: {
                  organizer_name: (oldData.organizer_pid ? Person.getPersonFullName(res[0]) : (res[0].name || res[0].name_fa)),
                  organizer_username: res[0].username,
                  is_updated: eid !== undefined || eid !== null,
                  event_description: (data.title || data.title_fa) ? (data.title || data.title_fa) : (oldData.title || oldData.title_fa),
                  is_person: oldData.organizer_pid,
                  is_business: oldData.organizer_bid,
                  id: oldData.organizer_pid || oldData.organizer_bid || oldData.organizer_oid,
                }
              };

              NF.pushNotification(msg);
            });

          resolve(res);
        })
        .catch(err => reject(err));
    });
  }

  delete(eid, user) {
    return new Promise((resolve, reject) => {
      if(!user)
        reject(Err.notLoggedInUser);
      else{
        let oldData = null;
        this.loadOrData(eid)
          .then(result => {
            oldData = result;
            return this.canModifyEvent(user.pid, result.organizer_pid, result.organizer_oid, result.organizer_bid);
          })
          .then(msg => {
            console.log(msg);
            return super.delete(eid);
          })
          .then(res => {
            let getOrganizer = null;

            if (oldData.organizer_pid)
              getOrganizer = this.sql.person.getUserById({pid: oldData.organizer_pid, is_user: true});
            else if (oldData.organizer_oid)
              getOrganizer = this.sql.organization.getById({oid: oldData.organizer_oid});
            else if (oldData.organizer_bid)
              getOrganizer = this.sql.business.get({bid: oldData.organizer_bid});

            getOrganizer
              .then(res => {
                let msg = {
                  from: user,
                  about: NotificationCategory.OrganizerRemoveEvent,
                  aboutData: {
                    organizer_name: (oldData.organizer_pid ? Person.getPersonFullName(res[0]) : (res[0].name || res[0].name_fa)),
                    organizer_username: res[0].username,
                    is_updated: eid !== undefined || eid !== null,
                    event_description: oldData.title || oldData.title_fa,
                    is_person: oldData.organizer_pid,
                    is_business: oldData.organizer_bid,
                    id: oldData.organizer_pid || oldData.organizer_bid || oldData.organizer_oid,
                  }
                };

                NF.pushNotification(msg);
              });

            resolve(res);
          })
          .catch(err => reject(err));
      }
    });
  }
}

Event.test = false;

module.exports = Event;