const request = require("request");
const lib = require('../../../lib');
const sql = require('../../../sql');
const rp = require("request-promise");
const moment = require('moment');
let req = request.defaults({jar: true});//enabling cookies

describe('PUT product API', () => {

  let adminObj = {
    pid: null,
    jar: null,
  };
  let normalUserObj = {
    pid: null,
    jar: null,
  };
  let repObj = {
    pid: null,
    jar: null,
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
      .then(() =>{
        done();
      })
      .catch(err => {
        console.log(err);
        done();
      });
  })

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


})