const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const env = require('../../../env');

describe("Get user API", () => {
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

  let addExpertise = (newExpertise) => {
    return sql.test.expertise.add(newExpertise)
  };

  let addPersonExpertise = (newPersonExpertise) => {
    return sql.test.person_expertise.add(newPersonExpertise)
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
        return lib.dbHelpers.addAndLoginPerson('rep@mail.com', 'rep123');
      })
      .then(res => {
        repObj.pid = res.pid;
        repObj.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('ali@mail.com', 'ali123')
      })
      .then(res => {
        normalUserObj.pid = res.pid;
        normalUserObj.jar = res.rpJar;
        return lib.dbHelpers.addOrganizationWithRep(repObj.pid, 'MTN');
      })
      .then(res => {
        done();
      })
      .catch(err => {
        console.error('before each => ', err);
        done();
      })
  });

  it(" all users should can get a user expertise", function (done) {
    this.done = done;

    addExpertise({
      name_en: 'Computer Science - Artificial Intelligence',
      name_fa: 'علوم کامپیوتر - هوش مصنوعی',
      is_education: true,
    })
      .then(res => {
        addPersonExpertise({
          pid: normalUserObj.pid,
          expertise_id: res.expertise_id
        })
      })
      .then(() =>
        addExpertise({
          name_en: 'Software architect',
          name_fa: 'معماری نرم افزار',
          is_education: false,
        }))
      .then(res => {
        addPersonExpertise({
          pid: normalUserObj.pid,
          expertise_id: res.expertise_id
        })
      })
      .then(() => {


        rp({
          method: 'get',
          uri: lib.helpers.apiTestURL(`user/${normalUserObj.pid}/expertise`),
          jar: repObj.jar,
          resolveWithFullResponse: true
        })
          .then(res => {
            let result = JSON.parse(res.body);
            expect(res.statusCode).toBe(200);
            expect(result.length).toBe(2);
            done();
          })
          .catch(lib.helpers.errorHandler.bind(this));
      });
  });

  it("user should be able to un-subscribe from receiving email", function (done) {
    this.done = done;

    sql.test.person.get({pid: normalUserObj.pid}).then(res => {

      let hashCode = res[0].secret.substring(0, 5);
      rp({
        method: 'get',
        uri: lib.helpers.apiTestURL(`user/unsubscribe/${normalUserObj.pid}/${hashCode}`),
        jar: repObj.jar,
        resolveWithFullResponse: true
      })
        .then(res => {
          expect(res.statusCode).toBe(200);
          return sql.test.person.select({pid: normalUserObj});
        }).then(res => {

        expect(res[0].notify_period === 'n');
        done();
      }).catch(lib.helpers.errorHandler.bind(this));
    });


  });

  it("Expect error when wrong hash code exist in un-subscribe from receiving email api", function (done) {
    this.done = done;

    sql.test.person.get({pid: normalUserObj.pid}).then(res => {

      rp({
        method: 'get',
        uri: lib.helpers.apiTestURL(`user/unsubscribe/${normalUserObj.pid}/123`), // 123 is not correct hash code
        jar: repObj.jar,
        resolveWithFullResponse: true
      })
        .then(res => {
          fail('did not fail when incorrect hash code exists in un-subscribe api');
          done();
        })
        .catch(err => {
          expect(err.statusCode).toBe(error.notAllowed.status);
          expect(err.error).toContain(error.notAllowed.message);
          done();
        });
    });


  });

});