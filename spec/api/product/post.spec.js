const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const request = require("request");
let req = request.defaults({jar: true}); //enabling cookies


let adminObj = {
  pid: null,
  jar: null,
};
let userObj = {
  pid: null,
  jar: null,
};
let repObj = {
  pid: null,
  jar: null,
};
let product_info = [{
  product_id: 1,
  business_id: 1,
  name: 'suit',
  name_fa: 'کت و شلوار',
  description: 'wintry suit',
  description_fa: 'کت و شلوار زمستانی',
  parent_product_id: null,
  tags: null,
}, {
  product_id: 2,
  business_id: 2,
  name: 'bag',
  name_fa: 'کیف',
  description: 'leather bag',
  description_fa: 'کیف چرمی',
  parent_product_id: null,
  tags: null,
}];
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
let createNewProduct = (product_info) => {
  return sql.test.product.add(product_info);
};
let createNewBusiness = (biz_info) => {
  return sql.test.business.add(biz_info);
};
let createNewBusiness_product = (biz_product_info) => {
  return sql.test.business_product.add(biz_product_info);
};


describe('POST product API', () => {

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
      .then(() => {
        return lib.dbHelpers.addAndLoginPerson('repUser', '123')
      })
      .then((res) => {
        repObj.pid = res.pid;
        repObj.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('normalUser', '123')
      })
      .then((res) => {
        userObj.pid = res.pid;
        userObj.jar = res.rpJar;
        return Promise.all(biz_info.map(el => createNewBusiness(el)))
      })
      .then((res) => {
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  })

  it('admin should be able to delete a product', done => {
    createNewProduct(product_info[0])
      .then(() => {
        return sql.test.product.select()
      })
      .then((res) => {
        expect(res.length).toBe(1);
        expect(res[0].end_time).toBe(null);
        return rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL(`/business/remove-product/1/1`),
          jar: adminObj.jar,
          resolveWithFullResponse: true,
        })
      })
      .then((res) => {
        expect(res.statusCode).toBe(200);
        return sql.test.product.select()
      })
      .then((res) => {
        expect(res.length).toBe(1);
        expect(res[0].end_time).not.toBe(null);
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  })

  it('representative of a business should be able to delete a product from her/his business', done => {
    createNewProduct(product_info[0])
      .then((res) => {
        return sql.test.association.add(assoc_info[0])
      })
      .then((res) => {
        return sql.test.membership.add(mem_info[0])
      })
      .then(() => {
        return rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL(`/business/remove-product/1/1`),
          jar: repObj.jar,
          resolveWithFullResponse: true,
        })
      })
      .then((res) => {
        expect(res.statusCode).toBe(200);
        return sql.test.product.select()
      })
      .then((res) => {
        expect(res.length).toBe(1);
        expect(res[0].end_time).not.toBe(null);
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  })

  it('normal user should not be able to delete a product', function (done) {
    this.done = done;
    createNewProduct(product_info[0])
      .then((res) => {
        return sql.test.association.add(assoc_info[1])
      })
      .then((res) => {
        return sql.test.membership.add(mem_info[1])
      })
      .then(() => {
        return rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL(`/business/remove-product/1/1`),
          jar: userObj.jar,
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

  it('admin should be able to update a product', done => {
    createNewProduct(product_info[0])
      .then(()=>{
        return rp({
          method: 'post',
          body: {
            name: 'suitt',
            name_fa: 'کتت و ششلوار',
          },
          uri: lib.helpers.apiTestURL('update-product/1/1'),
          json: true,
          jar: adminObj.jar,
          resolveWithFullResponse: true,
        })
      })
      .then((res) => {
        expect(res.statusCode).toBe(200);
        return sql.test.product.select()
      })
      .then((res) => {
        expect(res.length).toBe(1);
        expect(res[0].name).toBe('suitt');
        expect(res[0].name_fa).toBe('کتت و ششلوار');
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  });

  it('a normal user should not be able to update a product', function (done) {
    createNewProduct(product_info[0])
      .then((res) => {
        return rp({
          method: 'post',
          body: {
            name: 'suitt',
          },
          uri: lib.helpers.apiTestURL('update-product/1/1'),
          json: true,
          jar: userObj.jar,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        this.fail('regular user can not update product, only admin can do this.');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notBizRep.status);
        expect(err.error).toBe(error.notBizRep.message);
        done();
      });
  })

  it('representative of a business should be able to update a product from her/his business', done => {
    createNewProduct(product_info[0])
      .then((res) => {
        return sql.test.association.add(assoc_info[0])
      })
      .then((res) => {
        return sql.test.membership.add(mem_info[0])
      })
      .then(() => {
        return rp({
          method: 'post',
          body: {
            name: 'suitt',
            name_fa: 'کتت وشلوار',
          },
          uri: lib.helpers.apiTestURL('update-product/1/1'),
          json: true,
          jar: repObj.jar,
          resolveWithFullResponse: true,
        })
      })
      .then((res) => {
        expect(res.statusCode).toBe(200);
        return sql.test.product.select()
      })
      .then((res) => {
        expect(res.length).toBe(1);
        expect(res[0].name).toBe('suitt');
        expect(res[0].name_fa).toBe('کتت وشلوار');
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  })
})


