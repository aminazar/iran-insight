const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe('Get All Attendees API', () => {
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
  let types = [
    {
      id: 1,
      name: 'type1',
    },
    {
      id: 2,
      name: 'type2',
    },
  ];
  let businesses = [
    {
      bid: 1,
      name: 'business 1',
      ceo_pid: 1,
      biz_type_id: 1,
    },
    {
      bid: 2,
      name: 'business 2',
      ceo_pid: 3,
      biz_type_id: 2,
    },
  ];
  let organizations = [
    {
      oid: 1,
      name: 'org 1',
      ceo_pid: 2,
      org_type_id: 1,
    },
    {
      oid: 2,
      name: 'org 2',
      ceo_pid: 3,
      org_type_id: 2,
    },
  ];
  let attendees = [
    {
      pid: 2,
      eid: 1,
      saved_by: 2,
    },
    {
      pid: 3,
      eid: 1,
      saved_by: 3,
    },
    {
      oid: 1,
      eid: 1,
      saved_by: 1,
    },
    {
      bid: 2,
      eid: 1,
      saved_by: 2,
    },
    {
      pid: 2,
      eid: 2,
      saved_by: 2,
    },
    {
      bid: 1,
      eid: 2,
      saved_by: 1,
    },
    {
      oid: 2,
      eid: 2,
      saved_by: 2,
    },
  ];

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => Promise.all(people.map(el => sql.test.person.add(el))))
      .then(() => Promise.all(types.map(el => sql.test.business_type.add(el))))
      .then(() => Promise.all(types.map(el => sql.test.organization_type.add(el))))
      .then(() => Promise.all(businesses.map(el => sql.test.business.add(el))))
      .then(() => Promise.all(organizations.map(el => sql.test.organization.add(el))))
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

  it('should get all attendees of specific event', function (done) {
    this.done = done;
    rp({
      method: 'get',
      uri: lib.helpers.apiTestURL('attendee/1'),
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let body = JSON.parse(res.body);
        expect(body.person.length).toBe(2);
        expect(body.business.length).toBe(1);
        expect(body.organization.length).toBe(1);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});