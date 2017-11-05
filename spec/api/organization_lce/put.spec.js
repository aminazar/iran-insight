const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const moment = require('moment-timezone');
const helpers = require('../../../lib/helpers');

describe("Put Organization LCE API", () => {
  let adminObj = {
    pid: null,
    jar: null,
  };
  let normalUser = {
    pid: null,
    jar: null,
  };
  let rep1 = {
    pid: null,
    jar: null,
  };
  let rep2 = {
    pid: null,
    jar: null,
  };
  let org1, org2;
  let lce_type_id1, lce_type_id2;

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('admin'))
      .then(res => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;
        return lib.dbHelpers.addAdmin(adminObj.pid);
      })
      .then(res => {
        normalUser.pid = res.pid;
        normalUser.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('ehsan');
      })
      .then(res => {
        return lib.dbHelpers.addAndLoginPerson('rep1');
      })
      .then(res => {
        rep1.pid = res.pid;
        rep1.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('eabasir@gmail.com');
      })
      .then(res => {
        rep2.pid = res.pid;
        rep2.jar = res.rpJar;
        return lib.dbHelpers.addOrganizationWithRep(rep1.pid, 'MTN')
      })
      .then(res => {
        org1 = res;
        return lib.dbHelpers.addOrganizationWithRep(rep2.pid, 'IT Ministry')
      })
      .then(res => {
        org2 = res;
        return sql.test.lce_type.add({
          name: 'management change',
          name_fa: 'تغییر میدیرت',
          active: true,
          suggested_by: rep1.pid
        });
      })
      .then(res => {
        lce_type_id1 = res.id;
        return sql.test.lce_type.add({
          name: 'merge',
          name_fa: 'ادغام',
          active: true,
          suggested_by: rep2.pid
        });
      })
      .then(res => {
        lce_type_id2 = res.id;
        done();
      })
      .catch(err => {
        console.log(err);
        done();
      });
  });
  it('admin should create LCE for organization', function (done) {

    rp({
      method: 'PUT',
      body: {
        oid1: org1.oid,
        start_date: moment.utc('2017-09-08 10:00:00').format(),
        lce_type_id: lce_type_id1
      },
      json: true,
      uri: lib.helpers.apiTestURL(`organization-lce`),
      jar: adminObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.organization_lce.get({id: res.body.id});
      })
      .then(res => {
        let row = res[0];
        expect(row.oid1).toBe(org1.oid);
        expect(row.lce_type_id).toBe(lce_type_id1);

        expect(moment.utc(row.start_date).format()).toBe(moment.utc(moment.utc('2017-09-08 10:00:00').format()).format());
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });
  it('org rep should create LCE for organization', function (done) {

    rp({
      method: 'PUT',
      body: {
        oid1: org1.oid,
        start_date: moment.utc('2017-09-08 10:00:00').format(),
        lce_type_id: lce_type_id1
      },
      json: true,
      uri: lib.helpers.apiTestURL(`organization-lce`),
      jar: rep1.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.organization_lce.get({id: res.body.id});
      })
      .then(res => {
        let row = res[0];
        expect(row.oid1).toBe(org1.oid);
        expect(row.lce_type_id).toBe(lce_type_id1);

        expect(moment.utc(row.start_date).format()).toBe(moment.utc(moment.utc('2017-09-08 10:00:00').format()).format());
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });
  it('Expect error when other users want to create LCE for organization', function (done) {

    rp({
      method: 'PUT',
      body: {
        oid1: org1.oid,
        start_date: moment.utc('2017-09-08 10:00:00').format(),
        lce_type_id: lce_type_id1
      },
      json: true,
      uri: lib.helpers.apiTestURL(`organization-lce`),
      jar: rep2.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('did not failed when other users want to create lce for organization');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notAllowed.status);
        expect(err.error).toBe(error.notAllowed.message);
        done();
      });
  });
  it('Expect error when create LCE for organization when start date is null', function (done) {

    rp({
      method: 'PUT',
      body: {oid1: org1.oid, lce_type_id: lce_type_id1},
      json: true,
      jar: adminObj.jar,
      uri: lib.helpers.apiTestURL(`organization-lce`),
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('did not failed when lce start date is missing');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(500);
        expect(lib.helpers.parseServerErrorToString(err)).toContain('start_date');
        expect(lib.helpers.parseServerErrorToString(err)).toContain('not-null constraint');
        done();
      });
  });
  it('Expect error when create LCE for organization when oid 1 is null', function (done) {

    rp({
      method: 'PUT',
      body: {
        start_date: moment.utc('2017-09-08 10:00:00').format(),
        lce_type_id: lce_type_id1
      },
      json: true,
      jar: adminObj.jar,
      uri: lib.helpers.apiTestURL(`organization-lce`),
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('did not failed when oid1 is missing');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(500);
        expect(lib.helpers.parseServerErrorToString(err)).toContain('oid1');
        expect(lib.helpers.parseServerErrorToString(err)).toContain('not-null constraint');
        done();
      });

  });
  it('Expect error when create LCE for organization when lce_type_id is null', function (done) {

    rp({
      method: 'PUT',
      body: {
        oid1: org1.oid,
        start_date: moment.utc('2017-09-08 10:00:00').format(),
      },
      json: true,
      jar: adminObj.jar,
      uri: lib.helpers.apiTestURL(`organization-lce`),
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('did not failed when lce_type_id is missing');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(500);
        expect(lib.helpers.parseServerErrorToString(err)).toContain('lce_type_id');
        expect(lib.helpers.parseServerErrorToString(err)).toContain('not-null constraint');
        done();
      });
  });
  it('expect Error when create duplicate LCE for organization=> same oid1, start_date and lce_type_id', function (done) {

    sql.test.organization_lce.add({
      oid1: org1.oid,
      start_date: moment.utc('2017-09-08 10:00:00').format(),
      lce_type_id: lce_type_id1
    })
      .then(() => {

        rp({
          method: 'PUT',
          body: {
            oid1: org1.oid,
            start_date: moment.utc('2017-09-08 10:00:00').format(),
            lce_type_id: lce_type_id1
          },
          json: true,
          jar: adminObj.jar,
          uri: lib.helpers.apiTestURL(`organization-lce`),
          resolveWithFullResponse: true,
        })
          .then(res => {
            this.fail('did not failed when 2 lce are duplicate');
            done();
          })
          .catch(err => {
            expect(err.statusCode).toBe(500);
            expect(lib.helpers.parseServerErrorToString(err)).toContain('org_duplicate_records');
            done();
          });
      })

  });

  it('org rep should create LCE with other orgs (oid2) => is_confirmed must be false even it is set explicitly in body', function (done) {

    spyOn(helpers, 'sendMail').andReturn(Promise.resolve([]));
    rp({
      method: 'PUT',
      body: {
        oid1: org1.oid,
        oid2: org2.oid,
        start_date: moment.utc('2017-09-08 10:00:00').format(),
        lce_type_id: lce_type_id1,
        is_confirmed: true,
      },
      json: true,
      uri: lib.helpers.apiTestURL(`organization-lce`),
      jar: rep1.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {

        expect(res.statusCode).toBe(200);
        // expect(helpers.sendMail).toHaveBeenCalled(); //todo: spy on email not works!!!
        return sql.test.organization_lce.get({id: res.body.id});
      })
      .then(res => {
        let row = res[0];
        expect(row.is_confirmed).toBe(false);
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });

  });
  it('org rep should cannot update oid1, oid2 and is_confirmed ', function (done) {

    spyOn(helpers, 'sendMail').andReturn(Promise.resolve([]));

    sql.test.organization_lce.add({
      oid1: org1.oid,
      oid2: org2.oid,
      start_date: moment.utc('2017-09-08 10:00:00').format(),
      lce_type_id: lce_type_id1
    }).then(res => {
      rp({
        method: 'PUT',
        body: {
          id: res.id,
          oid1: org1.oid,
          oid2: 200,
          start_date: moment.utc('2017-09-10 10:00:00').format(),
          lce_type_id: lce_type_id2,
          is_confirmed: true,
        },
        json: true,
        uri: lib.helpers.apiTestURL(`organization-lce`),
        jar: rep1.jar,
        resolveWithFullResponse: true,
      })
        .then(res => {

          expect(res.statusCode).toBe(200);
          // expect(helpers.sendMail).toHaveBeenCalled(); //todo: spy on email not works!!!
          return sql.test.organization_lce.get({id: res.body[0].id});
        })
        .then(res => {
          let row = res[0];
          expect(row.oid1).toBe(org1.oid);
          expect(row.oid2).toBe(org2.oid);
          expect(row.lce_type_id).toBe(lce_type_id2);
          expect(row.is_confirmed).toBe(false);
          done();
        })
        .catch(err => {
          this.fail(lib.helpers.parseServerErrorToString(err));
          done();
        });
    });
  });

});