const SqlTable = require('./sqlTable.model');
const Err = require('./errors.list');
const Notification = require('./notification.system');

let tableName = 'attendance';
let idColumn = 'id';
let columns = [
  'pid',
  'oid',
  'bid',
  'eid',
  'attendance_type_id',
  'saved_by',
  'saved_at',
];

class Attendance extends SqlTable {
  constructor(test = Event.test) {
    Attendance.test = test;
    super(tableName, idColumn, test, columns);
  }

  personAttends(eid, data, user) {
    return new Promise((resolve, reject) => {
      let saved = {eid: eid, pid: user.pid, saved_by: user.pid};
      if (data.attendance_type_id)
        saved.attendance_type_id = data.attendance_type_id;
      this.saveData(saved)
        .then(res => {
          this.sql.event.get({eid: eid})
            .then(eventObj => {
              let msg = {
                from: user,
                about: Notification.get().getNotificationCategory().XAttendsToEvent,
                aboutData: {
                  person_name: (user.firstname_en || user.firstname_fa) + ' ' + (user.surname_en || user.surname_fa),
                  person_username: user.username,
                  is_person: true,
                  event_title: eventObj[0].title || eventObj[0].title_fa,
                }
              };

              Notification.get().pushNotification(msg);
            });

          resolve(res);
        })
        .catch(err => reject(err));
    });
  }

  bizAttends(eid, data, bid, pid) {
    return new Promise((resolve, reject) => {
      let saved = {eid: eid, bid: bid, saved_by: pid};
      if (data.attendance_type_id)
        saved.attendance_type_id = data.attendance_type_id;
      this.sql.person.bizRep({pid: pid, bid: bid})
        .then(res => {
          if (res.length)
            return this.saveData(saved);
          else
            return Promise.reject(Err.notAttendeeBizRep);
        })
        .then(res => {
          let businessData = null;
          this.sql.business.get({bid: bid})
            .then(res => {
              businessData = res[0];
              return this.sql.event.get({eid: eid})
            })
            .then(eventObj => {
              let msg = {
                from: businessData,
                about: Notification.get().getNotificationCategory().XAttendsToEvent,
                aboutData: {
                  org_biz_name: businessData.name || businessData.name_fa,
                  is_person: false,
                  is_business: true,
                  event_title: eventObj[0].title || eventObj[0].title_fa,
                }
              };

              Notification.get().pushNotification(msg);
            });

          resolve(res);
        })
        .catch(err => reject(err));
    });
  }

  orgAttends(eid, data, oid, pid) {
    return new Promise((resolve, reject) => {
      let saved = {eid: eid, oid: oid, saved_by: pid};
      if (data.attendance_type_id)
        saved.attendance_type_id = data.attendance_type_id;
      this.sql.person.orgRep({pid: pid, oid: oid})
        .then(res => {
          if (res.length)
            return this.saveData(saved);
          else
            return Promise.reject(Err.notAttendeeOrgRep);
        })
        .then(res => {
          let organizationData = null;
          this.sql.organization.get({oid: oid})
            .then(res => {
              organizationData = res[0];
              return this.sql.event.get({eid: eid});
            })
            .then(eventObj => {
              let msg = {
                from: organizationData,
                about: Notification.get().getNotificationCategory().XAttendsToEvent,
                aboutData: {
                  org_biz_name: organizationData.name || organizationData.name_fa,
                  is_person: false,
                  is_business: false,
                  event_title: eventObj[0].title || eventObj[0].title_fa,
                }
              };

              Notification.get().pushNotification(msg);
            });

          resolve(res);
        })
        .catch(err => reject(err));
    });
  }

  personUnattends(eid, user) {
    return new Promise((resolve, reject) => {
      this.sql[tableName].personUnattends({eid: eid, pid: user.pid})
        .then(res => {
          this.sql.event.get({eid: eid})
            .then(eventObj => {
              let msg = {
                from: user,
                about: Notification.get().getNotificationCategory().XDisregardForEvent,
                aboutData: {
                  person_name: (user.firstname_en || user.firstname_fa) + ' ' + (user.surname_en || user.surname_fa),
                  person_username: user.username,
                  is_person: true,
                  event_title: eventObj[0].title || eventObj[0].title_fa,
                }
              };

              Notification.get().pushNotification(msg);
            });

          resolve(res);
        })
        .catch(err => reject(err));
    });
  }

  bizUnattends(eid, bid, pid) {
    return new Promise((resolve, reject) => {
      this.sql.person.bizRep({bid: bid, pid: pid})
        .then(res => {
          if (res.length)
            return this.sql[tableName].bizUnattends({bid: bid, eid: eid});
          else
            return Promise.reject(Err.notAttendeeBizRep);
        })
        .then(res => {
          let businessData = null;
          this.sql.business.get({bid: bid})
            .then(res => {
              businessData = res[0];
              return this.sql.event.get({eid: eid})
            })
            .then(eventObj => {
              let msg = {
                from: businessData,
                about: Notification.get().getNotificationCategory().XDisregardForEvent,
                aboutData: {
                  org_biz_name: businessData.name || businessData.name_fa,
                  is_person: false,
                  is_business: true,
                  event_title: eventObj[0].title || eventObj[0].title_fa,
                }
              };

              Notification.get().pushNotification(msg);
            });

          resolve(res);
        })
        .catch(err => reject(err));
    });
  }

  orgUnattends(eid, oid, pid) {
    return new Promise((resolve, reject) => {
      this.sql.person.orgRep({pid: pid, oid: oid})
        .then(res => {
          if (res.length)
            return this.sql[tableName].orgUnattends({eid: eid, oid: oid});
          else
            return Promise.reject(Err.notAttendeeOrgRep);
        })
        .then(res => {
          let organizationData = null;
          this.sql.organization.get({oid: oid})
            .then(res => {
              organizationData = res[0];
              return this.sql.event.get({eid: eid});
            })
            .then(eventObj => {
              let msg = {
                from: organizationData,
                about: Notification.get().getNotificationCategory().XDisregardForEvent,
                aboutData: {
                  org_biz_name: organizationData.name || organizationData.name_fa,
                  is_person: false,
                  is_business: false,
                  event_title: eventObj[0].title || eventObj[0].title_fa,
                }
              };

              Notification.get().pushNotification(msg);
            });

          resolve(res);
        })
        .catch(err => reject(err));
    });
  }

}

Attendance.test = false;

module.exports = Attendance;