const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe('GET Event API', () => {
  let eid = 0, pid = 0, aliPid = 0, orgData,
    aminJar, moJar, adminJar;

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
        hasanPid = res.pid;
        return lib.dbHelpers.addAndLoginPerson('mo', '654321')
      })
      .then(res => {
        moJar = res.rpJar;
        moPid = res.pid;
        return lib.dbHelpers.addBusinessWithRep(moPid);
      })
      .then(res => {

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

  it('has an event API loading a single event with EID', function (done) {
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`event/${eid}`),
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let body = JSON.parse(res.body);
        expect(body.eid).toBe(eid);
        expect(body.organizer_pid).toBe(pid);
        expect(body.organizer_bid).toBeUndefined();
        expect(body.organizer_oid).toBeUndefined();
        expect(body.title).toBe(eventData.title);
        expect(body.title_fa).toBe(eventData.title_fa);
        expect(body.start_date).toBe(eventData.start_date);
        expect(body.attendance).toBeUndefined();
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });

  it('loads a single event with attendance data where applicable', function (done) {
    rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`event/${eid}`),
      resolveWithFullResponse: true,
      jar: aminJar,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let body = JSON.parse(res.body);
        expect(body.eid).toBe(eid);
        expect(body.organizer_pid).toBe(pid);
        expect(body.organizer_bid).toBeUndefined();
        expect(body.organizer_oid).toBeUndefined();
        expect(body.title).toBe(eventData.title);
        expect(body.title_fa).toBe(eventData.title_fa);
        expect(body.start_date).toBe(eventData.start_date);
        expect(body.attendance).toBeDefined();
        if(body.attendance) {
          expect(body.attendance.id).toBe(aid);
        }
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });
});