const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const moment = require('moment-timezone');
const helpers = require('../../../lib/helpers');

describe("Post Biz LCE API", () => {
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

  let addLCE = (newLCE) => {
    return sql.test.business_lce.add(newLCE)
  };

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
  xit("rep should confirm biz lce request", function (done) {
    this.done = done;
    let inserted_lce_id;
    addLCE({
      id1: biz1.bid,
      id2: biz2.bid,
      start_date: moment.utc('2017-09-08 10:00:00').format(),
      lce_type_id: lce_type_id1
    }).then(res => {

      inserted_lce_id = res.id;
      rp({
        method: 'post',
        uri: lib.helpers.apiTestURL(`/lce/business/confirm`),
        body: {
          id: inserted_lce_id,
          bid: biz2.bid,
          is_confirmed: true
        },
        json: true,
        jar: rep2.jar,
        resolveWithFullResponse: true
      })
        .then(res => {

          expect(res.statusCode).toBe(200);
          return sql.test.business_lce.get({id: inserted_lce_id});
        }).then(res => {
        expect(res.length).toBe(1);
        expect(res[0].is_confirmed).toBe(true);
        done();
      })
        .catch(lib.helpers.errorHandler.bind(this));
    });

  });
  it("rep should reject biz lce request", function (done) {
    this.done = done;
    let inserted_lce_id;
    addLCE({
      id1: biz1.bid,
      id2: biz2.bid,
      start_date: moment.utc('2017-09-08 10:00:00').format(),
      lce_type_id: lce_type_id1
    }).then(res => {

      inserted_lce_id = res.id;
      rp({
        method: 'post',
        uri: lib.helpers.apiTestURL(`/lce/business/confirm`),
        body: {
          id: inserted_lce_id,
          bid: biz2.bid,
          is_confirmed: false
        },
        json: true,
        jar: rep2.jar,
        resolveWithFullResponse: true
      })
        .then(res => {
          expect(res.statusCode).toBe(200);
          return sql.test.business_lce.get({id: inserted_lce_id});
        }).then(res => {
        expect(res.length).toBe(0);
        done();
      })
        .catch(lib.helpers.errorHandler.bind(this));
    });

  });
  it("admin should confirm biz lce request", function (done) {
    this.done = done;
    let inserted_lce_id;
    addLCE({
      id1: biz1.bid,
      id2: biz2.bid,
      start_date: moment.utc('2017-09-08 10:00:00').format(),
      lce_type_id: lce_type_id1
    }).then(res => {

      inserted_lce_id = res.id;
      rp({
        method: 'post',
        uri: lib.helpers.apiTestURL(`/lce/business/confirm`),
        body: {
          id: inserted_lce_id,
          bid: biz2.bid,
          is_confirmed: false
        },
        json: true,
        jar: adminObj.jar,
        resolveWithFullResponse: true
      })
        .then(res => {
          expect(res.statusCode).toBe(200);
          return sql.test.business_lce.get({id: inserted_lce_id});
        }).then(res => {
        expect(res.length).toBe(0);
        done();
      })
        .catch(lib.helpers.errorHandler.bind(this));
    });

  });
  it("admin should reject biz lce request", function (done) {
    this.done = done;
    let inserted_lce_id;
    addLCE({
      id1: biz1.bid,
      id2: biz2.bid,
      start_date: moment.utc('2017-09-08 10:00:00').format(),
      lce_type_id: lce_type_id1
    }).then(res => {

      inserted_lce_id = res.id;
      rp({
        method: 'post',
        uri: lib.helpers.apiTestURL(`/lce/business/confirm`),
        body: {
          id: inserted_lce_id,
          bid: biz2.bid,
          is_confirmed: false
        },
        json: true,
        jar: adminObj.jar,
        resolveWithFullResponse: true
      })
        .then(res => {
          expect(res.statusCode).toBe(200);
          return sql.test.business_lce.get({id: inserted_lce_id});
        }).then(res => {
        expect(res.length).toBe(0);
        done();
      })
        .catch(lib.helpers.errorHandler.bind(this));
    });

  });
  it("Expect error when other users or reps want to confirm biz lce request", function (done) {
    this.done = done;
    let inserted_lce_id;
    addLCE({
      id1: biz1.bid,
      id2: biz2.bid,
      start_date: moment.utc('2017-09-08 10:00:00').format(),
      lce_type_id: lce_type_id1
    }).then(res => {

      inserted_lce_id = res.id;
      rp({
        method: 'post',
        uri: lib.helpers.apiTestURL(`/lce/business/confirm`),
        body: {
          id: inserted_lce_id,
          bid: biz2.bid,
          is_confirmed: false
        },
        json: true,
        jar: rep1.jar,
        resolveWithFullResponse: true
      })
        .then(res => {
          this.fail('did not failed when other users want to confirm lce for business');
          done();
        })
        .catch(err => {
          expect(err.statusCode).toBe(error.notAllowed.status);
          expect(err.error).toBe(error.notAllowed.message);
          done();
        });
    });

  });

});