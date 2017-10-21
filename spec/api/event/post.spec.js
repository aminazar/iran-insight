const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const moment = require('moment');

describe('POST Event API', () => {
  let eid = 0, pid = 0, eventData = {title: 'test event', title_fa: 'همایش تست', start_date: '20171010'};

  beforeEach(function (done) {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addPerson('amin', '123456', {}, true))
      .then(res => {
        pid = res;
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

  it('has an API updating a single event', function (done) {
    this.done = done;
    eventData.title = 'tested event';
    eventData.description = 'This was tested';
    rp({
      method: 'POST',
      form: eventData,
      uri: lib.helpers.apiTestURL(`event/${eid}`),
      resolveWithFullResponse: true,
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