const rp = require("request-promise");
const lib = require('../../../lib');
const sql = require('../../../sql');

describe("GET Pending Consultancy API", () => {
  let bizData, personData, orgData, personConsultancy, orgConsultancy, bizMan, orgMan;

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
        done();
      })
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it("should fetch list of consultancies in business for its rep", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`consultancy/pending/business`),
      jar: orgMan.rpJar,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(0);
        return rp({
          method: 'GET',
          uri: lib.helpers.apiTestURL(`consultancy/pending/business`),
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
          uri: lib.helpers.apiTestURL(`consultancy/pending/business`),
          jar: bizMan.rpJar,
          resolveWithFullResponse: true
        })
      )
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
          expect(orgConsRes.id).toBe(orgConsultancy.id);
          expect(orgConsRes.aid).toBe(orgConsultancy.assoc_id);
          expect(orgConsRes.org_name).toBe(orgData.name);
          expect(orgConsRes.org_name_fa).toBe(orgData.name_fa);
          expect(orgConsRes.is_mentor).toBe(orgConsultancy.is_mentor);
        }
        expect(personConsRes).toBeTruthy();
        if (personConsRes) {
          expect(personConsRes.pid).toBe(personData.pid);
          expect(personConsRes.oid).toBe(null);
          expect(personConsRes.id).toBe(personConsultancy.id);
          expect(personConsRes.aid).toBe(personConsultancy.assoc_id);
          expect(personConsRes.person_firstname).toBe('ali');
          expect(personConsRes.person_surname).toBe('alavi');
          expect(personConsRes.is_mentor).toBe(personConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should fetch list of person's consultancies", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`consultancy/pending/person`),
      jar: orgMan.rpJar,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(0);
        return rp({
          method: 'GET',
          uri: lib.helpers.apiTestURL(`consultancy/pending/person`),
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
          uri: lib.helpers.apiTestURL(`consultancy/pending/person`),
          jar: personData.rpJar,
          resolveWithFullResponse: true
        }))
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(1);
        let personConsRes = data.find(r => r.pid);
        expect(personConsRes).toBeTruthy();
        if (personConsRes) {
          expect(personConsRes.pid).toBe(personData.pid);
          expect(personConsRes.oid).toBe(null);
          expect(personConsRes.id).toBe(personConsultancy.id);
          expect(personConsRes.aid).toBe(personConsultancy.assoc_id);
          expect(personConsRes.biz_name).toBe(bizData.name);
          expect(personConsRes.biz_name_fa).toBe(bizData.name_fa);
          expect(personConsRes.is_mentor).toBe(personConsultancy.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get list of organization's consultancies", function (done) {
    this.done = done;
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`consultancy/pending/organization`),
      jar: personData.rpJar,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(0);
        return rp({
          method: 'GET',
          uri: lib.helpers.apiTestURL(`consultancy/pending/organization`),
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
          uri: lib.helpers.apiTestURL(`consultancy/pending/organization`),
          jar: orgMan.rpJar,
          resolveWithFullResponse: true
        }))
      .then(res => {
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body);
        expect(data.length).toBe(1);
        let orgConsRes = data.find(r => r.oid);
        expect(orgConsRes).toBeTruthy();
        if (orgConsRes) {
          expect(orgConsRes.pid).toBe(null);
          expect(orgConsRes.oid).toBe(orgData.oid);
          expect(orgConsRes.id).toBe(orgConsultancy.id);
          expect(orgConsRes.aid).toBe(orgConsultancy.assoc_id);
          expect(orgConsRes.biz_name).toBe(bizData.name);
          expect(orgConsRes.biz_name_fa).toBe(bizData.name_fa);
          expect(orgConsRes.is_mentor).toBe(orgConsRes.is_mentor);
        }
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
})
;