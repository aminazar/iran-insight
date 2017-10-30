const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const moment = require('moment');

describe('PUT Event API', () => {
  let eid = 0, pid = 0, eventData = {title: 'test event', title_fa: 'همایش تست', start_date: '20171010'}, aminJar, aliJar, adminJar;

  beforeEach(function (done) {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('amin', '123456', {}))
      .then(res => {
        pid = res.pid;
        aminJar = res.rpJar;
        eventData.organizer_pid = pid;
        eventData.saved_by = pid;
        return lib.dbHelpers.addAndLoginPerson('ali','654321', {})
      })
      .then( res => {
        aliJar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('aDmIn','admin', {})
      })
      .then( res =>{
        adminJar = res.rpJar;
        return lib.dbHelpers.addAdmin(res.pid);
      })
      .then(res => done())
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it('errors on unauthenticated delete attempt', function(done) {
    eventData.title = 'tested event 1';
    rp({
      method: 'PUT',
      form: eventData,
      uri: lib.helpers.apiTestURL(`event`),
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

  it('errors on adding an event without organizer', function (done) {
    delete eventData.organizer_pid;
    rp({
      method: 'PUT',
      form: eventData,
      uri: lib.helpers.apiTestURL(`event`),
      jar: adminJar,
      resolveWithFullResponse: true,
    })
      .then(() => {
        this.fail('did not fail when no organizer was available');
        done();
      })
      .catch(err => {
        err = lib.helpers.parseServerError(err);
        expect(+err.statusCode).toBe(500);
        expect(err.message).toContain('has_organizer');
        done();
      });
    }
  );

  it('has an API inserting a single event', function (done) {
    eventData.organizer_pid = pid;
    rp({
      method: 'PUT',
      form: eventData,
      uri: lib.helpers.apiTestURL(`event`),
      resolveWithFullResponse: true,
      jar: aminJar,
    })
      .then(res => {
        eid = +res.body;
        expect(res.statusCode).toBe(200);
        return sql.test.event.get({eid:eid});
      })
      .then(getResult => {
        let row = getResult[0];
        expect(row.eid).toBe(eid);
        expect(row.organizer_pid).toBe(pid);
        expect(row.organizer_bid).toBeNull();
        expect(row.organizer_oid).toBeNull();
        expect(row.title).toBe(eventData.title);
        expect(row.title_fa).toBe(eventData.title_fa);
        expect(moment(row.start_date).format('YYYYMMDD')).toBe(eventData.start_date);
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });

  it('has an insert API by admin', function (done) {
    eventData = {title: 'test event 2', title_fa: 'همایش تست 2', start_date: '20171010'}
    eventData.organizer_pid = pid;
    rp({
      method: 'PUT',
      form: eventData,
      uri: lib.helpers.apiTestURL(`event`),
      resolveWithFullResponse: true,
      jar: adminJar
    })
      .then(res => {
        eid = +res.body;
        expect(res.statusCode).toBe(200);
        return sql.test.event.get({eid:eid});
      })
      .then(getResult => {
        let row = getResult[0];
        expect(row.eid).toBe(eid);
        expect(row.organizer_pid).toBe(pid);
        expect(row.organizer_bid).toBeNull();
        expect(row.organizer_oid).toBeNull();
        expect(row.title).toBe(eventData.title);
        expect(row.title_fa).toBe(eventData.title_fa);
        expect(moment(row.start_date).format('YYYYMMDD')).toBe(eventData.start_date);
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });
});