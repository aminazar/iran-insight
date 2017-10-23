const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe("POST user API", () => {
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
        return lib.dbHelpers.addAndLoginPerson('ali', 'ali123')
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

  // it("user should complete her/his profile", done => {
  //
  // });
  //
  // it("user should has not access to change business profile", done => {
  //
  // });
  //
  // it("user should has not access to change organization profile", done => {
  //
  // });
  //
  // it("representative should update business profile", done => {
  //
  // });
  //
  // it("representative should update organization profile", done => {
  //
  // });
  //
  // it("admin should update business/organiztion/user profile", done => {
  //
  // });
});