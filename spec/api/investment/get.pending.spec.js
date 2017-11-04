const rp = require("request-promise");
const lib = require('../../../lib');
const sql = require('../../../sql');

describe("GET Investment API", () => {
  let bizData, personData, orgData, personInvestment, orgInvestment, bizMan, orgMan;

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

  it("should fetch list of investments in business for its rep", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`investment/pending/business`),
      jar: orgMan.rpJar,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(0);
        return rp({
          method: 'GET',
          uri: lib.helpers.apiTestURL(`investment/pending/business`),
          jar: personData.rpJar,
          resolveWithFullResponse: true
        })
          .then(res => {
            expect(res.statusCode).toBe(200);
            let data = JSON.parse(res.body);
            expect(data.length).toBe(0);
          })
      })
      .then(() =>
        rp({
          method: 'GET',
          uri: lib.helpers.apiTestURL(`investment/pending/business`),
          jar: bizMan.rpJar,
          resolveWithFullResponse: true
        })
      )
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(2);
        let orgInvRes = data.find(r => r.oid);
        let personInvRes = data.find(r => r.pid);
        expect(orgInvRes).toBeTruthy();
        if (orgInvRes) {
          expect(orgInvRes.oid).toBe(orgData.oid);
          expect(orgInvRes.pid).toBe(null);
          expect(orgInvRes.id).toBe(orgInvestment.id);
          expect(orgInvRes.aid).toBe(orgInvestment.assoc_id);
          expect(orgInvRes.org_name).toBe(orgData.name);
          expect(orgInvRes.org_name_fa).toBe(orgData.name_fa);
          expect(orgInvRes.is_lead).toBe(false);
          expect(+orgInvRes.amount.substring(1).replace(',', '')).toBe(orgInvestment.amount);
          expect(orgInvRes.currency).toBe(orgInvestment.currency);
          expect(orgInvRes.investment_cycle).toBe(orgInvestment.investment_cycle);
        }
        expect(personInvRes).toBeTruthy();
        if (personInvRes) {
          expect(personInvRes.pid).toBe(personData.pid);
          expect(personInvRes.oid).toBe(null);
          expect(personInvRes.id).toBe(personInvestment.id);
          expect(personInvRes.aid).toBe(personInvestment.assoc_id);
          expect(personInvRes.person_firstname).toBe('ali');
          expect(personInvRes.person_surname).toBe('alavi');
          expect(personInvRes.is_lead).toBe(true);
          expect(+personInvRes.amount.substring(1).replace(',', '')).toBe(personInvestment.amount);
          expect(personInvRes.currency).toBe(personInvestment.currency);
          expect(personInvRes.investment_cycle).toBe(personInvestment.investment_cycle);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should fetch list of person's investments", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`investment/pending/person`),
      jar: orgMan.rpJar,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(0);
        return rp({
          method: 'GET',
          uri: lib.helpers.apiTestURL(`investment/pending/person`),
          jar: bizMan.rpJar,
          resolveWithFullResponse: true
        })
          .then(res => {
            expect(res.statusCode).toBe(200);
            let data = JSON.parse(res.body);
            expect(data.length).toBe(0);
          })
      })
      .then(() =>
        rp({
          method: 'GET',
          uri: lib.helpers.apiTestURL(`investment/pending/person`),
          jar: personData.rpJar,
          resolveWithFullResponse: true
        }))
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(1);
        let personInvRes = data.find(r => r.pid);
        expect(personInvRes).toBeTruthy();
        if (personInvRes) {
          expect(personInvRes.pid).toBe(personData.pid);
          expect(personInvRes.oid).toBe(null);
          expect(personInvRes.id).toBe(personInvestment.id);
          expect(personInvRes.aid).toBe(personInvestment.assoc_id);
          expect(personInvRes.biz_name).toBe(bizData.name);
          expect(personInvRes.biz_name_fa).toBe(bizData.name_fa);
          expect(personInvRes.is_lead).toBe(true);
          expect(+personInvRes.amount.substring(1).replace(',', '')).toBe(personInvestment.amount);
          expect(personInvRes.currency).toBe(personInvestment.currency);
          expect(personInvRes.investment_cycle).toBe(personInvestment.investment_cycle);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get list of organization's investments", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`investment/pending/organization`),
      jar: personData.rpJar,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(0);
        return rp({
          method: 'GET',
          uri: lib.helpers.apiTestURL(`investment/pending/organization`),
          jar: bizMan.rpJar,
          resolveWithFullResponse: true
        })
          .then(res => {
            expect(res.statusCode).toBe(200);
            let data = JSON.parse(res.body);
            expect(data.length).toBe(0);
          })
      })
      .then(() =>
        rp({
          method: 'GET',
          uri: lib.helpers.apiTestURL(`investment/pending/organization`),
          jar: orgMan.rpJar,
          resolveWithFullResponse: true
        }))
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(1);
        let orgInvRes = data.find(r => r.oid);
        expect(orgInvRes).toBeTruthy();
        if (orgInvRes) {
          expect(orgInvRes.pid).toBe(null);
          expect(orgInvRes.oid).toBe(orgData.oid);
          expect(orgInvRes.id).toBe(orgInvestment.id);
          expect(orgInvRes.aid).toBe(orgInvestment.assoc_id);
          expect(orgInvRes.biz_name).toBe(bizData.name);
          expect(orgInvRes.biz_name_fa).toBe(bizData.name_fa);
          expect(orgInvRes.is_lead).toBe(orgInvRes.is_lead);
          expect(+orgInvRes.amount.substring(1).replace(',', '')).toBe(orgInvestment.amount);
          expect(orgInvRes.currency).toBe(orgInvestment.currency);
          expect(orgInvRes.investment_cycle).toBe(orgInvestment.investment_cycle);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
})
;