const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe('PUT Joiner API', () => {
  let pid = 0, aliMid = 0, orgData, bizData,
    aminJar, moJar, adminJar, joseData, hasanData, moPid;

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
        return lib.dbHelpers.addOrgPerson('ali', orgData.oid, {is_active: false, is_representative:false, position: 'CEO'})
      })
      .then(res => {
        aliMid = res.mid;
        return lib.dbHelpers.addOrgPerson('hasan', orgData.oid, {is_active: true, is_representative:false, position: 'XYZ'})
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
        return lib.dbHelpers.addBizPerson('jose', bizData.bid, {is_active: false, is_representative:false, position: 'WXYZ'})
      })
      .then(res => {
        joseData = res;
        return lib.dbHelpers.addAndLoginPerson('aDmIn', 'admin', {})
      })
      .then(res => {
        adminJar = res.rpJar;
        return lib.dbHelpers.addAdmin(res.pid);
      })
      .then(res => done())
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it('errors on activating user from non-rep of biz', function (done) {
    sql.test.membership.get({mid:joseData.mid})
      .then(res => {
        expect(res[0].is_active).toBe(false);
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`joiner/${joseData.mid}`),
          jar: aminJar,
          resolveWithFullResponse: true,
        })
      })
      .then(() => {
        this.fail('activates user with non-rep login')
      })
      .catch(err => {
        this.expect(err.statusCode).toBe(403);
        if(err.statusCode !== 403) {
          this.fail(lib.helpers.parseServerErrorToString(err))
        }
        done();
      });
  });

  it('errors on activating user from non-rep of org', function (done) {
    sql.test.membership.get({mid:aliMid})
      .then(res => {
        expect(res[0].is_active).toBe(false);
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`joiner/${aliMid}`),
          jar: moJar,
          resolveWithFullResponse: true,
        })
      })
      .then(() => {
        this.fail('activates user with non-rep login')
      })
      .catch(err => {
        this.expect(err.statusCode).toBe(403);
        if(err.statusCode !== 403) {
          this.fail(lib.helpers.parseServerErrorToString(err))
        }
        done();
      });
  });

  it('activates users for an org rep', function (done) {
    sql.test.membership.get({mid:aliMid})
      .then(res => {
        expect(res[0].is_active).toBe(false);
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`joiner/${aliMid}`),
          jar: aminJar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        sql.test.membership.get({mid:aliMid})
          .then(res => {
            expect(res[0].is_active).toBe(true);
            done();
          });
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });
});