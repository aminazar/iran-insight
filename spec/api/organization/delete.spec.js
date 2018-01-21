const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

describe("DELETE Organization API", () => {
  let repObj = {
    pid: null,
    jar: null,
  };
  let normalUserObj = {
    pid: null,
    jar: null,
  };
  let adminObj = {
    pid: null,
    jar: null,
  };
  let organizationId = null;

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('admin', '123'))
      .then(res => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;
        return lib.dbHelpers.addAdmin(res.pid);
      })
      .then(() => lib.dbHelpers.addAndLoginPerson('rep'))
      .then(res => {
        repObj.pid = res.pid;
        repObj.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('ali');
      })
      .then(res => {
        normalUserObj.pid = res.pid;
        normalUserObj.jar = res.rpJar;
        return sql.test.organization_type.add({
          id: 101,
          name: 'non-governmental',
          name_fa: 'غیر دولتی',
        });
      })
      .then(() => lib.dbHelpers.addOrganizationWithRep(repObj.pid, 'MTN'))
      .then(res => {
        organizationId = res.oid;
        done();
      })
      .catch(err => {
        console.log('err');
        done();
      });
  });

  it("user should unfollow specific organization", function (done) {
    this.done = done;
    sql.test.subscription.add({
      subscriber_id: normalUserObj.pid,
      oid: organizationId
    })
      .then(() =>
        rp({
          method: 'delete',
          uri: lib.helpers.apiTestURL('follow/organization/' + organizationId),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true
        })
      )
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.subscription.getOrgSubscribers({oid: organizationId});
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it('admin should delete organization', function (done) {
    this.done = done;
    rp({
      method: 'delete',
      uri: lib.helpers.apiTestURL('organization/' + organizationId),
      jar: adminObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.organization.getById({oid: organizationId});
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it('rep of organization cannot delete the organization', function (done) {
    rp({
      method: 'delete',
      uri: lib.helpers.apiTestURL('organization/' + organizationId),
      jar: repObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('Rep of organization delete the organization');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.adminOnly.status);
        expect(err.error).toBe(error.adminOnly.message);
        done();
      });
  });

  it('normal user cannot delete the organization', function (done) {
    rp({
      method: 'delete',
      uri: lib.helpers.apiTestURL('organization/' + organizationId),
      jar: normalUserObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('Normal user delete the organization');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.adminOnly.status);
        expect(err.error).toBe(error.adminOnly.message);
        done();
      });
  });
});