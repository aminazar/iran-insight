const rp = require("request-promise");
const lib = require('../../../lib');
const sql = require('../../../sql');
const moment = require('moment');

describe("POST Consultancy API", () => {
  let bizData, personData, orgData, personConsultancy, orgConsultancy, bizMan, orgMan;

  beforeEach(done => {
    personConsultancy = {
      is_mentor: false,
      is_confirmed: true,
      confirmed_by: 1
    };
    orgConsultancy = {is_mentor: true, is_confirmed: true, confirmed_by: 1};

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
        return lib.dbHelpers.addAndLoginPerson('invMan', 'x', {firstname_en: 'ali', surname_en: 'alavi'});
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

  it("should update personal consultancy from business", function (done) {
    this.done = done;
    personConsultancy.is_mentor = true;

    rp({
      method: 'POST',
      uri: lib.helpers.apiTestURL(`personalConsultancy/${personConsultancy.id}/${bizData.bid}/${personData.pid}`),
      body: orgConsultancy,
      json: true,
      resolveWithFullResponse: true,
      jar: orgMan.rpJar,
    })
      .then(() => this.fail('Permitted unauthorised person to modify consultancy'))
      .catch(err => {
        if (err.statusCode !== 403) {
          this.fail(lib.helpers.parseServerError(err));
        } else {
          expect(err.message).toContain('Representative of neither side of investment/consultancy');
        }
      })
      .then(() =>
        rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL(`personalConsultancy/${personConsultancy.id}/${bizData.bid}/${personData.pid}`),
          body: personConsultancy,
          json: true,
          resolveWithFullResponse: true,
          jar: bizMan.rpJar,
        }))
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBeTruthy();
        return sql.test.consultancy.getWithAssoc({id: data});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if (res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(null);
          expect(res[0].is_confirmed).toBe(false);
          expect(moment().diff(res[0].saved_at, 'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(true);
          expect(res[0].claimed_by).toBe(bizMan.pid);
          expect(res[0].is_mentor).toBe(personConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should update personal consultancy from person", function (done) {
    this.done = done;
    personConsultancy.is_mentor = true;

    rp({
      method: 'POST',
      uri: lib.helpers.apiTestURL(`personalConsultancy/${personConsultancy.id}/${bizData.bid}/${personData.pid}`),
      body: personConsultancy,
      json: true,
      resolveWithFullResponse: true,
      jar: personData.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBeTruthy();
        return sql.test.consultancy.getWithAssoc({id: data});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if (res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(null);
          expect(res[0].is_confirmed).toBe(false);
          expect(moment().diff(res[0].saved_at, 'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(personData.pid);
          expect(res[0].is_mentor).toBe(personConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should update organizational consultancy from business", function (done) {
    this.done = done;
    orgConsultancy.is_mentor = false;

    rp({
      method: 'POST',
      uri: lib.helpers.apiTestURL(`orgConsultancy/${orgConsultancy.id}/${bizData.bid}/${orgData.oid}`),
      body: orgConsultancy,
      json: true,
      resolveWithFullResponse: true,
      jar: bizMan.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBeTruthy();
        return sql.test.consultancy.getWithAssoc({id: data});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if (res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(orgData.oid);
          expect(res[0].pid).toBe(null);
          expect(res[0].is_confirmed).toBe(false);
          expect(moment().diff(res[0].saved_at, 'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(true);
          expect(res[0].claimed_by).toBe(bizMan.pid);
          expect(res[0].is_mentor).toBe(orgConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should update organizational consultancy from organization", function (done) {
    this.done = done;
    orgConsultancy.is_mentor = false;
    rp({
      method: 'POST',
      uri: lib.helpers.apiTestURL(`orgConsultancy/${orgConsultancy.id}/${bizData.bid}/${orgData.oid}`),
      body: orgConsultancy,
      json: true,
      resolveWithFullResponse: true,
      jar: personData.rpJar,
    })
      .then(() => this.fail('Permitted unauthorised person to modify consultancy'))
      .catch(err => {
        if (err.statusCode !== 403) {
          this.fail(lib.helpers.parseServerError(err));
        } else {
          expect(err.message).toContain('Representative of neither side of investment/consultancy');
        }
      })
      .then(() =>
        rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL(`orgConsultancy/${orgConsultancy.id}/${bizData.bid}/${orgData.oid}`),
          body: orgConsultancy,
          json: true,
          resolveWithFullResponse: true,
          jar: orgMan.rpJar,
        }))
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBeTruthy();
        return sql.test.consultancy.getWithAssoc({id: data});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if (res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(orgData.oid);
          expect(res[0].is_confirmed).toBe(false);
          expect(moment().diff(res[0].saved_at, 'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(orgMan.pid);
          expect(res[0].is_mentor).toBe(orgConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should update personal consultancy from admin", function (done) {
    this.done = done;
    personConsultancy.is_mentor = true;

    rp({
      method: 'POST',
      uri: lib.helpers.apiTestURL(`personalConsultancy/${personConsultancy.id}/${bizData.bid}/${personData.pid}`),
      body: personConsultancy,
      json: true,
      resolveWithFullResponse: true,
      jar: adminData.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBeTruthy();
        return sql.test.consultancy.getWithAssoc({id: data});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if (res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(null);
          expect(res[0].is_confirmed).toBe(true);
          expect(moment().diff(res[0].saved_at, 'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(adminData.pid);
          expect(res[0].is_mentor).toBe(personConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should update organizational consultancy from admin", function (done) {
    this.done = done;
    orgConsultancy.is_mentor = false;

    rp({
      method: 'POST',
      uri: lib.helpers.apiTestURL(`orgConsultancy/${orgConsultancy.id}/${bizData.bid}/${orgData.oid}`),
      body: orgConsultancy,
      json: true,
      resolveWithFullResponse: true,
      jar: adminData.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBeTruthy();
        return sql.test.consultancy.getWithAssoc({id: data});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if (res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(orgData.oid);
          expect(res[0].pid).toBe(null);
          expect(res[0].is_confirmed).toBe(true);
          expect(moment().diff(res[0].saved_at, 'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(adminData.pid);
          expect(res[0].is_mentor).toBe(orgConsultancy.is_mentor)
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});