const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe("PUT user API", () => {
  let adminObj = {
    pid: null,
    jar: null
  };
  let repObj = {
    pid: null,
    jar: null,
  };
  let normalUserObj = {
    pid: null,
    jar: null,
  };

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('admin', 'admin123', {}))
      .then(res => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;
        lib.dbHelpers.addAndLoginPerson('rep', 'rep123', {});
      })
      .then(res => {
        repObj.pid = res.pid;
        repObj.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('ali', 'ali123', {})
      })
      .then(res => {
        normalUserObj.pid = res.pid;
        normalUserObj.jar = res.rpJar;
        done();
      })
      .catch(err => {
        console.error(err);
        done();
      })
  });

  xit("representative should add organization profile", function(done) {
    this.done = done;
    rp({
      method: 'put',
      form: {
        name: '',
        phone_no: '',
        your_position: '',
      },
      uri: lib.helpers.apiTestURL(`organization/profile`),
      jar: repObj.jar
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  //
  // it("admin should can access to add organization", done => {
  //
  // });
  //
  // it("admin should can access to add user", done => {
  //
  // });
});