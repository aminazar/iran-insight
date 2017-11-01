const rp = require("request-promise");
const lib = require('../../../lib');
const sql = require('../../../sql');
const moment = require('moment');

describe("PUT Investment API", () => {
  let bizData, personData, orgData, personInvestment, orgInvestment, bizMan, orgMan, adminData;

  beforeEach(done => {
    personInvestment = {amount: 1000, currency: 'USD', is_lead: true, investment_cycle: 1};
    orgInvestment = {amount: 10000, currency: 'EUR', investment_cycle: 1};

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

  it("should add unconfirmed personal investment from business", function (done) {
    this.done = done;

    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`personalInvestment/${bizData.bid}/${personData.pid}`),
      body: personInvestment,
      json: true,
      resolveWithFullResponse: true,
      jar: bizMan.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBe(1);
        return sql.test.investment.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(null);
          expect(res[0].amount);
          if(res[0].amount) {
            expect(+res[0].amount.substring(1).replace(',', '')).toBe(personInvestment.amount);
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

  it("should confirm personal investment from business", function (done) {
    this.done = done;
    let id;
    sql.test.association.add({pid: personData.pid, bid: bizData.bid})
      .then(res => {
        personInvestment.assoc_id = res.aid;
        personInvestment.claimed_by = personData.pid;
        return sql.test.investment.add(personInvestment)
      })
      .then(res => {
        id = res.id;
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`investment/${id}`),
          resolveWithFullResponse: true,
          jar: orgMan.rpJar,
        })
          .then(() => this.fail('permitted unauthorised user to confirm investment'))
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
          uri: lib.helpers.apiTestURL(`investment/${id}`),
          resolveWithFullResponse: true,
          jar: personData.rpJar,
        })
          .then(() => this.fail('permitted unauthorised user to confirm investment'))
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
          uri: lib.helpers.apiTestURL(`investment/${id}`),
          resolveWithFullResponse: true,
          jar: bizMan.rpJar,
        })
      )
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(+data).toBe(1);
        return sql.test.investment.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(null);
          expect(res[0].amount);
          if(res[0].amount) {
            expect(+res[0].amount.substring(1).replace(',', '')).toBe(personInvestment.amount);
          }
          expect(res[0].is_confirmed).toBe(true);
          expect(res[0].confirmed_by).toBe(bizMan.pid);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(personData.pid);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should add unconfirmed personal investment from person", function (done) {
    this.done = done;

    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`personalInvestment/${bizData.bid}/${personData.pid}`),
      body: personInvestment,
      json: true,
      resolveWithFullResponse: true,
      jar: personData.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBe(1);
        return sql.test.investment.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(null);
          expect(res[0].amount);
          if(res[0].amount) {
            expect(+res[0].amount.substring(1).replace(',', '')).toBe(personInvestment.amount);
          }
          expect(res[0].is_confirmed).toBe(false);
          expect(res[0].confirmed_by).toBe(null);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(personData.pid);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should confirm personal investment from person", function (done) {
    this.done = done;
    let id;
    sql.test.association.add({pid: personData.pid, bid: bizData.bid})
      .then(res => {
        personInvestment.assoc_id = res.aid;
        personInvestment.claimed_by = bizMan.pid;
        personInvestment.is_claimed_by_biz = true;
        return sql.test.investment.add(personInvestment)
      })
      .then(res => {
        id = res.id;
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`investment/${id}`),
          resolveWithFullResponse: true,
          jar: orgMan.rpJar,
        })
          .then(() => this.fail('permitted unauthorised user to confirm investment'))
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
          uri: lib.helpers.apiTestURL(`investment/${id}`),
          resolveWithFullResponse: true,
          jar: bizMan.rpJar,
        })
          .then(() => this.fail('permitted unauthorised user to confirm investment'))
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
          uri: lib.helpers.apiTestURL(`investment/${id}`),
          resolveWithFullResponse: true,
          jar: personData.rpJar,
        })
      )
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(+data).toBe(1);
        return sql.test.investment.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(null);
          expect(res[0].amount);
          if(res[0].amount) {
            expect(+res[0].amount.substring(1).replace(',', '')).toBe(personInvestment.amount);
          }
          expect(res[0].is_confirmed).toBe(true);
          expect(res[0].confirmed_by).toBe(personData.pid);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(true);
          expect(res[0].claimed_by).toBe(bizMan.pid);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should add unconfirmed organizational investment from business", function (done) {
    this.done = done;

    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`orgInvestment/${bizData.bid}/${orgData.oid}`),
      body: orgInvestment,
      json: true,
      resolveWithFullResponse: true,
      jar: bizMan.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBe(1);
        return sql.test.investment.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(orgData.oid);
          expect(res[0].pid).toBe(null);
          expect(res[0].amount);
          if(res[0].amount) {
            expect(+res[0].amount.substring(1).replace(',', '')).toBe(orgInvestment.amount);
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

  it("should confirm organizational investment from business", function (done) {
    this.done = done;
    let id;
    sql.test.association.add({oid: orgData.oid, bid: bizData.bid})
      .then(res => {
        orgInvestment.assoc_id = res.aid;
        orgInvestment.claimed_by = orgMan.pid;
        return sql.test.investment.add(orgInvestment)
      })
      .then(res => {
        id = res.id;
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`investment/${id}`),
          resolveWithFullResponse: true,
          jar: orgMan.rpJar,
        })
          .then(() => this.fail('permitted unauthorised org claimant to confirm investment'))
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
          uri: lib.helpers.apiTestURL(`investment/${id}`),
          resolveWithFullResponse: true,
          jar: personData.rpJar,
        })
          .then(() => this.fail('permitted unauthorised person to confirm investment'))
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
          uri: lib.helpers.apiTestURL(`investment/${id}`),
          resolveWithFullResponse: true,
          jar: bizMan.rpJar,
        })
      )
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(+data).toBe(1);
        return sql.test.investment.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(orgData.oid);
          expect(res[0].pid).toBe(null);
          expect(res[0].amount);
          if(res[0].amount) {
            expect(+res[0].amount.substring(1).replace(',', '')).toBe(orgInvestment.amount);
          }
          expect(res[0].is_confirmed).toBe(true);
          expect(res[0].confirmed_by).toBe(bizMan.pid);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(orgMan.pid);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should add unconfirmed organizational investment from organization", function (done) {
    this.done = done;

    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`orgInvestment/${bizData.bid}/${orgData.oid}`),
      body: orgInvestment,
      json: true,
      resolveWithFullResponse: true,
      jar: orgMan.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBe(1);
        return sql.test.investment.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(orgData.oid);
          expect(res[0].pid).toBe(null);
          expect(res[0].amount);
          if(res[0].amount) {
            expect(+res[0].amount.substring(1).replace(',', '')).toBe(orgInvestment.amount);
          }
          expect(res[0].is_confirmed).toBe(false);
          expect(res[0].confirmed_by).toBe(null);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(orgMan.pid);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should confirm organizational investment from organization", function (done) {
    this.done = done;
    let id;
    sql.test.association.add({oid: orgData.oid, bid: bizData.bid})
      .then(res => {
        orgInvestment.assoc_id = res.aid;
        orgInvestment.claimed_by = bizMan.pid;
        orgInvestment.is_claimed_by_biz = true;
        return sql.test.investment.add(orgInvestment)
      })
      .then(res => {
        id = res.id;
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`investment/${id}`),
          resolveWithFullResponse: true,
          jar: bizMan.rpJar,
        })
          .then(() => this.fail('permitted unauthorised org claimant to confirm investment'))
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
          uri: lib.helpers.apiTestURL(`investment/${id}`),
          resolveWithFullResponse: true,
          jar: personData.rpJar,
        })
          .then(() => this.fail('permitted unauthorised person to confirm investment'))
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
          uri: lib.helpers.apiTestURL(`investment/${id}`),
          resolveWithFullResponse: true,
          jar: orgMan.rpJar,
        })
      )
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(+data).toBe(1);
        return sql.test.investment.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(orgData.oid);
          expect(res[0].pid).toBe(null);
          expect(res[0].amount);
          if(res[0].amount) {
            expect(+res[0].amount.substring(1).replace(',', '')).toBe(orgInvestment.amount);
          }
          expect(res[0].is_confirmed).toBe(true);
          expect(res[0].confirmed_by).toBe(orgMan.pid);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(true);
          expect(res[0].claimed_by).toBe(bizMan.pid);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should add confirmed personal investment from admin", function (done) {
    this.done = done;

    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`personalInvestment/${bizData.bid}/${personData.pid}`),
      body: personInvestment,
      json: true,
      resolveWithFullResponse: true,
      jar: adminData.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBeTruthy();
        return sql.test.investment.getWithAssoc({id: data});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(null);
          expect(res[0].amount);
          if(res[0].amount) {
            expect(+res[0].amount.substring(1).replace(',', '')).toBe(personInvestment.amount);
          }
          expect(res[0].is_confirmed).toBe(true);
          expect(res[0].confirmed_by).toBe(adminData.pid);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(adminData.pid);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should add confirmed organizational investment from admin", function (done) {
    this.done = done;

    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`orgInvestment/${bizData.bid}/${orgData.oid}`),
      body: orgInvestment,
      json: true,
      resolveWithFullResponse: true,
      jar: adminData.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBe(1);
        return sql.test.investment.getWithAssoc({id: 1});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if(res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(orgData.oid);
          expect(res[0].pid).toBe(null);
          expect(res[0].amount);
          if(res[0].amount) {
            expect(+res[0].amount.substring(1).replace(',', '')).toBe(orgInvestment.amount);
          }
          expect(res[0].is_confirmed).toBe(true);
          expect(res[0].confirmed_by).toBe(adminData.pid);
          expect(moment().diff(res[0].saved_at,'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(adminData.pid);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});