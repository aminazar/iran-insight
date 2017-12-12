const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const types = require('../../../sql/types');

describe("Get Membership", () => {
  let adminObj = {
    pid: null,
    jar: null,
  };
  let user1 = {
    pid: null,
    jar: null,
  };
  let user2 = {
    pid: null,
    jar: null,
  };
  let assoc_id1;
  let assoc_id2;
  let bid;
  let position_type_id1;
  let position_type_id2;

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
      user1.pid = res.pid;
      user1.jar = res.rpJar;
      return lib.dbHelpers.addAndLoginPerson('mohammad');

    }).then(res => {
      user2.pid = res.pid;
      user2.jar = res.rpJar;
      return sql.test.business.add({
        name: 'snapp',
        name_fa: 'اسنپ'

      });

    }).then(res => {
      bid = res.bid;
      return sql.test.association.add({
        pid: user1.pid,
        bid
      });
    }).then(res => {
      assoc_id1 = res.aid;
      return sql.test.association.add({
        pid: user2.pid,
        bid
      });

    }).then(res => {

      assoc_id2 = res.aid;
      return sql.test.position_type.add({
        name: 'technical manager',
        name_fa: 'مدیر فنی',
        suggested_by: adminObj.pid,
        active: true
      });

    }).then(res => {

      position_type_id1 = res.id;
      return sql.test.position_type.add({
        name: 'scrume master',
        name_fa: 'اسکرام مستر',
        suggested_by: adminObj.pid,
        active: false
      });

    }).then(res => {
      position_type_id2 = res.id;

      return sql.test.membership.add({
        assoc_id: assoc_id1,
        is_active: false,
        is_representative: true,
        position_id: position_type_id1
      })

    }).then(res => {
      return sql.test.membership.add({
        assoc_id: assoc_id2,
        is_active: true,
        is_representative: false,
        position_id: position_type_id2
      })

    }).then(res => {
      done();
    }).catch(err => {
      console.log(err);
      done();
    });
  });
  it("Admin should be able to get all members of a business", function (done) {
    this.done = done;

    rp({
      method: 'get',
      uri: lib.helpers.apiTestURL(`joiners/biz/${bid}`),
      jar: adminObj.jar,
      resolveWithFullResponse: true
    }).then(res => {
      expect(res.statusCode).toBe(200);
      console.log('-> ',res.body);
      let result = JSON.parse(res.body);
      expect(result.length).toBe(2);
      expect(result[0].is_active).toBe(false);
      expect(result[0].is_representative).toBe(true);
      expect(result[1].is_active).toBe(true);
      expect(result[1].is_representative).toBe(false);
      done();
    })
      .catch(lib.helpers.errorHandler.bind(this));
  });
  it("expect error when other users (not admin) are calling get members api", function (done) {
    rp({
      method: 'get',
      uri: lib.helpers.apiTestURL(`joiners/biz/${bid}`),
      jar: user1.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        this.fail('did not failed when other users wants to call get members api');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.adminOnly.status);
        expect(err.error).toContain(error.adminOnly.message);
        done();
      });
  });


});
