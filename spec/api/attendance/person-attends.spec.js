const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const moment = require('moment');

describe('PUT Person Attendance API', () => {
  let eid = 0, pid = 0, eventData = {title: 'test event', title_fa: 'همایش تست', start_date: '20171010'}, aminJar;

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
      uri: lib.helpers.apiTestURL(`personAttends/${eid}`),
    })
      .then(() => {
        this.fail('permitted unauthenticated user to attend event');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(400);
        done();
      });
  });

  it('errors on non-existent event attendance', function (done) {
    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`personAttends/${eid + 10}`),
      jar: aminJar
    })
      .then(() => {
        this.fail('permitted attendance of non-existent event');
      })
      .catch(err => {
        expect(err.statusCode).toBe(500);
        expect(err.message).toContain('violates foreign key constraint')
      })
      .finally(() => done())
  });

  it('adds an attendance', function (done) {
    this.done = done;
    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`personAttends/${eid}`),
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
              expect(res[0].pid).toBe(pid);
              expect(moment().diff(res[0].saved_at,'milliseconds')).toBeLessThan(5000);
              expect(res[0].bid).toBeNull();
              expect(res[0].oid).toBeNull();
            }
            done();
          })
      })
      .catch(lib.helpers.errorHandler.bind(this))
  });
});