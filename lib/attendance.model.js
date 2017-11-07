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

class Attendance extends SqlTable {
  constructor(test = Event.test) {
    Attendance.test = test;
    super(tableName, idColumn, test, columns);
  }

  personAttends(eid, data, pid) {
    let saved = {eid: eid, pid: pid, saved_by: pid};
    if (data.attendance_type)
      saved.attendance_type_id = data.attendance_type_id;
    return this.saveData(saved);
  }

  bizAttends(eid, data, bid, pid) {
    let saved = {eid: eid, bid: bid, saved_by: pid};
    if (data.attendance_type_id)
      saved.attendance_type_id = data.attendance_type_id;
    return this.sql.person.bizRep({pid: pid, bid: bid})
      .then(res => {
        if(res.length)
          return this.saveData(saved);
        else
          return Promise.reject(Err.notAttendeeBizRep);
      })
  }

  orgAttends(eid, data, oid, pid) {
    let saved = {eid: eid, oid: oid, saved_by: pid};
    if (data.attendance_type_id)
      saved.attendance_type_id = data.attendance_type_id;
    return this.sql.person.orgRep({pid: pid, oid: oid})
      .then(res => {
        if(res.length)
          return this.saveData(saved);
        else
          return Promise.reject(Err.notAttendeeOrgRep);
      })
  }

  personUnattends(eid, pid) {
    return this.sql[tableName].personUnattends({eid: eid, pid: pid});
  }

  bizUnattends(eid, bid, pid) {
    return this.sql.person.bizRep({bid: bid, pid: pid})
      .then(res => {
        if(res.length)
          return this.sql[tableName].bizUnattends({bid: bid, eid: eid});
        else
          return Promise.reject(Err.notAttendeeBizRep);
      })
  }

  orgUnattends(eid, oid, pid) {
    return this.sql.person.orgRep({pid: pid, oid: oid})
      .then(res => {
        if(res.length)
          return this.sql[tableName].orgUnattends({eid: eid, oid: oid});
        else
          return Promise.reject(Err.notAttendeeOrgRep);
      })
  }

}

Attendance.test = false;

module.exports = Attendance;