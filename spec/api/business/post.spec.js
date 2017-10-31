const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

describe("POST Business API", () => {
  let adminObj = {
    pid: null,
    jar: null
  };
  let repObj = {
    pid: null,
    jar: null,
  };
  let normalUserObj = {
    pid: null,
    jar: null,
  };
  let businessId = null;

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('admin', 'admin123', {}))
      .then(res => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;
        return lib.dbHelpers.addAdmin(adminObj.pid);
      })
      .then(res => {
        return lib.dbHelpers.addAndLoginPerson('rep', 'rep123', {});
      })
      .then(res => {
        repObj.pid = res.pid;
        repObj.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('ali', 'ali123', {})
      })
      .then(res => {
        normalUserObj.pid = res.pid;
        normalUserObj.jar = res.rpJar;
        return sql.test.business_type.add({
          id: 101,
          name: 'TeleCom',
          name_fa: 'مخابراتی',
          suggested_by: adminObj.pid,
          active: true,
        });
      })
      .then(() => lib.dbHelpers.addBusinessWithRep(repObj.pid, 'Irancell'))
      .then(res => done())
      .catch(err => {
        console.error(err);
        done();
      });
  });

  it("representative should add business profile", function (done) {
    this.done = done;
    rp({
      method: 'post',
      form: {
        name: 'ZoodFood',
        name_fa: 'زودفود',
        ceo_pid: repObj.pid,
        biz_type_id: 101,
        address: 'Tehran - Iran',
        address_fa: 'ایران - تهران',
        tel: '+123-9876',
        url: 'https//snapp.com'
      },
      uri: lib.helpers.apiTestURL('business/profile'),
      jar: repObj.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.business.select()
      })
      .then(res => {
        if (res.length === 0)
          this.fail('No business added');
        else
          expect(res).toBeTruthy();
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("admin should add/update business profile", function (done) {
    this.done = done;
    let businessId = null;
    sql.test.business.add({
      name: 'ZoodFood',
      name_fa: 'زودفود',
      ceo_pid: repObj.pid,
      biz_type_id: 101,
      address: 'Tehran - Iran',
      address_fa: 'ایران - تهران',
      tel: '+123-9876',
      url: 'https//snapp.com'
    })
      .then(res => {
        businessId = res.bid;
        return rp({
          method: 'post',
          form: {
            bid: res.bid,
            name: 'SnappFood',
            name_fa: 'اسنپ فود'
          },
          uri: lib.helpers.apiTestURL('business/profile'),
          jar: adminObj.jar,
          resolveWithFullResponse: true
        });
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.business.get({bid: businessId});
      })
      .then(res => {
        if (res.length < 1)
          this.fail('No business added');
        else {
          expect(res[0].name).toBe('SnappFood');
          expect(res[0].name_fa).toBe('اسنپ فود');
          expect(res[0].tel).toBe('+123-9876');
        }

        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("normal user have not access to change/set business profile", function (done) {
    sql.test.business.add({
      name: 'ZoodFood',
      name_fa: 'زودفود',
      ceo_pid: repObj.pid,
      biz_type_id: 101,
      address: 'Tehran - Iran',
      address_fa: 'ایران - تهران',
      tel: '+123-9876',
      url: 'https//snapp.com'
    })
      .then(res => {
        return rp({
          method: 'post',
          form: {
            bid: res.bid,
            name: 'SnappFood',
            name_fa: 'اسنپ فود'
          },
          uri: lib.helpers.apiTestURL('business/profile'),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true
        });
      })
      .then(res => {
        this.fail('Permitted not representative user to update business info');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(403);
        expect(err.error).toBe('You cannot access to this functionality');
        done();
      });
  });

  it("relevant representative should add product to specific business", function (done) {
    this.done = done;
    lib.dbHelpers.addBusinessWithRep(repObj.pid)
      .then(res => {
        return rp({
          method: 'post',
          body: {
            bid: res.bid,
            product: {
              name: 'Mobile app developing framework',
              name_fa: 'چارچوب ساخت برنامه موبایل',
            },
            market_share: 25.34,
          },
          uri: lib.helpers.apiTestURL('business/product'),
          json: true,
          jar: repObj.jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("representative of another business cannot add product to another business", function (done) {
    let anotherRep = {
      pid: null,
      jar: null,
    };
    lib.dbHelpers.addAndLoginPerson('rep2')
      .then(res => {
        anotherRep.pid = res.pid;
        anotherRep.jar = res.rpJar;
        return lib.dbHelpers.addBusinessWithRep(repObj.pid);
      })
      .then(res => {
        return rp({
          method: 'post',
          body: {
            bid: res.bid,
            product: {
              name: 'Mobile app developing framework',
              name_fa: 'چارچوب ساخت برنامه موبایل',
            },
            market_share: 25.34,
          },
          json: true,
          uri: lib.helpers.apiTestURL('business/product'),
          jar: anotherRep.jar,
          resolveWithFullResponse: true
        });
      })
      .then(res => {
        this.fail('Rep of another business add product to another business');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notBizRep.status);
        expect(err.error).toBe(error.notBizRep.message);
        done();
      })
  });

  it("representative should assign exist product", function (done) {
    this.done = done;
    let productId = null;
    let businessId = null;
    sql.test.product.add({
      name: 'Mobile app developing framework',
      name_fa: 'چارچوب ساخت برنامه موبایل',
    })
      .then(res => {
        productId = res.product_id;
        return lib.dbHelpers.addBusinessWithRep(repObj.pid);
      })
      .then(res => {
        businessId = res.bid;
        return rp({
          method: 'post',
          body: {
            product_id: productId,
            bid: res.bid
          },
          uri: lib.helpers.apiTestURL('business/product'),
          json: true,
          jar: repObj.jar,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.business.getBusinessProducts({bid: businessId});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].market_share).toBe(null);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("representative should update product for his/her business", function (done) {
    this.done = done;
    let productId = null;
    let businessId = null;
    sql.test.product.add({
      name: 'Mobile app developing framework',
      name_fa: 'چارچوب ساخت برنامه موبایل',
    })
      .then(res => {
        productId = res.product_id;
        return lib.dbHelpers.addBusinessWithRep(repObj.pid);
      })
      .then(res => {
        businessId = res.bid;
        return sql.test.business_product.add({
          bid: res.bid,
          product_id: productId
        });
      })
      .then(res => {
        return rp({
          method: 'post',
          body: {
            bpid: res.bpid,
            product_id: productId,
            bid: businessId,
            market_share: 80.3101,
          },
          uri: lib.helpers.apiTestURL('business/product'),
          json: true,
          jar: repObj.jar,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.business.getBusinessProducts({bid: businessId});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].market_share).toBe(80.3101);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});