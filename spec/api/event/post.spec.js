const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const moment = require('moment');

describe('POST Event API', () => {
  let eid = 0, pid = 0, aliPid = 0, eventData = {title: 'test.js event', title_fa: 'همایش تست', start_date: '20171010'},
    aminJar, aliJar, adminJar;

  beforeEach(function (done) {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('amin', '123456', {}))
      .then(res => {
        pid = res.pid;
        aminJar = res.rpJar;
        eventData.organizer_pid = pid;
        eventData.saved_by = pid;
        return sql.test.event.add(eventData);
      })
      .then(res => {
        eid = +res.eid;
        return lib.dbHelpers.addAndLoginPerson('ali', '654321', {})
      })
      .then(res => {
        aliJar = res.rpJar;
        aliPid = res.pid;
        return lib.dbHelpers.addAndLoginPerson('aDmIn', 'admin', {})
      })
      .then(res => {
        adminJar = res.rpJar;
        return lib.dbHelpers.addAdmin(res.pid);
      })
      .then(res => done())
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it('errors on unauthenticated delete attempt', function (done) {
    eventData.title = 'tested event 1';
    rp({
      method: 'POST',
      form: eventData,
      uri: lib.helpers.apiTestURL(`event/${eid}`),
    })
      .then(() => {
        this.fail('permitted unauthenticated user to delete event');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(400);
        done();
      });
  });

  it('errors on unauthorised delete attempt', function (done) {
    eventData.title = 'tested event 2';
    rp({
      method: 'POST',
      form: eventData,
      uri: lib.helpers.apiTestURL(`event/${eid}`),
      jar: aliJar,
    })
      .then(() => {
        this.fail('permitted unauthorised user to delete event');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(403);
        done();
      });
  });

  it('errors on trying to hijack event record', function (done) {
    eventData.organizer_pid = aliPid;
    rp({
      method: 'POST',
      form: eventData,
      uri: lib.helpers.apiTestURL(`event/${eid}`),
      jar: aliJar,
    })
      .then(() => {
        this.fail('permitted hijacking a record');
        done()
      })
      .catch( err => {
        expect(err.statusCode).toBe(403);
        done();
      });
  });

  it('has an API updating a single event', function (done) {
    this.done = done;
    eventData.title = 'tested event';
    eventData.description = 'This was tested';
    rp({
      method: 'POST',
      form: eventData,
      uri: lib.helpers.apiTestURL(`event/${eid}`),
      resolveWithFullResponse: true,
      jar: aminJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.event.get({eid: eid});
      })
      .then(getResult => {
        let row = getResult[0];
        expect(row.eid).toBe(eid);
        expect(row.organizer_pid).toBe(pid);
        expect(row.organizer_bid).toBeNull();
        expect(row.organizer_oid).toBeNull();
        expect(row.title).toBe(eventData.title);
        expect(row.title_fa).toBe(eventData.title_fa);
        expect(row.description).toBe(eventData.description);
        expect(moment(row.start_date).format('YYYYMMDD')).toBe(eventData.start_date);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it('updates a single event by admin', function (done) {
    this.done = done;
    eventData.title = 'admin changed event';
    eventData.description = 'This was tested by admin';
    rp({
      method: 'POST',
      form: eventData,
      uri: lib.helpers.apiTestURL(`event/${eid}`),
      resolveWithFullResponse: true,
      jar: adminJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.event.get({eid: eid});
      })
      .then(getResult => {
        let row = getResult[0];
        expect(row.eid).toBe(eid);
        expect(row.organizer_pid).toBe(pid);
        expect(row.organizer_bid).toBeNull();
        expect(row.organizer_oid).toBeNull();
        expect(row.title).toBe(eventData.title);
        expect(row.title_fa).toBe(eventData.title_fa);
        expect(row.description).toBe(eventData.description);
        expect(moment(row.start_date).format('YYYYMMDD')).toBe(eventData.start_date);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});