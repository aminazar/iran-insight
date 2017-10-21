const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe('DELETE Event API', () => {
  let eid = 0, pid = 0, eventData = {title: 'test event', title_fa: 'همایش تست', start_date: '20171010'},rpa;

  beforeEach(function (done) {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('amin', '123456', {}, true))
      .then(res => {
        pid = res.pid;
        rpa = res.rp;
        eventData.organizer_pid = pid;
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

  it('errors on unauthorised delete attempt', function(done) {
    this.done = done;
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`event/${eid}`),
      resolveWithFullResponse: true,
    })
      .then(() => {
        this.fail('permitted unauthorised user to delete event')
      })
      .catch(err => {
        expect(err.statusCode).toBe(403);
      });
  });

  it('has an API deleting a single event with EID', function (done) {
    this.done = done;
    rpa({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`event/${eid}`),
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.event.get({eid: eid})
      })
      .then(res => {
        expect(res.length).toBe(0, '<== length of result, because it is deleted');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});