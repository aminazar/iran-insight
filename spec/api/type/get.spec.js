const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const types = require('../../../sql/types');

describe("Get Type", () => {
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
  it("Admin should be able to get all type categories", function (done) {
    this.done = done;

      rp({
        method: 'get',
        uri: lib.helpers.apiTestURL(`type/getCats`),
        jar: adminObj.jar,
        resolveWithFullResponse: true
      }).then(res => {
      expect(res.statusCode).toBe(200);

      let result = JSON.parse(res.body);
      expect(result.length).toBe(5);
      done();
    })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("admin should be able to get detail of a type", function (done) {
    this.done = done;

    sql.test[types[0]].add({
      name: 'snapp',
      name_fa: 'اسنپ',
      suggested_by: adminObj.pid,
      active: true
    }).then(res => {
      return rp({
        method: 'get',
        uri: lib.helpers.apiTestURL(`type/${types[0]}/${res.id}`),
        jar: adminObj.jar,
        resolveWithFullResponse: true
      })
        .then(res => {
          expect(res.statusCode).toBe(200);
          let result = JSON.parse(res.body);
          expect(result[0].name).toBe('snapp');
          expect(result[0].name_fa).toBe('اسنپ');
          expect(result[0].active).toBe(true);
          expect(result[0].username).toBe('admin');
          done();
        })
        .catch(lib.helpers.errorHandler.bind(this));
    });
  });

});
