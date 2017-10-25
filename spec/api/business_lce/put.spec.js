const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const moment = require('moment-timezone');


describe('PUT: business lce', () => {

  let biz_info = [{
    name: 'bent oak systems',
    name_fa: 'بنتوک سامانه',
  }, {
    name: 'Iran Insight',
    name_fa: 'ایران اینسایت',
  }];

  let lce_type_info = [{
    name: 'management change',
    name_fa: 'تغییر میدیرت',
    active: true,
  },
    {
      name: 'merge',
      name_fa: 'ادغام',
      active: true,
    }];

  let biz_type_info = [{
    name: 'governmental',
    name_fa: 'دولتی',
    active: true,
  }, {
    name: 'non-governmental',
    name_fa: 'غیر دولتی',
    active: true,
  }];

  let pid1,pid2,pid3;

  let createLCE_Type = (lce_type) => {

    return sql.test.lce_type.add(lce_type);
  };

  let createBiz_Type = (biz_type) => {
    return sql.test.business_type.add(biz_type);

  };

  let createBiz = (biz) => {

    return sql.test.business.add(biz);
  };

  let createBiz_LCE = (biz_lce) => {
    return sql.test.business_lce.add(biz_lce);
  };



  beforeEach(function (done) {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('ehsan', '123123123', {}))
      .then(res => {
        pid1 = res.pid;
        return lib.dbHelpers.addAndLoginPerson('ali', '654321', {})
      })
      .then(res => {
        pid2 = res.pid;
        return lib.dbHelpers.addAndLoginPerson('admin', 'admin', {})
      })
      .then(res => {
        pid3 = res.pid;
        done();
      })
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });


  it('create LCE for business and return inserted LCE id', function (done) {

    let biz_type = Object.assign({id: 1, suggested_by: pid1}, biz_type_info[0]);
    let lce_type = Object.assign({id: 1, suggested_by: pid1}, lce_type_info[0]);
    let biz = Object.assign({bid: 1, ceo_pid: pid1 ,biz_type_id : 1}, biz_info[0]);
    let biz_lce = {
      bid1: 1,
      start_date: moment.utc('2017-09-08 10:00:00').format(),
      lce_type_id: 1
    };

    createBiz_Type(biz_type)
      .then(() => createLCE_Type(lce_type))
      .then(() => createBiz(biz))
      .then(() => {

        let inserted_lce_id;
        rp({
          method: 'PUT',
          form: biz_lce,
          uri: lib.helpers.apiTestURL(`business-lce`),
          resolveWithFullResponse: true,
        })
          .then(res => {
            inserted_lce_id = +res.body;
            expect(res.statusCode).toBe(200);
            return sql.test.business_lce.get({id: inserted_lce_id});
          })
          .then(res => {
            let row = res[0];
            expect(row.id).toBe(inserted_lce_id);
            expect(row.bid1).toBe(biz_lce.bid1);
            expect(row.lce_type_id).toBe(biz_lce.lce_type_id);

            expect(moment.utc(row.start_date).format()).toBe(moment.utc(biz_lce.start_date).format());
            done();
          })
          .catch(err => {
            this.fail(lib.helpers.parseServerErrorToString(err));
            done();
          });
      });
  });

  it('create LCE for business when start date is null and Expect error', function (done) {

    let biz_type = Object.assign({id: 1, suggested_by: pid1}, biz_type_info[0]);
    let lce_type = Object.assign({id: 1, suggested_by: pid1}, lce_type_info[0]);
    let biz = Object.assign({bid: 1, ceo_pid: pid1,biz_type_id : 1}, biz_info[0]);
    let biz_lce = {bid1: 1, lce_type_id: 1};

    createBiz_Type(biz_type)
      .then(() => createLCE_Type(lce_type))
      .then(() => createBiz(biz))
      .then(() => {
        rp({
          method: 'PUT',
          form: biz_lce,
          uri: lib.helpers.apiTestURL(`business-lce`),
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
      })

  });

  it('create LCE for business when bid 1 is null and Expect error', function (done) {

    let biz_type = Object.assign({id: 1, suggested_by: pid1}, biz_type_info[0]);
    let lce_type = Object.assign({id: 1, suggested_by: pid1}, lce_type_info[0]);
    let biz = Object.assign({bid: 1, ceo_pid: pid1,biz_type_id : 1}, biz_info[0]);
    let biz_lce = {start_date: '2017-09-08 10:00:00', lce_type_id: 1};

    createBiz_Type(biz_type)
      .then(() => createLCE_Type(lce_type))
      .then(() => createBiz(biz))
      .then(() => {
        rp({
          method: 'PUT',
          form: biz_lce,
          uri: lib.helpers.apiTestURL(`business-lce`),
          resolveWithFullResponse: true,
        })
          .then(res => {
            this.fail('did not failed when bid1 is missing');
            done();
          })
          .catch(err => {
            expect(err.statusCode).toBe(500);
            expect(lib.helpers.parseServerErrorToString(err)).toContain('bid1');
            expect(lib.helpers.parseServerErrorToString(err)).toContain('not-null constraint');
            done();
          });
      })

  });

  it('create LCE for business when lce_type_id is null and Expect error', function (done) {

    let biz_type = Object.assign({id: 1, suggested_by: pid1}, biz_type_info[0]);
    let lce_type = Object.assign({id: 1, suggested_by: pid1}, lce_type_info[0]);
    let biz = Object.assign({bid: 1, ceo_pid: pid1, biz_type_id: 1}, biz_info[0]);
    let biz_lce = {bid1: 1, start_date: '2017-09-08 10:00:00'};

    createBiz_Type(biz_type)
      .then(() => createLCE_Type(lce_type))
      .then(() => createBiz(biz))
      .then(() => {
        rp({
          method: 'PUT',
          form: biz_lce,
          uri: lib.helpers.apiTestURL(`business-lce`),
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
  });
  it('create duplicate LCE for business and expect Error => same bid1, start_date and lce_type_id', function (done) {

    let biz_type = Object.assign({id: 1, suggested_by: pid1}, biz_type_info[0]);
    let lce_type = Object.assign({id: 1, suggested_by: pid1}, lce_type_info[0]);
    let biz = Object.assign({bid: 1, ceo_pid: pid1 , biz_type_id: 1}, biz_info[0]);
    let biz_lce1 = {bid1: 1, start_date: '2017-09-08 10:00:00', lce_type_id: 1};
    let biz_lce2 = {bid1: 1, start_date: '2017-09-08 10:00:00', lce_type_id: 1};

    createBiz_Type(biz_type)
      .then(() => createLCE_Type(lce_type))
      .then(() => createBiz(biz))
      .then(() => createBiz_LCE(biz_lce1))
      .then(() => {

        rp({
          method: 'PUT',
          form: biz_lce2,
          uri: lib.helpers.apiTestURL(`business-lce`),
          resolveWithFullResponse: true,
        })
          .then(res => {
            this.fail('did not failed when 2 lce are duplicate');
            done();
          })
          .catch(err => {
            expect(err.statusCode).toBe(500);
            expect(lib.helpers.parseServerErrorToString(err)).toContain('biz_duplicate_records');
            done();
          });
      })

  });


});
