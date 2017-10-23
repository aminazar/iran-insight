const SqlTable = require('./sqlTable.model');
const Err = require('./errors.list');

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

class Event extends SqlTable {
  constructor(test = Event.test) {
    Attendance.test = test;
    super(tableName, idColumn, test, columns);
  }

  personAttends(eid, data, pid) {
    let saved = {eid: eid, pid: pid, saved_by: pid};
    if (data.attendance_type)
      saved.attendance_type = data.attendance_type;
    return this.saveData(data);
  }

  bizAttends(eid, data, bid, pid) {
    let saved = {eid: eid, bid: bid, saved_by: pid};
    if (data.attendance_type)
      saved.attendance_type = data.attendance_type;
    return this.sql.person.bizRep({pid: pid, bid: oid})
      .then(res => {
        if(res.length)
          return this.saveData(data);
        else
          return Promise.reject(Err.notAttendeeBizRep);
      })
  }

  orgAttends(eid, data, oid, pid) {
    let saved = {eid: eid, oid: oid, saved_by: pid};
    if (data.attendance_type)
      saved.attendance_type = data.attendance_type;
    return this.sql.person.orgRep({pid: pid, oid: oid})
      .then(res => {
        if(res.length)
          return this.saveData(data);
        else
          return Promise.reject(Err.notAttendeeOrgRep);
      })
  }

  personUnattends(eid, pid) {
    return this.sql[tableName].personUnattends({eid: eid, pid: pid});
  }

  bizUnattends(eid, bid, pid) {
    let data = {pid: pid, bid: oid};
    return this.sql.person.bizRep(data)
      .then(res => {
        if(res.length)
          return this.sql[tableName].bizUnattends(data);
        else
          return Promise.reject(Err.notAttendeeBizRep);
      })
  }

  orgUnattends(eid, oid, pid) {
    let data = {pid: pid, bid: oid};
    return this.sql.person.orgRep(data)
      .then(res => {
        if(res.length)
          return this.sql[tableName].orgUnattends(data);
        else
          return Promise.reject(Err.notAttendeeOrgRep);
      })
  }

}

Attendance.test = false;

module.exports = Attendance;