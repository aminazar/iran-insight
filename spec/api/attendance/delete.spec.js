const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe('Delete Attendees API', () => {
  let adminJar = null;
  let eventData = [
    {
      eid: 1,
      title: 'test.js event',
      title_fa: 'همایش تست',
      start_date: '20171010',
      organizer_pid: 1,
      saved_by: 1,
    },
    {
      eid: 2,
      title: 'test.db event',
      title_fa: '',
      start_date: '20171020',
      end_date: '20171104',
      organizer_pid: 1,
      saved_by: 1,
    },
  ];
  let people = [
    {
      pid: 11,
      username: 'eo',
      secret: '123',
    },
    {
      pid: 12,
      username: 'at1',
      secret: '123',
    },
    {
      pid: 13,
      username: 'at2',
      secret: '123',
    },
  ];
   let attendees = [
    {
      id: 1,
      pid: 12,
      eid: 1,
      saved_by: 12,
    },
    {
      id: 2,
      pid: 13,
      eid: 1,
      saved_by: 13,
    },
    {
      id: 5,
      pid: 12,
      eid: 2,
      saved_by: 12,
    },
  ];

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('admin', 'admin'))
      .then(res => {
        adminJar = res.rpJar;
        return sql.test.administrators.add({pid: res.pid});
      })
      .then(() => Promise.all(people.map(el => sql.test.person.add(el))))
      .then(() => Promise.all(eventData.map(el => sql.test.event.add(el))))
      .then(() => Promise.all(attendees.map(el => sql.test.attendance.add(el))))
      .then(() => {
        done();
      })
      .catch(err => {
        console.error('Setup failure: ', err);
        done();
      })
  });

  it("should delete attendance by id", function (done) {
    this.done = done;
    rp({
      method: 'delete',
      uri: lib.helpers.apiTestURL('attendance/2'),
      jar: adminJar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.attendance.select();
      })
      .then(res => {
        expect(res.length).toBe(2);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});