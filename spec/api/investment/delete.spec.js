const rp = require("request-promise");
const lib = require('../../../lib');
const sql = require('../../../sql');

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

  it("should delete personal investment from business", function (done) {
    this.done = done;

    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`investment/${personInvestment.id}`),
      resolveWithFullResponse: true,
      jar: orgMan.rpJar,
    })
      .then(() => this.fail('Permitted unauthorised person to delete investment'))
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
          uri: lib.helpers.apiTestURL(`investment/${personInvestment.id}`),
          resolveWithFullResponse: true,
          jar: bizMan.rpJar,
        }))
      .then(res => {
        expect(res.statusCode).toBe(200);

        return sql.test.investment.getWithAssoc({id: personInvestment.id});
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should delete personal investment from person", function (done) {
    this.done = done;

    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`investment/${personInvestment.id}`),
      resolveWithFullResponse: true,
      jar: personData.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);

        return sql.test.investment.getWithAssoc({id: personInvestment.id});
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should delete organizational investment from business", function (done) {
    this.done = done;

    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`investment/${orgInvestment.id}`),
      resolveWithFullResponse: true,
      jar: personData.rpJar,
    })
      .then(() => this.fail('Permitted unauthorised person to delete investment'))
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
          uri: lib.helpers.apiTestURL(`investment/${orgInvestment.id}`),
          resolveWithFullResponse: true,
          jar: bizMan.rpJar,
        }))
      .then(res => {
        expect(res.statusCode).toBe(200);

        return sql.test.investment.getWithAssoc({id: orgInvestment.id});
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should delete organizational investment from organization", function (done) {
    this.done = done;

    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`investment/${orgInvestment.id}`),
      resolveWithFullResponse: true,
      jar: bizMan.rpJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);

        return sql.test.investment.getWithAssoc({id: orgInvestment.id});
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});