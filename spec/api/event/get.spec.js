const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe('GET Event API', () => {
  let eid = 0, pid = 0, eventData = {title: 'test event', title_fa: 'همایش تست', start_date: '20171010'};

  beforeEach(function (done) {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addPerson('amin', '123456', {}, true))
      .then(res => {
        pid = res;
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

  it('has an event API loading a single event with EID', function (done) {
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`event/${eid}`),
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let body = JSON.parse(res.body);
        expect(body.eid).toBe(eid);
        expect(body.organizer_pid).toBe(pid);
        expect(body.organizer_bid).toBeUndefined();
        expect(body.organizer_oid).toBeUndefined();
        expect(body.title).toBe(eventData.title);
        expect(body.title_fa).toBe(eventData.title_fa);
        expect(body.start_date).toBe(eventData.start_date);
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });
});