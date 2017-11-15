const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

describe("Post partnership API", () => {
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
        return lib.dbHelpers.addAndLoginPerson('eabasir@gmail.com', 'eab123')
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

  it("user should confirm his/her partnership request", function (done) {
    this.done = done;
    addPartnership({
      pid1: user1Obj.pid,
      pid2: user2Obj.pid,
      start_date: new Date(2017, 8, 9),
      description: 'friendship',
      description_fa: 'دوستی'
    }).then(res => {

      rp({
        method: 'post',
        uri: lib.helpers.apiTestURL(`person/confirm/partnership`),
        body: {
          id: res.id,
          pid2: user2Obj.pid,
          is_confirmed: true
        },
        json: true,
        jar: user2Obj.jar,
        resolveWithFullResponse: true
      })
        .then(res => {

          expect(res.statusCode).toBe(200);
          return sql.test.partnership.getFromById({pid: user2Obj.pid});
        }).then(res => {
        expect(res.length).toBe(1);
        expect(res[0].is_confirmed).toBe(true);
        done();
      })
        .catch(lib.helpers.errorHandler.bind(this));
    });

  });
  it("user should reject his/her partnership request", function (done) {
    this.done = done;
    addPartnership({
      pid1: user1Obj.pid,
      pid2: user2Obj.pid,
      start_date: new Date(2017, 8, 9),
      description: 'friendship',
      description_fa: 'دوستی'
    }).then(res => {

      rp({
        method: 'post',
        uri: lib.helpers.apiTestURL(`person/confirm/partnership`),
        body: {
          id: res.id,
          pid2: user2Obj.pid,
          is_confirmed: false
        },
        json: true,
        jar: user2Obj.jar,
        resolveWithFullResponse: true
      })
        .then(res => {

          expect(res.statusCode).toBe(200);
          return sql.test.partnership.getFromById({pid: user2Obj.pid});
        }).then(res => {
        expect(res.length).toBe(0);
        done();
      })
        .catch(lib.helpers.errorHandler.bind(this));
    });

  });

  it("admin should confirm user partnership request", function (done) {
    this.done = done;
    addPartnership({
      pid1: user1Obj.pid,
      pid2: user2Obj.pid,
      start_date: new Date(2017, 8, 9),
      description: 'friendship',
      description_fa: 'دوستی'
    }).then(res => {

      rp({
        method: 'post',
        uri: lib.helpers.apiTestURL(`person/confirm/partnership`),
        body: {
          id: res.id,
          pid2: user2Obj.pid,
          is_confirmed: true
        },
        json: true,
        jar: adminObj.jar,
        resolveWithFullResponse: true
      })
        .then(res => {

          expect(res.statusCode).toBe(200);
          return sql.test.partnership.getFromById({pid: user2Obj.pid});
        }).then(res => {
        expect(res.length).toBe(1);
        expect(res[0].is_confirmed).toBe(true);
        done();
      })
        .catch(lib.helpers.errorHandler.bind(this));
    });

  });

  it("admin should reject user partnership request", function (done) {
    this.done = done;
    addPartnership({
      pid1: user1Obj.pid,
      pid2: user2Obj.pid,
      start_date: new Date(2017, 8, 9),
      description: 'friendship',
      description_fa: 'دوستی'
    }).then(res => {

      rp({
        method: 'post',
        uri: lib.helpers.apiTestURL(`person/confirm/partnership`),
        body: {
          id: res.id,
          pid2: user2Obj.pid,
          is_confirmed: false
        },
        json: true,
        jar: user2Obj.jar,
        resolveWithFullResponse: true
      })
        .then(res => {

          expect(res.statusCode).toBe(200);
          return sql.test.partnership.getFromById({pid: user2Obj.pid});
        }).then(res => {
        expect(res.length).toBe(0);
        done();
      })
        .catch(lib.helpers.errorHandler.bind(this));
    });

  });


});
