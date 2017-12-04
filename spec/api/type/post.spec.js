const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const types = require('../../../sql/types');

describe("Post Type", () => {
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
  it("Admin should suggest an activated type", function (done) {
    this.done = done;
    rp({
      method: 'post',
      uri: lib.helpers.apiTestURL(`type/${types[0]}`),
      body: {
        name: 'snapp',
        name_fa: 'اسنپ',
        active: true
      },
      json: true,
      jar: adminObj.jar,
      resolveWithFullResponse: true
    }).then(res => {

      expect(res.statusCode).toBe(200);

      return sql.test[types[0]].get({id: res.body.id});
    }).then(res => {
      expect(res.length).toBe(1);
      expect(res[0].name).toBe('snapp');
      expect(res[0].name_fa).toBe('اسنپ');
      expect(res[0].suggested_by).toBe(adminObj.pid);
      expect(res[0].active).toBe(true);
      done();
    })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("user should be able to suggest deactivated type", function (done) {
    this.done = done;
    rp({
      method: 'post',
      uri: lib.helpers.apiTestURL(`type/${types[0]}`),
      body: {
        name: 'snapp',
        name_fa: 'اسنپ',
        active: false
      },
      json: true,
      jar: normalUser.jar,
      resolveWithFullResponse: true
    }).then(res => {

      expect(res.statusCode).toBe(200);
      return sql.test[types[0]].get({id: res.body.id});
    }).then(res => {
      expect(res.length).toBe(1);
      expect(res[0].suggested_by).toBe(normalUser.pid);
      expect(res[0].active).toBe(false);
      done();
    })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("user should be able to suggest type with just one name (of both lang)", function (done) {
    this.done = done;
    rp({
      method: 'post',
      uri: lib.helpers.apiTestURL(`type/${types[0]}`),
      body: {
        name: 'snapp',
      },
      json: true,
      jar: normalUser.jar,
      resolveWithFullResponse: true
    }).then(res => {
      expect(res.statusCode).toBe(200);
      return sql.test[types[0]].get({id: res.body.id});
    }).then(res => {
      expect(res.length).toBe(1);
      expect(res[0].name).toBe('snapp');
      expect(res[0].name_fa).toBe(null);
      done();
    })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("user should not be able to suggest pre added type", function (done) {
    this.done = done;

    sql.test[types[0]].add({
      name: 'snapp',
      name_fa: 'اسنپ',
      suggested_by: adminObj.pid,
      active: true
    }).then(res => {
      return rp({
        method: 'post',
        uri: lib.helpers.apiTestURL(`type/${types[0]}`),
        body: {
          name: 'snapp',
          name_fa: 'اسنپ',
        },
        json: true,
        jar: normalUser.jar,
        resolveWithFullResponse: true
      })
        .then(res => {
          expect(res.statusCode).toBe(200);
          return sql.test[types[0]].select();
        }).then(res => {
          expect(res.length).toBe(1);
          expect(res[0].suggested_by).toBe(adminObj.pid);
          expect(res[0].active).toBe(true);
          done();
        })
        .catch(lib.helpers.errorHandler.bind(this));
    });
  });

  it("Expect error when user is inserting illegal type", function (done) {
    this.done = done;
    rp({
      method: 'post',
      uri: lib.helpers.apiTestURL(`type/randNewType`),
      body: {
        name: 'snapp',
        name_fa: 'اسنپ',
      },
      json: true,
      jar: normalUser.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        this.fail('did not failed when illegal type is inserting');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.illegalTypeName.status);
        expect(err.error).toBe(error.illegalTypeName.message);
        done();
      });

  });

  it("Expect error when both name and name_fa of type are undefined", function (done) {
    this.done = done;
    rp({
      method: 'post',
      uri: lib.helpers.apiTestURL(`type/${types[0]}`),
      body: {
      },
      json: true,
      jar: normalUser.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        this.fail('did not failed when both name and name_fa are undefined');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.emptyTypeName.status);
        expect(err.error).toBe(error.emptyTypeName.message);
        done();
      });

  });

});