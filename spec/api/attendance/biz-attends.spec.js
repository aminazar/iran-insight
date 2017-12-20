const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const moment = require('moment');

describe('PUT Business Attendance API', () => {
  let eid = 0, pid = 0, eventData = {title: 'test.js event', title_fa: 'همایش تست', start_date: '20171010'}, aminJar,
    aliJar, adminJar, aliPid, bizData;

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
        console.log(res);
        bizData = res;
        done();
      })
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it('errors on unauthenticated put attempt', function (done) {
    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`bizAttends/${eid}/${bizData.bid}`),
    })
      .then(() => {
        this.fail('permitted unauthenticated user to attend event');
        done();
      })
      .catch(err => {
        if(err.statusCode === 400) {
          expect(true).toBe(true);
        } else {
          this.fail(lib.helpers.parseServerError(err));
        }
        done();
      });
  });

  it('errors on unauthorised put attempt', function (done) {
    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`bizAttends/${eid}/${bizData.bid}`),
      jar: aliJar,
    })
      .then(() => {
        this.fail('permitted unauthorised user to attend event');
        done();
      })
      .catch(err => {
        if(err.statusCode === 403) {
          expect(true).toBe(true);
        } else {
          this.fail(lib.helpers.parseServerError(err));
        }
        done();
      });
  });

  it('errors on non-existent event attendance', function (done) {
    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`bizAttends/${eid + 10}/${bizData.bid}`),
      jar: aminJar
    })
      .then(() => {
        this.fail('permitted attendance of non-existent event');
      })
      .catch(err => {
        if(err.statusCode === 500) {
          expect(err.message).toContain('violates foreign key constraint')
        } else {
          this.fail(lib.helpers.parseServerError(err));
        }
        done();
      })
      .finally(() => done())
  });

  it('adds an attendance', function (done) {
    this.done = done;
    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`bizAttends/${eid}/${bizData.bid}`),
      resolveWithFullResponse: true,
      jar: aminJar,

    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let id = JSON.parse(res.body);
        sql.test.attendance.get({id:id})
          .then( res => {
            expect(res.length).toBe(1);
            if(res.length === 1) {
              expect(res[0].eid).toBe(eid);
              expect(res[0].saved_by).toBe(pid);
              expect(res[0].pid).toBeNull;
              expect(moment().diff(res[0].saved_at,'milliseconds')).toBeLessThan(5000);
              expect(res[0].bid).toBe(bizData.bid);
              expect(res[0].oid).toBeNull();
            }
            done();
          })
      })
      .catch(lib.helpers.errorHandler.bind(this))
  });
});