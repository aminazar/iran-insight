const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe('DELETE Joiner API', () => {
  let pid = 0, aliData = 0, orgData, bizData,
    aminJar, moJar, adminJar, joseData, ali2ndMid;

  beforeEach(function (done) {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('amin', '123456', {is_active: true, is_representative: true}))
      .then(res => {
        pid = res.pid;
        aminJar = res.rpJar;
        return lib.dbHelpers.addOrganizationWithRep(pid);
      })
      .then(res => {
        orgData = res;
        return lib.dbHelpers.addOrgPerson('ali', orgData.oid, {
          is_active: false,
          is_representative: false,
          position: 'CEO'
        })
      })
      .then(res => {
        aliData = res;
        return sql.test.membership.add({assoc_id: aliData.aid})
      })
      .then(res => {
        ali2ndMid = res.mid;
        return lib.dbHelpers.addOrgPerson('hasan', orgData.oid, {
          is_active: true,
          is_representative: false,
          position: 'XYZ'
        })
      })
      .then(res => {
        hasanData = {mid: res.mid, aid: res.aid};
        return lib.dbHelpers.addAndLoginPerson('mo', '654321')
      })
      .then(res => {
        moJar = res.rpJar;
        moPid = res.pid;
        return lib.dbHelpers.addBusinessWithRep(moPid);
      })
      .then(res => {
        bizData = res;
        return lib.dbHelpers.addBizPerson('jose', bizData.bid, {
          is_active: false,
          is_representative: false,
          position: 'WXYZ'
        })
      })
      .then(res => {
        joseData = res;
        return lib.dbHelpers.addAndLoginPerson('aDmIn', 'admin', {})
      })
      .then(res => {
        adminJar = res.rpJar;

        done();
      })
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it('errors on rejecting user from non-rep of biz', function (done) {
    sql.test.membership.get({mid: joseData.mid})
      .then(res => {
        expect(res[0].is_active).toBe(false);
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`joiner/${joseData.mid}/${joseData.aid}`),
          jar: aminJar,
          resolveWithFullResponse: true,
        })
      })
      .then(() => {
        this.fail('activates user with non-rep login')
      })
      .catch(err => {
        this.expect(err.statusCode).toBe(403);
        if (err.statusCode !== 403) {
          this.fail(lib.helpers.parseServerErrorToString(err))
        }
        done();
      });
  });

  it('errors on activating user from non-rep of org', function (done) {
    sql.test.membership.get({mid: aliData.mid})
      .then(res => {
        expect(res[0].is_active).toBe(false);
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`joiner/${aliData.mid}/${aliData.aid}`),
          jar: moJar,
          resolveWithFullResponse: true,
        })
      })
      .then(() => {
        this.fail('activates user with non-rep login')
      })
      .catch(err => {
        console.log(err);
        this.expect(err.statusCode).toBe(403);
        if (err.statusCode !== 403) {
          this.fail(lib.helpers.parseServerErrorToString(err))
        }
        done();
      });
  });

  it('errors on irrelevant association and membership IDs', function (done) {
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`joiner/${aliData.mid}/${joseData.aid}`),
      jar: aminJar,
      resolveWithFullResponse: true,
    })
    .then(() => {
      this.fail('activates user with non-rep login')
    })
    .catch(err => {
      console.log(err);
      this.expect(err.statusCode).toBe(500);
      if (err.statusCode !== 500) {
        this.fail(lib.helpers.parseServerErrorToString(err))
      }
      done();
    });
  });

  it('rejects users for an org rep', function (done) {
    sql.test.membership.get({mid: aliData.mid})
      .then(res => {
        expect(res[0].is_active).toBe(false);
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`joiner/${aliData.mid}/${aliData.aid}`),
          jar: aminJar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.get({mid: aliData.mid})
      })
      .then(res => {
        expect(res.length).toBe(0);
        return sql.test.association.get({aid: aliData.aid})

      })
      .then(res => {
        expect(res.length).toBe(1);
        done();
      })
      .catch(err => {
        console.log(err);
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });

  it('rejects user AND delete association for an org rep when there is no more membership', function (done) {
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`joiner/${aliData.mid}/${aliData.aid}`),
      jar: aminJar,
      resolveWithFullResponse: true,
    })
      .then(() => {
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`joiner/${ali2ndMid}/${aliData.aid}`),
          jar: aminJar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.get({mid: aliData.mid})
      })
      .then(res => {
        expect(res.length).toBe(0);
        return sql.test.association.get({aid: aliData.aid})

      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(err => {
        console.log(err);
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });
});