const rp = require("request-promise");
const lib = require('../../../lib');
const sql = require('../../../sql');

describe("GET Investment API", () => {
  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => done())
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it("should get list of investments in business by BID", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL('investment/business/1'),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get list of investments by organization by OID", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL('investment/organization/1'),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get list of investments by Person by PID", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL('investment/person/1'),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});