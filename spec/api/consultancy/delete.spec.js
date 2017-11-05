const rp = require("request-promise");
const lib = require('../../../lib');
const sql = require('../../../sql');

describe("DELETE Consultancy API", () => {
  let bizData, personData, orgData, personConsultancy, orgConsultancy, bizMan, orgMan, adminData;

  beforeEach(done => {
    personConsultancy = {
      is_mentor: true,
      is_confirmed: true,
      confirmed_by: 1
    };
    orgConsultancy = {is_mentor: false, is_confirmed: true, confirmed_by: 1};

    lib.dbHelpers.create()
      .then(() => {
        return lib.dbHelpers.addAndLoginPerson('bizMan');
      })
      .then(res => {
        bizMan = res;
        return lib.dbHelpers.addBusinessWithRep(bizMan.pid);
      })
      .then(res => {
        bizData = res;
        return lib.dbHelpers.addAndLoginPerson('orgMan')
      })
      .then(res => {
        orgMan = res;
        return lib.dbHelpers.addOrganizationWithRep(orgMan.pid);
      })
      .then(res => {
        orgData = res;
        return lib.dbHelpers.addAndLoginPerson('consMan', 'x', {firstname_en: 'ali', surname_en: 'alavi'});
      })
      .then(res => {
        personData = res;
        return sql.test.association.add({pid: personData.pid, bid: bizData.bid})
      })
      .then(res => {
        personConsultancy.assoc_id = res.aid;
        personConsultancy.claimed_by = personData.pid;
        return sql.test.consultancy.add(personConsultancy)
      })
      .then(res => {
        personConsultancy.id = res.id;
        return sql.test.association.add({oid: orgData.oid, bid: bizData.bid})
      })
      .then(res => {
        orgConsultancy.assoc_id = res.aid;
        orgConsultancy.claimed_by = orgMan.pid;
        return sql.test.consultancy.add(orgConsultancy)
      })
      .then(res => {
        orgConsultancy.id = res.id;
        return lib.dbHelpers.addAndLoginPerson('admin');
      })
      .then(res => {
        adminData = res;
        return lib.dbHelpers.addAdmin(adminData.pid);
      })
      .then(() => {
        done();
      })
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it("should delete personal consultancy from business", function (done) {
    this.done = done;

    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`consultancy/${personConsultancy.id}`),
      resolveWithFullResponse: true,
      jar: orgMan.rpJar,
    })
      .then(() => this.fail('Permitted unauthorised person to delete consultancy'))
      .catch(err => {
        if (err.statusCode !== 403) {
          this.fail(lib.helpers.parseServerError(err));
        } else {
          expect(err.message).toContain('You cannot access to this functionality');
        }
      })
      .then(() =>
        rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`consultancy/${personConsultancy.id}`),
          resolveWithFullResponse: true,
          jar: bizMan.rpJar,
        }))
      .then(res => {
        expect(res.statusCode).toBe(200);

        return sql.test.consultancy.getWithAssoc({id: personConsultancy.id});
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should delete personal consultancy from person", function (done) {
    this.done = done;

    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`consultancy/${personConsultancy.id}`),
      resolveWithFullResponse: true,
      jar: personData.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);

        return sql.test.consultancy.getWithAssoc({id: personConsultancy.id});
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should delete organizational consultancy from business", function (done) {
    this.done = done;

    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`consultancy/${orgConsultancy.id}`),
      resolveWithFullResponse: true,
      jar: personData.rpJar,
    })
      .then(() => this.fail('Permitted unauthorised person to delete consultancy'))
      .catch(err => {
        if (err.statusCode !== 403) {
          this.fail(lib.helpers.parseServerError(err));
        } else {
          expect(err.message).toContain('You cannot access to this functionality');
        }
      })
      .then(() =>
        rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`consultancy/${orgConsultancy.id}`),
          resolveWithFullResponse: true,
          jar: bizMan.rpJar,
        }))
      .then(res => {
        expect(res.statusCode).toBe(200);

        return sql.test.consultancy.getWithAssoc({id: orgConsultancy.id});
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should delete organizational consultancy from organization", function (done) {
    this.done = done;

    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`consultancy/${orgConsultancy.id}`),
      resolveWithFullResponse: true,
      jar: bizMan.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);

        return sql.test.consultancy.getWithAssoc({id: orgConsultancy.id});
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should delete personal consultancy by admin", function (done) {
    this.done = done;
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`consultancy/${personConsultancy.id}`),
      resolveWithFullResponse: true,
      jar: adminData.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);

        return sql.test.consultancy.getWithAssoc({id: personConsultancy.id});
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should delete organizational consultancy by admin", function (done) {
    this.done = done;

    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`consultancy/${orgConsultancy.id}`),
      resolveWithFullResponse: true,
      jar: adminData.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);

        return sql.test.consultancy.getWithAssoc({id: orgConsultancy.id});
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});