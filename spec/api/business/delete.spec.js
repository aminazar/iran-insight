const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

describe('DELETE Business API', () => {
  let repObj = {
    pid: null,
    jar: null,
  };
  let normalUserObj = {
    pid: null,
    jar: null,
  };
  let adminObj = {
    pid: null,
    jar: null,
  };
  let businessId = null;

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
        .catch(err => reject(err));
    });
  };

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('admin'))
      .then(res => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;
        return lib.dbHelpers.addAdmin(adminObj.pid);
      })
      .then(() => lib.dbHelpers.addAndLoginPerson('rep'))
      .then(res => {
        repObj.pid = res.pid;
        repObj.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('ali');
      })
      .then(res => {
        normalUserObj.pid = res.pid;
        normalUserObj.jar = res.rpJar;
        return sql.test.organization_type.add({
          id: 101,
          name: 'non-governmental',
          name_fa: 'غیر دولتی',
        });
      })
      .then(() => lib.dbHelpers.addBusinessWithRep(repObj.pid, 'Irancell'))
      .then(res => {
        businessId = res.bid;
        done();
      })
      .catch(err => {
        console.log('err');
        done();
      });
  });

  //Two below tests should changed based on new structure of product table
  xit('representative should remove product of his/her business (delete from business_product not product)', function (done) {
    this.done = done;
    addProduct({
      name: 'Mobile app developing framework',
      name_fa: 'چارچوب ساخت برنامه موبایل',
    }, businessId)
      .then(res => {
        return rp({
          method: 'delete',
          form: {
            product_id: res,
            bid: businessId,
          },
          uri: lib.helpers.apiTestURL('business/product'),
          jar: repObj.jar,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.business.getBusinessProducts({bid: businessId});
      })
      .then(res => {
        expect(res.length).toBe(0);
        return sql.test.product.select();
      })
      .then(res => {
        expect(res.length).toBe(1);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  xit('normal user cannot access to delete product of business', function (done) {
    this.done = done;
    addProduct({
      name: 'Mobile app developing framework',
      name_fa: 'چارچوب ساخت برنامه موبایل',
    }, businessId)
      .then(res => {
        return rp({
          method: 'delete',
          form: {
            product_id: res,
            bid: businessId,
          },
          uri: lib.helpers.apiTestURL('business/product'),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true,
        });
      })
      .then(res => {
        this.fail('Not representative user can delete business product');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notBizRep.status);
        expect(err.error).toBe(error.notBizRep.message);
        done();
      });
  });

  it('user should unfollow specific business', function (done) {
    this.done = done;
    sql.test.subscription.add({
      subscriber_id: normalUserObj.pid,
      bid: businessId
    })
      .then(() =>
        rp({
          method: 'delete',
          uri: lib.helpers.apiTestURL('follow/business/' + businessId),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true
        })
      )
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.subscription.getBizSubscribers({bid: businessId});
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it('admin or rep of biz can delete biz', function (done) {
    this.done = done;
    rp({
      method: 'delete',
      uri: lib.helpers.apiTestURL('business/one/' + businessId),
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
    this.done = done;
    rp({
      method: 'delete',
      uri: lib.helpers.apiTestURL('business/one/' + businessId),
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
          method: 'delete',
          uri: lib.helpers.apiTestURL('business/one/' + res.bid),
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
});