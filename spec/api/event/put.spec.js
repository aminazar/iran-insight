const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe('PUT Event API', () => {
  let eid = 0, pid = 0, eventData = {title: 'test event', title_fa: 'همایش تست', start_date: '20171010'};

  beforeEach(function (done) {
    lib.dbHelpers.create([
      'person',
      'organization_type',
      'business',
      'organization',
      'event',
    ])
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
      .then(res => {
        this.fail('did not fail when no organizer is available');
        done();
      })
      .catch(err => {
        err = lib.helpers.parseServerError(err);
        console.log(err);
        expect(err.statusCode).toBe(500);
        expect(err.Message).toContain('has_organizer');
        done();
      });
    }
  );

  it('has an API inserting a single event', function (done) {
    rp({
      method: 'PUT',
      form: eventData,
      uri: lib.helpers.apiTestURL(`event`),
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);

        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerError(err));
        done();
      });
  });
});