const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

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

  it("should get error when no pid defined in data object", function (done) {
    rp({
      method: 'post',
      form: {
        firstname_en: 'ali',
      },
      uri: lib.helpers.apiTestURL('user/profile/ali@mail.com'),
      jar: normalUserObj.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        this.fail('Update person profile without pid in data object');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(404);
        expect(err.error).toBe('No person id found');
        done();
      });
  });

  it("user should complete her/his profile", function (done) {
    this.done = done;
    rp({
      method: 'post',
      form: {
        pid: normalUserObj.pid,
        firstname_en: 'Ali',
        surname_en: 'Alavi',
        firstname_fa: 'علی',
        surname_fa: 'علوی',
        address_en: 'Shariati St',
        address_fa: 'خیابان شریعتی',
        phone_no: '123',
        mobile_no: '+1-123',
        birth_date: new Date(1993, 10, 10),
        display_name_en: 'A^2',
        display_name_fa: 'علی آقا'
      },
      uri: lib.helpers.apiTestURL('user/profile/ali@mail.com'),
      jar: normalUserObj.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.person.get({username: 'ali@mail.com'});
      })
      .then(res => {
        expect(res[0].firstname_en).toBe('Ali');
        expect(res[0].image).toBe(null);
        expect(res[0].address_en).toBe('Shariati St');
        expect(res[0].display_name_fa).toBe('علی آقا');
        expect(res[0].mobile_no).toBe('+1-123');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("ignore username and is_user property to change", function (done) {
    this.done = done;
    rp({
      method: 'post',
      form: {
        pid: normalUserObj.pid,
        firstname_en: 'Ali',
        surname_en: 'Alavi',
        firstname_fa: 'علی',
        phone_no: '123',
        mobile_no: '+1-123',
        is_user: false,
        username: 'asghar@mail.com'
      },
      uri: lib.helpers.apiTestURL('user/profile/ali@mail.com'),
      jar: normalUserObj.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.person.get({username: 'asghar@mail.com'});
      })
      .then(res => {
        expect(res.length).toBe(0);
        return sql.test.person.get({username: 'ali@mail.com'});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].is_user).toBe(true);
        expect(res[0].username).toBe('ali@mail.com');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("admin should add a user", function (done) {
    this.done = done;
    rp({
      method: 'post',
      form: {
        username: 'john@mail.com',
        firstname_en: 'John',
        phone_no: '987',
        mobile_no: '+2-987',
        is_user: true,
      },
      uri: lib.helpers.apiTestURL('user/profile/new'),
      jar: adminObj.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.person.get({username: 'john@mail.com'});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].firstname_en).toBe('John');
        expect(res[0].is_user).toBe(false);
        expect(res[0].username).toBe('john@mail.com');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("representative should add a user (just username and display_name accept)", function (done) {
    this.done = done;
    rp({
      method: 'post',
      form: {
        username: 'asghar@mail.com',
        firstname_en: 'Asghar',
        display_name_fa: 'اصغر آقا',
        phone_no: '0912',
        is_user: true,
      },
      uri: lib.helpers.apiTestURL('user/profile/new'),
      jar: repObj.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.person.get({username: 'asghar@mail.com'});
      })
      .then(res => {
        expect(res[0].display_name_en).toBe(null);
        expect(res[0].display_name_fa).toBe('اصغر آقا');
        expect(res[0].is_user).toBe(false);
        expect(res[0].phone_no).toBe(null);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("representative should not be able to modify a user", function (done) {
    this.done = done;
    rp({
      method: 'post',
      form: {
        pid: normalUserObj.pid,
        username: 'ali@mail.com',
        firstname_en: 'علی',
        display_name_fa: 'علی آقا',
        phone_no: '09129998800',
        is_user: true,
      },
      uri: lib.helpers.apiTestURL('user/profile/ali@mail.com'),
      jar: repObj.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        this.fail('Representative can modify user profile');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(403);
        expect(err.error).toBe('Cannot modify user general profile');
        done();
      });
  });

  it("should get error when no pid is defined in body for expertise", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        expertise: {
          name_en: 'Web Programming',
          name_fa: 'برنامه نویسی وب',
          is_education: false,
        }
      },
      json: true,
      uri: lib.helpers.apiTestURL('user/expertise'),
      jar: normalUserObj.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        this.fail('did not failed when no pid is defined in expertise');
        done();
      })
      .catch(err => {
        console.log('-> ', err);
        expect(err.statusCode).toBe(error.noId.status);
        expect(err.message).toContain(error.noId.message);
        done();
      });
  });

  it("should get error when admin or user himself is not changing the expertise", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        expertise: {
          name_en: 'Web Programming',
          name_fa: 'برنامه نویسی وب',
          is_education: false,
        },
        pid: normalUserObj.pid,
      },
      json: true,
      uri: lib.helpers.apiTestURL('user/expertise'),
      jar: repObj.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        this.fail('did not failed expertise is changing by other users');
        done();
      })
      .catch(err => {
        console.log('-> ', err);
        expect(err.statusCode).toBe(error.notAllowed.status);
        expect(err.message).toContain(error.notAllowed.message);
        done();
      });
  });


  it("user should add expertise (expertise is not exist)", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        pid: normalUserObj.pid,
        expertise: {
          name_en: 'Web Programming',
          name_fa: 'برنامه نویسی وب',
          is_education: false,
        }
      },
      json: true,
      uri: lib.helpers.apiTestURL('user/expertise'),
      jar: normalUserObj.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.person.getPersonExpertise({pid: normalUserObj.pid});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].name_en).toBe('Web Programming');
        expect(res[0].is_education).toBe(false);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("user should add expertise (expertise is exist)", function (done) {
    this.done = done;
    let expertiseId = null;
    sql.test.expertise.add({
      name_en: 'Computer Science - Artificial Intelligence',
      name_fa: 'علوم کامپیوتر - هوش مصنوعی',
      is_education: true,
    })
      .then(res => {
        expertiseId = res.expertise_id;
        return rp({
          method: 'post',
          body: {
            expertise: {
              expertise_id: expertiseId,
              name_en: 'Web Programming',
              name_fa: 'برنامه نویسی وب',
              is_education: false,
            },
            pid: normalUserObj.pid,
          },
          json: true,
          uri: lib.helpers.apiTestURL('user/expertise'),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true
        });
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.person.getPersonExpertise({pid: normalUserObj.pid});
      })
      .then(res => {
        expect(res.length).toBe(1);
        console.log('-> ', res[0]);
        expect(res[0].name_en).toBe('Web Programming');
        expect(res[0].name_fa).toBe('برنامه نویسی وب');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("user should be able to update expertise", function (done) {
    this.done = done;
    let expertiseId = null;
    sql.test.expertise.add({
      name_en: 'Computer Science - Artificial Intelligence',
      name_fa: 'علوم کامپیوتر - هوش مصنوعی',
      is_education: true,
    })
      .then(res => {
        expertiseId = res.expertise_id;
        return sql.test.person_expertise.add({
          pid: normalUserObj.pid,
          expertise_id: expertiseId,
        });
      })
      .then(res => {
        return rp({
          method: 'post',
          body: {
            expertise: {
              expertise_id: expertiseId,
              is_education: false,
            },
            peid: res.peid,
            pid: normalUserObj.pid,
          },
          json: true,
          uri: lib.helpers.apiTestURL('user/expertise'),
          jar: normalUserObj.jar,
          resolveWithFullResponse: true
        });
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.person.getPersonExpertise({pid: normalUserObj.pid});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].is_education).toBe(false);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });


  it("admin should add expertise for specific user (expertise is exist)", function (done) {
    this.done = done;
    let expertiseId = null;
    sql.test.expertise.add({
      name_en: 'Computer Science - Artificial Intelligence',
      name_fa: 'علوم کامپیوتر - هوش مصنوعی',
      is_education: true,
    })
      .then(res => {
        expertiseId = res.expertise_id;
        return rp({
          method: 'post',
          body: {
            expertise: {
              expertise_id: expertiseId,
            },
            pid: normalUserObj.pid,
          },
          json: true,
          uri: lib.helpers.apiTestURL('user/expertise'),
          jar: adminObj.jar,
          resolveWithFullResponse: true
        });
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.person.getPersonExpertise({pid: normalUserObj.pid});
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].name_en).toBe('Computer Science - Artificial Intelligence');
        expect(res[0].name_fa).toBe('علوم کامپیوتر - هوش مصنوعی');
        expect(res[0].is_education).toBe(true);
        expect(res[0].expertise_id).toBe(expertiseId);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });


});