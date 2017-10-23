const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const moment = require('moment');

describe('PUT Attendance API', () => {
  let eid = 0, pid = 0, eventData = {title: 'test event', title_fa: 'همایش تست', start_date: '20171010'}, aminJar,
    aliJar, adminJar, aliPid;

  beforeEach(function (done) {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('amin', '123456', {}, true))
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
        eid = res;
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
      uri: lib.helpers.apiTestURL(`attendance/${eid}`),
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
      uri: lib.helpers.apiTestURL(`attendance/${eid + 10}`),
      jar: aminJar
    })
      .then(() => {
        this.fail('permitted attendance of non-existent event');
      })
      .catch(err => {
        expect(err.statusCode).toBe(400);
      })
      .finally(() => done())
  });
});