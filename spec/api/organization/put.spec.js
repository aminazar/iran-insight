const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

describe("PUT Organization API", () => {
  let normalUserObj = {
    pid: null,
    jar: null,
  };

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('ali'))
      .then(res => {
        normalUserObj.pid = res.pid;
        normalUserObj.jar = res.rpJar;
        done();
      })
      .catch(err => {
        console.log(err);
        done();
      });
  });

  it("user should follow specific organization", function (done) {
    this.done = done;
    let organizationId = null;
    lib.dbHelpers.addPerson('rep')
      .then(res => lib.dbHelpers.addOrganizationWithRep(res))
      .then(res => {
        organizationId = res.oid;
        return rp({
          method: 'put',
          uri: lib.helpers.apiTestURL('follow/organization/' + res.oid),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.subscription.getOrgSubscribers({oid: organizationId});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].pid).toBe(normalUserObj.pid);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});