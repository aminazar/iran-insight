const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const Error = require('../../../lib/errors.list');

describe('Get Attendance Types API', () => {
  let attendance_type = [
    {
      id: 1,
      name: 'Sponsor',
      name_fa: 'حامی',
      is_sponsor: true,
      active: true,
    },
    {
      id: 2,
      name: 'VIP Attendee',
      name_fa: 'شرکت کننده خاص',
      is_vip: true,
      active: true,
    },
    {
      id: 3,
      name: 'Sponsor && VIP Attendee',
      name_fa: 'حامی و شرکت کننده خاص',
      is_sponsor: true,
      is_vip: true,
      active: false,
    },
    {
      id: 4,
      name: 'Normal Attendee',
      name_fa: 'شرکت کننده عادی',
      active: true,
    }
  ];

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => Promise.all(attendance_type.map(el => sql.test.attendance_type.add(el))))
      .then(() => {
        done();
      })
      .catch(err => {
        console.error('Setup failure: ', err);
        done();
      });
  });

  it("should get all types of attendance", function (done) {
    this.done = done;
    rp({
      method: 'get',
      uri: lib.helpers.apiTestURL('attendance/types'),
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let body = JSON.parse(res.body);
        expect(body.length).toBe(3);
        expect(body.map(el => el.name.toLowerCase())).toContain('sponsor');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});