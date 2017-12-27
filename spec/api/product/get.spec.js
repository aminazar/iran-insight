const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const env = require('../../../env');

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

  let biz = {
    name: 'BIZ',
    name_fa: 'کسب و کار',
  };
  let bid;
  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('ali'))
      .then(res => {
        normalUserObj.pid = res.pid;
        normalUserObj.jar = res.rpJar;

        return sql.test.business.add(biz);
      })
      .then(res => {
        bid = res.bid;

        let promiseList = [];
        env.testDb.task(t => {
          productDetails.forEach(el => {
            el.business_id = bid;
            promiseList.push(sql.test.product.add(el,t));
          });
          return Promise.all(promiseList);
        })
      })
      .then(done)
      .catch(err => {
        console.log(err);
        done();
      });
  });

  it("get specific product", function (done) {
    this.done = done;

    rp({
      method: 'get',
      uri: lib.helpers.apiTestURL(`business/product/one/${bid}`),
      jar: normalUserObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        let data = JSON.parse(res.body);
        console.log(data);
        expect(res.statusCode).toBe(200);
        expect(data.name).toBe('Mobile app developing framework');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

 xit("should get all products for specific business", function (done) {
    this.done = done;
    let business_id = null;

    sql.test.business.add(biz)
      .then(res => {
        business_id = res.bid;
        let promiseList = [];
        productDetails.forEach(el => {
          promiseList.push(addProduct(el, res.bid));
        });

        return Promise.all(promiseList);
      })
      .then(res => {
        return rp({
          method: 'get',
          uri: lib.helpers.apiTestURL(`business/product/all/${business_id}`),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        let data = JSON.parse(res.body);
        expect(res.statusCode).toBe(200);
        expect(data.length).toBe(3);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
})
;