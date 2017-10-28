const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe('GET Joiners API', () => {
  let pid = 0, aliPid = 0, orgData, bizData,
    aminJar, moJar, adminJar, josePid;

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
        aliPid = res.pid;
        return lib.dbHelpers.addOrgPerson('hasan', orgData.oid, {is_active: true, is_representative:false, position: 'XYZ'})
      })
      .then(res => {
        hasanData = res.pid;
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
        josePid = res.pid;
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

  it('lists pending users for an org rep', function (done) {
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`joiners`),
      jar: aminJar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let body = JSON.parse(res.body);
        console.log(res.body);
        expect(body.biz).toBeDefined();
        expect(body.org).toBeDefined();
        expect(body.org.length).toBe(1);
        if(body.org[0]) {
          expect(body.org[0].name_en).toBe(orgData.name);
          expect(body.org[0].name_fa).toBe(orgData.name_fa);
          expect(body.org[0].oid).toBe(orgData.oid);
          expect(body.org[0].pending.length).toBe(2);
          if(body.org[0].pending[0]) {
            if(body.org[0].pending[0].surname_en === 'alis') {
              expect(body.org[0].pending[0].firstname_en).toBe('alif');
              expect(body.org[0].pending[0].membership_is_active).toBe(false);
              expect(body.org[0].pending[0].position_name).toBe('CEO');
              if(body.org[0].pending[1]) {
                expect(body.org[0].pending[1].surname_en).toBe('hasans');
                expect(body.org[0].pending[1].membership_is_active).toBe(true);
                expect(body.org[0].pending[1].position_name_fa).toBe('XYZ_fa');
              }
            } else {
              expect(body.org[0].pending[0].firstname_en).toBe('hasanf');
              expect(body.org[0].pending[0].membership_is_active).toBe(true);
              expect(body.org[0].pending[0].position_name).toBe('XYZ');
              if (body.org[0].pending[1]) {
                expect(body.org[0].pending[1].surname_en).toBe('alis');
                expect(body.org[0].pending[1].membership_is_active).toBe(false);
                expect(body.org[0].pending[0].position_name).toBe('CEO');
              }
            }
          }
        }
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });

  it('lists pending users for a biz rep', function (done) {
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`joiners`),
      jar: moJar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let body = JSON.parse(res.body);
        console.log(res.body);
        expect(body.biz).toBeDefined();
        expect(body.org).toBeDefined();
        expect(body.org.length).toBe(0);

        expect(body.biz.length).toBe(1);
        if(body.biz[0]) {
          expect(body.biz[0].name_en).toBe(bizData.name);
          expect(body.biz[0].name_fa).toBe(bizData.name_fa);
          expect(body.biz[0].oid).toBe(bizData.oid);
          expect(body.biz[0].pending.length).toBe(1);
          if(body.biz[0].pending[0]) {
            expect(body.biz[0].pending[0].firstname_en).toBe('josef');
            expect(body.biz[0].pending[0].membership_is_active).toBe(false);
            expect(body.biz[0].pending[0].position_name).toBe('WXYZ');
          }
        }
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });
});