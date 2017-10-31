const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

describe("POST Organization API", () => {
  let adminObj = {
    pid: null,
    jar: null,
  };
  let repObj = {
    pid: null,
    jar: null,
  };
  let normalUserObj = {
    pid: null,
    jar: null,
  };
  let orgTypeId = null;

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('admin'))
      .then(res => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;
        return lib.dbHelpers.addAdmin(adminObj.pid);
      })
      .then(res => {
        return lib.dbHelpers.addAndLoginPerson('rep');
      })
      .then(res => {
        repObj.pid = res.pid;
        repObj.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('ali');
      })
      .then(res => {
        normalUserObj.pid = res.pid;
        normalUserObj.jar = res.rpJar;
        orgTypeId = 101;
        return sql.test.organization_type.add({
          id: orgTypeId,
          name: 'governmental',
          name_fa: 'دولتی',
        });
      })
      .then(res => lib.dbHelpers.addOrganizationWithRep(repObj.pid, 'MTN'))
      .then(res => done())
      .catch(err => {
        console.log(err);
        done();
      });
  });

  it("representative should add organization profile", function (done) {
    this.done = done;
    rp({
      method: 'post',
      form: {
        name: 'Management Crisis',
        name_fa: 'مدیریت بحران',
        ceo_pid: repObj.pid,
        org_type_id: orgTypeId
      },
      uri: lib.helpers.apiTestURL('organization/profile'),
      jar: repObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.organization.getById({oid: res.body});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].name).toBe('Management Crisis');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("admin should add/update organization profile", function (done) {
    this.done = done;
    sql.test.organization.add({
      name: 'Management Crisis',
      name_fa: 'مدیریت بحران',
      ceo_pid: repObj.pid,
      org_type_id: orgTypeId,
    })
      .then(res => {
        console.log('=====>res: ', res);
        return rp({
          method: 'post',
          form: {
            oid: res.oid,
            name: 'Country Management Crisis',
            name_fa: 'مدیریت بحران کشور',
          },
          uri: lib.helpers.apiTestURL('organization/profile'),
          jar: adminObj.jar,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.organization.getById({oid: res.body});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].name).toBe('Country Management Crisis');
        expect(res[0].name_fa).toBe('مدیریت بحران کشور');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("normal user have not access to change/set organization profile", function (done) {
    this.done = done;
    sql.test.organization.add({
      name: 'Management Crisis',
      name_fa: 'مدیریت بحران',
      ceo_pid: repObj.pid,
      org_type_id: orgTypeId,
    })
      .then(res => {
        return rp({
          method: 'post',
          form: {
            oid: res.oid,
            name: 'Country Management Crisis',
          },
          uri: lib.dbHelpers.apiTestURL('organization/profile'),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        this.fail('Premitted not representative user to update organization info');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notAllowed.status);
        expect(err.error).toBe(error.notAllowed.message);
        done();
      });
  });
});