const rp = require("request-promise");
const lib = require('../../../lib');
const sql = require('../../../sql');

describe("GET Investment API", () => {
  let bizData, personData, orgData, personInvestment, orgInvestment,cofirmedByPID;

  beforeEach(done => {
    bizData = {name: 'biz', name_fa: 'کسب و کار'};
    personData = {firstname_en: 'ali', surname_en: 'alavi', display_name_en: 'Ali Alavi'};
    orgData = {name: 'org', name_fa: 'سازمان'};
    personInvestment = {amount: 1000, currency: 'USD', is_lead: true, investment_cycle: 1, is_confirmed: true};
    personInvestment_1 = {amount: 2000, currency: 'USD', is_lead: false, investment_cycle: 2, is_confirmed: false};
    orgInvestment = {amount: 10000, currency: 'EUR', investment_cycle: 1, is_confirmed: true};
    orgInvestment_1 = {amount: 20000, currency: 'EUR', investment_cycle: 2, is_confirmed: false};

    lib.dbHelpers.create()
      .then(() => {
        return sql.test.business.add(bizData);
      })
      .then(res => {
        bizData.bid = +res.bid;
        return lib.dbHelpers.addPerson('x', 'x', personData)
      })
      .then(res => {
        personData.pid = +res;
        return lib.dbHelpers.addPerson('y', 'y', personData)
      })
      .then(res => {
        cofirmedByPID = +res;
        return sql.test.association.add({pid: personData.pid, bid: bizData.bid});
      })
      .then(res => {
        personData.aid = +res.aid;
        personInvestment.assoc_id = personData.aid;
        personInvestment.claimed_by = personData.pid;
        personInvestment.confirmed_by = cofirmedByPID;
        return sql.test.investment.add(personInvestment);
      })
      .then(res => {
        personData.investment_id = +res.id;
        personInvestment_1.assoc_id = personData.aid;
        personInvestment_1.claimed_by = personData.pid;
        return sql.test.investment.add(personInvestment_1);
      })
      .then(res => {
        personData.investment_id_1 = +res.id;
        return sql.test.organization.add(orgData);
      })
      .then(res => {
        orgData.oid = +res.oid;
        return sql.test.association.add({oid: orgData.oid, bid: bizData.bid});
      })
      .then(res => {
        orgData.aid = +res.aid;
        orgInvestment.assoc_id = orgData.aid;
        orgInvestment.claimed_by = personData.pid;
        orgInvestment.confirmed_by = cofirmedByPID;
        return sql.test.investment.add(orgInvestment);
      })
      .then(res => {
        orgData.investment_id = +res.id;
        orgInvestment_1.assoc_id = orgData.aid;
        orgInvestment_1.claimed_by = personData.pid;
        return sql.test.investment.add(orgInvestment_1);
      })
      .then(res => {
        orgData.investment_id_1 = +res.id;
        done();
      })
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it("should get list of investments in business by BID", function (done) {
    this.done = done;

    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`investment/business/${bizData.bid}`),
      resolveWithFullResponse: true
    })
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
          expect(orgInvRes.id).toBe(orgData.investment_id);
          expect(orgInvRes.aid).toBe(orgData.aid);
          expect(orgInvRes.org_name).toBe(orgData.name);
          expect(orgInvRes.org_name_fa).toBe(orgData.name_fa);
          expect(orgInvRes.is_lead).toBe(false);
          expect(+orgInvRes.amount).toBe(orgInvestment.amount);
          expect(orgInvRes.currency).toBe(orgInvestment.currency);
          expect(orgInvRes.investment_cycle).toBe(orgInvestment.investment_cycle);
        }
        expect(personInvRes).toBeTruthy();
        if (personInvRes) {
          expect(personInvRes.pid).toBe(personData.pid);
          expect(personInvRes.oid).toBe(null);
          expect(personInvRes.id).toBe(personData.investment_id);
          expect(personInvRes.aid).toBe(personData.aid);
          expect(personInvRes.person_firstname).toBe(personData.firstname_en);
          expect(personInvRes.person_surname).toBe(personData.surname_en);
          expect(personInvRes.is_lead).toBe(true);
          expect(+personInvRes.amount).toBe(personInvestment.amount);
          expect(personInvRes.currency).toBe(personInvestment.currency);
          expect(personInvRes.investment_cycle).toBe(personInvestment.investment_cycle);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get list of person's investments by PID", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`investment/person/${personData.pid}`),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(1);
        if (data[0]) {
          expect(data[0].id).toBe(personData.investment_id);
          expect(data[0].assoc_id).toBe(personData.aid);
          expect(+data[0].amount).toBe(personInvestment.amount);
          expect(data[0].currency).toBe(personInvestment.currency);
          expect(data[0].pid).toBe(personData.pid);
          expect(data[0].bid).toBe(bizData.bid);
          expect(data[0].oid).toBe(null);
          expect(data[0].biz_name).toBe(bizData.name);
          expect(data[0].biz_name_fa).toBe(bizData.name_fa);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get list of organization's investments by OID", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`investment/organization/${orgData.oid}`),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(1);
        if (data[0]) {
          expect(data[0].id).toBe(orgData.investment_id);
          expect(data[0].assoc_id).toBe(orgData.aid);
          expect(+data[0].amount).toBe(orgInvestment.amount);
          expect(data[0].currency).toBe(orgInvestment.currency);
          expect(data[0].oid).toBe(orgData.oid);
          expect(data[0].bid).toBe(bizData.bid);
          expect(data[0].pid).toBe(null);
          expect(data[0].biz_name).toBe(bizData.name);
          expect(data[0].biz_name_fa).toBe(bizData.name_fa);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get list of investments (confirmed and not confirmed) by BID", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`investment/business/all/${bizData.bid}`),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(4);
        let orgInvRes = data.find(r => r.oid);
        let personInvRes = data.find(r => r.pid);
        expect(orgInvRes).toBeTruthy();
        expect(personInvRes).toBeTruthy();
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get list of investments (confirmed and not confirmed) by PID", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`investment/person/all/${personData.pid}`),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(2);
        expect(data.map(el => el.amount)).toContain(2000);
        expect(data.map(el => el.is_confirmed)).toContain(false);
        expect(data.map(el => el.is_confirmed)).toContain(true);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get list of investments (confirmed and not confirmed) by OID", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`investment/organization/all/${orgData.oid}`),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(2);
        expect(data.map(el => el.amount)).toContain(20000);
        expect(data.map(el => el.is_confirmed)).toContain(false);
        expect(data.map(el => el.is_confirmed)).toContain(true);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get specific investment", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`investment/${personData.investment_id}`),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.amount).toBe(1000);
        expect(data.currency).toBe('USD');
        expect(data.is_lead).toBe(true);
        expect(data.investment_cycle).toBe(1);
        expect(data.is_confirmed).toBe(true);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});