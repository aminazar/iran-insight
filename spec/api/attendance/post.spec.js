const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const Error = require('../../../lib/errors.list');

describe('Put Attendance API', () => {
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
      pid: 1,
      username: 'eo',
      secret: '123',
    },
    {
      pid: 2,
      username: 'at1',
      secret: '123',
    },
    {
      pid: 3,
      username: 'at2',
      secret: '123',
    },
  ];
  let attendance_type = [
    {
      id: 1,
      name: 'Sponsor',
      name_fa: 'حامی',
      is_sponsor: true,
    },
    {
      id: 2,
      name: 'VIP Attendee',
      name_fa: 'شرکت کننده خاص',
      is_vip: true,
    },
    {
      id: 3,
      name: 'Sponsor && VIP Attendee',
      name_fa: 'حامی و شرکت کننده خاص',
      is_sponsor: true,
      is_vip: true,
    },
    {
      id: 4,
      name: 'Normal Attendee',
      name_fa: 'شرکت کننده عادی',
    }
  ];
  let attendees = [
    {
      id: 1,
      pid: 2,
      eid: 1,
      attendance_type_id: 1,
      saved_by: 2,
    },
    {
      id: 2,
      pid: 3,
      eid: 1,
      saved_by: 3,
    },
  ];

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => Promise.all(people.map(el => sql.test.person.add(el))))
      .then(() => Promise.all(attendance_type.map(el => sql.test.attendance_type.add(el))))
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

  it("should update attendance", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        attendance_type_id: 2,
      },
      json: true,
      uri: lib.helpers.apiTestURL('attendee/1'),
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);

        return sql.test.attendance.select();
      })
      .then(res => {
        expect(res.find(el => el.id === 1).attendance_type_id).toBe(2);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should add attendance_type_id", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        attendance_type_id: 1,
      },
      json: true,
      uri: lib.helpers.apiTestURL('attendee/2'),
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.attendance.select();
      })
      .then(res => {
        expect(res.find(el => el.id === 2).attendance_type_id).toBe(1);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});