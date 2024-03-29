const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const types = require('../../../sql/types');

describe("Post Tag", () => {
  let adminObj = {
    pid: null,
    jar: null,
  };
  let normalUser = {
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
        return lib.dbHelpers.addAndLoginPerson('ehsan');

      }).then(res => {
        normalUser.pid = res.pid;
        normalUser.jar = res.rpJar;
        done();
      }
    ).catch(err => {
      console.log(err);
      done();
    });
  });


  it("Admin should be able to confirm a tag", function (done) {
    this.done = done;
    let tagId;
    sql.test.tag.add({name: 'اینترنت'})
      .then(res => {
        tagId = res.tid;
        return rp({
          method: 'post',
          uri: lib.helpers.apiTestURL(`tag/confirm/${tagId}`),
          jar: adminObj.jar,
          resolveWithFullResponse: true
        })
      }).then(res => {

      expect(res.statusCode).toBe(200);

      return sql.test.tag.select();
    }).then(res => {
      expect(res[0].active).toBe(true);
      done();
    })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("Expect error when other users are calling api", function (done) {
    this.done = done;
    let tagId;
    sql.test.tag.add({name: 'اینترنت'})
      .then(res => {
        tagId = res.tid;
        return rp({
          method: 'post',
          uri: lib.helpers.apiTestURL(`tag/confirm/${tagId}`),
          jar: normalUser.jar,
          resolveWithFullResponse: true
        })
      })
      .then(res => {
        this.fail('did not failed when other users are calling api');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.adminOnly.status);
        expect(err.error).toBe(error.adminOnly.message);
        done();
      });

  });

});

describe("Delete tag", () => {
  let adminObj = {
    pid: null,
    jar: null,
  };
  let orgRep = {
    pid: null,
    jar: null,
  };
  let bizRep = {
    pid: null,
    jar: null,
  };
  let normalUser = {
    pid: null,
    jar: null,
  };
  let org, biz, product_id, tid1, tid2;

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('admin'))
      .then(res => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;
        return lib.dbHelpers.addAdmin(adminObj.pid);
      })
      .then(res => lib.dbHelpers.addAndLoginPerson('eabasir@gmail.com'))
      .then(res => {
        normalUser.pid = res.pid;
        normalUser.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('orgRep')
      })
      .then(res => {
        orgRep.pid = res.pid;
        orgRep.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('bizRep')
      })
      .then(res => {
        bizRep.pid = res.pid;
        bizRep.jar = res.rpJar;
        return lib.dbHelpers.addOrganizationWithRep(orgRep.pid, 'MTN');

      })
      .then(res => {
        org = res;
        return lib.dbHelpers.addBusinessWithRep(bizRep.pid, 'snapp');

      })
      .then(res => {
        biz = res;
        return sql.test.product.add({name: 'android app', business_id: biz.bid})

      })
      .then(res => {
        product_id = res.product_id;
        return sql.test.tag.add({name: 'اینترنت'})
      })
      .then(res => {
        tid1 = res.tid;
        return sql.test.tag.add({name: 'حمل و نقل'})
      })
      .then(res => {
        tid2 = res.tid;
        done();
      })
      .catch(err => {
        console.log(err);
        done();
      });
  });

  it("Rep should be able to remove a tag", function (done) {
    this.done = done;
    sql.test.business.update({tags: ['اینترنت', 'حمل و نقل']}, biz.bid)
      .then(res => sql.test.tag_connection.add({tid1, tid2}))
      .then(res =>
        rp({
          method: 'post',
          uri: lib.helpers.apiTestURL(`tag/removeFrom`),
          body: {
            bid: biz.bid,
            name: 'اینترنت'
          },
          json: true,
          jar: bizRep.jar,
          resolveWithFullResponse: true
        }))
      .then(res => {

        expect(res.statusCode).toBe(200);

        return sql.test.business.get({bid: biz.bid});
      }).then(res => {
      expect(res[0].tags.length).toBe(1);
      return sql.test.tag_connection.select()
    })
      .then(res => {
        expect(res[0].affinity).toBe(4);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
  it("Rep should be able to remove a tag from product", function (done) {
    this.done = done;
    sql.test.tag.appendTagToTarget({tableName: 'product', tag: 'اینترنت', condition: `product_id = ${product_id}`})
      .then(res =>
        rp({
          method: 'post',
          uri: lib.helpers.apiTestURL(`tag/removeFrom`),
          body: {
            product_id: product_id,
            name: 'اینترنت'
          },
          json: true,
          jar: adminObj.jar,
          resolveWithFullResponse: true
        })).then(res => {

      expect(res.statusCode).toBe(200);

      return sql.test.product.get({product_id});
    }).then(res => {
      expect(res[0].tags.length).toBe(0);
      done();
    })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("Expect error when other users want to delete product tag", function (done) {

    this.done = done;
    sql.test.tag.appendTagToTarget({tableName: 'product', tag: 'اینترنت', condition: `product_id = ${product_id}`})
      .then(res =>
        rp({
          method: 'post',
          uri: lib.helpers.apiTestURL(`tag/removeFrom`),
          body: {
            product_id: product_id,
            name: 'اینترنت'
          },
          json: true,
          jar: bizRep.jar,
          resolveWithFullResponse: true
        }))
      .then(res => {
        this.fail('did not failed when other users want to delete product tag');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.notAllowed.status);
        expect(err.error).toBe(error.notAllowed.message);
        done();
      });

  });
});


describe("get similar tags list", () => {
  let adminObj = {
    pid: null,
    jar: null,
  };
  let orgRep = {
    pid: null,
    jar: null,
  };
  let bizRep = {
    pid: null,
    jar: null,
  };
  let normalUser = {
    pid: null,
    jar: null,
  };
  let org, biz, product_id, tid1, tid2, tid3;

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('admin'))
      .then(res => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;
        return lib.dbHelpers.addAdmin(adminObj.pid);
      })
      .then(res => lib.dbHelpers.addAndLoginPerson('eabasir@gmail.com'))
      .then(res => {
        normalUser.pid = res.pid;
        normalUser.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('orgRep')
      })
      .then(res => {
        orgRep.pid = res.pid;
        orgRep.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('bizRep')
      })
      .then(res => {
        bizRep.pid = res.pid;
        bizRep.jar = res.rpJar;
        return lib.dbHelpers.addOrganizationWithRep(orgRep.pid, 'MTN');

      })
      .then(res => {
        org = res;
        return lib.dbHelpers.addBusinessWithRep(bizRep.pid, 'snapp');

      })
      .then(res => {
        biz = res;
        return sql.test.product.add({name: 'android app', business_id: biz.bid})

      })
      .then(res => {
        product_id = res.product_id;
        return sql.test.tag.add({name: 'حمل', active: false})
      })
      .then(res => {
        tid1 = res.tid;
        return sql.test.tag.add({name: 'internet', active: true})
      })
      .then(res => {
        tid2 = res.tid;
        return sql.test.tag.add({name: 'آنلاین', active: false})
      })
      .then(res => {
        tid3 = res.tid;
        done();
      })
      .catch(err => {
        console.log(err);
        done();
      });
  });

  it("Rep should be able to see just list of similar activated tags", function (done) {
    this.done = done;
    rp({
      method: 'post',
      uri: lib.helpers.apiTestURL(`tag/getList`),
      body: {
        name: 'حمل'
      },
      json: true,
      jar: bizRep.jar,
      resolveWithFullResponse: true
    })
      .then(res => {

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(0);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
  it("admin should be able to see all list of a tags weather active or not", function (done) {
    this.done = done;
    rp({
      method: 'post',
      uri: lib.helpers.apiTestURL(`tag/getList`),
      body: {
        name: 'حمل'
      },
      json: true,
      jar: adminObj.jar,
      resolveWithFullResponse: true
    })
      .then(res => {

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("all users should be able to get all related active tags of biz with affinity more than 10", function (done) {
    this.done = done;

    sql.test.tag_connection.add({tid1: tid3, tid2: tid1, affinity: 6})
      .then(res => sql.test.tag_connection.add({tid1: tid3, tid2:tid2, affinity: 15}))
      .then(res =>
        rp({
          method: 'post',
          uri: lib.helpers.apiTestURL(`tag/getConnection`),
          body: {
            name: 'آنلاین'
          },
          json: true,
          jar: bizRep.jar,
          resolveWithFullResponse: true
        }))
      .then(res => {

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('internet');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this))
  });


});