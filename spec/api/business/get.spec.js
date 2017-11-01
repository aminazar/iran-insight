const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

describe("GET Business API", () => {
 let normalUserObj = {
    pid: null,
    jar: null,
  };

  let productDetails = [
    {
      name: 'Mobile app developing framework',
      name_fa: 'چارچوب ساخت برنامه موبایل',
    },
    {
      name: 'Choocolate Maker',
      name_fa: 'شکلات ساز',
    },
    {
      name: 'Online food ordering',
      name_fa: 'سفارش آنلاین غذا',
    }
  ];

  let addProduct = (product, businessId, marketShare = null) => {
    return new Promise((resolve, reject) => {
      let productId = null;
      sql.test.product.add(product)
        .then(res => {
          productId = res.product_id;
          return sql.test.business_product.add({
            bid: businessId,
            product_id: res.product_id,
            market_share: marketShare,
          });
        })
        .then(res => resolve(productId))
        .catch(err =>  reject(err));
    });
  };

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('ali'))
      .then(res => {
        normalUserObj.pid = res.pid;
        normalUserObj.jar = res.rpJar;

        return sql.test.organization_type.add({
          id: 101,
          name: 'non-governmental',
          name_fa: 'غیر دولتی',
        });
      })
      .then(() => done())
      .catch(err => {
        console.log('err');
        done();
      });
  });

  it("any logged in user should be able to list all products of specific business", function (done) {
    this.done = done;

    sql.test.business.add({
      name: 'BIZ',
      name_fa: 'کسب و کار',
    })
      .then(res => {
        let promiseList = [];
        productDetails.forEach(el => {
          promiseList.push(addProduct(el, res.bid));
        });

        return Promise.all(promiseList);
      })
      .then(res => {
        return rp({
          method: 'get',
          uri: lib.helpers.apiTestURL('business/product/all'),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body).length).toBe(3);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  //Below test when specific condition (all or registered people can access) is used in apiResponse function can be used
  xit("not logged in user cannot access to list of products of business", function (done) {
    this.done = done;

    sql.test.business.add({
      name: 'BIZ',
      name_fa: 'کسب و کار',
    })
      .then(res => {
        let promiseList = [];
        productDetails.forEach(el => {
          promiseList.push(addProduct(el, res.bid));
        });

        return Promise.all(promiseList);
      })
      .then(res => {
        return rp({
          method: 'get',
          uri: lib.helpers.apiTestURL('business/product/all'),
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        this.fail('Not logged in user can access to all product list');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notAllowed.status);
        expect(err.error).toBe(error.notAllowed.message);
        done();
      });
  });

  it("get specific product of business", function (done) {
    this.done = done;

    sql.test.business.add({
      name: 'BIZ',
      name_fa: 'کسب و کار',
    })
      .then(res => {
        let promiseList = [];
        productDetails.forEach(el => {
          promiseList.push(addProduct(el, res.bid));
        });

        return Promise.all(promiseList);
      })
      .then(res => {
        return rp({
          method: 'get',
          uri: lib.helpers.apiTestURL(`business/product/${res[0]}`),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        let data = JSON.parse(res.body);
        expect(res.statusCode).toBe(200);
        expect(data[0].name).toBe('Mobile app developing framework');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});