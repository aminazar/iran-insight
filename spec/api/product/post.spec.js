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

let product_info = [{
  product_id: 1,
  name: 'bag',
  name_fa: 'کیف',
  description: 'leather bag',
  description_fa: 'کیف چرمی',
  parent_product_id: null,
  tags: null,
},{
  product_id: 2,
  name: 'suit',
  name_fa: 'کت و شلوار',
  description: 'wintry suit',
  description_fa: 'کت و شلوار زمستانی',
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

let biz_product_info = [{
  bid: 1,
  product_id: 1,
  market_share: null,
}, {
  bid: 1,
  product_id: 2,
  market_share: null,
}, {
  bid: 2,
  product_id: 1,
  market_share: null,
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
        return Promise.all(product_info.map(el => createNewProduct(el)))
      })
      .then((res) => {
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  })

  it('admin should be able to update a product', done => {
    createNewBusiness(biz_info[0])
      .then((res) => {
        return rp({
          method: 'post',
          body: {
            name: 'bagg',
            name_fa: 'کیفف',
          },
          uri: lib.helpers.apiTestURL('update-product/1'),
          json: true,
          jar: adminObj.jar,
          resolveWithFullResponse: true,
        });
      })
      .then((res) => {
        expect(res.statusCode).toBe(200);
        return sql.test.product.getById({product_id: res.product_id})
      })
      .then((res) => {
        expect(res[0].length).toBe(1);
        expect(res[0].name).toBe('bagg');
        expect(res[0].name_fa).toBe('کیفف');
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  });

  it('a normal user should not be able to update a product', function (done) {
    createNewBusiness(biz_info[1])
      .then((res) => {
        return rp({
          method: 'post',
          body: {
            name: 'suitt',
          },
          uri: lib.helpers.apiTestURL('update-product/2'),
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
        expect(err.statusCode).toBe(error.adminOnly.status);
        expect(err.error).toBe(error.adminOnly.message);
        console.log('****');
        done();
      });
  })
})