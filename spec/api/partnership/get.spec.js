const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

describe("Get partnership API", () => {
  let adminObj = {
    pid: null,
    jar: null
  };
  let user1Obj = {
    pid: null,
    jar: null,
  };
  let user2Obj = {
    pid: null,
    jar: null,
  };

  let addPartnership = (newPartnership) => {
    return sql.test.partnership.add(newPartnership)
  };


  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('admin', 'admin123'))
      .then(res => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;

        return lib.dbHelpers.addAdmin(res.pid);
      })
      .then(() => {
        return lib.dbHelpers.addAndLoginPerson('per1@mail.com', 'per123');
      })
      .then(res => {
        user1Obj.pid = res.pid;
        user1Obj.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('eabasir@mail.com', 'eab123')
      })
      .then(res => {
        user2Obj.pid = res.pid;
        user2Obj.jar = res.rpJar;
        done();
      })
      .catch(err => {
        console.error('before each => ', err);
        done();
      })
  });

  it("Admin should get list of partnership of user1", function (done) {
    this.done = done;

    addPartnership({
      pid1: user1Obj.pid,
      pid2: user2Obj.pid,
      start_date: new Date(2017, 8, 9)
    })
      .then(() => {
        rp({
          method: 'get',
          uri: lib.helpers.apiTestURL(`person/partnership/${user1Obj.pid}/0/100`),
          jar: adminObj.jar,
          resolveWithFullResponse: true
        })
          .then(res => {

            let result = JSON.parse(res.body);
            expect(res.statusCode).toBe(200);
            expect(result.length).toBe(1);
            done();
          })
          .catch(lib.helpers.errorHandler.bind(this));
      });
  });


});