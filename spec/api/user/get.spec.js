const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

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

  it("user should can get his/her expertise", function (done) {
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
          jar: normalUserObj.jar,
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
  it("other users should not can get user expertise => expect error", function (done) {
    this.done = done;

    addExpertise({
      name_en: 'Computer Science - Artificial Intelligence',
      name_fa: 'علوم کامپیوتر - هوش مصنوعی',
      is_education: true,
    }).then(() => {
      rp({
        method: 'get',
        uri: lib.helpers.apiTestURL(`user/${normalUserObj.pid}/expertise`),
        jar: repObj.jar,
        resolveWithFullResponse: true
      })
        .then(res => {
          this.fail('did not failed when other users wants to get user expertise');
          done();
        })
        .catch(err => {
          expect(err.statusCode).toBe(error.notAllowed.status);
          expect(err.error).toContain(error.notAllowed.message);
          done();
        });

    });


  });
  it("admin should can get user expertise", function (done) {
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
      }).then(() => {
      rp({
        method: 'get',
        uri: lib.helpers.apiTestURL(`user/${normalUserObj.pid}/expertise`),
        jar: adminObj.jar,
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


});