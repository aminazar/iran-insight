const SqlTable = require('./sqlTable.model');
const moment = require('moment');

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
  "geo_location",
  "start_date",
  "end_date",
  "description",
  "description_fa",
];

class Event extends SqlTable {
  constructor(test = Event.test) {
    Event.test = test;
    super(tableName, idColumn, test, columns);
  }

  load(id) {
    return super.load({eid: id});
  }

  importData(data) {
    this.columns.concat(this.idMember).forEach(c => {
      if (data[c]) {
        if (data[c].constructor.name === 'Date') {
          this[c] = moment(data[c]).format('YYYYMMDD');
        } else {
          this[c] = data[c];
        }
      }
    })
  }

  canModifyEvent(pid, organizer_pid, organizer_oid, organizer_bid, eid) {
    return new Promise((resolve, reject) => {
      if (sql.user.isAdmin(pid))
        resolve();
      else if (+pid === +organizer_pid) {
        resolve()
      } else if (organizer_oid) {
        this.sql.user.orgRep(pid, organizer_oid, eid)
          .then(res => {
            if (!res.length) {
              let err = new Error('User is not representative of organization that owns the event');
              err.status = 403;
              reject(err);
            } else {
              resolve()
            }
          });
      } else if (organizer_bid) {
        this.sql.user.bizRep(pid, organizer_bid, eid)
          .then(res => {
            if (!res.length) {
              let err = new Error('User is not representative of business that owns the event');
              err.status = 403;
              reject(err);
            } else {
              resolve()
            }
          });
      } else {
        let err = new Error('User does not own the event');
        err.status = 403;
        reject(err);
      }
    })
  }

)
  ;
}

saveData(data, eid, pid)
{
  return this.loadOrData(eid, data)
    .then(result => this.canModifyEvent(pid, result.organizer_pid, result.organizer_oid, result.organizer_bid, eid))
    .then(() => super.saveData(data, eid));
}

delete(eid, pid)
{
  return this.this.loadOrData(eid)
    .then(result => this.canModifyEvent(pid, result.organizer_pid, result.organizer_oid, result.organizer_bid, eid))
    .then(() => super.delete(eid))
}

Event.test = false;

module.exports = Event;