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
  let org, biz, prod1, prod2;

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
        normalUser.jar = res.jar;
        return lib.dbHelpers.addAndLoginPerson('orgRep')
      })
      .then(res => {
        orgRep.pid = res.pid;
        orgRep.jar = res.jar;
        return lib.dbHelpers.addAndLoginPerson('bizRep')
      })
      .then(res => {
        bizRep.pid = res.pid;
        bizRep.jar = res.jar;
        return lib.dbHelpers.addOrganizationWithRep(orgRep.pid, 'MTN');

      })
      .then(res => {
        org = res;
        return lib.dbHelpers.addBusinessWithRep(bizRep.pid, 'snapp');

      })
      .then(res => {
        org = res;
        return lib.dbHelpers.addBusinessWithRep(bizRep.pid, 'snapp');

      })
      .then(res => {
        biz = res;
        return sql.test.product.add({name: 'android app'})

      })
      .then(res => {
        return sql.test.business_product.add({bid: biz.bid, product_id: res.id})
      })
      .then(res => {
        return sql.test.business_product.add({bid: biz.bid, product_id: res.id})
      })

      .catch(err => {
        console.log(err);
        done();
      });
  });

  it("Admin should be able to  confirm a tag", function (done) {
    this.done = done;
    let tagId;
    sql.test.tag.add({name: 'اینترنت', proposer: '{"biz":[1,2,3],"org":[1,2,3],"product":[1,2,3]}'})
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
      expect(res[0].proposer).toBe(null);
      done();
    })
      .catch(lib.helpers.errorHandler.bind(this));
  });


});