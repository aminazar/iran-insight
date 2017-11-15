const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

describe("PUT Business API", () => {
  let adminObj = {
    pid: null,
    jar: null,
  };
  let normalUserObj = {
    pid: null,
    jar: null,
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
        return lib.dbHelpers.addAndLoginPerson('ali');
      })
      .then(res => {
        normalUserObj.pid = res.pid;
        normalUserObj.jar = res.rpJar;
        done();
      })
      .catch(err => {
        console.log(err);
        done();
      });
  });

  it("admin should add product", function (done) {
    this.done = done;
    rp({
      method: 'put',
      body: {
        name: 'Biscuit',
        name_fa: 'بیسکویت',
        description: 'Produce with milk powder',
        description_fa: 'تولید شده از پودر شیر',
        parent_product_id: null,
      },
      json: true,
      uri: lib.helpers.apiTestURL('product'),
      jar: adminObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.product.getById({product_id: res.body.product_id});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].name).toBe('Biscuit');
        expect(res[0].parent_product_id).toBe(null);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("admin should add two products", function (done) {
    this.done = done;
    let productIds = [];
    sql.test.product.add({
      name: 'Milk powder',
      name_fa: 'پودر شیر',
    })
      .then(res => {
        productIds.push(res.product_id);
        return rp({
          method: 'put',
          body: [{
            name: 'Biscuit',
            name_fa: 'بیسکویت',
            description: 'Produce with milk powder',
            description_fa: 'تولید شده از پودر شیر',
            parent_product_id: res.product_id
          }, {
            name: 'gumdrop',
            name_fa: 'پاستیل'
          }],
          uri: lib.helpers.apiTestURL('product'),
          jar: adminObj.jar,
          json: true,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        res.body.forEach(el => productIds.push(el.product_id));
        return sql.test.product.getById({product_id: productIds[1]});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].name).toBe('Biscuit');
        expect(res[0].parent_product_id).toBe(productIds[0]);
        return sql.test.product.getById({product_id: productIds[2]});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].name).toBe('gumdrop');
        expect(res[0].description).toBe(null);
        expect(res[0].parent_product_id).toBe(null);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("other users (not admins) cannot add product", function (done) {
    this.done = done;
    rp({
      method: 'put',
      body: {
        name: 'Biscuit',
        name_fa: 'بیسکویت',
        description: 'Produce with milk powder',
        description_fa: 'تولید شده از پودر شیر',
        parent_product_id: null,
      },
      json: true,
      uri: lib.helpers.apiTestURL('product'),
      jar: normalUserObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('Other users (not admins) add a product');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.adminOnly.status);
        expect(err.error).toBe(error.adminOnly.message);
        done();
      });
  });

  it("user should follow specific business", function (done) {
    this.done = done;
    let businessId = null;
    lib.dbHelpers.addPerson('rep')
      .then(res => lib.dbHelpers.addBusinessWithRep(res))
      .then(res => {
        businessId = res.bid;
        return rp({
          method: 'put',
          uri: lib.helpers.apiTestURL('follow/business/' + res.bid),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.subscription.getBizSubscribers({bid: businessId});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].pid).toBe(normalUserObj.pid);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});