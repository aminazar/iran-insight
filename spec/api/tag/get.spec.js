const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe("Get tag", () => {
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
        return sql.test.tag.add({name: 'اینترنت', proposer: {business: [biz.bid], organization: [], product: []}})
      })
      .then(res => {
        return sql.test.tag.add({name: 'حمل و نقل'})
      })
      .then(() => {
        done();
      })

      .catch(err => {
        console.log(err);
        done();
      });
  });

  it("every user should be able to get activated tags", function (done) {
    this.done = done;
    sql.test.tag.appendTag({tableName: 'business', tag: 'اینترنت', condition: `bid = ${biz.bid}`})
      .then(res => sql.test.tag.appendTag({
        tableName: 'business',
        tag: 'حمل و نقل',
        condition: `bid = ${biz.bid}`
      })
        .then(res =>
          rp({
            method: 'get',
            uri: lib.helpers.apiTestURL(`tag/business/${biz.bid}`),
            jar: normalUser.jar,
            resolveWithFullResponse: true
          })).then(res => {

          expect(res.statusCode).toBe(200);
          let result = JSON.parse(res.body);

          expect(result[0].gettags.length).toBe(1);
          done();
        })
        .catch(lib.helpers.errorHandler.bind(this)))

  });



});