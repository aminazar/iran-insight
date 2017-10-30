const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

describe("Put partnership API", () => {
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

  it("Admin should add new partnership between two users", function (done) {
    this.done = done;

    rp({
      method: 'put',
      uri: lib.helpers.apiTestURL(`person/partnership`),
      body: {
        pid1: user1Obj.pid,
        pid2: user2Obj.pid,
        start_date: new Date(2017, 8, 9)
      },
      json: true,
      jar: adminObj.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);

        return sql.test.partnership.getById({pid: user1Obj.pid});
      }).then(res => {
      expect(res.length).toBe(1);
      expect(res[0].is_confirmed).toBe(true);
      done();
    })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("Admin should update partnership between two users and changes pid's and is_confirmed", function (done) {
    this.done = done;

    let newPid;
    let newPartnershipId;
    addPartnership({
      pid1: user1Obj.pid,
      pid2: user2Obj.pid,
      start_date: new Date(2017, 8, 9),
      description: 'friendship',
      description_fa: 'دوستی'
    }).then(res => {
      newPartnershipId = res.id;
      return lib.dbHelpers.addAndLoginPerson('per3@mail.com', 'per123');
    })
      .then(res => {

        newPid = res.pid;
        rp({
          method: 'put',
          uri: lib.helpers.apiTestURL(`person/partnership`),
          body: {
            id: newPartnershipId,
            pid1: user1Obj.pid,
            pid2: newPid,
            start_date: new Date(2017, 8, 9),
            is_confirmed: true
          },
          json: true,
          jar: adminObj.jar,
          resolveWithFullResponse: true
        })
          .then(res => {
            expect(res.statusCode).toBe(200);

            return sql.test.partnership.getById({pid: user1Obj.pid});
          }).then(res => {

          expect(res.length).toBe(1);
          expect(res[0].pid2).toBe(newPid);
          expect(res[0].is_confirmed).toBe(true);
          done();
        })
          .catch(lib.helpers.errorHandler.bind(this));
      });
  });
  it("user should update partnership of him/her self ", function (done) {
    this.done = done;

    addPartnership({
      pid1: user1Obj.pid,
      pid2: user2Obj.pid,
      start_date: new Date(2017, 8, 9),
    })
      .then(res => {

        rp({
          method: 'put',
          uri: lib.helpers.apiTestURL(`person/partnership`),
          body: {
            id: res.id,
            pid1: user1Obj.pid,
            pid2: user2Obj.pid,
            start_date: new Date(2017, 10, 12),
            description: 'friendship',
            description_fa: 'دوستی'
          },
          json: true,
          jar: user1Obj.jar,
          resolveWithFullResponse: true
        })
          .then(res => {
            expect(res.statusCode).toBe(200);

            return sql.test.partnership.getById({pid: user1Obj.pid});
          }).then(res => {

          expect(res.length).toBe(1);
          expect(res[0].pid2).toBe(user2Obj.pid);
          expect(res[0].is_confirmed).toBe(false);
          expect(res[0].description).toBe('friendship');
          expect(res[0].description_fa).toBe('دوستی');
          done();
        })
          .catch(lib.helpers.errorHandler.bind(this));
      });
  });
  it("user should cannot update partnership pid1, pid2 and is_confirmed ", function (done) {
    this.done = done;

    let newPartnershipId;
    addPartnership({
      pid1: user1Obj.pid,
      pid2: user2Obj.pid,
      start_date: new Date(2017, 8, 9),
    }).then(res => {
      newPartnershipId = res.id;
      return lib.dbHelpers.addAndLoginPerson('per3@mail.com', 'per123');
    })
      .then(res => {


        rp({
          method: 'put',
          uri: lib.helpers.apiTestURL(`person/partnership`),
          body: {
            id: newPartnershipId,
            pid1: user1Obj.pid,
            pid2: res.pid,
            is_confirmed: true
          },
          json: true,
          jar: user1Obj.jar,
          resolveWithFullResponse: true
        })
          .then(res => {
            expect(res.statusCode).toBe(200);

            return sql.test.partnership.getById({pid: user1Obj.pid});
          }).then(res => {

          expect(res.length).toBe(1);
          expect(res[0].pid2).toBe(user2Obj.pid);
          expect(res[0].is_confirmed).toBe(false);
          done();
        })
          .catch(lib.helpers.errorHandler.bind(this));
      });
  });


});
