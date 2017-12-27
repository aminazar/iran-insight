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
  let bid, pids;
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
        return env.testDb.task('adding mock products', t => {
          productDetails.forEach(el => {
            el.business_id = bid;
            promiseList.push(sql.test.product.add(el, t));
          });
          return Promise.all(promiseList);
        })
      })
      .then(res => {
        pids = res.map(r => r.product_id);
        done();
      })
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

  it("should get all products for specific business", function (done) {
    this.done = done;

    rp({
      method: 'get',
      uri: lib.helpers.apiTestURL(`business/product/all/${bid}`),
      resolveWithFullResponse: true,
    })
      .then(res => {
        let data = JSON.parse(res.body);
        expect(res.statusCode).toBe(200);
        let find0 = data.find(r => r.product_id === pids[0]),
          find2 = data.find(r => r.product_id === pids[2]);
        expect(find0).toBeTruthy();
        expect(find2).toBeTruthy();

        if (find0) {
          expect(find0.name).toBe(productDetails[0].name);
        }

        if (find2) {
          expect(find2.name_fa).toBe(productDetails[2].name_fa);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});
