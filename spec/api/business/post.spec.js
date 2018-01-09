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
  let bizObj = null;

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('admin', 'admin123', {display_name_en: 'DNE'}))
      .then(res => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;
        return lib.dbHelpers.addAdmin(adminObj.pid);
      })
      .then(res => {
        return lib.dbHelpers.addAndLoginPerson('rep', 'rep123', {display_name_en: 'DNE'});
      })
      .then(res => {
        repObj.pid = res.pid;
        repObj.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('ali', 'ali123', {display_name_en: 'DNE'})
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
      .then(res => {
        bizObj = res;
        done();
      })
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
        url: 'https//snapp.com',
        bid: bizObj.bid,
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

  it("representative of another business cannot add business profile", function (done) {
    let anotherRep;
    lib.dbHelpers.addAndLoginPerson('rep2')
      .then(res => {
        anotherRep = res;
        return lib.dbHelpers.addBusinessWithRep(anotherRep.pid);
      })
      .then(res => {
        return rp({
          method: 'post',
          form: {
            name: 'ZoodFood',
            name_fa: 'زودفود',
            ceo_pid: repObj.pid,
            biz_type_id: 101,
            address: 'Tehran - Iran',
            address_fa: 'ایران - تهران',
            tel: '+123-9876',
            url: 'https//snapp.com',
            bid: bizObj.bid,
          },
          uri: lib.helpers.apiTestURL('business/profile'),
          jar: anotherRep.rpJar,
          resolveWithFullResponse: true
        });
      })
      .then(res => {
        this.fail('Rep of another biz can set profile for another biz');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notAllowed.status);
        expect(err.error).toBe(error.notAllowed.message);
        done();
      })
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

  //Below tests (the first four of them) should compatible with current product of business structure
  xit("relevant representative should add product to specific business", function (done) {
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

  xit("representative of another business cannot add product to another business", function (done) {
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

  xit("representative should assign existing product", function (done) {
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

  xit("representative should update product for his/her business", function (done) {
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

  it('admin or rep of biz can delete biz', function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        end_date: '2018-03-03',
      },
      json: true,
      uri: lib.helpers.apiTestURL('business/one/delete/' + bizObj.bid),
      jar: repObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it('any user except admin or related rep cannot able to delete biz', function (done) {
    rp({
      method: 'post',
      body: {
        end_date: '2018-03-03',
      },
      json: true,
      uri: lib.helpers.apiTestURL('business/one/delete/' + bizObj.bid),
      jar: normalUserObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('Non related rep or admin can delete a business');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notBizRep.status);
        expect(err.error).toBe(error.notBizRep.message);
        done();
      })
  });

  it('admin should delete business without any rep', function (done) {
    this.done = done;
    sql.test.business.add({
      name: 'one business',
      name_fa: 'یه شرکت',
    })
      .then(res => {
        return rp({
          method: 'post',
          body: {
            end_date: '2018-03-03',
          },
          json: true,
          uri: lib.helpers.apiTestURL('business/one/delete/' + res.bid),
          jar: adminObj.jar,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get error when no end date passed in body", function (done) {
    rp({
      method: 'post',
      json: true,
      uri: lib.helpers.apiTestURL('business/one/delete/' + bizObj.bid),
      jar: normalUserObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('Business is deleted without defining body');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.noEndDate.status);
        expect(err.error).toBe(error.noEndDate.message);
        done();
      })
  });
});