const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

xdescribe("Put bunch of tags by admin", () => {
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
  it("Admin should be able add list of tags", function (done) {
    this.done = done;

    rp({
      method: 'put',
      uri: lib.helpers.apiTestURL(`tag/add_all`),
      body: {
        tags: [{name: 'اینترنت'}, {name: 'خرید و فروش'}, {name: 'نرم افزار'}, {name: 'backend'}, {name: 'UI/UX'}]
      },
      json: true,
      jar: adminObj.jar,
      resolveWithFullResponse: true
    }).then(res => {

      expect(res.statusCode).toBe(200);

      return sql.test.tag.select();
    }).then(res => {
      expect(res.length).toBe(5);
      done();
    })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("duplicate tags must not exist ", function (done) {
    this.done = done;

    rp({
      method: 'put',
      uri: lib.helpers.apiTestURL(`tag/add_all`),
      body: {
        tags: [{name: 'اینترنت'}, {name: 'اینترنت'}, {name: 'حمل و نقل'}]
      },
      json: true,
      jar: adminObj.jar,
      resolveWithFullResponse: true
    }).then(res => {

      expect(res.statusCode).toBe(200);

      return sql.test.tag.select();
    }).then(res => {
      expect(res.length).toBe(2);
      done();
    })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("Expect error when other users are calling api", function (done) {

    rp({
      method: 'put',
      uri: lib.helpers.apiTestURL(`tag/add_all`),
      body: {
        tags: [{name: 'اینترنت'}, {name: 'خرید و فروش'}, {name: 'نرم افزار'}, {name: 'backend'}, {name: 'UI/UX'}]
      },
      json: true,
      jar: normalUser.jar,
      resolveWithFullResponse: true
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


describe("Put tag for biz, org and products", () => {
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
  let org, biz, product_id;

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
        done();
      })
      .catch(err => {
        console.log(err);
        done();
      });
  });

  it("Rep should be able to add non-existing tag for biz", function (done) {
    this.done = done;
    rp({
      method: 'put',
      uri: lib.helpers.apiTestURL(`tag/add`),
      body: {
        bid: biz.bid,
        name: 'اینترنت'
      },
      json: true,
      jar: bizRep.jar,
      resolveWithFullResponse: true
    }).then(res => {

      expect(res.statusCode).toBe(200);

      return sql.test.tag.select();
    }).then(res => {
      expect(res.length).toBe(1);
      expect(res[0].active).toBe(false);
      return sql.test.business.get({bid: biz.bid});
    }).then(res => {

      expect(res[0].tags.length).toBe(1);
      expect(res[0].tags[0]).toBe('اینترنت');
      done();

    })
      .catch(lib.helpers.errorHandler.bind(this));
  });
  it("Rep should be able to add non-existing tag for org", function (done) {
    this.done = done;
    rp({
      method: 'put',
      uri: lib.helpers.apiTestURL(`tag/add`),
      body: {
        oid: org.oid,
        name: 'اینترنت'
      },
      json: true,
      jar: orgRep.jar,
      resolveWithFullResponse: true
    }).then(res => {

      expect(res.statusCode).toBe(200);

      return sql.test.tag.select();
    }).then(res => {
      expect(res.length).toBe(1);
      expect(res[0].active).toBe(false);
      done();
    })
      .catch(lib.helpers.errorHandler.bind(this));
  });
  it("tag must not be active if rep is add new tag even he/her specified active in body of request", function (done) {
    this.done = done;
    rp({
      method: 'put',
      uri: lib.helpers.apiTestURL(`tag/add`),
      body: {
        oid: org.oid,
        name: 'اینترنت',
        active: true
      },
      json: true,
      jar: orgRep.jar,
      resolveWithFullResponse: true
    }).then(res => {

      expect(res.statusCode).toBe(200);

      return sql.test.tag.select();
    }).then(res => {
      expect(res.length).toBe(1);
      expect(res[0].active).toBe(false);
      done();
    })
      .catch(lib.helpers.errorHandler.bind(this));
  });
  it("admin should be able to add active non-existing tag for product", function (done) {
    this.done = done;

    rp({
      method: 'put',
      uri: lib.helpers.apiTestURL(`tag/add`),
      body: {
        product_id: product_id,
        name: 'اینترنت',
        active: true
      },
      json: true,
      jar: adminObj.jar,
      resolveWithFullResponse: true
    }).then(res => {

      expect(res.statusCode).toBe(200);

      return sql.test.tag.select();
    }).then(res => {
      expect(res.length).toBe(1);
      expect(res[0].active).toBe(true);
      done();
    })
      .catch(lib.helpers.errorHandler.bind(this));
  });
  it("admin should be able to add non-existing tag for product and add affinity with other tags ", function (done) {
    this.done = done;

    sql.test.tag.add({name: 'حمل و نقل'})
      .then(res => sql.test.tag.add({name: 'آنلاین'}))
      .then(res => sql.test.tag.add({name: 'شهری'}))
      .then(res => sql.test.tag.add({name: 'عمومی'}))
      .then(res => sql.test.product.update({tags: ['عمومی', 'شهری', 'آنلاین', 'حمل و نقل']}, product_id))
      .then(res => {
        rp({
          method: 'put',
          uri: lib.helpers.apiTestURL(`tag/add`),
          body: {
            product_id: product_id,
            name: 'اینترنت',
          },
          json: true,
          jar: adminObj.jar,
          resolveWithFullResponse: true
        }).then(res => {

          expect(res.statusCode).toBe(200);
          return sql.test.tag_connection.select();
        }).then(res => {
          expect(res.length).toBe(4);
          res.forEach(r => {
            expect(r.affinity).toBe(5);
          });

          done();
        })
          .catch(lib.helpers.errorHandler.bind(this));
      })

  });
  it("admin should be able to add existing tag for product and increase affinity with other tags ", function (done) {
    this.done = done;

    let id1, id2;
    sql.test.tag.add({name: 'حمل و نقل'})
      .then(res => {
        id1 = res.tid;
        return sql.test.tag.add({name: 'آنلاین'});
      })
      .then(res => {
        id2 = res.tid;
        return sql.test.tag.add({name: 'شهری'})
      })
      .then(res => sql.test.product.update({tags: ['شهری', 'حمل و نقل']}, product_id))
      .then(res => sql.test.tag_connection.add({tid1: id1, tid2: id2}))
      .then(res => {
        rp({
          method: 'put',
          uri: lib.helpers.apiTestURL(`tag/add`),
          body: {
            product_id: product_id,
            name: 'آنلاین',
          },
          json: true,
          jar: adminObj.jar,
          resolveWithFullResponse: true
        }).then(res => {

          expect(res.statusCode).toBe(200);
          return sql.test.tag_connection.select();
        }).then(res => {
          expect(res.length).toBe(2);
          res.forEach(r => {
            if (r.tid1 === id1 && r.tid2 === id2)
              expect(r.affinity).toBe(6);
            else
              expect(r.affinity).toBe(5);
          });

          done();
        })
          .catch(lib.helpers.errorHandler.bind(this));
      })

  });


});