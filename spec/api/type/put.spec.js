const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const types = require('../../../sql/types');

describe("Put Type", () => {
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
  it("Admin should be able to activate a suggestion", function (done) {
    this.done = done;

    sql.test[types[0]].add({
      name: 'snapp',
      name_fa: 'اسنپ',
      suggested_by: normalUser.pid,
      active: false
    }).then(res =>
      rp({
        method: 'put',
        uri: lib.helpers.apiTestURL(`type/${types[0]}/${res.id}`),
        jar: adminObj.jar,
        resolveWithFullResponse: true
      })).then(res => {
      expect(res.statusCode).toBe(200);

      let result = JSON.parse(res.body);
      return sql.test[types[0]].get({id: result[0].id});
    }).then(res => {
      expect(res.length).toBe(1);
      expect(res[0].active).toBe(true);
      done();
    })
      .catch(lib.helpers.errorHandler.bind(this));
  });


  it("Expect error when other users are calling api", function (done) {
    this.done = done;
    sql.test[types[0]].add({
      name: 'snapp',
      name_fa: 'اسنپ',
      suggested_by:normalUser.pid,
      active:false
    }).then(res =>
    rp({
      method: 'put',
      uri: lib.helpers.apiTestURL(`type/${types[0]}/${res.id}`),
      body: {
        active: true,
      },
      json: true,
      jar: normalUser.jar,
      resolveWithFullResponse: true
    }))
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