const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

describe("Delete user API", () => {
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

  it("user should can delete his/her expertise ", function (done) {
    this.done = done;

    let eid1, eid2;

    addExpertise({
      name_en: 'Computer Science - Artificial Intelligence',
      name_fa: 'علوم کامپیوتر - هوش مصنوعی',
      is_education: true,
    })
      .then(res => {
        eid1 = res.expertise_id;
        return addPersonExpertise({
          pid: normalUserObj.pid,
          expertise_id: eid1
        })
      })
      .then(() =>
        addExpertise({
          name_en: 'Software architect',
          name_fa: 'معماری نرم افزار',
          is_education: false,
        }))
      .then(res => {
        eid2 = res.expertise_id;
        return addPersonExpertise({
          pid: normalUserObj.pid,
          expertise_id: eid2
        })
      })
      .then(() => {

        rp({
          method: 'delete',
          body: {
            pid: normalUserObj.pid,
            expertise_id: eid2
          },
          json: true,
          uri: lib.helpers.apiTestURL('expertise'),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true
        })
          .then(res => {
            return sql.test.person.getPersonExpertise({pid: normalUserObj.pid});
          }).then(res => {
          expect(res.length).toBe(1);
          done();
        })
          .catch(lib.helpers.errorHandler.bind(this));
      });
  });

  it("admin should can delete user expertise ", function (done) {
    this.done = done;

    let eid1, eid2;

    addExpertise({
      name_en: 'Computer Science - Artificial Intelligence',
      name_fa: 'علوم کامپیوتر - هوش مصنوعی',
      is_education: true,
    })
      .then(res => {
        eid1 = res.expertise_id;
        addPersonExpertise({
          pid: normalUserObj.pid,
          expertise_id: eid1
        })
      })
      .then(() =>
        addExpertise({
          name_en: 'Software architect',
          name_fa: 'معماری نرم افزار',
          is_education: false,
        }))
      .then(res => {
        eid2 = res.expertise_id;
        addPersonExpertise({
          pid: normalUserObj.pid,
          expertise_id: eid2
        })
      })
      .then(() => {

        rp({
          method: 'delete',
          body: {
            pid: normalUserObj.pid,
            expertise_id: eid2
          },
          json: true,
          uri: lib.helpers.apiTestURL('expertise'),
          jar: adminObj.jar,
          resolveWithFullResponse: true
        })
          .then(res => {
            return sql.test.person.getPersonExpertise({pid: normalUserObj.pid});
          }).then(res => {
          expect(res.length).toBe(1);
          done();
        })
          .catch(lib.helpers.errorHandler.bind(this));
      });
  });

  it("expect error when other users (not admin) are deleting user expertise", function (done) {
    this.done = done;

    let eid1, eid2;

    addExpertise({
      name_en: 'Computer Science - Artificial Intelligence',
      name_fa: 'علوم کامپیوتر - هوش مصنوعی',
      is_education: true,
    })
      .then(res => {
        eid1 = res.expertise_id;
        addPersonExpertise({
          pid: normalUserObj.pid,
          expertise_id: eid1
        })
      })
      .then(() =>
        addExpertise({
          name_en: 'Software architect',
          name_fa: 'معماری نرم افزار',
          is_education: false,
        }))
      .then(res => {
        eid2 = res.expertise_id;
        addPersonExpertise({
          pid: normalUserObj.pid,
          expertise_id: eid2
        })
      })
      .then(() => {

        rp({
          method: 'delete',
          body: {
            pid: normalUserObj.pid,
            expertise_id: eid2
          },
          json: true,
          uri: lib.helpers.apiTestURL('expertise'),
          jar: repObj.jar,
          resolveWithFullResponse: true
        })
          .then(res => {
            this.fail('did not failed when other users wants to delete user expertise');
            done();
          })
          .catch(err => {
            expect(err.statusCode).toBe(error.notAllowed.status);
            expect(err.error).toContain(error.notAllowed.message);
            done();
          });
      });
  });

  it("user should unfollow specific person", function (done) {
    this.done = done;
    sql.test.subscription.add({
      subscriber_id: normalUserObj.pid,
      pid: repObj
    })
      .then(() =>
        rp({
          method: 'delete',
          uri: lib.helpers.apiTestURL('follow/person/' + repObj.pid),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true
        })
      )
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.subscription.getPersonSubscribers({pid: repObj.pid});
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});