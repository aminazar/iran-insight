const rp = require("request-promise");
const lib = require('../../../lib');
const sql = require('../../../sql');

describe("GET Consultancy API", () => {
  let bizData, personData, orgData, personConsultancy, orgConsultancy,cofirmedByPID;

  beforeEach(done => {
    bizData = {name: 'biz', name_fa: 'کسب و کار'};
    personData = {firstname_en: 'ali', surname_en: 'alavi', display_name_en: 'AA'};
    orgData = {name: 'org', name_fa: 'سازمان'};
    personConsultancy = {is_mentor: true, is_confirmed: true};
    personConsultancy_1 = {is_mentor: false, is_confirmed: false};
    orgConsultancy = {is_mentor: false, is_confirmed: true};
    orgConsultancy_1 = {is_mentor: false, is_confirmed: false};

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
        personConsultancy.assoc_id = personData.aid;
        personConsultancy.claimed_by = personData.pid;
        personConsultancy.confirmed_by = cofirmedByPID;
        return sql.test.consultancy.add(personConsultancy);
      })
      .then(res => {
        personData.consultancy_id = +res.id;
        personConsultancy_1.assoc_id = personData.aid;
        personConsultancy_1.claimed_by = personData.pid;
        return sql.test.consultancy.add(personConsultancy_1);
      })
      .then(res => {
        personData.consultancy_id_1 = +res.id;
        return sql.test.organization.add(orgData);
      })
      .then(res => {
        orgData.oid = +res.oid;
        return sql.test.association.add({oid: orgData.oid, bid: bizData.bid});
      })
      .then(res => {
        orgData.aid = +res.aid;
        orgConsultancy.assoc_id = orgData.aid;
        orgConsultancy.claimed_by = personData.pid;
        orgConsultancy.confirmed_by = cofirmedByPID;
        return sql.test.consultancy.add(orgConsultancy);
      })
      .then(res => {
        orgData.consultancy_id = +res.id;
        orgConsultancy_1.assoc_id = orgData.aid;
        orgConsultancy_1.claimed_by = personData.pid;
        return sql.test.consultancy.add(orgConsultancy_1);
      })
      .then(res => {
        orgData.consultancy_id_1 = +res.id;
        done();
      })
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it("should get list of consultancies in business by BID", function (done) {
    this.done = done;

    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`consultancy/business/${bizData.bid}`),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(2);
        let orgConsRes = data.find(r => r.oid);
        let personConsRes = data.find(r => r.pid);
        expect(orgConsRes).toBeTruthy();
        if (orgConsRes) {
          expect(orgConsRes.oid).toBe(orgData.oid);
          expect(orgConsRes.pid).toBe(null);
          expect(orgConsRes.id).toBe(orgData.consultancy_id);
          expect(orgConsRes.aid).toBe(orgData.aid);
          expect(orgConsRes.org_name).toBe(orgData.name);
          expect(orgConsRes.org_name_fa).toBe(orgData.name_fa);
          expect(orgConsRes.is_mentor).toBe(orgConsultancy.is_mentor);
        }
        expect(personConsRes).toBeTruthy();
        if (personConsRes) {
          expect(personConsRes.pid).toBe(personData.pid);
          expect(personConsRes.oid).toBe(null);
          expect(personConsRes.id).toBe(personData.consultancy_id);
          expect(personConsRes.aid).toBe(personData.aid);
          expect(personConsRes.person_firstname).toBe(personData.firstname_en);
          expect(personConsRes.person_surname).toBe(personData.surname_en);
          expect(personConsRes.is_mentor).toBe(personConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get list of person's consultancies by PID", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`consultancy/person/${personData.pid}`),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(1);
        if (data[0]) {
          expect(data[0].id).toBe(personData.consultancy_id);
          expect(data[0].assoc_id).toBe(personData.aid);
          expect(data[0].is_mentor).toBe(personConsultancy.is_mentor);
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

  it("should get list of organization's consultancies by OID", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`consultancy/organization/${orgData.oid}`),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(1);
        if (data[0]) {
          expect(data[0].id).toBe(orgData.consultancy_id);
          expect(data[0].assoc_id).toBe(orgData.aid);
          expect(data[0].is_mentor).toBe(orgConsultancy.is_mentor);
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

  it("should get list of consultancies (confirmed and not confirmed) by BID", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`consultancy/business/all/${bizData.bid}`),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(4);
        let orgConfRes = data.find(r => r.oid);
        let personConRes = data.find(r => r.pid);
        expect(orgConfRes).toBeTruthy();
        expect(personConRes).toBeTruthy();
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get list of consultancies (confirmed and not confirmed) by PID", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`consultancy/person/all/${personData.pid}`),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(2);
        expect(data.map(el => el.is_mentor)).toContain(false);
        expect(data.map(el => el.is_mentor)).toContain(true);
        expect(data.map(el => el.is_confirmed)).toContain(false);
        expect(data.map(el => el.is_confirmed)).toContain(true);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get list of consultancies (confirmed and not confirmed) by OID", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`consultancy/organization/all/${orgData.oid}`),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(2);
        expect(data.map(el => el.is_confirmed)).toContain(false);
        expect(data.map(el => el.is_confirmed)).toContain(true);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get specific consultancy", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`consultancy/${personData.consultancy_id}`),
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.is_mentor).toBe(true);
        expect(data.is_confirmed).toBe(true);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});