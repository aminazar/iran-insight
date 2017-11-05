const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const moment = require('moment-timezone');
const helpers = require('../../../lib/helpers');

describe("Get Biz LCE API", () => {
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
  it("admin should get list of biz1 lce", function (done) {
    this.done = done;
    let lceId1, lceId2;

    addLCE({
      bid1: biz1.bid,
      bid2: biz2.bid,
      start_date: moment.utc('2017-09-08 10:00:00').format(),
      lce_type_id: lce_type_id1
    })
      .then(res => {
        lceId1 = res.id;
        return addLCE({
          bid1: biz1.bid,
          bid2: biz2.bid,
          start_date: moment.utc('2017-09-10 10:00:00').format(),
          lce_type_id: lce_type_id2,
          is_confirmed: true
        })
          .then(res => {
            lceId2 = res.id;
            rp({
              method: 'get',
              uri: lib.helpers.apiTestURL(`business-lce/${biz1.bid}`),
              jar: adminObj.jar,
              resolveWithFullResponse: true
            })
              .then(res => {
                expect(res.statusCode).toBe(200);
                let result = JSON.parse(res.body);
                expect(result.length).toBe(2);
                done();
              })
              .catch(lib.helpers.errorHandler.bind(this));
          });

      });

  });
  it("rep1 should get list of biz1 lce", function (done) {
    this.done = done;
    let lceId1, lceId2;

    addLCE({
      bid1: biz1.bid,
      bid2: biz2.bid,
      start_date: moment.utc('2017-09-08 10:00:00').format(),
      lce_type_id: lce_type_id1
    })
      .then(res => {
        lceId1 = res.id;
        return addLCE({
          bid1: biz1.bid,
          bid2: biz2.bid,
          start_date: moment.utc('2017-09-10 10:00:00').format(),
          lce_type_id: lce_type_id2,
          is_confirmed: true
        })
          .then(res => {
            lceId2 = res.id;
            rp({
              method: 'get',
              uri: lib.helpers.apiTestURL(`business-lce/${biz1.bid}`),
              jar: rep1.jar,
              resolveWithFullResponse: true
            })
              .then(res => {
                expect(res.statusCode).toBe(200);
                let result = JSON.parse(res.body);
                expect(result.length).toBe(2);
                done();
              })
              .catch(lib.helpers.errorHandler.bind(this));
          });

      });

  });
  it("Other users should see only confirmed lce of biz", function (done) {
    this.done = done;
    let lceId1, lceId2;

    addLCE({
      bid1: biz1.bid,
      bid2: biz2.bid,
      start_date: moment.utc('2017-09-08 10:00:00').format(),
      lce_type_id: lce_type_id1
    })
      .then(res => {
        lceId1 = res.id;
        return addLCE({
          bid1: biz1.bid,
          bid2: biz2.bid,
          start_date: moment.utc('2017-09-10 10:00:00').format(),
          lce_type_id: lce_type_id2,
          is_confirmed: true
        })
          .then(res => {
            lceId2 = res.id;
            rp({
              method: 'get',
              uri: lib.helpers.apiTestURL(`business-lce/${biz1.bid}`),
              jar: rep2.jar,
              resolveWithFullResponse: true
            })
              .then(res => {
                expect(res.statusCode).toBe(200);

                let result = JSON.parse(res.body);
                console.log('-> ', result);
                expect(result.length).toBe(1);
                expect(result[0].is_confirmed).toBe(true);
                done();
              })
              .catch(lib.helpers.errorHandler.bind(this));
          });

      });

  });
  it("admin should see requested lce of biz", function (done) {
    this.done = done;
    let lceId1, lceId2;

    addLCE({
      bid1: biz1.bid,
      bid2: biz2.bid,
      start_date: moment.utc('2017-09-08 10:00:00').format(),
      lce_type_id: lce_type_id1
    })
      .then(res => {
        lceId1 = res.id;
        return addLCE({
          bid1: biz1.bid,
          bid2: biz2.bid,
          start_date: moment.utc('2017-09-10 10:00:00').format(),
          lce_type_id: lce_type_id2,
          is_confirmed: true
        })
          .then(res => {
            lceId2 = res.id;
            rp({
              method: 'get',
              uri: lib.helpers.apiTestURL(`business-lce/requested/${biz2.bid}`),
              jar: adminObj.jar,
              resolveWithFullResponse: true
            })
              .then(res => {
                expect(res.statusCode).toBe(200);
                let result = JSON.parse(res.body);
                expect(result.length).toBe(1);
                expect(result[0].is_confirmed).toBe(false);

                done();
              })
              .catch(lib.helpers.errorHandler.bind(this));
          });

      });

  });

});