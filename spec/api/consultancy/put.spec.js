const rp = require("request-promise");
const lib = require('../../../lib');
const sql = require('../../../sql');
const moment = require('moment');

describe("PUT Consultancy API", () => {
  let bizData, personData, orgData, personConsultancy, orgConsultancy, bizMan, orgMan, adminData;

  beforeEach(done => {
    personConsultancy = {is_mentor: true};
    orgConsultancy = {is_mentor: false};

    lib.dbHelpers.create()
      .then(() => {
        return lib.dbHelpers.addAndLoginPerson('bizMan');
      })
      .then(res => {
        bizMan = res;
        return lib.dbHelpers.addBusinessWithRep(bizMan.pid);
      })
      .then(res=>{
        bizData = res;
        return lib.dbHelpers.addAndLoginPerson('orgMan')
      })
      .then(res => {
        orgMan = res;
        return lib.dbHelpers.addOrganizationWithRep(orgMan.pid);
      })
      .then(res=> {
        orgData = res;
        return lib.dbHelpers.addAndLoginPerson('invMan');
      })
      .then(res => {
        personData = res;
        return lib.dbHelpers.addAndLoginPerson('admin');
      })
      .then(res => {
        adminData = res;
        return lib.dbHelpers.addAdmin(adminData.pid);
      })
      .then(()=>{
        done();
      })
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it("should add unconfirmed personal consultancy from business", function (done) {
    this.done = done;

    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`personalConsultancy/${bizData.bid}/${personData.pid}`),
      body: personConsultancy,
      json: true,
      resolveWithFullResponse: true,
      jar: bizMan.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBe(1);
        return sql.test.consultancy.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].is_confirmed).toBe(false);
          expect(res[0].confirmed_by).toBe(null);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(true);
          expect(res[0].claimed_by).toBe(bizMan.pid);
          expect(res[0].is_mentor).toBe(personConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should confirm personal consultancy from business", function (done) {
    this.done = done;
    let id;
    sql.test.association.add({pid: personData.pid, bid: bizData.bid})
      .then(res => {
        personConsultancy.assoc_id = res.aid;
        personConsultancy.claimed_by = personData.pid;
        return sql.test.consultancy.add(personConsultancy)
      })
      .then(res => {
        id = res.id;
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`consultancy/${id}`),
          resolveWithFullResponse: true,
          jar: orgMan.rpJar,
        })
          .then(() => this.fail('permitted unauthorised user to confirm consultancy'))
          .catch(err => {
            if(err.statusCode !== 403) {
              this.fail(lib.helpers.parseServerError(err));
            } else {
              expect(err.message).toContain('You are not the person who can confirm this');
            }
          })
      })
      .then(()=>{
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`consultancy/${id}`),
          resolveWithFullResponse: true,
          jar: personData.rpJar,
        })
          .then(() => this.fail('permitted unauthorised user to confirm consultancy'))
          .catch(err => {
            if(err.statusCode !== 403) {
              this.fail(lib.helpers.parseServerError(err));
            } else {
              expect(err.message).toContain('You are not the person who can confirm this');
            }
          })
      })
      .then(() =>
        rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`consultancy/${id}`),
          resolveWithFullResponse: true,
          jar: bizMan.rpJar,
        })
      )
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(+data).toBe(1);
        return sql.test.consultancy.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(null);
          expect(res[0].is_confirmed).toBe(true);
          expect(res[0].confirmed_by).toBe(bizMan.pid);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(personData.pid);
          expect(res[0].is_mentor).toBe(personConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should add unconfirmed personal consultancy from person", function (done) {
    this.done = done;

    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`personalConsultancy/${bizData.bid}/${personData.pid}`),
      body: personConsultancy,
      json: true,
      resolveWithFullResponse: true,
      jar: personData.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBe(1);
        return sql.test.consultancy.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(null);
          expect(res[0].is_confirmed).toBe(false);
          expect(res[0].confirmed_by).toBe(null);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(personData.pid);
          expect(res[0].is_mentor).toBe(personConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should confirm personal consultancy from person", function (done) {
    this.done = done;
    let id;
    sql.test.association.add({pid: personData.pid, bid: bizData.bid})
      .then(res => {
        personConsultancy.assoc_id = res.aid;
        personConsultancy.claimed_by = bizMan.pid;
        personConsultancy.is_claimed_by_biz = true;
        return sql.test.consultancy.add(personConsultancy)
      })
      .then(res => {
        id = res.id;
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`consultancy/${id}`),
          resolveWithFullResponse: true,
          jar: orgMan.rpJar,
        })
          .then(() => this.fail('permitted unauthorised user to confirm consultancy'))
          .catch(err => {
            if(err.statusCode !== 403) {
              this.fail(lib.helpers.parseServerError(err));
            } else {
              expect(err.message).toContain('You are not the person who can confirm this');
            }
          })
      })
      .then(()=>{
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`consultancy/${id}`),
          resolveWithFullResponse: true,
          jar: bizMan.rpJar,
        })
          .then(() => this.fail('permitted unauthorised user to confirm consultancy'))
          .catch(err => {
            if(err.statusCode !== 403) {
              this.fail(lib.helpers.parseServerError(err));
            } else {
              expect(err.message).toContain('You are not the person who can confirm this');
            }
          })
      })
      .then(() =>
        rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`consultancy/${id}`),
          resolveWithFullResponse: true,
          jar: personData.rpJar,
        })
      )
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(+data).toBe(1);
        return sql.test.consultancy.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(null);
          expect(res[0].is_confirmed).toBe(true);
          expect(res[0].confirmed_by).toBe(personData.pid);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(true);
          expect(res[0].claimed_by).toBe(bizMan.pid);
          expect(res[0].is_mentor).toBe(personConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should add unconfirmed organizational consultancy from business", function (done) {
    this.done = done;

    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`orgConsultancy/${bizData.bid}/${orgData.oid}`),
      body: orgConsultancy,
      json: true,
      resolveWithFullResponse: true,
      jar: bizMan.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBe(1);
        return sql.test.consultancy.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(orgData.oid);
          expect(res[0].pid).toBe(null);
          expect(res[0].amount);
          if(res[0].amount) {
            expect(+res[0].amount.substring(1).replace(',', '')).toBe(orgConsultancy.amount);
          }
          expect(res[0].is_confirmed).toBe(false);
          expect(res[0].confirmed_by).toBe(null);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(true);
          expect(res[0].claimed_by).toBe(bizMan.pid);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should confirm organizational consultancy from business", function (done) {
    this.done = done;
    let id;
    sql.test.association.add({oid: orgData.oid, bid: bizData.bid})
      .then(res => {
        orgConsultancy.assoc_id = res.aid;
        orgConsultancy.claimed_by = orgMan.pid;
        return sql.test.consultancy.add(orgConsultancy)
      })
      .then(res => {
        id = res.id;
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`consultancy/${id}`),
          resolveWithFullResponse: true,
          jar: orgMan.rpJar,
        })
          .then(() => this.fail('permitted unauthorised org claimant to confirm consultancy'))
          .catch(err => {
            if(err.statusCode !== 403) {
              this.fail(lib.helpers.parseServerError(err));
            } else {
              expect(err.message).toContain('You are not the person who can confirm this');
            }
          })
      })
      .then(()=>{
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`consultancy/${id}`),
          resolveWithFullResponse: true,
          jar: personData.rpJar,
        })
          .then(() => this.fail('permitted unauthorised person to confirm consultancy'))
          .catch(err => {
            if(err.statusCode !== 403) {
              this.fail(lib.helpers.parseServerError(err));
            } else {
              expect(err.message).toContain('You are not the person who can confirm this');
            }
          })
      })
      .then(() =>
        rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`consultancy/${id}`),
          resolveWithFullResponse: true,
          jar: bizMan.rpJar,
        })
      )
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(+data).toBe(1);
        return sql.test.consultancy.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(orgData.oid);
          expect(res[0].pid).toBe(null);
          expect(res[0].is_confirmed).toBe(true);
          expect(res[0].confirmed_by).toBe(bizMan.pid);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(orgMan.pid);
          expect(res[0].is_mentor).toBe(orgConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should add unconfirmed organizational consultancy from organization", function (done) {
    this.done = done;

    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`orgConsultancy/${bizData.bid}/${orgData.oid}`),
      body: orgConsultancy,
      json: true,
      resolveWithFullResponse: true,
      jar: orgMan.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBe(1);
        return sql.test.consultancy.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(orgData.oid);
          expect(res[0].pid).toBe(null);
          expect(res[0].is_confirmed).toBe(false);
          expect(res[0].confirmed_by).toBe(null);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(orgMan.pid);
          expect(res[0].is_mentor).toBe(orgConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should confirm organizational consultancy from organization", function (done) {
    this.done = done;
    let id;
    sql.test.association.add({oid: orgData.oid, bid: bizData.bid})
      .then(res => {
        orgConsultancy.assoc_id = res.aid;
        orgConsultancy.claimed_by = bizMan.pid;
        orgConsultancy.is_claimed_by_biz = true;
        return sql.test.consultancy.add(orgConsultancy)
      })
      .then(res => {
        id = res.id;
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`consultancy/${id}`),
          resolveWithFullResponse: true,
          jar: bizMan.rpJar,
        })
          .then(() => this.fail('permitted unauthorised org claimant to confirm consultancy'))
          .catch(err => {
            if(err.statusCode !== 403) {
              this.fail(lib.helpers.parseServerError(err));
            } else {
              expect(err.message).toContain('You are not the person who can confirm this');
            }
          })
      })
      .then(()=>{
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`consultancy/${id}`),
          resolveWithFullResponse: true,
          jar: personData.rpJar,
        })
          .then(() => this.fail('permitted unauthorised person to confirm consultancy'))
          .catch(err => {
            if(err.statusCode !== 403) {
              this.fail(lib.helpers.parseServerError(err));
            } else {
              expect(err.message).toContain('You are not the person who can confirm this');
            }
          })
      })
      .then(() =>
        rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`consultancy/${id}`),
          resolveWithFullResponse: true,
          jar: orgMan.rpJar,
        })
      )
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(+data).toBe(1);
        return sql.test.consultancy.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(orgData.oid);
          expect(res[0].pid).toBe(null);
          expect(res[0].is_confirmed).toBe(true);
          expect(res[0].confirmed_by).toBe(orgMan.pid);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(true);
          expect(res[0].claimed_by).toBe(bizMan.pid);
          expect(res[0].is_mentor).toBe(orgConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should add confirmed personal consultancy from admin", function (done) {
    this.done = done;

    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`personalConsultancy/${bizData.bid}/${personData.pid}`),
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
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(null);
          expect(res[0].is_confirmed).toBe(true);
          expect(res[0].confirmed_by).toBe(adminData.pid);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(adminData.pid);
          expect(res[0].is_mentor).toBe(personConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should add confirmed organizational consultancy from admin", function (done) {
    this.done = done;

    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`orgConsultancy/${bizData.bid}/${orgData.oid}`),
      body: orgConsultancy,
      json: true,
      resolveWithFullResponse: true,
      jar: adminData.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBe(1);
        return sql.test.consultancy.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(orgData.oid);
          expect(res[0].pid).toBe(null);
          expect(res[0].is_confirmed).toBe(true);
          expect(res[0].confirmed_by).toBe(adminData.pid);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(adminData.pid);
          expect(res[0].is_mentor).toBe(orgConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});