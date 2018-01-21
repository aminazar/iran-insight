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
  let orgObj = null;

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
      .then(res => {
        orgObj = res;
        done();
      })
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
        org_type_id: orgTypeId,
        oid: orgObj.oid,
      },
      uri: lib.helpers.apiTestURL('organization/profile'),
      jar: repObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.organization.getById({oid: JSON.parse(res.body)});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].org_name).toBe('Management Crisis');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("representative of another organization cannot set profile for another organization", function (done) {
    let anotherRep;
    lib.dbHelpers.addAndLoginPerson('rep2')
      .then(res => {
        anotherRep = res;
        return lib.dbHelpers.addOrganizationWithRep(anotherRep.pid);
      })
      .then(res => {
        return rp({
          method: 'post',
          form: {
            name: 'Management Crisis',
            name_fa: 'مدیریت بحران',
            ceo_pid: repObj.pid,
            org_type_id: orgTypeId,
            oid: orgObj.oid,
          },
          uri: lib.helpers.apiTestURL('organization/profile'),
          jar: anotherRep.rpJar,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        this.fail('Rep of another org can set profile for another org');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notAllowed.status);
        expect(err.error).toBe(error.notAllowed.message);
        done();
      })
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
        return sql.test.organization.getById({oid: JSON.parse(res.body)});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].org_name).toBe('Country Management Crisis');
        expect(res[0].org_name_fa).toBe('مدیریت بحران کشور');
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
          uri: lib.helpers.apiTestURL('organization/profile'),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        this.fail('Permitted not representative user to update organization info');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notAllowed.status);
        expect(err.error).toBe(error.notAllowed.message);
        done();
      });
  });

  it('admin or rep of org can delete org', function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        end_date: '2018-03-03',
      },
      json: true,
      uri: lib.helpers.apiTestURL('organization/one/delete/' + orgObj.oid),
      jar: repObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it('any user except admin or related rep cannot able to delete org', function (done) {
    rp({
      method: 'post',
      body: {
        end_date: '2018-03-03',
      },
      json: true,
      uri: lib.helpers.apiTestURL('organization/one/delete/' + orgObj.oid),
      jar: normalUserObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('Non related rep or admin can delete a organization');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notOrgRep.status);
        expect(err.error).toBe(error.notOrgRep.message);
        done();
      })
  });

  it('admin should delete organization without any rep', function (done) {
    this.done = done;
    sql.test.organization.add({
      name: 'one organization',
      name_fa: 'یه شرکت',
    })
      .then(res => {
        return rp({
          method: 'post',
          body: {
            end_date: '2018-03-03',
          },
          json: true,
          uri: lib.helpers.apiTestURL('organization/one/delete/' + res.oid),
          jar: adminObj.jar,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get error when no end date passed in body", function (done) {
    rp({
      method: 'post',
      json: true,
      uri: lib.helpers.apiTestURL('organization/one/delete/' + orgObj.oid),
      jar: normalUserObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('Organization is deleted without defining body');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.noEndDate.status);
        expect(err.error).toBe(error.noEndDate.message);
        done();
      })
  });
});