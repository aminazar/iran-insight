const SqlTable = require('./sqlTable.model');
const moment = require('moment');
const Err = require('./errors.list');

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
  "saved_at",
  "saved_by",
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
                  reject(Err.notOrgRep);
                } else {
                  resolve("a rep can modify his org's event");
                }
              });
          } else if (organizer_bid) {
            this.sql.person.bizRep({pid: pid, bid: organizer_bid})
              .then(res => {
                if (!res.length) {
                  reject(Err.notBizRep);
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

  saveData(data, pid, eid) {
    return this.loadOrData(eid, data)
      .then(result => this.canModifyEvent(pid, result.organizer_pid, result.organizer_oid, result.organizer_bid))
      .then(msg => {
        console.log(msg);
        data.saved_by = pid;
        return super.saveData(data, eid)
      });
  }

  delete(eid, pid) {
    return this.loadOrData(eid)
      .then(result => this.canModifyEvent(pid, result.organizer_pid, result.organizer_oid, result.organizer_bid))
      .then(msg => {
        console.log(msg);
        return super.delete(eid);
      })
  }
}

Event.test = false;

module.exports = Event;