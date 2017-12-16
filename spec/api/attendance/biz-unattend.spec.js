const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');


describe('DELETE Business attendance API', () => {
  let eid = 0, pid = 0, eventData = {title: 'test.js event', title_fa: 'همایش تست', start_date: '20171010'}, aminJar;

  beforeEach(function (done) {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('amin', '123456', {}))
      .then(res => {
        pid = res.pid;
        aminJar = res.rpJar;
        eventData.organizer_pid = pid;
        eventData.saved_by = pid;
        return lib.dbHelpers.addAndLoginPerson('ali', '654321', {})
      })
      .then(res => {
        aliJar = res.rpJar;
        aliPid = res.pid;
        return lib.dbHelpers.addAndLoginPerson('aDmIn', 'admin', {})
      })
      .then(res => {
        adminJar = res.rpJar;
        return sql.test.event.add(eventData);
      })
      .then(res => {
        eid = +res.eid;
        return lib.dbHelpers.addBusinessWithRep(pid);
      })
      .then(res => {
        bizData = res;
        return sql.test.attendance.add({eid: eid, bid: +res.bid, saved_by: pid})
      })
      .then(() => {
        done();
      })
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it('errors on unauthenticated unattend attempt', function (done) {
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`bizAttends/${eid}/${bizData.bid}`),
    })
      .then(() => {
        this.fail('permitted unauthenticated user to unattend event');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(400);
        done();
      });
  });

  it('errors on unauthorised unattend attempt', function (done) {
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`bizAttends/${eid}/${bizData.bid}`),
      jar: aliJar,
    })
      .then(() => {
        this.fail('permitted unauthorised user to unattend event');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(403);
        done();
      });
  });

  it('removes an attendance', function (done) {
    this.done = done;
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`bizAttends/${eid}/${bizData.bid}`),
      resolveWithFullResponse: true,
      jar: aminJar,

    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        sql.test.attendance.get({eid:eid, pid: pid})
          .then( res => {
            expect(res.length).toBe(0);
            done();
          })
      })
      .catch(lib.helpers.errorHandler.bind(this))
  });
});