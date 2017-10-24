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
      .then(() => lib.dbHelpers.addAndLoginPerson('admin@mail.com', 'admin123'))
      .then(res => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;
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
        done();
      })
      .catch(err => {
        console.error(err);
        done();
      })
  });

  it("should get error when no pid set in data object", function (done) {
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
        expect(err.statusCode).toBe(500);
        expect(err.error).toBe('No person id found');
        done();
      });
  });

  it("user should complete her/his profile", function(done) {
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
        birth_date: new Date(1993,10,10),
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

  it("ignore username and is_user property to change", function(done) {
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

  // it("admin should add a user", function(done) {
  //
  // });

  // it("representative should add a user", function(done) {
  //
  // });

    // it("representative should not be able to modify a user", function (done) {
    //
    // });

  // it("not related representative should not access to modify/add user profile", function (done) {
  //
  // });
});