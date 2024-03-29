const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe('DELETE Person attendance API', () => {
  let eid = 0, pid = 0, eventData = {title: 'test.js event', title_fa: 'همایش تست', start_date: '20171010'}, aminJar;

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

  it('errors on unauthenticated unattend attempt', function (done) {
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`personAttends/${eid}`),
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

  it('removes an attendance', function (done) {
    this.done = done;
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`personAttends/${eid}`),
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