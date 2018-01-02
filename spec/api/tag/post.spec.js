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