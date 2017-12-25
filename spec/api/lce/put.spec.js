const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const moment = require('moment-timezone');
const helpers = require('../../../lib/helpers');

describe("Put Biz LCE API", () => {
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
  let biz1, biz2;
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
        return lib.dbHelpers.addBusinessWithRep(rep1.pid, 'MTN')
      })
      .then(res => {
        biz1 = res;
        return lib.dbHelpers.addBusinessWithRep(rep2.pid, 'IT Ministry')
      })
      .then(res => {
        biz2 = res;
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
  it('admin should create LCE for business', function (done) {

    rp({
      method: 'PUT',
      body: {
        id1: biz1.bid,
        start_date: moment.utc('2017-09-08 10:00:00').format(),
        lce_type_id: lce_type_id1
      },
      json: true,
      uri: lib.helpers.apiTestURL(`lce/business`),
      jar: adminObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.business_lce.get({id: res.body.id});
      })
      .then(res => {
        let row = res[0];
        expect(row.id1).toBe(biz1.bid);
        expect(row.lce_type_id).toBe(lce_type_id1);

        expect(moment.utc(row.start_date).format()).toBe(moment.utc(moment.utc('2017-09-08 10:00:00').format()).format());
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });
  it('biz rep should create LCE for business', function (done) {

    rp({
      method: 'PUT',
      body: {
        id1: biz1.bid,
        start_date: moment.utc('2017-09-08 10:00:00').format(),
        lce_type_id: lce_type_id1
      },
      json: true,
      uri: lib.helpers.apiTestURL(`lce/business`),
      jar: rep1.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.business_lce.get({id: res.body.id});
      })
      .then(res => {
        let row = res[0];
        expect(row.id1).toBe(biz1.bid);
        expect(row.lce_type_id).toBe(lce_type_id1);

        expect(moment.utc(row.start_date).format()).toBe(moment.utc(moment.utc('2017-09-08 10:00:00').format()).format());
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });
  it('Expect error when other users want to create LCE for business', function (done) {

    rp({
      method: 'PUT',
      body: {
        id1: biz1.bid,
        start_date: moment.utc('2017-09-08 10:00:00').format(),
        lce_type_id: lce_type_id1
      },
      json: true,
      uri: lib.helpers.apiTestURL(`lce/business`),
      jar: rep2.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('did not failed when other users want to create lce for business');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notAllowed.status);
        expect(err.error).toBe(error.notAllowed.message);
        done();
      });
  });
  it('Expect error when create LCE for business when start date is null', function (done) {

    rp({
      method: 'PUT',
      body: {id1: biz1.bid, lce_type_id: lce_type_id1},
      json: true,
      jar: adminObj.jar,
      uri: lib.helpers.apiTestURL(`lce/business`),
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
  it('Expect error when create LCE for business when id1 is null', function (done) {

    rp({
      method: 'PUT',
      body: {
        start_date: moment.utc('2017-09-08 10:00:00').format(),
        lce_type_id: lce_type_id1
      },
      json: true,
      jar: adminObj.jar,
      uri: lib.helpers.apiTestURL(`lce/business`),
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('did not failed when id1 is missing');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(500);
        expect(lib.helpers.parseServerErrorToString(err)).toContain('id1');
        expect(lib.helpers.parseServerErrorToString(err)).toContain('not-null constraint');
        done();
      });

  });
  it('Expect error when create LCE for business when lce_type_id is null', function (done) {

    rp({
      method: 'PUT',
      body: {
        id1: biz1.bid,
        start_date: moment.utc('2017-09-08 10:00:00').format(),
      },
      json: true,
      jar: adminObj.jar,
      uri: lib.helpers.apiTestURL(`lce/business`),
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
  it('expect Error when create duplicate LCE for business=> same bid1, start_date and lce_type_id', function (done) {

    sql.test.business_lce.add({
      id1: biz1.bid,
      start_date: moment.utc('2017-09-08 10:00:00').format(),
      lce_type_id: lce_type_id1
    })
      .then(() => {

        rp({
          method: 'PUT',
          body: {
            id1: biz1.bid,
            start_date: moment.utc('2017-09-08 10:00:00').format(),
            lce_type_id: lce_type_id1
          },
          json: true,
          jar: adminObj.jar,
          uri: lib.helpers.apiTestURL(`lce/business`),
          resolveWithFullResponse: true,
        })
          .then(res => {
            this.fail('did not failed when 2 lce are duplicate');
            done();
          })
          .catch(err => {
            expect(err.statusCode).toBe(500);
            expect(lib.helpers.parseServerErrorToString(err)).toContain('business_lce_duplicate_records');
            done();
          });
      })

  });
  it('expect Error when create lce with same id1 and id2', function (done) {
    rp({
      method: 'PUT',
      body: {
        id1: biz1.bid,
        id2: biz1.bid,
        start_date: moment.utc('2017-09-08 10:00:00').format(),
        lce_type_id: lce_type_id1
      },
      json: true,
      jar: adminObj.jar,
      uri: lib.helpers.apiTestURL(`lce/business`),
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('did not failed when id1 and id2 are equal');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.sameLCEIds.status);
        expect(err.message).toContain(error.sameLCEIds.message);
        done();
      });

  });

  it('business rep should create LCE with other biz (bid2) => is_confirmed must be false even it is set explicitly in body', function (done) {

    rp({
      method: 'PUT',
      body: {
        id1: biz1.bid,
        id2: biz2.bid,
        start_date: moment.utc('2017-09-08 10:00:00').format(),
        lce_type_id: lce_type_id1,
        is_confirmed: true,
      },
      json: true,
      uri: lib.helpers.apiTestURL(`lce/business`),
      jar: rep1.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {

        expect(res.statusCode).toBe(200);
        return sql.test.business_lce.get({id: res.body.id});
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
  it('biz rep should cannot update bid1, bid2 and is_confirmed ', function (done) {

    spyOn(helpers, 'sendMail').andReturn(Promise.resolve([]));

    sql.test.business_lce.add({
      id1: biz1.bid,
      id2: biz2.bid,
      start_date: moment.utc('2017-09-08 10:00:00').format(),
      lce_type_id: lce_type_id1
    }).then(res => {
      rp({
        method: 'PUT',
        body: {
          id: res.id,
          id1: biz1.bid,
          id2: 200, // some other bid
          start_date: moment.utc('2017-09-10 10:00:00').format(),
          lce_type_id: lce_type_id2,
          is_confirmed: true,
        },
        json: true,
        uri: lib.helpers.apiTestURL(`lce/business`),
        jar: rep1.jar,
        resolveWithFullResponse: true,
      })
        .then(res => {

          expect(res.statusCode).toBe(200);
          return sql.test.business_lce.get({id: res.body[0].id});
        })
        .then(res => {
          let row = res[0];
          expect(row.id1).toBe(biz1.bid);
          expect(row.id2).toBe(biz2.bid);
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