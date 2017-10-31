const rp = require("request-promise");
const lib = require('../../../lib');
const sql = require('../../../sql');
const moment = require('moment');

describe("PUT Investment API", () => {
  let bizData, personData, orgData, personInvestment, orgInvestment, bizMan, orgMan;

  beforeEach(done => {
    personInvestment = {
      amount: 1000,
      currency: 'USD',
      is_lead: true,
      investment_cycle: 1,
      is_confirmed: true,
      confirmed_by: 1
    };
    orgInvestment = {amount: 10000, currency: 'EUR', investment_cycle: 1, is_confirmed: true, confirmed_by: 1};

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
        personInvestment.assoc_id = res.aid;
        personInvestment.claimed_by = personData.pid;
        return sql.test.investment.add(personInvestment)
      })
      .then(res => {
        personInvestment.id = res.id;
        return sql.test.association.add({oid: orgData.oid, bid: bizData.bid})
      })
      .then(res => {
        orgInvestment.assoc_id = res.aid;
        orgInvestment.claimed_by = orgMan.pid;
        return sql.test.investment.add(orgInvestment)
      })
      .then(res => {
        orgInvestment.id = res.id;
        done();
      })
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it("should update personal investment from business", function (done) {
    this.done = done;
    personInvestment.investment_cycle = 100;
    personInvestment.amount = 2000;
    personInvestment.currency = 'EUR';

    rp({
      method: 'POST',
      uri: lib.helpers.apiTestURL(`personalInvestment/${personInvestment.id}/${bizData.bid}/${personData.pid}`),
      body: orgInvestment,
      json: true,
      resolveWithFullResponse: true,
      jar: orgMan.rpJar,
    })
      .then(() => this.fail('Permitted unauthorised person to modify investment'))
      .catch(err => {
        if (err.statusCode !== 403) {
          this.fail(lib.helpers.parseServerError(err));
        } else {
          expect(err.message).toContain('User is not representative of business');
        }
      })
      .then(() =>
        rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL(`personalInvestment/${personInvestment.id}/${bizData.bid}/${personData.pid}`),
          body: personInvestment,
          json: true,
          resolveWithFullResponse: true,
          jar: bizMan.rpJar,
        }))
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBeTruthy();
        return sql.test.investment.getWithAssoc({id: data});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if (res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(null);
          expect(res[0].amount);
          if (res[0].amount) {
            expect(+res[0].amount.substring(1).replace(',', '')).toBe(personInvestment.amount);
          }
          expect(res[0].is_confirmed).toBe(false);
          expect(moment().diff(res[0].saved_at, 'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(true);
          expect(res[0].claimed_by).toBe(bizMan.pid);
          expect(res[0].investment_cycle).toBe(personInvestment.investment_cycle);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should update personal investment from person", function (done) {
    this.done = done;
    personInvestment.investment_cycle = 100;
    personInvestment.amount = 2000;
    personInvestment.currency = 'EUR';


    rp({
      method: 'POST',
      uri: lib.helpers.apiTestURL(`personalInvestment/${personInvestment.id}/${bizData.bid}/${personData.pid}`),
      body: personInvestment,
      json: true,
      resolveWithFullResponse: true,
      jar: personData.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBeTruthy();
        return sql.test.investment.getWithAssoc({id: data});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if (res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(null);
          expect(res[0].amount);
          if (res[0].amount) {
            expect(+res[0].amount.substring(1).replace(',', '')).toBe(personInvestment.amount);
          }
          expect(res[0].is_confirmed).toBe(false);
          expect(moment().diff(res[0].saved_at, 'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(personData.pid);
          expect(res[0].investment_cycle).toBe(personInvestment.investment_cycle);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should update organizational investment from business", function (done) {
    this.done = done;
    orgInvestment.investment_cycle = 10;
    orgInvestment.amount = 20000;
    orgInvestment.currency = 'CHF';

    rp({
      method: 'POST',
      uri: lib.helpers.apiTestURL(`orgInvestment/${orgInvestment.id}/${bizData.bid}/${orgData.oid}`),
      body: orgInvestment,
      json: true,
      resolveWithFullResponse: true,
      jar: bizMan.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBeTruthy();
        return sql.test.investment.getWithAssoc({id: data});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if (res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(orgData.oid);
          expect(res[0].pid).toBe(null);
          expect(res[0].amount);
          if (res[0].amount) {
            expect(+res[0].amount.substring(1).replace(',', '')).toBe(orgInvestment.amount);
          }
          expect(res[0].is_confirmed).toBe(false);
          expect(moment().diff(res[0].saved_at, 'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(true);
          expect(res[0].claimed_by).toBe(bizMan.pid);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should update organizational investment from organization", function (done) {
    this.done = done;
    orgInvestment.investment_cycle = 10;
    orgInvestment.amount = 20000;
    orgInvestment.currency = 'CHF';
    rp({
      method: 'POST',
      uri: lib.helpers.apiTestURL(`orgInvestment/${orgInvestment.id}/${bizData.bid}/${orgData.oid}`),
      body: orgInvestment,
      json: true,
      resolveWithFullResponse: true,
      jar: personData.rpJar,
    })
      .then(() => this.fail('Permitted unauthorised person to modify investment'))
      .catch(err => {
        if (err.statusCode !== 403) {
          this.fail(lib.helpers.parseServerError(err));
        } else {
          expect(err.message).toContain('Representative of neither side of investment');
        }
      })
      .then(() =>
        rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL(`orgInvestment/${orgInvestment.id}/${bizData.bid}/${orgData.oid}`),
          body: orgInvestment,
          json: true,
          resolveWithFullResponse: true,
          jar: orgMan.rpJar,
        }))
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data).toBeTruthy();
        return sql.test.investment.getWithAssoc({id: data});
      })
      .then(res => {
        expect(res.length).toBe(1);
        if (res[0]) {
          expect(res[0].bid).toBe(bizData.bid);
          expect(res[0].oid).toBe(orgData.oid);
          expect(res[0].pid).toBe(null);
          expect(res[0].amount);
          if (res[0].amount) {
            expect(+res[0].amount.substring(1).replace(',', '')).toBe(orgInvestment.amount);
          }
          expect(res[0].is_confirmed).toBe(false);
          expect(moment().diff(res[0].saved_at, 'seconds')).toBeLessThan(5);
          expect(res[0].is_claimed_by_biz).toBe(false);
          expect(res[0].claimed_by).toBe(orgMan.pid);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});