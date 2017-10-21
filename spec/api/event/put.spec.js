const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const moment = require('moment');

describe('PUT Event API', () => {
  let eid = 0, pid = 0, eventData = {title: 'test event', title_fa: 'همایش تست', start_date: '20171010'};

  beforeEach(function (done) {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addPerson('amin', '123456', {}, true))
      .then(res => {
        pid = res;
        done();
      })
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it('errors on adding an event without organizer', function (done) {
    rp({
      method: 'PUT',
      form: eventData,
      uri: lib.helpers.apiTestURL(`event`),
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