const request = require("request");
const lib = require('../../../lib');
const sql = require('../../../sql');
const rp = require("request-promise");
const moment = require('moment');
let req = request.defaults({jar: true}); //enabling cookies
const error = require('../../../lib/errors.list');

describe('PUT product API', () => {

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
  let biz_info = [{
    bid: 1,
    name: 'hakupian',
    name_fa: 'هاکوپیان',
    ceo_pid: null,
    biz_type_id: null,
    address: 'Iran-Qom',
    address_fa: 'ایران - قم',
    tel: '025 77307730',
    url: null,
    general_stats: null,
    financial_stats: null
  }, {
    bid: 2,
    name: 'tabriz leather',
    name_fa: 'چرم تبریز',
    ceo_pid: null,
    biz_type_id: null,
    address: 'Iran-Tehran',
    address_fa: 'ایران - تبریز',
    tel: '02188668866',
    url: null,
    general_stats: null,
    financial_stats: null
  }];
  let assoc_info = [{
    aid: 1,
    pid: 2,
    bid: 1,
    oid: null,
    start_date: null,
    end_date: null
  }, {
    aid: 2,
    pid: 3,
    bid: 1,
    oid: null,
    start_date: null,
    end_date: null
  }, {
    aid: 3,
    pid: 3,
    bid: 2,
    oid: null,
    start_date: null,
    end_date: null
  }];
  let mem_info = [{
    mid: 1,
    assoc_id: 1,
    is_active: true,
    is_representative: true,
  }, {
    mid: 2,
    assoc_id: 2,
    is_active: true,
    is_representative: false,
  }, {
    mid: 3,
    assoc_id: 3,
    is_active: true,
    is_representative: true,
  }];
  let createNewBusiness = (biz_info) => {
    return sql.test.business.add(biz_info);
  };

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => {
        return lib.dbHelpers.addAndLoginPerson('admin', 'test')
      })
      .then((res) => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;
        return lib.dbHelpers.addAdmin(adminObj.pid);
      })
      .then((res) => {
        return lib.dbHelpers.addAndLoginPerson('repUser', '123')
      })
      .then((res) => {
        repObj.pid = res.pid;
        repObj.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('normalUser', '123')
      })
      .then((res) => {
        normalUserObj.pid = res.pid;
        normalUserObj.jar = res.rpJar;
        done();
      })
      .catch(err => {
        console.log(err);
        done();
      });
  })

  it("admin shold be able to add a product to a business", done => {
    sql.test.business.add(biz_info[0])
      .then((res) => {
        return rp({
          method: 'put',
          body: {
              name: 'Biscuit',
              name_fa: 'بیسکویت',
              description: 'Produce with milk powder',
              description_fa: 'تولید شده از پودر شیر',
              parent_product_id: null,
          },
          json: true,
          uri: lib.helpers.apiTestURL(`business/product/${res.bid}`),
          jar: adminObj.jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.product.getByProductId({product_id: res.body.product_id});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].product_name).toBe('Biscuit');
        expect(res[0].bid).toBe(1);
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  })

  it("rep of business should be able to add business to her/his bisiness", done => {
    let biz_id = null;
    sql.test.business.add(biz_info[0])
      .then((res) => {
      biz_id = res.bid;
        return sql.test.association.add(assoc_info[0])
      })
      .then(() => {
        return sql.test.membership.add(mem_info[0])
      })
      .then((res) => {
        return rp({
          method: 'put',
          body: {
              name: 'Biscuit',
              name_fa: 'بیسکویت',
              description: 'Produce with milk powder',
              description_fa: 'تولید شده از پودر شیر',
              parent_product_id: null,
          },
          json: true,
          uri: lib.helpers.apiTestURL(`business/product/${biz_id}`),
          jar: repObj.jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.product.getByProductId({product_id: res.body.product_id});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].product_name).toBe('Biscuit');
        expect(res[0].bid).toBe(1);
        expect(res[0].product_start_time).not.toBe(null);
        expect(res[0].product_end_time).toBe(null);
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  })

  it("normal user should not be able to add business to bisiness", function (done) {
    this.done = done;
    let biz_id = null;
    sql.test.business.add(biz_info[0])
      .then((res) => {
        biz_id = res.bid;
        return sql.test.association.add(assoc_info[1])
      })
      .then(() => {
        return sql.test.membership.add(mem_info[1])
      })
      .then((res) => {
        return rp({
          method: 'put',
          body: {
              name: 'Biscuit',
              name_fa: 'بیسکویت',
              description: 'Produce with milk powder',
              description_fa: 'تولید شده از پودر شیر',
              parent_product_id: null,
          },
          json: true,
          uri: lib.helpers.apiTestURL(`business/product/${biz_id}`),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        this.fail('normal user can not add product to business.');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notBizRep.status);
        expect(err.error).toBe(error.notBizRep.message);
        done();
      });
  })

  it("a rep should not be able to add a product to other representatives's business", function(done){
    this.done = done;
    let biz_id1 = null;
    let biz_id2 = null;
    sql.test.business.add(biz_info[0])
      .then((res) => {
        biz_id1 = res.bid;
        return sql.test.business.add(biz_info[1])
      })
      .then((res)=>{
        biz_id2 = res.bid;
        return sql.test.association.add(assoc_info[0])
      })
      .then((res) =>{
      return sql.test.association.add(assoc_info[2])
      })
      .then((res) => {
        return sql.test.membership.add(mem_info[0])
      })
      .then((res) => {
      return sql.test.membership.add(mem_info[2]) //make normal user as rep of business 2
    })
      .then((res) => {
        return rp({
          method: 'put',
          body: {
              name: 'Biscuit',
              name_fa: 'بیسکویت',
              description: 'Produce with milk powder',
              description_fa: 'تولید شده از پودر شیر',
              parent_product_id: null,
          },
          json: true,
          uri: lib.helpers.apiTestURL(`business/product/${biz_id1}`),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        this.fail('you are not rep of this business.');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notBizRep.status);
        expect(err.error).toBe(error.notBizRep.message);
        done();
      });
  })
})