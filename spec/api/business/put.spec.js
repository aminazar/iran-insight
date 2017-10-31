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
      form: {
        name: 'Biscuit',
        name_fa: 'بیسکویت',
        desc: 'Produce with milk powder',
        desc_fa: 'تولید شده از پودر شیر',
        parent_product_id: null
      },
      uri: lib.helpers.apiTestURL('business/product'),
      jar: adminObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.product.getById({product_id: res.body});
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
            desc: 'Produce with milk powder',
            desc_fa: 'تولید شده از پودر شیر',
            parent_product_id: res.product_id
          },{
            name: 'gumdrop',
            name_fa: 'پاستیل'
          }],
          uri: lib.helpers.apiTestURL('business/product'),
          jar: adminObj.jar,
          json: true,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        res.body.forEach(el => productIds.push(el));
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
        expect(res[0].desc).toBe(null);
        expect(res[0].parent_product_id).toBe(null);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("other users (not admins) cannot add product", function (done) {
    this.done = done;
    rp({
      method: 'put',
      form: {
        name: 'Biscuit',
        name_fa: 'بیسکویت',
        desc: 'Produce with milk powder',
        desc_fa: 'تولید شده از پودر شیر',
        parent_product_id: null,
      },
      uri: lib.helpers.apiTestURL('business/product'),
      jar: adminObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.product.getById({product_id: res.body});
      })
      .then(res => {
        this.fail('Other users (not admins) add a product');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notAllowed.status);
        expect(err.error).toBe(error.notAllowed.message);
        done();
      });
  });
});