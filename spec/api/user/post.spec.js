const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const env = require('../../../env');

describe("POST user API", () => {
  let orgObj = {};

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

  let addBusiness = (bizIsActive = true, ceo_id = null, name, name_fa, name_type, name_fa_type) => {
    return new Promise((resolve, reject) => {
      sql.test.business_type.add({
        name: name_type ? name_type : 'Transport',
        name_fa: name_fa_type ? name_fa_type : 'حمل و نقل',
        suggested_by: adminObj.pid,
        active: bizIsActive,
      })
        .then(res => {
          return sql.test.business.add({
            name: name ? name : 'Snapp',
            name_fa: name_fa ? name_fa : 'اسنپ',
            ceo_pid: ceo_id,
            biz_type_id: res.id,
            address: null,
            address_fa: null,
            tel: null,
            url: null,
            general_stats: null,
            financial_stats: null,
          });
        })
        .then(res => {
          resolve(res);
        })
        .catch(err => reject(err));
    });
  };

  let addOrganization = (organIsActive = true, ceo_id = null) => {
    return new Promise((resolve, reject) => {
      sql.test.organization_type.add({
        name: 'governmental',
        name_fa: 'دولتی',
        suggested_by: adminObj.pid,
        active: organIsActive,
      })
        .then(res => {
          return sql.test.organization.add({
            name: 'Planning and Budget',
            name_fa: 'برنامه ریزی و بودجه',
            ceo_pid: ceo_id,
            org_type_id: res.id
          })
        })
        .then(res => resolve(res))
        .catch(err => reject(err));
    })
  };

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => {
        return lib.dbHelpers.addAndLoginPerson('alireza@bentoak.systems', 'admin123');
      })
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
        orgObj = res;
        done();
      })
      .catch(err => {
        console.error('before each => ', err);
        done();
      })
  });

  // it("should get error when no pid defined in data object", function (done) {
  //   rp({
  //     method: 'post',
  //     form: {
  //       firstname_en: 'ali',
  //     },
  //     uri: lib.helpers.apiTestURL('user/profile'),
  //     jar: normalUserObj.jar,
  //     resolveWithFullResponse: true
  //   })
  //     .then(res => {
  //       this.fail('Update person profile without pid in data object');
  //       done();
  //     })
  //     .catch(err => {
  //       expect(err.statusCode).toBe(404);
  //       expect(err.error).toBe('No person id found');
  //       done();
  //     });
  // });
  //
  // it("user should complete her/his profile", function (done) {
  //   this.done = done;
  //   rp({
  //     method: 'post',
  //     form: {
  //       pid: normalUserObj.pid,
  //       firstname_en: 'Ali',
  //       surname_en: 'Alavi',
  //       firstname_fa: 'علی',
  //       surname_fa: 'علوی',
  //       address_en: 'Shariati St',
  //       address_fa: 'خیابان شریعتی',
  //       phone_no: '123',
  //       mobile_no: '+1-123',
  //       birth_date: new Date(1993, 10, 10),
  //       display_name_en: 'A^2',
  //       display_name_fa: 'علی آقا',
  //     },
  //     uri: lib.helpers.apiTestURL('user/profile'),
  //     jar: normalUserObj.jar,
  //     resolveWithFullResponse: true
  //   })
  //     .then(res => {
  //       expect(res.statusCode).toBe(200);
  //       return sql.test.person.get({username: 'ali@mail.com'});
  //     })
  //     .then(res => {
  //       expect(res[0].firstname_en).toBe('Ali');
  //       expect(res[0].image).toBe(null);
  //       expect(res[0].address_en).toBe('Shariati St');
  //       expect(res[0].display_name_fa).toBe('علی آقا');
  //       expect(res[0].mobile_no).toBe('+1-123');
  //       done();
  //     })
  //     .catch(lib.helpers.errorHandler.bind(this));
  // });
  //
  // it("ignore username and is_user property to change", function (done) {
  //   this.done = done;
  //   rp({
  //     method: 'post',
  //     form: {
  //       pid: normalUserObj.pid,
  //       firstname_en: 'Ali',
  //       surname_en: 'Alavi',
  //       firstname_fa: 'علی',
  //       phone_no: '123',
  //       mobile_no: '+1-123',
  //       is_user: false,
  //       username: 'asghar@mail.com',
  //     },
  //     uri: lib.helpers.apiTestURL('user/profile'),
  //     jar: normalUserObj.jar,
  //     resolveWithFullResponse: true
  //   })
  //     .then(res => {
  //       expect(res.statusCode).toBe(200);
  //       return sql.test.person.get({username: 'asghar@mail.com'});
  //     })
  //     .then(res => {
  //       expect(res.length).toBe(0);
  //       return sql.test.person.get({username: 'ali@mail.com'});
  //     })
  //     .then(res => {
  //       expect(res.length).toBe(1);
  //       expect(res[0].is_user).toBe(true);
  //       expect(res[0].username).toBe('ali@mail.com');
  //       done();
  //     })
  //     .catch(lib.helpers.errorHandler.bind(this));
  // });
  //
  // it("admin should add a user", function (done) {
  //   this.done = done;
  //   rp({
  //     method: 'post',
  //     form: {
  //       username: 'john@mail.com',
  //       firstname_en: 'John',
  //       phone_no: '987',
  //       mobile_no: '+2-987',
  //       is_user: true,
  //     },
  //     uri: lib.helpers.apiTestURL('user/profile'),
  //     jar: adminObj.jar,
  //     resolveWithFullResponse: true
  //   })
  //     .then(res => {
  //       expect(res.statusCode).toBe(200);
  //       return sql.test.person.get({username: 'john@mail.com'});
  //     })
  //     .then(res => {
  //       expect(res.length).toBe(1);
  //       expect(res[0].firstname_en).toBe('John');
  //       expect(res[0].is_user).toBe(false);
  //       expect(res[0].username).toBe('john@mail.com');
  //       done();
  //     })
  //     .catch(lib.helpers.errorHandler.bind(this));
  // });
  //
  // it("representative should add a user (just username and display_name accept)", function (done) {
  //   this.done = done;
  //   let pid = null;
  //   rp({
  //     method: 'post',
  //     form: {
  //       username: 'asghar@mail.com',
  //       firstname_en: 'Asghar',
  //       display_name_fa: 'اصغر آقا',
  //       phone_no: '0912',
  //       is_user: true,
  //       oid: orgObj.oid,
  //     },
  //     uri: lib.helpers.apiTestURL('user/profile'),
  //     jar: repObj.jar,
  //     resolveWithFullResponse: true
  //   })
  //     .then(res => {
  //       expect(res.statusCode).toBe(200);
  //       pid = JSON.parse(res.body);
  //       return sql.test.person.get({username: 'asghar@mail.com'});
  //     })
  //     .then(res => {
  //       expect(res[0].display_name_en).toBe(null);
  //       expect(res[0].display_name_fa).toBe('اصغر آقا');
  //       expect(res[0].is_user).toBe(false);
  //       expect(res[0].phone_no).toBe(null);
  //       return env.testDb.query('select * from person join association on person.pid = association.pid join membership on association.aid = membership.assoc_id where person.pid = ' + pid);
  //     })
  //     .then(res => {
  //       expect(res.length).toBe(1);
  //       done();
  //     })
  //     .catch(lib.helpers.errorHandler.bind(this));
  // });
  //
  // it("representative cannot add a user when no business_id and organization_id passed (pass 'no pid defined' error)", function (done) {
  //   rp({
  //     method: 'post',
  //     form: {
  //       username: 'asghar@mail.com',
  //       firstname_en: 'Asghar',
  //       display_name_fa: 'اصغر آقا',
  //       phone_no: '0912',
  //       is_user: true,
  //     },
  //     uri: lib.helpers.apiTestURL('user/profile'),
  //     jar: repObj.jar,
  //     resolveWithFullResponse: true
  //   })
  //     .then(res => {
  //       this.fail('rep add user without passing bid or oid into data object');
  //       done();
  //     })
  //     .catch(err => {
  //       expect(err.statusCode).toBe(error.noId.status);
  //       expect(err.error).toBe(error.noId.message);
  //       done();
  //     });
  // });
  //
  // it("representative of another business cannot add user to another business/organization (pass 'no pid defined' error)", function (done) {
  //   let anotherRep;
  //   lib.dbHelpers.addAndLoginPerson('rep2')
  //     .then(res => {
  //       anotherRep = res;
  //       return lib.dbHelpers.addBusinessWithRep(anotherRep.pid);
  //     })
  //     .then(res => {
  //       return rp({
  //         method: 'post',
  //         form: {
  //           username: 'asghar@mail.com',
  //           firstname_en: 'Asghar',
  //           display_name_fa: 'اصغر آقا',
  //           phone_no: '0912',
  //           is_user: true,
  //           oid: orgObj.oid,
  //         },
  //         uri: lib.helpers.apiTestURL('user/profile'),
  //         jar: anotherRep.rpJar,
  //         resolveWithFullResponse: true
  //       });
  //     })
  //     .then(res => {
  //       this.fail('Rep of another biz can add user for biz');
  //       done();
  //     })
  //     .catch(err => {
  //       expect(err.statusCode).toBe(error.noId.status);
  //       expect(err.error).toBe(error.noId.message);
  //       done();
  //     });
  // });
  //
  // it("representative should not be able to modify a user", function (done) {
  //   this.done = done;
  //   rp({
  //     method: 'post',
  //     form: {
  //       pid: normalUserObj.pid,
  //       username: 'ali@mail.com',
  //       firstname_en: 'علی',
  //       display_name_fa: 'علی آقا',
  //       phone_no: '09129998800',
  //       is_user: true,
  //       oid: orgObj.oid,
  //     },
  //     uri: lib.helpers.apiTestURL('user/profile'),
  //     jar: repObj.jar,
  //     resolveWithFullResponse: true
  //   })
  //     .then(res => {
  //       this.fail('Representative can modify user profile');
  //       done();
  //     })
  //     .catch(err => {
  //       expect(err.statusCode).toBe(403);
  //       expect(err.error).toBe('Cannot modify user general profile');
  //       done();
  //     });
  // });
  //
  // it("should get error when no pid is defined in body for expertise", function (done) {
  //   this.done = done;
  //   rp({
  //     method: 'post',
  //     body: {
  //       expertise: {
  //         name_en: 'Web Programming',
  //         name_fa: 'برنامه نویسی وب',
  //         is_education: false,
  //       }
  //     },
  //     json: true,
  //     uri: lib.helpers.apiTestURL('user/expertise'),
  //     jar: normalUserObj.jar,
  //     resolveWithFullResponse: true
  //   })
  //     .then(res => {
  //       this.fail('did not failed when no pid is defined in expertise');
  //       done();
  //     })
  //     .catch(err => {
  //       expect(err.statusCode).toBe(error.noId.status);
  //       expect(err.message).toContain(error.noId.message);
  //       done();
  //     });
  // });
  //
  // it("should get error when admin or user himself is not changing the expertise", function (done) {
  //   this.done = done;
  //   rp({
  //     method: 'post',
  //     body: {
  //       expertise: {
  //         name_en: 'Web Programming',
  //         name_fa: 'برنامه نویسی وب',
  //         is_education: false,
  //       },
  //       pid: normalUserObj.pid,
  //     },
  //     json: true,
  //     uri: lib.helpers.apiTestURL('user/expertise'),
  //     jar: repObj.jar,
  //     resolveWithFullResponse: true
  //   })
  //     .then(res => {
  //       this.fail('did not failed expertise is changing by other users');
  //       done();
  //     })
  //     .catch(err => {
  //       expect(err.statusCode).toBe(error.notAllowed.status);
  //       expect(err.message).toContain(error.notAllowed.message);
  //       done();
  //     });
  // });
  //
  // it("user should add expertise (expertise is not exist)", function (done) {
  //   this.done = done;
  //   rp({
  //     method: 'post',
  //     body: {
  //       pid: normalUserObj.pid,
  //       expertise: {
  //         name_en: 'Web Programming',
  //         name_fa: 'برنامه نویسی وب',
  //         is_education: false,
  //       }
  //     },
  //     json: true,
  //     uri: lib.helpers.apiTestURL('user/expertise'),
  //     jar: normalUserObj.jar,
  //     resolveWithFullResponse: true
  //   })
  //     .then(res => {
  //       expect(res.statusCode).toBe(200);
  //       return sql.test.person.getPersonExpertise({pid: normalUserObj.pid});
  //     })
  //     .then(res => {
  //       expect(res.length).toBe(1);
  //       expect(res[0].name_en).toBe('Web Programming');
  //       expect(res[0].is_education).toBe(false);
  //       done();
  //     })
  //     .catch(lib.helpers.errorHandler.bind(this));
  // });
  //
  // it("user should add expertise (expertise is exist)", function (done) {
  //   this.done = done;
  //   let expertiseId = null;
  //   sql.test.expertise.add({
  //     name_en: 'Computer Science - Artificial Intelligence',
  //     name_fa: 'علوم کامپیوتر - هوش مصنوعی',
  //     is_education: true,
  //   })
  //     .then(res => {
  //       expertiseId = res.expertise_id;
  //       return rp({
  //         method: 'post',
  //         body: {
  //           expertise: {
  //             expertise_id: expertiseId,
  //             name_en: 'Web Programming',
  //             name_fa: 'برنامه نویسی وب',
  //             is_education: false,
  //           },
  //           pid: normalUserObj.pid,
  //         },
  //         json: true,
  //         uri: lib.helpers.apiTestURL('user/expertise'),
  //         jar: normalUserObj.jar,
  //         resolveWithFullResponse: true
  //       });
  //     })
  //     .then(res => {
  //       expect(res.statusCode).toBe(200);
  //       return sql.test.person.getPersonExpertise({pid: normalUserObj.pid});
  //     })
  //     .then(res => {
  //       expect(res.length).toBe(1);
  //       expect(res[0].name_en).toBe('Web Programming');
  //       expect(res[0].name_fa).toBe('برنامه نویسی وب');
  //       done();
  //     })
  //     .catch(lib.helpers.errorHandler.bind(this));
  // });
  //
  // it("user should be able to update expertise", function (done) {
  //   this.done = done;
  //   let expertiseId = null;
  //   sql.test.expertise.add({
  //     name_en: 'Computer Science - Artificial Intelligence',
  //     name_fa: 'علوم کامپیوتر - هوش مصنوعی',
  //     is_education: true,
  //   })
  //     .then(res => {
  //       expertiseId = res.expertise_id;
  //       return sql.test.person_expertise.add({
  //         pid: normalUserObj.pid,
  //         expertise_id: expertiseId,
  //       });
  //     })
  //     .then(res => {
  //       return rp({
  //         method: 'post',
  //         body: {
  //           expertise: {
  //             expertise_id: expertiseId,
  //             is_education: false,
  //           },
  //           peid: res.peid,
  //           pid: normalUserObj.pid,
  //         },
  //         json: true,
  //         uri: lib.helpers.apiTestURL('user/expertise'),
  //         jar: normalUserObj.jar,
  //         resolveWithFullResponse: true
  //       });
  //     })
  //     .then(res => {
  //       expect(res.statusCode).toBe(200);
  //       return sql.test.person.getPersonExpertise({pid: normalUserObj.pid});
  //     })
  //     .then(res => {
  //       expect(res.length).toBe(1);
  //       expect(res[0].is_education).toBe(false);
  //       done();
  //     })
  //     .catch(lib.helpers.errorHandler.bind(this));
  // });
  //
  // it("admin should add expertise for specific user (expertise is exist)", function (done) {
  //   this.done = done;
  //   let expertiseId = null;
  //   sql.test.expertise.add({
  //     name_en: 'Computer Science - Artificial Intelligence',
  //     name_fa: 'علوم کامپیوتر - هوش مصنوعی',
  //     is_education: true,
  //   })
  //     .then(res => {
  //       expertiseId = res.expertise_id;
  //       return rp({
  //         method: 'post',
  //         body: {
  //           expertise: {
  //             expertise_id: expertiseId,
  //           },
  //           pid: normalUserObj.pid,
  //         },
  //         json: true,
  //         uri: lib.helpers.apiTestURL('user/expertise'),
  //         jar: adminObj.jar,
  //         resolveWithFullResponse: true
  //       });
  //     })
  //     .then(res => {
  //       expect(res.statusCode).toBe(200);
  //       return sql.test.person.getPersonExpertise({pid: normalUserObj.pid});
  //     })
  //     .then(res => {
  //       expect(res.length).toBe(1);
  //       expect(res[0].name_en).toBe('Computer Science - Artificial Intelligence');
  //       expect(res[0].name_fa).toBe('علوم کامپیوتر - هوش مصنوعی');
  //       expect(res[0].is_education).toBe(true);
  //       expect(res[0].expertise_id).toBe(expertiseId);
  //       done();
  //     })
  //     .catch(lib.helpers.errorHandler.bind(this));
  // });
  //
  // it("user should ask admin to be representative of biz or org", function (done) {
  //   this.done = done;
  //   addBusiness()
  //     .then((res) => {
  //       return rp({
  //         method: 'post',
  //         form: {
  //           bid: res.bid,
  //         },
  //         uri: lib.helpers.apiTestURL('membership/introducing/rep'),
  //         jar: normalUserObj.jar,
  //         resolveWithFullResponse: true,
  //       })
  //     })
  //     .then(res => {
  //       expect(res.statusCode).toBe(200);
  //       return sql.test.membership.get({mid: res.body});
  //     })
  //     .then(res => {
  //       expect(res.length).toBe(1);
  //       expect(res[0].is_representative).toBe(true);
  //       expect(res[0].is_active).toBe(false);
  //       expect(res[0].position_id).toBe(null);
  //       done();
  //     })
  //     .catch(lib.helpers.errorHandler.bind(this));
  // }, 6000);
  //
  // it("representative of one biz or org can ask admin to be representative of another biz or org", function (done) {
  //   this.done = done;
  //   let oid = null, po_id = null;
  //   addOrganization()
  //     .then(res => {
  //       oid = res.oid;
  //       return sql.test.position_type.add({
  //         name: 'Manager',
  //         name_fa: 'مدیر عامل',
  //         suggested_by: adminObj.pid,
  //         active: true,
  //       })
  //     })
  //     .then(res => {
  //       po_id = res.id;
  //       return rp({
  //         method: 'post',
  //         form: {
  //           oid: oid,
  //           position_id: po_id,
  //           start_date: new Date(2010, 10, 10)
  //         },
  //         uri: lib.helpers.apiTestURL('membership/introducing/rep'),
  //         jar: repObj.jar,
  //         resolveWithFullResponse: true,
  //       });
  //     })
  //     .then(res => {
  //       expect(res.statusCode).toBe(200);
  //       return sql.test.membership.get({mid: res.body});
  //     })
  //     .then(res => {
  //       expect(res.length).toBe(1);
  //       expect(res[0].is_active).toBe(false);
  //       expect(res[0].is_representative).toBe(true);
  //       expect(res[0].position_id).not.toBe(null);
  //       expect(res[0].position_id).toBe(po_id);
  //       done();
  //     })
  //     .catch(lib.helpers.errorHandler.bind(this));
  // });
  //
  // it("representative of one biz or org cannot ask admin to be representative of same biz or org (no more than one representative for a org/biz)", function (done) {
  //   this.done = done;
  //   rp({
  //     method: 'post',
  //     body: {
  //       oid: orgObj.oid,
  //     },
  //     uri: lib.helpers.apiTestURL('membership/introducing/rep'),
  //     jar: repObj.jar,
  //     json: true,
  //     resolveWithFullResponse: true,
  //   })
  //     .then(res => {
  //       fail('Representative of organization ask to be representative of it again');
  //       done();
  //     })
  //     .catch(err => {
  //       expect(err.statusCode).toBe(500);
  //       expect(err.error).toBe('this organization or business already has representative');
  //       done();
  //     });
  // });
  //
  // it("should get error when no bid and oid defined for asking admin to be representative", function (done) {
  //   this.done = done;
  //   let oid = null, po_id = null;
  //   addOrganization()
  //     .then(res => {
  //       oid = res.oid;
  //       return sql.test.position_type.add({
  //         name: 'Manager',
  //         name_fa: 'مدیر عامل',
  //         suggested_by: adminObj.pid,
  //         active: true,
  //       })
  //     })
  //     .then(res => {
  //       po_id = res.id;
  //       return rp({
  //         method: 'post',
  //         form: {
  //           position_id: po_id
  //         },
  //         uri: lib.helpers.apiTestURL('membership/introducing/rep'),
  //         jar: repObj.jar,
  //         resolveWithFullResponse: true,
  //       });
  //     })
  //     .then(res => {
  //       this.fail('User ask to be representative without bid or oid');
  //       done();
  //     })
  //     .catch(err => {
  //       expect(err.statusCode).toBe(error.noBizOrOrgDeclared.status);
  //       expect(err.error).toBe(error.noBizOrOrgDeclared.message);
  //       done();
  //     });
  // });
  //
  // it("user should be able to change his/her notification period type => d: daily, w: weekly, n: never, i: instantly ", function (done) {
  //   this.done = done;
  //   rp({
  //     method: 'post',
  //     body: {
  //       pid: normalUserObj.pid,
  //       notify_period: 'w'
  //     },
  //     uri: lib.helpers.apiTestURL('user/notify'),
  //     jar: normalUserObj.jar,
  //     json: true,
  //     resolveWithFullResponse: true,
  //   })
  //     .then(res => {
  //       return sql.test.person.get({pid: res.body[0].pid});
  //     })
  //     .then(res => {
  //       expect(res[0].notify_period).toBe('w');
  //       done();
  //     })
  //     .catch(lib.helpers.errorHandler.bind(this));
  // });
  //
  // it("admin should be able to change his/her notification period type => d: daily, w: weekly, n: never, i: instantly ", function (done) {
  //   this.done = done;
  //   rp({
  //     method: 'post',
  //     body: {
  //       pid: normalUserObj.pid,
  //       notify_period: 'w'
  //     },
  //     uri: lib.helpers.apiTestURL('user/notify'),
  //     jar: adminObj.jar,
  //     json: true,
  //     resolveWithFullResponse: true,
  //   })
  //     .then(res => {
  //       return sql.test.person.get({pid: res.body[0].pid});
  //     })
  //     .then(res => {
  //       expect(res[0].notify_period).toBe('w');
  //       done();
  //     })
  //     .catch(lib.helpers.errorHandler.bind(this));
  // });
  //
  // it("Expect error when user change his/her notification period type  with incorrect type", function (done) {
  //   this.done = done;
  //   rp({
  //     method: 'post',
  //     body: {
  //       pid: normalUserObj.pid,
  //       notify_period: 'o'
  //     },
  //     uri: lib.helpers.apiTestURL('user/notify'),
  //     jar: adminObj.jar,
  //     json: true,
  //     resolveWithFullResponse: true,
  //   })
  //     .then(res => {
  //       fail('did not fail when incorrect notify type is specified');
  //       done();
  //     })
  //     .catch(err => {
  //       expect(err.statusCode).toBe(error.incorrectNotifyType.status);
  //       expect(err.error).toContain(error.incorrectNotifyType.message);
  //       done();
  //     });
  // });
  //
  // it("Expect error when other users want to change user notification period type", function (done) {
  //   this.done = done;
  //   rp({
  //     method: 'post',
  //     body: {
  //       pid: normalUserObj.pid,
  //       notify_period: 'w'
  //     },
  //     uri: lib.helpers.apiTestURL('user/notify'),
  //     jar: repObj.jar,
  //     json: true,
  //     resolveWithFullResponse: true,
  //   })
  //     .then(res => {
  //       fail('did not fail when incorrect notify type is specified');
  //       done();
  //     })
  //     .catch(err => {
  //       expect(err.statusCode).toBe(error.notAllowed.status);
  //       expect(err.error).toContain(error.notAllowed.message);
  //       done();
  //     });
  // });

  xit("Any user should be able to change password", function (done) {
    this.done = done;
    sql.test.person_activation_link.add({
      pid: normalUserObj.pid,
      link: 'dsfAS234@$$ASDFGaqsd789asASRe',
    })
      .then(res => {
        return rp({
          method: 'post',
          body: {
            username: 'ali@mail.com',
            password: 'na987ma',
          },
          uri: lib.helpers.apiTestURL('user/auth/change/password/dsfAS234@$$ASDFGaqsd789asASRe'),
          json: true,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("user cannot change password if link and username are not compatible", function (done) {
    this.done = done;
    sql.test.person_activation_link.add({
      pid: normalUserObj.pid,
      link: 'dsfAS234@$$ASDFGaqsd789asASRe',
    })
      .then(res => {
        return rp({
          method: 'post',
          body: {
            username: 'ali@mail.com',
            password: 'na987ma',
          },
          uri: lib.helpers.apiTestURL('user/auth/change/password/dsfAS234@$$ASDFGaqsd789ae'),
          json: true,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        this.fail('User can change password when link not valid');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.expiredLink.status);
        expect(err.error).toBe(error.expiredLink.message);
        done();
      });
  });
});